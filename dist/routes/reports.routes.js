"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
function toCsv(headers, rows) {
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}
router.get("/export/:type", auth_1.authenticate, async (req, res) => {
    try {
        const { type } = req.params;
        let filename = `${type}.csv`;
        let csv = "";
        if (type === "projects") {
            const rows = await prisma_1.prisma.project.findMany({ orderBy: { createdAt: "desc" } });
            csv = toCsv(["Name", "Location", "Type", "Status", "Budget", "Start Date", "End Date", "Manager"], rows.map((row) => [row.name, row.location, row.type, row.status, row.budget, row.startDate.toISOString(), row.endDate.toISOString(), row.manager]));
        }
        else if (type === "financial") {
            const rows = await prisma_1.prisma.voucher.findMany({
                include: { project: { select: { name: true } }, createdBy: { select: { name: true } } },
                orderBy: { voucherDate: "desc" },
            });
            csv = toCsv(["Voucher No", "Type", "Project", "Amount", "Status", "Date", "Created By", "Description"], rows.map((row) => [row.voucherNo, row.type, row.project?.name ?? "General", row.amount, row.status, row.voucherDate.toISOString(), row.createdBy.name, row.description ?? ""]));
        }
        else if (type === "inventory") {
            const rows = await prisma_1.prisma.product.findMany({
                where: { isActive: true },
                include: { supplier: { select: { name: true } } },
                orderBy: { name: "asc" },
            });
            csv = toCsv(["Name", "Category", "Unit", "Stock", "Min Stock", "Purchase Price", "Supplier"], rows.map((row) => [row.name, row.category, row.unit, row.stock, row.minStock, row.purchasePrice, row.supplier?.name ?? ""]));
        }
        else if (type === "installments") {
            const rows = await prisma_1.prisma.installment.findMany({
                include: { project: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
            });
            csv = toCsv(["Client", "Project", "Unit", "Total Amount", "Paid", "Status"], rows.map((row) => [row.client, row.project.name, row.unit, row.totalAmount, row.paid, row.status]));
        }
        else if (type === "grn") {
            const rows = await prisma_1.prisma.gRN.findMany({
                include: { po: { include: { supplier: { select: { name: true } } } } },
                orderBy: { createdAt: "desc" },
            });
            csv = toCsv(["GRN Number", "PO Number", "Supplier", "Received By", "Received Date", "Status"], rows.map((row) => [row.grnNumber, row.po.poNumber, row.po.supplier.name, row.receivedBy, row.receivedDate.toISOString(), row.status]));
        }
        else if (type === "profit-loss") {
            const projects = await prisma_1.prisma.project.findMany({
                include: { installments: true, projectExpenses: true, workerAssigns: true, contractorAssigns: true },
            });
            csv = toCsv(["Project", "Income", "Material Expense", "Labor Cost", "Contractor Cost", "Profit"], projects.map((project) => {
                const income = project.installments.reduce((a, i) => a + i.paid, 0);
                const materialExpense = project.projectExpenses.reduce((a, e) => a + e.amount, 0);
                const laborCost = project.workerAssigns.reduce((a, w) => a + w.totalWage, 0);
                const contractorCost = project.contractorAssigns.reduce((a, c) => a + c.paid, 0);
                const totalExpense = materialExpense + laborCost + contractorCost;
                return [project.name, income, materialExpense, laborCost, contractorCost, income - totalExpense];
            }));
            filename = "profit-loss.csv";
        }
        else {
            return res.status(404).json({ error: "Unknown export type" });
        }
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/operational", auth_1.authenticate, async (_req, res) => {
    try {
        const [installments, vouchers, bills, grns, workOrders, quotes, billingRecords] = await Promise.all([
            prisma_1.prisma.installment.findMany({ include: { project: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
            prisma_1.prisma.voucher.findMany({ include: { project: { select: { name: true } } }, orderBy: { voucherDate: "desc" }, take: 100 }),
            prisma_1.prisma.bill.findMany({ include: { project: { select: { name: true } }, supplier: { select: { name: true } }, contractor: { select: { name: true } } }, orderBy: { billDate: "desc" }, take: 100 }),
            prisma_1.prisma.gRN.findMany({ include: { po: { select: { poNumber: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
            prisma_1.prisma.workOrder.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
            prisma_1.prisma.quotation.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
            prisma_1.prisma.billingRecord.findMany({ include: { project: { select: { name: true } } }, orderBy: { billingDate: "desc" }, take: 100 }),
        ]);
        const receipts = vouchers.filter((row) => row.type === "RECEIPT");
        const payments = vouchers.filter((row) => row.type === "PAYMENT");
        const expenses = bills.filter((row) => row.type.toLowerCase().includes("expense") || row.status === "paid");
        const payables = bills.filter((row) => row.status === "unpaid");
        const receivables = installments.filter((row) => row.totalAmount > row.paid);
        res.json({
            success: true,
            data: {
                summary: {
                    totalReceipts: receipts.reduce((sum, row) => sum + row.amount, 0),
                    totalPayments: payments.reduce((sum, row) => sum + row.amount, 0),
                    totalExpenses: expenses.reduce((sum, row) => sum + row.amount, 0),
                    totalPayables: payables.reduce((sum, row) => sum + row.amount, 0),
                    totalReceivables: receivables.reduce((sum, row) => sum + (row.totalAmount - row.paid), 0),
                    totalGRNs: grns.length,
                    totalQuotes: quotes.length,
                    totalWorkOrders: workOrders.length,
                },
                installments,
                receipts,
                payments,
                expenses: bills,
                payables,
                receivables: receivables.map((row) => ({
                    id: row.id,
                    client: row.client,
                    project: row.project.name,
                    unit: row.unit,
                    totalAmount: row.totalAmount,
                    paid: row.paid,
                    dueAmount: row.totalAmount - row.paid,
                    status: row.status,
                })),
                grns,
                workOrders,
                quotes,
                billingRecords,
            },
        });
    }
    catch {
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=reports.routes.js.map