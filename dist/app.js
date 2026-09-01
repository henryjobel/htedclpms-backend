"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const accounts_routes_1 = __importDefault(require("./routes/accounts.routes"));
const contractor_routes_1 = __importDefault(require("./routes/contractor.routes"));
const worker_routes_1 = __importDefault(require("./routes/worker.routes"));
const bills_routes_1 = __importDefault(require("./routes/bills.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const real_estate_routes_1 = __importDefault(require("./routes/real-estate.routes"));
const operations_routes_1 = __importDefault(require("./routes/operations.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const masters_routes_1 = __importDefault(require("./routes/masters.routes"));
const investment_routes_1 = __importDefault(require("./routes/investment.routes"));
const share_project_routes_1 = __importDefault(require("./routes/share-project.routes"));
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const sites_routes_1 = __importDefault(require("./routes/sites.routes"));
const gantt_routes_1 = __importDefault(require("./routes/gantt.routes"));
const design_routes_1 = __importDefault(require("./routes/design.routes"));
const error_handler_1 = require("./middleware/error-handler");
const api_docs_1 = require("./lib/api-docs");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
const allowedOrigins = [
    "http://localhost:3000",
    "https://hetdclpms-frontend.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options(/(.*)/, (0, cors_1.default)());
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("uploads"));
app.get("/", (_, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'none'");
    res.send((0, api_docs_1.renderApiDocsHtml)(process.env.API_BASE_URL || "http://localhost:5000"));
});
app.get("/health", (_, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), service: "HET PMS API" });
});
app.get("/api/catalog", (_, res) => {
    res.json((0, api_docs_1.getApiCatalog)());
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/projects", project_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
app.use("/api/accounts", accounts_routes_1.default);
app.use("/api/contractors", contractor_routes_1.default);
app.use("/api/workers", worker_routes_1.default);
app.use("/api/bills", bills_routes_1.default);
app.use("/api/users", users_routes_1.default);
app.use("/api/real-estate", real_estate_routes_1.default);
app.use("/api/operations", operations_routes_1.default);
app.use("/api/settings", settings_routes_1.default);
app.use("/api/reports", reports_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/masters", masters_routes_1.default);
app.use("/api/investment", investment_routes_1.default);
app.use("/api/share-project", share_project_routes_1.default);
app.use("/api/documents", documents_routes_1.default);
app.use("/api/sites", sites_routes_1.default);
app.use("/api/gantt", gantt_routes_1.default);
app.use("/api/design", design_routes_1.default);
app.use(error_handler_1.notFound);
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map