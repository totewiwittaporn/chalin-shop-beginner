import express from "express";
import { prisma } from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const r = express.Router();

/**
 * GET /api/products
 * query: q, page=1, pageSize=20
 */
r.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "20"), 10)));
    const skip = (page - 1) * pageSize;

    const role = String(req.user.role || "").toUpperCase();
    const branchId = req.user.branchId ?? null;

    const where = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        role === "ADMIN"
          ? {}
          : branchId
          ? { OR: [{ branchId: branchId }, { branchId: null }] }
          : { branchId: null },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
r.post("/", requireAuth, requireRole("ADMIN", "STAFF", "CONSIGNMENT"), async (req, res, next) => {
  try {
    const { barcode, name, costPrice, salePrice, productTypeId, branchId } = req.body;
    if (!barcode || !name) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

    const exists = await prisma.product.findUnique({ where: { barcode } });
    if (exists) return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });

    const data = {
      barcode: String(barcode).trim(),
      name: String(name).trim(),
      productTypeId: productTypeId ?? null,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      branchId: (String(req.user.role).toUpperCase() === "STAFF" ? req.user.branchId : branchId) ?? null,
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
});

/**
 * GET /api/products/low-stock?lt=10&partnerId=...
 * - ADMIN/STAFF: ดูทั้งหมด หรือกำหนด partnerId
 * - CONSIGNMENT: เห็นเฉพาะ partnerId ของตัวเอง
 * ใช้ ConsignmentInventory จาก schema จริง
 */
r.get(
  "/low-stock",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res, next) => {
    try {
      const lt = Number(req.query.lt ?? 10);
      const partnerQuery = req.query.partnerId ? Number(req.query.partnerId) : null;

      let partnerId = partnerQuery;
      if (String(req.user.role).toUpperCase() === "CONSIGNMENT") {
        partnerId = req.user.partnerId ?? null;
      }

      const where = {
        qtyOnHand: { lt },
        ...(partnerId ? { partnerId } : {}),
      };

      const rows = await prisma.consignmentInventory.findMany({
        where,
        include: {
          product: true,
          partner: true,
        },
        orderBy: [{ qtyOnHand: "asc" }, { partnerId: "asc" }],
        take: 200,
      });

      const items = rows.map((r) => ({
        id: r.id,
        partnerId: r.partnerId,
        partnerName: r.partner?.name ?? null,
        productId: r.productId,
        barcode: r.product?.barcode ?? null,
        name: r.product?.name ?? null,
        qtyOnHand: r.qtyOnHand,
        threshold: lt,
      }));

      res.json({ items, total: items.length });
    } catch (e) {
      next(e);
    }
  }
);

export default r;
