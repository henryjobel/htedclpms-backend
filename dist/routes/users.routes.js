"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/users/roles
router.get("/roles", auth_1.authenticate, async (_req, res) => {
    try {
        const roles = await prisma_1.prisma.role.findMany({ orderBy: { name: "asc" } });
        res.json({ success: true, data: roles });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/users
router.get("/", auth_1.authenticate, async (_req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            include: { role: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });
        const data = users.map(({ password: _p, ...u }) => u);
        res.json({ success: true, data });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/users
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const { name, email, password, phone, roleId } = req.body;
        const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(400).json({ error: "Email already in use" });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, password: hashed, phone, roleId },
            include: { role: { select: { name: true } } },
        });
        const { password: _p, ...safe } = user;
        res.status(201).json({ success: true, data: safe });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/users/:id
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, phone, roleId } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { name, phone, roleId },
            include: { role: { select: { name: true } } },
        });
        const { password: _p, ...safe } = user;
        res.json({ success: true, data: safe });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
// PATCH /api/users/:id/status
router.patch("/:id/status", auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.params.id;
        const { isActive } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { isActive },
        });
        res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map