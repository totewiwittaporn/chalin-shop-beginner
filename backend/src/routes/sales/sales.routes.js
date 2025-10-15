// backend/src/routes/sales/sales.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import * as salesController from "#app/controllers/sales/salesController.js";
import { getSalesSummary } from "#app/controllers/sales/salesSummaryController.js";
import { getTopProducts } from "#app/controllers/sales/salesTopProductsController.js"; // ✅ เพิ่ม
import { getStaffSummary } from "#app/controllers/sales/salesStaffSummaryController.js";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  requireRole("ADMIN"), // ถ้าอยากให้ STAFF/CONSIGNMENT เห็นด้วย ก็ใส่เพิ่มได้
  getSalesSummary
);

// สร้างร่างบิลขาย (DRAFT)
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), salesController.createSale);

// ชำระเงิน & ปิดบิล (สร้าง payments, อัปเดต status=PAID, ลง StockLedger SALE-)
router.post("/:id/pay", requireAuth, requireRole("ADMIN", "STAFF"), salesController.paySale);

// ดึงบิล, รายการบิล
router.get("/:id", requireAuth, requireRole("ADMIN","STAFF","CONSIGNMENT"), salesController.getSale);
router.get("/", requireAuth, requireRole("ADMIN","STAFF","CONSIGNMENT"), salesController.listSales);

router.get("/summary", requireAuth, requireRole("ADMIN"), getSalesSummary);
router.get("/top-products", requireAuth, requireRole("ADMIN"), getTopProducts);

router.get("/summary/staff", requireAuth, requireRole("ADMIN","STAFF"), getStaffSummary);

export default router;
