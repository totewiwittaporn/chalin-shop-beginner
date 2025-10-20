import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const router = Router();

// GET /api/headquarters                -> list ทั้งหมด
router.get("/", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const list = await prisma.headquarters.findMany({
    orderBy: [{ isActive: "desc" }, { id: "asc" }],
  });
  res.json({ data: list });
});

// GET /api/headquarters/active         -> HQ ที่ active
router.get("/active", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const hq = await prisma.headquarters.findFirst({ where: { isActive: true } });
  if (!hq) return res.status(404).json({ error: "ยังไม่มีสาขาหลัก (Headquarters) ที่ Active" });
  res.json(hq);
});

// POST /api/headquarters               -> "สร้างสาขาหลัก" (หรือ HQ อื่น)
// body: { code, name, isActive?, stockBranchId? }
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { code, name, isActive = false, stockBranchId = null } = req.body ?? {};
  if (!code || !name) return res.status(400).json({ error: "ต้องระบุ code และ name" });

  // ถ้าจะสร้างพร้อม isActive=true ต้องเคลียร์ตัวอื่นให้ false ใน txn
  const result = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.headquarters.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    return tx.headquarters.create({
      data: {
        code,
        name,
        isActive: !!isActive,
        stockBranchId: stockBranchId ?? null,
      },
    });
  });

  res.status(201).json(result);
});

// PATCH /api/headquarters/:id/activate -> ตั้งตัวนี้ให้ Active (เหลือ active ได้ตัวเดียว)
router.patch("/:id/activate", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const exists = await prisma.headquarters.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "ไม่พบ Headquarters" });

  await prisma.$transaction([
    prisma.headquarters.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } }),
    prisma.headquarters.update({ where: { id }, data: { isActive: true } }),
  ]);

  const active = await prisma.headquarters.findUnique({ where: { id } });
  res.json({ message: "ตั้งสาขาหลักเรียบร้อย", active });
});

// (ตัวเลือก) PATCH /api/headquarters/:id  -> อัปเดตชื่อ/รหัส/stockBranchId
router.patch("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { code, name, stockBranchId, isActive } = req.body ?? {};

  // ถ้ามี isActive ให้ใช้ endpoint /activate ด้านบนจะชัดเจนกว่า
  if (typeof isActive === "boolean")
    return res.status(400).json({ error: "กรุณาใช้ /:id/activate เมื่อต้องการสลับ Active" });

  const updated = await prisma.headquarters.update({
    where: { id },
    data: { code, name, stockBranchId },
  });
  res.json(updated);
});

export default router;
