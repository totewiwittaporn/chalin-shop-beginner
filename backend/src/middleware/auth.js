// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

/** ตรวจว่ามี Bearer token และ verify ได้ */
export function requireAuth(req, res, next) {
  // ✅ ต้องอ่านจาก req.headers.authorization ไม่ใช่ตัวแปรชื่อ auth ที่ไม่ประกาศ
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // ปรับ role ให้เป็นตัวพิมพ์ใหญ่ไว้เลย ป้องกันเคส 'admin' vs 'ADMIN'
    if (payload?.role && typeof payload.role === "string") {
      payload.role = payload.role.toUpperCase();
    }
    req.user = payload; // { id, role, branchId?, iat, exp }
    return next();
  } catch (e) {
    console.error("[AUTH] verify failed:", e?.message);
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

/** อนุญาตเฉพาะบาง role */
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ error: "Unauthorized" });
    const role = String(req.user.role).toUpperCase();
    if (!allowed.map(String).map(r => r.toUpperCase()).includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
