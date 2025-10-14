// backend/src/controllers/transfers/transfersController.js
import pkg from "@prisma/client";
const { PrismaClient, Prisma } = pkg;
const prisma = new PrismaClient();

// ชื่อตรงกับ enums.prisma ของคุณ
const LEDGER_IN = "TRANSFER_IN";
const LEDGER_OUT = "TRANSFER_OUT";

function parseIntOr(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

// GET /api/transfers?q=&status=&page=&pageSize=
export async function listTransfers(req, res) {
  try {
    const { q = "", status, page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.transfer.findMany({
        where,
        orderBy: { id: "desc" },
        include: {
          fromBranch: true,
          toBranch: true,
          toConsignmentPartner: true,
        },
        skip,
        take,
      }),
      prisma.transfer.count({ where }),
    ]);

    res.json({ items, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

// GET /api/transfers/:id
export async function getTransfer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const doc = await prisma.transfer.findUnique({
      where: { id },
      include: {
        lines: true,
        fromBranch: true,
        toBranch: true,
        toConsignmentPartner: true,
      },
    });
    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

// POST /api/transfers
// payload: { fromBranchId, toBranchId?, toConsignmentPartnerId?, notes, items: [{productId, qty}] }
export async function createTransfer(req, res) {
  try {
    const { fromBranchId, toBranchId, toConsignmentPartnerId, notes, items } = req.body;
    if (!fromBranchId) return res.status(400).json({ message: "fromBranchId is required" });
    if ((!toBranchId && !toConsignmentPartnerId) || (toBranchId && toConsignmentPartnerId)) {
      return res.status(400).json({ message: "must specify either toBranchId or toConsignmentPartnerId" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items required" });
    }

    const doc = await prisma.transfer.create({
      data: {
        date: new Date(),
        fromBranchId: parseIntOr(fromBranchId),
        toBranchId: toBranchId ? parseIntOr(toBranchId) : null,
        toConsignmentPartnerId: toConsignmentPartnerId ? parseIntOr(toConsignmentPartnerId) : null,
        notes: notes || "",
        status: "DRAFT",
        lines: {
          create: items.map((it) => ({
            productId: parseIntOr(it.productId),
            qty: parseIntOr(it.qty, 0),
          })),
        },
      },
      include: { lines: true },
    });

    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

// PUT /api/transfers/:id  (แก้ได้เฉพาะ DRAFT)
export async function updateTransfer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { notes, items } = req.body;

    const existing = await prisma.transfer.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) return res.status(404).json({ message: "not found" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ message: "only DRAFT can be updated" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.transferLine.deleteMany({ where: { transferId: id } });
      const doc = await tx.transfer.update({
        where: { id },
        data: {
          notes: notes ?? existing.notes,
          lines: {
            create: (Array.isArray(items) ? items : existing.lines).map((it) => ({
              productId: parseIntOr(it.productId),
              qty: parseIntOr(it.qty, 0),
            })),
          },
        },
        include: { lines: true },
      });
      return doc;
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

// POST /api/transfers/:id/send  (DRAFT -> SENT)
// **รุ่นนี้จะตัดสต็อก “ออกจากต้นทาง” ทันที**
export async function sendTransfer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.transfer.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) return res.status(404).json({ message: "not found" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ message: "only DRAFT can be sent" });
    }
    if (!existing.lines?.length) {
      return res.status(400).json({ message: "cannot send with no lines" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1) OUT จากต้นทาง (แสดงว่าสินค้าถูกส่งออกแล้ว)
      const outRows = existing.lines.map((l) => ({
        productId: l.productId,
        branchId: existing.fromBranchId,
        qty: -Math.abs(l.qty), // ออก = ติดลบ
        type: LEDGER_OUT,      // TRANSFER_OUT
        refTable: "Transfer",
        refId: existing.id,
        unitCost: new Prisma.Decimal(0),
      }));
      if (outRows.length) await tx.stockLedger.createMany({ data: outRows });

      // 2) เปลี่ยนสถานะเอกสารเป็น SENT
      const doc = await tx.transfer.update({
        where: { id: existing.id },
        data: { status: "SENT", sentAt: new Date() },
        include: { lines: true },
      });

      return doc;
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

// POST /api/transfers/:id/receive  (SENT -> RECEIVED)
// **รุ่นนี้จะ “รับเข้า” ที่ปลายทางเท่านั้น** (เพราะ OUT ทำไปตอนส่งแล้ว)
export async function receiveTransfer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.transfer.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) return res.status(404).json({ message: "not found" });
    if (existing.status !== "SENT") {
      return res.status(400).json({ message: "only SENT can be received" });
    }

    const isToBranch = !!existing.toBranchId;
    const isToConsignment = !!existing.toConsignmentPartnerId;

    const result = await prisma.$transaction(async (tx) => {
      // 1) เขียน movement เข้า “ปลายทาง”
      if (isToBranch) {
        const inRows = existing.lines.map((l) => ({
          productId: l.productId,
          branchId: existing.toBranchId,
          qty: Math.abs(l.qty), // เข้า = บวก
          type: LEDGER_IN,      // TRANSFER_IN
          refTable: "Transfer",
          refId: existing.id,
          unitCost: new Prisma.Decimal(0),
        }));
        if (inRows.length) await tx.stockLedger.createMany({ data: inRows });
      } else if (isToConsignment) {
        const inRows = existing.lines.map((l) => ({
          productId: l.productId,
          consignmentPartnerId: existing.toConsignmentPartnerId,
          qty: Math.abs(l.qty),
          type: LEDGER_IN,      // TRANSFER_IN (ฝั่งฝากขาย)
          refTable: "Transfer",
          refId: existing.id,
          unitCost: new Prisma.Decimal(0),
        }));
        if (inRows.length) await tx.stockLedger.createMany({ data: inRows });
      }

      // 2) ปิดเอกสาร
      const updated = await tx.transfer.update({
        where: { id: existing.id },
        data: { status: "RECEIVED", receivedAt: new Date() },
        include: { lines: true },
      });

      return updated;
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}
