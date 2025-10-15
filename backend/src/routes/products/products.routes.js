import express from "express";
import { prisma } from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const r = express.Router();

/**
 * GET /api/products
 * query: q, page=1, pageSize=20
 */
r.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.pageSize || "20"), 10))
    );
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
        select: {
          id: true,
          barcode: true,
          name: true,
          costPrice: true,
          salePrice: true,
        },
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
 * ADMIN/STAFF/CONSIGNMENT
 */
r.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res, next) => {
    try {
      const { barcode, name, costPrice, salePrice, productTypeId, branchId } =
        req.body;
      if (!barcode || !name)
        return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

      const exists = await prisma.product.findUnique({ where: { barcode } });
      if (exists)
        return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });

      const data = {
        barcode: String(barcode).trim(),
        name: String(name).trim(),
        productTypeId: productTypeId ?? null,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        branchId:
          (String(req.user.role).toUpperCase() === "STAFF"
            ? req.user.branchId
            : branchId) ?? null,
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

/**
 * GET /api/products/low-stock?lt=10&partnerId=...
 * - ADMIN/STAFF: ดูทั้งหมด หรือกำหนด partnerId
 * - CONSIGNMENT: เห็นเฉพาะ partnerId ของตัวเอง
 * ใช้ ConsignmentInventory จาก schema จริง
 */
r.get(
  "/low-stock",
  requireAuth,
  requireRole("ADMIN", "STAFF", "CONSIGNMENT"),
  async (req, res, next) => {
    try {
      const lt = Math.max(0, Number(req.query.lt ?? 10)); // เกณฑ์ “ใกล้หมด”
      const take = Math.min(Math.max(1, Number(req.query.take ?? 50)), 200); // จำกัดจำนวน
      const role = String(req.user.role).toUpperCase();

      let items = [];

      if (role === "CONSIGNMENT") {
        // ร้านฝากขาย: ดูสต็อกของ partner ตัวเอง
        const partnerId = req.user.partnerId ?? null;
        if (!partnerId) return res.json([]);

        const rows = await prisma.consignmentInventory.findMany({
          where: { consignmentPartnerId: partnerId, qty: { lte: lt } },
          include: { product: true },
          orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
          take,
        });

        items = rows.map((r) => ({
          id: r.productId,
          name: r.product?.name ?? null,
          stock: r.qty, // ปริมาณคงเหลือในฝั่ง consignment
          location: "CONSIGNMENT",
          partnerId,
        }));
      } else if (role === "STAFF" && req.user.branchId) {
        // พนักงานสาขา: ดูสต็อกของสาขาตัวเอง
        const branchId = req.user.branchId;

        const rows = await prisma.inventory.findMany({
          where: { branchId, qty: { lte: lt } },
          include: { product: true },
          orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
          take,
        });

        items = rows.map((r) => ({
          id: r.productId,
          name: r.product?.name ?? null,
          stock: r.qty, // คงเหลือของสาขานี้
          location: "BRANCH",
          branchId,
        }));
      } else {
        // ADMIN: รวมทุกสาขา -> สรุปยอดคงเหลือต่อสินค้า แล้วกรอง <= lt
        // (หมายเหตุ: ใช้วิธีรวมฝั่งแอพเพื่อความเรียบง่าย/ปลอดภัย)
        const rows = await prisma.inventory.findMany({
          where: { qty: { lte: lt } }, // ดึงเฉพาะที่ต่ำกว่าเกณฑ์เพื่อลดปริมาณข้อมูล
          include: { product: true },
          orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
          take: 1000, // ดึงกว้างหน่อยเพื่อสรุป แล้วค่อย slice ภายหลัง
        });

        const sumByProduct = new Map();
        for (const r of rows) {
          const key = r.productId;
          const cur = sumByProduct.get(key) || {
            id: r.productId,
            name: r.product?.name ?? null,
            stock: 0,
          };
          cur.stock += Number(r.qty || 0);
          sumByProduct.set(key, cur);
        }

        items = Array.from(sumByProduct.values())
          .filter((it) => it.stock <= lt)
          .sort(
            (a, b) =>
              a.stock - b.stock || String(a.name).localeCompare(String(b.name))
          )
          .slice(0, take);
      }

      const mapped = items.map((it) => ({
        id: it.id,
        name: it.name,
        barcode: it.barcode,
        stockQty: it.stock ?? 0, // <-- เปลี่ยนชื่อฟิลด์ให้ตรง FE
      }));
      return res.json(mapped);

      // ✅ สำคัญ: คืน “อาเรย์ตรงๆ” เพื่อให้ StaffDashboard ใช้ .slice() ได้
      return res.json(items);
    } catch (e) {
      next(e);
    }
  }
);

export default r;
