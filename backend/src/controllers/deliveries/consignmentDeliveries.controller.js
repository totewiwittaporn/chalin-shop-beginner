// backend/src/controllers/deliveries/consignmentDeliveries.controller.js
// ใช้ prisma กลางของระบบ (กันหลายอินสแตนซ์)
import prisma from "#app/lib/prisma.js";
import { $Enums } from "@prisma/client";

/* ---------------------------------------------
 *  Constants / Enums (อิง enums.prisma)
 * ------------------------------------------- */
const DocKind = "DELIVERY";
const DocType = "DELIVERY_CONSIGNMENT";
const DocStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PARTIAL: "PARTIAL",
  SHIPPED: "SHIPPED",
  CANCELLED: "CANCELLED",
};
const PartyKind = {
  HEADQUARTERS: "HEADQUARTERS",
  BRANCH: "BRANCH",
  CONSIGNMENT: "CONSIGNMENT",
};

/* ---------------------------------------------
 *  Helpers
 * ------------------------------------------- */
function ensureLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new Error("lines is required");
  }
  const cleaned = lines.map((l) => {
    const pid = Number(l.productId);
    const qty = Number(l.qty);
    if (!pid || !Number.isFinite(qty) || qty <= 0) {
      throw new Error("invalid line (productId/qty)");
    }
    return {
      productId: pid,
      qty,
      // optional
      categoryId: l.categoryId ? Number(l.categoryId) : null,
      displayName: l.displayName ? String(l.displayName) : null,
      unitPrice: l.unitPrice != null ? Number(l.unitPrice) : null,
    };
  });
  return cleaned;
}

function pickIssuerRecipientByAction(actionType, { fromBranchId, toPartnerId, toBranchId }) {
  // SEND: สาขาหลัก → ร้านฝากขาย
  // RETURN: ร้านฝากขาย → สาขาหลัก
  if (actionType === "SEND") {
    if (!fromBranchId || !toPartnerId) throw new Error("fromBranchId/toPartnerId is required");
    return {
      issuerKind: PartyKind.BRANCH,
      issuerId: Number(fromBranchId),
      recipientKind: PartyKind.CONSIGNMENT,
      recipientId: Number(toPartnerId),
    };
  }
  if (actionType === "RETURN") {
    if (!fromBranchId || !toBranchId) throw new Error("fromBranchId/toBranchId is required");
    return {
      issuerKind: PartyKind.CONSIGNMENT,
      issuerId: Number(fromBranchId), // หมายเหตุ: บางระบบ map ร้านฝากขายกับ branch เฉพาะ
      recipientKind: PartyKind.BRANCH,
      recipientId: Number(toBranchId),
    };
  }
  throw new Error(`Unknown actionType: ${actionType}`);
}

function sumAmount(lines) {
  return lines.reduce((acc, l) => acc + Number(l.amount || 0), 0);
}

async function genDocNo(prefix = "DLV-CN") {
  // ใช้ชั่วคราว (ถ้ามี service เลขเอกสารในระบบอยู่แล้ว ค่อยสลับมาเรียกที่นี่)
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${y}${m}-${seq}`;
}

/* ---------------------------------------------
 *  Preview (NEW): POST /api/deliveries/consignment/preview
 *  Body: { partnerId, actionType: 'SEND'|'RETURN', lineMode: 'ITEM'|'CATEGORY',
 *          lines: [{ productId, qty, unitPrice?, displayName?, categoryId? }] }
 *  คืน: { rawItems, grouped, layoutUsed }
 * ------------------------------------------- */
export async function preview(req, res) {
  try {
    const partnerId = Number(req.body?.partnerId);
    const actionType = String(req.body?.actionType || "SEND").toUpperCase();
    const lineMode = String(req.body?.lineMode || "ITEM").toUpperCase();
    const lines = ensureLines(req.body?.lines || []);

    if (!partnerId) return res.status(400).json({ message: "partnerId is required" });
    if (!["SEND", "RETURN"].includes(actionType)) {
      return res.status(400).json({ message: "actionType must be SEND or RETURN" });
    }

    // ดึงข้อมูลสินค้าและราคา (ใช้ salePrice เป็นหลัก)
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, barcode: true, salePrice: true },
    });
    const pmap = new Map(products.map((p) => [p.id, p]));

    // ดึงชื่อหมวด consignment (ถ้ามี)
    const catIds = [...new Set(lines.map((l) => l.categoryId).filter(Boolean))];
    const cats = catIds.length
      ? await prisma.consignmentCategory.findMany({
          where: { id: { in: catIds } },
          select: { id: true, name: true },
        })
      : [];
    const cmap = new Map(cats.map((c) => [c.id, c.name]));

    // คำนวณ raw items (คูณราคา/รวมยอด)
    const rawItems = lines.map((l) => {
      const p = pmap.get(l.productId);
      const price = l.unitPrice != null ? Number(l.unitPrice) : Number(p?.salePrice || 0);
      const amount = price * l.qty;
      return {
        productId: l.productId,
        sku: p?.barcode || "",
        name: l.displayName || p?.name || "",
        qty: l.qty,
        unitPrice: price,
        amount,
        categoryId: l.categoryId || null,
        categoryName: l.categoryId ? cmap.get(l.categoryId) || "" : "",
      };
    });

    // จัดกลุ่มตาม lineMode ที่ส่งมา (ค่าเริ่มต้นใช้ config ของ partner ก็ได้ ถ้ามี)
    let grouped = [];
    let layoutUsed = lineMode;
    if (lineMode === "CATEGORY") {
      const by = new Map();
      for (const r of rawItems) {
        const key = r.categoryName || "(ไม่จัดหมวด)";
        if (!by.has(key)) by.set(key, { groupKey: key, totalQty: 0, lines: [] });
        const b = by.get(key);
        b.totalQty += r.qty;
        b.lines.push({ sku: r.sku, name: r.name, qty: r.qty });
      }
      grouped = Array.from(by.values());
    } else {
      // ITEM
      grouped = rawItems.map((r) => ({
        sku: r.sku,
        name: r.name,
        category: r.categoryName || "(ไม่จัดหมวด)",
        qty: r.qty,
        unitPrice: r.unitPrice,
        amount: r.amount,
      }));
    }

    res.json({ rawItems, grouped, layoutUsed });
  } catch (err) {
    console.error("consignment.preview error", err);
    res.status(400).json({ message: err.message });
  }
}

/* ---------------------------------------------
 *  List: GET /api/deliveries/consignment
 * ------------------------------------------- */
export async function list(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Math.min(Number(req.query.pageSize ?? 30), 100);
    const q = (req.query.q ?? "").toString().trim();

    const where = {
      kind: DocKind,
      docType: DocType,
      ...(q
        ? {
            OR: [
              { docNo: { contains: q, mode: "insensitive" } },
              { recipientName: { contains: q, mode: "insensitive" } },
              { issuerName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              qty: true,
              price: true,
              amount: true,
              displayName: true,
              categoryId: true,
              product: { select: { name: true, barcode: true } },
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return res.json({ page, pageSize, total, items });
  } catch (err) {
    console.error("consignment.list error", err);
    res.status(400).json({ message: err.message });
  }
}

/* ---------------------------------------------
 *  Create: POST /api/deliveries/consignment
 *  Body: { actionType: 'SEND'|'RETURN', fromBranchId?, toBranchId?, toPartnerId?,
 *          lineMode: 'ITEM'|'CATEGORY',
 *          lines: [{ productId, qty, unitPrice?, displayName?, categoryId? }] }
 * ------------------------------------------- */
export async function create(req, res) {
  try {
    const user = req.user || {};
    const roleSet = new Set((user.roles || []).map((r) => String(r).toUpperCase()));

    const actionType = String(req.body?.actionType || "SEND").toUpperCase();
    const fromBranchId = req.body?.fromBranchId ? Number(req.body.fromBranchId) : null;
    const toBranchId = req.body?.toBranchId ? Number(req.body.toBranchId) : null;
    const toPartnerId = req.body?.toPartnerId ? Number(req.body.toPartnerId) : null;
    const lineMode = String(req.body?.lineMode || "ITEM").toUpperCase();
    const lines = ensureLines(req.body?.lines || []);

    // สิทธิ์พื้นฐาน:
    if (actionType === "SEND") {
      // ADMIN/STAFF เท่านั้น
      if (!(roleSet.has("ADMIN") || roleSet.has("STAFF"))) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (actionType === "RETURN") {
      // ฝั่งร้านฝากขาย
      if (!(roleSet.has("CONSIGNMENT") || roleSet.has("ADMIN"))) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const party = pickIssuerRecipientByAction(actionType, {
      fromBranchId,
      toPartnerId,
      toBranchId,
    });

    // เตรียมข้อมูลสินค้า + ราคา
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, barcode: true, salePrice: true },
    });
    const pmap = new Map(products.map((p) => [p.id, p]));

    // สร้างรายการบรรทัด + จำนวนเงิน
    const items = lines.map((l) => {
      const product = pmap.get(l.productId);
      const qty = Number(l.qty);
      const price = l.unitPrice != null ? Number(l.unitPrice) : Number(product?.salePrice || 0);
      const amount = price * qty;

      const displayName =
        lineMode === "CATEGORY" && l.displayName ? String(l.displayName) : product?.name;

      return {
        productId: l.productId,
        qty,
        price,
        amount,
        categoryId: l.categoryId ?? null,
        displayName,
      };
    });

    const total = sumAmount(items);
    const docNo = await genDocNo("DLV-CN");

    // บันทึกเอกสาร
    const created = await prisma.document.create({
      data: {
        kind: DocKind,
        docType: DocType,
        status: DocStatus.ISSUED,
        docNo,
        docDate: new Date(),

        issuerKind: party.issuerKind,
        issuerId: party.issuerId,
        recipientKind: party.recipientKind,
        recipientId: party.recipientId,

        // snapshot ชื่อผู้เกี่ยวข้อง
        issuerName: null,
        recipientName: null,

        total,
        note: req.body?.note || null,

        // กรณีฝั่งบริษัทส่ง → ผูก branchId = สาขาต้นทาง
        branchId: party.issuerKind === PartyKind.BRANCH ? party.issuerId : null,
        consignmentPartnerId:
          party.issuerKind === PartyKind.CONSIGNMENT
            ? party.issuerId
            : party.recipientKind === PartyKind.CONSIGNMENT
            ? party.recipientId
            : null,

        items: { create: items },
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            qty: true,
            price: true,
            amount: true,
            displayName: true,
            categoryId: true,
            product: { select: { name: true, barcode: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    // TODO: ทำ stock move + ledger ตามโฟลว์ธุรกิจ (MAIN↔CONSIGNMENT)
    // ปัจจุบัน Branch delivery มีตัวอย่างใน branchDeliveries.controller.js (applyInventoryMove ฯลฯ)

    return res.status(201).json(created);
  } catch (err) {
    console.error("consignment.create error", err);
    res.status(400).json({ message: err.message });
  }
}

/* ---------------------------------------------
 *  Get: GET /api/deliveries/consignment/:id
 * ------------------------------------------- */
export async function get(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, category: true } },
      },
    });
    if (!doc || doc.docType !== DocType || doc.kind !== DocKind) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.json(doc);
  } catch (err) {
    console.error("consignment.get error", err);
    res.status(400).json({ message: err.message });
  }
}

/* ---------------------------------------------
 *  Receive (optional): PATCH /api/deliveries/consignment/:id/receive
 * ------------------------------------------- */
export async function receive(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.docType !== DocType || doc.kind !== DocKind) {
      return res.status(404).json({ message: "Document not found" });
    }
    // ตัวอย่าง: เปลี่ยนสถานะ → SHIPPED
    const updated = await prisma.document.update({
      where: { id },
      data: { status: DocStatus.SHIPPED },
    });
    return res.json(updated);
  } catch (err) {
    console.error("consignment.receive error", err);
    res.status(400).json({ message: err.message });
  }
}

/* ---------------------------------------------
 *  Print JSON (draft): GET /api/deliveries/consignment/:id/print
 * ------------------------------------------- */
export async function print(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, category: true } },
      },
    });
    if (!doc || doc.docType !== DocType || doc.kind !== DocKind) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({
      header: {
        docType: "DELIVERY_CONSIGNMENT",
        docNo: doc.docNo,
        docDate: doc.docDate,
        title: "DELIVERY",
      },
      issuer: { kind: doc.issuerKind, id: doc.issuerId },
      recipient: { kind: doc.recipientKind, id: doc.recipientId },
      lines: doc.items.map((it) => ({
        productId: it.productId,
        name: it.displayName || it.product?.name,
        barcode: it.product?.barcode,
        qty: Number(it.qty),
        unitPrice: Number(it.price),
        amount: Number(it.amount),
        categoryId: it.categoryId,
        categoryName: it.category?.name || null,
      })),
      money: { grand: Number(doc.total) },
      payment: {},
    });
  } catch (err) {
    console.error("consignment.print error", err);
    res.status(400).json({ message: err.message });
  }
}
