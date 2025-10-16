// backend/src/routes/suppliers/suppliers.routes.js
import { Router } from "express";
import * as ctrl from "#app/controllers/suppliers/suppliersController.js";
import { requireAuth } from "#app/middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.patch("/:id", ctrl.toggle);
router.delete("/:id", ctrl.remove);

export default router;
