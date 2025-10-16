// client/src/pages/inventory/InventoryPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import BarcodeImage from "@/components/ui/BarcodeImage";
import { Search, ScanLine } from "lucide-react";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import InventoryCountPanel from "@/components/inventory/InventoryCountPanel";

/** utility */
const nf = (n) => Number(n || 0).toLocaleString();

export default function InventoryPage() {
  // ------- Filters / query states -------
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("ALL"); // ALL | BRANCH | CONSIGNMENT
  const [branchId, setBranchId] = useState("");
  const [partnerId, setPartnerId] = useState("");

  // ------- Master data -------
  const [branches, setBranches] = useState([]);
  const [partners, setPartners] = useState([]);

  // ------- Inventory table -------
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);

  // ------- Scanner modal -------
  const [openScan, setOpenScan] = useState(false);
  const inputRef = useRef(null);

  // Load master (branches/partners)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          api.get("/api/branches"),
          api.get("/api/consignment/partners", { params: { status: "ACTIVE", page: 1, pageSize: 500, q: "" } }),
        ]);
        if (!alive) return;
        setBranches(bRes.data?.items || bRes.data || []);
        setPartners(pRes.data?.items || pRes.data || []);
      } catch (e) {
        console.error("[inventory] load masters", e);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load inventory items (DB) with debounce
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { q, page, pageSize };
        if (mode === "BRANCH" && branchId) {
          params.branchId = branchId;
        } else if (mode === "CONSIGNMENT" && partnerId) {
          params.consignmentPartnerId = partnerId;
        }
        const { data } = await api.get("/api/inventory", { params });
        if (!alive) return;
        setRows(data.items || []);
        // ถ้า backend ยังไม่ส่ง total ให้คำนวณจากความยาวชั่วคราว
        setCount(Number(data.total ?? (data.items?.length || 0)));
      } catch (e) {
        console.error("[inventory] load list", e);
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [q, mode, branchId, partnerId, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  // handle scanning from modal
  function onDetected(code) {
    setQ(code || "");
    setOpenScan(false);
    inputRef.current?.focus();
  }

  // reset pagination when filters change
  useEffect(() => { setPage(1); }, [q, mode, branchId, partnerId]);

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* ===================== Filter + Tools Card ===================== */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-center">

              {/* Search + filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  ref={inputRef}
                  className="w-[260px] sm:w-[340px] rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                  placeholder="ค้นหา (บาร์โค้ด/ชื่อสินค้า)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />

                <select
                  className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                  value={mode}
                  onChange={(e) => { setMode(e.target.value); setBranchId(""); setPartnerId(""); }}
                >
                  <option value="ALL">ทุกที่</option>
                  <option value="BRANCH">ร้านสาขา</option>
                  <option value="CONSIGNMENT">ร้านฝากขาย</option>
                </select>

                {mode === "BRANCH" && (
                  <select
                    className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">-- เลือกสาขา --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || `สาขา #${b.id}`}
                      </option>
                    ))}
                  </select>
                )}

                {mode === "CONSIGNMENT" && (
                  <select
                    className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                  >
                    <option value="">-- เลือกร้านฝากขาย --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || `Partner #${p.id}`}
                      </option>
                    ))}
                  </select>
                )}

                <Button kind="white" onClick={() => setOpenScan(true)} leftIcon={<ScanLine size={16} />}>
                  สแกน
                </Button>
              </div>

              {/* pagination quick */}
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm text-white/90">หน้า {page} / {totalPages}</span>
                <Button kind="white" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ก่อนหน้า
                </Button>
                <Button kind="white" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  ถัดไป
                </Button>
              </div>
            </div>
          </Card>

          {/* ===================== Inventory Table Card ===================== */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <div className="px-2 pb-3 text-sm text-slate-600">
                พบทั้งหมด {nf(count)} รายการ
              </div>

              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[160px]">Barcode</Table.Th>
                    <Table.Th>ชื่อสินค้า</Table.Th>
                    <Table.Th className="w-[120px] text-right">คงเหลือ</Table.Th>
                    <Table.Th className="w-[160px]">อัปเดต</Table.Th>
                    {mode !== "ALL" && (
                      <Table.Th className="w-[200px]">{mode === "BRANCH" ? "สาขา" : "ร้านฝากขาย"}</Table.Th>
                    )}
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {rows.map((r) => (
                    <Table.Tr key={`${r.productId}-${r.barcode}-${r.name}`}>
                      <Table.Td className="font-mono text-sm">
                        <BarcodeImage value={r.barcode || ""} />
                      </Table.Td>
                      <Table.Td>{r.name}</Table.Td>
                      <Table.Td className="text-right">{nf(r.qty)}</Table.Td>
                      <Table.Td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "-"}</Table.Td>
                      {mode !== "ALL" && (
                        <Table.Td>
                          {mode === "BRANCH"
                            ? (branches.find((b) => b.id === r.branchId)?.name ?? "-")
                            : (partners.find((p) => p.id === r.consignmentPartnerId)?.name ?? "-")}
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={mode !== "ALL" ? 5 : 4} className="text-center text-slate-500 py-6">
                        ไม่พบข้อมูล
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>

              {/* footer pager duplicate (optional) */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  หน้า {page} / {totalPages}
                </div>
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
          </Card>

          {/* ===================== Stock Count Panel (DB-connected) ===================== */}
          <InventoryCountPanel
            branches={branches}
            partners={partners}
          />
        </div>
      </div>

      <BarcodeScannerModal
        open={openScan}
        onClose={() => setOpenScan(false)}
        onDetected={onDetected}
      />
    </div>
  );
}
