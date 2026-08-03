import { Router, Request, Response } from "express";
import { Prisma, ProjectStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function normalizeBOQData(body: Record<string, unknown>, existing?: {
  quantity: number;
  unitRate: number;
  materialCost: number;
  laborCost: number;
}) {
  const quantity = body.quantity !== undefined ? Number(body.quantity || 0) : existing?.quantity ?? 0;
  const unitRate = body.unitRate !== undefined ? Number(body.unitRate || 0) : existing?.unitRate ?? 0;
  const materialCost = body.materialCost !== undefined ? Number(body.materialCost || 0) : existing?.materialCost ?? 0;
  const laborCost = body.laborCost !== undefined ? Number(body.laborCost || 0) : existing?.laborCost ?? 0;

  return {
    ...body,
    quantity,
    unitRate,
    materialCost,
    laborCost,
    totalCost: quantity * unitRate + materialCost + laborCost,
  };
}

function normalizeQuotationItems(items: Array<Record<string, unknown>> = []) {
  return items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitRate = Number(item.unitRate || 0);
    return { ...item, quantity, unitRate, totalAmount: quantity * unitRate };
  });
}

// GET /api/projects
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const projectStatus = typeof status === "string" ? status as ProjectStatus : undefined;

    const where: Prisma.ProjectWhereInput = projectStatus ? { status: projectStatus } : {};
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({ success: true, data: projects, total, page: parseInt(page as string) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/:id
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boqItems: true,
        tasks: { include: { assignedTo: { select: { name: true } } } },
        progressLogs: { orderBy: { logDate: "desc" }, take: 10 },
        contractorAssigns: { include: { contractor: true } },
        workerAssigns: { include: { worker: true } },
        installments: true,
        projectExpenses: true,
      },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const totalIncome = project.installments.reduce((a, i) => a + i.paid, 0);
    const totalExpense = project.projectExpenses.reduce((a, e) => a + e.amount, 0);

    res.json({ success: true, data: { ...project, totalIncome, totalExpense, profit: totalIncome - totalExpense } });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json({ success: true, data: project });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/projects/:id
router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const project = await prisma.project.update({ where: { id: projectId }, data: req.body });
    res.json({ success: true, data: project });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    await prisma.$transaction(async (tx) => {
      const [vouchers, purchaseOrders, grns, assets, installments, quotations] = await Promise.all([
        tx.voucher.findMany({ where: { projectId }, select: { id: true } }),
        tx.purchaseOrder.findMany({ where: { projectId }, select: { id: true } }),
        tx.gRN.findMany({ where: { po: { projectId } }, select: { id: true } }),
        tx.assetItem.findMany({ where: { projectId }, select: { id: true } }),
        tx.installment.findMany({ where: { projectId }, select: { id: true } }),
        tx.quotation.findMany({ where: { projectId }, select: { id: true } }),
      ]);

      const voucherIds = vouchers.map((item) => item.id);
      const purchaseOrderIds = purchaseOrders.map((item) => item.id);
      const grnIds = grns.map((item) => item.id);
      const assetIds = assets.map((item) => item.id);
      const installmentIds = installments.map((item) => item.id);
      const quotationIds = quotations.map((item) => item.id);

      await tx.ledgerEntry.deleteMany({
        where: { OR: [{ projectId }, { voucherId: { in: voucherIds } }] },
      });
      await tx.voucher.deleteMany({ where: { id: { in: voucherIds } } });

      await tx.installmentSchedule.deleteMany({ where: { installmentId: { in: installmentIds } } });
      await tx.installment.deleteMany({ where: { projectId } });

      await tx.requisitionItem.deleteMany({ where: { requisition: { projectId } } });
      await tx.materialRequisition.deleteMany({ where: { projectId } });

      await tx.gRNItem.deleteMany({ where: { grnId: { in: grnIds } } });
      await tx.gRN.deleteMany({ where: { id: { in: grnIds } } });
      await tx.bill.deleteMany({ where: { OR: [{ projectId }, { poId: { in: purchaseOrderIds } }] } });
      await tx.purchaseOrderItem.deleteMany({ where: { poId: { in: purchaseOrderIds } } });
      await tx.purchaseOrder.deleteMany({ where: { projectId } });
      await tx.rFQ.deleteMany({ where: { projectId } });

      await tx.billingRecord.deleteMany({ where: { projectId } });
      await tx.workOrder.deleteMany({ where: { projectId } });
      await tx.quotationItem.deleteMany({ where: { quotationId: { in: quotationIds } } });
      await tx.quotation.deleteMany({ where: { projectId } });

      await tx.assetMaintenanceLog.deleteMany({ where: { assetId: { in: assetIds } } });
      await tx.assetItem.deleteMany({ where: { projectId } });

      await tx.propertySale.deleteMany({ where: { projectId } });
      await tx.propertyBooking.deleteMany({ where: { projectId } });
      await tx.propertyUnit.deleteMany({ where: { projectId } });
      await tx.propertyBlock.deleteMany({ where: { projectId } });
      await tx.propertyRoad.deleteMany({ where: { projectId } });

      await tx.bOQItem.deleteMany({ where: { projectId } });
      await tx.task.deleteMany({ where: { projectId } });
      await tx.progressLog.deleteMany({ where: { projectId } });
      await tx.ganttTask.deleteMany({ where: { projectId } });
      await tx.contractorAssignment.deleteMany({ where: { projectId } });
      await tx.workerAssignment.deleteMany({ where: { projectId } });
      await tx.projectExpense.deleteMany({ where: { projectId } });
      await tx.projectInvestment.deleteMany({ where: { projectId } });
      await tx.shareAssignment.deleteMany({ where: { projectId } });
      await tx.shareProjectConfig.deleteMany({ where: { projectId } });
      await tx.projectDocument.deleteMany({ where: { projectId } });
      await tx.projectSite.deleteMany({ where: { projectId } });

      await tx.project.delete({ where: { id: projectId } });
    });
    res.json({ success: true, message: "Project deleted" });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/projects/:id/boq
router.get("/:id/boq", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const items = await prisma.bOQItem.findMany({ where: { projectId } });
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects/:id/boq
router.post("/:id/boq", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const item = await prisma.bOQItem.create({
      data: { ...normalizeBOQData(req.body), projectId } as Prisma.BOQItemUncheckedCreateInput,
    });
    res.status(201).json({ success: true, data: item });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/:id/tasks
router.get("/:id/tasks", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: tasks });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/:id/progress
router.get("/:id/progress", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const logs = await prisma.progressLog.findMany({
      where: { projectId },
      orderBy: { logDate: "desc" },
    });
    res.json({ success: true, data: logs });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects/:id/progress
router.post("/:id/progress", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const log = await prisma.progressLog.create({ data: { ...req.body, projectId } });
    res.status(201).json({ success: true, data: log });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/projects/boq/:itemId
router.put("/boq/:itemId", authenticate, async (req: Request, res: Response) => {
  try {
    const itemId = req.params.itemId as string;
    const existing = await prisma.bOQItem.findUnique({ where: { id: itemId } });
    if (!existing) return res.status(404).json({ error: "BOQ item not found" });

    const item = await prisma.bOQItem.update({ where: { id: itemId }, data: normalizeBOQData(req.body, existing) });
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/:id/progress/:logId
router.delete("/:id/progress/:logId", authenticate, async (req: Request, res: Response) => {
  try {
    const logId = req.params.logId as string;
    await prisma.progressLog.delete({ where: { id: logId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/boq/:itemId
router.delete("/boq/:itemId", authenticate, async (req: Request, res: Response) => {
  try {
    const itemId = req.params.itemId as string;
    await prisma.bOQItem.delete({ where: { id: itemId } });
    res.json({ success: true, message: "BOQ item deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects/:id/tasks
router.post("/:id/tasks", authenticate, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const task = await prisma.task.create({ data: { ...req.body, projectId } });
    res.status(201).json({ success: true, data: task });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PATCH /api/projects/:id/tasks/:taskId
router.patch("/:id/tasks/:taskId", authenticate, async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const task = await prisma.task.update({ where: { id: taskId }, data: req.body });
    res.json({ success: true, data: task });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete("/:id/tasks/:taskId", authenticate, async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    await prisma.task.delete({ where: { id: taskId } });
    res.json({ success: true, message: "Task deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/projects/quotations/:id
router.put("/quotations/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const quotationId = req.params.id as string;
    const quotation = await prisma.quotation.update({ where: { id: quotationId }, data: req.body });
    res.json({ success: true, data: quotation });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/quotations/:id
router.delete("/quotations/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const quotationId = req.params.id as string;
    await prisma.$transaction([
      prisma.quotationItem.deleteMany({ where: { quotationId } }),
      prisma.quotation.delete({ where: { id: quotationId } }),
    ]);
    res.json({ success: true, message: "Quotation deleted" });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/projects/quotations
router.get("/quotations/all", authenticate, async (_req: Request, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { project: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: quotations });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects/quotations
router.post("/quotations", authenticate, async (_req: Request, res: Response) => {
  try {
    const quotationNo = `QT-${Date.now()}`;
    const { items, ...rest } = _req.body;
    const quotation = await prisma.quotation.create({
      data: { ...rest, quotationNo, items: items ? { create: normalizeQuotationItems(items) } : undefined },
      include: { items: true },
    });
    res.status(201).json({ success: true, data: quotation });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/projects/work-orders
router.get("/work-orders/all", authenticate, async (_req: Request, res: Response) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        project: { select: { name: true } },
        contractor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: workOrders });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects/work-orders
router.post("/work-orders", authenticate, async (req: Request, res: Response) => {
  try {
    const workOrderNo = `WO-${Date.now()}`;
    const workOrder = await prisma.workOrder.create({
      data: {
        ...req.body,
        workOrderNo,
        amount: Number(req.body.amount || 0),
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      },
    });
    res.status(201).json({ success: true, data: workOrder });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/projects/work-orders/:id
router.put("/work-orders/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const workOrder = await prisma.workOrder.update({
      where: { id: req.params.id as string },
      data: {
        ...req.body,
        amount: Number(req.body.amount || 0),
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      },
    });
    res.json({ success: true, data: workOrder });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/work-orders/:id
router.delete("/work-orders/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const workOrderId = req.params.id as string;
    await prisma.$transaction([
      prisma.billingRecord.updateMany({ where: { workOrderId }, data: { workOrderId: null } }),
      prisma.workOrder.delete({ where: { id: workOrderId } }),
    ]);
    res.json({ success: true, message: "Work order deleted" });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
