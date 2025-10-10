// client/src/pages/docs/QuoteDocs.jsx
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.js';

export default function QuoteDocs(){
  const { quotes = [], prospects = [] } = useDataStore();
  const prospectById = Object.fromEntries(prospects.map(p=>[p.id, p.name]));
  return (
    <div className="grid gap-3">
      <h2 className="text-xl font-semibold">ใบเสนอราคา</h2>
      <div className="glass rounded-2xl p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left opacity-70">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>คู่ค้า</th><th>โหมด</th><th>ยอดสุทธิ</th><th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>
          {quotes.map(q=>(
            <tr key={q.id} className="border-t border-white/10">
              <td className="py-2">{q.docNo}</td>
              <td>{q.date}</td>
              <td>{prospectById[q.prospectId] || '-'}</td>
              <td>{q.mode}</td>
              <td>{(q.totals?.net ?? q.totals?.gross ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              <td>{q.status}</td>
              <td><Link className="btn btn-outline btn-xs" to={`/docs/quote/${q.id}`}>ดู/พิมพ์</Link></td>
            </tr>
          ))}
          {quotes.length===0 && <tr><td colSpan={7} className="py-8 text-center opacity-60">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
