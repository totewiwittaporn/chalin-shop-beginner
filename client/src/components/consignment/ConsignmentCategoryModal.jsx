import { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Button from "@/components/ui/Button";

export default function ConsignmentCategoryModal({
  open,
  mode = "create",
  initial = null,     // { id, code, name }
  partnerId,          // ใช้ตอน create
  onClose,
  onSubmit,           // create: onSubmit(payload), edit: onSubmit(id, payload)
  busy = false,
}) {
  const isEdit = mode === "edit";
  const formId = "consignment-category-modal";

  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setCode(initial.code ?? "");
      setName(initial.name ?? "");
    } else {
      setCode("");
      setName("");
    }
  }, [open, isEdit, initial]);

  const canSave = useMemo(() => code.trim() && name.trim(), [code, name]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!canSave || busy) return;

    const payload = {
      code: code.trim(),
      name: name.trim(),
      partnerId, // เผื่อ backend ต้องการตอนสร้าง
    };
    if (isEdit) {
      await onSubmit?.(initial?.id, payload);
    } else {
      await onSubmit?.(payload);
    }
  }

  return (
    <GlassModal
      open={open}
      title={isEdit ? "แก้ไขหมวดของร้านฝากขาย" : "เพิ่มหมวดของร้านฝากขาย"}
      onClose={busy ? undefined : onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="danger" type="button" onClick={onClose} disabled={busy}>ยกเลิก</Button>
          <Button kind="success" type="submit" form={formId} disabled={!canSave || busy} loading={busy}>
            บันทึก
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1">รหัสหมวด</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น CLS-BAG"
            maxLength={40}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">ชื่อหมวด</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น กระเป๋า"
            maxLength={120}
          />
        </div>
      </form>
    </GlassModal>
  );
}
