import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import Button from "@/components/ui/Button.jsx";
import { Plus, Pencil, X } from "lucide-react";
import { getBranches, createBranch, updateBranch } from "@/services/branches.api.js";
import { useAuthStore } from "@/store/authStore.js";

/* ---------- Dialog infra (ธีม Glass-Blue) ---------- */
function DialogBase({ title, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop เบลอ */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={onClose} />
      {/* กล่อง gradient + กล่องขาว */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-[95vw] max-w-2xl rounded-3xl p-[2px] shadow-2xl"
          style={{ background: "linear-gradient(135deg,#7aa6ff,#b8c7ff)" }}
        >
          <div className="rounded-3xl bg-[#f6f9ff]">
            <div className="flex items-center justify-between p-5">
              <div className="text-lg font-semibold text-slate-700">{title}</div>
              <button
                className="rounded-full p-2 hover:bg-slate-200/70 transition"
                onClick={onClose}
                aria-label="close"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>
            <div className="px-5 pb-2">{children}</div>
            <div className="px-5 pb-5 flex justify-end gap-2">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchDialog({ mode = "create", initial = {}, onClose, onSave, busy }) {
  const [code, setCode] = useState(initial.code || "");
  const [name, setName] = useState(initial.name || "");
  const [address, setAddress] = useState(initial.address || "");
  const [address2, setAddress2] = useState(initial.addressLine2 || "");
  const [address3, setAddress3] = useState(initial.addressLine3 || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [taxId, setTaxId] = useState(initial.taxId || "");
  const [commission, setCommission] = useState(
    typeof initial.commissionRate === "number" ? String(initial.commissionRate) : ""
  );

  const normalizedCode = (code || "").toUpperCase().replace(/\s+/g, "-");
  // บังคับแค่ code + name
  const canSave = normalizedCode.trim() && name.trim();

  const handleSave = () => {
    // ส่งเฉพาะคีย์ที่มีค่า เพื่อลดการชน schema ฝั่ง backend
    const payload = {};
    const put = (k, v) => {
      if (v !== "" && v !== undefined && v !== null) payload[k] = v;
    };

    put("code", normalizedCode);
    put("name", name.trim());
    put("address", (address || "").trim() || null);        // backend map → addressLine1
    put("addressLine2", (address2 || "").trim() || null);
    put("addressLine3", (address3 || "").trim() || null);
    put("phone", (phone || "").trim() || null);
    put("taxId", (taxId || "").trim() || null);
    if (commission !== "") payload.commissionRate = Number(commission);

    // ❌ เอา isMain ออกแล้ว — ไม่ผูกแนวคิด MAIN กับ Branch อีกต่อไป
    onSave?.(payload);
  };

  return (
    <DialogBase
      title={mode === "create" ? "เพิ่มร้านสาขา" : "แก้ไขร้านสาขา"}
      onClose={onClose}
      actions={
        <>
          <Button kind="danger" onClick={onClose} disabled={busy}>
            ยกเลิก
          </Button>
          <Button kind="success" loading={busy} disabled={!canSave || busy} onClick={handleSave}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {/* รหัสสาขา (เต็มบรรทัด) */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">รหัสสาขา</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น MAIN / BR-GVT"
          />
          <div className="text-xs text-slate-500 mt-1">
            จะถูกบันทึกเป็น: <b>{normalizedCode || "-"}</b>
          </div>
        </div>

        {/* ชื่อสาขา */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">ชื่อร้านสาขา</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Chalin Shop"
          />
        </div>

        {/* ที่อยู่ */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">ที่อยู่ (บรรทัดที่ 1)</label>
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none min-h-[90px] text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="เช่น 140/8 หมู่ 3 ..."
          />
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="ที่อยู่บรรทัด 2 (ถ้ามี)"
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
              value={address3}
              onChange={(e) => setAddress3(e.target.value)}
              placeholder="ที่อยู่บรรทัด 3 (ถ้ามี)"
            />
          </div>
        </div>

        {/* ติดต่อ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">เบอร์โทร</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 08x-xxx-xxxx"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">เลขภาษี (ถ้ามี)</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-2 focus:ring-primary/30"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="เลขผู้เสียภาษี 13 หลัก"
            />
          </div>
        </div>

        {/* ค่าคอมมิชชั่น (ออปชัน) */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">ค่าคอมมิชชั่น (%)</label>
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
          <div className="text-xs text-slate-500 mt-1">0–100% เท่านั้น (เว้นว่างได้)</div>
        </div>
      </div>
    </DialogBase>
  );
}

/* ---------- Page ---------- */
export default function BranchesPage() {
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
    (async () => {
      try {
        setLoading(true);
        const data = await getBranches();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("[Branches] fetch error:", e);
        if (!cancelled) setError(e?.response?.data?.error || e.message || "โหลดรายการสาขาไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
      {/* BG เนื้อหา: ขาวอมฟ้านวล */}
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">
          {/* ส่วนที่ 1 — ค้นหา + ปุ่มเพิ่ม */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
              <input
                className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-white focus:ring-2 focus:ring-white/50"
                placeholder="ค้นหารหัส/ชื่อร้านสาขา..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button
                kind="success"
                onClick={() => setCreating(true)}
                disabled={!isAdmin}
                title={isAdmin ? "เพิ่มร้านสาขา" : "เฉพาะ ADMIN"}
                leftIcon={<Plus size={18} />}
              >
                เพิ่มร้านสาขา
              </Button>
            </div>
          </Card>

          {/* ส่วนที่ 2 — ตาราง */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div
              className={[
                "rounded-2xl bg-white/95 p-2 sm:p-3 md:p-4",
                "text-slate-800",
                "[&_thead_th]:text-slate-600 [&_thead_th]:font-semibold",
                "[&_tbody_td]:text-slate-800",
                "[&_tbody_tr:nth-child(even)_td]:bg-slate-50/60",
                "[&_tbody_tr:hover_td]:bg-slate-100/60",
                "overflow-hidden",
              ].join(" ")}
            >
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th>รหัสสาขา</Table.Th>
                    <Table.Th>ชื่อร้านสาขา</Table.Th>
                    <Table.Th>ที่อยู่</Table.Th>
                    <Table.Th className="text-right">คอมมิชชั่น (%)</Table.Th>
                    <Table.Th className="w-[120px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>

                <Table.Body>
                  {loading && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>กำลังโหลดข้อมูล...</Table.Td>
                    </Table.Tr>
                  )}

                  {!loading && filtered.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>ไม่พบข้อมูล</Table.Td>
                    </Table.Tr>
                  )}

                  {!loading &&
                    filtered.map((b) => (
                      <Table.Tr key={b.id}>
                        <Table.Td>{b.code}</Table.Td>
                        <Table.Td>{b.name}</Table.Td>
                        <Table.Td className="whitespace-pre-line">{b.address || "-"}</Table.Td>
                        <Table.Td className="text-right">
                          {b.commissionRate == null ? "-" : Number(b.commissionRate).toLocaleString()}
                        </Table.Td>
                        <Table.Td className="text-right">
                          {isAdmin && (
                            <Button
                              kind="editor"
                              size="sm"
                              className="px-2 py-1"
                              title="แก้ไข"
                              onClick={() => setEditing(b)}
                              leftIcon={<Pencil size={16} />}
                            >
                              แก้ไข
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Body>
              </Table.Root>

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
          onSave={(payload) => {
            setSaving(true);
            createBranch(payload)
              .then((created) => setRows((prev) => [...prev, created]))
              .catch((e) => alert(e?.response?.data?.error || "บันทึกสาขาไม่สำเร็จ"))
              .finally(() => setSaving(false));
          }}
        />
      )}
      {editing && (
        <BranchDialog
          mode="edit"
          initial={editing}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            setSaving(true);
            updateBranch(editing.id, payload)
              .then((updated) => setRows((prev) => prev.map((x) => (x.id === editing.id ? updated : x))) )
              .catch((e) => alert(e?.response?.data?.error || "แก้ไขสาขาไม่สำเร็จ"))
              .finally(() => setSaving(false));
          }}
        />
      )}
    </div>
  );
}
