"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./lib/prisma");
const PORT = process.env.PORT || 5000;
const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];
function validateEnv() {
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
}
async function start() {
    validateEnv();
    try {
        await prisma_1.prisma.$connect();
        console.log("   MongoDB: Connected");
    }
    catch {
        console.error("   MongoDB: Connection FAILED");
        process.exit(1);
    }
    app_1.default.listen(PORT, () => {
        console.log(`\nHET PMS API running on port ${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV}`);
        console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
}
start();
//# sourceMappingURL=index.js.map