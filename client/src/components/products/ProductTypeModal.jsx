import { useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Button from "@/components/ui/Button";

export default function ProductTypeModal({
  open = true,
  mode = "create",           // "create" | "edit"
  initial = null,            // { id, code, name, description }
  onClose,
  onSubmit,                  // (payload) => Promise<void> | void
  busy = false,
}) {
  const [form, setForm] = useState({
    code: initial?.code || "",
    name: initial?.name || "",
    description: initial?.description || "",
  });
  const [saving, setSaving] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      alert("กรุณากรอก รหัส และ ชื่อหมวด ให้ครบ");
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase().replace(/\s+/g, "-"),
      name: form.name.trim(),
      description: form.description?.trim() || null,
    };
    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      open={open}
      title={mode === "edit" ? "แก้ไขหมวดสินค้า" : "เพิ่มหมวดสินค้า"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="white" onClick={onClose} disabled={busy || saving}>ยกเลิก</Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleSave} disabled={busy || saving}>
            {(busy || saving) ? "กำลังบันทึก..." : (mode === "edit" ? "บันทึก" : "เพิ่ม")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700">รหัสหมวด</label>
          <input
            name="code"
            value={form.code}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none font-mono"
            placeholder="เช่น FASH, ACC, ELEC"
          />
          <div className="text-xs text-slate-500 mt-1">
            ระบบจะบันทึกเป็นตัวพิมพ์ใหญ่และแทนช่องว่างด้วย “-” อัตโนมัติ
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700">ชื่อหมวด</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            placeholder="เช่น เสื้อผ้า, รองเท้า, เครื่องประดับ"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700">รายละเอียด (ถ้ามี)</label>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={onChange}
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            placeholder="คำอธิบายเพิ่มเติมของหมวดสินค้า"
          />
        </div>
      </div>
    </GlassModal>
  );
}
