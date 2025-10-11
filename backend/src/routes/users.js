// backend/src/routes/users.js
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../middleware/auth.js";

/**
 * GET /api/users?role=&branchId=&partnerId=&q=&page=&pageSize=
 * - ADMIN: เห็นทั้งหมด
 * - STAFF: จำกัด branchId ตนเอง
 * - CONSIGNMENT/QUOTE_VIEWER: ไม่อนุญาต
 */
const router = Router();

router.get("/", requireRole("ADMIN", "STAFF"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize ?? "50", 10)));

    const where = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.branchId) where.branchId = Number(req.query.branchId);
    if (req.query.partnerId) where.partnerId = Number(req.query.partnerId);

    // STAFF เห็นเฉพาะสาขาตนเอง
    if (String(req.user.role).toUpperCase() === "STAFF" && req.user.branchId) {
      where.branchId = req.user.branchId;
    }

    if (req.query.q) {
      const s = String(req.query.q);
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { name: { contains: s, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ role: "asc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          branchId: true,
          partnerId: true,  // ← มีจริงตาม schema
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list users" });
  }
});

export default router;
