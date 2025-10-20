import { Router } from "express";
import prisma from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const router = Router();

/**
 * GET /api/consignment-partners/:partnerId/doc-prefs
 * คืนรายการตั้งค่าของร้านนี้ แยกตาม DocKind
 */
router.get(
  "/:partnerId/doc-prefs",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const partnerId = Number(req.params.partnerId);
    if (!partnerId) return res.status(400).json({ error: "partnerId ไม่ถูกต้อง" });

    const prefs = await prisma.partnerDocPreference.findMany({
      where: { partnerId },
      include: {
        headerTemplate: true,
        tableTemplate: true,
      },
      orderBy: [{ docKind: "asc" }],
    });

    res.json({ data: prefs });
  }
);

/**
 * PUT /api/consignment-partners/:partnerId/doc-prefs
 * Body: { items: [ { docType, headerTemplateId?, tableTemplateId? }, ... ] }
 * ทำ upsert รายแถว ยึด unique(partnerId, docKind)
 */
router.put(
  "/:partnerId/doc-prefs",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const partnerId = Number(req.params.partnerId);
    if (!partnerId) return res.status(400).json({ error: "partnerId ไม่ถูกต้อง" });

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: "items ว่าง" });

    const ops = [];
    for (const it of items) {
      const docKind = String(it.docType || it.docKind || "").trim();
      if (!docKind) continue;

      const headerTemplateId = it.headerTemplateId ? Number(it.headerTemplateId) : null;
      const tableTemplateId = it.tableTemplateId ? Number(it.tableTemplateId) : null;

      ops.push(
        prisma.partnerDocPreference.upsert({
          where: { partnerId_docKind: { partnerId, docKind } },
          create: { partnerId, docKind, headerTemplateId, tableTemplateId },
          update: { headerTemplateId, tableTemplateId },
        })
      );
    }

    const result = await prisma.$transaction(ops);
    res.json({ ok: true, data: result });
  }
);

/**
 * PATCH /api/consignment-partners/:partnerId/doc-prefs/:docKind
 * Body: { headerTemplateId?, tableTemplateId? }
 * อัปเดตแถวเดียวต่อชนิดเอกสาร
 */
router.patch(
  "/:partnerId/doc-prefs/:docKind",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const partnerId = Number(req.params.partnerId);
    const docKind = String(req.params.docKind);
    if (!partnerId || !docKind) return res.status(400).json({ error: "partnerId หรือ docKind ไม่ถูกต้อง" });

    const { headerTemplateId, tableTemplateId } = req.body ?? {};
    const exists = await prisma.partnerDocPreference.findUnique({
      where: { partnerId_docKind: { partnerId, docKind } },
    });

    const up = exists
      ? await prisma.partnerDocPreference.update({
          where: { partnerId_docKind: { partnerId, docKind } },
          data: {
            headerTemplateId: typeof headerTemplateId === "undefined" ? undefined : (headerTemplateId ?? null),
            tableTemplateId: typeof tableTemplateId === "undefined" ? undefined : (tableTemplateId ?? null),
          },
        })
      : await prisma.partnerDocPreference.create({
          data: {
            partnerId,
            docKind,
            headerTemplateId: headerTemplateId ?? null,
            tableTemplateId: tableTemplateId ?? null,
          },
        });

    res.json(up);
  }
);

export default router;
