// #app/routes/docs/delivery.routes.js
import { Router } from "express";
import { createFromBranchDelivery, createFromConsignmentDelivery, getByDeliveryId } from "#app/controllers/documents/deliveryDocs.controller.js";

const router = Router();

router.get("/:deliveryId", getByDeliveryId);
router.post("/branch/:deliveryId/create", createFromBranchDelivery);
router.post("/consignment/:deliveryId/create", createFromConsignmentDelivery);

export default router;
