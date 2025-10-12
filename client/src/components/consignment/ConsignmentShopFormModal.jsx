import Button from "@/components/ui/Button.jsx";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function ConsignmentShopFormModal({
  open,
  mode = "create", // "create" | "edit"
  initial = null,
  onClose,
  onSubmit,
  busy = false,
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCode(initial.code || "");
      setName(initial.name || "");
      setStatus(initial.status || "ACTIVE");
    } else {
      setCode("");
      setName("");
      setStatus("ACTIVE");
    }
  }, [open, initial]);

  const canSave = useMemo(() => code.trim() && name.trim(), [code, name]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[95vw] max-w-xl rounded-2xl shadow-xl overflow-hidden">
        {/* header gradient */}
        <div className="bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white px-5 py-3 flex items-center justify-between">
          <div className="font-semibold">
            {mode === "create" ? "เพิ่มร้านฝากขาย" : "แก้ไขร้านฝากขาย"}
          </div>
          <button className="opacity-90 hover:opacity-100" onClick={onClose} title="ปิด">
            <X size={18} />
          </button>
        </div>

        <div className="bg-white p-5">
          <div className="grid gap-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">รหัส (code)</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น RO, LITTLE"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ชื่อร้าน (name)</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น LITTLE SHOP"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">สถานะ</label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button kind="danger" onClick={onClose} disabled={busy}>
              ยกเลิก
            </Button>
            <Button
              kind="success"
              onClick={() => onSubmit({ code: code.trim(), name: name.trim(), status })}
              disabled={!canSave || busy}
              loading={busy}
            >
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
