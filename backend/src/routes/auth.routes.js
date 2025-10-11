// src/routes/auth.routes.js
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

    res.status(201).json({ id: user.id, email: user.email, role: user.role, branchId: user.branchId });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/login
 * NOTE: ห้ามมีโค้ดที่อ้างถึง `user` อยู่นอก handler นี้
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

    const token = jwt.sign(
      {
        id: user.id,
        role: String(user.role).toUpperCase(),
        branchId: user.branchId ?? null,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d", algorithm: "HS256" }
    );

    // 4) ตอบกลับ
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
