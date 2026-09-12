"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
let _prismaInstance = null;
function getPrismaInstance() {
    if (globalForPrisma.prisma)
        return globalForPrisma.prisma;
    if (!_prismaInstance) {
        _prismaInstance = new client_1.PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
        if (process.env.NODE_ENV !== "production") {
            globalForPrisma.prisma = _prismaInstance;
        }
    }
    return _prismaInstance;
}
// Lazy Proxy prevents unhandled crash on startup if DATABASE_URL is connecting or missing
exports.prisma = new Proxy({}, {
    get(_target, prop) {
        const instance = getPrismaInstance();
        const value = Reflect.get(instance, prop);
        if (typeof value === "function") {
            return value.bind(instance);
        }
        return value;
    },
});
//# sourceMappingURL=prisma.js.map