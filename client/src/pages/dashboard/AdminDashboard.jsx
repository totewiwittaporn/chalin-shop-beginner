import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import * as Table from "../../components/ui/Table.jsx"; // ⬅️ ใช้ namespace import
import Button from "../../components/ui/Button";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ gross: 0, count: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        // เรียก 3 endpoint ที่เพิ่งเพิ่ม
        const [u, s, l] = await Promise.all([
          api.get("/api/users").catch((e) => ({ data: { items: [] } })),
          api.get("/api/sales/summary", { params: { range: "30d" } }).catch((e) => ({ data: { gross: 0, count: 0 } })),
          api.get("/api/products/low-stock", { params: { lt: 10 } }).catch((e) => ({ data: { items: [] } })),
        ]);
        if (!on) return;
        setUsers(u.data.items || []);
        setSummary({ gross: Number(s.data.gross || 0), count: Number(s.data.count || 0) });
        setLowStock(l.data.items || []);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  return (
    <div className="grid gap-4">
      {/* แถว KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          variant="gradient"
          label="ยอดขาย (30 วัน)"
          value={new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(summary.gross)}
        />
        <StatCard
          label="จำนวนบิล (30 วัน)"
          value={summary.count.toLocaleString()}
        />
        <StatCard
          label="ผู้ใช้งานทั้งหมด"
          value={users.length.toLocaleString()}
        />
      </div>

      {/* ผู้ใช้ล่าสุด */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <div className="text-base font-semibold">ผู้ใช้งานล่าสุด</div>
          <div className="text-xs text-muted">เฉพาะ ADMIN เท่านั้นที่เห็นข้อมูลนี้</div>
        </div>
        <Table.Root>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[220px]">อีเมล</Table.Th>
              <Table.Th>ชื่อ</Table.Th>
              <Table.Th className="w-[120px]">บทบาท</Table.Th>
              <Table.Th className="w-[120px]">สาขา</Table.Th>
            </Table.Tr>
          </Table.Head>
          <Table.Body loading={loading}>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td className="font-mono text-sm">{u.email}</Table.Td>
                <Table.Td>{u.name || "-"}</Table.Td>
                <Table.Td>{u.role}</Table.Td>
                <Table.Td>{u.branchId ?? "-"}</Table.Td>
              </Table.Tr>
            ))}
            {!loading && users.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center text-muted py-10">ไม่มีข้อมูล</Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table.Root>
      </Card>

      {/* สินค้าใกล้หมด */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">สินค้าใกล้หมด (LT 10)</div>
            <div className="text-xs text-muted">สาธิต—ยังไม่มี stock field ในสคีมจึงคืนลิสต์ว่าง</div>
          </div>
          <Button kind="white" type="button" onClick={() => window.location.assign('/products')}>ไปหน้าสินค้า</Button>
        </div>
        <Table.Root>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[160px]">Barcode</Table.Th>
              <Table.Th>ชื่อสินค้า</Table.Th>
              <Table.Th className="w-[120px] text-right">คงเหลือ</Table.Th>
            </Table.Tr>
          </Table.Head>
          <Table.Body loading={loading}>
            {lowStock.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td className="font-mono text-sm">{p.barcode}</Table.Td>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td className="text-right">{p.stockQty ?? 0}</Table.Td>
              </Table.Tr>
            ))}
            {!loading && lowStock.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} className="text-center text-muted py-10">ไม่มีสินค้าใกล้หมด</Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table.Root>
      </Card>
    </div>
  );
}
