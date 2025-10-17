// backend/src/controllers/deliveries/deliveriesController.js
import prisma from "#app/lib/prisma.js";
import { $Enums } from "@prisma/client";

/* ----------------------------------------------------------------------------
 *  Helpers
 * ------------------------------------------------------------------------- */

/** ปรับสต็อกแบบ upsert ตาม (branchId, productId) + กันสต็อกติดลบที่ต้นทาง */
async function applyInventoryMove(tx, { branchId, productId, delta }) {
  const current = await tx.inventory.findUnique({
    where: { branchId_productId: { branchId, productId } },
    select: { id: true, qty: true },
  });

  if (!current) {
    const start = 0 + Number(delta || 0);
    if (start < 0) {
      throw new Error(
        `Insufficient stock at branch ${branchId} for product ${productId} (would go negative).`
      );
    }
    await tx.inventory.create({ data: { branchId, productId, qty: start } });
    return;
  }

  const next = Number(current.qty || 0) + Number(delta || 0);
  if (next < 0) {
    throw new Error(
      `Insufficient stock at branch ${branchId} for product ${productId} (would go negative).`
    );
  }

  await tx.inventory.update({
    where: { id: current.id },
    data: { qty: next },
  });
}

/** เลือก enum สำหรับ StockLedger.type (OUT/IN) จาก $Enums.StockLedgerType ที่มีจริง */
function pickLedgerTypes() {
  const available = Object.values($Enums.StockLedgerType || {});
  const outCandidates = ["DELIVERY_OUT", "TRANSFER_OUT", "MOVE_OUT", "ISSUE", "OUT", "SHIP_OUT"];
  const inCandidates = ["DELIVERY_IN", "TRANSFER_IN", "MOVE_IN", "RECEIPT", "IN", "SHIP_IN"];

  const outType = outCandidates.find((c) => available.includes(c));
  const inType = inCandidates.find((c) => available.includes(c));

  if (!outType || !inType) {
    const msg = `No matching StockLedgerType for delivery mapping. Available: ${
      available.join(", ") || "(none)"
    }`;
    throw new Error(msg);
  }
  return { outType, inType };
}

/* ----------------------------------------------------------------------------
 *  Create Delivery
 * ------------------------------------------------------------------------- */
/**
 * POST /api/deliveries
 * body: {
 *   recipientBranchId: number,
 *   issuerBranchId?: number,
 *   items: [{ productId: number, qty: number }]
 * }
 *
 * นโยบายราคาใบส่งสินค้า (Delivery): ใช้ "ราคาขาย" (salePrice)
 */
export async function createDelivery(req, res, next) {
  try {
    const user = req.user;
    if (!user?.branchId) return res.status(400).json({ message: "ผู้ใช้งานไม่มี branchId" });

    const { recipientBranchId, issuerBranchId, items } = req.body || {};
    const issuerId = Number(issuerBranchId || user.branchId);
    const recipientId = Number(recipientBranchId);

    if (!recipientId) return res.status(400).json({ message: "กรุณาระบุ recipientBranchId" });
    if (issuerId === recipientId)
      return res.status(400).json({ message: "ต้นทางและปลายทางต้องไม่เป็นสาขาเดียวกัน" });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items ว่าง" });
    }

    const productIds = [...new Set(items.map((i) => Number(i.productId)))].filter(Boolean);
    if (productIds.length === 0)
      return res.status(400).json({ message: "ไม่พบ productId ที่ถูกต้องใน items" });

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, salePrice: true },
    });

    const priceMap = new Map(products.map((p) => [p.id, Number(p.salePrice || 0)]));

    let total = 0;
    const lines = items.map((it) => {
      const qty = Number(it.qty || 0);
      const pid = Number(it.productId);
      const price = priceMap.get(pid) ?? 0;
      const amount = price * qty;
      total += amount;
      return { productId: pid, qty, price, amount };
    });

    // 1) สร้างเอกสารก่อน (docNo = null)
    const created = await prisma.document.create({
      data: {
        kind: "DELIVERY",
        status: "ISSUED",
        issuerKind: "BRANCH",
        issuerId,
        recipientKind: "BRANCH",
        recipientId,
        docNo: null,
        docDate: new Date(),
        branchId: issuerId,
        total,
        items: { create: lines },
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            qty: true,
            price: true,
            amount: true,
            product: { select: { name: true, barcode: true } },
          },
        },
      },
    });

    // 2) ออกรูปแบบเลขเอกสาร DL-YYMM-xxxxxx
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const docNo = `DL-${yy}${mm}-${String(created.id).padStart(6, "0")}`;

    const doc = await prisma.document.update({
      where: { id: created.id },
      data: { docNo },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            qty: true,
            price: true,
            amount: true,
            product: { select: { name: true, barcode: true } },
          },
        },
      },
    });

    return res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

/* ----------------------------------------------------------------------------
 *  List Deliveries
 * ------------------------------------------------------------------------- */
/**
 * GET /api/deliveries
 * query: { limit?: number, mine?: "issuer" | "recipient" }
 */
export async function listDeliveries(req, res, next) {
  try {
    const { limit = 20, mine } = req.query;
    const user = req.user;

    const where = { kind: "DELIVERY" };
    if (user?.role === "STAFF" && user?.branchId) {
      if (mine === "recipient") {
        where.recipientKind = "BRANCH";
        where.recipientId = Number(user.branchId);
      } else {
        where.issuerKind = "BRANCH";
        where.issuerId = Number(user.branchId);
      }
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: { docDate: "desc" },
      take: Math.min(Number(limit) || 20, 100),
      include: { items: { select: { id: true, qty: true } } },
    });

    res.json(docs);
  } catch (e) {
    next(e);
  }
}

/* ----------------------------------------------------------------------------
 *  Get Delivery
 * ------------------------------------------------------------------------- */
/**
 * GET /api/deliveries/:id
 */
export async function getDelivery(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "invalid id" });

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            qty: true,
            price: true,
            amount: true,
            product: { select: { name: true, barcode: true } },
          },
        },
      },
    });

    if (!doc || doc.kind !== "DELIVERY") return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

/* ----------------------------------------------------------------------------
 *  Receive Delivery (Stock movements + Ledger + Status)
 * ------------------------------------------------------------------------- */
/**
 * PATCH /api/deliveries/:id/receive
 */
export async function receiveDelivery(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = req.user;
    if (!id) return res.status(400).json({ message: "invalid id" });

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!doc || doc.kind !== "DELIVERY") return res.status(404).json({ message: "Not found" });

    // STAFF ต้องเป็นปลายทาง
    if (user?.role === "STAFF") {
      if (
        !user?.branchId ||
        doc.recipientKind !== "BRANCH" ||
        Number(doc.recipientId) !== Number(user.branchId)
      ) {
        return res.status(403).json({ message: "no permission to receive" });
      }
    }

    const doneStatuses = new Set(["SHIPPED", "CANCELLED"]);
    if (doneStatuses.has(doc.status)) {
      return res.json({ ...doc, _info: "Already closed. No stock movement applied twice." });
    }

    const clientItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const hasMismatch =
      clientItems.length > 0 &&
      clientItems.some((ci) => {
        const di = doc.items.find((x) => x.id === Number(ci.id));
        return !di || Number(ci.qtyReceived) !== Number(di.qty);
      });

    let srcBranchId = null;
    let dstBranchId = null;
    if (doc.issuerKind === "BRANCH") srcBranchId = Number(doc.issuerId);
    if (doc.recipientKind === "BRANCH") dstBranchId = Number(doc.recipientId);
    if (!srcBranchId || !dstBranchId) {
      return res.status(400).json({ message: "issuer/recipient is not a BRANCH document." });
    }

    const nextStatus = hasMismatch ? "PARTIAL" : "SHIPPED";
    const { outType, inType } = pickLedgerTypes();

    const updated = await prisma.$transaction(async (tx) => {
      for (const it of doc.items) {
        const qty = Number(it.qty || 0);
        const pid = Number(it.productId);
        if (!qty || !pid) continue;

        await applyInventoryMove(tx, { branchId: srcBranchId, productId: pid, delta: -qty });
        await tx.stockLedger.create({
          data: {
            branchId: srcBranchId,
            productId: pid,
            refTable: "Document",
            refId: doc.id,
            qty: -qty,
            type: outType,
          },
        });

        await applyInventoryMove(tx, { branchId: dstBranchId, productId: pid, delta: +qty });
        await tx.stockLedger.create({
          data: {
            branchId: dstBranchId,
            productId: pid,
            refTable: "Document",
            refId: doc.id,
            qty: +qty,
            type: inType,
          },
        });
      }

      const up = await tx.document.update({
        where: { id: doc.id },
        data: {
          status: nextStatus,
        },
        include: { items: true },
      });

      return up;
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
}

/* ----------------------------------------------------------------------------
 *  Print Delivery (HTML / PDF A4)
 * ------------------------------------------------------------------------- */
/**
 * GET /api/print/delivery/:id?size=a4&format=pdf
 * - size:   a4 | letter (default a4)
 * - format: pdf → เรนเดอร์เป็น PDF ด้วย puppeteer, ไม่ใส่ → ส่ง HTML
 */
export async function printDelivery(req, res, next) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).send("invalid id");

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            qty: true,
            price: true,
            amount: true,
            product: { select: { name: true, barcode: true } },
          },
        },
      },
    });
    if (!doc || doc.kind !== "DELIVERY") return res.status(404).send("ไม่พบเอกสาร");

    // load branches (issuer/recipient) → ใช้ addressLine1/2/3
    const [issuer, recipient] = await Promise.all([
      doc.issuerKind === "BRANCH" && doc.issuerId
        ? prisma.branch.findUnique({
            where: { id: Number(doc.issuerId) },
            select: {
              id: true,
              code: true,
              name: true,
              phone: true,
              addressLine1: true,
              addressLine2: true,
              addressLine3: true,
            },
          })
        : null,
      doc.recipientKind === "BRANCH" && doc.recipientId
        ? prisma.branch.findUnique({
            where: { id: Number(doc.recipientId) },
            select: {
              id: true,
              code: true,
              name: true,
              phone: true,
              addressLine1: true,
              addressLine2: true,
              addressLine3: true,
            },
          })
        : null,
    ]);

    // render HTML
    const html = renderDeliveryHTML({ doc, issuer, recipient });

    const fmt = String(req.query.format || "").toLowerCase();
    const size =
      String(req.query.size || "a4").toLowerCase() === "letter" ? "letter" : "a4";

    // PDF mode (server-side)
    if (fmt === "pdf") {
      let puppeteer;
      try {
        puppeteer = (await import("puppeteer")).default;
      } catch {
        // fallback: ส่ง HTML พร้อมแนะนำวิธีการ
        return res
          .status(501)
          .send(
            `<pre style="font-family:ui-monospace,monospace">puppeteer ยังไม่ได้ติดตั้ง\n\nติดตั้งด้วย: npm i puppeteer\n\nจากนั้นเรียกใหม่พร้อม ?format=pdf</pre>${html}`
          );
      }

      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--font-render-hinting=none"],
      });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({
          format: size === "a4" ? "A4" : "Letter",
          printBackground: true,
          margin: { top: "14mm", right: "12mm", bottom: "16mm", left: "12mm" },
          preferCSSPageSize: false,
        });

        const fname = `Delivery-${doc.docNo || doc.id}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${fname}"`);
        return res.send(pdf);
      } finally {
        await browser.close();
      }
    }

    // HTML preview mode
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (e) {
    next(e);
  }
}

/** HTML template (A4 friendly, Thai fonts-safe, no external assets) */
function renderDeliveryHTML({ doc, issuer, recipient }) {
  const thDate = (d) =>
    d ? new Date(d).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-";

  const money = (n) =>
    (Number(n) || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatAddress = (b) =>
    !b ? "" : [b.addressLine1, b.addressLine2, b.addressLine3].filter(Boolean).join(" ");

  const rows = (doc.items || [])
    .map((it, idx) => {
      const lineTotal = Number(it.amount || 0);
      return (
        "<tr>" +
        '<td class="text-center">' +
        (idx + 1) +
        "</td>" +
        "<td>" +
        escapeHTML(it.product?.name || "#" + it.productId) +
        "</td>" +
        '<td class="text-center">' +
        escapeHTML(it.product?.barcode || "-") +
        "</td>" +
        '<td class="num">' +
        Number(it.qty || 0) +
        "</td>" +
        '<td class="num">' +
        money(it.price) +
        "</td>" +
        '<td class="num">' +
        money(lineTotal) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  const total = money(doc.total);
  const docNoText = escapeHTML(doc.docNo || "#" + doc.id);
  const issuerName = issuer?.code ? escapeHTML(issuer.code + " — " + issuer.name) : "-";
  const recipientName = recipient?.code ? escapeHTML(recipient.code + " — " + recipient.name) : "-";
  const issuerAddr = issuer
    ? '<div class="muted">' + escapeHTML(formatAddress(issuer)) + "</div>"
    : "";
  const recipientAddr = recipient
    ? '<div class="muted">' + escapeHTML(formatAddress(recipient)) + "</div>"
    : "";
  const issuerPhone = issuer?.phone
    ? '<div class="muted">โทร: ' + escapeHTML(issuer.phone) + "</div>"
    : "";
  const recipientPhone = recipient?.phone
    ? '<div class="muted">โทร: ' + escapeHTML(recipient.phone) + "</div>"
    : "";

  return (
    "<!doctype html>\n" +
    '<html lang="th">\n' +
    "<head>\n" +
    '<meta charset="utf-8"/>\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>\n' +
    "<title>ใบส่งสินค้า " +
    docNoText +
    "</title>\n" +
    "<style>\n" +
    "  @page { size: A4; margin: 14mm 12mm 16mm; }\n" +
    "  body { font-family: system-ui, -apple-system, 'Segoe UI', 'Noto Sans Thai', 'Tahoma', sans-serif; color:#0b1220; }\n" +
    "  .wrap { max-width: 900px; margin: 0 auto; }\n" +
    "  .header { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; }\n" +
    "  .badge { font-weight:600; padding:6px 10px; border-radius:10px; background: #eaf0ff; color:#334155; display:inline-block; }\n" +
    "  h1 { margin:8px 0 4px; font-size:24px; }\n" +
    "  .meta { font-size:14px; color:#334155; line-height:1.35; }\n" +
    "  .panel { border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; background:#fff; }\n" +
    "  table { width:100%; border-collapse:collapse; margin-top:14px; }\n" +
    "  th, td { border-bottom:1px solid #e5e7eb; padding:10px 8px; vertical-align:top; }\n" +
    "  thead th { background:#f8fafc; text-align:left; font-weight:600; }\n" +
    '  .text-center { text-align:center; }\n' +
    '  .num { text-align:right; white-space:nowrap; }\n' +
    "  .totals { margin-top:10px; display:flex; justify-content:flex-end; }\n" +
    "  .totals .box { min-width:320px; }\n" +
    "  .muted { color:#64748b; }\n" +
    "  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }\n" +
    "  .foot { margin-top:22px; font-size:12px; color:#475569; display:flex; justify-content:space-between; }\n" +
    "  .signs { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:28px; }\n" +
    "  .sign { height:90px; border-top:1px dashed #cbd5e1; text-align:center; padding-top:8px; color:#475569; }\n" +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    '  <div class="wrap">\n' +
    '    <div class="header">\n' +
    "      <div>\n" +
    '        <span class="badge">ใบส่งสินค้า (Delivery)</span>\n' +
    "        <h1>เลขที่: " +
    docNoText +
    "</h1>\n" +
    '        <div class="meta">\n' +
    "          วันที่เอกสาร: " +
    thDate(doc.docDate) +
    "<br/>\n" +
    "          สถานะ: " +
    escapeHTML(doc.status) +
    "\n" +
    "        </div>\n" +
    "      </div>\n" +
    '      <div class="panel">\n' +
    '        <div class="grid">\n' +
    "          <div>\n" +
    '            <div class="muted">จาก (ต้นทาง)</div>\n' +
    "            <div><strong>" +
    issuerName +
    "</strong></div>\n" +
    "            " +
    issuerAddr +
    "\n" +
    "            " +
    issuerPhone +
    "\n" +
    "          </div>\n" +
    "          <div>\n" +
    '            <div class="muted">ไป (ปลายทาง)</div>\n' +
    "            <div><strong>" +
    recipientName +
    "</strong></div>\n" +
    "            " +
    recipientAddr +
    "\n" +
    "            " +
    recipientPhone +
    "\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <table>\n" +
    "      <thead>\n" +
    "        <tr>\n" +
    '          <th class="text-center" style="width:48px;">#</th>\n' +
    "          <th>สินค้า</th>\n" +
    '          <th style="width:160px;">บาร์โค้ด</th>\n' +
    '          <th class="num" style="width:90px;">จำนวน</th>\n' +
    '          <th class="num" style="width:110px;">ราคา/หน่วย</th>\n' +
    '          <th class="num" style="width:120px;">ยอดรวม</th>\n' +
    "        </tr>\n" +
    "      </thead>\n" +
    "      <tbody>\n" +
    (rows || '<tr><td colspan="6" class="text-center muted">ไม่มีรายการ</td></tr>') +
    "\n" +
    "      </tbody>\n" +
    "    </table>\n" +
    "\n" +
    '    <div class="totals">\n' +
    '      <div class="box">\n' +
    "        <table>\n" +
    "          <tr>\n" +
    '            <td class="muted">ยอดรวมทั้งสิ้น</td>\n' +
    '            <td class="num"><strong>' +
    total +
    "</strong></td>\n" +
    "          </tr>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    '    <div class="signs">\n' +
    '      <div class="sign">ผู้ส่งของ / ลงชื่อ</div>\n' +
    '      <div class="sign">ผู้รับของ / ลงชื่อ</div>\n' +
    "    </div>\n" +
    "\n" +
    '    <div class="foot">\n' +
    "      <div>เอกสารนี้สร้างจากระบบ Chalin Shop</div>\n" +
    "      <div>พิมพ์เมื่อ: " +
    thDate(new Date()) +
    "</div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</body>\n" +
    "</html>\n"
  );
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
