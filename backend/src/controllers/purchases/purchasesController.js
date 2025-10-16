// backend/src/controllers/purchases/purchasesController.js
import prisma from "#app/lib/prisma.js";
import { Prisma } from "@prisma/client";

const LEDGER_IN_TYPE = "PURCHASE_RECEIVE";
const toInt = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ---------- CREATE ----------
export async function create(req, res) {
  try {
    const { supplierId, branchId, items } = req.body || {};
    if (!supplierId || !branchId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "invalid payload" });
    }
    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          supplierId: toInt(supplierId),
          branchId: toInt(branchId),
          date: new Date(),
          status: "PENDING",
          lines: {
            create: items.map((it) => ({
              productId: toInt(it.productId),
              ordered: toInt(it.ordered, 0),
              received: 0,
              costPrice: Number(it.costPrice || 0),
            })),
          },
        },
        include: { lines: true, supplier: true },
      });

      const total = created.lines.reduce(
        (s, l) => s + Number(l.costPrice || 0) * Number(l.ordered || 0),
        0
      );
      await tx.purchase.update({
        where: { id: created.id },
        data: { totalCost: total },
      });
      return created;
    });
    res.json(purchase);
  } catch (e) {
    console.error("[purchases.create]", e);
    res.status(500).json({ message: "server error" });
  }
}

// ---------- LIST ----------
export async function list(req, res) {
  try {
    const { q = "", page = 1, pageSize = 20, status } = req.query || {};
    const take = Math.min(100, Number(pageSize) || 20);
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const where = {};
    if (status && status !== "ALL") where.status = status;
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
        include: { supplier: true }, // list ไม่ดึง lines เพื่อลด payload
        orderBy: { id: "desc" },
        skip,
        take,
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: take });
  } catch (e) {
    console.error("[purchases.list]", e);
    res.status(500).json({ message: "server error" });
  }
}

// ---------- GET ONE (สำหรับเปิดโมดัลตรวจรับ) ----------
export async function getOne(req, res) {
  try {
    const id = toInt(req.params.id);
    const po = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!po) return res.status(404).json({ message: "not found" });
    res.json(po);
  } catch (e) {
    console.error("[purchases.getOne]", e);
    res.status(500).json({ message: "server error" });
  }
}

// ---------- RECEIVE (ตรวจรับจริง) ----------
export async function receive(req, res) {
  try {
    const id = toInt(req.params.id);
    const bodyLines = Array.isArray(req.body?.lines) ? req.body.lines : [];

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { lines: { include: { product: true } } },
    });
    if (!purchase) return res.status(404).json({ message: "not found" });
    if (purchase.status === "RECEIVED") return res.json(purchase);

    const byId = new Map(bodyLines.map((x) => [Number(x.id), Number(x.received || 0)]));

    const result = await prisma.$transaction(async (tx) => {
      const ledgerRows = [];
      let anyReceived = false;

      for (const l of purchase.lines) {
        const inc = Math.max(0, Number(byId.get(l.id) || 0));
        if (inc === 0) continue;

        const maxAvail = Math.max(0, Number(l.ordered || 0) - Number(l.received || 0));
        if (inc > maxAvail) {
          throw new Error(`จำนวนรับเกินกว่าสั่งซื้อของรายการ #${l.id}`);
        }

        await tx.purchaseLine.update({
          where: { id: l.id },
          data: { received: { increment: inc } },
        });

        ledgerRows.push({
          productId: l.productId,
          branchId: purchase.branchId,
          qty: inc,
          type: "PURCHASE_RECEIVE",
          refTable: "Purchase",
          refId: purchase.id,
          unitCost: new Prisma.Decimal(l.costPrice || 0),
        });

        await tx.inventory.upsert({
          where: { branchId_productId: { branchId: purchase.branchId, productId: l.productId } },
          create: { branchId: purchase.branchId, productId: l.productId, qty: inc, reserved: 0 },
          update: { qty: { increment: inc } },
        });

        anyReceived = true;
      }

      if (ledgerRows.length) await tx.stockLedger.createMany({ data: ledgerRows });

      const linesAfter = await tx.purchaseLine.findMany({ where: { purchaseId: purchase.id } });
      const allDone = linesAfter.every((x) => Number(x.received || 0) >= Number(x.ordered || 0));

      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: allDone ? "RECEIVED" : "PENDING",
          receivedAt: allDone ? new Date() : purchase.receivedAt,
        },
        include: { lines: true, supplier: true },
      });

      return { updated, anyReceived, allDone };
    });

    res.json({
      ...result.updated,
      usedInboundType: LEDGER_IN_TYPE,
      message: result.anyReceived ? "รับสินค้าเรียบร้อย" : "ไม่มีจำนวนรับ",
    });
  } catch (e) {
    console.error("[purchases.receive]", e);
    res.status(500).json({ message: "server error" });
  }
}
