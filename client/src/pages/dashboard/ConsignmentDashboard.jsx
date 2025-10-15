import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import * as Table from '@/components/ui/Table.jsx';
import GradientPanel from '@/components/theme/GradientPanel';

export default function ConsignmentDashboard() {
  const [q, setQ] = useState('');
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
          api
            .get('/api/consignment/me/summary', { params: { range: '30d' } })
            .catch(() => ({ data: {} })),
          api
            .get('/api/consignment/me/documents', { params: { limit: 5 } })
            .catch(() => ({ data: [] })),
          api
            .get('/api/consignment/me/returns', { params: { limit: 5 } })
            .catch(() => ({ data: [] })),
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
    return () => {
      on = false;
    };
  }, []);

  const money = (n) =>
    Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const docCols = [
    { key: 'code', header: 'เลขที่' },
    {
      key: 'docDate',
      header: 'วันที่',
      render: (v, r) => new Date(r.docDate || r.createdAt).toLocaleDateString('th-TH'),
    },
    { key: 'items', header: 'จำนวนรายการ', render: (_, r) => r.items?.length ?? 0 },
  ];
  const retCols = [
    { key: 'code', header: 'เลขที่' },
    { key: 'createdAt', header: 'วันที่', render: (v) => new Date(v).toLocaleDateString('th-TH') },
    { key: 'total', header: 'จำนวน', render: (v) => v ?? 0 },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      {/* ลองพื้นขาวอมฟ้านวลทั้งหน้า */}
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: '#f4f7ff' }}>
        <div className="grid gap-6">
          {/* Toolbar */}
          <GradientPanel>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1 text-lg font-semibold">Consignment Dashboard</div>
              <div className="flex gap-3">
                <Input
                  className="input-glass w-56"
                  placeholder="ค้นหาเอกสาร..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button
                  className="btn-white"
                  onClick={() => navigate('/consignment/documents/new')}
                >
                  สร้างใบฝากขาย
                </Button>
              </div>
            </div>
          </GradientPanel>

          {/* KPI */}
          <GradientPanel>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="ยอดขายฝากขาย (30 วัน)" value={money(kpi.month)} />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="% เทียบช่วงก่อน" value={`${(kpi.pct || 0).toFixed(1)}%`} />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="สินค้าใกล้หมด (ฉัน)" value={kpi.items} />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="ส่งคืนล่าสุด" value={kpi.returns} />
              </div>
            </div>
          </GradientPanel>

          {/* 2 คอลัมน์ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GradientPanel title="ใบฝากขายล่าสุด">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th>เลขที่</Table.Th>
                    <Table.Th>วันที่</Table.Th>
                    <Table.Th className="text-right">จำนวนรายการ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {(docs || []).map((r, i) => (
                    <Table.Tr key={r.id ?? i}>
                      <Table.Td>{r.docNo ?? r.code ?? '-'}</Table.Td>
                      <Table.Td>
                        {new Date(r.docDate || r.createdAt).toLocaleDateString('th-TH')}
                      </Table.Td>
                      <Table.Td className="text-right">{r.items?.length ?? 0}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && (docs || []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={3} className="py-8 text-center text-muted">
                        ไม่มีเอกสาร
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
            </GradientPanel>

            <GradientPanel title="ส่งคืนล่าสุด">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th>เลขที่</Table.Th>
                    <Table.Th>วันที่</Table.Th>
                    <Table.Th className="text-right">จำนวน</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {(rets || []).map((r, i) => (
                    <Table.Tr key={r.id ?? i}>
                      <Table.Td>{r.code ?? '-'}</Table.Td>
                      <Table.Td>{new Date(r.createdAt).toLocaleDateString('th-TH')}</Table.Td>
                      <Table.Td className="text-right">{r.total ?? 0}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && (rets || []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={3} className="py-8 text-center text-muted">
                        ไม่มีรายการส่งคืน
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
