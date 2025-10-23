import { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { Search, ScanLine } from "lucide-react";
import api from "@/lib/axios";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

/**
 * ConsignmentCategoryMappingModal
 *
 * - ใช้เพิ่ม "สินค้า" เข้า "หมวดหมู่ของร้านฝากขาย (category ของ partner)"
 * - และสามารถ "กำหนดราคาฝากขายเฉพาะร้าน" ต่อชิ้นได้ในจังหวะเดียวกัน
 *
 * API ที่เรียกใช้:
 *   POST /api/consignment/categories/:categoryId/products
 *   body: { items: [{ productId: number, price?: number }] }
 */
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
  const [rows, setRows] = useState([]);        // ผลลัพธ์การค้นหาสินค้าทั้งหมด
  const [picked, setPicked] = useState(new Set()); // id ของสินค้าที่เลือกติ๊ก
  const [prices, setPrices] = useState({});    // เก็บราคาฝากขายเฉพาะร้านต่อ productId
  const [openScan, setOpenScan] = useState(false);

  // เมื่อ modal ถูกเปิด: โหลด query ที่ค้างไว้ (ถ้ามี) หรือรีเซ็ตสถานะ
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
      setPrices({});
    }
  }, [open]);

  // เรียกค้นสินค้า (ชื่อ/บาร์โค้ด)
  async function search(keyword) {
    if (!keyword?.trim()) { setRows([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/api/products", { params: { q: keyword, page: 1, pageSize: 50 } });
      // รองรับทั้ง data.items และ data (เผื่อ backend ส่งกลับมา 2 แบบ)
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setRows(items);
    } finally {
      setLoading(false);
    }
  }

  // toggle checkbox
  function togglePick(id) {
    const next = new Set(picked);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setPicked(next);
  }

  // เปลี่ยนราคาเฉพาะร้านของสินค้าแต่ละชิ้น
  function handlePriceChange(id, value) {
    setPrices((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  // ส่งข้อมูลไป backend ในรูปแบบ { items: [{ productId, price }] }
  async function handleSubmit(e) {
    e?.preventDefault();
    if (!category?.id || picked.size === 0) return;

    const items = Array.from(picked).map((pid) => ({
      productId: pid,
      // ส่งราคาเฉพาะเมื่อมีค่าที่แปลงเป็นตัวเลขได้
      price: prices[pid] !== undefined && prices[pid] !== "" && !Number.isNaN(Number(prices[pid]))
        ? Number(prices[pid])
        : undefined,
    }));

    await api.post(`/api/consignment/categories/${category.id}/products`, { items });
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
                    <Table.Th className="w-[130px] text-right">ราคาขายหลัก</Table.Th>
                    <Table.Th className="w-[160px] text-right">ราคาฝากขาย</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {rows.map((r) => {
                    const isPicked = picked.has(r.id);
                    return (
                      <Table.Tr key={r.id}>
                        <Table.Td className="text-center">
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={() => togglePick(r.id)}
                          />
                        </Table.Td>
                        <Table.Td className="font-mono">{r.barcode}</Table.Td>
                        <Table.Td>{r.name}</Table.Td>
                        <Table.Td className="text-right">
                          {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(r.salePrice || 0)}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            className={`w-28 text-right border rounded-md px-2 py-1 ${isPicked ? "" : "opacity-50"}`}
                            value={prices[r.id] ?? ""}
                            onChange={(e) => handlePriceChange(r.id, e.target.value)}
                            disabled={!isPicked}
                            placeholder={
                              // ใส่ placeholder เป็นราคาหลัก เพื่อช่วยตัดสินใจตั้งราคาฝากขาย
                              (r.salePrice ?? 0).toString()
                            }
                          />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {!loading && rows.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="text-center text-slate-500 py-6">
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