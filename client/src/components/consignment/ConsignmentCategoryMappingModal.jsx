import { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { Search, ScanLine } from "lucide-react";
import api from "@/lib/axios";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

export default function ConsignmentCategoryMappingModal({
  open,
  partnerId,
  category,       // { id, name }
  onClose,
  onAdded,        // callback หลังเพิ่มสำเร็จ
}) {
  const formId = "consignment-mapping-modal";
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [openScan, setOpenScan] = useState(false);

  useEffect(() => {
    if (!open) return;
    const seed = sessionStorage.getItem("consignment.mapping.initialQuery");
    if (seed) {
      setQ(seed);
      sessionStorage.removeItem("consignment.mapping.initialQuery");
      search(seed);
    } else {
      setQ("");
      setRows([]);
      setPicked(new Set());
    }
  }, [open]);

  async function search(keyword) {
    if (!keyword?.trim()) { setRows([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/api/products", { params: { q: keyword, page: 1, pageSize: 50 } });
      setRows(data?.items || data || []);
    } finally {
      setLoading(false);
    }
  }

  function togglePick(id) {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!category?.id || picked.size === 0) return;
    const ids = Array.from(picked);
    await api.post(`/api/consignment/categories/${category.id}/products`, { productIds: ids });
    await onAdded?.();
  }

  const canAdd = useMemo(() => picked.size > 0, [picked]);
  const triggerSubmit = () => {
    const f = document.getElementById(formId);
    if (f) f.requestSubmit();
  };

  return (
    <>
      <GlassModal
        open={open}
        title={category ? `เพิ่มสินค้าเข้า: ${category.name}` : "เพิ่มสินค้าเข้าหมวด"}
        onClose={onClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button kind="danger" type="button" onClick={onClose}>ยกเลิก</Button>
            <Button kind="success" type="button" onClick={triggerSubmit} disabled={!canAdd}>
              เพิ่มสินค้า
            </Button>
          </div>
        }
      >
        {!category ? (
          <div className="text-slate-600">ยังไม่เลือกหมวด</div>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="grid gap-3">
            <div className="flex items-center gap-2">
              <Search size={16} className="opacity-70" />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                placeholder="พิมพ์ชื่อสินค้า/บาร์โค้ด แล้วกด Enter"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search(q))}
              />
              <Button kind="white" type="button" onClick={() => search(q)}>ค้นหา</Button>
              <Button kind="white" type="button" onClick={() => setOpenScan(true)} leftIcon={<ScanLine size={16} />}>
                สแกน
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[60px] text-center">เลือก</Table.Th>
                    <Table.Th className="w-[160px]">Barcode</Table.Th>
                    <Table.Th>ชื่อสินค้า</Table.Th>
                    <Table.Th className="w-[140px] text-right">ราคาขาย</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {rows.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td className="text-center">
                        <input
                          type="checkbox"
                          checked={picked.has(r.id)}
                          onChange={() => togglePick(r.id)}
                        />
                      </Table.Td>
                      <Table.Td className="font-mono">{r.barcode}</Table.Td>
                      <Table.Td>{r.name}</Table.Td>
                      <Table.Td className="text-right">
                        {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(r.salePrice || 0)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4} className="text-center text-slate-500 py-6">
                        พิมพ์คำค้นหรือสแกนบาร์โค้ดเพื่อค้นหา
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
            </div>
          </form>
        )}
      </GlassModal>

      <BarcodeScannerModal
        open={openScan}
        onClose={() => setOpenScan(false)}
        onDetected={(code) => { setOpenScan(false); setQ(code); search(code); }}
      />
    </>
  );
}
