// backend/src/routes/branches.routes.js
import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

// ✅ helper หา main branch (ไม่มี isMain จะ fallback ที่ code)
async function getMainBranchId() {
  try {
    const main = await prisma.branch.findFirst({
      where: { isMain: true },
      select: { id: true },
    });
    if (main?.id) return main.id;
  } catch (_) {}
  const fallback = await prisma.branch.findFirst({
    where: { code: { in: ["MAIN", "HQ", "CENTER"] } },
    select: { id: true },
  });
  if (!fallback?.id) throw new Error("Main branch not found (no isMain or code=MAIN)");
  return fallback.id;
}

const router = Router();

/**
 * GET /api/branches/options
 * ใช้สำหรับ dropdown ของหน้า Delivery
 * - ADMIN → เห็นทุกสาขา
 * - STAFF → เห็นเฉพาะ [สาขาตัวเอง, MAIN]
 */
router.get("/options", requireAuth, requireRole("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const { role, branchId } = req.user || {};
    if (role === "ADMIN") {
      const rows = await prisma.branch.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      });
      return res.json(rows);
    }
    const mainId = await getMainBranchId();
    const ids = Array.from(new Set([Number(branchId), Number(mainId)].filter(Boolean)));
    const rows = await prisma.branch.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });
    return res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/branches
 * ใช้แสดงในหน้าตาราง “จัดการสาขา”
 * - map addressLine1/2/3 → address (สตริงเดียว) ให้ตรงกับ UI
 */
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const rows = await prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        addressLine3: true,
        // ❌ อย่า select ฟิลด์ที่ schema ไม่มี เช่น commissionRate, isMain, createdAt, updatedAt
      },
    });

    const mapped = rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      address: [b.addressLine1, b.addressLine2, b.addressLine3]
        .filter(Boolean)
        .join("\n") || null,
      commissionRate: null, // schema ไม่มีฟิลด์นี้ → ให้ UI แสดง "-"
    }));

    res.json(mapped);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/branches (ADMIN)
 * - เก็บ address ลง addressLine1 (ชั่วคราว)
 * - ละเลย commissionRate ถ้า schema ไม่มี
 */
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { code, name, address /* commissionRate, isMain */ } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: "code และ name ต้องไม่ว่าง" });
    }

    const normalizedCode = String(code).toUpperCase().replace(/\s+/g, "-");

    const created = await prisma.branch.create({
      data: {
        code: normalizedCode,
        name: String(name).trim(),
        addressLine1: String(address || "").trim() || null,
        // ❌ ไม่มี commissionRate / isMain ใน schema ปัจจุบัน
      },
      select: {
        id: true,
        code: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        addressLine3: true,
      },
    });

    res.status(201).json({
      id: created.id,
      code: created.code,
      name: created.name,
      address: [created.addressLine1, created.addressLine2, created.addressLine3].filter(Boolean).join("\n") || null,
      commissionRate: null,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/branches/:id (ADMIN)
 * - อัปเดต address → addressLine1
 * - ละเลย commissionRate / isMain ถ้า schema ไม่มี
 */
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const { code, name, address /* commissionRate, isMain */ } = req.body;
    const data = {};
    if (code !== undefined) data.code = String(code).toUpperCase().replace(/\s+/g, "-");
    if (name !== undefined) data.name = String(name).trim();
    if (address !== undefined) data.addressLine1 = String(address || "").trim() || null;

    const updated = await prisma.branch.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        addressLine3: true,
      },
    });

    res.json({
      id: updated.id,
      code: updated.code,
      name: updated.name,
      address: [updated.addressLine1, updated.addressLine2, updated.addressLine3].filter(Boolean).join("\n") || null,
      commissionRate: null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
