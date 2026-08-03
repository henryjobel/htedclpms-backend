"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function toOptionalString(value) {
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
function normalizeSiteData(body) {
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
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.query;
        const where = projectId ? { projectId: String(projectId) } : {};
        const sites = await prisma_1.prisma.projectSite.findMany({
            where,
            include: { project: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: sites });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const site = await prisma_1.prisma.projectSite.create({ data: normalizeSiteData(req.body) });
        res.status(201).json({ success: true, data: site });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const site = await prisma_1.prisma.projectSite.update({
            where: { id: req.params.id },
            data: normalizeSiteData(req.body),
        });
        res.json({ success: true, data: site });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:id", auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.projectSite.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=sites.routes.js.map