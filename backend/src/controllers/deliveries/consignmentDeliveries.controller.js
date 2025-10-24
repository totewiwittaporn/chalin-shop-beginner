// backend/src/controllers/deliveries/consignmentDeliveries.controller.js
import { prisma } from '#app/lib/prisma.js';
import { postConsignmentDelivery } from '#app/services/inventory/inventory.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MODE_SEND = 'SEND';
const MODE_RETURN = 'RETURN';

const toInt = (v, fb = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fb;
};
const toNum = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const safeStr = (v) => (typeof v === 'string' ? v : (v ?? '').toString());
const amountOf = (qty, price) => +(toNum(qty) * toNum(price)).toFixed(2);

async function nextCode(prefix = 'CD') {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startPrefix = `${prefix}-${ym}-`;
  const last = await prisma.consignmentDelivery.findFirst({
    where: { code: { startsWith: startPrefix } },
    orderBy: { id: 'desc' },
    select: { code: true },
  });
  let seq = 0;
  if (last?.code) {
    const m = last.code.match(/(\d+)$/);
    if (m) seq = parseInt(m[1], 10) || 0;
  }
  return `${startPrefix}${String(seq + 1).padStart(6, '0')}`;
}

/** GET /api/consignment-deliveries */
export async function list(req, res, next) {
  try {
    const q = safeStr(req.query.q).trim();
    const page = Math.max(1, toInt(req.query.page, 1));
    const pageSize = Math.min(100, Math.max(1, toInt(req.query.pageSize, DEFAULT_PAGE_SIZE)));
    const skip = (page - 1) * pageSize;

    const where = q
      ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { note: { contains: q, mode: 'insensitive' } },
            { fromBranch: { name: { contains: q, mode: 'insensitive' } } },
            { toBranch: { name: { contains: q, mode: 'insensitive' } } },
            { toPartner: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.consignmentDelivery.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
        include: {
          fromBranch: true,
          toBranch: true,
          toPartner: true,
          lines: { include: { product: true } },
        },
      }),
      prisma.consignmentDelivery.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/consignment-deliveries/:id */
export async function get(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const doc = await prisma.consignmentDelivery.findUnique({
      where: { id },
      include: {
        fromBranch: true,
        toBranch: true,
        toPartner: true,
        lines: { include: { product: true } },
      },
    });

    if (!doc) return res.status(404).json({ message: 'ConsignmentDelivery not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/consignment-deliveries
 * body: {
 *   date?, note?, status? (DRAFT|SENT),        // ถ้าไม่ส่งมา จะตั้งเป็น SENT ให้เลย เพื่อพร้อมยืนยันรับ
 *   mode?: 'SEND'|'RETURN' (หรือ actionType เดิมได้),
 *   fromBranchId (required),
 *   toPartnerId? (SEND), toBranchId? (RETURN),
 *   lines: [{ productId, qty, unitPrice, displayName? }]
 * }
 */
export async function create(req, res, next) {
  try {
    const {
      date,
      note,
      status: rawStatus,              // optional
      mode: _mode,
      actionType,                      // รองรับของเก่า
      fromBranchId,
      toPartnerId,
      toBranchId,
      lines = [],
    } = req.body || {};

    const mode = String((_mode || actionType || '')).toUpperCase();
    if (![MODE_SEND, MODE_RETURN].includes(mode)) {
      return res.status(400).json({ message: 'mode must be "SEND" or "RETURN"' });
    }
    if (!fromBranchId) return res.status(400).json({ message: 'fromBranchId is required' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'lines is required (non-empty)' });
    }
    if (mode === MODE_SEND && !toPartnerId) {
      return res.status(400).json({ message: 'toPartnerId is required when mode=SEND' });
    }
    if (mode === MODE_RETURN && !toBranchId) {
      return res.status(400).json({ message: 'toBranchId is required when mode=RETURN' });
    }

    // ถ้าไม่กำหนด status มา จะตั้งต้นเป็น 'SENT' เพื่อรอการยืนยันรับ
    const status = rawStatus ? String(rawStatus).toUpperCase() : 'SENT';

    let total = 0;
    const preparedLines = lines.map((l) => {
      const qty = toNum(l.qty);
      const price = toNum(l.unitPrice ?? l.price);
      const amount = amountOf(qty, price);
      total += amount;
      return {
        productId: toInt(l.productId),
        qty,
        unitPrice: price,
        amount,
        displayName: l.displayName ?? null,
      };
    });

    const code = await nextCode('CD');

    const created = await prisma.consignmentDelivery.create({
      data: {
        code,
        date: date ? new Date(date) : new Date(),
        status,
        mode,
        fromBranchId: toInt(fromBranchId),
        toPartnerId: mode === MODE_SEND ? toInt(toPartnerId) : null,
        toBranchId: mode === MODE_RETURN ? toInt(toBranchId) : null,
        note: note ?? null,
        total: +total.toFixed(2),
        lines: { create: preparedLines },
      },
      include: {
        fromBranch: true,
        toBranch: true,
        toPartner: true,
        lines: { include: { product: true } },
      },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/consignment-deliveries/:id/status { status } */
export async function updateStatus(req, res, next) {
  try {
    const id = toInt(req.params.id);
    const { status } = req.body || {};
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    if (!status) return res.status(400).json({ message: 'status is required' });

    const updated = await prisma.consignmentDelivery.update({
      where: { id },
      data: { status: String(status).toUpperCase() },
      include: {
        fromBranch: true,
        toBranch: true,
        toPartner: true,
        lines: { include: { product: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/consignment-deliveries/:id/confirm
 * body: { items?: [{ lineId?, productId?, qtyReceived? }] }
 *
 * - ถ้าไม่ได้ส่ง items มา จะถือว่ายืนยันรับ "ตามจำนวนเต็ม" ของทุกรายการ
 * - อนุญาตให้ยืนยันเมื่อเอกสารอยู่ในสถานะ 'SENT' หรือ 'DRAFT'
 * - ผลลัพธ์สุดท้ายจะอัปเดตสถานะเป็น 'RECEIVED'
 */
export async function confirmReceive(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const payloadItems = Array.isArray(req.body?.items) ? req.body.items : [];

    const result = await prisma.$transaction(async (tx) => {
      // โหลดเอกสาร + lines (lock not supported by Prisma – เราจัดการในระดับธุรกิจ)
      const doc = await tx.consignmentDelivery.findUnique({
        where: { id },
        include: { lines: true },
      });
      if (!doc) throw new Error('ConsignmentDelivery not found');

      const st = String(doc.status || '').toUpperCase();
      if (!['SENT', 'DRAFT'].includes(st)) {
        throw new Error('เอกสารต้องอยู่ในสถานะ SENT หรือ DRAFT เพื่อยืนยันรับ');
      }

      // map line → qtyReceived (fallback = line.qty)
      const items = doc.lines.map((l) => {
        const found = payloadItems.find(
          (x) => (x.lineId && Number(x.lineId) === l.id) || (x.productId && Number(x.productId) === l.productId)
        );
        const qtyReceived =
          found?.qtyReceived != null ? Number(found.qtyReceived) : Number(l.qty);
        return {
          lineId: l.id,
          productId: l.productId,
          qty: Number(l.qty),
          unitPrice: Number(l.unitPrice),
          qtyReceived,
        };
      });

      // เคลื่อนไหวสต็อก (ออก/เข้า) + บันทึกสมุดรายวัน
      await postConsignmentDelivery(tx, doc, items);

      // อัปเดตสถานะเป็น RECEIVED
      const updated = await tx.consignmentDelivery.update({
        where: { id },
        data: { status: 'RECEIVED' },
        include: {
          fromBranch: true,
          toBranch: true,
          toPartner: true,
          lines: { include: { product: true } },
        },
      });

      return updated;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
