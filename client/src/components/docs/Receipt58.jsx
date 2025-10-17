// client/src/components/docs/Receipt58.jsx
import React from "react";

const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Receipt58({ title = "ใบเสร็จ/ใบส่งสินค้า (58mm)", shop, to, items = [], total }) {
  const computedTotal = items.reduce((s, i) => s + (i.total ?? (Number(i.price)||0)*(Number(i.qty)||0)), 0);
  const t = total ?? computedTotal;
  const now = new Date();
  const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString();

  return (
    <div className="w-[58mm] text-[11px] leading-5 text-slate-900 bg-white mx-auto">
      <div className="text-center mb-2">
        <div className="font-semibold">{shop?.name || "-"}</div>
        {shop?.addr1 && <div>{shop.addr1}</div>}
        {shop?.addr2 && <div>{shop.addr2}</div>}
        {shop?.phone && <div>โทร: {shop.phone}</div>}
        <div className="mt-2 font-medium">{title}</div>
        <div className="text-[10px] text-slate-600">{dateStr}</div>
      </div>

      {to && (
        <div className="mb-2">
          <div className="font-medium">ส่งถึง:</div>
          <div>{to.name}</div>
          {to.addr1 && <div>{to.addr1}</div>}
          {to.addr2 && <div>{to.addr2}</div>}
          {to.phone && <div>โทร: {to.phone}</div>}
        </div>
      )}

      <div className="border-t border-b border-slate-300 py-1 my-2">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12">
            <div className="col-span-7 pr-2">{it.description}</div>
            <div className="col-span-2 text-right">{it.qty}</div>
            <div className="col-span-3 text-right">{fmt(it.total ?? (Number(it.price)||0)*(Number(it.qty)||0))}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 my-1">
        <div className="col-span-7 pr-2 font-medium">รวมทั้งสิ้น</div>
        <div className="col-span-5 text-right font-semibold">{fmt(t)}</div>
      </div>

      <div className="mt-3 text-center text-[10px] text-slate-600">
        *** ขอบคุณที่ใช้บริการ ***
      </div>
    </div>
  );
}
