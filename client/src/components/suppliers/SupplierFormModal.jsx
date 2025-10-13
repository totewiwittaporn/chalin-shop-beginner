import { useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function SupplierFormModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: supplier?.name || "",
    contactName: supplier?.contactName || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    taxId: supplier?.taxId || "",
    address: supplier?.address || "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save() {
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur">
      <Card className="w-[90vw] max-w-md p-6 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-center">
          {supplier ? "แก้ไขซัพพลายเออร์" : "เพิ่มซัพพลายเออร์ใหม่"}
        </h3>

        <div className="space-y-3 text-slate-800">
          <div>
            <label className="block mb-1 text-sm font-medium text-white/90">ชื่อซัพพลายเออร์</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="เช่น บริษัท ABC จำกัด"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-white/90">ชื่อผู้ติดต่อ</label>
            <input
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-white/90">เบอร์โทรศัพท์</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="เช่น 0812345678"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-white/90">อีเมล</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="เช่น supplier@email.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-white/90">เลขผู้เสียภาษี</label>
            <input
              name="taxId"
              value={form.taxId}
              onChange={handleChange}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="เช่น 0105551234567"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-white/90">ที่อยู่</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="บ้านเลขที่ / ถนน / แขวง / เขต / จังหวัด / รหัสไปรษณีย์"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button kind="white" onClick={onClose}>ยกเลิก</Button>
            <Button onClick={save} disabled={saving}>
              {supplier ? "บันทึก" : "เพิ่ม"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
