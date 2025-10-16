// backend/src/routes/stockcount/stockCountRoutes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";
import * as ctrl from "#app/controllers/stockcount/stockCountController.js";

const router = Router();
router.use(requireAuth);

router.post("/", ctrl.create);
router.post("/:id/lines", ctrl.upsertLines);
router.post("/:id/finalize", ctrl.finalize);
router.get("/:id", ctrl.get);
router.get("/system-qty", ctrl.systemQty);
router.get("/", ctrl.list);

export default router;
