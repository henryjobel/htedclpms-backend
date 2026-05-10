import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";

const router = Router();


async function getEligibleApprovalRoles(module: string, amount: number) {
  const layers = await prisma.approvalLayer.findMany({
    where: { module, isActive: true },
    orderBy: { level: "asc" },
  });

  return layers
    .filter((layer) => {
      const minOk = layer.minAmount == null || amount >= layer.minAmount;
      const maxOk = layer.maxAmount == null || amount <= layer.maxAmount;
      return minOk && maxOk;
    })
    .map((layer) => layer.roleName);
}

async function logApprovalAction(params: {
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  actedById?: string;
  amount?: number;
  remarks?: string;
}) {
  await prisma.approvalLog.create({ data: params });
}

function formatMonthKey(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function buildCashFlowSeries(
  schedules: Array<{ paidDate: Date | null; paidAmount: number }>,
  bills: Array<{ billDate: Date; amount: number; status: string }>
) {
  const monthMap: Record<string, { inflow: number; outflow: number }> = {};

  schedules.forEach((schedule) => {
    if (!schedule.paidDate) return;
    const key = formatMonthKey(new Date(schedule.paidDate));
    if (!monthMap[key]) monthMap[key] = { inflow: 0, outflow: 0 };
    monthMap[key].inflow += schedule.paidAmount;
  });

  bills.forEach((bill) => {
    if (bill.status !== "paid") return;
    const key = formatMonthKey(new Date(bill.billDate));
    if (!monthMap[key]) monthMap[key] = { inflow: 0, outflow: 0 };
    monthMap[key].outflow += bill.amount;
  });

  return Object.entries(monthMap).map(([month, { inflow, outflow }]) => ({
    month,
    inflow,
    outflow,
    income: inflow,
    expense: outflow,
    net: inflow - outflow,
  }));
}

// GET /api/accounts/chart
router.get("/chart", authenticate, async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });
    res.json({ success: true, data: accounts });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/chart
router.post("/chart", authenticate, async (req: Request, res: Response) => {
  try {
    const account = await prisma.account.create({ data: req.body });
    res.status(201).json({ success: true, data: account });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/accounts/chart/:id
router.put("/chart/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const accountId = req.params.id as string;
    const account = await prisma.account.update({ where: { id: accountId }, data: req.body });
    res.json({ success: true, data: account });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/accounts/chart/:id
router.delete("/chart/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const accountId = req.params.id as string;
    await prisma.account.update({ where: { id: accountId }, data: { isActive: false } });
    res.json({ success: true, message: "Account deactivated" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/vouchers
router.get("/vouchers", authenticate, async (req: Request, res: Response) => {
  try {
    const { type, projectId, status, startDate, endDate } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.voucherDate = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        project: { select: { name: true } },
        createdBy: { select: { name: true } },
        ledgerEntries: { include: { account: true } },
      },
      orderBy: { voucherDate: "desc" },
    });

    res.json({ success: true, data: vouchers });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/vouchers
router.post("/vouchers", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, projectId, amount, description, entries } = req.body;
    const voucherNo = `V-${Date.now()}`;

    const voucher = await prisma.voucher.create({
      data: {
        voucherNo,
        type,
        projectId,
        amount,
        description,
        userId: req.user!.id,
        ledgerEntries: { create: entries },
      },
      include: { ledgerEntries: true },
    });

    res.status(201).json({ success: true, data: voucher });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/accounts/vouchers/:id/approve
router.patch("/vouchers/:id/approve", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const voucherId = req.params.id as string;
    const existingVoucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
    if (!existingVoucher) return res.status(404).json({ error: "Voucher not found" });

    const eligibleRoles = await getEligibleApprovalRoles("VOUCHER", existingVoucher.amount);
    if (eligibleRoles.length > 0 && !eligibleRoles.includes(req.user!.role)) {
      return res.status(403).json({ error: "Your role is not allowed to approve this voucher" });
    }

    const voucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: { status: "approved" },
    });

    await logApprovalAction({
      module: "VOUCHER",
      entityType: "Voucher",
      entityId: voucher.id,
      action: "APPROVE",
      status: "approved",
      actedById: req.user!.id,
      amount: voucher.amount,
      remarks: req.body.remarks,
    });
    res.json({ success: true, data: voucher });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/approval-logs
router.get("/approval-logs", authenticate, async (req: Request, res: Response) => {
  try {
    const { module, entityType, entityId } = req.query;
    const where: Record<string, unknown> = {};
    if (module) where.module = module;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const rows = await prisma.approvalLog.findMany({
      where,
      include: {
        actedBy: { select: { name: true, email: true, role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/accounts/vouchers/:id
router.delete("/vouchers/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const voucherId = req.params.id as string;
    await prisma.voucher.delete({ where: { id: voucherId } });
    res.json({ success: true, message: "Voucher deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/ledger
router.get("/ledger", authenticate, async (req: Request, res: Response) => {
  try {
    const { accountId, projectId, startDate, endDate } = req.query;
    const where: Record<string, unknown> = {};
    if (accountId) where.accountId = accountId;
    if (projectId) where.projectId = projectId;
    if (startDate && endDate) {
      where.entryDate = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      include: {
        account: true,
        project: { select: { name: true } },
        voucher: { select: { voucherNo: true, type: true } },
      },
      orderBy: { entryDate: "desc" },
    });

    res.json({ success: true, data: entries });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/installments
router.get("/installments", authenticate, async (_req: Request, res: Response) => {
  try {
    const installments = await prisma.installment.findMany({
      include: {
        project: { select: { name: true } },
        schedule: { orderBy: { dueDate: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: installments });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/installments
router.post("/installments", authenticate, async (req: Request, res: Response) => {
  try {
    const { client, clientPhone, projectId, unit, totalAmount, schedule } = req.body;
    const installment = await prisma.installment.create({
      data: {
        client,
        clientPhone,
        projectId,
        unit,
        totalAmount,
        schedule: { create: schedule },
      },
      include: { schedule: true },
    });
    res.status(201).json({ success: true, data: installment });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/installments/:id/pay
router.post("/installments/:id/pay", authenticate, async (req: Request, res: Response) => {
  try {
    const { scheduleId, amount, paidDate } = req.body;
    const installmentId = req.params.id as string;

    await Promise.all([
      prisma.installmentSchedule.update({
        where: { id: scheduleId },
        data: { paidAmount: amount, paidDate: new Date(paidDate), status: "paid" },
      }),
      prisma.installment.update({
        where: { id: installmentId },
        data: { paid: { increment: amount } },
      }),
    ]);

    res.json({ success: true, message: "Payment recorded" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/accounts/installments/:id
router.delete("/installments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const installmentId = req.params.id as string;
    await prisma.installment.delete({ where: { id: installmentId } });
    res.json({ success: true, message: "Installment deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/bank-accounts
router.get("/bank-accounts", authenticate, async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      include: { transactions: { orderBy: { transDate: "desc" }, take: 5 } },
    });
    res.json({ success: true, data: accounts });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/bank-transactions
router.post("/bank-transactions", authenticate, async (req: Request, res: Response) => {
  try {
    const account = await prisma.bankAccount.findUnique({
      where: { id: req.body.bankAccountId as string },
    });
    if (!account) return res.status(404).json({ error: "Bank account not found" });

    const amount = Number(req.body.amount || 0);
    const isCredit = String(req.body.type || "").toLowerCase() === "credit";
    const nextBalance = isCredit ? account.balance + amount : account.balance - amount;

    const transaction = await prisma.bankTransaction.create({
      data: {
        bankAccountId: account.id,
        type: isCredit ? "credit" : "debit",
        amount,
        description: req.body.description,
        balance: nextBalance,
        transDate: req.body.transDate ? new Date(req.body.transDate) : new Date(),
      },
    });

    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { balance: nextBalance },
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/accounts/cash-book
router.get("/cash-book", authenticate, async (req: Request, res: Response) => {
  try {
    const { bankAccountId, type, startDate, endDate } = req.query;
    const where: Record<string, unknown> = {};
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (type) where.type = String(type).toLowerCase();
    if (startDate && endDate) {
      where.transDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const rows = await prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: { select: { id: true, name: true, bankName: true, type: true } },
      },
      orderBy: { transDate: "desc" },
    });

    res.json({
      success: true,
      data: {
        rows,
        totalCredit: rows.filter((row) => row.type === "credit").reduce((sum, row) => sum + row.amount, 0),
        totalDebit: rows.filter((row) => row.type === "debit").reduce((sum, row) => sum + row.amount, 0),
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/bank-accounts
router.post("/bank-accounts", authenticate, async (req: Request, res: Response) => {
  try {
    const account = await prisma.bankAccount.create({
      data: {
        ...req.body,
        balance: Number(req.body.balance || 0),
      },
    });
    res.status(201).json({ success: true, data: account });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/accounts/bank-reconciliations
router.get("/bank-reconciliations", authenticate, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.bankReconciliation.findMany({
      include: {
        bankAccount: { select: { name: true, bankName: true, accountNo: true } },
      },
      orderBy: { statementDate: "desc" },
    });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/bank-reconciliations
router.post("/bank-reconciliations", authenticate, async (req: Request, res: Response) => {
  try {
    const bookBalance = Number(req.body.bookBalance || 0);
    const statementBalance = Number(req.body.statementBalance || 0);
    const item = await prisma.bankReconciliation.create({
      data: {
        ...req.body,
        statementDate: req.body.statementDate ? new Date(req.body.statementDate) : new Date(),
        bookBalance,
        statementBalance,
        difference: statementBalance - bookBalance,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/accounts/bank-reconciliations/:id
router.put("/bank-reconciliations/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const bookBalance = Number(req.body.bookBalance || 0);
    const statementBalance = Number(req.body.statementBalance || 0);
    const item = await prisma.bankReconciliation.update({
      where: { id: req.params.id as string },
      data: {
        ...req.body,
        statementDate: req.body.statementDate ? new Date(req.body.statementDate) : undefined,
        bookBalance,
        statementBalance,
        difference: statementBalance - bookBalance,
      },
    });
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/accounts/bank-reconciliations/:id
router.delete("/bank-reconciliations/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.bankReconciliation.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: "Bank reconciliation deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/cheques
router.get("/cheques", authenticate, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.chequeEntry.findMany({
      include: {
        bankAccount: { select: { name: true, bankName: true, accountNo: true } },
      },
      orderBy: { chequeDate: "desc" },
    });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/accounts/cheques
router.post("/cheques", authenticate, async (req: Request, res: Response) => {
  try {
    const item = await prisma.chequeEntry.create({
      data: {
        ...req.body,
        amount: Number(req.body.amount || 0),
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
        chequeDate: req.body.chequeDate ? new Date(req.body.chequeDate) : new Date(),
        clearedDate: req.body.clearedDate ? new Date(req.body.clearedDate) : undefined,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /api/accounts/cheques/:id
router.put("/cheques/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const item = await prisma.chequeEntry.update({
      where: { id: req.params.id as string },
      data: {
        ...req.body,
        amount: Number(req.body.amount || 0),
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        chequeDate: req.body.chequeDate ? new Date(req.body.chequeDate) : undefined,
        clearedDate: req.body.clearedDate ? new Date(req.body.clearedDate) : undefined,
      },
    });
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/accounts/cheques/:id
router.delete("/cheques/:id", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.chequeEntry.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: "Cheque deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/profit-loss
router.get("/profit-loss", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        include: {
          installments: true,
          projectExpenses: true,
          workerAssigns: true,
          contractorAssigns: true,
        },
      });

      if (!project) return res.status(404).json({ error: "Project not found" });

      const income = project.installments.reduce((a, i) => a + i.paid, 0);
      const materialExpense = project.projectExpenses.reduce((a, e) => a + e.amount, 0);
      const laborCost = project.workerAssigns.reduce((a, w) => a + w.totalWage, 0);
      const contractorCost = project.contractorAssigns.reduce((a, c) => a + c.paid, 0);
      const totalExpense = materialExpense + laborCost + contractorCost;

      return res.json({
        success: true,
        data: {
          projectId,
          projectName: project.name,
          income,
          materialExpense,
          laborCost,
          contractorCost,
          totalExpense,
          profit: income - totalExpense,
          margin: income > 0 ? ((income - totalExpense) / income) * 100 : 0,
        },
      });
    }

    res.json({ success: true, data: { message: "Add projectId for project P&L" } });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/balance-sheet
router.get("/balance-sheet", authenticate, async (_req: Request, res: Response) => {
  try {
    const [accounts, bankAccounts, installments, bills] = await Promise.all([
      prisma.account.findMany({ where: { isActive: true } }),
      prisma.bankAccount.findMany({ where: { isActive: true } }),
      prisma.installment.findMany(),
      prisma.bill.findMany(),
    ]);

    const totalCash = bankAccounts.reduce((a, b) => a + b.balance, 0);
    const totalReceivable = installments.reduce((a, i) => a + (i.totalAmount - i.paid), 0);
    const totalPayable = bills.filter((b) => b.status === "unpaid").reduce((a, b) => a + b.amount, 0);
    const equity = totalCash + totalReceivable - totalPayable;

    const assets = [
      { name: "Cash & Bank", amount: totalCash },
      { name: "Accounts Receivable", amount: totalReceivable },
      ...accounts.filter((a) => a.type === "ASSET").map((a) => ({ name: a.name, amount: 0 })),
    ];
    const liabilities = [
      { name: "Accounts Payable", amount: totalPayable },
      ...accounts.filter((a) => a.type === "LIABILITY").map((a) => ({ name: a.name, amount: 0 })),
    ];

    res.json({
      success: true,
      data: {
        assets,
        liabilities,
        equity,
        totalAssets: assets.reduce((a, x) => a + x.amount, 0),
        totalLiabilities: liabilities.reduce((a, x) => a + x.amount, 0),
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/cash-flow
router.get("/cash-flow", authenticate, async (_req: Request, res: Response) => {
  try {
    const [installments, bills] = await Promise.all([
      prisma.installment.findMany({ include: { schedule: true } }),
      prisma.bill.findMany(),
    ]);

    const cashFlow = buildCashFlowSeries(
      installments.flatMap((inst) => inst.schedule),
      bills
    );

    res.json({ success: true, data: cashFlow });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/dashboard-summary
router.get("/dashboard-summary", authenticate, async (_req: Request, res: Response) => {
  try {
    const [projects, installments, bills, products, requisitions, rfqs, purchaseOrders] = await Promise.all([
      prisma.project.findMany({ include: { projectExpenses: true, installments: true } }),
      prisma.installment.findMany({ include: { schedule: true } }),
      prisma.bill.findMany({ where: { status: "unpaid" } }),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.materialRequisition.count({ where: { status: "PENDING" } }),
      prisma.rFQ.count({ where: { status: "PENDING" } }),
      prisma.purchaseOrder.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    ]);

    const paidBills = await prisma.bill.findMany({ where: { status: "paid" } });

    const totalIncome = installments.reduce((a, i) => a + i.paid, 0);
    const totalExpense = projects.flatMap((p) => p.projectExpenses).reduce((a, e) => a + e.amount, 0);
    const accountsPayable = bills.reduce((a, b) => a + b.amount, 0);
    const totalDue = installments.reduce((a, i) => a + (i.totalAmount - i.paid), 0);
    const lowStockItems = products.filter((p) => p.stock < p.minStock).length;
    const cashFlow = buildCashFlowSeries(
      installments.flatMap((inst) => inst.schedule),
      paidBills
    )
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime())
      .slice(-6);

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        runningProjects: projects.filter((p) => p.status === "ACTIVE").length,
        completedProjects: projects.filter((p) => p.status === "COMPLETED").length,
        totalBudget: projects.reduce((a, p) => a + p.budget, 0),
        totalIncome,
        totalExpense,
        totalProfit: totalIncome - totalExpense,
        accountsPayable,
        accountsReceivable: totalDue,
        totalDue,
        lowStockItems,
        pendingRequisitions: requisitions,
        pendingRFQ: rfqs,
        pendingPurchaseOrders: purchaseOrders,
        cashFlow,
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/sales-forecast
router.get("/sales-forecast", authenticate, async (req: Request, res: Response) => {
  try {
    const months = Math.min(parseInt((req.query.months as string) || "6", 10) || 6, 12);
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + months, 0, 23, 59, 59, 999);

    const installments = await prisma.installment.findMany({
      include: {
        project: { select: { id: true, name: true, totalUnits: true, soldUnits: true, budget: true } },
        schedule: true,
      },
    });

    const forecastMap: Record<string, { expected: number; overdue: number }> = {};
    const projectMap: Record<string, {
      projectId: string;
      projectName: string;
      totalUnits: number;
      soldUnits: number;
      unsoldUnits: number;
      totalReceivable: number;
      overdueReceivable: number;
      nextExpected: number;
      collectionRate: number;
    }> = {};

    for (let i = 0; i < months; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      forecastMap[formatMonthKey(d)] = { expected: 0, overdue: 0 };
    }

    installments.forEach((installment) => {
      const totalReceivable = installment.totalAmount - installment.paid;
      const overdueReceivable = installment.schedule
        .filter((s) => s.status !== "paid" && new Date(s.dueDate) < now)
        .reduce((sum, s) => sum + (s.amount - s.paidAmount), 0);
      const nextExpected = installment.schedule
        .filter((s) => s.status !== "paid" && new Date(s.dueDate) >= now && new Date(s.dueDate) <= endMonth)
        .reduce((sum, s) => sum + (s.amount - s.paidAmount), 0);

      if (!projectMap[installment.projectId]) {
        const unsoldUnits = Math.max(installment.project.totalUnits - installment.project.soldUnits, 0);
        projectMap[installment.projectId] = {
          projectId: installment.project.id,
          projectName: installment.project.name,
          totalUnits: installment.project.totalUnits,
          soldUnits: installment.project.soldUnits,
          unsoldUnits,
          totalReceivable: 0,
          overdueReceivable: 0,
          nextExpected: 0,
          collectionRate: 0,
        };
      }

      projectMap[installment.projectId].totalReceivable += totalReceivable;
      projectMap[installment.projectId].overdueReceivable += overdueReceivable;
      projectMap[installment.projectId].nextExpected += nextExpected;

      installment.schedule.forEach((schedule) => {
        if (schedule.status === "paid") return;
        const dueDate = new Date(schedule.dueDate);
        const amountLeft = schedule.amount - schedule.paidAmount;
        if (amountLeft <= 0) return;

        if (dueDate < now) {
          const currentKey = formatMonthKey(startMonth);
          if (!forecastMap[currentKey]) forecastMap[currentKey] = { expected: 0, overdue: 0 };
          forecastMap[currentKey].overdue += amountLeft;
          return;
        }

        if (dueDate > endMonth) return;
        const key = formatMonthKey(new Date(dueDate.getFullYear(), dueDate.getMonth(), 1));
        if (!forecastMap[key]) forecastMap[key] = { expected: 0, overdue: 0 };
        forecastMap[key].expected += amountLeft;
      });
    });

    const projectForecast = Object.values(projectMap)
      .map((project) => ({
        ...project,
        collectionRate:
          project.totalReceivable + project.nextExpected > 0
            ? ((project.nextExpected / (project.totalReceivable + project.nextExpected)) * 100)
            : 0,
      }))
      .sort((a, b) => b.nextExpected - a.nextExpected);

    const monthlyForecast = Object.entries(forecastMap).map(([month, values]) => ({
      month,
      expected: values.expected,
      overdue: values.overdue,
      total: values.expected + values.overdue,
    }));

    res.json({
      success: true,
      data: {
        monthlyForecast,
        projectForecast,
        summary: {
          totalExpected: monthlyForecast.reduce((sum, item) => sum + item.expected, 0),
          overdueAmount: monthlyForecast.reduce((sum, item) => sum + item.overdue, 0),
          totalOutstanding: projectForecast.reduce((sum, item) => sum + item.totalReceivable, 0),
          totalUnsoldUnits: projectForecast.reduce((sum, item) => sum + item.unsoldUnits, 0),
        },
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/trial-balance
router.get("/trial-balance", authenticate, async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { ledgerEntries: true },
      orderBy: { code: "asc" },
    });

    const rows = accounts.map((account) => {
      const debit = account.ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
      const credit = account.ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit,
        balance: debit - credit,
      };
    });

    res.json({
      success: true,
      data: {
        rows,
        totalDebit: rows.reduce((sum, row) => sum + row.debit, 0),
        totalCredit: rows.reduce((sum, row) => sum + row.credit, 0),
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/day-book
router.get("/day-book", authenticate, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const where: Record<string, unknown> = {};
    if (startDate && endDate) {
      where.entryDate = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      include: {
        account: { select: { code: true, name: true } },
        project: { select: { name: true } },
        voucher: { select: { voucherNo: true, type: true } },
      },
      orderBy: { entryDate: "desc" },
    });

    const rows = entries.map((entry) => ({
      id: entry.id,
      date: entry.entryDate,
      voucherNo: entry.voucher?.voucherNo ?? "—",
      voucherType: entry.voucher?.type ?? "—",
      account: `${entry.account.code} - ${entry.account.name}`,
      project: entry.project?.name ?? "General",
      description: entry.description ?? "—",
      debit: entry.debit,
      credit: entry.credit,
    }));

    res.json({
      success: true,
      data: {
        rows,
        totalDebit: rows.reduce((sum, row) => sum + row.debit, 0),
        totalCredit: rows.reduce((sum, row) => sum + row.credit, 0),
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/receive-payment-summary
router.get("/receive-payment-summary", authenticate, async (_req: Request, res: Response) => {
  try {
    const vouchers = await prisma.voucher.findMany({
      include: { project: { select: { name: true } } },
      orderBy: { voucherDate: "desc" },
    });

    const receipts = vouchers.filter((voucher) => voucher.type === "RECEIPT");
    const payments = vouchers.filter((voucher) => voucher.type === "PAYMENT");

    res.json({
      success: true,
      data: {
        receipts: receipts.map((voucher) => ({
          id: voucher.id,
          voucherNo: voucher.voucherNo,
          amount: voucher.amount,
          date: voucher.voucherDate,
          project: voucher.project?.name ?? "General",
          description: voucher.description ?? "—",
          status: voucher.status,
        })),
        payments: payments.map((voucher) => ({
          id: voucher.id,
          voucherNo: voucher.voucherNo,
          amount: voucher.amount,
          date: voucher.voucherDate,
          project: voucher.project?.name ?? "General",
          description: voucher.description ?? "—",
          status: voucher.status,
        })),
        totalReceipt: receipts.reduce((sum, voucher) => sum + voucher.amount, 0),
        totalPayment: payments.reduce((sum, voucher) => sum + voucher.amount, 0),
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/accounts/pending-approvals
router.get("/pending-approvals", authenticate, async (_req: Request, res: Response) => {
  try {
    const [vouchers, requisitions, purchaseOrders, billings] = await Promise.all([
      prisma.voucher.findMany({
        where: { status: "pending" },
        include: { project: { select: { name: true } }, createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.materialRequisition.findMany({
        where: { status: "PENDING" },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseOrder.findMany({
        where: { status: "SENT" },
        include: { supplier: { select: { name: true } }, project: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.billingRecord.findMany({
        where: { status: { in: ["DRAFT", "SUBMITTED"] } },
        include: { project: { select: { name: true } }, contractor: { select: { name: true } }, worker: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const rows = [
      ...vouchers.map((item) => ({
        id: item.id,
        module: "VOUCHER",
        type: item.type,
        reference: item.voucherNo,
        project: item.project?.name ?? "General",
        party: item.createdBy.name,
        amount: item.amount,
        status: item.status,
        createdAt: item.createdAt,
      })),
      ...requisitions.map((item) => ({
        id: item.id,
        module: "PURCHASE",
        type: "REQUISITION",
        reference: item.id.slice(0, 8),
        project: item.project.name,
        party: item.requestedBy,
        amount: 0,
        status: item.status,
        createdAt: item.createdAt,
      })),
      ...purchaseOrders.map((item) => ({
        id: item.id,
        module: "PURCHASE",
        type: "PO",
        reference: item.poNumber,
        project: item.project?.name ?? "General",
        party: item.supplier.name,
        amount: item.totalAmount,
        status: item.status,
        createdAt: item.createdAt,
      })),
      ...billings.map((item) => ({
        id: item.id,
        module: "BILLING",
        type: item.billingType,
        reference: item.billingNo,
        project: item.project?.name ?? "General",
        party: item.contractor?.name ?? item.worker?.name ?? item.vendorName ?? "General",
        amount: item.billedAmount,
        status: item.status,
        createdAt: item.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
