// client/src/components/consignment/ConsignmentPriceEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Button from "@/components/ui/Button";
import api from "@/lib/axios";

/**
 * Modal สำหรับแก้ไข "ราคาฝากขายเฉพาะร้าน" ของสินค้าที่ถูกแมพในหมวด
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - categoryId: number   // ใช้ประกอบ URL
 * - item: {
 *     productId: number,
 *     price?: number | null,
 *     product?: { barcode?: string, name?: string, salePrice?: number }
 *   }
 * - onSaved: (newPrice: number) => Promise<void> | void
 */
export default function ConsignmentPriceEditModal({
  open,
  onClose,
  categoryId,
  item,
  onSaved,
}) {
  const basePrice = useMemo(() => Number(item?.product?.salePrice ?? 0), [item]);
  const currentConsignPrice = useMemo(() => {
    const n = item?.price;
    return (n === null || n === undefined) ? undefined : Number(n);
  }, [item]);

  const [price, setPrice] = useState(currentConsignPrice ?? basePrice);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset ค่าเมื่อเปิด modal ใหม่
    setPrice(currentConsignPrice ?? basePrice);
  }, [open, currentConsignPrice, basePrice]);

  async function handleSave(e) {
    e?.preventDefault();
    // ตรวจสอบจำนวนเต็ม/ทศนิยมที่แปลงเป็นตัวเลขได้
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0) {
      alert("กรุณากรอกราคาให้ถูกต้อง (มากกว่า 0)");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/consignment/categories/${categoryId}/products`, {
        items: [{ productId: item.productId, price: n }],
      });
      await onSaved?.(n);
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title="แก้ไขราคาฝากขาย"
      size="sm"
      footer={
        <>
          <Button kind="danger" type="button" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button kind="success" type="submit" form="consignment-price-edit-form" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกราคา"}
          </Button>
        </>
      }
    >
      {!item ? (
        <div className="text-slate-600">ไม่พบข้อมูลสินค้า</div>
      ) : (
        <form id="consignment-price-edit-form" className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-1">
            <div className="text-sm text-slate-500">สินค้า</div>
            <div className="font-medium text-slate-800">
              {item?.product?.name || "-"}
            </div>
            <div className="text-slate-600 font-mono">
              {item?.product?.barcode || "-"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">ราคาขายหลัก</div>
              <div className="text-lg font-semibold">
                {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(basePrice)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">ราคาฝากขายปัจจุบัน</div>
              <div className="text-lg font-semibold">
                {currentConsignPrice !== undefined
                  ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(currentConsignPrice)
                  : "—"}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-700">กำหนดราคาฝากขายใหม่ (บาท)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              autoFocus
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-right"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const btn = document.querySelector('[form="consignment-price-edit-form"][type="submit"]');
                  btn?.click();
                }
              }}
            />
            <p className="text-xs text-slate-500">
              เคล็ดลับ: ถ้าไม่แน่ใจ ให้เริ่มจากราคาขายหลัก แล้วปรับตาม % ส่วนแบ่งของร้านฝากขาย
            </p>
          </div>
        </form>
      )}
    </GlassModal>
  );
}