import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const router = Router();

/**
 * GET /api/headquarters/:hqId/table-templates
 * Query: docType? (DELIVERY/INVOICE/RECEIPT/CONSALE), status? (ACTIVE), q?, page?, pageSize?
 */
router.get(
  "/:hqId/table-templates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const {
      docType,
      status,
      q,
      page = 1,
      pageSize = 100,
    } = req.query;

    if (!hqId) return res.status(400).json({ error: "hqId ไม่ถูกต้อง" });

    const where = { hqId };
    if (docType) where.docKind = docType; // ใน Prisma: ใช้ชื่อ enum DocKind ตรงกับค่าที่ส่งมา
    if (status) where.status = status;
    if (q) where.name = { contains: String(q), mode: "insensitive" };

    const take = Math.min(Number(pageSize) || 100, 500);
    const skip = Math.max((Number(page) || 1) - 1, 0) * take;

    const [items, total] = await Promise.all([
      prisma.tableTemplate.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.tableTemplate.count({ where }),
    ]);

    res.json({ data: items, pagination: { total, page: Number(page), pageSize: take } });
  }
);

/**
 * POST /api/headquarters/:hqId/table-templates
 * Body: { name, docType, isDefault?, columns, options? }
 */
router.post(
  "/:hqId/table-templates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const { name, docType, isDefault = false, columns, options, status = "ACTIVE" } = req.body ?? {};

    if (!hqId) return res.status(400).json({ error: "hqId ไม่ถูกต้อง" });
    if (!name || !docType || !columns) {
      return res.status(400).json({ error: "ต้องมี name, docType และ columns" });
    }

    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.tableTemplate.updateMany({ where: { hqId, docKind: docType, isDefault: true }, data: { isDefault: false } });
      }
      return tx.tableTemplate.create({
        data: {
          hqId,
          name: String(name),
          docKind: String(docType),
          isDefault: !!isDefault,
          columns, // Prisma.JsonValue
          options: options ?? null,
          status: String(status),
        },
      });
    });

    res.status(201).json(created);
  }
);

/**
 * PUT /api/headquarters/:hqId/table-templates/:id
 * Body: { name?, docType?, isDefault?, columns?, options?, status? }
 */
router.put(
  "/:hqId/table-templates/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const id = Number(req.params.id);
    const { name, docType, isDefault, columns, options, status } = req.body ?? {};

    if (!hqId || !id) return res.status(400).json({ error: "hqId หรือ id ไม่ถูกต้อง" });

    const exists = await prisma.tableTemplate.findUnique({ where: { id } });
    if (!exists || exists.hqId !== hqId) return res.status(404).json({ error: "ไม่พบเทมเพลต" });

    const updated = await prisma.$transaction(async (tx) => {
      if (typeof isDefault === "boolean" && isDefault) {
        const kind = docType ?? exists.docKind;
        await tx.tableTemplate.updateMany({
          where: { hqId, docKind: kind, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.tableTemplate.update({
        where: { id },
        data: {
          name: name ?? undefined,
          docKind: docType ?? undefined,
          isDefault: typeof isDefault === "boolean" ? isDefault : undefined,
          columns: columns ?? undefined,
          options: options ?? undefined,
          status: status ?? undefined,
        },
      });
    });

    res.json(updated);
  }
);

/**
 * PATCH /api/headquarters/:hqId/table-templates/:id/default
 */
router.patch(
  "/:hqId/table-templates/:id/default",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const id = Number(req.params.id);
    if (!hqId || !id) return res.status(400).json({ error: "hqId หรือ id ไม่ถูกต้อง" });

    const tpl = await prisma.tableTemplate.findUnique({ where: { id } });
    if (!tpl || tpl.hqId !== hqId) return res.status(404).json({ error: "ไม่พบเทมเพลต" });

    await prisma.$transaction([
      prisma.tableTemplate.updateMany({
        where: { hqId, docKind: tpl.docKind, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      }),
      prisma.tableTemplate.update({ where: { id }, data: { isDefault: true } }),
    ]);

    const fresh = await prisma.tableTemplate.findUnique({ where: { id } });
    res.json({ ok: true, template: fresh });
  }
);

/**
 * DELETE /api/headquarters/:hqId/table-templates/:id
 */
router.delete(
  "/:hqId/table-templates/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const id = Number(req.params.id);
    if (!hqId || !id) return res.status(400).json({ error: "hqId หรือ id ไม่ถูกต้อง" });

    const tpl = await prisma.tableTemplate.findUnique({ where: { id } });
    if (!tpl || tpl.hqId !== hqId) return res.status(404).json({ error: "ไม่พบเทมเพลต" });

    await prisma.tableTemplate.delete({ where: { id } });
    res.json({ ok: true });
  }
);

export default router;
