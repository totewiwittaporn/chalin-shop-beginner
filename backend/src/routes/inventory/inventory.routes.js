// backend/src/routes/inventory/inventory.routes.js
import { Router } from "express";
import * as ctrl from "../../controllers/inventory/inventoryController.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ต้องล็อกอินก่อนเข้าทุก endpoint
router.use(requireAuth);

// รวมยอดคงเหลือ
router.get("/", ctrl.summary);

// ดู movement
router.get("/ledger", ctrl.ledger);

// เติม movement ย้อนหลัง
router.post("/rebuild", ctrl.rebuild);

export default router;
