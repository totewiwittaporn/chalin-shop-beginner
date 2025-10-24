// backend/src/services/inventory/inventory.service.js
import { prisma } from '#app/lib/prisma.js';

/**
 * Utilities
 */
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const q3 = (v) => Number(toNum(v).toFixed(3)); // ปัด 3 ตำแหน่งสำหรับจำนวน
const ensureId = (v, name = 'id') => {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid ${name}`);
  return n;
};

// enums (เท่าที่กำหนดไว้ใน prisma/inventory.prisma)
export const STOCK_MOVE = { IN: 'IN', OUT: 'OUT' };
export const STOCK_LOC = { BRANCH: 'BRANCH', CONSIGNMENT: 'CONSIGNMENT' };
export const REF_TYPES = { CONSIGNMENT_DELIVERY: 'CONSIGNMENT_DELIVERY' };

/**
 * ปรับคงเหลือสต็อก "สาขา"
 * - upsert ก่อนเสมอ
 * - กันสต็อกติดลบ
 */
export async function adjustBranchOnHand(tx, { branchId, productId, delta }) {
  branchId = ensureId(branchId, 'branchId');
  productId = ensureId(productId, 'productId');
  const d = q3(delta);

  const cur = await tx.branchInventory.upsert({
    where: { branchId_productId: { branchId, productId } },
    update: {},
    create: { branchId, productId, onHand: 0 },
  });

  const next = q3(cur.onHand) + d;
  if (next < 0) {
    throw new Error(`สต็อกสาขาไม่พอ (branchId=${branchId}, productId=${productId}, need=${Math.abs(d)})`);
  }

  return tx.branchInventory.update({
    where: { branchId_productId: { branchId, productId } },
    data: { onHand: q3(next) },
  });
}

/**
 * ปรับคงเหลือสต็อก "ร้านฝากขาย (consignment)"
 * - upsert ก่อนเสมอ
 * - กันสต็อกติดลบ
 */
export async function adjustConsignOnHand(tx, { partnerId, productId, delta }) {
  partnerId = ensureId(partnerId, 'partnerId');
  productId = ensureId(productId, 'productId');
  const d = q3(delta);

  const cur = await tx.consignmentInventory.upsert({
    where: { partnerId_productId: { partnerId, productId } },
    update: {},
    create: { partnerId, productId, onHand: 0 },
  });

  const next = q3(cur.onHand) + d;
  if (next < 0) {
    throw new Error(`สต็อกฝากขายไม่พอ (partnerId=${partnerId}, productId=${productId}, need=${Math.abs(d)})`);
  }

  return tx.consignmentInventory.update({
    where: { partnerId_productId: { partnerId, productId } },
    data: { onHand: q3(next) },
  });
}

/**
 * เขียนสมุดรายวันสต็อก (StockLedger)
 * entry: {
 *   at, move: 'IN'|'OUT', locationType: 'BRANCH'|'CONSIGNMENT',
 *   locationId, productId, qty, refType, refId, note?
 * }
 */
export async function writeLedger(tx, entry) {
  const data = {
    at: entry.at ?? new Date(),
    move: entry.move,
    locationType: entry.locationType,
    locationId: ensureId(entry.locationId, 'locationId'),
    productId: ensureId(entry.productId, 'productId'),
    qty: q3(entry.qty),
    refType: entry.refType ?? REF_TYPES.CONSIGNMENT_DELIVERY,
    refId: ensureId(entry.refId, 'refId'),
    note: entry.note ?? null,
  };
  return tx.stockLedger.create({ data });
}

/**
 * เคลื่อนไหวสต็อกจากเอกสาร ConsignmentDelivery เมื่อ "ยืนยันรับ"
 * - delivery: รวมข้อมูลหัวเอกสาร (ต้องมี mode/fromBranchId/... ที่จำเป็น)
 * - items: [{ lineId, productId, qty, unitPrice, qtyReceived? }]
 *
 * RULE:
 *  - SEND:   BRANCH (OUT) → CONSIGNMENT (IN)
 *  - RETURN: CONSIGNMENT (OUT) → BRANCH (IN)
 *
 * หมายเหตุ:
 *  - RETURN ต้องทราบ partnerId ที่เป็น "ต้นทาง consignment"
 *    ใช้จากฟิลด์ใน delivery ตามลำดับ: fromPartnerId → partnerId → toPartnerId
 *    ถ้าไม่มีจริง ๆ จะ throw error ให้ฝ่าย caller จัดการ
 */
export async function postConsignmentDelivery(tx, delivery, items) {
  if (!delivery) throw new Error('delivery is required');
  if (!Array.isArray(items)) throw new Error('items must be an array');

  const mode = String(delivery.mode || '').toUpperCase();
  if (mode !== 'SEND' && mode !== 'RETURN') {
    throw new Error(`Unsupported mode: ${delivery.mode}`);
  }

  const when = new Date();

  if (mode === 'SEND') {
    const fromBranchId = ensureId(delivery.fromBranchId, 'fromBranchId');
    const toPartnerId = ensureId(delivery.toPartnerId, 'toPartnerId');

    for (const it of items) {
      const productId = ensureId(it.productId, 'productId');
      const qty = q3(it.qtyReceived ?? it.qty);
      if (qty <= 0) continue;

      // OUT จากสาขา
      await adjustBranchOnHand(tx, { branchId: fromBranchId, productId, delta: -qty });
      await writeLedger(tx, {
        at: when,
        move: STOCK_MOVE.OUT,
        locationType: STOCK_LOC.BRANCH,
        locationId: fromBranchId,
        productId,
        qty,
        refType: REF_TYPES.CONSIGNMENT_DELIVERY,
        refId: delivery.id,
        note: `SEND → partner ${toPartnerId}`,
      });

      // IN เข้าร้านฝากขาย
      await adjustConsignOnHand(tx, { partnerId: toPartnerId, productId, delta: +qty });
      await writeLedger(tx, {
        at: when,
        move: STOCK_MOVE.IN,
        locationType: STOCK_LOC.CONSIGNMENT,
        locationId: toPartnerId,
        productId,
        qty,
        refType: REF_TYPES.CONSIGNMENT_DELIVERY,
        refId: delivery.id,
        note: `SEND from branch ${fromBranchId}`,
      });
    }
  } else {
    // RETURN
    // หาที่มาของ partner ให้ชัดเจน
    const partnerId =
      delivery.fromPartnerId ??
      delivery.partnerId ??
      delivery.toPartnerId; // เผื่อ schema เดิมมีเก็บไว้ช่องนี้
    if (!partnerId) {
      throw new Error('ไม่พบ partnerId สำหรับ RETURN (ต้องทราบร้านฝากขายต้นทางเพื่อหักสต็อก consignment)');
    }

    const _partnerId = ensureId(partnerId, 'partnerId');
    const toBranchId = ensureId(delivery.toBranchId, 'toBranchId');

    for (const it of items) {
      const productId = ensureId(it.productId, 'productId');
      const qty = q3(it.qtyReceived ?? it.qty);
      if (qty <= 0) continue;

      // OUT จาก consignment
      await adjustConsignOnHand(tx, { partnerId: _partnerId, productId, delta: -qty });
      await writeLedger(tx, {
        at: when,
        move: STOCK_MOVE.OUT,
        locationType: STOCK_LOC.CONSIGNMENT,
        locationId: _partnerId,
        productId,
        qty,
        refType: REF_TYPES.CONSIGNMENT_DELIVERY,
        refId: delivery.id,
        note: `RETURN → branch ${toBranchId}`,
      });

      // IN เข้าสาขา
      await adjustBranchOnHand(tx, { branchId: toBranchId, productId, delta: +qty });
      await writeLedger(tx, {
        at: when,
        move: STOCK_MOVE.IN,
        locationType: STOCK_LOC.BRANCH,
        locationId: toBranchId,
        productId,
        qty,
        refType: REF_TYPES.CONSIGNMENT_DELIVERY,
        refId: delivery.id,
        note: `RETURN from partner ${_partnerId}`,
      });
    }
  }
}
