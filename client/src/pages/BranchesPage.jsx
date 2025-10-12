import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import Button from "@/components/ui/Button.jsx";
import { Pencil, Plus } from "lucide-react";
import { getBranches, createBranch, updateBranch } from "@/services/branches.api.js";
import { useAuthStore } from "@/store/authStore.js";

/* ---------- Dialog infra ---------- */
function DialogBase({ title, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[95vw] max-w-xl rounded-2xl shadow-xl bg-white">
        <div className="px-5 pt-5">
          <div className="text-lg font-semibold text-slate-800 mb-2">{title}</div>
        </div>
        <div className="px-5 pb-2">{children}</div>
        <div className="px-5 py-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function BranchDialog({ mode = "create", initial = {}, onClose, onSave, busy }) {
  const [code, setCode] = useState(initial.code || "");
  const [name, setName] = useState(initial.name || "");
  const [address, setAddress] = useState(initial.address || "");
  const [commission, setCommission] = useState(
    typeof initial.commissionRate === "number" ? String(initial.commissionRate) : ""
  );

  const normalizedCode = (code || "").toUpperCase().replace(/\s+/g, "-");
  const canSave =
    normalizedCode.trim() &&
    name.trim() &&
    commission !== "" &&
    !isNaN(parseFloat(commission)) &&
    parseFloat(commission) >= 0 &&
    parseFloat(commission) <= 100;

  return (
    <DialogBase
      title={mode === "create" ? "เพิ่มร้านสาขา" : "แก้ไขร้านสาขา"}
      onClose={onClose}
      actions={
        <>
          <Button kind="white" onClick={onClose} disabled={busy}>
            ยกเลิก
          </Button>
          <Button
            kind="primary"
            loading={busy}
            disabled={!canSave || busy}
            onClick={() =>
              onSave({
                code: normalizedCode,
                name: name.trim(),
                address: address.trim() || null,
                commissionRate: parseFloat(commission),
              })
            }
          >
            บันทึก
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            รหัสสาขา <span className="text-xs">(เช่น PNA-KRBR-GVT)</span>
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น PNA-KRBR-GVT"
          />
          <div className="text-xs text-slate-500 mt-1">
            จะถูกบันทึกเป็น: <b>{normalizedCode || "-"}</b>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">
            ชื่อร้านสาขา <span className="text-xs">(เช่น CLS-GVT)</span>
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น CLS-GVT"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">ที่อยู่</label>
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none min-h-[90px] text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="เช่น 140/8 หมู่ 3 ..."
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">ค่าคอมมิชชั่น (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder="เช่น 10"
          />
          <div className="text-xs text-slate-500 mt-1">0–100% เท่านั้น</div>
        </div>
      </div>
    </DialogBase>
  );
}

/* ---------- Page ---------- */
export default function BranchesPage() {
  // BG เนื้อหา: ขาวอมฟ้านวล ๆ + การ์ดเป็นเกรเดียน
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await getBranches();
        if (!cancelled) setRows(data || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.response?.data?.error || "โหลดรายการสาขาไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (b) =>
        (b.code || "").toLowerCase().includes(s) ||
        (b.name || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const columns = [
    { key: "code", header: "รหัสสาขา" },
    { key: "name", header: "ชื่อร้านสาขา" },
    { key: "address", header: "ที่อยู่" },
    {
      key: "commissionRate",
      header: "คอมมิชชั่น (%)",
      render: (v) =>
        v === null || v === undefined ? "-" : Number(v).toLocaleString(),
    },
    {
      key: "tools",
      header: "เครื่องมือ",
      render: (_, row) => (
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              kind="white"
              className="px-2 py-1"
              title="แก้ไข"
              onClick={() => setEditing(row)}
              leftIcon={<Pencil size={16} />}
            >
              แก้ไข
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function handleCreate(payload) {
    setSaving(true);
    try {
      const created = await createBranch(payload);
      setRows((prev) => [...prev, created]);
      setCreating(false);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "บันทึกสาขาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id, payload) {
    setSaving(true);
    try {
      const updated = await updateBranch(id, payload);
      setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "แก้ไขสาขาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      {/* BG เนื้อหา: ขาวอมฟ้านวล ๆ */}
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">
          {/* ส่วนที่ 1 — ค้นหา + ปุ่มเพิ่ม (การ์ดเกรเดียน) */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
              <input
                className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-white focus:ring-2 focus:ring-white/50"
                placeholder="ค้นหารหัส/ชื่อร้านสาขา…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button
                kind="white"
                onClick={() => setCreating(true)}
                disabled={!isAdmin}
                title={isAdmin ? "เพิ่มร้านสาขา" : "เฉพาะ ADMIN"}
                leftIcon={<Plus size={18} />}
              >
                เพิ่มร้านสาขา
              </Button>
            </div>
          </Card>

          {/* ส่วนที่ 2 — ตาราง (การ์ดเกรเดียน + กล่องภายในขาวโปร่ง) */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-2 sm:p-3 md:p-4">
              <Table
                columns={columns}
                data={filtered.map((b) => ({ ...b, tools: "" }))}
                loading={loading}
              />
              {error && (
                <div className="mt-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50 p-3">
                  {error}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {creating && (
        <BranchDialog
          mode="create"
          busy={saving}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
        />
      )}
      {editing && (
        <BranchDialog
          mode="edit"
          initial={editing}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={(payload) => handleUpdate(editing.id, payload)}
        />
      )}
    </div>
  );
}
