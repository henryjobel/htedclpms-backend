"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const system_settings_1 = require("../lib/system-settings");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
const masterDefinitions = {
    companies: { key: "companies", label: "Company" },
    financial_years: { key: "financial_years", label: "Financial Year" },
    currencies: { key: "currencies", label: "Currency" },
    invoice_settings: { key: "invoice_settings", label: "Invoice Setting" },
    report_settings: { key: "report_settings", label: "Report Setting" },
    sms_settings: { key: "sms_settings", label: "SMS Setting" },
    chart_groups: { key: "chart_groups", label: "Chart Group" },
    cheque_ranges: { key: "cheque_ranges", label: "Cheque Range" },
    departments: { key: "hrm_departments", label: "Department" },
    designations: { key: "hrm_designations", label: "Designation" },
    shifts: { key: "hrm_shifts", label: "Shift" },
    sections: { key: "hrm_sections", label: "Section" },
    units: { key: "hrm_units", label: "Unit" },
    employees: { key: "hrm_employees", label: "Employee" },
};
router.get("/definitions", auth_1.authenticate, (_req, res) => {
    res.json({ success: true, data: masterDefinitions });
});
router.get("/company-profile", auth_1.authenticate, async (_req, res) => {
    const data = await (0, system_settings_1.getSetting)("company_profile", {
        companyName: "HET Real Estate & Construction",
        address: "Dhaka, Bangladesh",
        phone: "+8801700000000",
        email: "info@hetpms.com",
        website: "",
        taxId: "",
        tradeLicense: "",
    });
    res.json({ success: true, data });
});
router.put("/company-profile", auth_1.authenticate, async (req, res) => {
    await (0, system_settings_1.saveSetting)("company_profile", req.body);
    await (0, system_settings_1.appendActivityLog)({
        action: "UPDATE",
        module: "COMPANY_PROFILE",
        message: "Updated company profile",
        userId: req.user?.id,
        userEmail: req.user?.email,
    });
    res.json({ success: true, message: "Company profile saved" });
});
router.get("/account-summaries/customers", auth_1.authenticate, async (_req, res) => {
    try {
        const installments = await prisma_1.prisma.installment.findMany({
            include: { project: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });
        const grouped = installments.reduce((acc, row) => {
            const key = `${row.client}|${row.clientPhone ?? ""}`;
            if (!acc[key]) {
                acc[key] = {
                    client: row.client,
                    phone: row.clientPhone ?? "",
                    projects: new Set(),
                    totalAmount: 0,
                    paidAmount: 0,
                };
            }
            acc[key].projects.add(row.project.name);
            acc[key].totalAmount += row.totalAmount;
            acc[key].paidAmount += row.paid;
            return acc;
        }, {});
        const data = Object.values(grouped).map((row) => ({
            ...row,
            projects: Array.from(row.projects).join(", "),
            dueAmount: row.totalAmount - row.paidAmount,
        }));
        res.json({ success: true, data });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/:masterKey", auth_1.authenticate, async (req, res) => {
    const masterKey = String(req.params.masterKey);
    const definition = masterDefinitions[masterKey];
    if (!definition)
        return res.status(404).json({ error: "Master data not found" });
    const data = await (0, system_settings_1.getSettingList)(definition.key);
    res.json({ success: true, data });
});
router.post("/:masterKey", auth_1.authenticate, async (req, res) => {
    const masterKey = String(req.params.masterKey);
    const definition = masterDefinitions[masterKey];
    if (!definition)
        return res.status(404).json({ error: "Master data not found" });
    const item = await (0, system_settings_1.createSettingListItem)(definition.key, req.body);
    await (0, system_settings_1.appendActivityLog)({
        action: "CREATE",
        module: definition.label.toUpperCase().replace(/\s+/g, "_"),
        message: `Created ${definition.label} ${String(item.name ?? item.code ?? item.id)}`,
        userId: req.user?.id,
        userEmail: req.user?.email,
    });
    res.status(201).json({ success: true, data: item });
});
router.put("/:masterKey/:id", auth_1.authenticate, async (req, res) => {
    const masterKey = String(req.params.masterKey);
    const itemId = String(req.params.id);
    const definition = masterDefinitions[masterKey];
    if (!definition)
        return res.status(404).json({ error: "Master data not found" });
    const item = await (0, system_settings_1.updateSettingListItem)(definition.key, itemId, req.body);
    if (!item)
        return res.status(404).json({ error: "Record not found" });
    await (0, system_settings_1.appendActivityLog)({
        action: "UPDATE",
        module: definition.label.toUpperCase().replace(/\s+/g, "_"),
        message: `Updated ${definition.label} ${String(item.name ?? item.code ?? item.id)}`,
        userId: req.user?.id,
        userEmail: req.user?.email,
    });
    res.json({ success: true, data: item });
});
router.delete("/:masterKey/:id", auth_1.authenticate, async (req, res) => {
    const masterKey = String(req.params.masterKey);
    const itemId = String(req.params.id);
    const definition = masterDefinitions[masterKey];
    if (!definition)
        return res.status(404).json({ error: "Master data not found" });
    const removed = await (0, system_settings_1.deleteSettingListItem)(definition.key, itemId);
    if (!removed)
        return res.status(404).json({ error: "Record not found" });
    await (0, system_settings_1.appendActivityLog)({
        action: "DELETE",
        module: definition.label.toUpperCase().replace(/\s+/g, "_"),
        message: `Deleted ${definition.label}`,
        userId: req.user?.id,
        userEmail: req.user?.email,
    });
    res.json({ success: true, message: "Deleted" });
});
router.get("/account-summaries/suppliers", auth_1.authenticate, async (_req, res) => {
    try {
        const suppliers = await prisma_1.prisma.supplier.findMany({
            include: {
                purchaseOrders: true,
                bills: true,
                products: true,
            },
            orderBy: { name: "asc" },
        });
        const data = suppliers.map((supplier) => {
            const totalPO = supplier.purchaseOrders.reduce((sum, row) => sum + row.totalAmount, 0);
            const totalBills = supplier.bills.reduce((sum, row) => sum + row.amount, 0);
            const unpaidBills = supplier.bills.filter((row) => row.status === "unpaid").reduce((sum, row) => sum + row.amount, 0);
            return {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.phone ?? "",
                email: supplier.email ?? "",
                products: supplier.products.length,
                totalPO,
                totalBills,
                unpaidBills,
            };
        });
        res.json({ success: true, data });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=masters.routes.js.map