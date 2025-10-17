// backend/src/db/prismaClient.js
import { PrismaClient } from "@prisma/client";

// กันสร้าง PrismaClient ซ้ำเวลารันด้วย nodemon
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
