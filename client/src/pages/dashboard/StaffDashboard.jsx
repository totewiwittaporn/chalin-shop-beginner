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

export default function StaffDashboard() {
  const [q, setQ] = useState("");
  const [kpi, setKpi] = useState({ week: 0, today: 0, pct: 0, tasks: 0 });
  const [orders, setOrders] = useState([]);
  const [low, setLow] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const [o, l, s] = await Promise.all([
          api.get("/api/orders/recent", { params: { limit: 5 } }).catch(()=>({data:[]})),
          api.get("/api/products/low-stock", { params: { lt: 10 } }).catch(()=>({data:[]})),
          api.get("/api/sales/summary", { params: { range: "7d" } }).catch(()=>({data:{}})),
        ]);
        if (!on) return;
        setOrders(o.data || []);
        setLow(l.data || []);
        const sum = s.data || {};
        setKpi({ week: sum.total ?? 0, today: sum.today ?? 0, pct: sum.pct ?? 0, tasks: sum.tasksToday ?? 0 });
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const columns = [
    { key: "code", header: "เลขที่" },
    { key: "createdAt", header: "วันที่", render: (v)=> new Date(v).toLocaleString("th-TH") },
    { key: "customer", header: "ลูกค้า", render: (_,r)=> r.customer?.name || "-" },
    { key: "total", header: "ยอดรวม", render: (v)=> fmt(v) },
  ];

  return (
    <div className="p-4 md:p-6">
      <HeaderBar title="Staff Dashboard">
        <div className="flex gap-3 items-center">
          <Input className="input-glass w-56" placeholder="ค้นหาออเดอร์..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button className="btn-white">New Order</Button>
        </div>
      </HeaderBar>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="ยอดขายวันนี้" value={fmt(kpi.today)} right={<DeltaPill delta={kpi.pct} />} />
        <StatCard title="ยอดขาย 7 วัน" value={fmt(kpi.week)} />
        <StatCard title="งานวันนี้" value={kpi.tasks} hint="เช็คสต๊อก/รับเข้า/ส่งออก" />
        <StatCard title="สินค้าใกล้หมด" value={low.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="h-title mb-3">ออเดอร์ล่าสุด</div>
            {loading ? (
              <div className="text-muted text-sm">Loading…</div>
            ) : (
              <Table
                columns={columns}
                data={(orders || []).filter((o) =>
                  [o.code, o.customer?.name].join(" ").toLowerCase().includes(q.toLowerCase())
                )}
              />
            )}
          </Card>
        </div>
        <Card>
          <div className="h-title mb-3">สินค้าใกล้หมด</div>
          <ul className="space-y-2">
            {(low || []).slice(0,6).map((p) => (
              <li key={p.id} className="flex items-center justify-between border border-[var(--card-border)] rounded-xl p-3">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm">{p.stock}</div>
              </li>
            ))}
            {!low?.length && <div className="text-muted text-sm">ไม่มีสินค้าใกล้หมด</div>}
          </ul>
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
