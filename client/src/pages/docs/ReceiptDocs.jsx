// client/src/pages/docs/ReceiptDocs.jsx
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.js';

export default function ReceiptDocs(){
  const { receipts = [], consignmentShops = [], branches = [] } = useDataStore();
  const shopById = Object.fromEntries(consignmentShops.map(s=>[s.id, s.nameInternal]));
  const branchById = Object.fromEntries(branches.map(b=>[b.id, b.name]));
  return (
    <div className="grid gap-3">
      <h2 className="text-xl font-semibold">ใบเสร็จรับเงิน</h2>
      <div className="glass rounded-2xl p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left opacity-70">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>คู่ค้า</th><th>จำนวนเงิน</th><th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>
          {receipts.map(rc=>(
            <tr key={rc.id} className="border-t border-white/10">
              <td className="py-2">{rc.docNo}</td>
              <td>{rc.date}</td>
              <td>{rc.shopId ? shopById[rc.shopId] : (rc.branchId ? branchById[rc.branchId] : '-')}</td>
              <td>{(rc.totals?.amount ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              <td>{rc.status || '-'}</td>
              <td><Link className="btn btn-outline btn-xs" to={`/docs/receipt/${rc.id}`}>ดู/พิมพ์</Link></td>
            </tr>
          ))}
          {receipts.length===0 && <tr><td colSpan={6} className="py-8 text-center opacity-60">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
