import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const r = express.Router();

/**
 * GET /api/products/low-stock?lt=10
 * ตอนนี้ยังไม่มีฟิลด์ stock ใน Product schema -> คืนว่างไว้ก่อน (200)
 * เพื่อไม่ให้ Dashboard พัง
 */
r.get("/low-stock", requireAuth, requireRole("ADMIN", "STAFF"), async (req, res) => {
  const lt = Number(req.query.lt || 10);
  res.json({ items: [], threshold: lt, total: 0, note: "no stock field; implement later" });
});

export default r;
