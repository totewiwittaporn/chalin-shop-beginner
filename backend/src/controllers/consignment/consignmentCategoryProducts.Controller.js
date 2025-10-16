import prisma from "#app/lib/prisma.js";

/**
 * ต้องมี relation ดังนี้ใน Prisma:
 * model ConsignmentCategoryProduct {
 *   categoryId Int
 *   productId  Int
 *   category   ConsignmentCategory @relation(fields: [categoryId], references: [id])
 *   product    Product             @relation(fields: [productId], references: [id])
 *   @@id([categoryId, productId])
 *   @@unique([categoryId, productId], name: "categoryId_productId")
 * }
 */

export async function listProductsOfCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.categoryId);
    const { page = 1, pageSize = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [total, rows] = await Promise.all([
      prisma.consignmentCategoryProduct.count({ where: { categoryId } }),
      prisma.consignmentCategoryProduct.findMany({
        where: { categoryId },
        include: { product: true },
        skip,
        take,
        orderBy: [{ id: "desc" }],
      }),
    ]);

    const items = rows.map((r) => ({
      id: r.product.id,
      barcode: r.product.barcode,
      name: r.product.name,
      salePrice: r.product.salePrice,
    }));

    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
}

export async function addProductsToCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.categoryId);
    const { productIds = [] } = req.body ?? {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "productIds is required" });
    }

    const result = await prisma.$transaction(
      productIds.map((pid) =>
        prisma.consignmentCategoryProduct.upsert({
          where: { categoryId_productId: { categoryId, productId: Number(pid) } },
          create: { categoryId, productId: Number(pid) },
          update: {},
        })
      )
    );

    res.json({ added: result.length });
  } catch (err) {
    next(err);
  }
}

export async function removeProductFromCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.categoryId);
    const productId = Number(req.params.productId);

    await prisma.consignmentCategoryProduct.delete({
      where: { categoryId_productId: { categoryId, productId } },
    });

    res.json({ success: true });
  } catch (err) {
    if (err.code === "P2025") return res.status(204).end(); // not found
    next(err);
  }
}
