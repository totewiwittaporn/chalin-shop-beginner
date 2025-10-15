import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { createDelivery, listDeliveries, getDelivery } from "#app/controllers/deliveries/deliveriesController.js";

const router = Router();

// สร้างเอกสาร Delivery: เฉพาะ ADMIN/STAFF
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), createDelivery);

// รายการ Delivery ล่าสุด
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), listDeliveries);

// รายละเอียด Delivery
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), getDelivery);

export default router;
