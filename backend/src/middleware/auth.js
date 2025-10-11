// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }

  // DEBUG >>>
  const preview = `${token.slice(0, 12)}...${token.slice(-12)}`;
  console.log("[AUTH] incoming token len:", token.length, "preview:", preview);
  // <<< DEBUG

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload?.role && typeof payload.role === "string") {
      payload.role = payload.role.toUpperCase();
    }
    req.user = payload;
    return next();
  } catch (e) {
    console.warn("[AUTH] verify failed:", e.name, e.message);
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: token expired" });
    }
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized: invalid token" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ error: "Unauthorized" });
    const role = String(req.user.role).toUpperCase();
    if (!allowed.map(r => String(r).toUpperCase()).includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
