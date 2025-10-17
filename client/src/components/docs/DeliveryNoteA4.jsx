// client/src/components/docs/DeliveryNoteA4.jsx
import React from "react";

function toThaiBahtText(amount) {
  const num = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
  const pos = ["","สิบ","ร้อย","พัน","หมื่น","แสน","ล้าน"];
  function readInt(n) {
    if (n === 0) return "";
    let s = "", i = 0;
    while (n > 0) {
      const a = n % 10, p = i % 6;
      if (i % 6 === 0 && i > 0) s = pos[6] + s;
      if (a !== 0) {
        let w = num[a];
        if (p === 0 && i > 0 && a === 1) w = "เอ็ด";
        if (p === 1) { if (a === 2) w = "ยี่"; if (a === 1) w = ""; }
        s = w + pos[p] + s;
      }
      n = Math.floor(n / 10); i++;
    }
    return s;
  }
  const a = Math.floor(Math.abs(Number(amount) || 0));
  const st = Math.round((Math.abs(Number(amount) || 0) - a) * 100);
  const btxt = readInt(a) || num[0];
  return st === 0 ? `${btxt}บาทถ้วน` : `${btxt}บาท${readInt(st)}สตางค์`;
}

export function DeliveryNoteA4({ title = "ใบส่งสินค้า (Delivery Note)", logoUrl, doc }) {
  const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateStr = doc?.docDate ? new Date(doc.docDate).toLocaleDateString() : "-";

  const items = Array.isArray(doc?.items) ? [...doc.items] : [];
  const ROWS = 10;
  const blankCount = Math.max(0, ROWS - items.length);
  for (let i = 0; i < blankCount; i++) items.push({ description: "", price: null, qty: null, total: null, _blank: true });

  const computedTotal = (doc?.items || []).reduce((s, i) => s + (i.total ?? (Number(i.price) || 0) * (Number(i.qty) || 0)), 0);
  const total = doc?.total ?? computedTotal;
  const totalText = toThaiBahtText(total);

  return (
    <div className="bg-white text-slate-900 rounded-xl shadow-sm border border-slate-200 mx-auto">
      {/* ลด padding ลงเล็กน้อยให้เหลือพื้นที่ลายเซ็น */}
      <div className="p-5">
        {/* หัวเรื่อง + โลโก้ */}
        <div className="flex items-start justify-between gap-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="flex justify-end">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-12 object-contain" />
            ) : (
              <div className="h-12 w-28 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">LOGO</div>
            )}
          </div>
        </div>

        {/* วันที่/เลขที่ */}
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-slate-500">วันที่ (Date)</div><div className="font-medium">{dateStr}</div>
          <div className="text-slate-500">เลขที่เอกสาร (No.)</div><div className="font-medium">{doc?.docNo ?? "-"}</div>
        </div>

        {/* ส่งถึง / ส่งจาก */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-5 items-start avoid-break">
          <div>
            <div className="text-sm text-slate-500 mb-1">ส่งถึง (Delivery To)</div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-medium">{doc?.to?.name || "-"}</div>
              <div className="text-sm leading-6">
                {doc?.to?.addr1 && <div>{doc.to.addr1}</div>}
                {doc?.to?.addr2 && <div>{doc.to.addr2}</div>}
                {doc?.to?.addr3 && <div>{doc.to.addr3}</div>}
                {doc?.to?.phone && <div>โทร: {doc.to.phone}</div>}
                {doc?.to?.extra && <div>อื่นๆ: {doc.to.extra}</div>}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">ส่งจาก (Delivery From)</div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-medium">{doc?.from?.name || "-"}</div>
              <div className="text-sm leading-6">
                {doc?.from?.addr1 && <div>{doc.from.addr1}</div>}
                {doc?.from?.addr2 && <div>{doc.from.addr2}</div>}
                {doc?.from?.addr3 && <div>{doc.from.addr3}</div>}
                {doc?.from?.phone && <div>โทร: {doc.from.phone}</div>}
                {doc?.from?.extra && <div>อื่นๆ: {doc.from.extra}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* ตาราง */}
        <div className="mt-6 avoid-break">
          <table className="w-full border-collapse overflow-hidden rounded-xl">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm">
                <th className="text-left font-medium px-4 py-2.5 rounded-tl-xl">Description</th>
                <th className="text-right font-medium px-4 py-2.5">Price</th>
                <th className="text-right font-medium px-4 py-2.5">QTY</th>
                <th className="text-right font-medium px-4 py-2.5 rounded-tr-xl">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((it, idx) => (
                <tr key={idx} className="border-b last:border-0 border-slate-200">
                  <td className={`px-4 py-2 ${it._blank ? "h-6" : ""}`}>{it.description || "\u00A0"}</td>
                  <td className="px-4 py-2 text-right">{it._blank ? "\u00A0" : fmt(it.price)}</td>
                  <td className="px-4 py-2 text-right">{it._blank ? "\u00A0" : it.qty}</td>
                  <td className="px-4 py-2 text-right">{it._blank ? "\u00A0" : fmt(it.total ?? (Number(it.price)||0)*(Number(it.qty)||0))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-4 py-2.5 text-left text-sm font-semibold align-top">
                  รวมทั้งสิ้น (Total)
                  <div className="mt-1 text-xs font-normal text-slate-500">({toThaiBahtText(total)})</div>
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-bold">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* หมายเหตุ + เซ็นต์ */}
        <div className="mt-6 space-y-5 avoid-break">
          <div>
            <div className="text-sm text-slate-500 mb-2">หมายเหตุ</div>
            <div className="h-18 rounded-xl border border-slate-200"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-sm">
              <div className="h-10"></div>
              <div className="border-t border-slate-300 pt-2 text-center">ลงชื่อผู้ส่งสินค้า / Sender</div>
              <div className="mt-1 text-center text-xs text-slate-500">วันที่/เวลา _____________</div>
            </div>
            <div className="text-sm">
              <div className="h-10"></div>
              <div className="border-t border-slate-300 pt-2 text-center">ลงชื่อผู้รับสินค้า / Receiver</div>
              <div className="mt-1 text-center text-xs text-slate-500">วันที่/เวลา _____________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
