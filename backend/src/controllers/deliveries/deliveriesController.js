import prisma from "#app/lib/prisma.js";
import { getMainBranchId } from "#app/lib/mainBranch.js";

/**
 * สร้างเอกสาร Delivery ระหว่างสาขา
 * body: { recipientBranchId: number, note?: string, items: [{ productId: number, qty: number }] }
 * เอกสารที่ได้: Document.kind = "DELIVERY"
 * - issuer = BRANCH ของผู้ใช้ (req.user.branchId)
 * - recipient = BRANCH = recipientBranchId
 * - lineTotal คิดจาก product.basePrice * qty (ถ้าไม่มี basePrice จะถือเป็น 0)
 */
export async function createDelivery(req, res, next) {
  try {
    const user = req.user;
    if (!user?.branchId) return res.status(400).json({ message: "ผู้ใช้งานไม่มี branchId" });

    const { recipientBranchId, note, items } = req.body || {};
    if (!recipientBranchId) return res.status(400).json({ message: "กรุณาระบุ recipientBranchId" });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items ว่าง" });
    }

    // ดึงราคาตั้งต้นของสินค้าเพื่อคำนวณยอด
    const productIds = [...new Set(items.map(i => Number(i.productId)))].filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, basePrice: true },
    });
    const priceMap = new Map(products.map(p => [p.id, Number(p.basePrice || 0)]));

    // เตรียมรายการ
    let total = 0;
    const lines = items.map((it) => {
      const qty = Number(it.qty || 0);
      const price = priceMap.get(Number(it.productId)) ?? 0;
      const lineTotal = price * qty;
      total += lineTotal;
      return {
        productId: Number(it.productId),
        qty,
        price,
        lineTotal,
      };
    });

    const doc = await prisma.document.create({
      data: {
        kind: "DELIVERY",
        status: "ISSUED",                 // เริ่มต้นเป็นออกเอกสารแล้ว
        issuerKind: "BRANCH",
        issuerId: Number(user.branchId),  // สาขาต้นทาง = branch ของผู้ใช้
        recipientKind: "BRANCH",
        recipientId: Number(recipientBranchId),
        docNo: null,                      // จะไปจัด format running number ภายหลัง
        docDate: new Date(),
        note: note || null,

        branchId: Number(user.branchId),  // ผูก branchId ให้ตรงสาขาต้นทาง
        total,

        items: {
          create: lines.map(l => ({
            productId: l.productId,
            qty: l.qty,
            price: l.price,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: {
        items: { select: { id: true, productId: true, qty: true, price: true, lineTotal: true } },
      },
    });

    return res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

/**
 * รายการ Delivery ล่าสุด (ดูได้ตามสิทธิ์)
 * query: { limit?: number, mine?: "issuer" | "recipient" }
 * - ADMIN/STAFF: เห็นทั้งหมด ถ้าไม่ส่ง mine
 * - STAFF (มี branchId): ตั้งค่า mine=issuer เป็นค่าเริ่มต้น (สาขาตัวเองเป็นผู้ส่ง)
 */
export async function listDeliveries(req, res, next) {
  try {
    const { limit = 20, mine } = req.query;
    const user = req.user;

    const where = { kind: "DELIVERY" };

    // จำกัดตาม branch ของผู้ใช้ถ้าเป็น STAFF
    if (user?.role === "STAFF" && user?.branchId) {
      if (mine === "recipient") {
        where.recipientKind = "BRANCH";
        where.recipientId = Number(user.branchId);
      } else {
        // default: issuer = branch ของตัวเอง
        where.issuerKind = "BRANCH";
        where.issuerId = Number(user.branchId);
      }
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: { docDate: "desc" },
      take: Math.min(Number(limit) || 20, 100),
      include: {
        items: { select: { id: true, qty: true } },
      },
    });

    res.json(docs);
  } catch (e) {
    next(e);
  }
}

/**
 * อ่านเอกสารตาม id
 */
export async function getDelivery(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "invalid id" });

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true, productId: true, qty: true, price: true, lineTotal: true, product: { select: { name: true, barcode: true } } },
        },
      },
    });
    if (!doc || doc.kind !== "DELIVERY") return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}
