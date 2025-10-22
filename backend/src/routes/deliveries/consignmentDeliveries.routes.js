// backend/src/routes/deliveries/consignmentDeliveries.routes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";
import * as ctrl from "#app/controllers/deliveries/consignmentDeliveries.controller.js";

const router = Router();

// Preview ก่อนสร้างเอกสาร (ADMIN/STAFF/CONSIGNMENT ที่ล็อกอิน)
router.post("/preview", requireAuth, ctrl.preview);

// รายการเอกสาร + สร้าง/ดู/เปลี่ยนสถานะ/พิมพ์
router.get("/", requireAuth, ctrl.list);
router.post("/", requireAuth, ctrl.create);
router.get("/:id", requireAuth, ctrl.get);
router.patch("/:id/receive", requireAuth, ctrl.receive);
router.get("/:id/print", requireAuth, ctrl.print);

export default router;
