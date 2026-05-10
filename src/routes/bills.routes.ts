import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/bills
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { status, projectId } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const bills = await prisma.bill.findMany({
      where,
      include: {
        project: { select: { name: true } },
        supplier: { select: { name: true } },
        contractor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: bills });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/bills
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const billNumber = `BL-${Date.now()}`;
    const bill = await prisma.bill.create({
      data: { ...req.body, billNumber },
    });
    res.status(201).json({ success: true, data: bill });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PATCH /api/bills/:id/status
router.patch("/:id/status", authenticate, async (req: Request, res: Response) => {
  try {
    const billId = req.params.id as string;
    const { status } = req.body;
    const bill = await prisma.bill.update({
      where: { id: billId },
      data: { status },
    });
    res.json({ success: true, data: bill });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/bills/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const billId = req.params.id as string;
    await prisma.bill.delete({ where: { id: billId } });
    res.json({ success: true, message: "Bill deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
