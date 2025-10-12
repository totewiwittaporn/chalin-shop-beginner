// backend/src/routes/_debug.routes.js
import { Router } from "express";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { requireAuth } from "#/middleware/auth.js";

const router = Router();

// ตรวจว่าเซิร์ฟเวอร์ตัวนี้ใช้ JWT_SECRET อะไร (ไม่พิมพ์ค่าเต็มเพื่อความปลอดภัย)
router.get("/secret-hash", (_req, res) => {
  const secret = String(process.env.JWT_SECRET || "");
  const head = createHash("sha256").update(secret).digest("hex").slice(0, 12);
  res.json({ ok: true, len: secret.length, sha256_head: head });
});

// ดู payload ของโทเค็นที่แนบมา (ต้องผ่าน verify ก่อน)
router.get("/whoami", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ถ้าต้องการดูโครงสร้างโทเค็นแบบไม่ verify (ระวังใช้งานเฉพาะ dev)
router.get("/decode", (req, res) => {
  const authz = (req.headers.authorization || "").trim();
  const m = authz.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1].trim() : null;
  if (!token) return res.status(400).json({ error: "no token" });
  const decoded = jwt.decode(token, { complete: true });
  res.json({ decoded });
});

export default router;
