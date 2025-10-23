// backend/src/renderers/consignmentDelivery/CAT_ONLY.js
// Render แบบ "ใช้หมวดหมู่ร้านฝากขาย"

export function renderCAT_ONLY(doc) {
  const money = (v) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
      Number(v || 0)
    );
  const d = (s) => (s ? new Date(s).toISOString().slice(0, 10) : "");

  const lines = Array.isArray(doc?.lines) ? doc.lines : [];

  // group by partnerCategoryName (null -> 'ไม่ระบุ')
  const groups = new Map();
  for (const l of lines) {
    const key = l.partnerCategoryName || "ไม่ระบุ";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }

  const css = `
    body { font-family: sans-serif; margin: 24px; color: #111827; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    th { background: #f9fafb; text-align: left; }
    .right { text-align: right; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; }
    .meta { font-size: 12px; color: #6b7280; text-align: right; }
    .group { margin-top: 20px; }
    @media print { .no-print { display:none; } body{ margin:0; } }
  `;

  let html = `
  <!doctype html>
  <html lang="th"><head><meta charset="utf-8"/>
  <title>${doc?.docNo || ""}</title>
  <style>${css}</style></head>
  <body>
  <div class="head">
    <div>
      <div class="title">ใบส่งสินค้า (ร้านฝากขาย) - แบบหมวด</div>
      <div style="color:#6b7280">${doc?.partner?.name || doc?.recipientName || ""}</div>
    </div>
    <div class="meta">
      <div>เลขที่: ${doc?.docNo || ""}</div>
      <div>วันที่: ${d(doc?.docDate || doc?.date)}</div>
    </div>
  </div>`;

  let grand = 0;
  for (const [catName, rows] of groups.entries()) {
    let groupSum = 0;
    html += `<div class="group"><div><strong>หมวด:</strong> ${catName}</div><table>
      <thead><tr>
        <th style="width:140px">Barcode</th>
        <th>สินค้า</th>
        <th class="right" style="width:100px">ราคา/หน่วย</th>
        <th class="right" style="width:80px">จำนวน</th>
        <th class="right" style="width:100px">รวม</th>
      </tr></thead><tbody>`;

    for (const l of rows) {
      const sum = Number(l.unitPrice) * Number(l.qty);
      groupSum += sum;
      grand += sum;
      html += `<tr>
        <td>${l.barcode || "-"}</td>
        <td>${l.displayName || l.name || "-"}</td>
        <td class="right">${money(l.unitPrice)}</td>
        <td class="right">${l.qty}</td>
        <td class="right">${money(sum)}</td>
      </tr>`;
    }
    html += `</tbody><tfoot><tr><td colspan="4" class="right"><b>รวมหมวด</b></td><td class="right"><b>${money(
      groupSum
    )}</b></td></tr></tfoot></table></div>`;
  }

  html += `<div style="margin-top:16px;text-align:right"><b>รวมทั้งสิ้น:</b> ${money(
    grand
  )}</div>
  <div class="no-print" style="margin-top:12px">
    <button onclick="window.print()">พิมพ์</button>
  </div>
  </body></html>`;

  return html;
}
