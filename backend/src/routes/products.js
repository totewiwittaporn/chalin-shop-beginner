import { prisma } from "#/lib/prisma.js";
const router = (await import("express")).Router();

/**
 * Build WHERE clause จาก query + scope ของผู้ใช้
 */
function buildWhere(query, user) {
  const where = {};

  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { barcode: { contains: query.q } },
    ];
  }

  // STAFF เห็นเฉพาะ branch ของตน
  if (user?.role === "STAFF" && user.branchId) {
    where.branchId = user.branchId;
  }

  // ADMIN/CONSIGNMENT ไม่บังคับ branch ที่นี่ (ให้ฝั่งหน้าใช้ filter เพิ่มได้)
  return where;
}

/**
 * GET /api/products
 * รองรับ page, pageSize และคืนรูปแบบ { items, total, page, pageSize }
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize ?? "100", 10)));

    const where = buildWhere(req.query, req.user);

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list products" });
  }
});

/**
 * POST /api/products
 * สิทธิ์: ADMIN, STAFF, CONSIGNMENT
 * - STAFF: บันทึก branchId เป็นของตนเองเสมอ
 * - ADMIN/CONSIGNMENT: รับ branchId จาก body (ถ้าไม่ส่งให้เป็น null)
 */
router.post("/", async (req, res) => {
  try {
    if (!["ADMIN", "STAFF", "CONSIGNMENT"].includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { barcode, name, productTypeId, costPrice, salePrice } = req.body;

    const created = await prisma.product.create({
      data: {
        barcode,
        name,
        productTypeId: productTypeId ?? null,
        costPrice: costPrice ?? 0,
        salePrice: salePrice ?? 0,
        branchId: (req.user.role === "STAFF" ? req.user.branchId : req.body.branchId) ?? null,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    // (ถ้าชน unique barcode จะมา error path นี้)
    res.status(500).json({ error: "Failed to create product" });
  }
});

/**
 * GET /api/products/low-stock?lt=10&partnerId=...
 * ใช้ ConsignmentInventory เป็นตัวอย่างสต็อก (เพราะสคีมายังไม่มียอด stock กลางต่อ branch)
 * สิทธิ์:
 *  - ADMIN/STAFF: ดูได้ทั้งหมด หรือกำหนด partnerId เพื่อโฟกัส
 *  - CONSIGNMENT: เห็นเฉพาะ partnerId ของตนเอง (บังคับ)
 */
router.get("/low-stock", async (req, res) => {
  try {
    if (!["ADMIN", "STAFF", "CONSIGNMENT"].includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const lt = Number(req.query.lt ?? 10);
    const partnerQuery = req.query.partnerId ? Number(req.query.partnerId) : null;
    let partnerId = partnerQuery;

    if (req.user.role === "CONSIGNMENT") {
      partnerId = req.user.partnerId ?? null; // บังคับเฉพาะร้านตัวเอง
    }

    const where = {
      qtyOnHand: { lt },
      ...(partnerId ? { partnerId } : {}),
    };

    const rows = await prisma.consignmentInventory.findMany({
      where,
      include: {
        product: true,
        partner: true,
      },
      orderBy: [{ qtyOnHand: "asc" }, { partnerId: "asc" }],
      take: 200,
    });

    const items = rows.map((r) => ({
      id: r.id,
      partnerId: r.partnerId,
      partnerName: r.partner?.name ?? null,
      productId: r.productId,
      barcode: r.product?.barcode ?? null,
      name: r.product?.name ?? null,
      qtyOnHand: r.qtyOnHand,
      threshold: lt,
    }));

    res.json({ items, total: items.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to query low stock" });
  }
});

export default router;
