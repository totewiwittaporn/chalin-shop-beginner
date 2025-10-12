// หน้า: ซื้อสินค้า (ธีม glass-blue)
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import { Search } from "lucide-react";

const debounce = (fn, ms = 400) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const money = (n) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(n || 0));

export default function PurchasesPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [openScan, setOpenScan] = useState(false);
  const inputRef = useRef(null);

  const fetchPurchases = useMemo(
    () => debounce(async (params = {}) => {
      try {
        setLoading(true);
        const res = await api.get("/api/purchases", {
          params: { q: params.q ?? q, page: params.page ?? page, pageSize, status: "PENDING" },
        });
        setList(res.data.items || []);
      } finally { setLoading(false); }
    }, 300),
    [q, page]
  );

  useEffect(() => { fetchPurchases({ q, page }); }, [q, page, fetchPurchases]);

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* ฟอร์มสร้างใบสั่งซื้อ */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
              <h2 className="mb-3 text-xl font-semibold">บันทึกการซื้อสินค้า</h2>
              <PurchaseForm onCreated={() => { setPage(1); fetchPurchases({ q, page: 1 }); }} />
            </div>
          </Card>

          {/* แถบค้นหา + ตารางใบสั่งซื้อรอรับเข้า */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center mb-3">
              <div className="flex items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e)=> setQ(e.target.value)}
                  onKeyDown={(e)=> e.key === "Enter" && fetchPurchases({ q, page: 1 })}
                  className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                  placeholder="ค้นหาใบสั่งซื้อ (เลขที่/ซัพพลายเออร์/บาร์โค้ดสินค้า)"
                />
                <Button kind="white" onClick={() => setOpenScan(true)}>สแกน</Button>
              </div>
            </div>

            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <Table>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[160px]">เลขที่</Table.Th>
                    <Table.Th>ซัพพลายเออร์</Table.Th>
                    <Table.Th className="w-[140px]">วันที่</Table.Th>
                    <Table.Th className="w-[140px] text-right">มูลค่ารวม</Table.Th>
                    <Table.Th className="w-[180px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {list.map((p)=> (
                    <Table.Tr key={p.id}>
                      <Table.Td className="font-mono">{p.code || ("PO-" + String(p.id).padStart(6,"0"))}</Table.Td>
                      <Table.Td>{p.supplier?.name || "-"}</Table.Td>
                      <Table.Td>{p.date ? new Date(p.date).toLocaleDateString() : "-"}</Table.Td>
                      <Table.Td className="text-right">{money(p.totalCost)}</Table.Td>
                      <Table.Td className="text-right">
                        <div className="inline-flex gap-2">
                          <Button size="sm" kind="white" onClick={async()=>{
                            await api.post(`/api/purchases/${p.id}/receive`);
                            fetchPurchases({ q, page });
                          }}>รับเข้า</Button>
                          <Button size="sm" kind="editor" onClick={()=> alert("TODO: รายละเอียด/แก้ไข")}>รายละเอียด</Button>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && list.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="py-8 text-center text-muted">ไม่มีรายการรอรับเข้า</Table.Td>
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
        onClose={() => setOpenScan(false)}
        onDetected={(code)=>{ setQ(code); fetchPurchases({ q: code, page: 1 }); inputRef.current?.focus(); }}
      />
    </div>
  );
}
