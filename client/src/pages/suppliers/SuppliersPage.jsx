// client/src/pages/suppliers/SuppliersPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import GradientPanel from "@/components/theme/GradientPanel";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import SupplierFormModal from "@/components/suppliers/SupplierFormModal";
import { Search, Plus, Pencil, RefreshCcw } from "lucide-react";

const debounce = (fn, ms = 400) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export default function SuppliersPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchSuppliers = useMemo(
    () =>
      debounce(async (params = {}) => {
        setLoading(true);
        try {
          const res = await api.get("/api/suppliers", { params: { q: params.q ?? q, pageSize: 200 } });
          const data = Array.isArray(res?.data?.items) ? res.data.items : res?.data || [];
          setRows(data);
        } finally {
          setLoading(false);
        }
      }, 350),
    [q]
  );

  useEffect(() => { fetchSuppliers({ q }); }, [q, fetchSuppliers]);

  async function toggleActive(sup) {
    setLoading(true);
    try {
      await api.patch(`/api/suppliers/${sup.id}`, { isActive: !sup.isActive });
      fetchSuppliers({ q });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full p-4 sm:p-6 md:p-8">
      <div className="grid gap-6">
        {/* แผงค้นหา/เพิ่ม (ธีมเดียวกับ Consignment) */}
        <GradientPanel
          title="ซัพพลายเออร์"
          subtitle="ค้นหา/เพิ่ม/แก้ไขข้อมูลผู้ขาย"
          actions={
            <div className="flex items-center gap-2">
              <Button kind="white" leftIcon={<RefreshCcw size={16} />} onClick={() => fetchSuppliers({ q })}>
                รีเฟรช
              </Button>
              <Button
                kind="success"
                leftIcon={<Plus size={16} />}
                onClick={() => { setEditing(null); setShowForm(true); }}
              >
                เพิ่มซัพพลายเออร์
              </Button>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSuppliers({ q })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
              placeholder="ค้นหา: ชื่อ/ผู้ติดต่อ/โทรศัพท์/อีเมล/เลขภาษี"
            />
          </div>
        </GradientPanel>

        {/* ตารางผลลัพธ์ */}
        <GradientPanel
          title="รายการซัพพลายเออร์"
          subtitle={`ทั้งหมด ${rows.length.toLocaleString()} รายการ`}
          innerClassName="p-0"
        >
          <div className="rounded-2xl overflow-hidden">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th>ชื่อซัพพลายเออร์</Table.Th>
                  <Table.Th className="hidden lg:table-cell">ผู้ติดต่อ</Table.Th>
                  <Table.Th className="hidden md:table-cell">โทรศัพท์</Table.Th>
                  <Table.Th className="hidden lg:table-cell">อีเมล</Table.Th>
                  <Table.Th className="hidden xl:table-cell">เลขภาษี</Table.Th>
                  <Table.Th className="hidden md:table-cell">สถานะ</Table.Th>
                  <Table.Th className="w-[220px] text-right">เครื่องมือ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body loading={loading}>
                {rows.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>{s.name}</Table.Td>
                    <Table.Td className="hidden lg:table-cell">{s.contactName || "-"}</Table.Td>
                    <Table.Td className="hidden md:table-cell">{s.phone || "-"}</Table.Td>
                    <Table.Td className="hidden lg:table-cell">{s.email || "-"}</Table.Td>
                    <Table.Td className="hidden xl:table-cell font-mono">{s.taxId || "-"}</Table.Td>
                    <Table.Td className="hidden md:table-cell">
                      {s.isActive ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">ACTIVE</span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">INACTIVE</span>
                      )}
                    </Table.Td>
                    <Table.Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          kind="white"
                          leftIcon={<Pencil size={16} />}
                          onClick={() => { setEditing(s); setShowForm(true); }}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          size="sm"
                          kind={s.isActive ? "danger" : "success"}
                          onClick={() => toggleActive(s)}
                          disabled={loading}
                        >
                          {s.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!loading && rows.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="text-center py-8 text-slate-500">
                      ไม่พบข้อมูลซัพพลายเออร์
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Body>
            </Table.Root>
          </div>
        </GradientPanel>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข (GlassModal ธีมเดียวกับ consignment) */}
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
