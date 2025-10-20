// @/components/products/ProductTypesPanel.jsx
import { useEffect, useMemo, useState } from "react";
import GradientPanel from "@/components/theme/GradientPanel";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { Search, Plus, Pencil, CheckCircle2 } from "lucide-react";
import ProductTypeModal from "./ProductTypeModal";
import { listProductTypes, createProductType, updateProductType } from "@/services/productTypes.api";

const debounce = (fn, ms = 350) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export default function ProductTypesPanel({ onPick }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchTypes = useMemo(
    () =>
      debounce(async (params = {}) => {
        setLoading(true);
        try {
          const res = await listProductTypes({
            q: params.q ?? q,
            page: params.page ?? page,
            pageSize: params.pageSize ?? pageSize,
          });
          const items = res?.items ?? res ?? [];
          setRows(Array.isArray(items) ? items : []);
          setTotal(res?.pagination?.total ?? items.length ?? 0);
        } catch (e) {
          console.error("load product types fail", e);
          setRows([]);
          setTotal(0);
        } finally {
          setLoading(false);
        }
      }, 350),
    [q, page, pageSize]
  );

  useEffect(() => { fetchTypes({ q, page, pageSize }); }, [q, page, pageSize, fetchTypes]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      (r.name || "").toLowerCase().includes(s) ||
      (r.code || "").toLowerCase().includes(s) ||
      (r.description || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(row) {
    setEditing(row);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      if (editing?.id) {
        const updated = await updateProductType(editing.id, payload);
        setRows(prev => prev.map(x => (x.id === editing.id ? updated : x)));
      } else {
        const created = await createProductType(payload);
        setRows(prev => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GradientPanel
      title="หมวดสินค้า"
      subtitle="เลือกกรองอย่างไว + เพิ่ม/แก้ไขได้ทันที"
      className="from-[#9db9ff] to-[#6f86ff]"
      innerClassName="space-y-3"
    >
      {/* แถบค้นหา + ปุ่มเพิ่ม (โทนเดียวกับ supplier) */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-white/90" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTypes({ q, page: 1 })}
            className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
            placeholder="ค้นหา: ชื่อ/รหัส/คำอธิบาย"
          />
        </div>
        <div className="flex items-center justify-end">
          <Button kind="success" leftIcon={<Plus size={16} />} onClick={openCreate}>เพิ่มหมวด</Button>
        </div>
      </div>

      {/* ตาราง — โครง/สไตล์ให้เหมือน SuppliersPage */}
      <div className="rounded-2xl overflow-hidden">
        <Table.Root>
          <Table.Head>
            <Table.Tr>
              <Table.Th>ชื่อหมวด</Table.Th>
              <Table.Th className="hidden md:table-cell">รหัส</Table.Th>
              <Table.Th className="hidden lg:table-cell">รายละเอียด</Table.Th>
              <Table.Th className="w-[220px] text-right">เครื่องมือ</Table.Th>
            </Table.Tr>
          </Table.Head>

          <Table.Body loading={loading}>
            {filtered.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td className="hidden md:table-cell font-mono">{r.code}</Table.Td>
                <Table.Td className="hidden lg:table-cell text-slate-600">{r.description || "-"}</Table.Td>
                <Table.Td className="text-right">
                  <div className="inline-flex gap-2">
                    {/* ปุ่ม 'เลือก' (ถ้ามี onPick จาก ProductsPage) */}
                    {onPick && (
                      <Button
                        size="sm"
                        kind="white"
                        leftIcon={<CheckCircle2 size={16} />}
                        onClick={() => onPick(r)}
                      >
                        เลือก
                      </Button>
                    )}
                    <Button size="sm" kind="white" leftIcon={<Pencil size={16} />} onClick={() => openEdit(r)}>
                      แก้ไข
                    </Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!loading && filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center py-8 text-slate-500">
                  ไม่พบหมวดสินค้า
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table.Root>
      </div>

      {/* (ออปชัน) footer/pagination เบา ๆ */}
      <div className="flex items-center justify-between p-2 text-xs text-slate-600">
        <span>ทั้งหมด {filtered.length} รายการ</span>
        <div className="flex gap-2">
          <Button kind="white" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>ก่อนหน้า</Button>
          <Button kind="white" onClick={() => setPage((p) => p + 1)}>ถัดไป</Button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductTypeModal
          open
          mode={editing ? "edit" : "create"}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          busy={saving}
        />
      )}
    </GradientPanel>
  );
}
