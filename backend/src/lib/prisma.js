// backend/src/lib/prisma.js  หรือไฟล์ที่ alias เป็น "#app/lib/prisma.js"
import { PrismaClient } from '@prisma/client';

// ป้องกันสร้าง PrismaClient ซ้ำใน dev (HMR / nodemon)
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}

export default prisma;           // <<--- สำคัญ: default export
export { PrismaClient, prisma }; // (เผื่อบางไฟล์อยาก import แบบ named)
