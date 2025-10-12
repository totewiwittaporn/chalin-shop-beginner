import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Input from "@/components/ui/Input";
import SupplierFormModal from "@/components/suppliers/SupplierFormModal";
import { Search, Plus, Pencil } from "lucide-react";

const debounce = (fn, ms = 400) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

export default function SuppliersPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchSuppliers = useMemo(
    () => debounce(async (params = {}) => {
      try {
        setLoading(true);
        const res = await api.get("/api/suppliers", { params: { q: params.q ?? q } });
        setList(res.data || []);
      } finally { setLoading(false); }
    }, 300),
    [q]
  );

  useEffect(() => { fetchSuppliers({ q }); }, [q, fetchSuppliers]);

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* Header glass-blue */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
              <div className="flex items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSuppliers({ q })}
                  className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                  placeholder="ค้นหาซัพพลายเออร์ (ชื่อ / โทรศัพท์ / อีเมล)"
                />
              </div>
              <div className="flex items-center justify-end">
                <Button kind="success" onClick={() => { setEditing(null); setShowForm(true); }} leftIcon={<Plus size={18} />}>
                  เพิ่มซัพพลายเออร์
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <Table>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th>ชื่อ</Table.Th>
                    <Table.Th className="hidden md:table-cell">เบอร์ติดต่อ</Table.Th>
                    <Table.Th className="hidden md:table-cell">อีเมล</Table.Th>
                    <Table.Th className="hidden md:table-cell">สถานะ</Table.Th>
                    <Table.Th className="w-[200px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {list.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>{s.name}</Table.Td>
                      <Table.Td className="hidden md:table-cell">{s.phone || "-"}</Table.Td>
                      <Table.Td className="hidden md:table-cell">{s.email || "-"}</Table.Td>
                      <Table.Td className="hidden md:table-cell">
                        {s.isActive ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">ACTIVE</span>
                        ) : (
                          <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">INACTIVE</span>
                        )}
                      </Table.Td>
                      <Table.Td className="text-right">
                        <div className="inline-flex gap-2">
                          <Button size="sm" kind="white" leftIcon={<Pencil size={16} />} onClick={() => { setEditing(s); setShowForm(true); }}>แก้ไข</Button>
                          <Button
                            size="sm"
                            kind={s.isActive ? "danger" : "success"}
                            onClick={async () => {
                              await api.patch(`/api/suppliers/${s.id}`, { isActive: !s.isActive });
                              fetchSuppliers({ q });
                            }}
                          >
                            {s.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          </Button>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && list.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="text-center py-8 text-muted">ไม่พบข้อมูลซัพพลายเออร์</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {showForm && (
        <SupplierFormModal
          supplier={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchSuppliers({ q }); }}
        />
      )}
    </div>
  );
}
