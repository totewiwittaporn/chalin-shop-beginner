// backend/src/controllers/deliveries/consignmentDeliveries.controller.js
import prisma from "#app/lib/prisma.js";
import { resolveConsignPrice } from "#app/services/price/resolveConsignPrice.js";
import { resolvePartnerCategory } from "#app/services/consignment/categoryResolver.js";

// ช่วยเช็คให้ไม่ล้มทั้งโปรเซส หากชื่อโมเดลไม่ตรงสคีมาจริง
function getModel() {
  const m = prisma?.consignmentDelivery; // ✅ ชื่อที่ถูกต้อง (มี 'ment')
  if (!m) throw new Error("Prisma model 'ConsignmentDelivery' not found. Check schema/model name.");
  return m;
}

/** GET /api/deliveries/consignment */
export async function list(req, res) {
  const { q = "", page = 1, pageSize = 30 } = req.query;
  const take = Math.min(Number(pageSize) || 30, 100);
  const skip = (Number(page) - 1) * take;

  const where = q
    ? {
        OR: [
          { docNo: { contains: String(q), mode: "insensitive" } },
          { partner: { name: { contains: String(q), mode: "insensitive" } } },
          { recipientName: { contains: String(q), mode: "insensitive" } },
        ],
      }
    : {};

  const Model = getModel();
  const [items, total] = await Promise.all([
    Model.findMany({
      where,
      orderBy: { id: "desc" },
      include: { partner: true },
      skip,
      take,
    }),
    Model.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
}

/** GET /api/deliveries/consignment/:id */
export async function get(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "invalid id" });

  const Model = getModel();
  const doc = await Model.findUnique({
    where: { id },
    include: { lines: true, partner: true },
  });
  if (!doc) return res.status(404).json({ message: "Document not found" });
  res.json(doc);
}

/** POST /api/deliveries/consignment */
export async function create(req, res) {
  const { fromBranchId, toPartnerId, toBranchId, lines = [] } = req.body;

  if (!fromBranchId) return res.status(400).json({ message: "fromBranchId is required" });
  if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ message: "lines required" });
  if (!toPartnerId && !toBranchId) return res.status(400).json({ message: "toPartnerId or toBranchId required" });

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
    const unitPrice = await resolveConsignPrice(toPartnerId ?? null, productId, basePrice);
    const cat = toPartnerId ? await resolvePartnerCategory(toPartnerId, productId) : null;

    prepared.push({
      productId,
      qty,
      unitPrice,
      basePrice,
      partnerPriceUsed: Number(unitPrice) !== Number(basePrice),
      partnerCategoryId: cat?.id ?? null,
      partnerCategoryCode: cat?.code ?? null,
      partnerCategoryName: cat?.name ?? null,
      // (แนะนำ snapshot ด้วย ถ้า schema รองรับ)
      barcode: p.barcode ?? null,
      name: p.name ?? null,
    });
  }

  if (prepared.length === 0) return res.status(400).json({ message: "no valid lines" });

  const total = prepared.reduce((sum, l) => sum + Number(l.unitPrice) * Number(l.qty), 0);
  const docNo = await nextDocNo();

  const Model = getModel();
  const doc = await prisma.$transaction(async (tx) => {
    const created = await Model.create({
      data: {
        docNo,
        docDate: new Date(),
        fromBranchId: Number(fromBranchId),
        toPartnerId: toPartnerId ? Number(toPartnerId) : null,
        toBranchId: toBranchId ? Number(toBranchId) : null,
        moneyGrand: total, // ปรับชื่อฟิลด์ตาม schema จริงได้
        issuerName: null,
        recipientName: null,
        lines: { create: prepared },
      },
      include: { lines: true, partner: true },
    });
    return created;
  });

  res.json(doc);
}

async function nextDocNo() {
  const prefix = "DLV-CN";
  const Model = getModel();
  const last = await Model.findFirst({
    where: { docNo: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { docNo: true },
  });
  let n = 1;
  if (last?.docNo) {
    const m = String(last.docNo).match(/(\\d+)$/);
    if (m) n = Number(m[1]) + 1;
  }
  return `${prefix}-${String(n).padStart(5, "0")}`;
}
