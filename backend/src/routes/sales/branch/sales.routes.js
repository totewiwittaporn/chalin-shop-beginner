import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { withBranchContext } from "#app/middleware/branchContext.js";
import * as sales from "#app/controllers/sales/branch/salesController.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  withBranchContext,
  sales.createOrPaySaleBranch
);

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  sales.listSalesBranch
);

router.get(
  "/:id/print",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  sales.printSaleBranch
);

export default router;
