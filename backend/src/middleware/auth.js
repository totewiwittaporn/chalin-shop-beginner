// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * ตรวจ token → ใส่ req.user ให้มี { id, email, name, role, roles, branchId, partnerId }
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const role = payload.role ? String(payload.role).toUpperCase() : undefined;
    const roles = Array.isArray(payload.roles) && payload.roles.length
      ? payload.roles.map((r) => String(r).toUpperCase())
      : (role ? [role] : []);

    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role,
      roles,
      branchId: payload.branchId ?? null,
      partnerId: payload.partnerId ?? null,
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/**
 * RBAC: อนุญาตเฉพาะผู้ใช้ที่มี role อยู่ในชุดที่กำหนด
 * ใช้แบบ:
 *   router.get("/", requireAuth, requireRole("ADMIN", "MANAGER"), handler)
 */
export function requireRole(...allowedRoles) {
  const allow = allowedRoles.map((r) => String(r).toUpperCase());
  return (req, res, next) => {
    const roles = (req.user?.roles || []).map((r) => String(r).toUpperCase());
    // มี role ตัดกันอย่างน้อย 1 ตัว = ผ่าน
    const ok = roles.some((r) => allow.includes(r));
    if (!ok) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

/**
 * เผื่อบางที่อยากส่งเป็น array ทีเดียว
 *   router.post("/", requireAuth, requireAnyRole(["ADMIN","STAFF"]), handler)
 */
export const requireAnyRole = (list) => requireRole(...(list || []));

// (ทางเลือก) export alias ให้ route เก่า ๆ ใช้ได้
export const authMiddleware = requireAuth;
