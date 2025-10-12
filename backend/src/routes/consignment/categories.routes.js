import { Router } from "express";
import prisma from "#app/lib/prisma.js";

const router = Router();

/**
 * GET /api/consignment/categories?partnerId=1&q=
 * - รายการหมวดของ partner
 * - q: ค้นหาทั้ง code/name
 */
router.get("/", async (req, res, next) => {
  try {
    const inputPartnerId = Number(req.query.partnerId || 0);
    const q = String(req.query.q || "").trim();
    let partnerId = inputPartnerId;

    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });

    const items = await prisma.consignmentCategory.findMany({
      where: {
        partnerId,
        ...(q
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json(items);
  } catch (err) { next(err); }
});

/**
 * POST /api/consignment/categories
 * body: { partnerId, code, name }
 */
router.post("/", async (req, res, next) => {
  try {
    let { partnerId, code, name } = req.body || {};
    partnerId = Number(partnerId || 0);
    code = String(code || "").trim();
    name = String(name || "").trim();

    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });
    if (!code) return res.status(400).json({ error: "code required" });
    if (!name) return res.status(400).json({ error: "name required" });

    const created = await prisma.consignmentCategory.create({
      data: { partnerId, code, name },
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") return res.status(409).json({ error: "code ซ้ำในร้านนี้" });
    next(err);
  }
});

/**
 * PUT /api/consignment/categories/:id
 * body: { code?, name? }
 */
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: "id invalid" });

    const data = {};
    if (req.body?.code !== undefined) data.code = String(req.body.code || "").trim();
    if (req.body?.name !== undefined) data.name = String(req.body.name || "").trim();
    if (!data.code && !data.name) return res.status(400).json({ error: "ต้องมีอย่างน้อย code หรือ name" });

    const updated = await prisma.consignmentCategory.update({
      where: { id },
      data,
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  } catch (err) {
    if (err?.code === "P2002") return res.status(409).json({ error: "code ซ้ำในร้านนี้" });
    next(err);
  }
});

/**
 * GET /api/consignment/partners/:partnerId/categories
 * - เหมือน GET /categories แต่ใช้ path param
 */
router.get("/partners/:partnerId/categories", async (req, res, next) => {
  try {
    let partnerId = Number(req.params.partnerId || 0);
    if (req.user?.role === "CONSIGNMENT") {
      partnerId = Number(req.user.partnerId || 0);
    }
    if (!partnerId) return res.status(400).json({ error: "partnerId required" });

    const items = await prisma.consignmentCategory.findMany({
      where: { partnerId },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, partnerId: true, code: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json(items);
  } catch (err) { next(err); }
});

/**
 * ส่วน mapping เหมือนเดิม (ไม่เปลี่ยน) — ถ้าไฟล์คุณมีอยู่แล้วใช้ตามเวอร์ชันล่าสุดที่ผมส่งให้ในรอบก่อน
 * GET /api/consignment/partners/:partnerId/categories/:categoryId/products
 * POST /api/consignment/partners/:partnerId/categories/:categoryId/map
 * DELETE /api/consignment/partners/:partnerId/categories/:categoryId/products/:productId
 */
export default router;
