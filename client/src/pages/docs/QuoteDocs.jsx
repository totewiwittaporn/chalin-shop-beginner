import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDataStore } from '../../store/dataStore.js';

export default function QuoteDocs(){
  const { quotes = [], prospects = [] } = useDataStore();
  const [q, setQ] = useState("");
  const prospectById = Object.fromEntries(prospects.map(p=>[p.id, p.name]));
  const rows = quotes.filter(x =>
    [x.docNo, x.date, prospectById[x.prospectId], x.mode, x.status].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="grid gap-3">
      <div className="toolbar-glass p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-lg font-semibold">ใบเสนอราคา</div>
          <input className="input-glass w-64" placeholder="ค้นหา..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>คู่ค้า</th><th>โหมด</th><th>ยอดสุทธิ</th><th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>
          {rows.map(x=>(
            <tr key={x.id} className="border-t border-[var(--card-border)]">
              <td className="py-2">{x.docNo}</td>
              <td>{x.date}</td>
              <td>{prospectById[x.prospectId] || '-'}</td>
              <td>{x.mode}</td>
              <td>{(x.totals?.net ?? x.totals?.gross ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              <td>{x.status}</td>
              <td><Link className="btn-white text-sm px-3 py-1 rounded-lg" to={`/docs/quote/${x.id}`}>ดู/พิมพ์</Link></td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={7} className="py-8 text-center text-muted">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
