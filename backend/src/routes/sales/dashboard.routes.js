// backend/src/routes/salesRoutes.js  (หรือเปลี่ยนชื่อเป็น routes/sales/dashboard.routes.js)
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { getSalesSummary } from "#app/controllers/sales/salesSummaryController.js";
import { getTopProducts } from "#app/controllers/sales/salesTopProductsController.js";
import { getStaffSummary } from "#app/controllers/sales/salesStaffSummaryController.js";

const router = Router();

// === Dashboard Summary (ADMIN เท่านั้น หรือปรับ role ตามที่ต้องการ) ===
router.get("/summary", requireAuth, requireRole("ADMIN"), getSalesSummary);
router.get("/top-products", requireAuth, requireRole("ADMIN"), getTopProducts);
router.get("/staff-summary", requireAuth, requireRole("ADMIN"), getStaffSummary);

export default router;
