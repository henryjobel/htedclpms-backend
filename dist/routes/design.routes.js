"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const multer_1 = __importDefault(require("multer"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const uploadDir = process.env.VERCEL
    ? path_1.default.join(os_1.default.tmpdir(), "uploads", "design")
    : path_1.default.join(process.cwd(), "uploads", "design");
try {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
catch {
    // Gracefully ignore filesystem errors in read-only serverless lambdas
}
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname || "");
            const safeBase = path_1.default.basename(file.originalname || "document", ext).replace(/[^a-zA-Z0-9-]+/g, "-").slice(0, 40);
            cb(null, `${Date.now()}-${safeBase || "document"}${ext}`);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
});
function optionalString(value) {
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}
function optionalDate(value) {
    if (!value)
        return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function normalizeConsultantData(body) {
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
function normalizeDesignRecordData(body) {
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
router.get("/consultants", auth_1.authenticate, async (_req, res) => {
    try {
        const consultants = await prisma_1.prisma.designConsultant.findMany({
            orderBy: { createdAt: "desc" },
            include: { designRecords: { select: { id: true, projectId: true, status: true, feeAmount: true, paidAmount: true } } },
        });
        res.json({ success: true, data: consultants });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/consultants", auth_1.authenticate, async (req, res) => {
    try {
        const consultant = await prisma_1.prisma.designConsultant.create({ data: normalizeConsultantData(req.body) });
        res.status(201).json({ success: true, data: consultant });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/consultants/:id", auth_1.authenticate, async (req, res) => {
    try {
        const consultant = await prisma_1.prisma.designConsultant.update({
            where: { id: req.params.id },
            data: normalizeConsultantData(req.body),
        });
        res.json({ success: true, data: consultant });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.delete("/consultants/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.designConsultant.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        res.json({ success: true, message: "Consultant deactivated" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/upload", auth_1.authenticate, upload.single("file"), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: "file is required" });
    res.status(201).json({
        success: true,
        data: {
            fileUrl: `/uploads/design/${req.file.filename}`,
            originalName: req.file.originalname,
            size: req.file.size,
        },
    });
});
router.get("/records", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId, status, category } = req.query;
        const where = {
            ...(projectId ? { projectId: String(projectId) } : {}),
            ...(status ? { status: String(status) } : {}),
            ...(category ? { category: String(category) } : {}),
        };
        const records = await prisma_1.prisma.projectDesignRecord.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
                consultant: { select: { id: true, name: true, company: true, consultantType: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: records });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/records", auth_1.authenticate, async (req, res) => {
    try {
        if (!req.body.projectId)
            return res.status(400).json({ error: "projectId is required" });
        const record = await prisma_1.prisma.projectDesignRecord.create({ data: normalizeDesignRecordData(req.body) });
        res.status(201).json({ success: true, data: record });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/records/:id", auth_1.authenticate, async (req, res) => {
    try {
        const record = await prisma_1.prisma.projectDesignRecord.update({
            where: { id: req.params.id },
            data: normalizeDesignRecordData(req.body),
        });
        res.json({ success: true, data: record });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.delete("/records/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.projectDesignRecord.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: "Design record deleted" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=design.routes.js.map