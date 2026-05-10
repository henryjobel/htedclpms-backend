import { Request, Response, Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { appendActivityLog, getSetting } from "../lib/system-settings";

const router = Router();

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

router.get("/permissions/catalog", authenticate, (_req: Request, res: Response) => {
  res.json({ success: true, data: permissionCatalog });
});

router.get("/roles", authenticate, async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: roles });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/roles", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, permissions = [] } = req.body as {
      name: string;
      description?: string;
      permissions?: Array<{ module: string; action: string }>;
    };

    const role = await prisma.role.create({
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

    await appendActivityLog({
      action: "CREATE",
      module: "ROLE",
      message: `Created role ${role.name}`,
      userId: req.user?.id,
      userEmail: req.user?.email,
    });

    res.status(201).json({ success: true, data: role });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/roles/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const roleId = req.params.id as string;
    const { name, description, permissions = [] } = req.body as {
      name: string;
      description?: string;
      permissions?: Array<{ module: string; action: string }>;
    };

    await prisma.permission.deleteMany({ where: { roleId } });
    const role = await prisma.role.update({
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

    await appendActivityLog({
      action: "UPDATE",
      module: "ROLE",
      message: `Updated role ${role.name}`,
      userId: req.user?.id,
      userEmail: req.user?.email,
    });

    res.json({ success: true, data: role });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/activity", authenticate, async (_req: Request, res: Response) => {
  try {
    const activity = await getSetting<Array<Record<string, unknown>>>("activity_log", []);
    const approvals = await prisma.approvalLog.findMany({
      include: {
        actedBy: { select: { name: true, email: true, role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const merged: Array<Record<string, unknown>> = [
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
    ].sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(String(b.createdAt ?? "")).getTime() - new Date(String(a.createdAt ?? "")).getTime()
    );

    res.json({ success: true, data: merged.slice(0, 200) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
