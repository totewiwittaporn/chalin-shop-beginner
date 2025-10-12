// backend/src/routes/sales.js
import { Router } from "express";
import { prisma } from "#/lib/prisma.js";
import { requireRole } from "#/middleware/auth.js";

// utilities
function parseRange(qs) {
  const now = new Date();
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
  const r = (qs.range || "30d").toLowerCase();

  if (["7d", "30d", "90d"].includes(r)) {
    const days = Number(r.replace("d", ""));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);
    return { start, end, label: r };
  }

  if (r === "custom" && qs.from && qs.to) {
    const start = new Date(`${qs.from}T00:00:00.000Z`);
    const endCustom = new Date(`${qs.to}T23:59:59.999Z`);
    return { start, end: endCustom, label: "custom" };
  }

  // default 30d
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end, label: "30d" };
}

function truncDateISO(d) {
  const z = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return z.toISOString().slice(0, 10);
}

const router = Router();

/**
 * GET /api/sales/summary?range=30d
 * อิง Document(kind ∈ [INVOICE, CONSALE], status ∈ [ISSUED, PAID])
 * STAFF → จำกัด branchId ของตัวเอง
 * CONSIGNMENT → จำกัด partnerId ของตัวเอง
 */
router.get(
  "/summary",
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res) => {
    try {
      const { start, end, label } = parseRange(req.query);

      // ใช้ฟิลด์ docDate (ตาม schema) แทน issueDate
      const where = {
        kind: { in: ["INVOICE", "CONSALE"] },
        status: { in: ["ISSUED", "PAID"] },
        docDate: { gte: start, lte: end },
      };

      const role = String(req.user.role || "").toUpperCase();
      if (role === "STAFF" && req.user.branchId) {
        where.branchId = req.user.branchId;
      }
      if (role === "CONSIGNMENT" && req.user.partnerId) {
        where.partnerId = req.user.partnerId;
      }

      const docs = await prisma.document.findMany({
        where,
        select: { id: true, docDate: true, total: true },
        orderBy: { docDate: "asc" },
      });

      const byDate = new Map();
      for (const d of docs) {
        const dayKey = truncDateISO(new Date(d.docDate));
        const entry = byDate.get(dayKey) || { date: dayKey, total: 0, count: 0 };
        entry.total += Number(d.total || 0);
        entry.count += 1;
        byDate.set(dayKey, entry);
      }

      // เติมวันที่ให้ครบช่วง
      const days = [];
      const cursor = new Date(start);
      cursor.setUTCHours(0, 0, 0, 0);
      while (cursor <= end) {
        const key = truncDateISO(cursor);
        days.push(byDate.get(key) || { date: key, total: 0, count: 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      const total = days.reduce((s, x) => s + x.total, 0);
      const averagePerDay = days.length ? total / days.length : 0;

      res.json({
        range: label,
        from: truncDateISO(start),
        to: truncDateISO(end),
        total,
        averagePerDay,
        days,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to summarize sales" });
    }
  }
);

export default router;
