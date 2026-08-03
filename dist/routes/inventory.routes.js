"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
async function getEligibleApprovalRoles(module, amount) {
    const layers = await prisma_1.prisma.approvalLayer.findMany({
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
async function logApprovalAction(params) {
    await prisma_1.prisma.approvalLog.create({ data: params });
}
// GET /api/inventory/products
router.get("/products", auth_1.authenticate, async (req, res) => {
    try {
        const { category, lowStock } = req.query;
        const where = { isActive: true };
        if (category)
            where.category = category;
        const products = await prisma_1.prisma.product.findMany({
            where,
            include: { supplier: { select: { name: true } } },
            orderBy: { name: "asc" },
        });
        const data = lowStock === "true"
            ? products.filter((p) => p.stock < p.minStock)
            : products;
        res.json({ success: true, data, total: data.length });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/products
router.post("/products", auth_1.authenticate, async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.create({ data: req.body });
        res.status(201).json({ success: true, data: product });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/inventory/products/:id
router.put("/products/:id", auth_1.authenticate, async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await prisma_1.prisma.product.update({ where: { id: productId }, data: req.body });
        res.json({ success: true, data: product });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/products/:id/adjustment
router.post("/products/:id/adjustment", auth_1.authenticate, async (req, res) => {
    try {
        const { type, quantity, reason, adjustedBy } = req.body;
        const productId = req.params.id;
        const adjustmentQty = Number(quantity || 0);
        if (adjustmentQty <= 0)
            return res.status(400).json({ error: "Quantity must be greater than zero" });
        const product = await prisma_1.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            return res.status(404).json({ error: "Product not found" });
        const newStock = type === "add" ? product.stock + adjustmentQty : product.stock - adjustmentQty;
        if (newStock < 0)
            return res.status(400).json({ error: "Insufficient stock" });
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.product.update({ where: { id: productId }, data: { stock: newStock } }),
            prisma_1.prisma.stockAdjustment.create({ data: { productId, type, quantity: adjustmentQty, reason, adjustedBy } }),
        ]);
        res.json({ success: true, message: "Stock adjusted", newStock });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/inventory/products/:id
router.delete("/products/:id", auth_1.authenticate, async (req, res) => {
    try {
        const productId = req.params.id;
        await prisma_1.prisma.product.update({ where: { id: productId }, data: { isActive: false } });
        res.json({ success: true, message: "Product deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/inventory/suppliers
router.get("/suppliers", auth_1.authenticate, async (_req, res) => {
    try {
        const suppliers = await prisma_1.prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
        res.json({ success: true, data: suppliers });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/suppliers
router.post("/suppliers", auth_1.authenticate, async (req, res) => {
    try {
        const supplier = await prisma_1.prisma.supplier.create({ data: req.body });
        res.status(201).json({ success: true, data: supplier });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/inventory/requisitions
router.get("/requisitions", auth_1.authenticate, async (req, res) => {
    try {
        const { status, projectId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (projectId)
            where.projectId = projectId;
        const requisitions = await prisma_1.prisma.materialRequisition.findMany({
            where,
            include: {
                project: { select: { name: true } },
                items: { include: { product: { select: { name: true, unit: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: requisitions });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/requisitions
router.post("/requisitions", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId, requestedBy, requiredDate, priority, remarks, items } = req.body;
        const requisition = await prisma_1.prisma.materialRequisition.create({
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
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PATCH /api/inventory/requisitions/:id/status
router.patch("/requisitions/:id/status", auth_1.authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const requisitionId = req.params.id;
        const existingRequisition = await prisma_1.prisma.materialRequisition.findUnique({
            where: { id: requisitionId },
            include: { items: true },
        });
        if (!existingRequisition)
            return res.status(404).json({ error: "Requisition not found" });
        if (status === "APPROVED") {
            const totalQty = existingRequisition.items.reduce((sum, item) => sum + item.quantity, 0);
            const eligibleRoles = await getEligibleApprovalRoles("PURCHASE", totalQty);
            if (eligibleRoles.length > 0 && !eligibleRoles.includes(req.user.role)) {
                return res.status(403).json({ error: "Your role is not allowed to approve this requisition" });
            }
        }
        const requisition = await prisma_1.prisma.materialRequisition.update({
            where: { id: requisitionId },
            data: { status },
        });
        await logApprovalAction({
            module: "PURCHASE",
            entityType: "MaterialRequisition",
            entityId: requisition.id,
            action: status === "APPROVED" ? "APPROVE" : "STATUS_CHANGE",
            status,
            actedById: req.user.id,
            amount: existingRequisition.items.reduce((sum, item) => sum + item.quantity, 0),
            remarks: req.body.remarks,
        });
        res.json({ success: true, data: requisition });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/inventory/requisitions/:id
router.delete("/requisitions/:id", auth_1.authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.requisitionItem.deleteMany({ where: { requisitionId: id } }),
            prisma_1.prisma.materialRequisition.delete({ where: { id } }),
        ]);
        res.json({ success: true, message: "Requisition deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/inventory/rfqs
router.get("/rfqs", auth_1.authenticate, async (_req, res) => {
    try {
        const rfqs = await prisma_1.prisma.rFQ.findMany({
            include: {
                supplier: { select: { name: true } },
                project: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: rfqs });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/rfqs
router.post("/rfqs", auth_1.authenticate, async (req, res) => {
    try {
        const rfq = await prisma_1.prisma.rFQ.create({ data: req.body });
        res.status(201).json({ success: true, data: rfq });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PUT /api/inventory/rfqs/:id
router.put("/rfqs/:id", auth_1.authenticate, async (req, res) => {
    try {
        const rfq = await prisma_1.prisma.rFQ.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                quotedAmount: req.body.quotedAmount !== undefined ? Number(req.body.quotedAmount) : undefined,
                deliveryDays: req.body.deliveryDays !== undefined ? Number(req.body.deliveryDays) : undefined,
                deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
            },
        });
        res.json({ success: true, data: rfq });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/inventory/rfqs/comparison
router.get("/rfqs/comparison", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        const rfqs = await prisma_1.prisma.rFQ.findMany({
            where,
            include: {
                supplier: { select: { name: true } },
                project: { select: { name: true } },
            },
            orderBy: [{ projectId: "asc" }, { quotedAmount: "asc" }],
        });
        const grouped = {};
        rfqs.forEach((rfq) => {
            const key = rfq.project?.name ?? "General";
            if (!grouped[key])
                grouped[key] = [];
            grouped[key].push(rfq);
        });
        res.json({ success: true, data: { rows: rfqs, grouped } });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PATCH /api/inventory/rfqs/:id/select
router.patch("/rfqs/:id/select", auth_1.authenticate, async (req, res) => {
    try {
        const rfq = await prisma_1.prisma.rFQ.findUnique({ where: { id: req.params.id } });
        if (!rfq)
            return res.status(404).json({ error: "RFQ not found" });
        if (rfq.projectId) {
            await prisma_1.prisma.rFQ.updateMany({
                where: { projectId: rfq.projectId },
                data: { isSelected: false },
            });
        }
        const updated = await prisma_1.prisma.rFQ.update({
            where: { id: rfq.id },
            data: { isSelected: true, status: "APPROVED" },
        });
        res.json({ success: true, data: updated });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/inventory/rfqs/:id
router.delete("/rfqs/:id", auth_1.authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.purchaseOrder.updateMany({ where: { rfqId: id }, data: { rfqId: null } }),
            prisma_1.prisma.rFQ.delete({ where: { id } }),
        ]);
        res.json({ success: true, message: "RFQ deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/inventory/purchase-orders
router.get("/purchase-orders", auth_1.authenticate, async (_req, res) => {
    try {
        const pos = await prisma_1.prisma.purchaseOrder.findMany({
            include: {
                supplier: { select: { name: true } },
                project: { select: { name: true } },
                items: { include: { product: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: pos });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/purchase-orders
router.post("/purchase-orders", auth_1.authenticate, async (req, res) => {
    try {
        const { supplierId, projectId, rfqId, items, deliveryDate, remarks } = req.body;
        const normalizedItems = (items ?? []).map((item) => {
            const quantity = Number(item.quantity || 0);
            const unitRate = Number(item.unitRate || 0);
            return { ...item, quantity, unitRate, totalAmount: quantity * unitRate };
        });
        const totalAmount = normalizedItems.reduce((a, i) => a + i.totalAmount, 0);
        const poNumber = `PO-${Date.now()}`;
        const po = await prisma_1.prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId,
                projectId,
                rfqId,
                status: "DRAFT",
                totalAmount,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
                remarks,
                items: { create: normalizedItems },
            },
            include: { items: true },
        });
        res.status(201).json({ success: true, data: po });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PATCH /api/inventory/purchase-orders/:id/status
router.patch("/purchase-orders/:id/status", auth_1.authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const id = req.params.id;
        const po = await prisma_1.prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po)
            return res.status(404).json({ error: "Purchase order not found" });
        if (status === "CONFIRMED") {
            const eligibleRoles = await getEligibleApprovalRoles("PURCHASE", po.totalAmount);
            if (eligibleRoles.length > 0 && !eligibleRoles.includes(req.user.role)) {
                return res.status(403).json({ error: "Your role is not allowed to approve this purchase order" });
            }
        }
        const updated = await prisma_1.prisma.purchaseOrder.update({
            where: { id },
            data: { status },
        });
        await logApprovalAction({
            module: "PURCHASE",
            entityType: "PurchaseOrder",
            entityId: updated.id,
            action: status === "CONFIRMED" ? "APPROVE" : "STATUS_CHANGE",
            status,
            actedById: req.user.id,
            amount: updated.totalAmount,
            remarks: req.body.remarks,
        });
        res.json({ success: true, data: updated });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/inventory/purchase-orders/:id
router.delete("/purchase-orders/:id", auth_1.authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.$transaction(async (tx) => {
            const grns = await tx.gRN.findMany({ where: { poId: id }, include: { items: true } });
            for (const grn of grns) {
                for (const item of grn.items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (product && product.stock >= item.acceptedQty) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.acceptedQty } },
                        });
                    }
                }
                await tx.gRNItem.deleteMany({ where: { grnId: grn.id } });
            }
            await tx.gRN.deleteMany({ where: { poId: id } });
            await tx.bill.deleteMany({ where: { poId: id } });
            await tx.purchaseOrderItem.deleteMany({ where: { poId: id } });
            await tx.purchaseOrder.delete({ where: { id } });
        });
        res.json({ success: true, message: "Purchase order deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/inventory/grns
router.get("/grns", auth_1.authenticate, async (_req, res) => {
    try {
        const grns = await prisma_1.prisma.gRN.findMany({
            include: {
                po: { include: { supplier: { select: { name: true } } } },
                items: { include: { product: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: grns });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/inventory/grns
router.post("/grns", auth_1.authenticate, async (req, res) => {
    try {
        const { poId, receivedBy, items, remarks } = req.body;
        const grnNumber = `GRN-${Date.now()}`;
        const grn = await prisma_1.prisma.$transaction(async (tx) => {
            const created = await tx.gRN.create({
                data: {
                    grnNumber,
                    poId,
                    receivedBy,
                    remarks,
                    items: { create: items },
                },
            });
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: Number(item.acceptedQty || 0) } },
                });
            }
            await tx.purchaseOrder.update({ where: { id: poId }, data: { status: "RECEIVED" } });
            return created;
        });
        res.status(201).json({ success: true, data: grn });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/inventory/adjustments
router.get("/adjustments", auth_1.authenticate, async (_req, res) => {
    try {
        const adjustments = await prisma_1.prisma.stockAdjustment.findMany({
            include: { product: { select: { name: true, unit: true } } },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        res.json({ success: true, data: adjustments });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/inventory/adjustments/:id
router.delete("/adjustments/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.stockAdjustment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/inventory/grns/:id
router.delete("/grns/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            const grn = await tx.gRN.findUnique({
                where: { id: req.params.id },
                include: { items: true },
            });
            if (!grn)
                throw new Error("GRN not found");
            for (const item of grn.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product || product.stock < item.acceptedQty) {
                    throw new Error(`Cannot reverse GRN because stock is lower than accepted quantity`);
                }
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.acceptedQty } },
                });
            }
            await tx.gRNItem.deleteMany({ where: { grnId: grn.id } });
            await tx.gRN.delete({ where: { id: grn.id } });
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map