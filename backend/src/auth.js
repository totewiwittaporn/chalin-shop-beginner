// backend/src/auth.js (แนวทาง)
import jwt from "jsonwebtoken";
import { getUserById } from "#app/services/user.service.js"; // สมมติว่าคุณมี service นี้

export function authMiddleware(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // เติมโปรไฟล์จาก DB (แนะนำ)
    getUserById(payload.id)
      .then((dbUser) => {
        req.user = {
          id: payload.id,
          role: String(payload.role || dbUser?.role || "STAFF").toUpperCase(),
          name: dbUser?.name || payload.name || null,
          email: dbUser?.email || payload.email || null,
          branchId: dbUser?.branchId ?? payload.branchId ?? null,
          branch: dbUser?.branch ? { id: dbUser.branch.id, name: dbUser.branch.name } : undefined,
        };
        next();
      })
      .catch(() => {
        // ถ้าหา DB ไม่เจอ ก็ส่งเท่าที่มีจาก payload
        req.user = {
          id: payload.id,
          role: String(payload.role || "STAFF").toUpperCase(),
          name: payload.name || null,
          email: payload.email || null,
          branchId: payload.branchId ?? null,
        };
        next();
      });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
