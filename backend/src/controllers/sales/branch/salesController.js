// backend/src/controllers/sales/branch/salesController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// helpers
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * POST /api/sales/branch
 * Payload จาก POS:
 * {
 *   header: { branchId, docDate?, note? },
 *   lines: [{ productId, name, qty, price, discount? }],
 *   totals: { subTotal, discountBill, grandTotal },
 *   payment: { method, receive?, evidenceUrl? } // method: CASH|TRANSFER|CARD
 * }
 */
export async function createOrPaySaleBranch(req, res) {
  try {
    const p = req.body || {};
    const header = p.header || {};
    const lines  = Array.isArray(p.lines) ? p.lines : [];
    const totals = p.totals || {};
    const pay    = p.payment || null;

    const branchId = num(header.branchId ?? req.branchId);
    if (!branchId) return res.status(400).json({ message: "branchId is required" });
    if (lines.length === 0) return res.status(400).json({ message: "lines is required" });

    // map รายการให้ตรง schema: snapshot ชื่อไว้ใน productName
    const cleanLines = lines.map((it) => ({
      productId   : num(it.productId),
      productName : String(it.name ?? ""),
      qty         : num(it.qty),
      unitPrice   : num(it.price),
      discount    : num(it.discount),
    }));

    // คำนวณซ้ำฝั่ง server
    const subTotalFromLines = cleanLines.reduce((s, x) => s + x.unitPrice * x.qty, 0);
    const discountFromLines = cleanLines.reduce((s, x) => s + x.discount, 0);
    const billDiscount      = num(totals?.discountBill);
    const subtotal          = subTotalFromLines;
    const discount          = discountFromLines + billDiscount;
    const total             = Math.max(0, subtotal - discount);

    // เก็บเป็น date-only (UTC midnight)
    const docDate = header?.docDate ? new Date(header.docDate) : new Date(todayISO());
    const status  = "PAID";

    const result = await prisma.$transaction(async (tx) => {
      // 1) ตรวจสต็อกสาขา
      for (const ln of cleanLines) {
        const inv = await tx.inventory.findFirst({
          where: { branchId, productId: ln.productId },
          select: { id: true, qty: true },
        });
        const current = num(inv?.qty);
        if (ln.qty > current) {
          throw new Error(
            `สินค้า productId=${ln.productId} สต็อกไม่พอในสาขา ${branchId} : ต้องการ ${ln.qty} แต่มี ${current}`
          );
        }
      }

      // 2) สร้างเอกสารขาย + รายการ + ชำระเงิน
      const sale = await tx.sale.create({
        data: {
          branchId,
          date    : new Date(docDate.toISOString().slice(0, 10)), // date-only
          note    : header?.note ?? null,
          status,
          subtotal,
          discount,
          total,
          items: {
            create: cleanLines.map((x) => ({
              productId   : x.productId,
              productName : x.productName,
              qty         : x.qty,
              unitPrice   : x.unitPrice,
              lineTotal   : x.unitPrice * x.qty - x.discount,
            })),
          },
          payments: pay
            ? {
                create: [
                  {
                    method     : pay.method || "CASH", // CASH | TRANSFER | CARD
                    amount     : num(pay.receive ?? total),
                    evidenceUrl: pay.evidenceUrl ?? null,
                  },
                ],
              }
            : undefined,
        },
        include: { items: true, payments: true },
      });

      // 3) ตัดสต็อกสาขา
      for (const x of cleanLines) {
        await tx.inventory.updateMany({
          where: { branchId, productId: x.productId },
          data : { qty: { decrement: x.qty } },
        });
      }

      return sale;
    });

    return res.status(201).json({ message: "บันทึกการขายสำเร็จ", sale: result });
  } catch (e) {
    console.error("createOrPaySaleBranch error:", e);
    return res.status(500).json({
      message: "CREATE_SALE_FAILED",
      detail : String(e?.message || e),
    });
  }
}

/**
 * GET /api/sales/branch
 * Query: page, pageSize, branchId?, q?
 */
export async function listSalesBranch(req, res) {
  try {
    const { q, page = 1, pageSize = 20, branchId } = req.query || {};
    const take = Math.min(100, Number(pageSize) || 20);
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const where = {};
    if (branchId) where.branchId = Number(branchId);
    if (q) {
      where.OR = [
        { note:  { contains: q, mode: "insensitive" } },
        // ถ้ามี code/docNo ค่อยเพิ่มที่นี่
      ];
    }

    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { id: "desc" },
        take,
        skip,
        include: {
          // include อื่น ๆ ตามต้องการ เช่น items: true, payments: true
        },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ items, total });
  } catch (e) {
    console.error("listSalesBranch error:", e);
    res.status(500).json({ message: "LIST_SALE_FAILED", detail: String(e?.message || e) });
  }
}
