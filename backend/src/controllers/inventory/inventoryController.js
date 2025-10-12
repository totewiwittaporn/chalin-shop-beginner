import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function summary(req, res) {
  try {
    const { q = "", branchId } = req.query;
    const branchFilter = branchId ? { branchId: Number(branchId) } : {};

    const groups = await prisma.stockLedger.groupBy({
      by: ["productId"],
      where: {
        ...branchFilter,
        product: q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ]
        } : undefined
      },
      _sum: { qty: true },
    });

    const ids = groups.map(g => g.productId);
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });

    const items = groups.map(g => {
      const p = products.find(x => x.id === g.productId);
      return {
        productId: g.productId,
        barcode: p?.barcode || "",
        name: p?.name || "",
        costPrice: p?.costPrice || 0,
        qty: Number(g._sum.qty || 0),
      };
    }).filter(it => it.qty !== 0);

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

export async function ledger(req, res) {
  try {
    const { productId, branchId } = req.query;
    const where = {
      productId: productId ? Number(productId) : undefined,
      branchId: branchId ? Number(branchId) : undefined,
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
