import { Router } from "express";
import prisma from "#app/lib/prisma.js";

const router = Router();

/**
 * GET /api/consignment/partners
 * ?q= ค้นหาใน code/name (optional)
 * ?status=ACTIVE|INACTIVE (optional)
 */
router.get("/", async (req, res, next) => {
  try {
    const { q = "", status } = req.query;
    const where = {
      AND: [
        q
          ? {
              OR: [
                { code: { contains: String(q), mode: "insensitive" } },
                { name: { contains: String(q), mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status: String(status).toUpperCase() } : {},
      ],
    };

    const rows = await prisma.consignmentPartner.findMany({
      where,
      orderBy: [{ status: "asc" }, { id: "desc" }],
      select: { id: true, code: true, name: true, status: true, createdAt: true, updatedAt: true },
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/consignment/partners
 * { code, name, status? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { code, name, status } = req.body || {};
    if (!code || !name) return res.status(400).json({ error: "code และ name จำเป็นต้องระบุ" });

    const created = await prisma.consignmentPartner.create({
      data: {
        code: String(code).trim(),
        name: String(name).trim(),
        ...(status ? { status: String(status).toUpperCase() } : {}),
      },
      select: { id: true, code: true, name: true, status: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "รหัส code ซ้ำ (unique violation)" });
    }
    next(err);
  }
});

/**
 * PUT /api/consignment/partners/:id
 * { code?, name?, status? }
 */
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: "พารามิเตอร์ id ไม่ถูกต้อง" });

    const { code, name, status } = req.body || {};
    if (!code && !name && !status) {
      return res.status(400).json({ error: "ต้องระบุอย่างน้อยหนึ่งฟิลด์: code | name | status" });
    }

    const updated = await prisma.consignmentPartner.update({
      where: { id },
      data: {
        ...(code ? { code: String(code).trim() } : {}),
        ...(name ? { name: String(name).trim() } : {}),
        ...(status ? { status: String(status).toUpperCase() } : {}),
      },
      select: { id: true, code: true, name: true, status: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "รหัส code ซ้ำ (unique violation)" });
    }
    next(err);
  }
});

export default router;
