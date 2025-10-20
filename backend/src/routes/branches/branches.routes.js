// backend/src/routes/branches.routes.js
import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const router = Router();

/**
 * หาค่า id ของสาขาที่ถือสต็อก “สาขาหลัก” (HQ)
 * 1) ใช้ Headquarters.stockBranchId ถ้ามี
 * 2) ถ้าไม่มี ให้ลอง fallback ด้วย code MAIN/HQ/CENTER
 * ถ้ายังไม่พบ ให้คืน null (อย่า throw) เพื่อให้ endpoint อื่นทำงานต่อได้
 */
async function getMainStockBranchId() {
  // 1) ลองจาก HQ ก่อน
  const hq = await prisma.headquarters.findFirst({
    select: { stockBranchId: true },
  });
  if (hq?.stockBranchId) return hq.stockBranchId;

  // 2) ลอง fallback code
  const fallback = await prisma.branch.findFirst({
    where: { code: { in: ["MAIN", "HQ", "CENTER"] } },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return fallback?.id ?? null; // ❗️อย่า throw
}

/** OPTIONS: ใช้กับ dropdown ส่งของ */
router.get(
  "/options",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  async (req, res, next) => {
    try {
      const { role, branchId } = req.user || {};

      if (role === "ADMIN") {
        const rows = await prisma.branch.findMany({
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
        });
        return res.json(rows);
      }

      // STAFF/อื่น ๆ: ให้เลือกได้เฉพาะสาขาตัวเอง + สาขาหลัก (ถ้ามี)
      const mainId = await getMainStockBranchId();
      const ids = Array.from(
        new Set([Number(branchId), Number(mainId)].filter(Boolean))
      );

      if (ids.length === 0) {
        // ยังไม่มีสาขาหลักและไม่มี branchId ใน token (กรณีพิเศษ)
        return res.json([]);
      }

      const rows = await prisma.branch.findMany({
        where: { id: { in: ids } },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      });
      return res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

/** LIST สำหรับหน้า “สาขา” */
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const mainStockBranchId = await getMainStockBranchId(); // อาจเป็น null ได้

    const rows = await prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        addressLine3: true,
        phone: true,
        taxId: true,
        commissionRate: true,
      },
    });

    const data = rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      address:
        [b.addressLine1, b.addressLine2, b.addressLine3]
          .filter(Boolean)
          .join("\n") || null,
      addressLine2: b.addressLine2 ?? null,
      addressLine3: b.addressLine3 ?? null,
      phone: b.phone ?? null,
      taxId: b.taxId ?? null,
      commissionRate: b.commissionRate ?? null,
      // ถ้ายังไม่ตั้ง HQ/fallback ให้เป็น false ไปก่อน
      isMain: mainStockBranchId ? b.id === mainStockBranchId : false,
    }));

    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** CREATE (ADMIN) */
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const {
      code,
      name,
      address,
      addressLine2,
      addressLine3,
      phone,
      taxId,
      // ไม่รองรับ isMain แล้ว (derived)
      commissionRate,
    } = req.body;

    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: "code และ name ต้องไม่ว่าง" });
    }

    const normalizedCode = String(code).toUpperCase().replace(/\s+/g, "-");

    const created = await prisma.branch.create({
      data: {
        code: normalizedCode,
        name: String(name).trim(),
        addressLine1: (address ?? "").trim() || null,
        addressLine2: (addressLine2 ?? "").trim() || null,
        addressLine3: (addressLine3 ?? "").trim() || null,
        phone: (phone ?? "").trim() || null,
        taxId: (taxId ?? "").trim() || null,
        commissionRate:
          commissionRate === "" || commissionRate == null
            ? null
            : Number(commissionRate),
      },
      select: {
        id: true,
        code: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        addressLine3: true,
        phone: true,
        taxId: true,
        commissionRate: true,
      },
    });

    const mainStockBranchId = await getMainStockBranchId();

    res.status(201).json({
      id: created.id,
      code: created.code,
      name: created.name,
      address:
        [created.addressLine1, created.addressLine2, created.addressLine3]
          .filter(Boolean)
          .join("\n") || null,
      addressLine2: created.addressLine2,
      addressLine3: created.addressLine3,
      phone: created.phone,
      taxId: created.taxId,
      commissionRate: created.commissionRate,
      isMain: mainStockBranchId ? created.id === mainStockBranchId : false,
    });
  } catch (e) {
    next(e);
  }
});

/** UPDATE (ADMIN) */
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const {
      code,
      name,
      address,
      addressLine2,
      addressLine3,
      phone,
      taxId,
      // ไม่รองรับ isMain แล้ว (derived)
      commissionRate,
    } = req.body;

    const data = {};
    if (code !== undefined)
      data.code = String(code).toUpperCase().replace(/\s+/g, "-");
    if (name !== undefined) data.name = String(name).trim();

    if (address !== undefined)
      data.addressLine1 = (address ?? "").trim() || null;
    if (addressLine2 !== undefined)
      data.addressLine2 = (addressLine2 ?? "").trim() || null;
    if (addressLine3 !== undefined)
      data.addressLine3 = (addressLine3 ?? "").trim() || null;

    if (phone !== undefined) data.phone = (phone ?? "").trim() || null;
    if (taxId !== undefined) data.taxId = (taxId ?? "").trim() || null;

    if (commissionRate !== undefined) {
      data.commissionRate =
        commissionRate === "" || commissionRate == null
          ? null
          : Number(commissionRate);
    }

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
        phone: true,
        taxId: true,
        commissionRate: true,
      },
    });

    const mainStockBranchId = await getMainStockBranchId();

    res.json({
      id: updated.id,
      code: updated.code,
      name: updated.name,
      address:
        [updated.addressLine1, updated.addressLine2, updated.addressLine3]
          .filter(Boolean)
          .join("\n") || null,
      addressLine2: updated.addressLine2,
      addressLine3: updated.addressLine3,
      phone: updated.phone,
      taxId: updated.taxId,
      commissionRate: updated.commissionRate,
      isMain: mainStockBranchId ? updated.id === mainStockBranchId : false,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
