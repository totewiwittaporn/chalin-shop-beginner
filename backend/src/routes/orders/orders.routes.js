// backend/src/routes/orders/orders.routes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/orders/recent?limit=5
router.get("/recent", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "5", 10), 50);
  // TODO: ถ้ามี Prisma Order ให้ดึงจาก DB ที่นี่
  // ชั่วคราวส่งอาเรย์ว่างให้อ่านได้โดยไม่ล้ม
  res.json([]);
});

export default router;
