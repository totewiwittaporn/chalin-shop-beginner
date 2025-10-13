import { useState } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ProductFormModal({ onClose, onCreated }) {
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!barcode.trim() || !name.trim()) {
      setError("กรุณากรอกบาร์โค้ดและชื่อสินค้า");
      return;
    }
    const cost = Number(costPrice);
    const sale = Number(salePrice);
    if (Number.isNaN(cost) || Number.isNaN(sale)) {
      setError("ราคาต้องเป็นตัวเลข");
      return;
    }
    try {
      setSaving(true);
      await api.post("/api/products", {
        barcode: barcode.trim(),
        name: name.trim(),
        costPrice: cost,
        salePrice: sale,
      });
      onCreated?.();
    } catch (e) {
      setError(e?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <Card className="relative w-full max-w-lg p-5" variant="gradient">
        <div className="text-lg font-semibold mb-1">เพิ่มสินค้าใหม่</div>
        <div className="text-sm text-muted mb-4">
          ระบุข้อมูลสินค้าพื้นฐานเพื่อบันทึกเข้าสู่ระบบ
        </div>
        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted mb-1">บาร์โค้ด</div>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="เช่น 8850999000001"
              />
            </div>
            <div>
              <div className="text-xs text-muted mb-1">ชื่อสินค้า</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อที่แสดง"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted mb-1">ราคาซื้อ (บาท)</div>
              <Input
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
            <div>
              <div className="text-xs text-muted mb-1">ราคาขาย (บาท)</div>
              <Input
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button kind="white" type="button" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button kind="success" type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
