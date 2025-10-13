// backend/src/controllers/inventory/inventoryController.js
import pkg from "@prisma/client";
const { PrismaClient, Prisma } = pkg;

const prisma = new PrismaClient();

// ใช้ค่าจาก enums.prisma ที่คุณให้มา
const LEDGER_IN_TYPE = "PURCHASE_RECEIVE";

/**
 * GET /api/inventory?q=&branchId=
 * สรุปยอดคงเหลือจาก stockLedger (sum qty by productId)
 */
export async function summary(req, res) {
  try {
    const { q = "", branchId } = req.query;
    const whereProduct =
      q?.trim()
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { barcode: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined;

    const whereLedger = {
      ...(branchId ? { branchId: Number(branchId) } : {}),
      ...(whereProduct ? { product: whereProduct } : {}),
    };

    const groups = await prisma.stockLedger.groupBy({
      by: ["productId"],
      where: whereLedger,
      _sum: { qty: true },
    });

    const ids = groups.map((g) => g.productId);
    const products = ids.length
      ? await prisma.product.findMany({ where: { id: { in: ids } } })
      : [];

    const items = groups
      .map((g) => {
        const p = products.find((x) => x.id === g.productId);
        return {
          productId: g.productId,
          barcode: p?.barcode || "",
          name: p?.name || "",
          costPrice: Number(p?.costPrice || 0),
          qty: Number(g._sum.qty || 0),
        };
      })
      .filter((it) => it.qty !== 0);

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/inventory/ledger?productId=&branchId=
 * คืน movement ล่าสุดสำหรับตรวจสอบ
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
 * POST /api/inventory/rebuild[?branchId=]
 * เติม movement ย้อนหลังจากใบซื้อที่ "RECEIVED"
 */
export async function rebuild(req, res) {
  try {
    const { branchId } = req.query;
    const branchFilter = branchId ? { branchId: Number(branchId) } : {};

    await prisma.$transaction(async (tx) => {
      // ล้าง ledger เฉพาะ scope ที่กำหนด (หรือทั้งหมดถ้าไม่ส่ง branchId)
      await tx.stockLedger.deleteMany(branchFilter);

      // ดึงใบซื้อที่รับเข้าแล้ว
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
              qty,                                      // เข้า
              type: LEDGER_IN_TYPE,                     // ✅ PURCHASE_RECEIVE
              refTable: "Purchase",
              refId: p.id,
              unitCost: new Prisma.Decimal(l.costPrice || 0),
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

    res.json({
      ok: true,
      scope: branchId ? { branchId: Number(branchId) } : "all-branches",
      message: "Rebuilt ledger from RECEIVED purchases",
      usedType: LEDGER_IN_TYPE,
    });
  } catch (e) {
    console.error("[REBUILD ERR]", e);
    res.status(500).json({
      message: "rebuild failed",
      name: e?.name,
      code: e?.code,
      meta: e?.meta,
    });
  }
}
