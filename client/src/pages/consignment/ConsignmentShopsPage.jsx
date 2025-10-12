import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import Button from "@/components/ui/Button.jsx";
import { Plus, Pencil, Search } from "lucide-react";
import { listShops, createShop, updateShop } from "@/services/consignmentShops.api.js";
import ConsignmentShopFormModal from "@/components/consignment/ConsignmentShopFormModal.jsx";

export default function ConsignmentShopsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // ALL | ACTIVE | INACTIVE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await listShops({ q, status: status || undefined });
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.response?.data?.error || e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, status]);

  const filtered = useMemo(() => rows, [rows]); // ถูกกรองจาก API แล้ว

  async function handleCreate(payload) {
    setSaving(true);
    try {
      const created = await createShop(payload);
      setRows((prev) => [created, ...prev]);
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id, payload) {
    setSaving(true);
    try {
      const updated = await updateShop(id, payload);
      setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "แก้ไขไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      {/* BG เนื้อหา: ขาวอมฟ้านวล */}
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">
          {/* ค้นหา + ปุ่มเพิ่ม */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="flex items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-500 focus:border-white focus:ring-2 focus:ring-white/50"
                  placeholder="ค้นหา code / name..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <select
                className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 focus:border-white focus:ring-2 focus:ring-white/50"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                title="กรองสถานะ"
              >
                <option value="">ทั้งหมด</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <Button kind="success" onClick={() => { setEditing(null); setOpen(true); }} leftIcon={<Plus size={18} />}>
                เพิ่มร้านฝากขาย
              </Button>
            </div>
          </Card>

          {/* ตาราง */}
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
                    <Table.Th>รหัส</Table.Th>
                    <Table.Th>ชื่อร้าน</Table.Th>
                    <Table.Th>สถานะ</Table.Th>
                    <Table.Th className="w-[120px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body>
                  {loading && (
                    <Table.Tr>
                      <Table.Td colSpan={4}>กำลังโหลดข้อมูล...</Table.Td>
                    </Table.Tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4}>ไม่พบข้อมูล</Table.Td>
                    </Table.Tr>
                  )}
                  {!loading &&
                    filtered.map((r) => (
                      <Table.Tr key={r.id}>
                        <Table.Td>{r.code}</Table.Td>
                        <Table.Td>{r.name}</Table.Td>
                        <Table.Td>
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              r.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700",
                            ].join(" ")}
                          >
                            {r.status}
                          </span>
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Button
                            kind="editor"
                            size="sm"
                            className="px-2 py-1"
                            leftIcon={<Pencil size={16} />}
                            onClick={() => { setEditing(r); setOpen(true); }}
                          >
                            แก้ไข
                          </Button>
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

      {/* Modal */}
      <ConsignmentShopFormModal
        open={open}
        mode={editing ? "edit" : "create"}
        initial={editing}
        busy={saving}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSubmit={(payload) =>
          editing ? handleUpdate(editing.id, payload) : handleCreate(payload)
        }
      />
    </div>
  );
}
