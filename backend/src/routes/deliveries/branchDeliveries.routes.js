import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import {
  createDelivery,
  listDeliveries,
  getDelivery,
  receiveDelivery,
} from "#app/controllers/deliveries/branchDeliveries.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), createDelivery);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), listDeliveries);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), getDelivery);
router.patch("/:id/receive", requireAuth, receiveDelivery);

export default router;
