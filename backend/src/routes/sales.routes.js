import express from "express";
import { PrismaClient, DocKind, DocStatus } from "@prisma/client";
import { requireAuth, requireRole } from "#/middleware/auth.js";

const prisma = new PrismaClient();
const r = express.Router();

/**
 * GET /api/sales/summary?range=30d
 * range: 7d | 30d | 90d | custom (ใช้ ?from=YYYY-MM-DD&to=YYYY-MM-DD)
 * รวมยอดจาก Document(kind=INVOICE/RECEIPT) ที่ไม่ CANCELLED
 */
r.get("/summary", requireAuth, requireRole("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const { range = "30d", from, to } = req.query;

    let start = null;
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (range === "7d" || range === "30d" || range === "90d") {
      const days = Number(range.replace("d", ""));
      start = new Date();
      start.setDate(start.getDate() - days + 1);
      start.setHours(0, 0, 0, 0);
    } else if (from && to) {
      start = new Date(String(from));
      start.setHours(0, 0, 0, 0);
      end = new Date(String(to));
      end.setHours(23, 59, 59, 999);
    } else {
      // default 30 วัน
      start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const branchFilter =
      req.user.role === "ADMIN"
        ? {}
        : req.user.branchId
        ? { branchId: req.user.branchId }
        : { branchId: null };

    const docs = await prisma.document.findMany({
      where: {
        AND: [
          { kind: { in: [DocKind.INVOICE, DocKind.RECEIPT] } },
          { status: { not: DocStatus.CANCELLED } },
          { issueDate: { gte: start, lte: end } },
          branchFilter,
        ],
      },
      select: { total: true, kind: true, issueDate: true },
    });

    const gross = docs.reduce((sum, d) => sum + Number(d.total || 0), 0);
    res.json({
      range: { from: start, to: end },
      count: docs.length,
      gross,
    });
  } catch (e) {
    next(e);
  }
});

export default r;
