import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const LS_KEY = "pos.branchCtx";

export default function BranchSwitcher({
  role,                          // "ADMIN" | "STAFF"
  fixedBranch,                   // { id, name } (STAFF ใช้ค่านี้)
  onChange,                      // (ctx) => void
  fetchUrl = "/api/branches",    // GET -> [{id,name,code?}]
}) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("branchId");
    const fromLs = (() => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
    })();

    if (role === "STAFF" && fixedBranch?.id) {
      setBranchId(String(fixedBranch.id));
      onChange?.({ id: fixedBranch.id, name: fixedBranch.name });
      return;
    }
    if (fromUrl) { setBranchId(String(fromUrl)); return; }
    if (fromLs?.id) {
      setBranchId(String(fromLs.id));
      onChange?.({ id: fromLs.id, name: fromLs.name });
    }
  }, [role, fixedBranch, onChange]);

  useEffect(() => {
    if (role !== "ADMIN") return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (!active) return;
        setBranches(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
      } catch (e) {
        console.error("load branches failed", e);
        if (active) setBranches([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [role, fetchUrl]);

  const selected = useMemo(
    () => branches.find(b => String(b.id) === String(branchId)),
    [branches, branchId]
  );

  function applySelection() {
    if (!selected) return;
    const ctx = { id: selected.id, name: selected.name || selected.code || `Branch #${selected.id}` };
    localStorage.setItem(LS_KEY, JSON.stringify(ctx));
    onChange?.(ctx);
  }

  if (role === "STAFF") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-80">สาขาที่ทำรายการ:</span>
        <Input value={fixedBranch?.name || `Branch #${fixedBranch?.id || "-"}`} readOnly className="w-[240px]" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-80">สาขาที่ทำรายการ:</span>
      <select
        className="rounded-xl border px-3 py-2 bg-white text-slate-900 w-[260px]"
        disabled={loading}
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
      >
        <option value="">{loading ? "กำลังโหลด..." : "— เลือกสาขา —"}</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>
            {b.code ? `${b.code} — ${b.name}` : b.name}
          </option>
        ))}
      </select>
      <Button kind="primary" onClick={applySelection} disabled={!branchId || !selected}>ใช้สาขานี้</Button>
    </div>
  );
}
