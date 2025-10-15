import express from "express";
import { prisma } from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const r = express.Router();

/**
 * GET /api/products
 * query: q, page=1, pageSize=20, limit (alias ของ pageSize)
 * response: { items, total, page, pageSize }
 */
r.get("/", requireAuth, async (req, res, next) => {
  try {
    // ✨ กัน cache เพื่อเลี่ยง 304 ที่ทำให้ dropdown ไม่อัปเดต
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const q = String(req.query.q || "").trim();

    // รองรับทั้ง pageSize และ limit (ให้ limit เป็น alias)
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSizeRaw =
      req.query.limit != null ? req.query.limit : req.query.pageSize;
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(pageSizeRaw || "20"), 10))
    );
    const skip = (page - 1) * pageSize;

    const role = String(req.user.role || "").toUpperCase();
    const branchId = req.user.branchId ?? null;

    // ปรับเงื่อนไขค้นหา: name contains, barcode contains/startsWith/equals
    const textWhere = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
            { barcode: { startsWith: q, mode: "insensitive" } },
            { barcode: { equals: q, mode: "insensitive" } },
          ],
        }
      : {};

    // ขอบเขตการมองเห็นตาม role (ADMIN = ทั้งหมด, STAFF = สาขาตัวเอง+global(null))
    const scopeWhere =
      role === "ADMIN"
        ? {}
        : branchId
        ? { OR: [{ branchId: branchId }, { branchId: null }] }
        : { branchId: null };

    const where = { AND: [textWhere, scopeWhere] };

    // ถ้ามีคำค้น ให้เรียงชื่อตามตัวอักษร (อ่านง่ายใน dropdown), ไม่งั้นใช้ createdAt desc
    const orderBy = q ? { name: "asc" } : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          barcode: true,
          name: true,
          costPrice: true,
          salePrice: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/products
 * ADMIN/STAFF/CONSIGNMENT
 */
r.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res, next) => {
    try {
      const { barcode, name, costPrice, salePrice, productTypeId, branchId } =
        req.body;
      if (!barcode || !name)
        return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

      const exists = await prisma.product.findUnique({ where: { barcode } });
      if (exists)
        return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });

      const data = {
        barcode: String(barcode).trim(),
        name: String(name).trim(),
        productTypeId: productTypeId ?? null,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        branchId:
          (String(req.user.role).toUpperCase() === "STAFF"
            ? req.user.branchId
            : branchId) ?? null,
      };

      const created = await prisma.product.create({ data });
      res.status(201).json({
        id: created.id,
        barcode: created.barcode,
        name: created.name,
        costPrice: created.costPrice,
        salePrice: created.salePrice,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/products/low-stock?lt=10&partnerId=...
 * - ADMIN/STAFF: ดูทั้งหมด หรือกำหนด partnerId
 * - CONSIGNMENT: เห็นเฉพาะ partnerId ของตัวเอง
 */
r.get(
  "/low-stock",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res, next) => {
    try {
      const lt = Math.max(0, Number(req.query.lt ?? 10));
      const take = Math.min(Math.max(1, Number(req.query.take ?? 50)), 200);
      const role = String(req.user.role).toUpperCase();

      let items = [];

      if (role === "CONSIGNMENT") {
        const partnerId = req.user.partnerId ?? null;
        if (!partnerId) return res.json([]);

        const rows = await prisma.consignmentInventory.findMany({
          where: { consignmentPartnerId: partnerId, qty: { lte: lt } },
          include: { product: true },
          orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
          take,
        });

        items = rows.map((r) => ({
          id: r.productId,
          name: r.product?.name ?? null,
          stockQty: r.qty,
        }));
      } else if (role === "STAFF" && req.user.branchId) {
        const branchId = req.user.branchId;

        const rows = await prisma.inventory.findMany({
          where: { branchId, qty: { lte: lt } },
          include: { product: true },
          orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
          take,
        });

        items = rows.map((r) => ({
          id: r.productId,
          name: r.product?.name ?? null,
          stockQty: r.qty,
        }));
      } else {
        // ADMIN: รวมทุกสาขาแล้วกรอง
        const rows = await prisma.inventory.findMany({
          where: { qty: { lte: lt } },
          include: { product: true },
          orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
          take: 1000,
        });

        const sumByProduct = new Map();
        for (const r of rows) {
          const key = r.productId;
          const cur = sumByProduct.get(key) || {
            id: r.productId,
            name: r.product?.name ?? null,
            stockQty: 0,
          };
          cur.stockQty += Number(r.qty || 0);
          sumByProduct.set(key, cur);
        }

        items = Array.from(sumByProduct.values())
          .filter((it) => it.stockQty <= lt)
          .sort(
            (a, b) =>
              a.stockQty - b.stockQty ||
              String(a.name).localeCompare(String(b.name))
          )
          .slice(0, take);
      }

      return res.json(items);
    } catch (e) {
      next(e);
    }
  }
);

export default r;
