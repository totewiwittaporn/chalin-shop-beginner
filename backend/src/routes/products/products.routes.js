// backend/src/routes/products/products.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import * as ctrl from "#app/controllers/products/index.js";

const router = Router();

// ใช้ token ทุกเมธอด
router.use(requireAuth);

// ตารางสินค้าเต็ม
router.get("/", ctrl.list);

// ค้นหาสินค้า (autocomplete + รองรับ branchId เพื่อรวม stockQty ในสาขาที่ระบุ)
router.get("/search", ctrl.search);

// สร้าง/แก้ไข/รายงานคงเหลือน้อย (ตามนโยบายบทบาท)
router.post("/", requireRole("ADMIN", "STAFF", "CONSIGNMENT"), ctrl.create);
router.put("/:id", requireRole("ADMIN", "STAFF", "CONSIGNMENT"), ctrl.update);
router.get("/low-stock", requireRole("ADMIN", "STAFF", "CONSIGNMENT"), ctrl.lowStock);

export default router;
