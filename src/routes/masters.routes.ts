import { Request, Response, Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  appendActivityLog,
  createSettingListItem,
  deleteSettingListItem,
  getSetting,
  getSettingList,
  saveSetting,
  updateSettingListItem,
  type StoredItem,
} from "../lib/system-settings";
import { prisma } from "../lib/prisma";

const router = Router();

type MasterDefinition = {
  key: string;
  label: string;
};

const masterDefinitions: Record<string, MasterDefinition> = {
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

router.get("/definitions", authenticate, (_req: Request, res: Response) => {
  res.json({ success: true, data: masterDefinitions });
});

router.get("/company-profile", authenticate, async (_req: Request, res: Response) => {
  const data = await getSetting("company_profile", {
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

router.put("/company-profile", authenticate, async (req: AuthRequest, res: Response) => {
  await saveSetting("company_profile", req.body);
  await appendActivityLog({
    action: "UPDATE",
    module: "COMPANY_PROFILE",
    message: "Updated company profile",
    userId: req.user?.id,
    userEmail: req.user?.email,
  });
  res.json({ success: true, message: "Company profile saved" });
});

router.get("/account-summaries/customers", authenticate, async (_req: Request, res: Response) => {
  try {
    const installments = await prisma.installment.findMany({
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const grouped = installments.reduce<Record<string, {
      client: string;
      phone: string;
      projects: Set<string>;
      totalAmount: number;
      paidAmount: number;
    }>>((acc, row) => {
      const key = `${row.client}|${row.clientPhone ?? ""}`;
      if (!acc[key]) {
        acc[key] = {
          client: row.client,
          phone: row.clientPhone ?? "",
          projects: new Set<string>(),
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
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:masterKey", authenticate, async (req: Request, res: Response) => {
  const masterKey = String(req.params.masterKey);
  const definition = masterDefinitions[masterKey];
  if (!definition) return res.status(404).json({ error: "Master data not found" });
  const data = await getSettingList<StoredItem>(definition.key);
  res.json({ success: true, data });
});

router.post("/:masterKey", authenticate, async (req: AuthRequest, res: Response) => {
  const masterKey = String(req.params.masterKey);
  const definition = masterDefinitions[masterKey];
  if (!definition) return res.status(404).json({ error: "Master data not found" });

  const item = await createSettingListItem<StoredItem>(definition.key, req.body as StoredItem);
  await appendActivityLog({
    action: "CREATE",
    module: definition.label.toUpperCase().replace(/\s+/g, "_"),
    message: `Created ${definition.label} ${String(item.name ?? item.code ?? item.id)}`,
    userId: req.user?.id,
    userEmail: req.user?.email,
  });
  res.status(201).json({ success: true, data: item });
});

router.put("/:masterKey/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const masterKey = String(req.params.masterKey);
  const itemId = String(req.params.id);
  const definition = masterDefinitions[masterKey];
  if (!definition) return res.status(404).json({ error: "Master data not found" });

  const item = await updateSettingListItem<StoredItem>(definition.key, itemId, req.body as StoredItem);
  if (!item) return res.status(404).json({ error: "Record not found" });

  await appendActivityLog({
    action: "UPDATE",
    module: definition.label.toUpperCase().replace(/\s+/g, "_"),
    message: `Updated ${definition.label} ${String(item.name ?? item.code ?? item.id)}`,
    userId: req.user?.id,
    userEmail: req.user?.email,
  });
  res.json({ success: true, data: item });
});

router.delete("/:masterKey/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const masterKey = String(req.params.masterKey);
  const itemId = String(req.params.id);
  const definition = masterDefinitions[masterKey];
  if (!definition) return res.status(404).json({ error: "Master data not found" });

  const removed = await deleteSettingListItem<StoredItem>(definition.key, itemId);
  if (!removed) return res.status(404).json({ error: "Record not found" });

  await appendActivityLog({
    action: "DELETE",
    module: definition.label.toUpperCase().replace(/\s+/g, "_"),
    message: `Deleted ${definition.label}`,
    userId: req.user?.id,
    userEmail: req.user?.email,
  });
  res.json({ success: true, message: "Deleted" });
});

router.get("/account-summaries/suppliers", authenticate, async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
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
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
