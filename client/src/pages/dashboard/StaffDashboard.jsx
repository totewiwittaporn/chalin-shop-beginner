// client/src/pages/dashboard/StaffDashboard.jsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import GradientPanel from '@/components/theme/GradientPanel';
import * as Table from '@/components/ui/Table.jsx';

export default function StaffDashboard() {
  const [q, setQ] = useState('');
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
          api.get('/api/orders/recent', { params: { limit: 5 } }).catch(() => ({ data: [] })),
          api.get('/api/products/low-stock', { params: { lt: 10 } }).catch(() => ({ data: [] })),
          api.get('/api/sales/summary/staff').catch(() => ({ data: {} })), // ✅ ใช้ endpoint ใหม่
        ]);
        if (!on) return;
        const toArray = (x) => (Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : []);
        setOrders(toArray(o.data));
        setLow(toArray(l.data));
        const sum = s.data || {};
        setKpi({
          week: sum.week ?? 0,
          today: sum.today ?? 0,
          pct: sum.pct ?? 0,
          tasks: sum.tasksToday ?? 0,
        });
      } finally {
        on && setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  const money = (n) =>
    Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      {/* ลองพื้นสีขาวอมฟ้านวล */}
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: '#f4f7ff' }}>
        <div className="grid gap-6">
          {/* Toolbar (กล่อง gradient + ขาวโปร่งด้านใน) */}
          <GradientPanel>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1 text-lg font-semibold">Staff Dashboard</div>
              <div className="flex gap-3">
                <Input
                  className="input-glass w-56"
                  placeholder="ค้นหาออเดอร์..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button className="btn-white">สร้างออเดอร์</Button>
              </div>
            </div>
          </GradientPanel>

          {/* KPI */}
          <GradientPanel>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="ยอดสัปดาห์นี้" value={money(kpi.week)} />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="ยอดวันนี้" value={money(kpi.today)} />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="% เทียบสัปดาห์ก่อน" value={`${(kpi.pct || 0).toFixed(1)}%`} />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="งานค้างวันนี้" value={kpi.tasks ?? 0} />
              </div>
            </div>
          </GradientPanel>
          {/* 2 คอลัมน์: ออเดอร์ล่าสุด + สินค้าใกล้หมด */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ออเดอร์ล่าสุด */}
            <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">ออเดอร์ล่าสุด</h2>
              </div>
              <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
                <Table.Root>
                  <Table.Head>
                    <Table.Tr>
                      <Table.Th>เลขที่</Table.Th>
                      <Table.Th>วันที่</Table.Th>
                      <Table.Th>ลูกค้า</Table.Th>
                      <Table.Th className="text-right">ยอดรวม</Table.Th>
                    </Table.Tr>
                  </Table.Head>
                  <Table.Body loading={loading}>
                    {orders.slice(0, 6).map((r, i) => (
                      <Table.Tr key={r.id ?? i}>
                        <Table.Td>{r.code ?? '-'}</Table.Td>
                        <Table.Td>
                          {r.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : '-'}
                        </Table.Td>
                        <Table.Td>{r.customer?.name ?? '-'}</Table.Td>
                        <Table.Td className="text-right">{money(r.total)}</Table.Td>
                      </Table.Tr>
                    ))}
                    {!loading && orders.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={4} className="py-8 text-center text-muted">
                          ไม่มีออเดอร์
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Body>
                </Table.Root>
              </div>
            </Card>

            {/* สินค้าใกล้หมด */}
            <GradientPanel title="สินค้าใกล้หมด (LT 10)">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th>สินค้า</Table.Th>
                    <Table.Th>บาร์โค้ด</Table.Th>
                    <Table.Th className="text-right">คงเหลือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {low.slice(0, 6).map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td className="font-mono">{p.barcode || '-'}</Table.Td>
                      <Table.Td className="text-right">{p.stock ?? p.stockQty ?? 0}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && !low.length && (
                    <Table.Tr>
                      <Table.Td colSpan={3} className="py-8 text-center text-muted">
                        ไม่มีสินค้าใกล้หมด
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
            </GradientPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
