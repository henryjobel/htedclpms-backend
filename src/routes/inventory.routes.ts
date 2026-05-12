import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

async function getEligibleApprovalRoles(module: string, amount: number) {
  const layers = await prisma.approvalLayer.findMany({
    where: { module, isActive: true },
    orderBy: { level: "asc" },
  });

  return layers
    .filter((layer) => {
      const minOk = layer.minAmount == null || amount >= layer.minAmount;
      const maxOk = layer.maxAmount == null || amount <= layer.maxAmount;
      return minOk && maxOk;
    })
    .map((layer) => layer.roleName);
}

async function logApprovalAction(params: {
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  actedById?: string;
  amount?: number;
  remarks?: string;
}) {
  await prisma.approvalLog.create({ data: params });
}

// GET /api/inventory/products
router.get("/products", authenticate, async (req: Request, res: Response) => {
  try {
    const { category, lowStock } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      include: { supplier: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const data = lowStock === "true"
      ? products.filter((p) => p.stock < p.minStock)
      : products;

    res.json({ success: true, data, total: data.length });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/products
router.post("/products", authenticate, async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ success: true, data: product });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/inventory/products/:id
router.put("/products/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const productId = req.params.id as string;
    const product = await prisma.product.update({ where: { id: productId }, data: req.body });
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/products/:id/adjustment
router.post("/products/:id/adjustment", authenticate, async (req: Request, res: Response) => {
  try {
    const { type, quantity, reason, adjustedBy } = req.body;
    const productId = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const newStock = type === "add" ? product.stock + quantity : product.stock - quantity;
    if (newStock < 0) return res.status(400).json({ error: "Insufficient stock" });

    await Promise.all([
      prisma.product.update({ where: { id: productId }, data: { stock: newStock } }),
      prisma.stockAdjustment.create({ data: { productId, type, quantity, reason, adjustedBy } }),
    ]);

    res.json({ success: true, message: "Stock adjusted", newStock });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/inventory/products/:id
router.delete("/products/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const productId = req.params.id as string;
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    res.json({ success: true, message: "Product deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/suppliers
router.get("/suppliers", authenticate, async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
    res.json({ success: true, data: suppliers });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/suppliers
router.post("/suppliers", authenticate, async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.status(201).json({ success: true, data: supplier });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/requisitions
router.get("/requisitions", authenticate, async (req: Request, res: Response) => {
  try {
    const { status, projectId } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const requisitions = await prisma.materialRequisition.findMany({
      where,
      include: {
        project: { select: { name: true } },
        items: { include: { product: { select: { name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: requisitions });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/requisitions
router.post("/requisitions", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, requestedBy, requiredDate, priority, remarks, items } = req.body;
    const requisition = await prisma.materialRequisition.create({
      data: {
        projectId,
        requestedBy,
        requiredDate: new Date(requiredDate),
        priority,
        remarks,
        items: { create: items },
      },
      include: { items: true },
    });
    res.status(201).json({ success: true, data: requisition });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/inventory/requisitions/:id/status
router.patch("/requisitions/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const requisitionId = req.params.id as string;
    const existingRequisition = await prisma.materialRequisition.findUnique({
      where: { id: requisitionId },
      include: { items: true },
    });
    if (!existingRequisition) return res.status(404).json({ error: "Requisition not found" });

    if (status === "APPROVED") {
      const totalQty = existingRequisition.items.reduce((sum, item) => sum + item.quantity, 0);
      const eligibleRoles = await getEligibleApprovalRoles("PURCHASE", totalQty);
      if (eligibleRoles.length > 0 && !eligibleRoles.includes(req.user!.role)) {
        return res.status(403).json({ error: "Your role is not allowed to approve this requisition" });
      }
    }

    const requisition = await prisma.materialRequisition.update({
      where: { id: requisitionId },
      data: { status },
    });

    await logApprovalAction({
      module: "PURCHASE",
      entityType: "MaterialRequisition",
      entityId: requisition.id,
      action: status === "APPROVED" ? "APPROVE" : "STATUS_CHANGE",
      status,
      actedById: req.user!.id,
      amount: existingRequisition.items.reduce((sum, item) => sum + item.quantity, 0),
      remarks: req.body.remarks,
    });
    res.json({ success: true, data: requisition });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/inventory/requisitions/:id
router.delete("/requisitions/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.materialRequisition.delete({ where: { id } });
    res.json({ success: true, message: "Requisition deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/rfqs
router.get("/rfqs", authenticate, async (_req: Request, res: Response) => {
  try {
    const rfqs = await prisma.rFQ.findMany({
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rfqs });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/rfqs
router.post("/rfqs", authenticate, async (req: Request, res: Response) => {
  try {
    const rfq = await prisma.rFQ.create({ data: req.body });
    res.status(201).json({ success: true, data: rfq });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/inventory/rfqs/:id
router.put("/rfqs/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const rfq = await prisma.rFQ.update({
      where: { id: req.params.id as string },
      data: {
        ...req.body,
        quotedAmount: req.body.quotedAmount !== undefined ? Number(req.body.quotedAmount) : undefined,
        deliveryDays: req.body.deliveryDays !== undefined ? Number(req.body.deliveryDays) : undefined,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      },
    });
    res.json({ success: true, data: rfq });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/rfqs/comparison
router.get("/rfqs/comparison", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: [{ projectId: "asc" }, { quotedAmount: "asc" }],
    });

    const grouped: Record<string, unknown[]> = {};
    rfqs.forEach((rfq) => {
      const key = rfq.project?.name ?? "General";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(rfq);
    });

    res.json({ success: true, data: { rows: rfqs, grouped } });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/inventory/rfqs/:id/select
router.patch("/rfqs/:id/select", authenticate, async (req: Request, res: Response) => {
  try {
    const rfq = await prisma.rFQ.findUnique({ where: { id: req.params.id as string } });
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });

    if (rfq.projectId) {
      await prisma.rFQ.updateMany({
        where: { projectId: rfq.projectId },
        data: { isSelected: false },
      });
    }

    const updated = await prisma.rFQ.update({
      where: { id: rfq.id },
      data: { isSelected: true, status: "APPROVED" },
    });

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/inventory/rfqs/:id
router.delete("/rfqs/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.rFQ.delete({ where: { id } });
    res.json({ success: true, message: "RFQ deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/purchase-orders
router.get("/purchase-orders", authenticate, async (_req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: pos });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/purchase-orders
router.post("/purchase-orders", authenticate, async (req: Request, res: Response) => {
  try {
    const { supplierId, projectId, rfqId, items, deliveryDate, remarks } = req.body;
    const totalAmount = items.reduce((a: number, i: { totalAmount: number }) => a + i.totalAmount, 0);
    const poNumber = `PO-${Date.now()}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        projectId,
        rfqId,
        status: "DRAFT",
        totalAmount,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        remarks,
        items: { create: items },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: po });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/inventory/purchase-orders/:id/status
router.patch("/purchase-orders/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const id = req.params.id as string;
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return res.status(404).json({ error: "Purchase order not found" });

    if (status === "CONFIRMED") {
      const eligibleRoles = await getEligibleApprovalRoles("PURCHASE", po.totalAmount);
      if (eligibleRoles.length > 0 && !eligibleRoles.includes(req.user!.role)) {
        return res.status(403).json({ error: "Your role is not allowed to approve this purchase order" });
      }
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });

    await logApprovalAction({
      module: "PURCHASE",
      entityType: "PurchaseOrder",
      entityId: updated.id,
      action: status === "CONFIRMED" ? "APPROVE" : "STATUS_CHANGE",
      status,
      actedById: req.user!.id,
      amount: updated.totalAmount,
      remarks: req.body.remarks,
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/inventory/purchase-orders/:id
router.delete("/purchase-orders/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.purchaseOrder.delete({ where: { id } });
    res.json({ success: true, message: "Purchase order deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/grns
router.get("/grns", authenticate, async (_req: Request, res: Response) => {
  try {
    const grns = await prisma.gRN.findMany({
      include: {
        po: { include: { supplier: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: grns });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/inventory/grns
router.post("/grns", authenticate, async (req: Request, res: Response) => {
  try {
    const { poId, receivedBy, items, remarks } = req.body;
    const grnNumber = `GRN-${Date.now()}`;

    const grn = await prisma.gRN.create({
      data: {
        grnNumber,
        poId,
        receivedBy,
        remarks,
        items: { create: items },
      },
    });

    // Update stock for each received product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.acceptedQty } },
      });
    }

    await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "RECEIVED" } });

    res.status(201).json({ success: true, data: grn });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/adjustments
router.get("/adjustments", authenticate, async (_req: Request, res: Response) => {
  try {
    const adjustments = await prisma.stockAdjustment.findMany({
      include: { product: { select: { name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ success: true, data: adjustments });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/inventory/adjustments/:id
router.delete("/adjustments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.stockAdjustment.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/inventory/grns/:id
router.delete("/grns/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.gRN.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
