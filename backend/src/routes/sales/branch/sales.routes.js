// backend/src/routes/sales/branch/sales.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { withBranchContext } from "#app/middleware/branchContext.js";
import * as sales from "#app/controllers/sales/branch/salesController.js";

const router = Router();

// สร้าง/ชำระเงิน POS สาขา
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  withBranchContext,
  sales.createOrPaySaleBranch
);

// รายการขายของสาขา (สำหรับตารางด้านล่างใน POS)
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  sales.listSalesBranch
);

// ถ้ามี route พิมพ์เอกสาร
// router.get(
//   "/:id/print",
//   requireAuth,
//   requireRole("ADMIN", "STAFF"),
//   sales.printSaleBranch
// );

export default router;
