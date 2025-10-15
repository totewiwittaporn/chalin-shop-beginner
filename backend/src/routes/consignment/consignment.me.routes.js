import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { getMySummary, getMyDocuments, getMyReturns } from "#app/controllers/consignment/consignmentMeController.js";

const router = Router();
router.use(requireAuth, requireRole("CONSIGNMENT", "ADMIN")); // ADMIN ก็ลองดูได้

router.get("/summary", getMySummary);
router.get("/documents", getMyDocuments);
router.get("/returns", getMyReturns);

export default router;
