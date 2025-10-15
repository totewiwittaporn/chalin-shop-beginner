// client/src/pages/branches/components/BranchEditModal.jsx
import { useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function BranchEditModal({ open, data, onClose, onSubmit }) {
  const init = useMemo(() => ({
    code: data?.code ?? "",
    isMain: !!data?.isMain,            // ถ้า schema ไม่มี ฟิลด์นี้จะถูกละใน onSubmit
    name: data?.name ?? "",
    address: data?.address ?? "",      // map ไป addressLine1 ที่ backend
    addressLine2: data?.addressLine2 ?? "",
    addressLine3: data?.addressLine3 ?? "",
    phone: data?.phone ?? "",
    taxId: data?.taxId ?? "",
    commissionRate: data?.commissionRate ?? "", // ถ้า schema ไม่มี จะไม่ส่ง
  }), [data]);

  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e?.target?.type === "checkbox" ? e.target.checked : e.target.value }));

  const canSave = form.code.trim() && form.name.trim();

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // สร้าง payload แบบ “ส่งเฉพาะฟิลด์ที่มีค่า”
      const payload = {};
      const put = (k, v) => { if (v !== "" && v !== undefined && v !== null) payload[k] = v; };

      put("code", form.code.toUpperCase());
      put("name", form.name);
      put("address", form.address);             // backend map -> addressLine1
      put("addressLine2", form.addressLine2);   // ถ้า schema มี
      put("addressLine3", form.addressLine3);   // ถ้า schema มี
      put("phone", form.phone);                 // ถ้า schema มี
      put("taxId", form.taxId);                 // ถ้า schema มี
      if (typeof form.isMain === "boolean") put("isMain", form.isMain);
      if (form.commissionRate !== "") put("commissionRate", Number(form.commissionRate));

      await onSubmit?.(payload);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassModal open={open} title={data ? "แก้ไขร้านสาขา" : "สร้างร้านสาขา"} onClose={onClose}>
      <div className="grid gap-4">
        {/* รหัส + isMain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">รหัสสาขา</label>
            <Input value={form.code} onChange={set("code")} placeholder="เช่น MAIN / BR-GVT" />
          </div>
          <label className="flex items-end gap-2">
            <input type="checkbox" className="scale-110 accent-blue-500 mt-6" checked={form.isMain} onChange={set("isMain")} />
            <span className="text-sm text-slate-700">ตั้งเป็น MAIN</span>
          </label>
        </div>

        {/* ชื่อ */}
        <div>
          <label className="text-xs text-slate-500">ชื่อร้านสาขา</label>
          <Input value={form.name} onChange={set("name")} placeholder="เช่น Chalin Shop" />
        </div>

        {/* ที่อยู่ */}
        <div>
          <label className="text-xs text-slate-500">ที่อยู่</label>
          <textarea
            className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
            rows={3}
            value={form.address}
            onChange={set("address")}
            placeholder="เช่น 140/8 หมู่ 3 ..."
          />
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={form.addressLine2} onChange={set("addressLine2")} placeholder="ที่อยู่บรรทัด 2 (ถ้ามี)" />
            <Input value={form.addressLine3} onChange={set("addressLine3")} placeholder="ที่อยู่บรรทัด 3 (ถ้ามี)" />
          </div>
        </div>

        {/* ติดต่อ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">เบอร์โทร</label>
            <Input value={form.phone} onChange={set("phone")} placeholder="เช่น 08x-xxx-xxxx" />
          </div>
          <div>
            <label className="text-xs text-slate-500">เลขภาษี (ถ้ามี)</label>
            <Input value={form.taxId} onChange={set("taxId")} placeholder="เลขผู้เสียภาษี 13 หลัก" />
          </div>
        </div>

        {/* ค่าคอมมิชชั่น (ถ้าใช้) */}
        <div>
          <label className="text-xs text-slate-500">ค่าคอมมิชชั่น (%)</label>
          <Input type="number" min="0" max="100" step="0.01"
                 value={form.commissionRate}
                 onChange={set("commissionRate")}
                 placeholder="0–100% เท่านั้น" />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button className="btn-white" onClick={onClose}>ยกเลิก</Button>
        <Button disabled={!canSave || saving} onClick={handleSave}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </GlassModal>
  );
}
