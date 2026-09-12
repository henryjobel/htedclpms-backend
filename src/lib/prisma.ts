import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let _prismaInstance: PrismaClient | null = null;

function getPrismaInstance(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (!_prismaInstance) {
    _prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _prismaInstance;
    }
  }
  return _prismaInstance;
}

// Lazy Proxy prevents unhandled crash on startup if DATABASE_URL is connecting or missing
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
