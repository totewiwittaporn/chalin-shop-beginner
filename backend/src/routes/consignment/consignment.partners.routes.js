import { Router } from "express";
import {
  listPartners,
  createPartner,
  updatePartner,
} from "#app/controllers/consignment/consignmentPartners.Controller.js";

const router = Router();

// GET /api/consignment/partners?q=&page=&pageSize=
router.get("/", listPartners);

// POST /api/consignment/partners
router.post("/", createPartner);

// PUT /api/consignment/partners/:partnerId
router.put("/:partnerId", updatePartner);

export default router;
