"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const system_settings_1 = require("../lib/system-settings");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d");
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn });
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            },
        });
        await (0, system_settings_1.appendActivityLog)({
            action: "LOGIN",
            module: "AUTH",
            message: `${user.name} logged in`,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, roleId } = req.body;
        const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (exists) {
            return res.status(400).json({ error: "Email already in use" });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, password: hashed, phone, roleId },
            include: { role: true },
        });
        res.status(201).json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/auth/me
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { role: { include: { permissions: true } } },
            omit: { password: true },
        });
        res.json({ success: true, user });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/auth/change-password
router.post("/change-password", auth_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ error: "Current password is incorrect" });
        if (newPassword.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashed },
        });
        await (0, system_settings_1.appendActivityLog)({
            action: "PASSWORD_CHANGE",
            module: "AUTH",
            message: "Password updated",
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
        });
        res.json({ success: true, message: "Password updated successfully" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map