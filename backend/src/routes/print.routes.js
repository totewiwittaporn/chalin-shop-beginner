// backend/src/routes/print.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { printDelivery } from "#app/controllers/deliveries/deliveriesController.js";

// (ออปชันเสริม) ยังเก็บ endpoint เดิมไว้เป็น alias PDF ตรง ๆ ก็ได้
import { renderDeliveryNoteA4PDF } from "#app/print/printService.js";

const router = Router();

/**
 * ✔️ เส้นทางที่หน้าเว็บเรียกอยู่:
 *   - /api/print/delivery/:id?size=a4              → ส่ง HTML (พร้อมสไตล์ A4)
 *   - /api/print/delivery/:id?size=a4&format=pdf   → ส่ง PDF A4
 * ใช้ตัวเดียวกับ controller: printDelivery
 */
router.get(
  "/delivery/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  printDelivery
);

/**
 * (ออปชัน) Alias เก่าแบบ .pdf โดยใช้เทมเพลต Handlebars ใน printService
 * ไม่ได้ถูกปุ่มฝั่งหน้าเว็บเรียก แต่เผื่อใช้งานภายใน
 */
router.get(
  "/delivery/:id.pdf",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  async (req, res) => {
    try {
      const pdf = await renderDeliveryNoteA4PDF(req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="delivery-${req.params.id}.pdf"`);
      res.send(pdf);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Cannot generate PDF", error: String(err) });
    }
  }
);

export default router;
