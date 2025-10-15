// client/src/pages/dashboard/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import GradientPanel from '@/components/theme/GradientPanel';
import * as Table from '@/components/ui/Table.jsx';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ gross: 0, count: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const [s, l, t] = await Promise.all([
          api
            .get('/api/sales/summary', { params: { range: '30d' } })
            .catch(() => ({ data: { gross: 0, count: 0 } })),
          api.get('/api/products/low-stock', { params: { lt: 10 } }).catch(() => ({ data: [] })),
          api
            .get('/api/sales/top-products', { params: { limit: 10, range: '30d' } })
            .catch(() => ({ data: [] })),
        ]);
        if (!on) return;
        setSummary(s.data || { gross: 0, count: 0 });
        setLowStock(Array.isArray(l.data) ? l.data : l.data?.items || []);
        setTopProducts(Array.isArray(t.data) ? t.data : []);
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
      {/* ลองพื้นขาวอมฟ้านวลทั้งหน้า */}
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: '#f4f7ff' }}>
        <div className="grid gap-6">
          {/* แถวสถิติ — ห่อด้วย gradient แล้วมีกล่องเนื้อหาขาวด้านใน (ตามตัวอย่าง PurchasesPage) */}
          <GradientPanel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard
                  title="ยอดขาย 30 วัน (บาท)"
                  value={money(summary.gross)}
                  hint="รวมใบเสร็จที่ PAID"
                />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="จำนวนบิล 30 วัน" value={summary.count ?? 0} hint="" />
              </div>
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800">
                <StatCard title="สินค้าใกล้หมด" value={lowStock.length ?? 0} hint="LT 10 ชิ้น" />
              </div>
            </div>
          </GradientPanel>

          {/* แถวคู่: Top Products + Low Stock (สไตล์เดียวกับหน้า 'ซื้อสินค้า') */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GradientPanel title="Top 10 สินค้าขายดี (30 วัน)" subtitle="รวมเฉพาะบิลสถานะ PAID">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-14 text-center">#</Table.Th>
                    <Table.Th>สินค้า</Table.Th>
                    <Table.Th>บาร์โค้ด</Table.Th>
                    <Table.Th className="text-right w-[100px]">จำนวน</Table.Th>
                    <Table.Th className="text-right w-[140px]">รายได้</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {topProducts.map((p, idx) => (
                    <Table.Tr key={p.productId ?? idx}>
                      <Table.Td className="text-center">{idx + 1}</Table.Td>
                      <Table.Td>{p.name || '-'}</Table.Td>
                      <Table.Td className="font-mono">{p.barcode || '-'}</Table.Td>
                      <Table.Td className="text-right">
                        {(p.qty ?? 0).toLocaleString('th-TH')}
                      </Table.Td>
                      <Table.Td className="text-right">{money(p.revenue)}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && topProducts.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="py-8 text-center text-muted">
                        ไม่มีข้อมูลยอดขาย
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
            </GradientPanel>
            <GradientPanel title="สินค้าใกล้หมด (LT 10)" subtitle="สต็อกน้อยกว่าเกณฑ์กำหนด">
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th>สินค้า</Table.Th>
                    <Table.Th>บาร์โค้ด</Table.Th>
                    <Table.Th className="text-right w-[100px]">คงเหลือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {lowStock.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td className="font-mono">{p.barcode || '-'}</Table.Td>
                      <Table.Td className="text-right">{p.stock ?? p.stockQty ?? 0}</Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && lowStock.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={3} className="py-8 text-center text-muted">
                        ไม่มีสินค้าใกล้หมด
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
              <div className="mt-3 text-right">
                <Button
                  kind="editor"
                  onClick={() => {
                    /* TODO: link ไปหน้า inventory */
                  }}
                >
                  ไปหน้าสินค้า
                </Button>
              </div>
            </GradientPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
