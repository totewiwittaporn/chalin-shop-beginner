// client/src/pages/docs/ConsaleDocs.jsx
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.js';

export default function ConsaleDocs(){
  const { consignmentSales = [], consignmentShops = [] } = useDataStore();
  const shopById = Object.fromEntries(consignmentShops.map(s=>[s.id, s.nameInternal]));
  return (
    <div className="grid gap-3">
      <h2 className="text-xl font-semibold">ยอดขายฝากขาย</h2>
      <div className="glass rounded-2xl p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left opacity-70">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>ร้าน</th><th>ยอดสุทธิ</th><th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>
          {consignmentSales.map(d=>(
            <tr key={d.id} className="border-t border-white/10">
              <td className="py-2">{d.docNo}</td>
              <td>{d.date}</td>
              <td>{shopById[d.shopId] || '-'}</td>
              <td>{Number(d.totals?.net || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              <td>{d.status || '-'}</td>
              <td><Link className="btn btn-outline btn-xs" to={`/docs/consale/${d.id}`}>ดู/พิมพ์</Link></td>
            </tr>
          ))}
          {consignmentSales.length===0 && <tr><td colSpan={6} className="py-8 text-center opacity-60">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
