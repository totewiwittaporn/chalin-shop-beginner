// productTypes.routes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js"; // <— เพิ่ม

const prisma = new PrismaClient();
const router = Router();

// ถ้าอยากบังคับให้ทุก endpoint ต้องล็อกอินก่อน:
router.use(requireAuth); // <— เพิ่มบรรทัดนี้ (เอาออกได้ถ้าอยากเปิด GET สาธารณะ)

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

// POST /api/product-types  (ADMIN)
router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { name } = req.body;
    const created = await prisma.productType.create({ data: { name } });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// PUT /api/product-types/:id  (ADMIN)
router.put("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    const updated = await prisma.productType.update({ where: { id }, data: { name } });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/product-types/:id  (ADMIN)
router.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.productType.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
