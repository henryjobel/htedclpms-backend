"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
async function ensureAccount(code, name, type) {
    const existing = await prisma_1.prisma.account.findUnique({ where: { code } });
    if (existing)
        return existing;
    return prisma_1.prisma.account.create({ data: { code, name, type } });
}
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
// GET /api/operations/billing
router.get("/billing", auth_1.authenticate, async (_req, res) => {
    try {
        const rows = await prisma_1.prisma.billingRecord.findMany({
            include: {
                project: { select: { name: true } },
                contractor: { select: { name: true } },
                worker: { select: { name: true } },
                workOrder: { select: { workOrderNo: true, title: true } },
                createdBy: { select: { name: true } },
            },
            orderBy: { billingDate: "desc" },
        });
        res.json({ success: true, data: rows });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/operations/billing
router.post("/billing", auth_1.authenticate, async (req, res) => {
    try {
        const billedAmount = Number(req.body.billedAmount || 0);
        const paidAmount = Number(req.body.paidAmount || 0);
        const billing = await prisma_1.prisma.billingRecord.create({
            data: {
                ...req.body,
                billingNo: `BR-${Date.now()}`,
                quantity: Number(req.body.quantity || 0),
                unitRate: Number(req.body.unitRate || 0),
                percentage: req.body.percentage !== undefined ? Number(req.body.percentage) : undefined,
                previousAmount: Number(req.body.previousAmount || 0),
                adjustmentAmount: Number(req.body.adjustmentAmount || 0),
                retentionAmount: Number(req.body.retentionAmount || 0),
                billedAmount,
                paidAmount,
                dueAmount: billedAmount - paidAmount,
                billingDate: req.body.billingDate ? new Date(req.body.billingDate) : new Date(),
                dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
                createdById: req.user?.id,
            },
        });
        res.status(201).json({ success: true, data: billing });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/operations/billing/:id
router.put("/billing/:id", auth_1.authenticate, async (req, res) => {
    try {
        const billedAmount = Number(req.body.billedAmount || 0);
        const paidAmount = Number(req.body.paidAmount || 0);
        const billing = await prisma_1.prisma.billingRecord.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                quantity: Number(req.body.quantity || 0),
                unitRate: Number(req.body.unitRate || 0),
                percentage: req.body.percentage !== undefined ? Number(req.body.percentage) : undefined,
                previousAmount: Number(req.body.previousAmount || 0),
                adjustmentAmount: Number(req.body.adjustmentAmount || 0),
                retentionAmount: Number(req.body.retentionAmount || 0),
                billedAmount,
                paidAmount,
                dueAmount: billedAmount - paidAmount,
                billingDate: req.body.billingDate ? new Date(req.body.billingDate) : undefined,
                dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
            },
        });
        res.json({ success: true, data: billing });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PATCH /api/operations/billing/:id/status
router.patch("/billing/:id/status", auth_1.authenticate, async (req, res) => {
    try {
        const item = await prisma_1.prisma.billingRecord.findUnique({ where: { id: req.params.id } });
        if (!item)
            return res.status(404).json({ error: "Billing record not found" });
        const paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : item.paidAmount;
        const billedAmount = item.billedAmount;
        const status = req.body.status
            || (paidAmount >= billedAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : item.status);
        if (status === "APPROVED") {
            const eligibleRoles = await getEligibleApprovalRoles("BILLING", billedAmount);
            if (eligibleRoles.length > 0 && !eligibleRoles.includes(req.user.role)) {
                return res.status(403).json({ error: "Your role is not allowed to approve this billing record" });
            }
        }
        const updated = await prisma_1.prisma.billingRecord.update({
            where: { id: req.params.id },
            data: {
                status,
                paidAmount,
                dueAmount: billedAmount - paidAmount,
            },
        });
        if (status === "APPROVED") {
            const expenseAccount = await ensureAccount("5000", "Project Billing Expense", "EXPENSE");
            const payableAccount = await ensureAccount("2100", "Billing Payable", "LIABILITY");
            const existingVoucher = await prisma_1.prisma.voucher.findFirst({
                where: { description: `Billing approval ${updated.billingNo}` },
            });
            if (!existingVoucher) {
                await prisma_1.prisma.voucher.create({
                    data: {
                        voucherNo: `V-${Date.now()}`,
                        type: "JOURNAL",
                        projectId: updated.projectId,
                        amount: updated.billedAmount,
                        description: `Billing approval ${updated.billingNo}`,
                        status: "approved",
                        userId: req.user.id,
                        ledgerEntries: {
                            create: [
                                {
                                    accountId: expenseAccount.id,
                                    projectId: updated.projectId,
                                    debit: updated.billedAmount,
                                    credit: 0,
                                    description: `Expense for ${updated.billingNo}`,
                                },
                                {
                                    accountId: payableAccount.id,
                                    projectId: updated.projectId,
                                    debit: 0,
                                    credit: updated.billedAmount,
                                    description: `Payable for ${updated.billingNo}`,
                                },
                            ],
                        },
                    },
                });
            }
        }
        await logApprovalAction({
            module: "BILLING",
            entityType: "BillingRecord",
            entityId: updated.id,
            action: status === "APPROVED" ? "APPROVE" : "STATUS_CHANGE",
            status,
            actedById: req.user.id,
            amount: updated.billedAmount,
            remarks: req.body.remarks,
        });
        res.json({ success: true, data: updated });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/operations/billing/:id
router.delete("/billing/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.billingRecord.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: "Billing record deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/operations/assets
router.get("/assets", auth_1.authenticate, async (_req, res) => {
    try {
        const rows = await prisma_1.prisma.assetItem.findMany({
            include: { project: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: rows });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/operations/assets
router.post("/assets", auth_1.authenticate, async (req, res) => {
    try {
        const asset = await prisma_1.prisma.assetItem.create({
            data: {
                ...req.body,
                assetCode: `AST-${Date.now()}`,
                purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined,
                purchaseValue: Number(req.body.purchaseValue || 0),
                currentValue: Number(req.body.currentValue || 0),
            },
        });
        res.status(201).json({ success: true, data: asset });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/operations/assets/:id
router.put("/assets/:id", auth_1.authenticate, async (req, res) => {
    try {
        const asset = await prisma_1.prisma.assetItem.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined,
                purchaseValue: Number(req.body.purchaseValue || 0),
                currentValue: Number(req.body.currentValue || 0),
            },
        });
        res.json({ success: true, data: asset });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/operations/assets/:id
router.delete("/assets/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.assetItem.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: "Asset deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/operations/asset-maintenance
router.get("/asset-maintenance", auth_1.authenticate, async (_req, res) => {
    try {
        const rows = await prisma_1.prisma.assetMaintenanceLog.findMany({
            include: {
                asset: {
                    select: { id: true, assetCode: true, name: true, category: true },
                },
            },
            orderBy: { maintenanceDate: "desc" },
        });
        res.json({ success: true, data: rows });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/operations/asset-maintenance
router.post("/asset-maintenance", auth_1.authenticate, async (req, res) => {
    try {
        const row = await prisma_1.prisma.assetMaintenanceLog.create({
            data: {
                ...req.body,
                maintenanceDate: req.body.maintenanceDate ? new Date(req.body.maintenanceDate) : new Date(),
                nextDueDate: req.body.nextDueDate ? new Date(req.body.nextDueDate) : undefined,
                cost: Number(req.body.cost || 0),
            },
        });
        res.status(201).json({ success: true, data: row });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/operations/asset-maintenance/:id
router.put("/asset-maintenance/:id", auth_1.authenticate, async (req, res) => {
    try {
        const row = await prisma_1.prisma.assetMaintenanceLog.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                maintenanceDate: req.body.maintenanceDate ? new Date(req.body.maintenanceDate) : undefined,
                nextDueDate: req.body.nextDueDate ? new Date(req.body.nextDueDate) : undefined,
                cost: Number(req.body.cost || 0),
            },
        });
        res.json({ success: true, data: row });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/operations/asset-maintenance/:id
router.delete("/asset-maintenance/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.assetMaintenanceLog.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: "Maintenance log deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/operations/assets/depreciation-summary
router.get("/assets/depreciation-summary", auth_1.authenticate, async (_req, res) => {
    try {
        const assets = await prisma_1.prisma.assetItem.findMany();
        const totalPurchaseValue = assets.reduce((sum, item) => sum + item.purchaseValue, 0);
        const totalCurrentValue = assets.reduce((sum, item) => sum + item.currentValue, 0);
        const rows = assets.map((asset) => ({
            id: asset.id,
            assetCode: asset.assetCode,
            name: asset.name,
            purchaseValue: asset.purchaseValue,
            currentValue: asset.currentValue,
            depreciation: asset.purchaseValue - asset.currentValue,
            depreciationRate: asset.purchaseValue > 0 ? ((asset.purchaseValue - asset.currentValue) / asset.purchaseValue) * 100 : 0,
        }));
        res.json({
            success: true,
            data: {
                totalPurchaseValue,
                totalCurrentValue,
                totalDepreciation: totalPurchaseValue - totalCurrentValue,
                rows,
            },
        });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/operations/approval-layers
router.get("/approval-layers", auth_1.authenticate, async (_req, res) => {
    try {
        const rows = await prisma_1.prisma.approvalLayer.findMany({
            orderBy: [{ module: "asc" }, { level: "asc" }],
        });
        res.json({ success: true, data: rows });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/operations/approval-layers
router.post("/approval-layers", auth_1.authenticate, async (req, res) => {
    try {
        const row = await prisma_1.prisma.approvalLayer.create({
            data: {
                ...req.body,
                level: Number(req.body.level || 1),
                minAmount: req.body.minAmount !== undefined ? Number(req.body.minAmount) : undefined,
                maxAmount: req.body.maxAmount !== undefined ? Number(req.body.maxAmount) : undefined,
            },
        });
        res.status(201).json({ success: true, data: row });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/operations/approval-layers/:id
router.put("/approval-layers/:id", auth_1.authenticate, async (req, res) => {
    try {
        const row = await prisma_1.prisma.approvalLayer.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                level: Number(req.body.level || 1),
                minAmount: req.body.minAmount !== undefined ? Number(req.body.minAmount) : undefined,
                maxAmount: req.body.maxAmount !== undefined ? Number(req.body.maxAmount) : undefined,
            },
        });
        res.json({ success: true, data: row });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/operations/approval-layers/:id
router.delete("/approval-layers/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.approvalLayer.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: "Approval layer deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=operations.routes.js.map