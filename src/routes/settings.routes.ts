import { Request, Response, Router } from "express";
import { Prisma } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

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

router.get("/system", authenticate, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.systemSetting.findMany();
    const data = { ...defaultSettings } as Record<string, unknown>;

    rows.forEach((row) => {
      data[row.key] = row.valueJson;
    });

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/system", authenticate, async (req: Request, res: Response) => {
  try {
    const payload = req.body as Record<string, unknown>;
    const entries = Object.entries(payload);

    await Promise.all(
      entries.map(([key, valueJson]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { valueJson: valueJson as Prisma.InputJsonValue },
          create: { key, valueJson: valueJson as Prisma.InputJsonValue },
        })
      )
    );

    res.json({ success: true, message: "Settings saved" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
