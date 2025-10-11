// backend/src/lib/prisma.js
import { PrismaClient } from "@prisma/client";

// ป้องกันหลายอินสแตนซ์เวลา dev (nodemon/hot reload)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma__ || new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma__ = prisma;
}

export default prisma;
