import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { Search, Pencil, Plus } from "lucide-react";
import { listProductTypes, createProductType, updateProductType } from "@/services/productTypes.api";
import ProductTypeModal from "@/components/products/ProductTypeModal";
import { useAuthStore } from "@/store/authStore";

/**
 * แผงตาราง “หมวดหมู่สินค้า” สำหรับใช้ในหน้า Products
 *
 * props:
 *  - onPick?: (type) => void   // เวลาเลือกหมวด (คลิกแถว) จะเรียกกลับให้ parent ใช้งาน เช่น กรองสินค้า
 */
export default function ProductTypesPanel({ onPick }) {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = String(role || "").toUpperCase() === "ADMIN";

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // modal (รวมเพิ่ม/แก้ไข)
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);

  async function fetchTypes({ search = q, pageNum = page } = {}) {
    try {
      setLoading(true);
      const data = await listProductTypes({ search, page: pageNum, pageSize });
      const items = data?.items ?? data ?? [];
      setRows(items);
      setTotal(data?.total ?? items.length);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  function openCreate() {
    setMode("create");
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row) {
    setMode("edit");
    setEditing(row);
    setOpen(true);
  }

  async function handleSubmit(...args) {
    try {
      setBusy(true);
      if (mode === "create") {
        const payload = args[0]; // { name, code? }
        await createProductType(payload);
      } else {
        const [id, payload] = args; // (id, { name, code? })
        await updateProductType(id, payload);
      }
      setOpen(false);
      await fetchTypes({ pageNum: 1 });
      setPage(1);
    } catch (e) {
      alert(e?.response?.data?.error || "บันทึกหมวดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">หมวดหมู่สินค้า</div>
        {isAdmin && (
          <Button kind="success" size="sm" leftIcon={<Plus size={16} />} onClick={openCreate}>
            เพิ่มหมวด
          </Button>
        )}
      </div>

      <div className="rounded-2xl bg-white/95 p-3 text-slate-800">
        {/* Search bar */}
        <div className="flex items-center gap-2 mb-3">
          <Search size={16} className="opacity-70" />
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
            placeholder="ค้นหาหมวด (ชื่อ/รหัส)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchTypes({ search: e.target.value, pageNum: 1 }))}
          />
          <Button kind="white" onClick={() => (setPage(1), fetchTypes({ search: q, pageNum: 1 }))}>ค้นหา</Button>
        </div>

        {/* Table */}
        <Table.Root>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[160px]">รหัส</Table.Th>
              <Table.Th>ชื่อหมวด</Table.Th>
              <Table.Th className="w-[140px] text-right">เครื่องมือ</Table.Th>
            </Table.Tr>
          </Table.Head>
          <Table.Body loading={loading}>
            {rows.map((r) => (
              <Table.Tr key={r.id} className="cursor-pointer" onClick={() => onPick?.(r)}>
                <Table.Td className="font-mono">{r.code || "-"}</Table.Td>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td className="text-right">
                  {isAdmin && (
                    <Button
                      kind="editor"
                      size="sm"
                      leftIcon={<Pencil size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(r);
                      }}
                    >
                      แก้ไข
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {!loading && rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} className="text-center text-slate-500 py-6">ไม่พบหมวดหมู่</Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table.Root>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-slate-600">หน้า {page} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button kind="white" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ก่อนหน้า
            </Button>
            <Button kind="white" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              ถัดไป
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: create/edit (ADMIN only) */}
      {isAdmin && (
        <ProductTypeModal
          open={open}
          mode={mode}
          initial={mode === "edit" ? editing : null}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          busy={busy}
        />
      )}
    </Card>
  );
}
