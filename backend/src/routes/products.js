import { prisma } from "../lib/prisma.js";

function enforceProductScope(user) {
  // STAFF sees own branch; CONSIGNMENT optional: can list products mapped to their partner via category map/inventory if needed
  // For now: ADMIN all; STAFF branch; CONSIGNMENT all products but FE should filter by partner context.
}

// Simple helper to build where clause
function buildWhere(query, user) {
  const where = {};
  if (query.q) where.OR = [{ name: { contains: query.q } }, { barcode: { contains: query.q } }];
  if (user.role === "STAFF" && user.branchId) {
    where.branchId = user.branchId;
  }
  return where;
}

const router = (await import("express")).Router();

router.get("/", async (req, res) => {
  try {
    const where = buildWhere(req.query, req.user);
    const items = await prisma.product.findMany({
      where,
      orderBy: { id: "desc" },
      take: Number(req.query.take || 100),
    });
    res.json(items);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to list products" }); }
});

router.post("/", async (req, res) => {
  try {
    const { barcode, name, productTypeId, costPrice, salePrice } = req.body;
    // role guard
    if (!["ADMIN", "STAFF", "CONSIGNMENT"].includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const created = await prisma.product.create({
      data: {
        barcode, name,
        productTypeId: productTypeId ?? null,
        costPrice, salePrice,
        branchId: req.user.branchId ?? null,
      },
    });
    res.status(201).json(created);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create product" }); }
});

export default router;
