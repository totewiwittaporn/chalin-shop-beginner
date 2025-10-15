// backend/src/controllers/products/productsSearchController.js
import prisma from "#app/lib/prisma.js";

/**
 * GET /api/products?q=...&limit=10
 * คืน: [{ id, name, barcode }]
 * - ค้นหา name (icontains) หรือ barcode (exact/startswith)
 */
export async function searchProducts(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit || 10), 50);
    if (!q || q.length < 2) return res.json([]);

    // เงื่อนไขค้นหา
    const where = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { barcode: { startsWith: q, mode: "insensitive" } },
        { barcode: { equals: q, mode: "insensitive" } },
      ],
    };

    const rows = await prisma.product.findMany({
      where,
      select: { id: true, name: true, barcode: true },
      orderBy: [{ name: "asc" }],
      take: limit,
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
}
