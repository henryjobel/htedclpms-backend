"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/bills
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const { status, projectId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (projectId)
            where.projectId = projectId;
        const bills = await prisma_1.prisma.bill.findMany({
            where,
            include: {
                project: { select: { name: true } },
                supplier: { select: { name: true } },
                contractor: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: bills });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/bills
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const billNumber = `BL-${Date.now()}`;
        const bill = await prisma_1.prisma.bill.create({
            data: { ...req.body, billNumber },
        });
        res.status(201).json({ success: true, data: bill });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PATCH /api/bills/:id/status
router.patch("/:id/status", auth_1.authenticate, async (req, res) => {
    try {
        const billId = req.params.id;
        const { status } = req.body;
        const bill = await prisma_1.prisma.bill.update({
            where: { id: billId },
            data: { status },
        });
        res.json({ success: true, data: bill });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/bills/:id
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const billId = req.params.id;
        await prisma_1.prisma.bill.delete({ where: { id: billId } });
        res.json({ success: true, message: "Bill deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=bills.routes.js.map