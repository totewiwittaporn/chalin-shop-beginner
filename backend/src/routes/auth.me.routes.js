// backend/src/routes/auth.me.routes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";

const r = express.Router();

/**
 * GET /api/auth/me
 * - คืนข้อมูลผู้ใช้จาก JWT (แนบไว้ใน req.user โดย requireAuth)
 */
r.get("/me", requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json(req.user);
});

/**
 * POST /api/auth/logout
 * - JWT เป็น stateless → ให้ client ลบ token ก็พอ
 * - ถ้าต้องการ blacklist ให้ไปทำใน requireAuth/ชั้นอื่น
 */
r.post("/logout", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

export default r;
