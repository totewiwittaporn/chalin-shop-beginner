// backend/src/controllers/sales/salesSummaryController.js
import prisma from "#app/lib/prisma.js";

/**
 * แปลง range แบบ "30d", "7d", "90d" ให้เป็น { from, to }
 */
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
 * GET /api/sales/summary?range=30d&status=PAID
 * คืนค่า: { gross, count }
 * - ถ้าไม่ส่ง range จะรวมทั้งหมด
 * - status เริ่มต้น = PAID
 */
export async function getSalesSummary(req, res, next) {
  try {
    const { range, status = "PAID" } = req.query;

    const where = {};
    if (status) where.status = String(status).toUpperCase(); // DRAFT | PAID | CANCELLED

    const { from, to } = parseRange(range);
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    const [agg, cnt] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true }, where }),
      prisma.sale.count({ where }),
    ]);

    const gross = Number(agg?._sum?.total ?? 0);
    return res.json({ gross, count: cnt });
  } catch (e) {
    next(e);
  }
}
