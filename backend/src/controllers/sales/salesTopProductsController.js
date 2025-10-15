// backend/src/controllers/sales/salesTopProductsController.js
import prisma from "#app/lib/prisma.js";

function parseRange(range) {
  const now = new Date();
  if (!range) return { from: undefined, to: undefined };
  const m = String(range).match(/^(\d+)\s*d$/i);
  if (!m) return { from: undefined, to: undefined };
  const days = parseInt(m[1], 10);
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from, to: now };
}

/**
 * GET /api/sales/top-products?limit=10&range=30d&status=PAID
 * คืนค่า: [{ productId, name, barcode, qty, revenue }]
 */
export async function getTopProducts(req, res, next) {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "10"), 10)));
    const status = String(req.query.status || "PAID").toUpperCase();
    const { from, to } = parseRange(req.query.range);

    // ดึงรายการ SaleItem พร้อมข้อมูล Product + Sale ที่ต้องกรองเวลา/สถานะ
    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          status,                   // DRAFT | PAID | CANCELLED
          ...(from || to ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            }
          } : {}),
        },
      },
      select: {
        productId: true,
        qty: true,
        lineTotal: true,
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    // รวมยอดตาม productId
    const map = new Map();
    for (const it of items) {
      const key = it.productId;
      const prev = map.get(key) || { qty: 0, revenue: 0, name: it.product?.name || "", barcode: it.product?.barcode || "" };
      map.set(key, {
        qty: prev.qty + (it.qty || 0),
        revenue: prev.revenue + Number(it.lineTotal || 0),
        name: prev.name || it.product?.name || "",
        barcode: prev.barcode || it.product?.barcode || "",
      });
    }

    // จัดอันดับตาม qty มาก→น้อย (ถ้าต้องการให้เรียงตามรายได้ เปลี่ยนเป็น revenue)
    const rows = Array.from(map.entries()).map(([productId, v]) => ({
      productId,
      name: v.name,
      barcode: v.barcode,
      qty: v.qty,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, limit);

    return res.json(rows);
  } catch (e) {
    next(e);
  }
}
