// backend/src/controllers/deliveries/consignmentDeliveries.controller.js
// ESM version – แยก "ทำรายการ" ออกจาก "เอกสาร"
// - รับ lines เป็นสินค้าอย่างเดียว [{ productId, qty }]
// - คิดราคาแบบ 2 ชั้น (consignmentInventory.price > product.salePrice)
// - Snapshot ฟิลด์สำคัญลงบรรทัดเอกสาร (unitPrice, basePrice, partnerPriceUsed, partnerCategory*)

import prisma from "#app/lib/prisma.js";
import { resolveConsignPrice } from "#app/services/price/resolveConsignPrice.js";
import { resolvePartnerCategory } from "#app/services/consignment/categoryResolver.js";

/**
 * GET /api/deliveries/consignment
 * Query: q, page, pageSize
 */
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

  const [items, total] = await Promise.all([
    prisma.consignDelivery.findMany({
      where,
      orderBy: { id: "desc" },
      include: { partner: true },
      skip,
      take,
    }),
    prisma.consignDelivery.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
}

/**
 * GET /api/deliveries/consignment/:id
 */
export async function get(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "invalid id" });

  const doc = await prisma.consignDelivery.findUnique({
    where: { id },
    include: { lines: true, partner: true },
  });
  if (!doc) return res.status(404).json({ message: "Document not found" });
  res.json(doc);
}

/**
 * POST /api/deliveries/consignment
 * body: {
 *   fromBranchId: number,
 *   toPartnerId?: number,
 *   toBranchId?: number,
 *   lines: [{ productId, qty }]
 * }
 * หมายเหตุ: ทำรายการเลือก “สินค้า” อย่างเดียว (ไม่รับจากหมวด)
 */
export async function create(req, res) {
  const { fromBranchId, toPartnerId, toBranchId, lines = [] } = req.body;

  if (!fromBranchId) return res.status(400).json({ message: "fromBranchId is required" });
  if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ message: "lines required" });
  if (!toPartnerId && !toBranchId) return res.status(400).json({ message: "toPartnerId or toBranchId required" });

  // โหลดข้อมูลสินค้าเป็นชุดเดียว
  const ids = lines.map((l) => Number(l.productId)).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, barcode: true, salePrice: true },
  });
  const prodMap = new Map(products.map((p) => [p.id, p]));

  // เตรียมบรรทัดพร้อม snapshot
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
    });
  }

  if (prepared.length === 0) return res.status(400).json({ message: "no valid lines" });

  const total = prepared.reduce((sum, l) => sum + Number(l.unitPrice) * Number(l.qty), 0);
  const docNo = await nextDocNo();

  const doc = await prisma.$transaction(async (tx) => {
    const created = await tx.consignDelivery.create({
      data: {
        docNo,
        docDate: new Date(),
        fromBranchId: Number(fromBranchId),
        toPartnerId: toPartnerId ? Number(toPartnerId) : null,
        toBranchId: toBranchId ? Number(toBranchId) : null,
        moneyGrand: total, // ปรับชื่อ field นี้ให้ตรง schema จริงของคุณ (เช่น total หรือ money.grand)
        issuerName: null,  // TODO: snapshot ชื่อสาขาต้นทาง (ถ้าต้องการ)
        recipientName: null, // TODO: snapshot ชื่อผู้รับ/ร้าน (ถ้าต้องการ)
        lines: { create: prepared },
      },
      include: { lines: true, partner: true },
    });
    return created;
  });

  res.json(doc);
}

// Gen เลขที่เอกสารอย่างง่าย ปรับตามฟอร์แมตจริงได้
async function nextDocNo() {
  const prefix = "DLV-CN";
  const last = await prisma.consignDelivery.findFirst({
    where: { docNo: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { docNo: true },
  });
  let n = 1;
  if (last?.docNo) {
    const m = String(last.docNo).match(/(\d+)$/);
    if (m) n = Number(m[1]) + 1;
  }
  return `${prefix}-${String(n).padStart(5, "0")}`;
}
