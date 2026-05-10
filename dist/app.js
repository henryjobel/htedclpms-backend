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
const error_handler_1 = require("./middleware/error-handler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/health", (_, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), service: "HET PMS API" });
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
app.use(error_handler_1.notFound);
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map