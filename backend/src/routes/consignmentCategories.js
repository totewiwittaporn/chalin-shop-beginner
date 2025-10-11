import { prisma } from "../lib/prisma.js";
const router = (await import("express")).Router();

// List categories by partner
router.get("/", async (req, res) => {
  try {
    const partnerId = Number(req.query.partnerId || req.user.partnerId);
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });
    // CONSIGNMENT can only access own partner
    if (req.user.role === "CONSIGNMENT" && req.user.partnerId !== partnerId) {
      return res.status(403).json({ error: "forbidden" });
    }
    const items = await prisma.consignmentCategory.findMany({
      where: { partnerId },
      orderBy: { name: "asc" },
    });
    res.json(items);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to list categories" }); }
});

// Create/Update category
router.post("/", async (req, res) => {
  try {
    const { partnerId: pId, code, name, price } = req.body;
    const partnerId = Number(pId || req.user.partnerId);
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });
    if (req.user.role === "CONSIGNMENT" && req.user.partnerId !== partnerId) {
      return res.status(403).json({ error: "forbidden" });
    }
    const created = await prisma.consignmentCategory.create({
      data: { partnerId, code, name, price },
    });
    res.status(201).json(created);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create category" }); }
});

// Map product to category
router.post("/map", async (req, res) => {
  try {
    const { partnerId: pId, categoryId, productId } = req.body;
    const partnerId = Number(pId || req.user.partnerId);
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });
    if (req.user.role === "CONSIGNMENT" && req.user.partnerId !== partnerId) {
      return res.status(403).json({ error: "forbidden" });
    }
    const mapped = await prisma.consignmentCategoryMap.upsert({
      where: { partnerId_productId: { partnerId, productId } },
      update: { categoryId },
      create: { partnerId, categoryId, productId },
    });
    res.json(mapped);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to map product" }); }
});

export default router;
