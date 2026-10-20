import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function validateAssignment(body: Record<string, unknown>) {
  const contractValue = Number(body.contractValue ?? 0);
  const paid = Number(body.paid ?? 0);
  if (!body.projectId) return "projectId is required";
  if (!Number.isFinite(contractValue) || contractValue < 0) return "contractValue must be a non-negative number";
  if (!Number.isFinite(paid) || paid < 0 || paid > contractValue) return "paid must be between 0 and contractValue";
  const startDate = new Date(String(body.startDate || ""));
  if (Number.isNaN(startDate.getTime())) return "valid startDate is required";
  if (body.endDate && Number.isNaN(new Date(String(body.endDate)).getTime())) return "endDate must be valid";
  if (body.endDate && new Date(String(body.endDate)) < startDate) return "endDate cannot be before startDate";
  return null;
}

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
    const validationError = validateAssignment(req.body as Record<string, unknown>);
    if (validationError) return res.status(400).json({ error: validationError });
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
    const amount = Number(req.body.amount || 0);
    const assignmentId = req.params.id as string;
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Payment amount must be greater than zero" });
    const existing = await prisma.contractorAssignment.findUnique({ where: { id: assignmentId } });
    if (!existing) return res.status(404).json({ error: "Assignment not found" });
    if (existing.paid + amount > existing.contractValue) return res.status(400).json({ error: "Payment exceeds contract value" });
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
