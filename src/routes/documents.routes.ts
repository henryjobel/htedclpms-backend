import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function normalizeDocumentData(body: Record<string, unknown>): Prisma.ProjectDocumentCreateInput {
  const { projectId, title, documentType, fileUrl, description, uploadedBy } = body;
  return {
    title: String(title || "Untitled Document"),
    documentType: String(documentType || "General"),
    fileUrl: toOptionalString(fileUrl),
    description: toOptionalString(description),
    uploadedBy: toOptionalString(uploadedBy),
    project: projectId ? { connect: { id: String(projectId) } } : undefined,
  };
}

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where = projectId ? { projectId: String(projectId) } : {};
    const docs = await prisma.projectDocument.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: docs });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const doc = await prisma.projectDocument.create({ data: normalizeDocumentData(req.body) });
    res.status(201).json({ success: true, data: doc });
  } catch (err: unknown) { res.status(400).json({ error: (err as Error).message }); }
});

router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const doc = await prisma.projectDocument.update({
      where: { id: req.params.id as string },
      data: normalizeDocumentData(req.body) as Prisma.ProjectDocumentUpdateInput,
    });
    res.json({ success: true, data: doc });
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.projectDocument.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;
