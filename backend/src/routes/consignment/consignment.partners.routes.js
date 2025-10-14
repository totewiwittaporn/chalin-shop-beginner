// backend/src/routes/consignment/consignment.partners.routes.js
import { Router } from "express";
// NOTE: โปรเจ็กต์นี้ไฟล์อยู่ที่ src/middleware/auth.js (ไม่มี s)
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { listConsignmentPartners } from "#app/controllers/consignment/consignmentPartnersController.js";

const router = Router();

/**
 * GET /api/consignment/partners
 *   ?q= ค้นหา code/name (optional)
 *   ?status=ACTIVE|INACTIVE (optional)
 *   ?page=1&pageSize=500 (optional)
 */
router.get("/", requireAuth, listConsignmentPartners);

// (ถ้าต้องการสร้าง/แก้ไขในอนาคต ให้เพิ่ม POST/PUT ที่นี่ โดยใช้ controller แยกไฟล์)
export default router;
