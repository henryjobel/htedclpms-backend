import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads", "design")
  : path.join(process.cwd(), "uploads", "design");

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch {
  // Gracefully ignore filesystem errors in read-only serverless lambdas
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const safeBase = path.basename(file.originalname || "document", ext).replace(/[^a-zA-Z0-9-]+/g, "-").slice(0, 40);
      cb(null, `${Date.now()}-${safeBase || "document"}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function optionalDate(value: unknown) {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeConsultantData(body: Record<string, unknown>): Prisma.DesignConsultantUncheckedCreateInput {
  return {
    name: String(body.name || "Unnamed Consultant"),
    company: optionalString(body.company),
    consultantType: String(body.consultantType || "Architect"),
    specialty: optionalString(body.specialty),
    phone: optionalString(body.phone),
    email: optionalString(body.email),
    address: optionalString(body.address),
    licenseNo: optionalString(body.licenseNo),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

function normalizeDesignRecordData(body: Record<string, unknown>): Prisma.ProjectDesignRecordUncheckedCreateInput {
  return {
    projectId: String(body.projectId),
    consultantId: optionalString(body.consultantId),
    category: String(body.category || "Architectural Design"),
    title: String(body.title || "Untitled Design Record"),
    status: String(body.status || "PENDING"),
    submissionDate: optionalDate(body.submissionDate),
    approvalDate: optionalDate(body.approvalDate),
    feeAmount: Number(body.feeAmount || 0),
    paidAmount: Number(body.paidAmount || 0),
    documentUrl: optionalString(body.documentUrl),
    remarks: optionalString(body.remarks),
  };
}

router.get("/consultants", authenticate, async (_req: Request, res: Response) => {
  try {
    const consultants = await prisma.designConsultant.findMany({
      orderBy: { createdAt: "desc" },
      include: { designRecords: { select: { id: true, projectId: true, status: true, feeAmount: true, paidAmount: true } } },
    });
    res.json({ success: true, data: consultants });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/consultants", authenticate, async (req: Request, res: Response) => {
  try {
    const consultant = await prisma.designConsultant.create({ data: normalizeConsultantData(req.body) });
    res.status(201).json({ success: true, data: consultant });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/consultants/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const consultant = await prisma.designConsultant.update({
      where: { id: req.params.id as string },
      data: normalizeConsultantData(req.body) as Prisma.DesignConsultantUncheckedUpdateInput,
    });
    res.json({ success: true, data: consultant });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/consultants/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.designConsultant.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    res.json({ success: true, message: "Consultant deactivated" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upload", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });
  res.status(201).json({
    success: true,
    data: {
      fileUrl: `/uploads/design/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
});

router.get("/records", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, status, category } = req.query;
    const where: Prisma.ProjectDesignRecordWhereInput = {
      ...(projectId ? { projectId: String(projectId) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(category ? { category: String(category) } : {}),
    };
    const records = await prisma.projectDesignRecord.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        consultant: { select: { id: true, name: true, company: true, consultantType: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: records });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/records", authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.body.projectId) return res.status(400).json({ error: "projectId is required" });
    const record = await prisma.projectDesignRecord.create({ data: normalizeDesignRecordData(req.body) });
    res.status(201).json({ success: true, data: record });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/records/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const record = await prisma.projectDesignRecord.update({
      where: { id: req.params.id as string },
      data: normalizeDesignRecordData(req.body) as Prisma.ProjectDesignRecordUncheckedUpdateInput,
    });
    res.json({ success: true, data: record });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/records/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.projectDesignRecord.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: "Design record deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
