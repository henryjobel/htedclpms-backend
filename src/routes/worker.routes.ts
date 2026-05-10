import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/workers
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: { project: { select: { name: true } } },
          orderBy: { month: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: workers });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/workers
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const worker = await prisma.worker.create({ data: req.body });
    res.status(201).json({ success: true, data: worker });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/workers/:id
router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const workerId = req.params.id as string;
    const worker = await prisma.worker.update({ where: { id: workerId }, data: req.body });
    res.json({ success: true, data: worker });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/workers/:id/attendance
router.post("/:id/attendance", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, month, daysWorked } = req.body;
    const workerId = req.params.id as string;
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    const totalWage = worker.dailyWage * daysWorked;

    const assignment = await prisma.workerAssignment.create({
      data: { workerId, projectId, month: new Date(month), daysWorked, totalWage },
    });

    res.status(201).json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/workers/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const workerId = req.params.id as string;
    await prisma.worker.update({ where: { id: workerId }, data: { isActive: false } });
    res.json({ success: true, message: "Worker deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
