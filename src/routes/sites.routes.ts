import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function normalizeSiteData(body: Record<string, unknown>): Prisma.ProjectSiteCreateInput {
  const { projectId, name, address, area, areaUnit, siteType, status, description } = body;
  return {
    name: String(name || "Untitled Site"),
    address: toOptionalString(address),
    area: area !== undefined ? Number(area || 0) : undefined,
    areaUnit: toOptionalString(areaUnit),
    siteType: String(siteType || "Construction"),
    status: String(status || "Active"),
    description: toOptionalString(description),
    project: projectId ? { connect: { id: String(projectId) } } : undefined,
  };
}

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where = projectId ? { projectId: String(projectId) } : {};
    const sites = await prisma.projectSite.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: sites });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const site = await prisma.projectSite.create({ data: normalizeSiteData(req.body) });
    res.status(201).json({ success: true, data: site });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const site = await prisma.projectSite.update({
      where: { id: req.params.id as string },
      data: normalizeSiteData(req.body) as Prisma.ProjectSiteUpdateInput,
    });
    res.json({ success: true, data: site });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.projectSite.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;
