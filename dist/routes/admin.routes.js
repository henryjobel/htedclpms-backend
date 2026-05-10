"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const system_settings_1 = require("../lib/system-settings");
const router = (0, express_1.Router)();
const permissionCatalog = [
    { module: "dashboard", action: "view" },
    { module: "users", action: "manage" },
    { module: "roles", action: "manage" },
    { module: "settings", action: "manage" },
    { module: "accounts", action: "manage" },
    { module: "inventory", action: "manage" },
    { module: "projects", action: "manage" },
    { module: "billing", action: "manage" },
    { module: "reports", action: "view" },
    { module: "hrm", action: "manage" },
];
router.get("/permissions/catalog", auth_1.authenticate, (_req, res) => {
    res.json({ success: true, data: permissionCatalog });
});
router.get("/roles", auth_1.authenticate, async (_req, res) => {
    try {
        const roles = await prisma_1.prisma.role.findMany({
            include: {
                permissions: true,
                _count: { select: { users: true } },
            },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data: roles });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/roles", auth_1.authenticate, async (req, res) => {
    try {
        const { name, description, permissions = [] } = req.body;
        const role = await prisma_1.prisma.role.create({
            data: {
                name,
                description,
                permissions: {
                    create: permissions.map((permission) => ({
                        module: permission.module,
                        action: permission.action,
                    })),
                },
            },
            include: { permissions: true, _count: { select: { users: true } } },
        });
        await (0, system_settings_1.appendActivityLog)({
            action: "CREATE",
            module: "ROLE",
            message: `Created role ${role.name}`,
            userId: req.user?.id,
            userEmail: req.user?.email,
        });
        res.status(201).json({ success: true, data: role });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/roles/:id", auth_1.authenticate, async (req, res) => {
    try {
        const roleId = req.params.id;
        const { name, description, permissions = [] } = req.body;
        await prisma_1.prisma.permission.deleteMany({ where: { roleId } });
        const role = await prisma_1.prisma.role.update({
            where: { id: roleId },
            data: {
                name,
                description,
                permissions: {
                    create: permissions.map((permission) => ({
                        module: permission.module,
                        action: permission.action,
                    })),
                },
            },
            include: { permissions: true, _count: { select: { users: true } } },
        });
        await (0, system_settings_1.appendActivityLog)({
            action: "UPDATE",
            module: "ROLE",
            message: `Updated role ${role.name}`,
            userId: req.user?.id,
            userEmail: req.user?.email,
        });
        res.json({ success: true, data: role });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.get("/activity", auth_1.authenticate, async (_req, res) => {
    try {
        const activity = await (0, system_settings_1.getSetting)("activity_log", []);
        const approvals = await prisma_1.prisma.approvalLog.findMany({
            include: {
                actedBy: { select: { name: true, email: true, role: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        const merged = [
            ...activity.map((row) => ({ source: "SYSTEM", ...row })),
            ...approvals.map((row) => ({
                id: row.id,
                source: "APPROVAL",
                module: row.module,
                action: row.action,
                message: `${row.entityType} ${row.action.toLowerCase()} - ${row.status}`,
                userName: row.actedBy?.name,
                userEmail: row.actedBy?.email,
                metadata: {
                    entityType: row.entityType,
                    entityId: row.entityId,
                    status: row.status,
                    amount: row.amount,
                    role: row.actedBy?.role.name,
                },
                createdAt: row.createdAt.toISOString(),
            })),
        ].sort((a, b) => new Date(String(b.createdAt ?? "")).getTime() - new Date(String(a.createdAt ?? "")).getTime());
        res.json({ success: true, data: merged.slice(0, 200) });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map