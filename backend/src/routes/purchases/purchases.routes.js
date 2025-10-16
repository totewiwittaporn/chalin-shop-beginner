// backend/src/routes/purchases/purchases.routes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";
import * as ctrl from "#app/controllers/purchases/purchasesController.js";

const router = Router();
router.use(requireAuth);

router.post("/", ctrl.create);
router.get("/", ctrl.list);

// ⬇️ เพิ่มเส้นทางดึงใบสั่งซื้อฉบับเต็ม (ใช้ตอนเปิดโมดัล)
router.get("/:id", ctrl.getOne);

// ตรวจรับจริง
router.post("/:id/receive", ctrl.receive);

export default router;
