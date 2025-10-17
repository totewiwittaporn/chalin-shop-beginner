// client/src/components/docs/DeliveryNote.jsx
import React from "react";

/** แปลงจำนวนเงินเป็นข้อความภาษาไทย */
function toThaiBahtText(amount) {
  const num = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
  const pos = ["","สิบ","ร้อย","พัน","หมื่น","แสน","ล้าน"];
  function readInt(n) {
    if (n === 0) return "";
    let s = ""; let i = 0;
    while (n > 0) {
      const a = n % 10; const p = i % 6;
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
  const satang = Math.round((Math.abs(Number(amount) || 0) - a) * 100);
  const bahtTxt = readInt(a) || num[0];
  return satang === 0 ? `${bahtTxt}บาทถ้วน` : `${bahtTxt}บาท${readInt(satang)}สตางค์`;
}

export function DeliveryNote({ title = "ใบส่งสินค้า (Delivery Note)", logoUrl, doc }) {
  const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateStr = doc?.docDate ? new Date(doc.docDate).toLocaleDateString() : "-";
  const total = doc?.total ?? (doc?.items || []).reduce((s, i) => s + (i.total ?? i.price * i.qty), 0);
  const totalText = toThaiBahtText(total);

  return (
    <div className="dn-sheet bg-white text-slate-900 rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 md:p-8">
        {/* ชื่อเอกสาร + โลโก้ */}
        <div className="flex items-start justify-between gap-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="flex justify-end">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-12 object-contain" />
            ) : (
              <div className="h-12 w-28 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                LOGO
              </div>
            )}
          </div>
        </div>

        {/* วันที่/เลขที่ */}
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-slate-500">วันที่ (Date)</div>
          <div className="font-medium">{dateStr}</div>
          <div className="text-slate-500">เลขที่เอกสาร (No.)</div>
          <div className="font-medium">{doc?.docNo ?? "-"}</div>
        </div>

        {/* ส่งถึง / ส่งจาก */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
        <div className="mt-8">
          <table className="w-full border-collapse overflow-hidden rounded-xl">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm">
                <th className="text-left font-medium px-4 py-3 rounded-tl-xl">Description</th>
                <th className="text-right font-medium px-4 py-3">Price</th>
                <th className="text-right font-medium px-4 py-3">QTY</th>
                <th className="text-right font-medium px-4 py-3 rounded-tr-xl">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(doc?.items || []).map((it, idx) => (
                <tr key={idx} className="border-b last:border-0 border-slate-200">
                  <td className="px-4 py-3">{it.description}</td>
                  <td className="px-4 py-3 text-right">{fmt(it.price)}</td>
                  <td className="px-4 py-3 text-right">{it.qty}</td>
                  <td className="px-4 py-3 text-right">{fmt(it.total ?? it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-4 py-3 text-left text-sm font-semibold align-top">
                  รวมทั้งสิ้น (Total)
                  <div className="mt-1 text-xs font-normal text-slate-500">
                    ({totalText})
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* หมายเหตุ + เซ็นต์ */}
        <div className="mt-8 space-y-6">
          <div>
            <div className="text-sm text-slate-500 mb-2">หมายเหตุ</div>
            <div className="h-20 rounded-xl border border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-sm">
              <div className="h-12"></div>
              <div className="border-t border-slate-300 pt-2 text-center">ลงชื่อผู้ส่งสินค้า / Sender</div>
              <div className="mt-1 text-center text-xs text-slate-500">วันที่/เวลา _____________</div>
            </div>
            <div className="text-sm">
              <div className="h-12"></div>
              <div className="border-t border-slate-300 pt-2 text-center">ลงชื่อผู้รับสินค้า / Receiver</div>
              <div className="mt-1 text-center text-xs text-slate-500">วันที่/เวลา _____________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
