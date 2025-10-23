// backend/src/controllers/deliveries/consignmentDeliveries.controller.js
import prisma from "#app/lib/prisma.js";
import { resolveConsignPrice } from "#app/services/price/resolveConsignPrice.js";
import { resolvePartnerCategory } from "#app/services/consignment/categoryResolver.js";

/** GET /api/deliveries/consignment?q=&page=&pageSize= */
export async function list(req, res) {
  const { q = "", page = 1, pageSize = 30 } = req.query;
  const take = Math.min(Number(pageSize) || 30, 100);
  const skip = (Number(page) - 1) * take;

  const where =
    q?.trim() !== ""
      ? {
          OR: [
            { code: { contains: String(q), mode: "insensitive" } },
            { toPartner: { name: { contains: String(q), mode: "insensitive" } } },
            { recipientName: { contains: String(q), mode: "insensitive" } },
          ],
        }
      : {};

  const [items, total] = await Promise.all([
    prisma.consignmentDelivery.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { toPartner: true },
      skip,
      take,
    }),
    prisma.consignmentDelivery.count({ where }),
  ]);

  const mapped = items.map((d) => ({
    id: d.id,
    docNo: d.code || `CDN-${d.id}`,
    docDate: d.date,
    partnerName: d.toPartner?.name || d.recipientName || null,
    total: d.moneyGrand ?? null,
  }));

  res.json({ items: mapped, total, page: Number(page), pageSize: take });
}

/** GET /api/deliveries/consignment/:id */
export async function get(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "invalid id" });

  const d = await prisma.consignmentDelivery.findUnique({
    where: { id },
    include: { toPartner: true, lines: true },
  });
  if (!d) return res.status(404).json({ message: "Document not found" });

  const doc = {
    id: d.id,
    docNo: d.code || `CDN-${d.id}`,
    docDate: d.date,
    partner: d.toPartner || null,
    lines: d.lines,
    money: { grand: d.moneyGrand ?? 0 },
  };
  res.json(doc);
}

/** POST /api/deliveries/consignment
 * body: {
 *   type: "SEND" | "RETURN",
 *   fromBranchId: number,
 *   toPartnerId?: number, // SEND
 *   toBranchId?: number,  // RETURN
 *   lines: [{ productId, qty }],
 *   notes?: string
 * }
 */
export async function create(req, res) {
  const { type, fromBranchId, toPartnerId, toBranchId, lines = [], notes } = req.body;

  if (type !== "SEND" && type !== "RETURN")
    return res.status(400).json({ message: "type must be SEND or RETURN" });

  if (!fromBranchId) return res.status(400).json({ message: "fromBranchId is required" });
  if (!Array.isArray(lines) || lines.length === 0)
    return res.status(400).json({ message: "lines required" });

  if (type === "SEND" && !toPartnerId)
    return res.status(400).json({ message: "toPartnerId required for SEND" });
  if (type === "RETURN" && !toBranchId)
    return res.status(400).json({ message: "toBranchId required for RETURN" });

  const ids = lines.map((l) => Number(l.productId)).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, barcode: true, salePrice: true },
  });
  const prodMap = new Map(products.map((p) => [p.id, p]));

  const prepared = [];
  for (const l of lines) {
    const productId = Number(l.productId);
    const qty = Math.max(1, Number(l.qty || 1));
    const p = prodMap.get(productId);
    if (!p) continue;

    const basePrice = Number(p.salePrice || 0);
    const partnerId = type === "SEND" ? Number(toPartnerId) : null;
    const unitPrice = partnerId
      ? await resolveConsignPrice(partnerId, productId, basePrice)
      : basePrice;

    const cat = partnerId ? await resolvePartnerCategory(partnerId, productId) : null;

    prepared.push({
      productId,
      qty,
      unitPrice,
      basePrice,
      partnerPriceUsed: Number(unitPrice) !== Number(basePrice),
      partnerCategoryId: cat?.id ?? null,
      partnerCategoryCode: cat?.code ?? null,
      partnerCategoryName: cat?.name ?? null,
      barcode: p.barcode ?? null,
      name: p.name ?? null,
    });
  }

  if (prepared.length === 0) return res.status(400).json({ message: "no valid lines" });

  const total = prepared.reduce(
    (sum, l) => sum + Number(l.unitPrice) * Number(l.qty),
    0
  );

  const code = await nextCode();

  const created = await prisma.consignmentDelivery.create({
    data: {
      code,
      date: new Date(),
      type,
      status: "DRAFT",
      notes: notes || null,
      fromBranchId: Number(fromBranchId),
      toPartnerId: type === "SEND" ? Number(toPartnerId) : null,
      toBranchId: type === "RETURN" ? Number(toBranchId) : null,
      moneyGrand: total,
      lines: { create: prepared },
    },
    include: { toPartner: true, lines: true },
  });

  const doc = {
    id: created.id,
    docNo: created.code || `CDN-${created.id}`,
    docDate: created.date,
    partner: created.toPartner || null,
    lines: created.lines,
    money: { grand: created.moneyGrand ?? 0 },
  };

  res.json(doc);
}

async function nextCode() {
  const prefix = "CDN";
  const last = await prisma.consignmentDelivery.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { code: true },
  });
  let n = 1;
  if (last?.code) {
    const m = String(last.code).match(/(\d+)$/);
    if (m) n = Number(m[1]) + 1;
  }
  return `${prefix}-${String(n).padStart(6, "0")}`;
}
