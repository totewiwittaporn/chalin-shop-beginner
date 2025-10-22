// backend/src/controllers/consignment/consignmentCategoryProducts.Controller.js
import prisma from "#app/lib/prisma.js";

// GET /api/consignment/categories/:categoryId/products
export async function listProductsOfCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ error: "categoryId is required" });
    }

    const category = await prisma.consignmentCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, partnerId: true },
    });
    if (!category) return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });

    const maps = await prisma.consignmentCategoryMap.findMany({
      where: { categoryId },
      include: { product: true },
      orderBy: { id: "asc" },
    });

    const productIds = maps.map((m) => m.productId);
    const prices = productIds.length
      ? await prisma.consignmentInventory.findMany({
          where: { partnerId: category.partnerId, productId: { in: productIds } },
          select: { productId: true, price: true },
        })
      : [];
    const priceByProductId = new Map(prices.map((p) => [p.productId, p.price]));

    const items = maps.map((m) => ({
      productId: m.productId,
      categoryId: m.categoryId,
      partnerId: category.partnerId,
      price: priceByProductId.get(m.productId) ?? null,
      product: m.product,
    }));

    return res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}

// POST /api/consignment/categories/:categoryId/products
// body รองรับ 2 แบบ:
// 1) { productIds: number[] }
// 2) { items: [{ productId: number, price?: number|string }] }
export async function addProductsToCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ error: "categoryId is required" });
    }

    const category = await prisma.consignmentCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, partnerId: true },
    });
    if (!category) return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });

    let items = [];
    if (Array.isArray(req.body?.items)) {
      items = req.body.items
        .map((x) => ({
          productId: Number(x.productId),
          price: x.price !== undefined && x.price !== null ? Number(x.price) : undefined,
        }))
        .filter((x) => Number.isFinite(x.productId));
    } else if (Array.isArray(req.body?.productIds)) {
      items = req.body.productIds
        .map((pid) => ({ productId: Number(pid) }))
        .filter((x) => Number.isFinite(x.productId));
    }
    if (items.length === 0) {
      return res.status(400).json({ error: "NO_PRODUCTS" });
    }

    const partnerId = category.partnerId;

    const result = await prisma.$transaction(async (tx) => {
      // 1) ตั้ง/อัปเดตราคาเฉพาะร้าน (ถ้ามีส่งมา)
      for (const it of items) {
        if (it.price !== undefined) {
          await tx.consignmentInventory.upsert({
            where: { partnerId_productId: { partnerId, productId: it.productId } },
            update: { price: it.price },
            create: {
              partnerId,
              productId: it.productId,
              qtyOnHand: 0,
              price: it.price,
            },
          });
        }
      }
      // 2) upsert mapping (ย้ายหมวดได้ด้วย update: { categoryId })
      await Promise.all(
        items.map((it) =>
          tx.consignmentCategoryMap.upsert({
            where: { partnerId_productId: { partnerId, productId: it.productId } },
            update: { categoryId },
            create: { partnerId, categoryId, productId: it.productId },
          })
        )
      );

      // ส่งคืนรายการล่าสุด
      const maps = await tx.consignmentCategoryMap.findMany({
        where: { categoryId },
        include: { product: true },
        orderBy: { id: "asc" },
      });
      const productIds = maps.map((m) => m.productId);
      const prices = await tx.consignmentInventory.findMany({
        where: { partnerId, productId: { in: productIds } },
        select: { productId: true, price: true },
      });
      const priceByProductId = new Map(prices.map((p) => [p.productId, p.price]));
      return maps.map((m) => ({
        productId: m.productId,
        categoryId: m.categoryId,
        partnerId,
        price: priceByProductId.get(m.productId) ?? null,
        product: m.product,
      }));
    });

    return res.status(201).json({ items: result, total: result.length });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "DUPLICATE", message: "สินค้าซ้ำในร้านนี้" });
    }
    next(err);
  }
}

// DELETE /api/consignment/categories/:categoryId/products/:productId
export async function removeProductFromCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.categoryId);
    const productId = Number(req.params.productId);
    if (!Number.isFinite(categoryId) || !Number.isFinite(productId)) {
      return res.status(400).json({ error: "categoryId and productId are required" });
    }

    const category = await prisma.consignmentCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, partnerId: true },
    });
    if (!category) return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });

    await prisma.consignmentCategoryMap.delete({
      where: {
        partnerId_productId: { partnerId: category.partnerId, productId },
      },
    });

    return res.json({ success: true });
  } catch (err) {
    if (err?.code === "P2025") return res.status(204).end();
    next(err);
  }
}
