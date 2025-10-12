import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import BarcodeImage from "@/components/ui/BarcodeImage";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { Search } from "lucide-react";

const debounce = (fn, ms = 400) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const money = (n) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(n || 0));

export default function InventoryPage() {
  const [q, setQ] = useState("");
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openScan, setOpenScan] = useState(false);
  const inputRef = useRef(null);

  // TODO: ดึงจาก /api/branches จริง
  const [branches, setBranches] = useState([{ id: 1, name: "สาขาหลัก" }, { id: 2, name: "สาขา A" }]);

  const fetchInventory = useMemo(
    () => debounce(async (params = {}) => {
      try {
        setLoading(true);
        const res = await api.get("/api/inventory", {
          params: { q: params.q ?? q, branchId: params.branchId ?? branchId },
        });
        setItems(res.data.items || []);
      } finally { setLoading(false); }
    }, 300),
    [q, branchId]
  );

  useEffect(() => { fetchInventory({ q, branchId }); }, [q, branchId, fetchInventory]);

  const totalQty = items.reduce((s, i)=> s + Number(i.qty || 0), 0);
  const totalValue = items.reduce((s, i)=> s + (Number(i.qty || 0) * Number(i.costPrice || 0)), 0);

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* Header Filters */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="flex items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e)=> setQ(e.target.value)}
                  onKeyDown={(e)=> e.key === "Enter" && fetchInventory({ q, branchId })}
                  className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                  placeholder="ค้นหาด้วยบาร์โค้ด / ชื่อสินค้า"
                />
                <Button kind="white" onClick={()=> setOpenScan(true)}>สแกน</Button>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <select
                  className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                  value={branchId}
                  onChange={(e)=> setBranchId(e.target.value)}
                >
                  <option value="">ทุกสาขา</option>
                  {branches.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-2 pb-3 text-sm text-slate-600">
                <div>พบ {items.length.toLocaleString()} รายการ</div>
                <div className="flex gap-4">
                  <span>จำนวนรวม: <b>{totalQty.toLocaleString()}</b></span>
                  <span>มูลค่าทุนรวม: <b>{money(totalValue)}</b></span>
                </div>
              </div>

              <Table>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[160px]">Barcode</Table.Th>
                    <Table.Th>ชื่อสินค้า</Table.Th>
                    <Table.Th className="w-[160px] text-right">คงเหลือ</Table.Th>
                    <Table.Th className="w-[160px] text-right">ต้นทุน/หน่วย</Table.Th>
                    <Table.Th className="w-[180px] text-right">มูลค่าทุน</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {items.map(it => (
                    <Table.Tr key={it.productId + ':' + (branchId || 'all')}>
                      <Table.Td className="font-mono text-sm"><BarcodeImage value={it.barcode} /></Table.Td>
                      <Table.Td>{it.name}</Table.Td>
                      <Table.Td className="text-right">{Number(it.qty || 0).toLocaleString()}</Table.Td>
                      <Table.Td className="text-right">{money(it.costPrice)}</Table.Td>
                      <Table.Td className="text-right">{money(Number(it.qty || 0) * Number(it.costPrice || 0))}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && items.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="py-8 text-center text-muted">ไม่พบข้อมูลสต็อก</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      <BarcodeScannerModal
        open={openScan}
        onClose={()=> setOpenScan(false)}
        onDetected={(code)=>{ setQ(code); fetchInventory({ q: code, branchId }); inputRef.current?.focus(); }}
      />
    </div>
  );
}
