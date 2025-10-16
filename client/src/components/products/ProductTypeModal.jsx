import { useEffect, useState, useMemo } from "react";
import GlassModal from "@/components/theme/GlassModal.jsx";
import Button from "@/components/ui/Button";

/**
 * ProductTypeModal - Modal เดียว ใช้ได้ทั้งเพิ่มและแก้ไขผ่าน prop `mode`
 *
 * props:
 *  - open: boolean
 *  - mode: "create" | "edit"
 *  - initial: { id, name, code } | null  (ใช้ตอน mode="edit")
 *  - onClose: () => void
 *  - onSubmit: (payload | (id, payload)) => Promise<void> | void
 *      - ถ้า mode="create": onSubmit(payload)
 *      - ถ้า mode="edit":   onSubmit(id, payload)
 *  - busy: boolean
 */
export default function ProductTypeModal({
  open,
  mode = "create",
  initial = null,
  onClose,
  onSubmit,
  busy = false,
}) {
  const isEdit = mode === "edit";
  const formId = "product-type-modal-form";

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setName(initial.name ?? "");
      setCode(initial.code ?? "");
    } else {
      setName("");
      setCode("");
    }
  }, [open, isEdit, initial]);

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!canSave || busy) return;
    const payload = {
      name: name.trim(),
      code: code.trim() || null,
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
      title={isEdit ? "แก้ไขหมวดสินค้า" : "เพิ่มหมวดสินค้า"}
      onClose={busy ? undefined : onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="danger" type="button" onClick={onClose} disabled={busy}>
            ยกเลิก
          </Button>
          <Button
            kind="success"
            type="submit"
            form={formId}
            disabled={!canSave || busy}
            loading={busy}
          >
            บันทึก
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1">ชื่อหมวด</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น เครื่องดื่ม, ขนมขบเคี้ยว"
            autoFocus
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">รหัส (ไม่บังคับ)</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น DRINK, SNACK"
            maxLength={40}
          />
        </div>
      </form>
    </GlassModal>
  );
}
