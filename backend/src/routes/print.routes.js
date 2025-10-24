// backend/src/routes/print.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { printDelivery } from "#app/controllers/deliveries/branchDeliveries.controller.js";
import { renderDeliveryNoteA4PDF } from "#app/print/printService.js";

const router = Router();

/**
 * /api/print/delivery/:id
 * - ?format=pdf  → ส่ง PDF A4
 * - (อย่างอื่น)  → ส่ง JSON/HTML จาก controller (printDelivery)
 */
router.get(
  "/delivery/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  async (req, res, next) => {
    try {
      const format = String(req.query.format || "").toLowerCase();
      if (format === "pdf") {
        const pdf = await renderDeliveryNoteA4PDF(req.params.id);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="delivery-${req.params.id}.pdf"`
        );
        return res.send(pdf);
      }
      // default → ส่งต่อให้ controller
      return printDelivery(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Alias เดิมแบบ .pdf โดยตรง
 */
router.get(
  "/delivery/:id.pdf",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  async (req, res) => {
    const pdf = await renderDeliveryNoteA4PDF(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="delivery-${req.params.id}.pdf"`
    );
    res.send(pdf);
  }
);

export default router;
