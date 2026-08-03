"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function toOptionalString(value) {
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
function normalizeDocumentData(body) {
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
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.query;
        const where = projectId ? { projectId: String(projectId) } : {};
        const docs = await prisma_1.prisma.projectDocument.findMany({
            where,
            include: { project: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: docs });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const doc = await prisma_1.prisma.projectDocument.create({ data: normalizeDocumentData(req.body) });
        res.status(201).json({ success: true, data: doc });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const doc = await prisma_1.prisma.projectDocument.update({
            where: { id: req.params.id },
            data: normalizeDocumentData(req.body),
        });
        res.json({ success: true, data: doc });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.projectDocument.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=documents.routes.js.map