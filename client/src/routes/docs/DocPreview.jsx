// client/src/routes/docs/DocPreview.jsx
import { useParams } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.js';

function A4({children}) {
  return (
    <div className="bg-white text-black p-8 mx-auto shadow-xl rounded-xl print:shadow-none print:rounded-none w-[794px]">
      {children}
    </div>
  );
}

export default function DocPreview(){
  const { kind, id } = useParams();
  const {
    products=[], quotes=[], invoices=[], receipts=[], consignmentDeliveries=[],
    consignmentSales=[], consignmentShops=[], branches=[]
  } = useDataStore();

  const byId = (arr) => Object.fromEntries(arr.map(x=>[String(x.id), x]));
  const mapProducts = byId(products);
  const mapShops = byId(consignmentShops);
  const mapBranches = byId(branches);

  let doc, title='Document';
  if (kind === 'delivery') { doc = consignmentDeliveries.find(d=> String(d.id)===id); title='ใบส่งสินค้า'; }
  if (kind === 'invoice')  { doc = invoices.find(d=> String(d.id)===id);            title='ใบวางบิล'; }
  if (kind === 'receipt')  { doc = receipts.find(d=> String(d.id)===id);            title='ใบเสร็จรับเงิน'; }
  if (kind === 'quote')    { doc = quotes.find(d=> String(d.id)===id);              title='ใบเสนอราคา'; }
  if (kind === 'consale')  { doc = consignmentSales.find(d=> String(d.id)===id);    title='สรุปยอดขายฝากขาย'; }

  if (!doc) return <div className="p-6">ไม่พบเอกสาร</div>;

  const partnerName = doc.shopId ? mapShops[String(doc.shopId)]?.nameInternal
                     : doc.branchId ? mapBranches[String(doc.branchId)]?.name
                     : '-';
  const lines = doc.lines || [];

  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={()=>window.print()}>พิมพ์</button>
      </div>
      <A4>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-bold">{title}</div>
            <div className="text-sm">เลขที่: {doc.docNo}</div>
            <div className="text-sm">วันที่: {doc.date}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">คู่ค้า/ปลายทาง</div>
            <div>{partnerName || '-'}</div>
          </div>
        </div>

        <table className="w-full text-sm mt-6">
          <thead className="border-b border-gray-300">
            <tr className="text-left">
              <th className="py-2">ลำดับ</th>
              <th>สินค้า</th>
              <th className="text-right">จำนวน</th>
              { (kind!=='delivery') && <th className="text-right">ราคา/ชิ้น</th> }
              { (kind!=='delivery') && <th className="text-right">รวม</th> }
            </tr>
          </thead>
        <tbody>
          {lines.map((l, i) => {
            const p = mapProducts[String(l.productId)];
            const name = l.name || p?.name || `#${l.productId}`;
            const qty  = l.qty ?? 1;
            const price = l.unitPrice ?? l.priceOffer ?? p?.salePrice ?? 0;
            const amount = l.amount ?? (price * qty);
            return (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{i+1}</td>
                <td>{name}</td>
                <td className="text-right">{qty}</td>
                { (kind!=='delivery') && <td className="text-right">{price.toLocaleString()}</td> }
                { (kind!=='delivery') && <td className="text-right">{amount.toLocaleString()}</td> }
              </tr>
            );
          })}
        </tbody>
        </table>

        <div className="mt-6 text-right space-y-1">
          {doc.totals?.gross !== undefined && <div>ยอดรวม (Gross): <b>{doc.totals.gross.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>}
          {doc.totals?.commission !== undefined && <div>ค่าคอมมิชชั่น: <b>{doc.totals.commission.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>}
          {doc.totals?.net !== undefined && <div>ยอดสุทธิ (Net): <b>{doc.totals.net.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>}
          {kind==='receipt' && doc.totals?.amount !== undefined && <div>จำนวนเงินรับชำระ: <b>{doc.totals.amount.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="h-16" />
            <div className="border-t border-gray-400 inline-block px-8">ผู้รับสินค้า / ผู้รับเงิน</div>
            <div className="text-xs text-gray-600 mt-1">ลงชื่อ & วันที่</div>
          </div>
          <div className="text-center">
            <div className="h-16" />
            <div className="border-t border-gray-400 inline-block px-8">ผู้ส่งสินค้า / ผู้จัดทำ</div>
            <div className="text-xs text-gray-600 mt-1">ลงชื่อ & วันที่</div>
          </div>
        </div>
      </A4>
    </div>
  );
}
