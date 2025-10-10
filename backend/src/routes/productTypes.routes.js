import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// GET /api/product-types?search=...
router.get("/", async (req, res, next) => {
  try {
    const search = (req.query.search || "").toString();
    const list = await prisma.productType.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : {},
      orderBy: { name: "asc" },
    });
    res.json(list);
  } catch (e) { next(e); }
});

// POST /api/product-types
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    const created = await prisma.productType.create({ data: { name } });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// PUT /api/product-types/:id
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    const updated = await prisma.productType.update({ where: { id }, data: { name } });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/product-types/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.productType.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
