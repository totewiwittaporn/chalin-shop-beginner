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
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setErrorMsg("");
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
      code: code.trim().toUpperCase(),
      name: name.trim(),
      partnerId,
    };

    try {
      if (isEdit) {
        await onSubmit?.(initial?.id, payload);
      } else {
        await onSubmit?.(payload);
      }
      setErrorMsg("");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409) {
        setErrorMsg(data?.message || "รหัสหมวดนี้ถูกใช้แล้วในร้านนี้");
      } else if (status === 400) {
        setErrorMsg(data?.error || "ข้อมูลไม่ครบถ้วน");
      } else {
        setErrorMsg("เกิดข้อผิดพลาด ไม่สามารถบันทึกได้");
      }
    }
  }

  function triggerSubmit() {
    const f = document.getElementById(formId);
    if (f) f.requestSubmit();
  }

  return (
    <GlassModal
      open={open}
      title={isEdit ? "แก้ไขหมวดของร้านฝากขาย" : "เพิ่มหมวดของร้านฝากขาย"}
      onClose={busy ? undefined : onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="danger" type="button" onClick={onClose} disabled={busy}>ยกเลิก</Button>
          <Button
            kind="success"
            type="button"
            onClick={triggerSubmit}
            disabled={!canSave || busy}
            loading={busy}
          >
            บันทึก
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-3">
        {errorMsg && (
          <div className="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

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
