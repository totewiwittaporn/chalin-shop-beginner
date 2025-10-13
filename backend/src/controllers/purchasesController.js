// backend/src/controllers/purchasesController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function parseIntOr(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

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
        (s, l) => s + (Number(l.costPrice || 0) * Number(l.ordered || 0)),
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
      for (const l of purchase.lines) {
        await tx.purchaseLine.update({
          where: { id: l.id },
          data: { received: l.ordered },
        });
        // TODO: บันทึกสต็อกเข้า stock ledger ถ้ามี
      }
      const updated = await tx.purchase.update({
        where: { id },
        data: { status: "RECEIVED", receivedAt: new Date() },
        include: { lines: true },
      });
      return updated;
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}
