// backend/src/routes/sales/sales.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import * as salesController from "#app/controllers/sales/salesController.js";

const router = Router();

// สร้างร่างบิลขาย (DRAFT)
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), salesController.createSale);

// ชำระเงิน & ปิดบิล (สร้าง payments, อัปเดต status=PAID, ลง StockLedger SALE-)
router.post("/:id/pay", requireAuth, requireRole("ADMIN", "STAFF"), salesController.paySale);

// ดึงบิล, รายการบิล
router.get("/:id", requireAuth, requireRole("ADMIN","STAFF","CONSIGNMENT"), salesController.getSale);
router.get("/", requireAuth, requireRole("ADMIN","STAFF","CONSIGNMENT"), salesController.listSales);

export default router;
