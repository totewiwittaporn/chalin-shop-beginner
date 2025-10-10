import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Roles } from "../utils/rbac.js";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

// GET /product-types?search=...
router.get("/", async (req, res, next) => {
  try {
    const search = (req.query.search || "").toString();
    const list = await prisma.productType.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : {},
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } }
    });
    res.json(list);
  } catch (e) { next(e); }
});

router.post("/", requireRole(Roles.ADMIN, Roles.STAFF), async (req, res, next) => {
  try {
    const { name } = req.body;
    const created = await prisma.productType.create({ data: { name } });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.put("/:id", requireRole(Roles.ADMIN, Roles.STAFF), async (req, res, next) => {
  try {
    const { name } = req.body;
    const updated = await prisma.productType.update({
      where: { id: Number(req.params.id) },
      data: { name }
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete("/:id", requireRole(Roles.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const count = await prisma.product.count({ where: { productTypeId: id } });
    if (count > 0) return res.status(400).json({ error: "Cannot delete: type in use by products" });
    await prisma.productType.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
