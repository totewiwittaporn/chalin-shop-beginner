// #app/routes/docs/documents.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { listDocuments, updateStatus } from "#app/controllers/documents/documents.controller.js";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), listDocuments);
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "STAFF"), updateStatus);

export default router;
