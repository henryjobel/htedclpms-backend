"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/workers
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const workers = await prisma_1.prisma.worker.findMany({
            where: { isActive: true },
            include: {
                assignments: {
                    include: { project: { select: { name: true } } },
                    orderBy: { month: "desc" },
                    take: 1,
                },
            },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data: workers });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/workers
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const worker = await prisma_1.prisma.worker.create({ data: req.body });
        res.status(201).json({ success: true, data: worker });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PUT /api/workers/:id
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const workerId = req.params.id;
        const worker = await prisma_1.prisma.worker.update({ where: { id: workerId }, data: req.body });
        res.json({ success: true, data: worker });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/workers/:id/attendance
router.post("/:id/attendance", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId, month, daysWorked } = req.body;
        const workerId = req.params.id;
        const worker = await prisma_1.prisma.worker.findUnique({ where: { id: workerId } });
        if (!worker)
            return res.status(404).json({ error: "Worker not found" });
        const totalWage = worker.dailyWage * daysWorked;
        const assignment = await prisma_1.prisma.workerAssignment.create({
            data: { workerId, projectId, month: new Date(month), daysWorked, totalWage },
        });
        res.status(201).json({ success: true, data: assignment });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/workers/:id
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const workerId = req.params.id;
        await prisma_1.prisma.worker.update({ where: { id: workerId }, data: { isActive: false } });
        res.json({ success: true, message: "Worker deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=worker.routes.js.map