"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/projects
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const { status, page = "1", limit = "20" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const projectStatus = typeof status === "string" ? status : undefined;
        const where = projectStatus ? { status: projectStatus } : {};
        const [projects, total] = await Promise.all([
            prisma_1.prisma.project.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.project.count({ where }),
        ]);
        res.json({ success: true, data: projects, total, page: parseInt(page) });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/projects/:id
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await prisma_1.prisma.project.findUnique({
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
        if (!project)
            return res.status(404).json({ error: "Project not found" });
        const totalIncome = project.installments.reduce((a, i) => a + i.paid, 0);
        const totalExpense = project.projectExpenses.reduce((a, e) => a + e.amount, 0);
        res.json({ success: true, data: { ...project, totalIncome, totalExpense, profit: totalIncome - totalExpense } });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/projects
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const project = await prisma_1.prisma.project.create({ data: req.body });
        res.status(201).json({ success: true, data: project });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/projects/:id
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await prisma_1.prisma.project.update({ where: { id: projectId }, data: req.body });
        res.json({ success: true, data: project });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/projects/:id
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        await prisma_1.prisma.project.delete({ where: { id: projectId } });
        res.json({ success: true, message: "Project deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/projects/:id/boq
router.get("/:id/boq", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const items = await prisma_1.prisma.bOQItem.findMany({ where: { projectId } });
        res.json({ success: true, data: items });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/projects/:id/boq
router.post("/:id/boq", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const item = await prisma_1.prisma.bOQItem.create({ data: { ...req.body, projectId } });
        res.status(201).json({ success: true, data: item });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/projects/:id/tasks
router.get("/:id/tasks", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const tasks = await prisma_1.prisma.task.findMany({
            where: { projectId },
            include: { assignedTo: { select: { id: true, name: true } } },
        });
        res.json({ success: true, data: tasks });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/projects/:id/progress
router.get("/:id/progress", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const logs = await prisma_1.prisma.progressLog.findMany({
            where: { projectId },
            orderBy: { logDate: "desc" },
        });
        res.json({ success: true, data: logs });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/projects/:id/progress
router.post("/:id/progress", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const log = await prisma_1.prisma.progressLog.create({ data: { ...req.body, projectId } });
        res.status(201).json({ success: true, data: log });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/projects/boq/:itemId
router.delete("/boq/:itemId", auth_1.authenticate, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        await prisma_1.prisma.bOQItem.delete({ where: { id: itemId } });
        res.json({ success: true, message: "BOQ item deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/projects/:id/tasks
router.post("/:id/tasks", auth_1.authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;
        const task = await prisma_1.prisma.task.create({ data: { ...req.body, projectId } });
        res.status(201).json({ success: true, data: task });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PATCH /api/projects/:id/tasks/:taskId
router.patch("/:id/tasks/:taskId", auth_1.authenticate, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const task = await prisma_1.prisma.task.update({ where: { id: taskId }, data: req.body });
        res.json({ success: true, data: task });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/projects/:id/tasks/:taskId
router.delete("/:id/tasks/:taskId", auth_1.authenticate, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        await prisma_1.prisma.task.delete({ where: { id: taskId } });
        res.json({ success: true, message: "Task deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PUT /api/projects/quotations/:id
router.put("/quotations/:id", auth_1.authenticate, async (req, res) => {
    try {
        const quotationId = req.params.id;
        const quotation = await prisma_1.prisma.quotation.update({ where: { id: quotationId }, data: req.body });
        res.json({ success: true, data: quotation });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/projects/quotations/:id
router.delete("/quotations/:id", auth_1.authenticate, async (req, res) => {
    try {
        const quotationId = req.params.id;
        await prisma_1.prisma.quotation.delete({ where: { id: quotationId } });
        res.json({ success: true, message: "Quotation deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/projects/quotations
router.get("/quotations/all", auth_1.authenticate, async (_req, res) => {
    try {
        const quotations = await prisma_1.prisma.quotation.findMany({
            include: { project: { select: { name: true } }, items: true },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: quotations });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/projects/quotations
router.post("/quotations", auth_1.authenticate, async (_req, res) => {
    try {
        const quotationNo = `QT-${Date.now()}`;
        const { items, ...rest } = _req.body;
        const quotation = await prisma_1.prisma.quotation.create({
            data: { ...rest, quotationNo, items: items ? { create: items } : undefined },
            include: { items: true },
        });
        res.status(201).json({ success: true, data: quotation });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/projects/work-orders
router.get("/work-orders/all", auth_1.authenticate, async (_req, res) => {
    try {
        const workOrders = await prisma_1.prisma.workOrder.findMany({
            include: {
                project: { select: { name: true } },
                contractor: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: workOrders });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/projects/work-orders
router.post("/work-orders", auth_1.authenticate, async (req, res) => {
    try {
        const workOrderNo = `WO-${Date.now()}`;
        const workOrder = await prisma_1.prisma.workOrder.create({
            data: {
                ...req.body,
                workOrderNo,
                amount: Number(req.body.amount || 0),
                startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
                endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            },
        });
        res.status(201).json({ success: true, data: workOrder });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/projects/work-orders/:id
router.put("/work-orders/:id", auth_1.authenticate, async (req, res) => {
    try {
        const workOrder = await prisma_1.prisma.workOrder.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                amount: Number(req.body.amount || 0),
                startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
                endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            },
        });
        res.json({ success: true, data: workOrder });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// DELETE /api/projects/work-orders/:id
router.delete("/work-orders/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.workOrder.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: "Work order deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=project.routes.js.map