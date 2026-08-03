import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function backupCurrentData() {
  const backup = {
    createdAt: new Date().toISOString(),
    data: {
      projects: await prisma.project.findMany(),
      boqItems: await prisma.bOQItem.findMany(),
      tasks: await prisma.task.findMany(),
      progressLogs: await prisma.progressLog.findMany(),
      contractors: await prisma.contractor.findMany(),
      contractorAssignments: await prisma.contractorAssignment.findMany(),
      workers: await prisma.worker.findMany(),
      workerAssignments: await prisma.workerAssignment.findMany(),
      propertyBlocks: await prisma.propertyBlock.findMany(),
      propertyRoads: await prisma.propertyRoad.findMany(),
      propertyUnits: await prisma.propertyUnit.findMany(),
      propertyBookings: await prisma.propertyBooking.findMany(),
      propertySales: await prisma.propertySale.findMany(),
      products: await prisma.product.findMany(),
      suppliers: await prisma.supplier.findMany(),
      stockAdjustments: await prisma.stockAdjustment.findMany(),
      materialRequisitions: await prisma.materialRequisition.findMany(),
      requisitionItems: await prisma.requisitionItem.findMany(),
      rfqs: await prisma.rFQ.findMany(),
      purchaseOrders: await prisma.purchaseOrder.findMany(),
      purchaseOrderItems: await prisma.purchaseOrderItem.findMany(),
      grns: await prisma.gRN.findMany(),
      grnItems: await prisma.gRNItem.findMany(),
      vouchers: await prisma.voucher.findMany(),
      ledgerEntries: await prisma.ledgerEntry.findMany(),
      bankAccounts: await prisma.bankAccount.findMany(),
      bankTransactions: await prisma.bankTransaction.findMany(),
      installments: await prisma.installment.findMany(),
      installmentSchedules: await prisma.installmentSchedule.findMany(),
      bills: await prisma.bill.findMany(),
      projectExpenses: await prisma.projectExpense.findMany(),
      quotations: await prisma.quotation.findMany(),
      quotationItems: await prisma.quotationItem.findMany(),
      workOrders: await prisma.workOrder.findMany(),
      billingRecords: await prisma.billingRecord.findMany(),
      bankReconciliations: await prisma.bankReconciliation.findMany(),
      chequeEntries: await prisma.chequeEntry.findMany(),
      assetItems: await prisma.assetItem.findMany(),
      assetMaintenanceLogs: await prisma.assetMaintenanceLog.findMany(),
      approvalLayers: await prisma.approvalLayer.findMany(),
      approvalLogs: await prisma.approvalLog.findMany(),
      investors: await prisma.investor.findMany(),
      projectInvestments: await prisma.projectInvestment.findMany(),
      shareAssignments: await prisma.shareAssignment.findMany(),
      shareProjectConfigs: await prisma.shareProjectConfig.findMany(),
      projectDocuments: await prisma.projectDocument.findMany(),
      projectSites: await prisma.projectSite.findMany(),
      ganttTasks: await prisma.ganttTask.findMany(),
    },
  };

  const backupDir = join(process.cwd(), "prisma", "backups");
  mkdirSync(backupDir, { recursive: true });
  const fileName = `production-reset-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filePath = join(backupDir, fileName);
  writeFileSync(filePath, JSON.stringify(backup, null, 2));
  return filePath;
}

async function ensureProductionBaseline() {
  const roleDefs = [
    { name: "super_admin", description: "Full system access" },
    { name: "admin", description: "Company admin" },
    { name: "accountant", description: "Manage accounts and finance" },
    { name: "project_manager", description: "Manage projects" },
    { name: "site_engineer", description: "Site operations" },
    { name: "inventory_manager", description: "Manage stock and inventory" },
    { name: "procurement_officer", description: "Manage procurement" },
  ];

  const roles = await Promise.all(
    roleDefs.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: role,
      })
    )
  );

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const password = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@gmail.com",
        password,
        roleId: roles[0].id,
        isActive: true,
      },
    });
  }

  const accountDefs = [
    { code: "1001", name: "Cash in Hand", type: "CASH" as const },
    { code: "1002", name: "Bank Account", type: "BANK" as const },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" as const },
    { code: "1200", name: "Inventory / Materials", type: "ASSET" as const },
    { code: "2001", name: "Accounts Payable - Suppliers", type: "LIABILITY" as const },
    { code: "2002", name: "Accounts Payable - Contractors", type: "LIABILITY" as const },
    { code: "3001", name: "Property Sales Income", type: "INCOME" as const },
    { code: "3002", name: "Booking Money Income", type: "INCOME" as const },
    { code: "4001", name: "Material Purchase Expense", type: "EXPENSE" as const },
    { code: "4002", name: "Labor Cost Expense", type: "EXPENSE" as const },
    { code: "4003", name: "Contractor Payment Expense", type: "EXPENSE" as const },
    { code: "5001", name: "Owner Equity", type: "EQUITY" as const },
  ];

  for (const account of accountDefs) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type, isActive: true },
      create: account,
    });
  }
}

async function resetBusinessData() {
  await prisma.$transaction([
    prisma.approvalLog.deleteMany(),
    prisma.ledgerEntry.deleteMany(),
    prisma.installmentSchedule.deleteMany(),
    prisma.gRNItem.deleteMany(),
    prisma.gRN.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.requisitionItem.deleteMany(),
    prisma.quotationItem.deleteMany(),
    prisma.assetMaintenanceLog.deleteMany(),
    prisma.propertySale.deleteMany(),
    prisma.propertyBooking.deleteMany(),
    prisma.billingRecord.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.bankTransaction.deleteMany(),
    prisma.bankReconciliation.deleteMany(),
    prisma.chequeEntry.deleteMany(),
    prisma.installment.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.rFQ.deleteMany(),
    prisma.materialRequisition.deleteMany(),
    prisma.stockAdjustment.deleteMany(),
    prisma.projectExpense.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.quotation.deleteMany(),
    prisma.assetItem.deleteMany(),
    prisma.projectInvestment.deleteMany(),
    prisma.shareAssignment.deleteMany(),
    prisma.shareProjectConfig.deleteMany(),
    prisma.investor.deleteMany(),
    prisma.propertyUnit.deleteMany(),
    prisma.propertyBlock.deleteMany(),
    prisma.propertyRoad.deleteMany(),
    prisma.bOQItem.deleteMany(),
    prisma.task.deleteMany(),
    prisma.progressLog.deleteMany(),
    prisma.ganttTask.deleteMany(),
    prisma.contractorAssignment.deleteMany(),
    prisma.workerAssignment.deleteMany(),
    prisma.projectDocument.deleteMany(),
    prisma.projectSite.deleteMany(),
    prisma.project.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.contractor.deleteMany(),
    prisma.worker.deleteMany(),
    prisma.bankAccount.deleteMany(),
  ]);
}

async function main() {
  console.log("Preparing production reset...");
  const backupPath = await backupCurrentData();
  await resetBusinessData();
  await ensureProductionBaseline();
  console.log(`Business/demo data removed. Backup saved at: ${backupPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
