// backend/src/routes/deliveries/consignmentDeliveries.routes.js
// ESM version with `export default` for compatibility with `import X from ...`

import { Router } from "express";
import * as ctrl from "#app/controllers/deliveries/consignmentDeliveries.controller.js";

const router = Router();

router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);

// (print endpoint จะเพิ่มในสเต็ปถัดไป)
export default router;
