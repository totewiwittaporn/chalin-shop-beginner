// backend/src/routes/purchasesRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("@/controllers/purchasesController");
const auth = require("@/middleware/auth");

router.use(auth);

// สร้างใบสั่งซื้อ (สถานะ PENDING)
router.post("/", ctrl.create);

// ดูรายการใบสั่งซื้อ (กรองสถานะ/ค้นหา/แบ่งหน้า)
router.get("/", ctrl.list);

// รับสินค้าเข้าสต็อกจากใบสั่งซื้อ
router.post("/:id/receive", ctrl.receive);

module.exports = router;