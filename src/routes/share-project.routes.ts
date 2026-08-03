import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// ── Share Assignments ────────────────────────────────────────────────
router.get("/assignments", authenticate, async (_req: Request, res: Response) => {
  try {
    const assignments = await prisma.shareAssignment.findMany({
      include: {
        investor: { select: { id: true, name: true, phone: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: assignments });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/assignments", authenticate, async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.shareAssignment.create({ data: req.body });
    res.status(201).json({ success: true, data: assignment });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/assignments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.shareAssignment.update({ where: { id: req.params.id as string }, data: req.body });
    res.json({ success: true, data: assignment });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/assignments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.shareAssignment.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

// ── Share Config ──────────────────────────────────────────────────────
router.get("/configs", authenticate, async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.shareProjectConfig.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: configs });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/configs", authenticate, async (req: Request, res: Response) => {
  try {
    const config = await prisma.shareProjectConfig.create({ data: req.body });
    res.status(201).json({ success: true, data: config });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/configs/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const config = await prisma.shareProjectConfig.update({ where: { id: req.params.id as string }, data: req.body });
    res.json({ success: true, data: config });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/configs/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.shareProjectConfig.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;
