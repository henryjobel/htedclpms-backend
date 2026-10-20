import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function validateInvestment(body: Record<string, unknown>) {
  const amount = Number(body.amount ?? 0);
  const percentage = Number(body.percentage ?? 0);
  if (!body.investorId || !body.projectId) return "investorId and projectId are required";
  if (!Number.isFinite(amount) || amount < 0) return "amount must be a non-negative number";
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return "percentage must be between 0 and 100";
  return null;
}

// ── Investors ────────────────────────────────────────────────────────
router.get("/investors", authenticate, async (_req: Request, res: Response) => {
  try {
    const investors = await prisma.investor.findMany({
      include: { investments: { include: { project: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: investors });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/investors", authenticate, async (req: Request, res: Response) => {
  try {
    const investor = await prisma.investor.create({ data: req.body });
    res.status(201).json({ success: true, data: investor });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/investors/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const investor = await prisma.investor.update({ where: { id: req.params.id as string }, data: req.body });
    res.json({ success: true, data: investor });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/investors/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const investorId = req.params.id as string;
    await prisma.$transaction([
      prisma.shareAssignment.deleteMany({ where: { investorId } }),
      prisma.projectInvestment.deleteMany({ where: { investorId } }),
      prisma.investor.delete({ where: { id: investorId } }),
    ]);
    res.json({ success: true });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

// ── Project Investments ──────────────────────────────────────────────
router.get("/investments", authenticate, async (_req: Request, res: Response) => {
  try {
    const investments = await prisma.projectInvestment.findMany({
      include: {
        investor: { select: { id: true, name: true, phone: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: investments });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/investments", authenticate, async (req: Request, res: Response) => {
  try {
    const validationError = validateInvestment(req.body as Record<string, unknown>);
    if (validationError) return res.status(400).json({ error: validationError });
    const investment = await prisma.projectInvestment.create({ data: req.body });
    res.status(201).json({ success: true, data: investment });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/investments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const validationError = validateInvestment(req.body as Record<string, unknown>);
    if (validationError) return res.status(400).json({ error: validationError });
    const investment = await prisma.projectInvestment.update({ where: { id: req.params.id as string }, data: req.body });
    res.json({ success: true, data: investment });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/investments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.projectInvestment.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;
