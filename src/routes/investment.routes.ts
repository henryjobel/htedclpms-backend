import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

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
    const investment = await prisma.projectInvestment.create({ data: req.body });
    res.status(201).json({ success: true, data: investment });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/investments/:id", authenticate, async (req: Request, res: Response) => {
  try {
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
