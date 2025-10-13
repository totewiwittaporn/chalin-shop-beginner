// backend/src/controllers/purchases/purchasesController.js
import pkg from "@prisma/client";
const { PrismaClient, Prisma } = pkg;
const prisma = new PrismaClient();

// ใช้ค่าจาก enums.prisma ที่คุณให้มา
const LEDGER_IN_TYPE = "PURCHASE_RECEIVE";

function parseIntOr(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

/**
 * POST /api/purchases
 * payload: { supplierId, branchId, items: [{ productId, ordered, costPrice }] }
 * - สร้างใบสั่งซื้อสถานะ PENDING
 */
export async function create(req, res) {
  try {
    const { supplierId, branchId, items } = req.body;
    if (!supplierId || !branchId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "invalid payload" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          supplierId: parseIntOr(supplierId),
          branchId: parseIntOr(branchId),
          date: new Date(),
          status: "PENDING",
          lines: {
            create: items.map((it) => ({
              productId: parseIntOr(it.productId),
              ordered: parseIntOr(it.ordered, 0),
              received: 0,
              costPrice: Number(it.costPrice || 0),
            })),
          },
        },
        include: { lines: true, supplier: true },
      });

      const total = purchase.lines.reduce(
        (s, l) => s + Number(l.costPrice || 0) * Number(l.ordered || 0),
        0
      );

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { totalCost: total },
      });

      return purchase;
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/purchases
 * query: q, page, pageSize, status
 */
export async function list(req, res) {
  try {
    const { q = "", page = 1, pageSize = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { supplier: { name: { contains: q, mode: "insensitive" } } },
        {
          lines: {
            some: {
              product: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { barcode: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        include: { supplier: true },
        orderBy: { id: "desc" },
        skip,
        take,
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({ items, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * POST /api/purchases/:id/receive
 * - อัปเดต received = ordered
 * - เขียน movement ลง stockLedger (type: PURCHASE_RECEIVE)
 */
export async function receive(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!purchase) return res.status(404).json({ message: "not found" });
    if (purchase.status === "RECEIVED") return res.json(purchase);

    const result = await prisma.$transaction(async (tx) => {
      // 1) อัปเดตไลน์
      for (const l of purchase.lines) {
        await tx.purchaseLine.update({
          where: { id: l.id },
          data: { received: l.ordered },
        });
      }

      // 2) movement เข้าคลัง
      if (purchase.lines.length > 0) {
        const rows = purchase.lines.map((l) => ({
          productId: l.productId,
          branchId: purchase.branchId,
          qty: Number(l.ordered || 0),                       // เข้า
          type: LEDGER_IN_TYPE,                               // ✅ ตรง schema
          refTable: "Purchase",
          refId: purchase.id,
          unitCost: new Prisma.Decimal(l.costPrice || 0),     // Decimal
        }));
        await tx.stockLedger.createMany({ data: rows });
      }

      // 3) ปรับสถานะใบรับเข้า
      const updated = await tx.purchase.update({
        where: { id },
        data: { status: "RECEIVED", receivedAt: new Date() },
        include: { lines: true },
      });

      return updated;
    });

    res.json({ ...result, usedInboundType: LEDGER_IN_TYPE });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "server error",
      name: e?.name,
      code: e?.code,
      meta: e?.meta,
    });
  }
}
