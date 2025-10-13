// backend/src/routes/auth/auth.routes.js
import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, role = Role.QUOTE_VIEWER, branchId = null } = req.body;

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, name, role, branchId },
    });

    res
      .status(201)
      .json({ id: user.id, email: user.email, role: user.role, branchId: user.branchId });
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

    // 3) sign token (log hash head เพื่อดีบั๊ก)
    const secret = String(process.env.JWT_SECRET || "");
    console.log(
      "[SIGN] JWT_SECRET_SHA256_HEAD:",
      createHash("sha256").update(secret).digest("hex").slice(0, 12)
    );

    // ระวัง: ทำให้ payload ครบถ้วน ใช้ทั้ง role และ roles
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: String(user.role).toUpperCase(),
      roles: [String(user.role).toUpperCase()], // เผื่ออนาคตมี multi-role
      branchId: user.branchId ?? null,
      partnerId: user.partnerId ?? null,
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h", // ← default 1 ชั่วโมงตามที่ต้องการ
      algorithm: "HS256",
    });

    // 4) ตอบกลับ (ส่งข้อมูล user ให้ frontend ใช้ทันที)
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
 * POST /api/auth/logout
 * JWT เป็น stateless ทำลายที่ฝั่งเซิร์ฟเวอร์ไม่ได้ (ถ้าไม่ทำ token blacklist)
 * ให้ client ลบ token เอง
 */
router.post("/logout", async (_req, res) => {
  res.json({ ok: true });
});

export default router;
