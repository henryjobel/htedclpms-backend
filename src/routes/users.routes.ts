import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/users/roles
router.get("/roles", authenticate, async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data: roles });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users
router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const data = users.map(({ password: _p, ...u }) => u);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, roleId } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone, roleId },
      include: { role: { select: { name: true } } },
    });
    const { password: _p, ...safe } = user;
    res.status(201).json({ success: true, data: safe });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/users/:id
router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { name, phone, roleId } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, roleId },
      include: { role: { select: { name: true } } },
    });
    const { password: _p, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/:id/status
router.patch("/:id/status", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
