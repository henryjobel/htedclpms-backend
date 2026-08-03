"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function toOptionalString(value) {
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
function normalizeGanttData(body) {
    const { projectId, taskName, phase, startDate, endDate, progress, assignee, color, dependencies, sortOrder } = body;
    const now = new Date();
    return {
        taskName: String(taskName || "Untitled Task"),
        phase: toOptionalString(phase),
        startDate: startDate ? new Date(String(startDate)) : now,
        endDate: endDate ? new Date(String(endDate)) : now,
        progress: progress !== undefined ? Number(progress || 0) : undefined,
        assignee: toOptionalString(assignee),
        color: toOptionalString(color),
        dependencies: toOptionalString(dependencies),
        sortOrder: sortOrder !== undefined ? Number(sortOrder || 0) : undefined,
        project: projectId ? { connect: { id: String(projectId) } } : undefined,
    };
}
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.query;
        const where = projectId ? { projectId: String(projectId) } : {};
        const tasks = await prisma_1.prisma.ganttTask.findMany({
            where,
            include: { project: { select: { id: true, name: true } } },
            orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
        });
        res.json({ success: true, data: tasks });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const task = await prisma_1.prisma.ganttTask.create({ data: normalizeGanttData(req.body) });
        res.status(201).json({ success: true, data: task });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const task = await prisma_1.prisma.ganttTask.update({
            where: { id: req.params.id },
            data: normalizeGanttData(req.body),
        });
        res.json({ success: true, data: task });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.ganttTask.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=gantt.routes.js.map