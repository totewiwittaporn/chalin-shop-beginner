import { useEffect, useState } from "react";
import api from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import DeltaPill from "@/components/ui/DeltaPill";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

function HeaderBar({ title, children }) {
  return (
    <div className="toolbar-glass p-3 md:p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 text-base md:text-lg font-medium">{title}</div>
        {children}
      </div>
    </div>
  );
}

export default function ConsignmentDashboard() {
  const [q, setQ] = useState("");
  const [kpi, setKpi] = useState({ month: 0, pct: 0, items: 0, returns: 0 });
  const [docs, setDocs] = useState([]);
  const [rets, setRets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const [sum, d, r] = await Promise.all([
          api.get("/api/consignment/me/summary", { params: { range: "30d" } }).catch(()=>({data:{}})),
          api.get("/api/consignment/me/documents", { params: { limit: 5 } }).catch(()=>({data:[]})),
          api.get("/api/consignment/me/returns", { params: { limit: 5 } }).catch(()=>({data:[]})),
        ]);
        if (!on) return;
        const s = sum.data || {};
        setKpi({
          month: s.total ?? 0,
          pct: s.pct ?? 0,
          items: s.lowItems ?? 0,
          returns: (r.data || []).length,
        });
        setDocs(d.data || []);
        setRets(r.data || []);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const docCols = [
    { key: "code", header: "เลขที่" },
    { key: "createdAt", header: "วันที่", render: (v)=> new Date(v).toLocaleDateString("th-TH") },
    { key: "items", header: "จำนวนรายการ", render: (_,r)=> r.items?.length ?? 0 },
  ];
  const retCols = [
    { key: "code", header: "เลขที่" },
    { key: "createdAt", header: "วันที่", render: (v)=> new Date(v).toLocaleDateString("th-TH") },
    { key: "total", header: "จำนวน", render: (v)=> v ?? 0 },
  ];

  return (
    <div className="p-4 md:p-6">
      <HeaderBar title="Consignment Dashboard">
        <div className="flex gap-3 items-center">
          <Input className="input-glass w-56" placeholder="ค้นหาเอกสาร..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button className="btn-white">สร้างใบฝากขาย</Button>
        </div>
      </HeaderBar>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="ยอดขายฝากขาย (30 วัน)" value={fmt(kpi.month)} right={<DeltaPill delta={kpi.pct} />} />
        <StatCard title="สินค้าใกล้หมด (ฉัน)" value={kpi.items} />
        <StatCard title="ส่งคืนล่าสุด" value={kpi.returns} />
        <StatCard title="เอกสารล่าสุด" value={docs.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card>
          <div className="h-title mb-3">ใบฝากขายล่าสุด</div>
          {loading ? (
            <div className="text-muted text-sm">Loading…</div>
          ) : (
            <Table
              columns={docCols}
              data={(docs || []).filter((d) =>
                [d.code].join(" ").toLowerCase().includes(q.toLowerCase())
              )}
            />
          )}
        </Card>
        <Card>
          <div className="h-title mb-3">รายการส่งคืนล่าสุด</div>
          {loading ? (
            <div className="text-muted text-sm">Loading…</div>
          ) : (
            <Table
              columns={retCols}
              data={rets || []}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function fmt(n){
  if(n==null) return "0.00";
  try{ return Number(n).toLocaleString("th-TH",{style:"currency",currency:"THB"});}
  catch{return String(n);}
}
