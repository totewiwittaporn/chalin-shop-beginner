import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore.js';

export default function ReceiptDocs(){
  const { receipts = [], consignmentShops = [], branches = [] } = useDataStore();
  const [q, setQ] = useState("");
  const shopById = Object.fromEntries(consignmentShops.map(s=>[s.id, s.nameInternal]));
  const branchById = Object.fromEntries(branches.map(b=>[b.id, b.name]));
  const rows = receipts.filter(rc =>
    [rc.docNo, rc.date, shopById[rc.shopId], branchById[rc.branchId], rc.status].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="grid gap-3">
      <div className="toolbar-glass p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-lg font-semibold">ใบเสร็จรับเงิน</div>
          <input className="input-glass w-64" placeholder="ค้นหา..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>คู่ค้า</th><th>จำนวนเงิน</th><th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>
          {rows.map(rc=>(
            <tr key={rc.id} className="border-t border-[var(--card-border)]">
              <td className="py-2">{rc.docNo}</td>
              <td>{rc.date}</td>
              <td>{rc.shopId ? shopById[rc.shopId] : (rc.branchId ? branchById[rc.branchId] : '-')}</td>
              <td>{(rc.totals?.amount ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              <td>{rc.status || '-'}</td>
              <td><Link className="btn-white text-sm px-3 py-1 rounded-lg" to={`/docs/receipt/${rc.id}`}>ดู/พิมพ์</Link></td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={6} className="py-8 text-center text-muted">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
