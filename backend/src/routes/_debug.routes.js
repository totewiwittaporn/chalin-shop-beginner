// backend/src/routes/_debug.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// ดูว่า Header Authorization ถูกส่งมาถึงจริงไหม
router.get("/echo-headers", (req, res) => {
  res.json({
    hasAuthHeader: !!req.headers.authorization,
    authorization: req.headers.authorization || null,
  });
});

// ดู payload (แบบไม่ verify) ว่า token ข้างในมีอะไร
router.get("/whoami", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(400).json({ error: "No bearer token" });

  try {
    const decoded = jwt.decode(token, { complete: true }); // ไม่ verify แค่ถอดดู
    return res.json({ decoded });
  } catch (e) {
    return res.status(400).json({ error: "Decode failed", detail: String(e) });
  }
});

export default router;
