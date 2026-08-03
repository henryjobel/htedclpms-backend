import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function normalizeGanttData(body: Record<string, unknown>): Prisma.GanttTaskCreateInput {
  const { projectId, taskName, phase, startDate, endDate, progress, assignee, color, dependencies, sortOrder } = body;
  const now = new Date();
  return {
    taskName: String(taskName || "Untitled Task"),
    phase: toOptionalString(phase),
    startDate: startDate ? new Date(String(startDate)) : now,
    endDate: endDate ? new Date(String(endDate)) : now,
    progress: progress !== undefined ? Number(progress || 0) : undefined,
    assignee: toOptionalString(assignee),
    color: toOptionalString(color),
    dependencies: toOptionalString(dependencies),
    sortOrder: sortOrder !== undefined ? Number(sortOrder || 0) : undefined,
    project: projectId ? { connect: { id: String(projectId) } } : undefined,
  };
}

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
    const task = await prisma.ganttTask.create({ data: normalizeGanttData(req.body) });
    res.status(201).json({ success: true, data: task });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const task = await prisma.ganttTask.update({
      where: { id: req.params.id as string },
      data: normalizeGanttData(req.body) as Prisma.GanttTaskUpdateInput,
    });
    res.json({ success: true, data: task });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.ganttTask.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;
