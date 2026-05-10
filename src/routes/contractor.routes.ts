import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/contractors
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const contractors = await prisma.contractor.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: { project: { select: { name: true } } },
          where: { status: "active" },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: contractors });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/contractors
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const contractor = await prisma.contractor.create({ data: req.body });
    res.status(201).json({ success: true, data: contractor });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/contractors/:id
router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const contractorId = req.params.id as string;
    const contractor = await prisma.contractor.update({ where: { id: contractorId }, data: req.body });
    res.json({ success: true, data: contractor });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/contractors/:id/assign
router.post("/:id/assign", authenticate, async (req: Request, res: Response) => {
  try {
    const contractorId = req.params.id as string;
    const assignment = await prisma.contractorAssignment.create({
      data: { ...req.body, contractorId },
      include: { project: { select: { name: true } } },
    });
    res.status(201).json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/contractors/assignments/:id/pay
router.post("/assignments/:id/pay", authenticate, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const assignmentId = req.params.id as string;
    const assignment = await prisma.contractorAssignment.update({
      where: { id: assignmentId },
      data: { paid: { increment: amount } },
    });
    res.json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/contractors/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const contractorId = req.params.id as string;
    await prisma.contractor.update({ where: { id: contractorId }, data: { isActive: false } });
    res.json({ success: true, message: "Contractor deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
