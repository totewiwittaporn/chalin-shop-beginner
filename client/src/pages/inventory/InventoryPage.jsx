import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import BarcodeImage from "@/components/ui/BarcodeImage";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { Search } from "lucide-react";
import { getBranches } from "@/services/branches.api";
import { getConsignmentPartners } from "@/services/consignmentPartners.api";

const debounce = (fn, ms = 400) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const money = (n) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(n || 0));

export default function InventoryPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openScan, setOpenScan] = useState(false);
  const inputRef = useRef(null);

  // === ตัวกรองแหล่งสต็อก ===
  // ALL = ทุกที่รวมกัน, BRANCH = สาขา, CONSIGN = ร้านฝากขาย
  const [locType, setLocType] = useState("ALL");
  const [branchId, setBranchId] = useState("");
  const [partnerId, setPartnerId] = useState("");

  // lists
  const [branches, setBranches] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadingLists(true);
        const [b, p] = await Promise.all([getBranches(), getConsignmentPartners()]);
        if (!ignore) {
          setBranches(Array.isArray(b) ? b : []);
          setPartners(Array.isArray(p) ? p : []);
        }
      } catch (e) {
        console.error("[Inventory] load lists failed:", e);
        if (!ignore) { setBranches([]); setPartners([]); }
      } finally {
        setLoadingLists(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const fetchInventory = useMemo(
    () => debounce(async () => {
      try {
        setLoading(true);
        const params = { q };
        if (locType === "BRANCH" && branchId) params.branchId = branchId;
        if (locType === "CONSIGN" && partnerId) params.consignmentPartnerId = partnerId;

        const res = await api.get("/api/inventory", { params });
        setItems(res.data?.items || []);
      } catch (e) {
        console.error("[Inventory] fetch failed:", e);
        setItems([]);
      } finally { setLoading(false); }
    }, 300),
    [q, locType, branchId, partnerId]
  );

  useEffect(() => { fetchInventory(); }, [q, locType, branchId, partnerId, fetchInventory]);

  const totalQty = items.reduce((s, i)=> s + Number(i.qty || 0), 0);
  const totalValue = items.reduce((s, i)=> s + (Number(i.qty || 0) * Number(i.costPrice || 0)), 0);

  // แปะคำอธิบายบริบท (ตารางไม่ได้แยกคอลัมน์สถานที่ต่อแถว เพราะ API รวมตามตัวกรอง)
  const contextLabel = (() => {
    if (locType === "ALL") return "มุมมอง: ทุกสาขา/ร้านฝากขาย";
    if (locType === "BRANCH") {
      const b = branches.find(x => String(x.id) === String(branchId));
      return `มุมมอง: สาขา — ${b ? (b.name + (b.code ? ` (${b.code})` : "")) : "เลือกสาขา"}`;
    }
    if (locType === "CONSIGN") {
      const p = partners.find(x => String(x.id) === String(partnerId));
      return `มุมมอง: ร้านฝากขาย — ${p ? (p.name + (p.code ? ` (${p.code})` : "")) : "เลือกร้านฝากขาย"}`;
    }
    return "";
  })();

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* Filters */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Search size={16} className="opacity-90" />
                  <input
                    ref={inputRef}
                    value={q}
                    onChange={(e)=> setQ(e.target.value)}
                    onKeyDown={(e)=> e.key === "Enter" && fetchInventory()}
                    className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                    placeholder="ค้นหาด้วยบาร์โค้ด / ชื่อสินค้า"
                  />
                  <Button kind="white" onClick={()=> setOpenScan(true)}>สแกน</Button>
                </div>

                {/* เลือกประเภทสถานที่ */}
                <div className="flex items-center gap-2 md:justify-end">
                  <select
                    className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                    value={locType}
                    onChange={(e)=> { setLocType(e.target.value); setBranchId(""); setPartnerId(""); }}
                    disabled={loadingLists}
                    title="เลือกว่าดูสต็อกจากที่ไหน"
                  >
                    <option value="ALL">ทุกที่</option>
                    <option value="BRANCH">เฉพาะสาขา</option>
                    <option value="CONSIGN">เฉพาะร้านฝากขาย</option>
                  </select>

                  {/* ตัวเลือกตามประเภท */}
                  {locType === "BRANCH" && (
                    <select
                      className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                      value={branchId}
                      onChange={(e)=> setBranchId(e.target.value)}
                      disabled={loadingLists}
                    >
                      <option value="">— เลือกสาขา —</option>
                      {branches.map(b=> (
                        <option key={b.id} value={b.id}>
                          {b.name}{b.code ? ` (${b.code})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {locType === "CONSIGN" && (
                    <select
                      className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                      value={partnerId}
                      onChange={(e)=> setPartnerId(e.target.value)}
                      disabled={loadingLists}
                    >
                      <option value="">— เลือกร้านฝากขาย —</option>
                      {partners.map(p=> (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.code ? ` (${p.code})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="text-sm opacity-90">{contextLabel}</div>
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
                    <Table.Tr key={it.productId + ':' + locType + ':' + (branchId || partnerId || 'all')}>
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
        onDetected={(code)=>{ setQ(code); inputRef.current?.focus(); }}
      />
    </div>
  );
}
