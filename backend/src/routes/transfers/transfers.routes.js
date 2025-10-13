// backend/src/routes/transfers/transfers.routes.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js"; // ปรับพาธตามโปรเจกต์คุณ
import {
  listTransfers,
  getTransfer,
  createTransfer,
  updateTransfer,
  sendTransfer,
  receiveTransfer,
} from "#app/controllers/transfers/transfersController.js";

const router = Router();

// ทั้งหมดต้องล็อกอิน
router.use(requireAuth);

// รายการ + ค้นหา
router.get("/", listTransfers);
// รายการเดี่ยว
router.get("/:id", getTransfer);
// สร้าง/แก้ไข
router.post("/", createTransfer);
router.put("/:id", updateTransfer);

// เปลี่ยนสถานะ
router.post("/:id/send", sendTransfer);
router.post("/:id/receive", receiveTransfer);

export default router;
