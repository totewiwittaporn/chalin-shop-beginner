// backend/src/routes/auth/auth.routes.js
import { Router } from "express";
import pkg from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

// ✅ ต้องประกาศ/ดึง PrismaClient, Prisma มาก่อน แล้วค่อย new PrismaClient()
const { PrismaClient, Prisma } = pkg;
const { Role } = Prisma;

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      role = Role?.QUOTE_VIEWER ?? "QUOTE_VIEWER",
      branchId = null,
    } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, name, role, branchId },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) หา user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // 2) ตรวจรหัสผ่าน
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // 3) sign token
    const secret = String(process.env.JWT_SECRET || "");
    if (!secret) {
      console.warn(
        "[WARN] JWT_SECRET is empty. Set JWT_SECRET in your backend .env for security."
      );
    }
    console.log(
      "[SIGN] JWT_SECRET_SHA256_HEAD:",
      createHash("sha256").update(secret).digest("hex").slice(0, 12)
    );

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: String(user.role).toUpperCase(),
      roles: [String(user.role).toUpperCase()],
      branchId: user.branchId ?? null,
      partnerId: user.partnerId ?? null,
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      algorithm: "HS256",
    });

    res.json({
      token,
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        roles: payload.roles,
        branchId: payload.branchId,
        partnerId: payload.partnerId,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/auth/me
 * - ตรวจ Authorization: Bearer <token>
 * - คืนข้อมูลผู้ใช้จาก token (และ sync บางฟิลด์จาก DB ถ้าต้องการ)
 */
router.get("/me", async (req, res, _next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const secret = String(process.env.JWT_SECRET || "");
    const decoded = jwt.verify(token, secret); // ถ้าไม่ถูกต้องจะ throw

    // จะดึงข้อมูลสดจาก DB ก็ได้ (กันกรณี role ถูกเปลี่ยน)
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        partnerId: true,
      },
    });
    if (!dbUser) return res.status(401).json({ error: "User not found" });

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: String(dbUser.role).toUpperCase(),
      roles: [String(dbUser.role).toUpperCase()],
      branchId: dbUser.branchId ?? null,
      partnerId: dbUser.partnerId ?? null,
    });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

/**
 * POST /api/auth/logout
 * - JWT เป็น stateless ให้ client ลบ token เอง
 */
router.post("/logout", async (_req, res) => {
  res.json({ ok: true });
});

export default router;
