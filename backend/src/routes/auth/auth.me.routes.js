// backend/src/routes/auth/auth.me.routes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";
import prisma from "#app/lib/prisma.js"; // ถ้าไม่มีไฟล์นี้อยู่จริง เปลี่ยนเป็น PrismaClient ตรงๆ ได้

const router = Router();

// ต้องมี token ทุกครั้ง
router.use(requireAuth);

/**
 * GET /api/auth/me
 * ดึงข้อมูลจาก token ก่อน และ (ถ้าต้องการ) sync จากฐานข้อมูล
 */
router.get("/", async (req, res, next) => {
  try {
    const base = {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role,
      roles: req.user?.roles || [],
      branchId: req.user?.branchId ?? null,
      partnerId: req.user?.partnerId ?? null,
    };

    // ถ้ามี prisma และอยาก sync role/branch ล่าสุดจาก DB (กันเคส role เปลี่ยนหลังออก token)
    // คอมเมนต์บล็อกนี้ได้ถ้าไม่ต้องการ hit DB ทุกครั้ง
    if (base.id && prisma?.user?.findUnique) {
      const userDb = await prisma.user.findUnique({
        where: { id: Number(base.id) },
        select: { email: true, name: true, role: true, branchId: true, partnerId: true }
      });
      if (userDb) {
        base.email = userDb.email ?? base.email;
        base.name = userDb.name ?? base.name;
        base.role = String(userDb.role).toUpperCase();
        base.roles = [base.role];
        base.branchId = userDb.branchId ?? base.branchId;
        base.partnerId = userDb.partnerId ?? base.partnerId;
      }
    }

    res.json(base);
  } catch (err) {
    next(err);
  }
});

export default router;
