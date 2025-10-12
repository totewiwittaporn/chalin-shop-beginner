// src/routes/productTypes.routes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// ต้องมี token ทุกเมธอดในไฟล์นี้
router.use(requireAuth);

/**
 * GET /api/product-types?search=&page=1&pageSize=20
 * - อ่านได้ทุกบทบาทที่ล็อกอิน (ADMIN/STAFF/CONSIGNMENT/QUOTE_VIEWER)
 * - คืน { items, total, page, pageSize }
 */
router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "20"), 10)));
    const skip = (page - 1) * pageSize;

    const where = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    const [items, total] = await Promise.all([
      prisma.productType.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.productType.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/product-types
 * - ADMIN เท่านั้น
 */
router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const created = await prisma.productType.create({
      data: { name: String(name).trim() },
    });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/product-types/:id
 * - ADMIN เท่านั้น
 */
router.put("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const updated = await prisma.productType.update({
      where: { id },
      data: { name: String(name).trim() },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/product-types/:id
 * - ADMIN เท่านั้น
 */
router.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

    await prisma.productType.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
