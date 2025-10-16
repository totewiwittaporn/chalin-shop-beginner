// backend/src/controllers/sales/salesController.js
import { prisma } from "#app/lib/prisma.js";

// helper
function sum(items, pick) {
  return items.reduce((s, it) => s + Number(pick(it) || 0), 0);
}

export async function createSale(req, res) {
  try {
    const { branchId, items = [], note, discount = 0 } = req.body || {};
    if (!branchId) return res.status(400).json({ message: "branchId is required" });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items is required" });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });
    const priceMap = new Map(products.map((p) => [p.id, Number(p.price || 0)]));

    const normalized = items.map((i) => {
      const qty = Number(i.qty || 0);
      if (qty <= 0) throw new Error("qty must > 0");
      const unitPrice = i.unitPrice != null ? Number(i.unitPrice) : (priceMap.get(i.productId) ?? 0);
      const lineTotal = qty * unitPrice;
      return { productId: i.productId, qty, unitPrice, lineTotal };
    });

    const subtotal = sum(normalized, (x) => x.lineTotal);
    const total = subtotal - Number(discount || 0);

    const sale = await prisma.sale.create({
      data: {
        branchId,
        note: note || null,
        status: "DRAFT",
        subtotal,
        discount,
        total,
        items: { create: normalized },
      },
      include: { items: true },
    });

    res.json(sale);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to create sale" });
  }
}

export async function paySale(req, res) {
  const id = Number(req.params.id);
  try {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "sale id is required" });
    }

    const { payments = [] } = req.body || {};
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "payments is required" });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    if (sale.status === "PAID") return res.status(400).json({ message: "Sale already paid" });

    const payAmount = sum(payments, (p) => p.amount);
    if (payAmount < Number(sale.total)) {
      return res.status(400).json({ message: "Insufficient payment" });
    }

    const ledgerRows = sale.items.map((it) => ({
      productId: it.productId,
      branchId: sale.branchId,
      qty: -Math.abs(Number(it.qty)), // ออก = ติดลบ
      type: "SALE",
      refTable: "Sale",
      refId: sale.id,
      unitCost: null,
    }));

    const result = await prisma.$transaction(async (tx) => {
      // 1) ชำระเงิน
      await tx.payment.createMany({
        data: payments.map((p) => ({
          saleId: sale.id,
          method: String(p.method || "").toUpperCase(),
          amount: Number(p.amount || 0),
          evidenceUrl: p.evidenceUrl || null,
        })),
      });

      // 2) ลด Inventory และลงสมุดสต็อก
      for (const it of sale.items) {
        const qty = Math.abs(Number(it.qty || 0));
        if (!qty) continue;

        // 2.1 inventory (-qty)
        await tx.inventory.upsert({
          where: { branchId_productId: { branchId: sale.branchId, productId: it.productId } },
          create: { branchId: sale.branchId, productId: it.productId, qty: -qty, reserved: 0 },
          update: { qty: { decrement: qty } },
        });
      }
      if (ledgerRows.length) {
        await tx.stockLedger.createMany({ data: ledgerRows });
      }

      // 3) ปิดบิล
      return tx.sale.update({
        where: { id: sale.id },
        data: { status: "PAID" },
        include: { items: true, payments: true },
      });
    });

    const cashPaid = sum(payments.filter(p => String(p.method).toUpperCase() === "CASH"), x => x.amount);
    const change = Math.max(0, cashPaid - Number(sale.total));

    res.json({ sale: result, change });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to pay sale" });
  }
}

export async function getSale(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "sale id is required" });
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to get sale" });
  }
}

export async function listSales(req, res) {
  try {
    const { q, page = 1, pageSize = 20, branchId } = req.query || {};
    const take = Math.min(100, Number(pageSize) || 20);
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const where = {};
    if (branchId) where.branchId = Number(branchId);
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { note: { contains: q, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { id: "desc" },
        skip, take,
        include: { items: true, payments: true },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ rows, total, page: Number(page), pageSize: take });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list sales" });
  }
}
