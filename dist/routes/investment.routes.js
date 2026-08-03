"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── Investors ────────────────────────────────────────────────────────
router.get("/investors", auth_1.authenticate, async (_req, res) => {
    try {
        const investors = await prisma_1.prisma.investor.findMany({
            include: { investments: { include: { project: { select: { name: true } } } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: investors });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/investors", auth_1.authenticate, async (req, res) => {
    try {
        const investor = await prisma_1.prisma.investor.create({ data: req.body });
        res.status(201).json({ success: true, data: investor });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/investors/:id", auth_1.authenticate, async (req, res) => {
    try {
        const investor = await prisma_1.prisma.investor.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: investor });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/investors/:id", auth_1.authenticate, async (req, res) => {
    try {
        const investorId = req.params.id;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.shareAssignment.deleteMany({ where: { investorId } }),
            prisma_1.prisma.projectInvestment.deleteMany({ where: { investorId } }),
            prisma_1.prisma.investor.delete({ where: { id: investorId } }),
        ]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// ── Project Investments ──────────────────────────────────────────────
router.get("/investments", auth_1.authenticate, async (_req, res) => {
    try {
        const investments = await prisma_1.prisma.projectInvestment.findMany({
            include: {
                investor: { select: { id: true, name: true, phone: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: investments });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/investments", auth_1.authenticate, async (req, res) => {
    try {
        const investment = await prisma_1.prisma.projectInvestment.create({ data: req.body });
        res.status(201).json({ success: true, data: investment });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/investments/:id", auth_1.authenticate, async (req, res) => {
    try {
        const investment = await prisma_1.prisma.projectInvestment.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: investment });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/investments/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.projectInvestment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=investment.routes.js.map