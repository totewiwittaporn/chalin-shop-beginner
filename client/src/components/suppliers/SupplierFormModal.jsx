import { useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
      <Card className="w-[90vw] max-w-md p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {supplier ? "แก้ไขซัพพลายเออร์" : "เพิ่มซัพพลายเออร์ใหม่"}
        </h3>
        <div className="space-y-3">
          <Input name="name" label="ชื่อซัพพลายเออร์" value={form.name} onChange={handleChange} />
          <Input name="contactName" label="ชื่อผู้ติดต่อ" value={form.contactName} onChange={handleChange} />
          <Input name="phone" label="เบอร์โทรศัพท์" value={form.phone} onChange={handleChange} />
          <Input name="email" label="อีเมล" value={form.email} onChange={handleChange} />
          <Input name="taxId" label="เลขผู้เสียภาษี" value={form.taxId} onChange={handleChange} />
          <textarea
            name="address"
            placeholder="ที่อยู่"
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={form.address}
            onChange={handleChange}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button kind="white" onClick={onClose}>ยกเลิก</Button>
            <Button onClick={save} disabled={saving}>{supplier ? "บันทึก" : "เพิ่ม"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
