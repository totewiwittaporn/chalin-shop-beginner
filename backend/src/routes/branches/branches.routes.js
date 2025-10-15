// backend/src/routes/branches.routes.js
import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

// ใช้ isMain ถ้ามี; ถ้าไม่มี ให้ fallback ด้วย code
async function getMainBranchId() {
  // มี isMain แล้ว ใช้อันนี้ก่อน
  const main = await prisma.branch.findFirst({ where: { isMain: true }, select: { id: true } });
  if (main?.id) return main.id;
  const fallback = await prisma.branch.findFirst({
    where: { code: { in: ["MAIN", "HQ", "CENTER"] } }, select: { id: true }
  });
  if (!fallback?.id) throw new Error("Main branch not found");
  return fallback.id;
}

const router = Router();

/** OPTIONS: ใช้กับ dropdown ส่งของ */
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
  } catch (e) { next(e); }
});

/** LIST สำหรับหน้า “สาขา” */
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const rows = await prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true, code: true, name: true,
        addressLine1: true, addressLine2: true, addressLine3: true,
        phone: true, taxId: true, isMain: true, commissionRate: true,
      },
    });

    const mapped = rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      address: [b.addressLine1, b.addressLine2, b.addressLine3].filter(Boolean).join("\n") || null,
      addressLine2: b.addressLine2 ?? null,
      addressLine3: b.addressLine3 ?? null,
      phone: b.phone ?? null,
      taxId: b.taxId ?? null,
      isMain: !!b.isMain,
      commissionRate: b.commissionRate ?? null,
    }));

    res.json(mapped);
  } catch (e) { next(e); }
});

/** CREATE (ADMIN) */
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const {
      code, name,
      address, addressLine2, addressLine3,
      phone, taxId, isMain, commissionRate,
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
        isMain: typeof isMain === "boolean" ? isMain : false,
        commissionRate:
          commissionRate === "" || commissionRate == null ? null : Number(commissionRate),
      },
      select: {
        id: true, code: true, name: true,
        addressLine1: true, addressLine2: true, addressLine3: true,
        phone: true, taxId: true, isMain: true, commissionRate: true,
      },
    });

    res.status(201).json({
      id: created.id,
      code: created.code,
      name: created.name,
      address: [created.addressLine1, created.addressLine2, created.addressLine3].filter(Boolean).join("\n") || null,
      addressLine2: created.addressLine2,
      addressLine3: created.addressLine3,
      phone: created.phone,
      taxId: created.taxId,
      isMain: created.isMain,
      commissionRate: created.commissionRate,
    });
  } catch (e) { next(e); }
});

/** UPDATE (ADMIN) */
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const {
      code, name,
      address, addressLine2, addressLine3,
      phone, taxId, isMain, commissionRate,
    } = req.body;

    const data = {};
    if (code !== undefined) data.code = String(code).toUpperCase().replace(/\s+/g, "-");
    if (name !== undefined) data.name = String(name).trim();

    if (address !== undefined) data.addressLine1 = (address ?? "").trim() || null;
    if (addressLine2 !== undefined) data.addressLine2 = (addressLine2 ?? "").trim() || null;
    if (addressLine3 !== undefined) data.addressLine3 = (addressLine3 ?? "").trim() || null;

    if (phone !== undefined) data.phone = (phone ?? "").trim() || null;
    if (taxId !== undefined) data.taxId = (taxId ?? "").trim() || null;

    if (isMain !== undefined) data.isMain = !!isMain;
    if (commissionRate !== undefined)
      data.commissionRate = commissionRate === "" || commissionRate == null ? null : Number(commissionRate);

    const updated = await prisma.branch.update({
      where: { id },
      data,
      select: {
        id: true, code: true, name: true,
        addressLine1: true, addressLine2: true, addressLine3: true,
        phone: true, taxId: true, isMain: true, commissionRate: true,
      },
    });

    res.json({
      id: updated.id,
      code: updated.code,
      name: updated.name,
      address: [updated.addressLine1, updated.addressLine2, updated.addressLine3].filter(Boolean).join("\n") || null,
      addressLine2: updated.addressLine2,
      addressLine3: updated.addressLine3,
      phone: updated.phone,
      taxId: updated.taxId,
      isMain: updated.isMain,
      commissionRate: updated.commissionRate,
    });
  } catch (e) { next(e); }
});

export default router;
