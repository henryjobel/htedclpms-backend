"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── Share Assignments ────────────────────────────────────────────────
router.get("/assignments", auth_1.authenticate, async (_req, res) => {
    try {
        const assignments = await prisma_1.prisma.shareAssignment.findMany({
            include: {
                investor: { select: { id: true, name: true, phone: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: assignments });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/assignments", auth_1.authenticate, async (req, res) => {
    try {
        const assignment = await prisma_1.prisma.shareAssignment.create({ data: req.body });
        res.status(201).json({ success: true, data: assignment });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/assignments/:id", auth_1.authenticate, async (req, res) => {
    try {
        const assignment = await prisma_1.prisma.shareAssignment.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: assignment });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/assignments/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.shareAssignment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// ── Share Config ──────────────────────────────────────────────────────
router.get("/configs", auth_1.authenticate, async (_req, res) => {
    try {
        const configs = await prisma_1.prisma.shareProjectConfig.findMany({
            include: { project: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: configs });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/configs", auth_1.authenticate, async (req, res) => {
    try {
        const config = await prisma_1.prisma.shareProjectConfig.create({ data: req.body });
        res.status(201).json({ success: true, data: config });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/configs/:id", auth_1.authenticate, async (req, res) => {
    try {
        const config = await prisma_1.prisma.shareProjectConfig.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: config });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/configs/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.shareProjectConfig.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=share-project.routes.js.map