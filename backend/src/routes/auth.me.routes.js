// backend/src/routes/auth.me.routes.js
import express from "express";
import authMiddleware from "../middleware/auth";

// ไฟล์นี้ "เพิ่ม" /me และ /logout เท่านั้น ไม่ยุ่ง login/register เดิมของคุณ
const r = express.Router();

/**
 * GET /api/auth/me
 * - คืนข้อมูลผู้ใช้จาก JWT (แนบไว้ใน req.user โดย authMiddleware)
 * - แนะนำให้คุณออกแบบ authMiddleware ให้เติม name/email/branch ด้วยถ้าได้
 */
r.get("/me", authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json(req.user);
});

/**
 * POST /api/auth/logout
 * - JWT stateless → แค่ให้ฝั่ง client ลบ token ก็พอ
 * - ถ้าคุณมีระบบ revoke/blacklist ค่อยเติมในภายหลัง
 */
r.post("/logout", authMiddleware, (_req, res) => {
  res.json({ ok: true });
});

export default r;
