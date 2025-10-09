import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.js';

export default function InvoiceDocs(){
  const { invoices = [], consignmentShops = [], branches = [] } = useDataStore();
  const shopById = Object.fromEntries(consignmentShops.map(s=>[s.id, s.nameInternal]));
  const branchById = Object.fromEntries(branches.map(b=>[b.id, b.name]));

  return (
    <div className="grid gap-3">
      <h2 className="text-xl font-semibold">ใบวางบิล</h2>
      <div className="glass rounded-2xl p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left opacity-70">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>คู่ค้า</th><th>ยอดสุทธิ</th><th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>
          {invoices.map(inv=>(
            <tr key={inv.id} className="border-t border-white/10">
              <td className="py-2">{inv.docNo}</td>
              <td>{inv.date}</td>
              <td>{inv.shopId ? shopById[inv.shopId] : (inv.branchId ? branchById[inv.branchId] : '-')}</td>
              <td>{(inv.totals?.net ?? inv.totals?.gross ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
              <td>{inv.status || '-'}</td>
              <td><Link className="btn btn-outline btn-xs" to={`/docs/invoice/${inv.id}`}>ดูเอกสาร</Link></td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
