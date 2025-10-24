// backend/src/print/documentPrint.service.js
import prisma from "#app/lib/prisma.js";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

// ── Helpers (register ครั้งเดียว) ─────────────────────────────────────────────
Handlebars.registerHelper("formatNumber", (v, d = 2) =>
  Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
);
Handlebars.registerHelper("inc", (v) => Number(v) + 1);

// ── A4 (Blue-Glass) Delivery Document ─────────────────────────────────────────
export async function renderDocumentA4PDF(documentId) {
  const doc = await prisma.document.findUnique({
    where: { id: Number(documentId) },
    include: {
      items: true,
      partyFromBranch: true,
      partyToBranch: true,
      partyToPartner: true,
      partnerDocPreference: true,
    },
  });
  if (!doc) throw new Error("Document not found");

  const items = doc.items || [];
  const subtotal = items.reduce((s, x) => s + Number(x.amount || 0), 0);

  // โลโก้/หัวกระดาษ (ถ้ามี)
  const logoUrl =
    doc.partnerDocPreference?.logoUrl || doc.partyToPartner?.logoUrl || null;
  const headerNote = doc.partnerDocPreference?.headerNote || "";

  const htmlTemplate = `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 14mm 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'TH SarabunPSK', Tahoma, Arial, sans-serif; color: #0b1220; }
      .header {
        display:flex; justify-content:space-between; align-items:center;
        padding:12px 16px; border-radius:14px; margin-bottom:12px;
        background: linear-gradient(180deg, #9db9ff, #6f86ff); color:#fff;
      }
      .title { font-size: 18px; font-weight: 700; letter-spacing:.2px; }
      .muted { opacity:.95; font-size: 12px; }
      .logo { max-height: 42px; object-fit: contain; }
      .row { display:flex; gap:12px; margin-bottom: 10px; }
      .card { flex:1; background: rgba(255,255,255,.9); border-radius: 12px; padding: 10px 12px; }
      table { width:100%; border-collapse:collapse; }
      th, td { padding:8px 10px; border-bottom:1px solid rgba(15,23,42,.12); font-size:12px; }
      th { text-align:left; background: rgba(15,23,42,.04); color:#0b1220cc; }
      .right { text-align:right; }
      .total { font-weight:600; }
      .footer { margin-top:14px; font-size:11px; color:#475569; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">ใบส่งสินค้า (Delivery Note)</div>
        <div class="muted">เลขที่เอกสาร: {{docNo}} • วันที่: {{issueDate}}</div>
      </div>
      <div>{{#if logoUrl}}<img class="logo" src="{{logoUrl}}" />{{/if}}</div>
    </div>

    <div class="row">
      <div class="card"><div style="font-weight:600; margin-bottom:6px;">จาก</div>{{#if partyFromBranch}}{{partyFromBranch.name}}{{else}}-{{/if}}</div>
      <div class="card"><div style="font-weight:600; margin-bottom:6px;">ถึง</div>{{#if partyToPartner}}{{partyToPartner.name}}{{/if}}{{#if partyToBranch}}{{partyToBranch.name}}{{/if}}</div>
    </div>

    {{#if headerNote}}<div class="card" style="margin-bottom:10px;">{{headerNote}}</div>{{/if}}

    <table>
      <thead>
        <tr>
          <th style="width:36px;">#</th>
          <th>สินค้า</th>
          <th class="right" style="width:80px;">จำนวน</th>
          <th class="right" style="width:90px;">ราคา</th>
          <th class="right" style="width:110px;">รวม</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
          <tr>
            <td class="right">{{inc @index}}</td>
            <td>{{this.name}}</td>
            <td class="right">{{formatNumber this.qty 0}}</td>
            <td class="right">{{formatNumber this.price 2}}</td>
            <td class="right">{{formatNumber this.amount 2}}</td>
          </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="right total">รวม</td>
          <td class="right total">{{formatNumber subtotal 2}}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">เอกสารนี้จัดทำโดยระบบ Chalin Shop • พิมพ์เมื่อ {{printDate}}</div>
  </body>
  </html>`;

  const template = Handlebars.compile(htmlTemplate);
  const html = template({
    ...doc,
    issueDate: new Date(doc.issueDate).toLocaleDateString("th-TH"),
    subtotal,
    logoUrl,
    headerNote,
    printDate: new Date().toLocaleString("th-TH"),
  });

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf;
}
