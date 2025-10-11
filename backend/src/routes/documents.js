import { prisma } from "../lib/prisma.js";
const router = (await import("express")).Router();

// Helper to sum decimals via database or JS
function toNumber(x) { return typeof x === "string" ? parseFloat(x) : x; }

// Create consignment sale document
// Body: { partnerId?, items: [{ categoryId? , productId?, qty, unitPrice? }] }
router.post("/consale", async (req, res) => {
  try {
    const partnerId = Number(req.body.partnerId || req.user.partnerId);
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });
    if (req.user.role === "CONSIGNMENT" && req.user.partnerId !== partnerId) {
      return res.status(403).json({ error: "forbidden" });
    }
    const branchId = req.user.branchId || null;

    const itemsInput = req.body.items || [];
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      return res.status(400).json({ error: "items required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Preload categories/products used
      const catIds = itemsInput.filter(i=>i.categoryId).map(i=>i.categoryId);
      const prodIds = itemsInput.filter(i=>i.productId).map(i=>i.productId);
      const cats = await tx.consignmentCategory.findMany({ where: { id: { in: catIds }, partnerId } });
      const prods = await tx.product.findMany({ where: { id: { in: prodIds } } });

      let subTotal = 0;
      const lineCreates = [];

      for (const it of itemsInput) {
        if (it.categoryId) {
          const cat = cats.find(c => c.id === Number(it.categoryId));
          if (!cat) throw new Error("invalid category for this partner");
          const qty = toNumber(it.qty);
          const unitPrice = toNumber(it.unitPrice ?? cat.price);
          const total = qty * unitPrice;
          subTotal += total;
          lineCreates.push({
            name: cat.name,
            displayName: cat.name,
            displayCode: cat.code,
            qty, unitPrice, total,
            categoryId: cat.id
          });
        } else if (it.productId) {
          const prod = prods.find(p => p.id === Number(it.productId));
          if (!prod) throw new Error("invalid product");
          const qty = toNumber(it.qty);
          const unitPrice = toNumber(it.unitPrice ?? prod.salePrice);
          const total = qty * unitPrice;
          subTotal += total;
          lineCreates.push({
            name: prod.name,
            barcode: prod.barcode,
            qty, unitPrice, total,
            productId: prod.id
          });
        } else {
          throw new Error("Each item requires categoryId or productId");
        }
      }

      const discount = toNumber(req.body.discount ?? 0);
      const tax = toNumber(req.body.tax ?? 0);
      const total = subTotal - discount + tax;

      const partner = await tx.consignmentPartner.findUnique({ where: { id: partnerId } });

      const doc = await tx.document.create({
        data: {
          kind: "CONSALE",
          status: "ISSUED",
          code: req.body.code || `CON-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`,
          issueDate: new Date(),
          branchId,
          createdById: req.user.id,
          partnerId,
          commissionRate: partner?.commissionRate ?? null,
          subTotal, discount, tax, total,
          items: { create: lineCreates }
        },
        include: { items: true }
      });

      return doc;
    });

    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to create consignment sale" });
  }
});

// Generic list documents with simple filters
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.kind) where.kind = req.query.kind;
    if (req.query.status) where.status = req.query.status;
    if (req.query.partnerId) where.partnerId = Number(req.query.partnerId);
    if (req.user.role === "STAFF" && req.user.branchId) where.branchId = req.user.branchId;
    if (req.user.role === "CONSIGNMENT" && req.user.partnerId) where.partnerId = req.user.partnerId;
    const docs = await prisma.document.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: { items: true }
    });
    res.json(docs);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to list documents" }); }
});

export default router;
