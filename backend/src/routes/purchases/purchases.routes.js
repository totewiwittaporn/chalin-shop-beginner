// backend/src/routes/purchases/purchases.routes.js
import { Router } from "express";
import * as ctrl from "#app/controllers/purchasesController.js";
import { requireAuth } from "#app/middleware/auth.js";

const router = Router();

router.use(requireAuth);

// สร้างใบสั่งซื้อ (สถานะ PENDING)
router.post("/", ctrl.create);

// ดูรายการใบสั่งซื้อ (กรองสถานะ/ค้นหา/แบ่งหน้า)
router.get("/", ctrl.list);

// รับสินค้าเข้าสต็อกจากใบสั่งซื้อ (รับเข้าทั้งใบ)
router.post("/:id/receive", ctrl.receive);

export default router;
