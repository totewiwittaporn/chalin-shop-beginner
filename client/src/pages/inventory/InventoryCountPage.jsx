
// client/src/pages/inventory/InventoryCountPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Input from "@/components/ui/Input";
import BarcodeImage from "@/components/ui/BarcodeImage";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { Search, ClipboardCheck, Save, CheckCircle2 } from "lucide-react";

const debounce = (fn, ms = 400) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

function numberFormat(n){ return Number(n||0).toLocaleString(); }

export default function InventoryCountPage() {
  const [scope, setScope] = useState("BRANCH"); // BRANCH | CONSIGNMENT
  const [branchId, setBranchId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [session, setSession] = useState(null);
  const [q, setQ] = useState("");
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openScan, setOpenScan] = useState(false);
  const inputRef = useRef(null);

  const [branches] = useState([{id:1,name:"สาขาหลัก"},{id:2,name:"สาขา A"}]);
  const [partners] = useState([{id:101,name:"Consign A"},{id:102,name:"Consign B"}]);

  const totalDelta = lines.reduce((s,l)=> s + (Number(l.countedQty||0) - Number(l.systemQty||0)), 0);

  async function createSession(){
    if ((scope==="BRANCH" && !branchId) || (scope==="CONSIGNMENT" && !partnerId)) return;
    setSaving(true);
    try {
      const res = await api.post("/api/stock-counts", {
        scope,
        branchId: scope==="BRANCH" ? Number(branchId) : null,
        consignmentPartnerId: scope==="CONSIGNMENT" ? Number(partnerId) : null,
      });
      setSession(res.data);
      setLines([]);
    } finally {
      setSaving(false);
    }
  }

  async function addByQuery(query){
    if (!session) return;
    setLoading(true);
    try {
      const r = await api.get("/api/products", { params: { q: query, page:1, pageSize: 5 } });
      const prod = (r.data.items||[])[0];
      if (!prod) return;
      const r2 = await api.get("/api/stock-counts/system-qty", {
        params: {
          scope,
          productId: prod.id,
          branchId: scope==="BRANCH" ? session.branchId : undefined,
          consignmentPartnerId: scope==="CONSIGNMENT" ? session.consignmentPartnerId : undefined
        }
      });
      const systemQty = Number(r2.data.qty||0);
      setLines(prev => {
        const idx = prev.findIndex(x => x.productId === prod.id);
        if (idx>=0) {
          const next = [...prev];
          next[idx].countedQty = Number(next[idx].countedQty||0) + 1;
          return next;
        }
        return [...prev, {
          productId: prod.id,
          barcode: prod.barcode,
          name: prod.name,
          systemQty,
          countedQty: systemQty,
        }];
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(){
    if (!session) return;
    setSaving(true);
    try {
      const payload = lines.map(l => ({
        productId: l.productId,
        systemQty: Number(l.systemQty||0),
        countedQty: Number(l.countedQty||0),
      }));
      await api.post(`/api/stock-counts/${session.id}/lines`, { lines: payload });
    } finally { setSaving(false); }
  }

  async function finalize(){
    if (!session) return;
    setSaving(true);
    try {
      await saveDraft();
      const res = await api.post(`/api/stock-counts/${session.id}/finalize`);
      setSession(res.data);
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3 items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/90">ขอบเขต:</span>
                <select
                  className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                  value={scope}
                  onChange={(e)=> { setScope(e.target.value); setBranchId(""); setPartnerId(""); setSession(null); setLines([]); }}
                >
                  <option value="BRANCH">ร้านสาขา</option>
                  <option value="CONSIGNMENT">ร้านฝากขาย</option>
                </select>

                {scope==="BRANCH" ? (
                  <select className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900" value={branchId} onChange={(e)=> setBranchId(e.target.value)}>
                    <option value="">-- เลือกสาขา --</option>
                    {branches.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                ) : (
                  <select className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900" value={partnerId} onChange={(e)=> setPartnerId(e.target.value)}>
                    <option value="">-- เลือกร้านฝากขาย --</option>
                    {partners.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}

                <Button onClick={createSession} disabled={saving || (!!session)} leftIcon={<ClipboardCheck size={16}/>}>
                  เริ่มนับสต็อก
                </Button>
              </div>

              <div className="flex items-center gap-2 md:justify-end">
                <div className="flex items-center gap-2 w-full">
                  <Search size={16} className="opacity-90" />
                  <input
                    ref={inputRef}
                    value={q}
                    onChange={(e)=> setQ(e.target.value)}
                    onKeyDown={(e)=> e.key === "Enter" && addByQuery(q)}
                    className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                    placeholder={scope==="BRANCH" ? "สแกน/พิมพ์บาร์โค้ด หรือชื่อสินค้า (สาขา)" : "สแกน/พิมพ์บาร์โค้ด หรือชื่อสินค้า (ฝากขาย)"}
                    disabled={!session}
                  />
                  <Button kind="white" onClick={()=> setOpenScan(true)} disabled={!session}>สแกน</Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button kind="white" onClick={saveDraft} disabled={!session || saving} leftIcon={<Save size={16}/>}>บันทึกร่าง</Button>
                <Button onClick={finalize} disabled={!session || saving || !!session?.finalizedAt} leftIcon={<CheckCircle2 size={16}/>}>ปิดการนับ</Button>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-2 pb-3 text-sm text-slate-600">
                <div>เซสชัน: {session ? (session.code || ("CNT-" + String(session.id).padStart(6,"0"))) : "-"}</div>
                <div className="flex gap-4">
                  <span>จำนวนรายการ: <b>{lines.length}</b></span>
                  <span>ผลรวม Δ: <b>{numberFormat(totalDelta)}</b></span>
                </div>
              </div>

              <Table>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[160px]">Barcode</Table.Th>
                    <Table.Th>สินค้า</Table.Th>
                    <Table.Th className="w-[120px] text-right">ระบบ</Table.Th>
                    <Table.Th className="w-[160px] text-right">นับได้</Table.Th>
                    <Table.Th className="w-[120px] text-right">Δ</Table.Th>
                    <Table.Th className="w-[80px]"></Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body>
                  {lines.map((l, idx)=> {
                    const delta = Number(l.countedQty||0) - Number(l.systemQty||0);
                    return (
                      <Table.Tr key={l.productId}>
                        <Table.Td className="font-mono text-sm"><BarcodeImage value={l.barcode} /></Table.Td>
                        <Table.Td>{l.name}</Table.Td>
                        <Table.Td className="text-right">{numberFormat(l.systemQty)}</Table.Td>
                        <Table.Td className="text-right">
                          <input
                            type="number"
                            className="w-28 rounded-lg border px-2 py-1 text-right"
                            min="0"
                            value={l.countedQty}
                            onChange={(e)=> {
                              const v = Number(e.target.value);
                              setLines(prev=> prev.map((x,i)=> i===idx ? { ...x, countedQty: v } : x));
                            }}
                          />
                        </Table.Td>
                        <Table.Td className="text-right">{numberFormat(delta)}</Table.Td>
                        <Table.Td className="text-right">
                          <Button kind="white" size="sm" onClick={()=> setLines(prev=> prev.filter((_,i)=> i!==idx))}>ลบ</Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {lines.length === 0 && (
                    <Table.Tr><Table.Td colSpan={6} className="py-8 text-center text-muted">
                      {session ? "ยังไม่มีสินค้าในรายการนับ" : "กรุณาเริ่มเซสชันการนับก่อน"}
                    </Table.Td></Table.Tr>
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
        onDetected={(code)=> { setQ(code); addByQuery(code); inputRef.current?.focus(); }}
      />
    </div>
  );
}
