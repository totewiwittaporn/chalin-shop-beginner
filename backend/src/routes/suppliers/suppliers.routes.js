import express from "express";
import * as ctrl from "../../controllers/suppliers/suppliersController.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.patch("/:id", ctrl.toggle);
router.delete("/:id", ctrl.remove);

export default router;
