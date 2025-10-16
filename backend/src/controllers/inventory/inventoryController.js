// backend/src/controllers/inventory/inventoryController.js
import prisma from "#app/lib/prisma.js";

/**
 * GET /api/inventory
 * params:
 *   - q?: string (barcode/name)
 *   - branchId?: number  -> โหมด "สาขา"
 *   - consignmentPartnerId?: number -> โหมด "ร้านฝากขาย"
 *
 * behavior:
 *   - ถ้ามี branchId: อ่านจาก Inventory (รวมตาม productId เฉพาะสาขานั้น)
 *   - ถ้ามี consignmentPartnerId: อ่านจาก ConsignmentInventory (เฉพาะร้านฝากขายนั้น) **ใช้ qtyOnHand**
 *   - ถ้าไม่ส่งทั้งคู่: รวมทั้งสองฝั่งเข้าด้วยกัน (Inventory + ConsignmentInventory) **map qtyOnHand -> qty**
 *
 * response: { items: { productId, barcode, name, costPrice, qty }[] }
 */
export async function summary(req, res) {
  try {
    const { q = "", branchId, consignmentPartnerId } = req.query;
    const hasBranch = !!branchId;
    const hasPartner = !!consignmentPartnerId;

    const whereProduct =
      q?.trim()
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { barcode: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined;

    // Helper: map product for fast lookup
    async function loadProductsByIds(ids) {
      if (!ids?.length) return new Map();
      const rows = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, barcode: true, name: true, costPrice: true },
      });
      return new Map(rows.map(p => [p.id, p]));
    }

    if (hasBranch) {
      // โหมดสาขา -> Inventory (ฟิลด์ qty)
      const rows = await prisma.inventory.findMany({
        where: {
          branchId: Number(branchId),
          ...(whereProduct ? { product: whereProduct } : {}),
        },
        include: { product: true },
        orderBy: [{ qty: "desc" }, { product: { name: "asc" } }],
        take: 1000,
      });

      const items = rows.map(r => ({
        productId: r.productId,
        barcode: r.product?.barcode || "",
        name: r.product?.name || "",
        costPrice: Number(r.product?.costPrice || 0),
        qty: Number(r.qty || 0),
      }));

      return res.json({ items });
    }

    if (hasPartner) {
      // โหมดร้านฝากขาย -> ConsignmentInventory (ฟิลด์ qtyOnHand)
      const rows = await prisma.consignmentInventory.findMany({
        where: {
          consignmentPartnerId: Number(consignmentPartnerId),
          ...(whereProduct ? { product: whereProduct } : {}),
        },
        include: { product: true },
        orderBy: [{ qtyOnHand: "desc" }, { product: { name: "asc" } }],
        take: 1000,
      });

      const items = rows.map(r => ({
        productId: r.productId,
        barcode: r.product?.barcode || "",
        name: r.product?.name || "",
        costPrice: Number(r.product?.costPrice || 0),
        qty: Number(r.qtyOnHand || 0), // <<— ใช้ qtyOnHand
      }));

      return res.json({ items });
    }

    // โหมดรวมทั้งหมด -> รวม Inventory (qty) + ConsignmentInventory (qtyOnHand)
    const [invRows, consRows] = await Promise.all([
      prisma.inventory.findMany({
        where: { ...(whereProduct ? { product: whereProduct } : {}) },
        select: { productId: true, qty: true },
        take: 5000,
      }),
      prisma.consignmentInventory.findMany({
        where: { ...(whereProduct ? { product: whereProduct } : {}) },
        select: { productId: true, qtyOnHand: true }, // <<— ใช้ qtyOnHand
        take: 5000,
      }),
    ]);

    // รวม qty ตาม productId
    const qtyMap = new Map();
    for (const r of invRows) {
      qtyMap.set(r.productId, (qtyMap.get(r.productId) || 0) + Number(r.qty || 0));
    }
    for (const r of consRows) {
      qtyMap.set(r.productId, (qtyMap.get(r.productId) || 0) + Number(r.qtyOnHand || 0)); // <<— ใช้ qtyOnHand
    }

    const ids = Array.from(qtyMap.keys());
    const pmap = await loadProductsByIds(ids);
    const items = ids.map(id => {
      const p = pmap.get(id) || {};
      const qty = qtyMap.get(id) || 0;
      return {
        productId: id,
        barcode: p.barcode || "",
        name: p.name || "",
        costPrice: Number(p.costPrice || 0),
        qty: Number(qty),
      };
    }).filter(it => it.qty !== 0);

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/inventory/ledger?productId=&branchId=
 * ล่าสุด/ตรวจสอบความเคลื่อนไหว
 */
export async function ledger(req, res) {
  try {
    const { productId, branchId } = req.query;
    const where = {
      ...(productId ? { productId: Number(productId) } : {}),
      ...(branchId ? { branchId: Number(branchId) } : {}),
    };

    const items = await prisma.stockLedger.findMany({
      where,
      orderBy: { id: "desc" },
      take: 200,
    });

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * POST /api/inventory/rebuild?branchId=
 * เติม movement จากใบซื้อที่ RECEIVED (เหมือนของเดิม)
 */
export async function rebuild(req, res) {
  try {
    const { branchId } = req.query;
    const branchFilter = branchId ? { branchId: Number(branchId) } : {};

    await prisma.$transaction(async (tx) => {
      await tx.stockLedger.deleteMany(branchFilter);

      const purchases = await tx.purchase.findMany({
        where: { status: "RECEIVED", ...(branchFilter.branchId ? { branchId: branchFilter.branchId } : {}) },
        include: { lines: true },
      });

      const rows = [];
      for (const p of purchases) {
        for (const l of p.lines) {
          const qty = Number(l.received || 0);
          if (qty > 0) {
            rows.push({
              productId: l.productId,
              branchId: p.branchId,
              qty,
              type: "PURCHASE_RECEIVE",
              refTable: "Purchase",
              refId: p.id,
              unitCost: l.costPrice ?? 0,
            });
          }
        }
      }

      if (rows.length) {
        const chunk = 500;
        for (let i = 0; i < rows.length; i += chunk) {
          await tx.stockLedger.createMany({ data: rows.slice(i, i + chunk) });
        }
      }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("[REBUILD ERR]", e);
    res.status(500).json({ message: "rebuild failed" });
  }
}
