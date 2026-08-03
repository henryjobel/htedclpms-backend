"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function getAgingBucket(daysOverdue) {
    if (daysOverdue <= 0)
        return "Current";
    if (daysOverdue <= 30)
        return "1-30 Days";
    if (daysOverdue <= 60)
        return "31-60 Days";
    if (daysOverdue <= 90)
        return "61-90 Days";
    return "90+ Days";
}
// GET /api/real-estate/summary
router.get("/summary", auth_1.authenticate, async (_req, res) => {
    try {
        const [units, bookings, sales] = await Promise.all([
            prisma_1.prisma.propertyUnit.findMany(),
            prisma_1.prisma.propertyBooking.findMany(),
            prisma_1.prisma.propertySale.findMany(),
        ]);
        const totalSales = sales.reduce((sum, item) => sum + item.saleAmount, 0);
        const totalCollected = sales.reduce((sum, item) => sum + item.paidAmount, 0);
        const totalDue = sales.reduce((sum, item) => sum + item.dueAmount, 0);
        res.json({
            success: true,
            data: {
                totalUnits: units.length,
                availableUnits: units.filter((item) => item.status === "AVAILABLE").length,
                bookedUnits: units.filter((item) => item.status === "BOOKED").length,
                soldUnits: units.filter((item) => item.status === "SOLD").length,
                totalBookings: bookings.length,
                totalSales,
                totalCollected,
                totalDue,
            },
        });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/real-estate/collection-report
router.get("/collection-report", auth_1.authenticate, async (_req, res) => {
    try {
        const sales = await prisma_1.prisma.propertySale.findMany({
            include: {
                project: { select: { name: true } },
                unit: { select: { unitNo: true, type: true } },
            },
            orderBy: { saleDate: "desc" },
        });
        const monthlyCollectionsMap = new Map();
        const projectSummaryMap = new Map();
        for (const sale of sales) {
            const period = new Date(sale.saleDate).toISOString().slice(0, 7);
            const monthly = monthlyCollectionsMap.get(period) ?? { period, collected: 0, sales: 0, due: 0 };
            monthly.collected += sale.paidAmount;
            monthly.sales += sale.saleAmount;
            monthly.due += sale.dueAmount;
            monthlyCollectionsMap.set(period, monthly);
            const projectSummary = projectSummaryMap.get(sale.projectId) ?? {
                projectId: sale.projectId,
                projectName: sale.project.name,
                totalSales: 0,
                collected: 0,
                due: 0,
                units: 0,
            };
            projectSummary.totalSales += sale.saleAmount;
            projectSummary.collected += sale.paidAmount;
            projectSummary.due += sale.dueAmount;
            projectSummary.units += 1;
            projectSummaryMap.set(sale.projectId, projectSummary);
        }
        res.json({
            success: true,
            data: {
                totals: {
                    totalSales: sales.reduce((sum, item) => sum + item.saleAmount, 0),
                    totalCollected: sales.reduce((sum, item) => sum + item.paidAmount, 0),
                    totalDue: sales.reduce((sum, item) => sum + item.dueAmount, 0),
                    fullyPaid: sales.filter((item) => item.status === "PAID").length,
                    partial: sales.filter((item) => item.status === "PARTIAL").length,
                    due: sales.filter((item) => item.status === "DUE").length,
                },
                monthlyCollections: Array.from(monthlyCollectionsMap.values()).sort((a, b) => a.period.localeCompare(b.period)),
                projects: Array.from(projectSummaryMap.values()).sort((a, b) => b.collected - a.collected),
                sales,
            },
        });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/real-estate/aging-report
router.get("/aging-report", auth_1.authenticate, async (_req, res) => {
    try {
        const now = new Date();
        const sales = await prisma_1.prisma.propertySale.findMany({
            where: { dueAmount: { gt: 0 } },
            include: {
                project: { select: { name: true } },
                unit: { select: { unitNo: true, type: true } },
            },
            orderBy: { saleDate: "asc" },
        });
        const bucketMap = new Map([
            ["Current", 0],
            ["1-30 Days", 0],
            ["31-60 Days", 0],
            ["61-90 Days", 0],
            ["90+ Days", 0],
        ]);
        const rows = sales.map((sale) => {
            const saleDate = new Date(sale.saleDate);
            const daysOverdue = Math.max(0, Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)));
            const agingBucket = getAgingBucket(daysOverdue);
            bucketMap.set(agingBucket, (bucketMap.get(agingBucket) ?? 0) + sale.dueAmount);
            return {
                id: sale.id,
                saleNo: sale.saleNo,
                customerName: sale.customerName,
                projectName: sale.project.name,
                unitNo: sale.unit.unitNo,
                unitType: sale.unit.type,
                saleDate: sale.saleDate,
                saleAmount: sale.saleAmount,
                paidAmount: sale.paidAmount,
                dueAmount: sale.dueAmount,
                daysOverdue,
                agingBucket,
            };
        });
        res.json({
            success: true,
            data: {
                totalDue: rows.reduce((sum, item) => sum + item.dueAmount, 0),
                overdueAccounts: rows.length,
                buckets: Array.from(bucketMap.entries()).map(([bucket, amount]) => ({ bucket, amount })),
                rows,
            },
        });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/real-estate/blocks
router.get("/blocks", auth_1.authenticate, async (_req, res) => {
    try {
        const blocks = await prisma_1.prisma.propertyBlock.findMany({
            include: { project: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: blocks });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/blocks", auth_1.authenticate, async (req, res) => {
    try {
        const block = await prisma_1.prisma.propertyBlock.create({ data: req.body });
        res.status(201).json({ success: true, data: block });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/blocks/:id", auth_1.authenticate, async (req, res) => {
    try {
        const block = await prisma_1.prisma.propertyBlock.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ success: true, data: block });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/blocks/:id", auth_1.authenticate, async (req, res) => {
    try {
        const blockId = req.params.id;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.propertyUnit.updateMany({ where: { blockId }, data: { blockId: null } }),
            prisma_1.prisma.propertyBlock.delete({ where: { id: blockId } }),
        ]);
        res.json({ success: true, message: "Block deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/real-estate/roads
router.get("/roads", auth_1.authenticate, async (_req, res) => {
    try {
        const roads = await prisma_1.prisma.propertyRoad.findMany({
            include: { project: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: roads });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/roads", auth_1.authenticate, async (req, res) => {
    try {
        const road = await prisma_1.prisma.propertyRoad.create({ data: req.body });
        res.status(201).json({ success: true, data: road });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/roads/:id", auth_1.authenticate, async (req, res) => {
    try {
        const road = await prisma_1.prisma.propertyRoad.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ success: true, data: road });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/roads/:id", auth_1.authenticate, async (req, res) => {
    try {
        const roadId = req.params.id;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.propertyUnit.updateMany({ where: { roadId }, data: { roadId: null } }),
            prisma_1.prisma.propertyRoad.delete({ where: { id: roadId } }),
        ]);
        res.json({ success: true, message: "Road deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/real-estate/units
router.get("/units", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId, type, status } = req.query;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        const units = await prisma_1.prisma.propertyUnit.findMany({
            where,
            include: {
                project: { select: { name: true } },
                block: { select: { name: true } },
                road: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: units });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/units", auth_1.authenticate, async (req, res) => {
    try {
        const unit = await prisma_1.prisma.propertyUnit.create({ data: req.body });
        res.status(201).json({ success: true, data: unit });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/units/:id", auth_1.authenticate, async (req, res) => {
    try {
        const unit = await prisma_1.prisma.propertyUnit.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ success: true, data: unit });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/units/:id", auth_1.authenticate, async (req, res) => {
    try {
        const unitId = req.params.id;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.propertySale.deleteMany({ where: { unitId } }),
            prisma_1.prisma.propertyBooking.deleteMany({ where: { unitId } }),
            prisma_1.prisma.propertyUnit.delete({ where: { id: unitId } }),
        ]);
        res.json({ success: true, message: "Unit deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/real-estate/bookings
router.get("/bookings", auth_1.authenticate, async (_req, res) => {
    try {
        const bookings = await prisma_1.prisma.propertyBooking.findMany({
            include: {
                project: { select: { name: true } },
                unit: { select: { unitNo: true, type: true } },
            },
            orderBy: { bookingDate: "desc" },
        });
        res.json({ success: true, data: bookings });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/bookings", auth_1.authenticate, async (req, res) => {
    try {
        const bookingNo = `BK-${Date.now()}`;
        const booking = await prisma_1.prisma.propertyBooking.create({
            data: {
                ...req.body,
                bookingNo,
                bookingDate: req.body.bookingDate ? new Date(req.body.bookingDate) : undefined,
            },
        });
        await prisma_1.prisma.propertyUnit.update({
            where: { id: req.body.unitId },
            data: { status: "BOOKED" },
        });
        res.status(201).json({ success: true, data: booking });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/bookings/:id", auth_1.authenticate, async (req, res) => {
    try {
        const existing = await prisma_1.prisma.propertyBooking.findUnique({
            where: { id: req.params.id },
        });
        if (!existing)
            return res.status(404).json({ error: "Booking not found" });
        const booking = await prisma_1.prisma.propertyBooking.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                bookingDate: req.body.bookingDate ? new Date(req.body.bookingDate) : undefined,
                bookingAmount: req.body.bookingAmount !== undefined ? Number(req.body.bookingAmount || 0) : undefined,
            },
        });
        if (req.body.unitId && req.body.unitId !== existing.unitId) {
            await prisma_1.prisma.propertyUnit.update({
                where: { id: existing.unitId },
                data: { status: "AVAILABLE" },
            });
            await prisma_1.prisma.propertyUnit.update({
                where: { id: req.body.unitId },
                data: { status: "BOOKED" },
            });
        }
        res.json({ success: true, data: booking });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/bookings/:id", auth_1.authenticate, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await prisma_1.prisma.propertyBooking.findUnique({ where: { id: bookingId } });
        if (!booking)
            return res.status(404).json({ error: "Booking not found" });
        const linkedSale = await prisma_1.prisma.propertySale.findUnique({ where: { bookingId } });
        await prisma_1.prisma.$transaction(async (tx) => {
            if (linkedSale) {
                await tx.propertySale.update({ where: { id: linkedSale.id }, data: { bookingId: null } });
            }
            await tx.propertyBooking.delete({ where: { id: bookingId } });
            await tx.propertyUnit.update({
                where: { id: booking.unitId },
                data: { status: linkedSale ? "SOLD" : "AVAILABLE" },
            });
        });
        res.json({ success: true, message: "Booking deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// POST /api/real-estate/bookings/:id/cancel
router.post("/bookings/:id/cancel", auth_1.authenticate, async (req, res) => {
    try {
        const booking = await prisma_1.prisma.propertyBooking.findUnique({ where: { id: req.params.id } });
        if (!booking)
            return res.status(404).json({ error: "Booking not found" });
        if (booking.status === "CONVERTED") {
            return res.status(400).json({ error: "Converted booking cannot be cancelled" });
        }
        const refundAmount = Number(req.body.refundAmount || 0);
        const remarks = req.body.remarks
            ? `${booking.remarks ? `${booking.remarks} | ` : ""}Cancelled: ${req.body.remarks}${refundAmount > 0 ? ` | Refund: ${refundAmount}` : ""}`
            : booking.remarks;
        const updated = await prisma_1.prisma.propertyBooking.update({
            where: { id: booking.id },
            data: {
                status: "CANCELLED",
                remarks,
            },
        });
        await prisma_1.prisma.propertyUnit.update({
            where: { id: booking.unitId },
            data: { status: "AVAILABLE" },
        });
        res.json({ success: true, data: updated });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/real-estate/sales
router.get("/sales", auth_1.authenticate, async (_req, res) => {
    try {
        const sales = await prisma_1.prisma.propertySale.findMany({
            include: {
                project: { select: { name: true } },
                unit: { select: { unitNo: true, type: true } },
                booking: { select: { bookingNo: true } },
            },
            orderBy: { saleDate: "desc" },
        });
        res.json({ success: true, data: sales });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/sales", auth_1.authenticate, async (req, res) => {
    try {
        const saleNo = `SAL-${Date.now()}`;
        const saleAmount = Number(req.body.saleAmount || 0);
        const paidAmount = Number(req.body.paidAmount || 0);
        if (paidAmount > saleAmount) {
            return res.status(400).json({ error: "Paid amount cannot exceed sale amount" });
        }
        const sale = await prisma_1.prisma.propertySale.create({
            data: {
                ...req.body,
                saleNo,
                saleDate: req.body.saleDate ? new Date(req.body.saleDate) : undefined,
                saleAmount,
                paidAmount,
                dueAmount: saleAmount - paidAmount,
                status: paidAmount >= saleAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE",
            },
        });
        await prisma_1.prisma.propertyUnit.update({
            where: { id: req.body.unitId },
            data: { status: "SOLD" },
        });
        if (req.body.bookingId) {
            await prisma_1.prisma.propertyBooking.update({
                where: { id: req.body.bookingId },
                data: { status: "CONVERTED" },
            });
        }
        res.status(201).json({ success: true, data: sale });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/sales/:id", auth_1.authenticate, async (req, res) => {
    try {
        const existing = await prisma_1.prisma.propertySale.findUnique({
            where: { id: req.params.id },
        });
        if (!existing)
            return res.status(404).json({ error: "Sale not found" });
        const saleAmount = req.body.saleAmount !== undefined ? Number(req.body.saleAmount || 0) : existing.saleAmount;
        const paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount || 0) : existing.paidAmount;
        if (paidAmount > saleAmount) {
            return res.status(400).json({ error: "Paid amount cannot exceed sale amount" });
        }
        const sale = await prisma_1.prisma.propertySale.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                saleDate: req.body.saleDate ? new Date(req.body.saleDate) : undefined,
                saleAmount,
                paidAmount,
                dueAmount: saleAmount - paidAmount,
                status: paidAmount >= saleAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE",
            },
        });
        if (req.body.unitId && req.body.unitId !== existing.unitId) {
            await prisma_1.prisma.propertyUnit.update({
                where: { id: existing.unitId },
                data: { status: "AVAILABLE" },
            });
            await prisma_1.prisma.propertyUnit.update({
                where: { id: req.body.unitId },
                data: { status: "SOLD" },
            });
        }
        res.json({ success: true, data: sale });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/sales/:id", auth_1.authenticate, async (req, res) => {
    try {
        const saleId = req.params.id;
        const sale = await prisma_1.prisma.propertySale.findUnique({ where: { id: saleId } });
        if (!sale)
            return res.status(404).json({ error: "Sale not found" });
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.propertySale.delete({ where: { id: saleId } });
            if (sale.bookingId) {
                await tx.propertyBooking.update({
                    where: { id: sale.bookingId },
                    data: { status: "ACTIVE" },
                });
            }
            await tx.propertyUnit.update({
                where: { id: sale.unitId },
                data: { status: sale.bookingId ? "BOOKED" : "AVAILABLE" },
            });
        });
        res.json({ success: true, message: "Sale deleted" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// POST /api/real-estate/sales/:id/installment-plan
router.post("/sales/:id/installment-plan", auth_1.authenticate, async (req, res) => {
    try {
        const sale = await prisma_1.prisma.propertySale.findUnique({
            where: { id: req.params.id },
            include: {
                project: { select: { id: true, name: true } },
                unit: { select: { unitNo: true } },
            },
        });
        if (!sale)
            return res.status(404).json({ error: "Sale not found" });
        if (sale.dueAmount <= 0)
            return res.status(400).json({ error: "This sale has no due amount for installments" });
        const months = Math.max(parseInt(String(req.body.months || 6), 10), 1);
        const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
        const perInstallment = sale.dueAmount / months;
        const schedule = Array.from({ length: months }).map((_, index) => {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + index);
            const amount = index === months - 1
                ? sale.dueAmount - perInstallment * (months - 1)
                : perInstallment;
            return {
                dueDate,
                amount,
                paidAmount: 0,
                status: "unpaid",
            };
        });
        const installment = await prisma_1.prisma.installment.create({
            data: {
                client: sale.customerName,
                clientPhone: sale.customerPhone,
                projectId: sale.project.id,
                unit: sale.unit.unitNo,
                totalAmount: sale.dueAmount,
                paid: 0,
                schedule: { create: schedule },
            },
            include: { schedule: true, project: { select: { name: true } } },
        });
        res.status(201).json({ success: true, data: installment });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=real-estate.routes.js.map