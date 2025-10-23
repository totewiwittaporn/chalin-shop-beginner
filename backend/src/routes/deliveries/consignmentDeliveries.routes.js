// backend/src/routes/deliveries/consignmentDeliveries.routes.js
import { Router } from "express";
import * as ctrl from "#app/controllers/deliveries/consignmentDeliveries.controller.js";
import { print as printConsign } from "#app/controllers/print/consignmentDelivery.print.controller.js";

const router = Router();

router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.post("/", ctrl.create);
router.get("/:id/print", printConsign);

export default router;
