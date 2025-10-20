// client/src/components/suppliers/SupplierFormModal.jsx
import { useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import GlassModal from "@/components/theme/GlassModal";

export default function SupplierFormModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: supplier?.name || "",
    contactName: supplier?.contactName || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    taxId: supplier?.taxId || "",
    address: supplier?.address || "",
    isActive: supplier?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function save() {
    if (!form.name.trim()) return alert("กรุณากรอกชื่อซัพพลายเออร์");
    setSaving(true);
    try {
      if (supplier?.id) {
        await api.put(`/api/suppliers/${supplier.id}`, form);
      } else {
        await api.post("/api/suppliers", form);
      }
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      open
      title={supplier ? "แก้ไขซัพพลายเออร์" : "เพิ่มซัพพลายเออร์ใหม่"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="white" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก..." : supplier ? "บันทึก" : "เพิ่ม"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700">ชื่อซัพพลายเออร์</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            placeholder="เช่น บริษัท ABC จำกัด"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">ชื่อผู้ติดต่อ</label>
            <input
              name="contactName"
              value={form.contactName}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">เบอร์โทรศัพท์</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
              placeholder="เช่น 0812345678"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">อีเมล</label>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
              placeholder="เช่น supplier@email.com"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">เลขผู้เสียภาษี</label>
            <input
              name="taxId"
              value={form.taxId}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none font-mono"
              placeholder="เช่น 0105551234567"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700">ที่อยู่</label>
          <textarea
            name="address"
            value={form.address}
            onChange={onChange}
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            placeholder="บ้านเลขที่ / ถนน / แขวง / เขต / จังหวัด / รหัสไปรษณีย์"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm mt-1">
          <input
            type="checkbox"
            name="isActive"
            checked={!!form.isActive}
            onChange={onChange}
            className="scale-110"
          />
          เปิดใช้งานซัพพลายเออร์นี้
        </label>
      </div>
    </GlassModal>
  );
}
