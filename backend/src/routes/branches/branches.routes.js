// backend/src/routes/branches.routes.js
import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

// ✅ helper หา main branch
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
 * ใช้แสดงใน dropdown ของหน้า Delivery
 * - ADMIN → เห็นทุกสาขา
 * - STAFF → เห็นเฉพาะสาขาของตัวเอง + MAIN
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
 */
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const rows = await prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        commissionRate: true,
        createdAt: true,
        updatedAt: true,
        isMain: true,
      },
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/branches (ADMIN)
 */
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { code, name, address, commissionRate, isMain } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: "code และ name ต้องไม่ว่าง" });
    }

    const normalizedCode = String(code).toUpperCase().replace(/\s+/g, "-");
    const rateNum = commissionRate == null ? null : Number(commissionRate);
    if (rateNum != null && (isNaN(rateNum) || rateNum < 0 || rateNum > 100)) {
      return res.status(400).json({ error: "commissionRate ต้องเป็นตัวเลข 0–100" });
    }

    const created = await prisma.branch.create({
      data: {
        code: normalizedCode,
        name: String(name).trim(),
        address: String(address || "").trim() || null,
        commissionRate: rateNum == null ? null : rateNum,
        isMain: !!isMain,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/branches/:id (ADMIN)
 */
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const { code, name, address, commissionRate, isMain } = req.body;
    const data = {};
    if (code !== undefined) data.code = String(code).toUpperCase().replace(/\s+/g, "-");
    if (name !== undefined) data.name = String(name).trim();
    if (address !== undefined) data.address = String(address || "").trim() || null;
    if (commissionRate !== undefined) {
      const rateNum = Number(commissionRate);
      if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
        return res.status(400).json({ error: "commissionRate ต้องเป็นตัวเลข 0–100" });
      }
      data.commissionRate = rateNum;
    }
    if (isMain !== undefined) data.isMain = !!isMain;

    const updated = await prisma.branch.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
