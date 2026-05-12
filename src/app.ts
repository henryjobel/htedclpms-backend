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
import { errorHandler, notFound } from "./middleware/error-handler";

const app = express();

app.use(helmet());
app.use(compression());

const allowedOrigins = [
  "http://localhost:3000",
  "https://hetdclpms-frontend.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/(.*)/, cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    service: "HET PMS API",
    health: "/health",
    apiBase: "/api",
  });
});

app.get("/health", (_, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), service: "HET PMS API" });
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

app.use(notFound);
app.use(errorHandler);

export default app;
