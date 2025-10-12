import { Router } from "express";
import prisma from "#app/lib/prisma.js";

const router = Router();

/**
 * GET /api/consignment/categories?partnerId=1&q=
 * - รายการหมวดของ partner
 * - q: ค้นหาทั้ง code/name (case-insensitive)
 */
router.get("/", async (req, res, next) => {
  try {
    const inputPartnerId = Number(req.query.partnerId || 0);
    const q = String(req.query.q || "").trim();
    let partnerId = inputPartnerId;

    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });

    const items = await prisma.consignmentCategory.findMany({
      where: {
        partnerId,
        ...(q
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: {
        id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true,
      },
    });
    res.json(items);
  } catch (err) { next(err); }
});

/**
 * POST /api/consignment/categories
 * body: { partnerId, code, name }
 */
router.post("/", async (req, res, next) => {
  try {
    let { partnerId, code, name } = req.body || {};
    partnerId = Number(partnerId || 0);
    code = String(code || "").trim();
    name = String(name || "").trim();

    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });
    if (!code) return res.status(400).json({ error: "code required" });
    if (!name) return res.status(400).json({ error: "name required" });

    const created = await prisma.consignmentCategory.create({
      data: { partnerId, code, name },
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") return res.status(409).json({ error: "code ซ้ำในร้านนี้" });
    next(err);
  }
});

/**
 * PUT /api/consignment/categories/:id
 * body: { code?, name? }
 */
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: "id invalid" });

    const data = {};
    if (req.body?.code !== undefined) data.code = String(req.body.code || "").trim();
    if (req.body?.name !== undefined) data.name = String(req.body.name || "").trim();
    if (!data.code && !data.name) return res.status(400).json({ error: "ต้องมีอย่างน้อย code หรือ name" });

    const updated = await prisma.consignmentCategory.update({
      where: { id },
      data,
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  } catch (err) {
    if (err?.code === "P2002") return res.status(409).json({ error: "code ซ้ำในร้านนี้" });
    next(err);
  }
});

/**
 * GET /api/consignment/partners/:partnerId/categories
 * - ดึงหมวดตาม partner (path param)
 */
router.get("/partners/:partnerId/categories", async (req, res, next) => {
  try {
    let partnerId = Number(req.params.partnerId || 0);
    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });

    const items = await prisma.consignmentCategory.findMany({
      where: { partnerId },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json(items);
  } catch (err) { next(err); }
});

/* ------------------- Mapping endpoints ------------------- */

/**
 * GET /api/consignment/categories/partners/:partnerId/categories/:categoryId/products
 * - รายการสินค้าที่ถูก map เข้าหมวดนี้
 */
router.get("/partners/:partnerId/categories/:categoryId/products", async (req, res, next) => {
  try {
    let partnerId = Number(req.params.partnerId || 0);
    const categoryId = Number(req.params.categoryId || 0);
    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId || !categoryId) return res.status(400).json({ error: "partnerId & categoryId required" });

    const maps = await prisma.consignmentCategoryMap.findMany({
      where: { partnerId, categoryId },
      select: { productId: true },
    });
    const productIds = maps.map((m) => m.productId);
    if (productIds.length === 0) return res.json([]);

    // ✅ แก้ select: ใช้ barcode แทน sku
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      orderBy: { id: "asc" },
      select: { id: true, barcode: true, name: true },
    });
    res.json(products);
  } catch (err) { next(err); }
});

/**
 * POST /api/consignment/categories/partners/:partnerId/categories/:categoryId/map
 * body: { productId } หรือ { productIds: number[] }
 */
router.post("/partners/:partnerId/categories/:categoryId/map", async (req, res, next) => {
  try {
    let partnerId = Number(req.params.partnerId || 0);
    const categoryId = Number(req.params.categoryId || 0);
    const { productId, productIds } = req.body || {};
    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId || !categoryId) return res.status(400).json({ error: "partnerId & categoryId required" });

    const list = Array.isArray(productIds)
      ? productIds
      : (productId ? [productId] : []);
    if (list.length === 0) return res.status(400).json({ error: "productId(s) required" });

    const ops = list.map((pid) =>
      prisma.consignmentCategoryMap.upsert({
        where: { partnerId_productId: { partnerId, productId: Number(pid) } },
        update: { categoryId }, // ย้ายหมวดได้
        create: { partnerId, categoryId, productId: Number(pid) },
      })
    );
    const results = await prisma.$transaction(ops);
    res.json({ ok: true, count: results.length });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/consignment/categories/partners/:partnerId/categories/:categoryId/products/:productId
 */
router.delete("/partners/:partnerId/categories/:categoryId/products/:productId", async (req, res, next) => {
  try {
    let partnerId = Number(req.params.partnerId || 0);
    const categoryId = Number(req.params.categoryId || 0);
    const productId = Number(req.params.productId || 0);
    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId || !categoryId || !productId) {
      return res.status(400).json({ error: "partnerId & categoryId & productId required" });
    }

    await prisma.consignmentCategoryMap.delete({
      where: { partnerId_productId: { partnerId, productId } },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
