// backend/src/controllers/deliveries/consignmentDeliveries.controller.js
// ESM
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== Helper =====
const DocKind = 'DELIVERY';
const DocType = 'DELIVERY_CONSIGNMENT'; // enums.prisma ของคุณต้องมีค่าตัวนี้
const DocStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PARTIAL: 'PARTIAL',
  SHIPPED: 'SHIPPED',
  CANCELLED: 'CANCELLED',
};

const PartyKind = {
  BRANCH: 'BRANCH',
  CONSIGNMENT: 'CONSIGNMENT',
};

function pickIssuerRecipientByAction(actionType, { fromBranchId, toPartnerId, toBranchId }) {
  // SEND: สาขา → ร้านฝากขาย
  // RETURN: ร้านฝากขาย → สาขา
  if (actionType === 'SEND') {
    if (!fromBranchId || !toPartnerId) throw new Error('fromBranchId/toPartnerId is required');
    return {
      issuerKind: PartyKind.BRANCH,
      issuerId: Number(fromBranchId),
      recipientKind: PartyKind.CONSIGNMENT,
      recipientId: Number(toPartnerId),
    };
  }
  if (actionType === 'RETURN') {
    if (!toBranchId || !fromBranchId) {
      // หมายเหตุ: ในบางระบบ RETURN อาจไม่ต้องส่ง fromBranchId หากใช้ branch ของ user
      // ปล่อยเช็คไว้ตรงๆ เพื่อความชัด
    }
    return {
      issuerKind: PartyKind.CONSIGNMENT,
      issuerId: Number(fromBranchId), // ฝั่ง consignment อาจ map เป็น branchId ของร้านฝากขาย
      recipientKind: PartyKind.BRANCH,
      recipientId: Number(toBranchId),
    };
  }
  throw new Error(`Unknown actionType: ${actionType}`);
}

function ensureLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error('lines is empty');
}

function sumAmount(lines) {
  return lines.reduce((s, l) => s + Number(l.amount || 0), 0);
}

async function genDocNo(prefix = 'DLV-CN') {
  // คุณสามารถเปลี่ยนเป็น service genDocNo เดิมได้
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const seq = Math.floor(100000 + Math.random() * 900000); // stub
  return `${prefix}-${y}${m}-${seq}`;
}

// ===== Controller =====

// GET /api/deliveries/consignment?q=&page=&pageSize=
export async function list(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Math.min(Number(req.query.pageSize ?? 30), 100);
    const q = (req.query.q ?? '').toString().trim();

    const where = {
      kind: DocKind,
      docType: DocType,
      // ตัวอย่าง filter เบื้องต้น (ขยายเองได้)
      ...(q
        ? {
            OR: [
              { docNo: { contains: q } },
              { recipientName: { contains: q } }, // ถ้าคุณ snapshot ชื่อผู้รับไว้ใน Document
              { issuerName: { contains: q } },    // เช่นกัน
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { docDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: true,
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.status(200).json({ items, page, pageSize, total });
  } catch (err) {
    console.error('consignment.list error', err);
    res.status(400).json({ message: err.message });
  }
}

// POST /api/deliveries/consignment
// body: { actionType: 'SEND'|'RETURN', lineMode: 'ITEM'|'CATEGORY', fromBranchId, toPartnerId?, toBranchId?, lines: [{ productId, qty, unitPrice?, categoryId? }], note? }
export async function create(req, res) {
  try {
    const {
      actionType = 'SEND',
      lineMode = 'ITEM',
      fromBranchId,
      toPartnerId,
      toBranchId,
      lines,
      note = '',
    } = req.body || {};

    ensureLines(lines);
    const party = pickIssuerRecipientByAction(actionType, { fromBranchId, toPartnerId, toBranchId });

    // เตรียมข้อมูลสินค้า + ราคา
    const productIds = Array.from(new Set(lines.map((l) => Number(l.productId))));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, barcode: true, salePrice: true },
    });
    const pMap = new Map(products.map((p) => [p.id, p]));

    // คำนวณรายการ
    const items = lines.map((l) => {
      const pid = Number(l.productId);
      const qty = Number(l.qty);
      const product = pMap.get(pid);
      if (!product) throw new Error(`Product not found: ${pid}`);

      // ราคา:
      // ITEM: ใช้ product.salePrice เป็นค่า default (อนุญาตส่ง unitPrice มาจาก FE เพื่อ override)
      // CATEGORY: ถ้า categoryId มี อนุญาตให้ส่ง unitPrice มาด้วย หรือคุณจะไป lookup ราคาจาก mapping ที่นี่
      const price =
        l.unitPrice != null
          ? Number(l.unitPrice)
          : Number(product.salePrice || 0);

      const amount = price * qty;

      // displayName:
      // ITEM: ใช้ชื่อสินค้า
      // CATEGORY: อนุญาต override จาก FE (ถ้าคุณอยากแสดงชื่อในหมวด), ถ้าไม่ส่งมา ก็ตั้งต้นเป็นชื่อสินค้าไปก่อน
      const displayName =
        lineMode === 'CATEGORY' && l.displayName
          ? String(l.displayName)
          : product.name;

      return {
        productId: pid,
        qty,
        price,
        amount,
        categoryId: l.categoryId ?? null,
        displayName,
      };
    });

    const total = sumAmount(items);
    const docNo = await genDocNo('DLV-CN');

    const doc = await prisma.document.create({
      data: {
        kind: DocKind,
        docType: DocType,
        status: DocStatus.ISSUED,
        docNo,
        docDate: new Date(),
        total,
        issuerKind: party.issuerKind,
        issuerId: party.issuerId,
        recipientKind: party.recipientKind,
        recipientId: party.recipientId,
        note, // ถ้าสคีมาคุณไม่มี note ให้ลบออก
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ doc });
  } catch (err) {
    console.error('consignment.create error', err);
    res.status(400).json({ message: err.message });
  }
}

// GET /api/deliveries/consignment/:id
export async function get(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
      },
    });
    if (!doc || doc.docType !== DocType || doc.kind !== DocKind) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(200).json({ doc });
  } catch (err) {
    console.error('consignment.get error', err);
    res.status(400).json({ message: err.message });
  }
}

// PATCH /api/deliveries/consignment/:id/receive
// body: { items?: [{ productId, qtyReceived }] }
export async function receive(req, res) {
  try {
    const id = Number(req.params.id);
    const bodyItems = Array.isArray(req.body?.items) ? req.body.items : null;

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!doc || doc.docType !== DocType || doc.kind !== DocKind) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if ([DocStatus.SHIPPED, DocStatus.CANCELLED].includes(doc.status)) {
      return res.status(200).json({ doc, message: 'already received/cancelled' });
    }

    // ตรวจ mismatch คร่าว ๆ
    let partial = false;
    if (bodyItems) {
      const map = new Map(bodyItems.map((x) => [Number(x.productId), Number(x.qtyReceived)]));
      for (const it of doc.items) {
        const got = map.get(Number(it.productId)) ?? Number(it.qty);
        if (got !== Number(it.qty)) partial = true;
      }
    }

    // TODO: ทำสต็อก OUT/IN + บันทึก ledger ตามนโยบายของคุณ
    // แนะนำย้ายไป service: applyInventoryMove(from, -qty), applyInventoryMove(to, +qty), createStockLedger(...)
    // ในตัวอย่างนี้ขออัปเดตสถานะเอกสารอย่างเดียว
    const nextStatus = partial ? DocStatus.PARTIAL : DocStatus.SHIPPED;

    const updated = await prisma.document.update({
      where: { id },
      data: { status: nextStatus },
      include: { items: true },
    });

    res.status(200).json({ doc: updated });
  } catch (err) {
    console.error('consignment.receive error', err);
    res.status(400).json({ message: err.message });
  }
}

// GET /api/deliveries/consignment/:id/print
export async function print(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!doc || doc.docType !== DocType || doc.kind !== DocKind) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // สำหรับเริ่มต้น: ส่ง JSON กลับก่อน หรือคุณจะ render HTML/PDF ก็ได้
    // (คุณมี PrintDoc ฝั่ง client อยู่แล้ว)
    res.status(200).json({
      header: {
        docType: 'DELIVERY_CONSIGNMENT',
        docNo: doc.docNo,
        docDate: doc.docDate,
        title: 'DELIVERY',
      },
      issuer: { kind: doc.issuerKind, id: doc.issuerId },
      recipient: { kind: doc.recipientKind, id: doc.recipientId },
      lines: doc.items.map((it) => ({
        productId: it.productId,
        name: it.displayName || it.product?.name,
        barcode: it.product?.barcode,
        qty: it.qty,
        unitPrice: it.price,
        amount: it.amount,
        categoryId: it.categoryId,
      })),
      money: { grand: doc.total },
      payment: {},
    });
  } catch (err) {
    console.error('consignment.print error', err);
    res.status(400).json({ message: err.message });
  }
}
