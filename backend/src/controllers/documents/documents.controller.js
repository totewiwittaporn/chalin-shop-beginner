// #app/controllers/documents/documents.controller.js
import prisma from "#app/lib/prisma.js";

/**
 * GET /api/docs
 * Query: kind=DELIVERY | status | branchId | partnerId | dateFrom | dateTo | q
 */
export async function listDocuments(req, res) {
  try {
    const {
      kind = "DELIVERY",
      status,
      branchId,
      partnerId,
      dateFrom,
      dateTo,
      q,
      page = 1,
      pageSize = 50,
    } = req.query;

    const where = { kind };

    if (status) where.status = status;
    if (branchId) {
      where.OR = [
        { partyFromBranchId: Number(branchId) },
        { partyToBranchId: Number(branchId) },
      ];
    }
    if (partnerId) where.partyToPartnerId = Number(partnerId);
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        where.issueDate.lte = d;
      }
    }
    if (q) {
      where.OR = [
        ...(where.OR || []),
        { docNo: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { issueDate: "desc" },
        skip,
        take,
        include: {
          partyFromBranch: true,
          partyToBranch: true,
          partyToPartner: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return res.json({ items, total, page: Number(page), pageSize: take });
  } catch (err) {
    console.error("listDocuments error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/docs/:id/status
 * Body: { status: "SENT" | "RECEIVED" }
 * Allowed:
 *  - DRAFT → SENT
 *  - SENT → RECEIVED
 * (ซิงค์สถานะไป Consignment/Branch Delivery ถ้าเชื่อมไว้)
 */
export async function updateStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (doc.kind !== "DELIVERY") {
      return res.status(400).json({ error: "Only DELIVERY kind is supported" });
    }

    const current = String(doc.status || "DRAFT").toUpperCase();
    const next = String(status || "").toUpperCase();
    const ok = (cur, nxt) =>
      (cur === "DRAFT" && nxt === "SENT") ||
      (cur === "SENT" && nxt === "RECEIVED");

    if (!ok(current, next)) {
      return res.status(400).json({ error: `Invalid transition ${current} → ${next}` });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { status: next },
    });

    // sync ไป delivery ที่ผูกไว้ (optional, ignore error)
    if (updated.consignmentDeliveryId) {
      await prisma.consignDelivery.update({
        where: { id: updated.consignmentDeliveryId },
        data: { status: next },
      }).catch(() => {});
    }
    if (updated.branchDeliveryId) {
      await prisma.branchDelivery.update({
        where: { id: updated.branchDeliveryId },
        data: { status: next },
      }).catch(() => {});
    }

    return res.json(updated);
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
