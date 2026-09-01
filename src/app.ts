import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import inventoryRoutes from "./routes/inventory.routes";
import accountsRoutes from "./routes/accounts.routes";
import contractorRoutes from "./routes/contractor.routes";
import workerRoutes from "./routes/worker.routes";
import billsRoutes from "./routes/bills.routes";
import usersRoutes from "./routes/users.routes";
import realEstateRoutes from "./routes/real-estate.routes";
import operationsRoutes from "./routes/operations.routes";
import settingsRoutes from "./routes/settings.routes";
import reportsRoutes from "./routes/reports.routes";
import adminRoutes from "./routes/admin.routes";
import mastersRoutes from "./routes/masters.routes";
import investmentRoutes from "./routes/investment.routes";
import shareProjectRoutes from "./routes/share-project.routes";
import documentsRoutes from "./routes/documents.routes";
import sitesRoutes from "./routes/sites.routes";
import ganttRoutes from "./routes/gantt.routes";
import designRoutes from "./routes/design.routes";
import { errorHandler, notFound } from "./middleware/error-handler";
import { getApiCatalog, renderApiDocsHtml } from "./lib/api-docs";
import { prisma } from "./lib/prisma";

const app = express();

app.use(helmet());
app.use(compression());

const allowedOrigins = [
  "http://localhost:3000",
  "https://hetdclpms-frontend.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list, ends with .vercel.app, or matches FRONTEND_URL
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to permit request
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (_, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );
  res.send(renderApiDocsHtml(process.env.API_BASE_URL || "http://localhost:5000"));
});

app.get("/health", async (_, res) => {
  let dbStatus = "disconnected";
  let latencyMs = 0;
  let dbError: string | undefined;

  try {
    const start = Date.now();
    // Test DB connection with lightweight query
    await prisma.user.findFirst({ select: { id: true } });
    latencyMs = Date.now() - start;
    dbStatus = "connected";
  } catch (err: unknown) {
    dbStatus = "error";
    dbError = (err as Error)?.message || "Failed to query database";
  }

  const envCheck = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    JWT_SECRET: Boolean(process.env.JWT_SECRET),
    FRONTEND_URL: process.env.FRONTEND_URL || "default",
    NODE_ENV: process.env.NODE_ENV || "development",
  };

  const isHealthy = dbStatus === "connected" && envCheck.DATABASE_URL && envCheck.JWT_SECRET;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    service: "HET PMS API Service",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs,
      ...(dbError ? { error: dbError } : {}),
    },
    environment: envCheck,
    allowedOrigins,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get("/api/catalog", (_, res) => {
  res.json(getApiCatalog());
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/real-estate", realEstateRoutes);
app.use("/api/operations", operationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/masters", mastersRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/share-project", shareProjectRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/sites", sitesRoutes);
app.use("/api/gantt", ganttRoutes);
app.use("/api/design", designRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
