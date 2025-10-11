// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Allowed roles in our system (enum)
 */
const ALLOWED_ROLES = ["ADMIN", "STAFF", "CONSIGNMENT", "QUOTE_VIEWER"];

/**
 * Try parse Bearer token from Authorization header.
 */
function extractBearer(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;
  return authorization.slice(7);
}

/**
 * Coerce a value to integer or null.
 */
function toIntOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize user payload:
 * - uppercase role
 * - coerce ids to numbers/null
 */
function normalizePayload(payload) {
  const role = String(payload?.role || "").toUpperCase();
  const norm = {
    id: toIntOrNull(payload?.id),
    role,
    branchId: toIntOrNull(payload?.branchId),
    partnerId: toIntOrNull(payload?.partnerId),
    // keep any extra claims as-is (email, name, etc.)
    ...payload,
    role, // ensure override to uppercase
    branchId: toIntOrNull(payload?.branchId),
    partnerId: toIntOrNull(payload?.partnerId),
  };
  return norm;
}

/**
 * In dev (non-production), allow header-based impersonation when no JWT:
 *  - x-role, x-branch-id, x-partner-id
 */
function tryDevImpersonation(req) {
  if (process.env.NODE_ENV === "production") return null;
  const devRole = req.header("x-role");
  if (!devRole) return null; // only when explicitly provided
  const payload = {
    id: 1,
    role: devRole,
    branchId: req.header("x-branch-id"),
    partnerId: req.header("x-partner-id"),
  };
  return normalizePayload(payload);
}

/**
 * Require a valid JWT (or dev impersonation) and attach req.user
 */
export function requireAuth(req, res, next) {
  try {
    const token = extractBearer(req);

    let payload = null;
    if (token) {
      // DEBUG (optional)
      if (process.env.AUTH_DEBUG === "1") {
        const preview = `${token.slice(0, 12)}...${token.slice(-12)}`;
        console.log("[AUTH] token len:", token.length, "preview:", preview);
      }
      const raw = jwt.verify(token, process.env.JWT_SECRET);
      payload = normalizePayload(raw);
    } else {
      // Dev fallback (only when explicitly impersonating)
      payload = tryDevImpersonation(req);
      if (!payload) {
        return res.status(401).json({ error: "Unauthorized: no token" });
      }
    }

    // Validate role
    if (!payload?.role || !ALLOWED_ROLES.includes(payload.role)) {
      return res.status(403).json({ error: "Forbidden: invalid role" });
    }

    // Attach convenience flags
    payload.isAdmin = payload.role === "ADMIN";
    payload.isStaff = payload.role === "STAFF";
    payload.isConsignment = payload.role === "CONSIGNMENT";
    payload.isQuoteViewer = payload.role === "QUOTE_VIEWER";

    req.user = payload;
    return next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: token expired" });
    }
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized: invalid token" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Require role to be one of allowed list.
 * Usage: app.get("/admin", requireAuth, requireRole("ADMIN"), handler)
 */
export function requireRole(...allowed) {
  const allowSet = new Set(allowed.map((r) => String(r).toUpperCase()));
  return (req, res, next) => {
    const role = String(req.user?.role || "").toUpperCase();
    if (!role) return res.status(401).json({ error: "Unauthorized" });
    if (!allowSet.has(role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

/**
 * Ensure the request is scoped to the user's own partner (for CONSIGNMENT flows).
 * - If user is CONSIGNMENT: partnerId in request must equal user.partnerId
 * - ADMIN/STAFF can pass any partnerId
 * Call in routes that accept ?partnerId= or body partnerId
 */
export function requirePartnerScope(resolvePartnerId) {
  return (req, res, next) => {
    try {
      const partnerId = toIntOrNull(resolvePartnerId(req));
      if (!partnerId) return res.status(400).json({ error: "partnerId required" });

      if (req.user.isConsignment) {
        if (!req.user.partnerId || req.user.partnerId !== partnerId) {
          return res.status(403).json({ error: "Forbidden: partner scope" });
        }
      }
      // attach resolved partnerId for handler convenience
      req.partnerId = partnerId;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Ensure STAFF is limited to own branch. ADMIN can pass any branch.
 * Provide a resolver that returns branchId from req (query/body/params).
 */
export function requireBranchScope(resolveBranchId) {
  return (req, res, next) => {
    try {
      const branchId = toIntOrNull(resolveBranchId(req));
      if (!branchId) return res.status(400).json({ error: "branchId required" });

      if (req.user.isStaff) {
        if (!req.user.branchId || req.user.branchId !== branchId) {
          return res.status(403).json({ error: "Forbidden: branch scope" });
        }
      }
      req.branchId = branchId;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Optional helper to get a safe partnerId with role rules:
 * - CONSIGNMENT: force own partnerId
 * - ADMIN/STAFF: accept explicit value, else null
 */
export function resolvePartnerIdByRole(req, explicit) {
  if (req.user.isConsignment) return req.user.partnerId || null;
  return toIntOrNull(explicit);
}

/**
 * Optional helper to get a safe branchId with role rules:
 * - STAFF: force own branchId
 * - ADMIN/CONSIGNMENT/QUOTE_VIEWER: accept explicit or null
 */
export function resolveBranchIdByRole(req, explicit) {
  if (req.user.isStaff) return req.user.branchId || null;
  return toIntOrNull(explicit);
}
