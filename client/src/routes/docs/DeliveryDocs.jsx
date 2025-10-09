import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.js';

export default function DeliveryDocs(){
  const { consignmentDeliveries = [], branches = [], consignmentShops = [] } = useDataStore();
  const shopById = Object.fromEntries(consignmentShops.map(s=>[s.id, s.nameInternal]));
  const branchById = Object.fromEntries(branches.map(b=>[b.id, b.name]));

  return (
    <div className="grid gap-3">
      <h2 className="text-xl font-semibold">ใบส่งสินค้า</h2>
      <div className="glass rounded-2xl p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left opacity-70">
            <th className="py-2">เลขที่</th><th>วันที่</th><th>ปลายทาง</th><th>จำนวนรายการ</th><th></th>
          </tr></thead>
          <tbody>
          {consignmentDeliveries.map(d=>(
            <tr key={d.id} className="border-t border-white/10">
              <td className="py-2">{d.docNo}</td>
              <td>{d.date}</td>
              <td>{d.shopId ? shopById[d.shopId] : (d.branchId ? branchById[d.branchId] : '-')}</td>
              <td>{d.lines?.length || 0}</td>
              <td><Link className="btn btn-outline btn-xs" to={`/docs/delivery/${d.id}`}>ดูเอกสาร</Link></td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
