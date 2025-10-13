
// backend/src/routes/stockcount/stockCountRoutes.js
import express from "express";
import * as ctrl from "../../controllers/stockcount/stockCountController.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", ctrl.create);
router.post("/:id/lines", ctrl.upsertLines);
router.post("/:id/finalize", ctrl.finalize);
router.get("/:id", ctrl.get);
router.get("/system-qty", ctrl.systemQty);
router.get("/", ctrl.list);

export default router;
