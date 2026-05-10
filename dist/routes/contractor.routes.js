"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/contractors
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const contractors = await prisma_1.prisma.contractor.findMany({
            where: { isActive: true },
            include: {
                assignments: {
                    include: { project: { select: { name: true } } },
                    where: { status: "active" },
                },
            },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data: contractors });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/contractors
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const contractor = await prisma_1.prisma.contractor.create({ data: req.body });
        res.status(201).json({ success: true, data: contractor });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PUT /api/contractors/:id
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const contractorId = req.params.id;
        const contractor = await prisma_1.prisma.contractor.update({ where: { id: contractorId }, data: req.body });
        res.json({ success: true, data: contractor });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/contractors/:id/assign
router.post("/:id/assign", auth_1.authenticate, async (req, res) => {
    try {
        const contractorId = req.params.id;
        const assignment = await prisma_1.prisma.contractorAssignment.create({
            data: { ...req.body, contractorId },
            include: { project: { select: { name: true } } },
        });
        res.status(201).json({ success: true, data: assignment });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/contractors/assignments/:id/pay
router.post("/assignments/:id/pay", auth_1.authenticate, async (req, res) => {
    try {
        const { amount } = req.body;
        const assignmentId = req.params.id;
        const assignment = await prisma_1.prisma.contractorAssignment.update({
            where: { id: assignmentId },
            data: { paid: { increment: amount } },
        });
        res.json({ success: true, data: assignment });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/contractors/:id
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const contractorId = req.params.id;
        await prisma_1.prisma.contractor.update({ where: { id: contractorId }, data: { isActive: false } });
        res.json({ success: true, message: "Contractor deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=contractor.routes.js.map