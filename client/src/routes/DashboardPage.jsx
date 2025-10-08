import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore.js';
import { useDataStore } from '../store/dataStore.js';
import StatCard from '../components/ui/StatCard.jsx';
import DeltaPill from '../components/ui/DeltaPill.jsx';
import ActivityList from '../components/ui/ActivityList.jsx';
import LowStockCard from '../components/ui/LowStockCard.jsx';
import { Card } from '../components/ui/Card.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#60a5fa', '#22c55e', '#f59e0b'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role || 'ADMIN';
  const branchId = user?.branchId;

  const {
    products, branches, consignmentShops,
    inventory, purchases, transfers, sales, quotes, consignmentSettlements
  } = useDataStore();

  const sumLines = (lines) => lines.reduce((s, l) => s + l.qty * (l.price || 0), 0);

  const byRole = {
    inventory: (rows) => {
      if (role === 'STAFF' && branchId) {
        return rows.filter(i => i.locationType === 'BRANCH' && i.locationId === branchId);
      }
      if (role === 'CONSIGNMENT') {
        return rows.filter(i => i.locationType === 'CONSIGNMENT');
      }
      return rows;
    },
    purchases: (rows) => {
      if (role === 'STAFF' && branchId) return rows.filter(r => r.branchId === branchId);
      return rows;
    },
    sales: (rows) => {
      if (role === 'STAFF' && branchId) return rows.filter(r => r.branchId === branchId);
      if (role === 'CONSIGNMENT') return rows.filter(r => r.scope === 'CONSIGNMENT' || true);
      return rows;
    },
  };

  const inv = byRole.inventory(inventory);
  const po  = byRole.purchases(purchases);
  const so  = byRole.sales(sales);

  // KPI + เปอร์เซ็นต์เทียบเมื่อวาน
  const kpi = useMemo(() => {
    const totalProducts = products.length;
    const totalBranches = role === 'CONSIGNMENT' ? consignmentShops.length : branches.length;

    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    const amountOn = (list, d) =>
      list.filter(x => dayjs(x.docDate).isSame(d, 'day')).reduce((sum, x) => sum + sumLines(x.lines), 0);

    const poToday = amountOn(po, today);
    const poYesterday = amountOn(po, yesterday);
    const poDelta = poYesterday ? Math.round(((poToday - poYesterday) / poYesterday) * 100) : 100;

    const soToday = amountOn(so, today);
    const soYesterday = amountOn(so, yesterday);
    const soDelta = soYesterday ? Math.round(((soToday - soYesterday) / soYesterday) * 100) : 100;

    return {
      totalProducts,
      totalBranches,
      purchasesToday: poToday,
      purchasesDelta: poDelta,
      salesToday: soToday,
      salesDelta: soDelta,
    };
  }, [products, branches, consignmentShops, po, so, role]);

  // กราฟ 14 วัน (Purchases & Sales)
  const series14 = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = dayjs().subtract(13 - i, 'day');
      return { d: d.format('MM/DD'), po: 0, so: 0 };
    });
    const idxBy = Object.fromEntries(days.map((x, i) => [x.d, i]));
    po.forEach(p => {
      const k = dayjs(p.docDate).format('MM/DD'); const idx = idxBy[k];
      if (idx !== undefined) days[idx].po += sumLines(p.lines);
    });
    so.forEach(s => {
      const k = dayjs(s.docDate).format('MM/DD'); const idx = idxBy[k];
      if (idx !== undefined) days[idx].so += sumLines(s.lines);
    });
    return days;
  }, [po, so]);

  // Top 5 สินค้าขายดี
  const topSold = useMemo(() => {
    const map = new Map();
    so.forEach(s => s.lines.forEach(l => map.set(l.productId, (map.get(l.productId) || 0) + l.qty)));
    const nameByProduct = Object.fromEntries(products.map(p => [p.id, p.name]));
    return [...map.entries()]
      .map(([pid, qty]) => ({ name: nameByProduct[pid] || '#' + pid, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [so, products]);

  // สัดส่วนสต็อกตามที่เก็บ
  const invByType = useMemo(() => {
    const map = new Map();
    inv.forEach(i => map.set(i.locationType, (map.get(i.locationType) || 0) + i.qty));
    const nice = { MAIN: 'Main', BRANCH: 'Branches', CONSIGNMENT: 'Consign' };
    return [...map.entries()].map(([k, v]) => ({ name: nice[k] || k, value: v }));
  }, [inv]);

  // Low stock (เทียบกับ product.reorderLevel)
  const lowStock = useMemo(() => {
    const byProduct = new Map();
    inv.forEach(i => byProduct.set(i.productId, (byProduct.get(i.productId) || 0) + i.qty));
    const pById = Object.fromEntries(products.map(p => [p.id, p]));
    const rows = [...byProduct.entries()].map(([pid, qty]) => {
      const p = pById[pid]; const min = p?.reorderLevel || 0;
      return { id: pid, name: p?.name || '#' + pid, qty, min };
    }).filter(r => r.qty <= r.min).sort((a, b) => a.qty - b.qty);
    return rows;
  }, [inv, products]);

  // Recent Activity
  const activity = useMemo(() => {
    const items = [];
    po.forEach(x => items.push({ type: 'PO',    title: x.docNo, date: x.docDate, status: x.status }));
    so.forEach(x => items.push({ type: 'SALE',  title: x.docNo, date: x.docDate, status: x.status }));
    transfers.forEach(x => items.push({ type: 'TRF',   title: x.docNo, date: x.date,    status: x.status }));
    quotes.forEach(x => items.push({ type: 'QUOTE',title: x.docNo, date: x.docDate, status: x.status }));
    return items.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 8);
  }, [po, so, transfers, quotes]);

  // Settlements (เฉพาะ Admin/Consignment)
  const settlements = useMemo(() => {
    if (!(role === 'CONSIGNMENT' || role === 'ADMIN')) return [];
    return consignmentSettlements
      .map(s => ({ ...s, days: dayjs(s.dueDate).diff(dayjs(), 'day') }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 4);
  }, [consignmentSettlements, role]);

  return (
    <div className="grid gap-6">
      {/* KPI + delta */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={products.length} />
        {role === 'CONSIGNMENT'
          ? <StatCard title="Consignment Shops" value={consignmentShops.length} />
          : <StatCard title="Branches" value={branches.length} />
        }
        <StatCard
          title="Purchases today (฿)"
          value={kpi.purchasesToday.toLocaleString()}
          right={<DeltaPill delta={kpi.purchasesDelta} />}
          hint="vs yesterday"
        />
        <StatCard
          title="Sales today (฿)"
          value={kpi.salesToday.toLocaleString()}
          right={<DeltaPill delta={kpi.salesDelta} />}
          hint="vs yesterday"
        />
      </div>

      {/* Charts + Low stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="mb-3 h-title">Purchases & Sales — last 14 days</div>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={series14}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="po" stroke="#6366f1" strokeWidth={2} dot={false} name="Purchases" />
                <Line type="monotone" dataKey="so" stroke="#22c55e" strokeWidth={2} dot={false} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <LowStockCard rows={lowStock} />

        <Card className="p-5">
          <div className="mb-3 h-title">Top Products by Qty (Sales)</div>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={topSold}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 h-title">Inventory Distribution</div>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={invByType} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {invByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent activity & settlements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityList items={activity} />
        {(role === 'CONSIGNMENT' || role === 'ADMIN') && (
          <div className="card p-5">
            <div className="h-title mb-3">Consignment Settlements (upcoming)</div>
            <ul className="grid gap-2">
              {settlements.length === 0 && <li className="text-sm text-muted">No upcoming settlements</li>}
              {settlements.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <div className="text-sm">Shop #{s.shopId} • {s.period}</div>
                  <div className="text-xs">
                    <span className="px-2 py-0.5 rounded-xl bg-indigo-100 text-indigo-900 mr-2">฿{s.amount.toLocaleString()}</span>
                    <span className="px-2 py-0.5 rounded-xl bg-yellow-100 text-yellow-900">{s.days} days</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
