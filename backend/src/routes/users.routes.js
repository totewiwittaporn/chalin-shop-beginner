import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "#/middleware/auth.js";

const prisma = new PrismaClient();
const r = express.Router();

/**
 * GET /api/users
 * - ADMIN เท่านั้น
 * - คืนรายการผู้ใช้แบบย่อ (ซ่อน password)
 */
r.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        partnerId: true,
        createdAt: true,
      },
    });
    res.json({ items: users, total: users.length });
  } catch (e) {
    next(e);
  }
});

export default r;
