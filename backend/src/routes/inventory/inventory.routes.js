// backend/src/routes/inventory/inventory.routes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";
import * as ctrl from "#app/controllers/inventory/inventoryController.js";

const router = Router();

router.use(requireAuth);

router.get("/", ctrl.summary);
router.get("/ledger", ctrl.ledger);
router.post("/rebuild", ctrl.rebuild);

export default router;
