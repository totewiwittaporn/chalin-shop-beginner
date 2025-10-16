// backend/src/routes/products/products.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import * as ctrl from "#app/controllers/products/productsController.js";
import { prisma } from "#app/lib/prisma.js";

const router = Router();

// ------- ใช้ token ทุกเมธอด -------
router.use(requireAuth);

/** ✅ ตารางสินค้าเต็ม */
router.get("/", ctrl.list);

/** ✅ เส้นทางค้นหา (autocomplete) */
router.get("/search", ctrl.search);

/** สร้างสินค้า */
router.post("/", requireRole("ADMIN", "STAFF", "CONSIGNMENT"), async (req, res, next) => {
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
      branchId:
        (String(req.user.role).toUpperCase() === "STAFF" ? req.user.branchId : branchId) ?? null,
    };

    const created = await prisma.product.create({ data });
    res.status(201).json({
      id: created.id,
      barcode: created.barcode,
      name: created.name,
      costPrice: created.costPrice,
      salePrice: created.salePrice,
      productTypeId: created.productTypeId,
    });
  } catch (e) {
    next(e);
  }
});

/** แก้ไขสินค้า */
router.put("/:id", requireRole("ADMIN", "STAFF", "CONSIGNMENT"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

    const { barcode, name, costPrice, salePrice, productTypeId } = req.body;
    const data = {};

    if (barcode !== undefined) data.barcode = String(barcode).trim();
    if (name !== undefined) data.name = String(name).trim();
    if (costPrice !== undefined) data.costPrice = Number(costPrice) || 0;
    if (salePrice !== undefined) data.salePrice = Number(salePrice) || 0;
    if (productTypeId !== undefined) data.productTypeId = productTypeId ? Number(productTypeId) : null;

    const updated = await prisma.product.update({
      where: { id },
      data,
      select: { id: true, barcode: true, name: true, costPrice: true, salePrice: true, productTypeId: true },
    });

    res.json(updated);
  } catch (e) {
    if (e?.code === "P2002") return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });
    if (e?.code === "P2025") return res.status(404).json({ error: "ไม่พบสินค้า" });
    next(e);
  }
});

/** Low stock (คง logic เดิมของคุณไว้) */
router.get("/low-stock", requireRole("ADMIN", "STAFF", "CONSIGNMENT"), async (req, res, next) => {
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
      items = rows.map((r) => ({ id: r.productId, name: r.product?.name ?? null, stockQty: r.qty }));
    } else if (role === "STAFF" && req.user.branchId) {
      const branchId = req.user.branchId;
      const rows = await prisma.inventory.findMany({
        where: { branchId, qty: { lte: lt } },
        include: { product: true },
        orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
        take,
      });
      items = rows.map((r) => ({ id: r.productId, name: r.product?.name ?? null, stockQty: r.qty }));
    } else {
      const rows = await prisma.inventory.findMany({
        where: { qty: { lte: lt } },
        include: { product: true },
        orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
        take: 1000,
      });
      const sumByProduct = new Map();
      for (const r of rows) {
        const cur = sumByProduct.get(r.productId) || { id: r.productId, name: r.product?.name ?? null, stockQty: 0 };
        cur.stockQty += Number(r.qty || 0);
        sumByProduct.set(r.productId, cur);
      }
      items = Array.from(sumByProduct.values())
        .filter((it) => it.stockQty <= lt)
        .sort((a, b) => a.stockQty - b.stockQty || String(a.name).localeCompare(String(b.name)))
        .slice(0, take);
    }

    return res.json(items);
  } catch (e) {
    next(e);
  }
});

export default router;
