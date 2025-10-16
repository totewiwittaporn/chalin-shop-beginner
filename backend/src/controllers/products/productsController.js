// backend/src/controllers/products/productsController.js
import prisma from "#app/lib/prisma.js";

/**
 * GET /api/products/search?q=
 * คืนรายการสินค้าแบบสั้นสำหรับ autocomplete
 */
export async function search(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ items: [] });

    const items = await prisma.product.findMany({
      where: {
        OR: [
          { name:    { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          // ถ้ามี code/sku เติมได้ เช่น { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        costPrice: true,   // ราคาทุน
        salePrice: true,   // ราคาขาย (เดิมเคย select price → ทำให้พัง)
      },
      orderBy: [{ name: "asc" }],
      take: 20,
    });

    const mapped = items.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      basePrice: Number(p.costPrice ?? 0),   // ให้ client ใช้เป็นต้นทุนเริ่มต้น
      price: Number(p.salePrice ?? 0),       // ให้ client ใช้เป็นราคาขาย
    }));

    res.json({ items: mapped });
  } catch (e) {
    console.error("[products.search]", e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/products?q=&page=&pageSize=
 * ใช้แสดงตารางสินค้าเต็ม
 */
export async function list(req, res) {
  try {
    const { q = "", page = 1, pageSize = 20 } = req.query;
    const take = Math.min(100, Number(pageSize) || 20);
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ name: "asc" }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          barcode: true,
          costPrice: true,
          salePrice: true, // ← แทน price
        },
      }),
      prisma.product.count({ where }),
    ]);

    // ปรับฟิลด์ให้สม่ำเสมอฝั่ง client (optional)
    const mapped = items.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      costPrice: Number(p.costPrice ?? 0),
      price: Number(p.salePrice ?? 0),
    }));

    res.json({ items: mapped, total, page: Number(page), pageSize: take });
  } catch (e) {
    console.error("[products.list]", e);
    res.status(500).json({ message: "server error" });
  }
}
