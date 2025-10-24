// ESM
import { prisma } from '#app/lib/prisma.js';

const DEFAULT_PAGE_SIZE = 20;
function toInt(v, fb = 0) { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? n : fb; }
function toNum(v, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function safeStr(v) { return typeof v === 'string' ? v : (v ?? '').toString(); }
function amountOf(qty, price) { return +(toNum(qty) * toNum(price)).toFixed(2); }

async function nextCode(prefix = 'BD') {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startPrefix = `${prefix}-${ym}-`;
  const last = await prisma.branchDelivery.findFirst({
    where: { code: { startsWith: startPrefix } },
    orderBy: { id: 'desc' },
    select: { code: true },
  });
  let seq = 0;
  if (last?.code) { const m = last.code.match(/(\d+)$/); if (m) seq = parseInt(m[1], 10) || 0; }
  return `${startPrefix}${String(seq + 1).padStart(6, '0')}`;
}

/** GET /api/branch-deliveries */
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
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.branchDelivery.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
        include: {
          fromBranch: true,
          toBranch: true,
          lines: { include: { product: true } },
        },
      }),
      prisma.branchDelivery.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
}

/** GET /api/branch-deliveries/:id */
export async function get(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const doc = await prisma.branchDelivery.findUnique({
      where: { id },
      include: { fromBranch: true, toBranch: true, lines: { include: { product: true } } },
    });
    if (!doc) return res.status(404).json({ message: 'BranchDelivery not found' });
    res.json(doc);
  } catch (err) { next(err); }
}

/** POST /api/branch-deliveries */
export async function create(req, res, next) {
  try {
    const { date, note, status = 'DRAFT', fromBranchId, toBranchId, lines = [] } = req.body || {};
    if (!fromBranchId || !toBranchId) {
      return res.status(400).json({ message: 'fromBranchId and toBranchId are required' });
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'lines is required (non-empty)' });
    }

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

    const code = await nextCode('BD');

    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.branchDelivery.create({
        data: {
          code,
          date: date ? new Date(date) : new Date(),
          status,
          fromBranchId: toInt(fromBranchId),
          toBranchId: toInt(toBranchId),
          note: note ?? null,
          total: +total.toFixed(2),
          lines: { create: preparedLines },
        },
        include: {
          fromBranch: true,
          toBranch: true,
          lines: { include: { product: true } },
        },
      });

      // TODO (ถัดไป): เคลื่อนไหวสต็อก OUT/IN

      return doc;
    });

    res.status(201).json(created);
  } catch (err) { next(err); }
}

/** PATCH /api/branch-deliveries/:id/status { status } */
export async function updateStatus(req, res, next) {
  try {
    const id = toInt(req.params.id);
    const { status } = req.body || {};
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    if (!status) return res.status(400).json({ message: 'status is required' });

    const updated = await prisma.branchDelivery.update({
      where: { id },
      data: { status },
      include: {
        fromBranch: true,
        toBranch: true,
        lines: { include: { product: true } },
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
}

/**
 * ✅ เพิ่มให้: ใช้กับ /api/print (แก้ error import)
 * GET /api/print/branch-delivery/:id
 * ส่ง payload พร้อมสำหรับการเรนเดอร์เอกสาร/เทมเพลตฝั่ง print
 */
export async function printDelivery(req, res, next) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const doc = await prisma.branchDelivery.findUnique({
      where: { id },
      include: { fromBranch: true, toBranch: true, lines: { include: { product: true } } },
    });
    if (!doc) return res.status(404).json({ message: 'BranchDelivery not found' });

    // DTO เบื้องต้นสำหรับพิมพ์ (ยังไม่ผูก template engine)
    const payload = {
      type: 'BRANCH_DELIVERY',
      code: doc.code,
      date: doc.date,
      status: doc.status,
      fromBranch: doc.fromBranch?.name ?? null,
      toBranch: doc.toBranch?.name ?? null,
      note: doc.note ?? '',
      total: doc.total,
      lines: doc.lines.map((l, idx) => ({
        no: idx + 1,
        sku: l.product?.sku ?? '',
        name: l.displayName ?? l.product?.name ?? '',
        qty: l.qty,
        unitPrice: l.unitPrice,
        amount: l.amount,
      })),
    };

    res.json(payload);
  } catch (err) { next(err); }
}
