import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx"; // มี subcomponents: Head, Body, Tr, Th, Td
import Button from "@/components/ui/Button.jsx";
import api from "@/lib/api";
import { listUsers, updateUser } from "@/services/users.api.js";

/* ---------- Helpers ---------- */
const ROLES = ["ADMIN", "STAFF", "CONSIGNMENT", "QUOTE_VIEWER"];
const pickArray = (res) => res?.data?.items ?? res?.data?.rows ?? res?.data?.data ?? res?.data ?? [];

/** ลองยิงหลาย endpoint เผื่อโปรเจกต์คุณใช้เส้นทางที่ต่างกัน */
async function fetchManyCandidates(candidates = []) {
  for (const { url, params } of candidates) {
    try {
      const res = await api.get(url, { params });
      const arr = pickArray(res);
      if (Array.isArray(arr) && arr.length >= 0) return arr;
    } catch (_) {} // ลองตัวต่อไป
  }
  return [];
}

function RolePill({ role }) {
  const r = String(role || "").toUpperCase();
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs";
  const tone =
    r === "ADMIN"
      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
      : r === "STAFF"
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : r === "CONSIGNMENT"
      ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  return <span className={`${base} ${tone}`}>{r || "-"}</span>;
}

/* ---------- Edit Modal ---------- */
function EditUserModal({ open, user, branches, partners, onClose, onSaved }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "STAFF");
  const [branchId, setBranchId] = useState(user?.branchId ?? null);
  const [partnerId, setPartnerId] = useState(user?.partnerId ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(user?.name || "");
    setEmail(user?.email || "");
    setRole(user?.role || "STAFF");
    setBranchId(user?.branchId ?? null);
    setPartnerId(user?.partnerId ?? null);
  }, [open, user]);

  const isStaff = role === "STAFF";
  const isConsign = role === "CONSIGNMENT";

  async function handleSave() {
    try {
      setSaving(true);
      const body = { name, email, role };

      if (isStaff) {
        if (!branchId) {
          alert("STAFF ต้องเลือกสาขา (Branch)");
          setSaving(false);
          return;
        }
        body.branchId = Number(branchId);
        body.partnerId = null;
      } else if (isConsign) {
        if (!partnerId) {
          alert("CONSIGNMENT ต้องเลือกร้านฝากขาย (Partner)");
          setSaving(false);
          return;
        }
        body.partnerId = Number(partnerId);
        body.branchId = null;
      } else {
        body.branchId = null;
        body.partnerId = null;
      }

      const updated = await updateUser(user.id, body);
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "บันทึกล้มเหลว";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">แก้ไขผู้ใช้</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">ชื่อ</label>
              <input className="w-full border rounded p-2"
                     value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full border rounded p-2"
                     value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Role</label>
              <select className="w-full border rounded p-2"
                      value={role} onChange={(e)=>setRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                * หน้านี้ “ไม่แสดง” ผู้ใช้ที่เป็น ADMIN แต่ยังสามารถปรับ Role เป็น ADMIN ได้
              </div>
            </div>

            {isStaff && (
              <div>
                <label className="block text-sm mb-1">สังกัดสาขา (Branch) *</label>
                <select className="w-full border rounded p-2"
                        value={branchId ?? ""}
                        onChange={(e)=>setBranchId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— เลือกสาขา —</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name || `#${b.id}`}</option>
                  ))}
                </select>
                {branches.length === 0 && (
                  <div className="text-xs text-amber-600 mt-1">ยังไม่พบข้อมูลสาขา</div>
                )}
              </div>
            )}

            {isConsign && (
              <div>
                <label className="block text-sm mb-1">สังกัดร้านฝากขาย (Partner) *</label>
                <select className="w-full border rounded p-2"
                        value={partnerId ?? ""}
                        onChange={(e)=>setPartnerId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— เลือกร้านฝากขาย —</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name || `#${p.id}`}</option>
                  ))}
                </select>
                {partners.length === 0 && (
                  <div className="text-xs text-amber-600 mt-1">ยังไม่พบข้อมูลร้านฝากขาย</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [branches, setBranches] = useState([]);
  const [partners, setPartners] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // โหลดอ้างอิง: Branches / Partners (รองรับหลาย endpoint + โครงสร้างผลลัพธ์)
  useEffect(() => {
    (async () => {
      const commonParams = { status: "ACTIVE", pageSize: 500 };

      const br = await fetchManyCandidates([
        { url: "/api/branches", params: commonParams },
        { url: "/api/branches/list", params: commonParams },
      ]);
      setBranches(br);

      const pa = await fetchManyCandidates([
        { url: "/api/consignment/partners", params: commonParams },
        { url: "/api/consignment/partners/list", params: commonParams },
      ]);
      setPartners(pa);
    })();
  }, []);

  // โหลด users
  async function loadUsers() {
    try {
      setLoading(true);
      const res = await listUsers({ excludeRole: "ADMIN" });
      setItems(res.items || []);
    } catch (e) {
      console.error(e);
      alert("โหลดรายชื่อผู้ใช้ล้มเหลว");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadUsers(); }, []);

  // map id -> entity
  const branchById = useMemo(() => {
    const m = new Map();
    branches.forEach(b => m.set(b.id, b));
    return m;
  }, [branches]);
  const partnerById = useMemo(() => {
    const m = new Map();
    partners.forEach(p => m.set(p.id, p));
    return m;
  }, [partners]);

  // filter
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(u =>
      (u.name || "").toLowerCase().includes(keyword) ||
      (u.email || "").toLowerCase().includes(keyword) ||
      (u.role || "").toLowerCase().includes(keyword)
    );
  }, [items, q]);

  return (
    <div className="space-y-6">
      <Card title="Users (ไม่รวม ADMIN)">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <input
            className="flex-1 border rounded-2xl px-4 py-2"
            placeholder="ค้นหา: ชื่อ / อีเมล / role"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <div className="text-sm text-gray-500">
            ทั้งหมด: <b>{filtered.length}</b> รายการ
          </div>
        </div>

        <div className="mt-4">
          <Table>
            <Table.Head>
              <Table.Tr>
                <Table.Th className="w-16">#</Table.Th>
                <Table.Th>ชื่อ</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th className="w-40">Role</Table.Th>
                <Table.Th className="min-w-[220px]">สังกัด</Table.Th>
                <Table.Th className="w-28 text-right">การกระทำ</Table.Th>
              </Table.Tr>
            </Table.Head>

            <Table.Body loading={loading}>
              {!loading && filtered.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={999} className="text-center text-sm py-10 text-slate-500">
                    ไม่พบข้อมูล
                  </Table.Td>
                </Table.Tr>
              )}

              {filtered.map((u, idx) => {
                const b = u.branchId ? branchById.get(u.branchId) : null;
                const p = u.partnerId ? partnerById.get(u.partnerId) : null;
                const place = b
                  ? `Branch: ${b.name || "#" + b.id}`
                  : p
                  ? `Consignment: ${p.name || "#" + p.id}`
                  : "-";
                return (
                  <Table.Tr key={u.id}>
                    <Table.Td className="text-slate-500">{idx + 1}</Table.Td>
                    <Table.Td className="font-medium">{u.name || "-"}</Table.Td>
                    <Table.Td>{u.email || "-"}</Table.Td>
                    <Table.Td><RolePill role={u.role} /></Table.Td>
                    <Table.Td>{place}</Table.Td>
                    <Table.Td>
                      <div className="flex justify-end">
                        <Button size="xs" onClick={() => { setSelected(u); setModalOpen(true); }}>
                          แก้ไข
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      </Card>

      <EditUserModal
        open={modalOpen}
        user={selected}
        branches={branches}
        partners={partners}
        onClose={() => setModalOpen(false)}
        onSaved={(updated) => {
          setItems(prev => prev.map(x => (x.id === updated.id ? updated : x)));
        }}
      />
    </div>
  );
}
