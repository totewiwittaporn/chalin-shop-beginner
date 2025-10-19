import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
// ✅ ใช้ client กลางของโปรเจ็กต์ (ตั้งค่า baseURL/withCredentials ไว้แล้ว)
import api from "@/lib/api"; // <-- ถ้าของคุณชื่อไฟล์/ที่อยู่ต่างกัน แก้ import ให้ตรงโปรเจ็กต์

/**
 * BranchSwitcher (ADMIN เลือกสาขา, STAFF แสดงสาขาคงที่)
 *
 * Props:
 *  - role: "ADMIN" | "STAFF"
 *  - fixedBranch?: { id, name }   // สำหรับ STAFF
 *  - fetchPath?: string           // เอนด์พอยต์ที่ใช้โหลดรายการสาขา (ดีฟอลต์ "/api/branches")
 *  - onChange?: (branch|null)
 */
export default function BranchSwitcher({
  role = "STAFF",
  fixedBranch,
  fetchPath = "/api/branches",
  onChange,
}) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sel, setSel] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pos.branchCtx") || "null"); } catch { return null; }
  });

  // โหลดรายชื่อสาขา (ADMIN เท่านั้น)
  useEffect(() => {
    if (role !== "ADMIN") return;
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // ✅ ใช้ api.get เพื่อให้ header/cookie/proxy เหมือนหน้า Branches
        const { data } = await api.get(fetchPath, { withCredentials: true });
        // รองรับหลายรูปแบบ response: [] | {rows:[]} | {items:[]}
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const normalized = items.map((b) => ({
          id: b.id ?? b.branchId ?? b.code ?? String(b.name || "branch"),
          name: b.name ?? b.title ?? b.code ?? `Branch #${b.id || ""}`,
        }));

        if (!active) return;
        setBranches(normalized);
      } catch (e) {
        if (!active) return;
        setBranches([]);
        setError("โหลดสาขาไม่สำเร็จ");
        console.error("BranchSwitcher: fetch branches failed:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [role, fetchPath]);

  // เลือกค่า → เซฟลง localStorage + แจ้ง parent
  function updateSelection(next) {
    setSel(next);
    if (next) localStorage.setItem("pos.branchCtx", JSON.stringify(next));
    else localStorage.removeItem("pos.branchCtx");
    onChange?.(next);
  }

  // STAFF → แจ้ง parent ทันทีด้วย fixedBranch
  useEffect(() => {
    if (role !== "STAFF") return;
    if (fixedBranch?.id) onChange?.(fixedBranch);
  }, [role, fixedBranch, onChange]);

  const label = useMemo(() => {
    if (role === "ADMIN") return sel?.name ? `สาขา: ${sel.name}` : "ยังไม่เลือกสาขา";
    return fixedBranch?.name || "ไม่ทราบสาขา";
  }, [role, sel, fixedBranch]);

  if (role === "STAFF") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/90 md:text-slate-700 md:text-[13px]">สาขาของฉัน</span>
        <Button kind="white" disabled>{fixedBranch?.name || "ไม่ทราบสาขา"}</Button>
      </div>
    );
  }

  // ADMIN UI — พื้นขาว/ตัวดำ/ปุ่มล้างสีแดง
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/90 md:text-slate-700 md:text-[13px]">เลือกสาขา</span>

      <select
        className="
          rounded-xl border border-slate-300 px-3 py-2 text-sm
          bg-white text-slate-900 shadow-sm outline-none
          hover:border-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-primary/30
          appearance-none min-w-[220px]
        "
        disabled={loading}
        value={sel?.id || ""}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return updateSelection(null);
          const found = branches.find((b) => String(b.id) === id);
          updateSelection(found || null);
        }}
      >
        <option value="">{loading ? "กำลังโหลด..." : "-- เลือกสาขา --"}</option>
        {branches.map((b) => (
          <option key={b.id} value={String(b.id)} className="text-slate-900">
            {b.name}
          </option>
        ))}
      </select>

      <Button kind="danger" onClick={() => updateSelection(null)} disabled={!sel} title="ล้างค่าที่เลือก">
        ล้าง
      </Button>

      <span className="text-xs opacity-80 hidden md:inline">{label}</span>
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
    </div>
  );
}
