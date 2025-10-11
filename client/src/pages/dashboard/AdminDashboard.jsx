import { useEffect, useState } from "react";
import api from "../../lib/api";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import DeltaPill from "../../components/ui/DeltaPill";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import ActivityList from "../../components/ui/ActivityList";
import LowStockCard from "../../components/ui/LowStockCard";

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

export default function AdminDashboard() {
  const [q, setQ] = useState("");
  const [range, setRange] = useState("30d");
  const [kpi, setKpi] = useState({ today: 0, yesterday: 0, month: 0, slipToday: 0, pct: 0 });
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [low, setLow] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const [u, b, s, l] = await Promise.all([
          api.get("/api/users").catch(() => ({ data: [] })),
          api.get("/api/branches").catch(() => ({ data: [] })),
          api.get("/api/sales/summary", { params: { range } }).catch(() => ({ data: {} })),
          api.get("/api/products/low-stock", { params: { lt: 10 } }).catch(() => ({ data: [] })),
        ]);

        const sum = s.data || {};
        const acts = [
          { title: "ระบบพร้อมใช้งาน", type: "system", date: new Date(), status: "ok" },
          { title: "ดึงข้อมูลสรุปยอดขาย", type: "fetch", date: new Date(), status: "done" },
        ];

        if (!on) return;
        setUsers(u.data || []);
        setBranches(b.data || []);
        setLow(l.data || []);
        setKpi({
          today: sum.today ?? 0,
          yesterday: sum.yesterday ?? 0,
          month: sum.total ?? 0,
          slipToday: sum.slipToday ?? 0,
          pct: sum.pct ?? 0,
        });
        setActivities(acts);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [range]);

  const columns = [
    { key: "name", header: "สาขา" },
    { key: "code", header: "รหัส" },
    { key: "manager", header: "ผู้จัดการ", render: (_, r) => r.manager?.name || "-" },
    { key: "phone", header: "โทร" },
  ];

  return (
    <div className="p-4 md:p-6">
      <HeaderBar title="Admin Dashboard">
        <div className="flex gap-3 items-center">
          <Input className="input-glass w-56" placeholder="Search..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <Select
            value={range}
            onChange={setRange}
            options={[
              { value: "7d", label: "7 วัน" },
              { value: "30d", label: "30 วัน" },
              { value: "90d", label: "90 วัน" },
            ]}
          />
          <Button className="btn-white">Export</Button>
        </div>
      </HeaderBar>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="ยอดขายวันนี้" value={fmt(kpi.today)} right={<DeltaPill delta={kpi.pct} />} />
        <StatCard title="ยอดขายเมื่อวานนี้" value={fmt(kpi.yesterday)} />
        <StatCard title="ยอดขายเดือนนี้" value={fmt(kpi.month)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <StatCard title="ใบส่งของ (วันนี้)" value={kpi.slipToday || 0} />
        <StatCard title="ผู้ใช้ทั้งหมด" value={users.length} hint="รวมทุกบทบาท" />
        <StatCard title="จำนวนสาขา" value={branches.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="h-title mb-3">สาขา</div>
            {loading ? (
              <div className="text-muted text-sm">Loading…</div>
            ) : (
              <Table
                columns={columns}
                data={(branches || []).filter((b) =>
                  [b.name, b.code, b.manager?.name, b.phone].join(" ").toLowerCase().includes(q.toLowerCase())
                )}
              />
            )}
          </Card>
        </div>
        <div className="grid gap-4">
          <LowStockCard rows={low} />
          <ActivityList items={activities} />
        </div>
      </div>
    </div>
  );
}

function fmt(n) {
  if (n == null) return "0.00";
  try { return Number(n).toLocaleString("th-TH", { style: "currency", currency: "THB" }); }
  catch { return String(n); }
}
