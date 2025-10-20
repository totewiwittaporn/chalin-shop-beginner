// backend/src/routes/salesRoutes.js
import express from "express";
import { getSalesSummary } from "#app/controllers/sales/salesSummaryController.js";
import { getTopProducts } from "#app/controllers/sales/salesTopProductsController.js";
import { getStaffSummary } from "#app/controllers/sales/salesStaffSummaryController.js";
import { listSalesBranch, createOrPaySaleBranch } from "#app/controllers/sales/branch/salesController.js";

const router = express.Router();

// === Branch POS ===
router.get("/branch", listSalesBranch);
router.post("/branch", createOrPaySaleBranch);

// === Dashboard Summary ===
router.get("/summary", getSalesSummary);
router.get("/top-products", getTopProducts);
router.get("/staff-summary", getStaffSummary);

export default router;
