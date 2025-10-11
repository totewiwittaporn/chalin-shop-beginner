import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const r = express.Router();

/**
 * GET /api/products
 * query: q, page=1, pageSize=20
 * - ADMIN: เห็นทุกสาขา
 * - STAFF/CONSIGNMENT: เห็นเฉพาะสาขาตัวเอง (ถ้ามี branchId)
 * - QUOTE_VIEWER: อนุญาตอ่านได้ (ถ้าไม่ต้องการให้เห็นทั้งหมด ให้คุมตามนโยบายคุณ)
 */
r.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "20"), 10)));
    const skip = (page - 1) * pageSize;

    const role = String(req.user.role || "").toUpperCase();
    const branchId = req.user.branchId ?? null;

    const where = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        role === "ADMIN"
          ? {}
          : branchId
          ? { OR: [{ branchId: branchId }, { branchId: null }] }
          : { branchId: null },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: { id: true, barcode: true, name: true, costPrice: true, salePrice: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/products
 * body: { barcode, name, costPrice, salePrice }
 * - ADMIN/STAFF/CONSIGNMENT: สร้างได้
 * - QUOTE_VIEWER: ห้าม (403)
 */
r.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res, next) => {
    try {
      const { barcode, name, costPrice, salePrice } = req.body;
      if (!barcode || !name) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

      const exists = await prisma.product.findUnique({ where: { barcode } });
      if (exists) return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });

      const data = {
        barcode: String(barcode).trim(),
        name: String(name).trim(),
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        branchId: req.user.branchId ?? null, // ผูกตามสาขาผู้สร้างถ้ามี
      };

      const created = await prisma.product.create({ data });
      res.status(201).json({
        id: created.id,
        barcode: created.barcode,
        name: created.name,
        costPrice: created.costPrice,
        salePrice: created.salePrice,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default r;
