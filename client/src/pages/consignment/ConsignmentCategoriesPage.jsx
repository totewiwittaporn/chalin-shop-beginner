import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import Button from "@/components/ui/Button.jsx";
import { listShops } from "@/services/consignmentShops.api.js";
import { createCategory, listCategories, updateCategory } from "@/services/consignmentCategories.api.js";
import { Plus, Pencil, Search } from "lucide-react";

export default function ConsignmentCategoriesPage() {
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState(null);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  // โหลดรายชื่อร้าน
  useEffect(() => {
    (async () => {
      try {
        const shops = await listShops();
        setPartners(shops || []);
        setPartnerId(shops?.[0]?.id || null);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // โหลดหมวดของร้านที่เลือก + รองรับ q
  useEffect(() => {
    if (!partnerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError("");
        const cats = await listCategories(partnerId, q);
        if (!cancelled) setRows(cats || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.response?.data?.error || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [partnerId, q]);

  const filtered = useMemo(() => rows, [rows]); // server-side filtered

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setOpen(true);
  }
  function openEdit(row) {
    setEditing(row);
    setCode(row.code || "");
    setName(row.name || "");
    setOpen(true);
  }
  function closeModal() { setOpen(false); setEditing(null); }

  async function handleSave() {
    const c = String(code || "").trim();
    const n = String(name || "").trim();
    if (!partnerId || !c || !n) return;

    try {
      if (editing) {
        const updated = await updateCategory(editing.id, { code: c, name: n });
        setRows(prev => prev.map(x => x.id === editing.id ? updated : x));
      } else {
        const created = await createCategory({ partnerId, code: c, name: n });
        setRows(prev => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* แถว: เลือกร้าน + ค้นหา + เพิ่ม */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3 items-center">
              <select
                className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                value={partnerId || ""}
                onChange={(e)=> setPartnerId(Number(e.target.value) || null)}
                title="เลือกร้านฝากขาย"
              >
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <div className="flex items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                  placeholder="ค้นหาหมวด (รหัส/ชื่อ)"
                  value={q} onChange={(e)=> setQ(e.target.value)}
                />
              </div>

              <Button kind="success" onClick={openCreate} leftIcon={<Plus size={18} />}>
                เพิ่มหมวด
              </Button>
            </div>
          </Card>

          {/* ตาราง */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[140px]">รหัส</Table.Th>
                    <Table.Th>ชื่อหมวด</Table.Th>
                    <Table.Th className="w-[120px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body>
                  {loading && (
                    <Table.Tr>
                      <Table.Td colSpan={3}>กำลังโหลด...</Table.Td>
                    </Table.Tr>
                  )}
                  {!loading && filtered.length === 0 && !error && (
                    <Table.Tr>
                      <Table.Td colSpan={3}>ยังไม่มีหมวดหมู่</Table.Td>
                    </Table.Tr>
                  )}
                  {!loading && error && (
                    <Table.Tr>
                      <Table.Td colSpan={3} className="text-red-600">เกิดข้อผิดพลาด: {error}</Table.Td>
                    </Table.Tr>
                  )}
                  {!loading && !error && filtered.map(r => (
                    <Table.Tr key={r.id}>
                      <Table.Td className="font-mono">{r.code}</Table.Td>
                      <Table.Td>{r.name}</Table.Td>
                      <Table.Td className="text-right">
                        <Button
                          kind="editor"
                          size="sm"
                          className="px-2 py-1"
                          onClick={()=> openEdit(r)}
                          leftIcon={<Pencil size={16} />}
                        >
                          แก้ไข
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-[95vw] max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white px-5 py-3 font-semibold">
              {editing ? "แก้ไขหมวด" : "เพิ่มหมวด"}
            </div>
            <div className="bg-white p-5">
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">รหัสหมวด</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
                    value={code} onChange={(e)=> setCode(e.target.value)}
                    placeholder="เช่น SNK, BAG-CL"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">ชื่อหมวด</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
                    value={name} onChange={(e)=> setName(e.target.value)}
                    placeholder="เช่น Sneakers, กระเป๋า-สะพาย"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button kind="danger" onClick={closeModal}>ยกเลิก</Button>
                <Button kind="success" onClick={handleSave} disabled={!code.trim() || !name.trim()}>บันทึก</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
