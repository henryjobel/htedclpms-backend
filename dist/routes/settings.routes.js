"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
const defaultSettings = {
    company: {
        name: "HET Real Estate & Construction",
        address: "Gulshan-2, Dhaka-1212, Bangladesh",
        phone: "+880 1700-000000",
        email: "info@hetpms.com",
        tin: "123456789",
    },
    notifications: {
        lowStock: true,
        overdueInstallment: true,
        voucherApproval: false,
        dailySummary: true,
        projectMilestone: true,
    },
    preferences: {
        currency: "BDT (Tk)",
        dateFormat: "DD/MM/YYYY",
        fyStart: "July",
    },
    invoice: {
        prefix: "INV",
        quotePrefix: "QT",
        billPrefix: "BL",
        workOrderPrefix: "WO",
    },
    reports: {
        showLogo: true,
        footerText: "System generated report",
        defaultFormat: "PDF",
    },
};
router.get("/system", auth_1.authenticate, async (_req, res) => {
    try {
        const rows = await prisma_1.prisma.systemSetting.findMany();
        const data = { ...defaultSettings };
        rows.forEach((row) => {
            data[row.key] = row.valueJson;
        });
        res.json({ success: true, data });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.put("/system", auth_1.authenticate, async (req, res) => {
    try {
        const payload = req.body;
        const entries = Object.entries(payload);
        await Promise.all(entries.map(([key, valueJson]) => prisma_1.prisma.systemSetting.upsert({
            where: { key },
            update: { valueJson: valueJson },
            create: { key, valueJson: valueJson },
        })));
        res.json({ success: true, message: "Settings saved" });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=settings.routes.js.map