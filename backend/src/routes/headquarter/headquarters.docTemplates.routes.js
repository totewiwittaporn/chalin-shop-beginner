import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const router = Router();

/**
 * GET /api/headquarters/:hqId/doc-templates
 * Query: docKind? (GENERIC ใช้ generic=true), status?, q?, page?, pageSize?
 * หมายเหตุ: โมเดล DocTemplate ใช้ฟิลด์: generic:boolean + docKind:DocKind?
 */
router.get(
  "/:hqId/doc-templates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const { docKind, status, q, page = 1, pageSize = 100 } = req.query;
    if (!hqId) return res.status(400).json({ error: "hqId ไม่ถูกต้อง" });

    const where = { hqId };
    if (docKind === "GENERIC") {
      where.generic = true;
    } else if (docKind) {
      where.generic = false;
      where.docKind = docKind;
    }
    if (status) where.status = status;
    if (q) where.name = { contains: String(q), mode: "insensitive" };

    const take = Math.min(Number(pageSize) || 100, 500);
    const skip = Math.max((Number(page) || 1) - 1, 0) * take;

    const [items, total] = await Promise.all([
      prisma.docTemplate.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.docTemplate.count({ where }),
    ]);

    res.json({ data: items, pagination: { total, page: Number(page), pageSize: take } });
  }
);

/**
 * POST /api/headquarters/:hqId/doc-templates
 * Body: { name, generic:boolean, docKind?:DocKind, isDefault?:boolean, header:Json, footer:Json, status? }
 */
router.post(
  "/:hqId/doc-templates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const { name, generic = true, docKind = null, isDefault = false, header, footer, status = "ACTIVE" } = req.body ?? {};

    if (!hqId) return res.status(400).json({ error: "hqId ไม่ถูกต้อง" });
    if (!name || !header || !footer) {
      return res.status(400).json({ error: "ต้องมี name, header, footer" });
    }
    if (!generic && !docKind) {
      return res.status(400).json({ error: "เมื่อ generic=false ต้องระบุ docKind" });
    }

    const created = await prisma.$transaction(async (tx) => {
      // ปิด default อื่นตามกติกา:
      // - generic=true: default ได้ HQ ละ 1
      // - generic=false: default ได้ HQ+docKind ละ 1
      if (isDefault) {
        if (generic) {
          await tx.docTemplate.updateMany({ where: { hqId, generic: true, isDefault: true }, data: { isDefault: false } });
        } else {
          await tx.docTemplate.updateMany({
            where: { hqId, generic: false, docKind, isDefault: true },
            data: { isDefault: false },
          });
        }
      }
      return tx.docTemplate.create({
        data: {
          hqId,
          name: String(name),
          generic: !!generic,
          docKind: generic ? null : String(docKind),
          isDefault: !!isDefault,
          header,
          footer,
          status: String(status),
        },
      });
    });

    res.status(201).json(created);
  }
);

/**
 * PUT /api/headquarters/:hqId/doc-templates/:id
 * Body: { name?, generic?, docKind?, isDefault?, header?, footer?, status? }
 */
router.put(
  "/:hqId/doc-templates/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const id = Number(req.params.id);
    const { name, generic, docKind, isDefault, header, footer, status } = req.body ?? {};

    if (!hqId || !id) return res.status(400).json({ error: "hqId หรือ id ไม่ถูกต้อง" });

    const exists = await prisma.docTemplate.findUnique({ where: { id } });
    if (!exists || exists.hqId !== hqId) return res.status(404).json({ error: "ไม่พบเทมเพลต" });

    const updated = await prisma.$transaction(async (tx) => {
      // ถ้าต้องตั้ง default
      if (typeof isDefault === "boolean" && isDefault) {
        const nextGeneric = typeof generic === "boolean" ? generic : exists.generic;
        const nextKind = typeof docKind !== "undefined" ? docKind : exists.docKind;
        if (nextGeneric) {
          await tx.docTemplate.updateMany({
            where: { hqId, generic: true, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        } else {
          await tx.docTemplate.updateMany({
            where: { hqId, generic: false, docKind: nextKind, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }
      }

      return tx.docTemplate.update({
        where: { id },
        data: {
          name: name ?? undefined,
          generic: typeof generic === "boolean" ? generic : undefined,
          docKind: typeof docKind !== "undefined" ? (generic ? null : docKind) : undefined,
          isDefault: typeof isDefault === "boolean" ? isDefault : undefined,
          header: header ?? undefined,
          footer: footer ?? undefined,
          status: status ?? undefined,
        },
      });
    });

    res.json(updated);
  }
);

/**
 * PATCH /api/headquarters/:hqId/doc-templates/:id/default
 */
router.patch(
  "/:hqId/doc-templates/:id/default",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const id = Number(req.params.id);
    if (!hqId || !id) return res.status(400).json({ error: "hqId หรือ id ไม่ถูกต้อง" });

    const tpl = await prisma.docTemplate.findUnique({ where: { id } });
    if (!tpl || tpl.hqId !== hqId) return res.status(404).json({ error: "ไม่พบเทมเพลต" });

    if (tpl.generic) {
      await prisma.$transaction([
        prisma.docTemplate.updateMany({ where: { hqId, generic: true, isDefault: true, id: { not: id } }, data: { isDefault: false } }),
        prisma.docTemplate.update({ where: { id }, data: { isDefault: true } }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.docTemplate.updateMany({
          where: { hqId, generic: false, docKind: tpl.docKind, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        }),
        prisma.docTemplate.update({ where: { id }, data: { isDefault: true } }),
      ]);
    }

    const fresh = await prisma.docTemplate.findUnique({ where: { id } });
    res.json({ ok: true, template: fresh });
  }
);

/**
 * DELETE /api/headquarters/:hqId/doc-templates/:id
 */
router.delete(
  "/:hqId/doc-templates/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const hqId = Number(req.params.hqId);
    const id = Number(req.params.id);
    if (!hqId || !id) return res.status(400).json({ error: "hqId หรือ id ไม่ถูกต้อง" });

    const tpl = await prisma.docTemplate.findUnique({ where: { id } });
    if (!tpl || tpl.hqId !== hqId) return res.status(404).json({ error: "ไม่พบเทมเพลต" });

    await prisma.docTemplate.delete({ where: { id } });
    res.json({ ok: true });
  }
);

export default router;
