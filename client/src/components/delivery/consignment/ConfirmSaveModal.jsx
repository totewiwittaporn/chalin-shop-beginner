// frontend/.../ConfirmSaveModal.jsx
import React, { useMemo } from "react";
import GlassModal from "@/components/theme/GlassModal";

function formatMoney(v) {
  try {
    return Number(v || 0).toLocaleString("th-TH", { style: "currency", currency: "THB" });
  } catch {
    return `${v}`;
  }
}

export default function ConfirmSaveModal({
  open,
  onClose,
  onConfirm,
  actionType,          // "SEND" | "RETURN"
  fromBranchName,
  toBranchName,
  toPartnerName,
  lines,               // [{ id/productId, name, barcode, qty, salePrice/price }]
}) {
  const { count, sum } = useMemo(() => {
    let total = 0;
    let c = 0;
    for (const it of lines || []) {
      const qty = Number(it.qty || 0);
      const price = Number(it.salePrice ?? it.price ?? 0);
      total += qty * price;
      if (qty > 0) c += 1;
    }
    return { count: c, sum: total };
  }, [lines]);

  return (
    <GlassModal open={open} onClose={onClose} width={640} title="ยืนยันบันทึกเอกสารส่งของ">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <div className="flex flex-wrap gap-2">
            <div><span className="text-gray-500">ประเภท:</span> <b>{actionType === "RETURN" ? "คืนเข้าสต็อกสาขา" : "ส่งไปร้านฝากขาย"}</b></div>
            <div>•</div>
            <div><span className="text-gray-500">จาก:</span> <b>{fromBranchName || "-"}</b></div>
            <div>•</div>
            <div>
              <span className="text-gray-500">ไปยัง:</span>{" "}
              <b>{actionType === "RETURN" ? (toBranchName || "-") : (toPartnerName || "-")}</b>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 w-40">Barcode</th>
                <th className="text-left px-3 py-2">สินค้า</th>
                <th className="text-right px-3 py-2 w-24">จำนวน</th>
                <th className="text-right px-3 py-2 w-32">ราคา (ประมาณ)</th>
                <th className="text-right px-3 py-2 w-32">รวม</th>
              </tr>
            </thead>
            <tbody>
              {(lines || []).map((it, idx) => {
                const price = Number(it.salePrice ?? it.price ?? 0);
                const qty = Number(it.qty || 0);
                const sum = qty * price;
                return (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600">{it.barcode || "-"}</td>
                    <td className="px-3 py-2">{it.name || "-"}</td>
                    <td className="px-3 py-2 text-right">{qty}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(price)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(sum)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-white">
                <td className="px-3 py-2 text-right" colSpan={4}><b>รวมทั้งสิ้น</b> ({count} รายการ)</td>
                <td className="px-3 py-2 text-right font-bold">{formatMoney(sum)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            บันทึกเอกสาร
          </button>
        </div>
        <p className="text-xs text-gray-400">
          *ยอดเป็นการประเมินจากราคาปัจจุบันของสินค้าในหน้าจอนี้ — ราคาที่บันทึกจริงจะคำนวณตามกติกาของร้านฝากขายฝั่งเซิร์ฟเวอร์ (และถูก snapshot ลงเอกสาร)
        </p>
      </div>
    </GlassModal>
  );
}
