import express from "express";
import * as ctrl from "../../controllers/inventory/inventoryController.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// รวมยอดคงเหลือ
router.get("/", ctrl.summary);
// รายการเคลื่อนไหว
router.get("/ledger", ctrl.ledger);

export default router;
