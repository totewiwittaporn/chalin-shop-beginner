// backend/src/routes/sales/sales.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import * as salesController from "#app/controllers/sales/salesController.js";
import { getSalesSummary } from "#app/controllers/sales/salesSummaryController.js";
import { getTopProducts } from "#app/controllers/sales/salesTopProductsController.js";
import { getStaffSummary } from "#app/controllers/sales/salesStaffSummaryController.js";

const router = Router();

/**
 * NOTE: เส้นทางเฉพาะ (fixed paths) ต้องมาก่อนเส้นทางไดนามิก "/:id"
 * ไม่งั้น /top-products จะถูก match เป็น :id แล้วไปเรียก getSale() แทน
 */

// Summary รวมยอด
router.get(
  "/summary",
  requireAuth,
  requireRole("ADMIN"),
  getSalesSummary
);

// สรุปผลงานพนักงาน
router.get(
  "/summary/staff",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  getStaffSummary
);

// Top products
router.get(
  "/top-products",
  requireAuth,
  requireRole("ADMIN"),
  getTopProducts
);

// สร้างบิล (DRAFT)
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  salesController.createSale
);

// ชำระเงิน/ปิดบิล
router.post(
  "/:id/pay",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  salesController.paySale
);

// รายการบิล (ควรมาก่อน :id หรือหลังได้ แต่ไม่กระทบ path เฉพาะ)
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  salesController.listSales
);

// ดึงบิลตาม id (ไดนามิก — ไว้ท้ายสุด)
router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  salesController.getSale
);

export default router;
