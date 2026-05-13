import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where = projectId ? { projectId: String(projectId) } : {};
    const tasks = await prisma.ganttTask.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
    });
    res.json({ success: true, data: tasks });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const task = await prisma.ganttTask.create({ data: req.body });
    res.status(201).json({ success: true, data: task });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const task = await prisma.ganttTask.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: task });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.ganttTask.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;
