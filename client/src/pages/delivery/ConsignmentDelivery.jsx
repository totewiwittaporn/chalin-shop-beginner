import { useState } from 'react';
import { deliveryAPI } from '@/services/delivery.api';
import PrintDoc from '@/components/docs/PrintDoc';
import { DOC_TYPES } from '@/config/docTemplates';

export default function ConsignmentDelivery() {
  const [mode, setMode] = useState('CATEGORY');
  const [doc, setDoc] = useState(null);

  const createDelivery = async () => {
    const res = await deliveryAPI.createConsignment({
      partnerId: 12,
      lineMode: mode, // ITEM | CATEGORY
      lines: [
        { productId: 101, qty: 10, unitPrice: 25 },
        { productId: 102, qty: 5, unitPrice: 25 },
      ],
      note: 'ส่งประจำเดือน',
    });
    setDoc(res.doc);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Delivery — ฝากขาย</h2>
      <div className="flex items-center gap-3">
        <label className="font-medium">โหมดบรรทัด:</label>
        <select
          className="border rounded px-2 py-1"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="ITEM">ITEM (แยกรายชิ้น)</option>
          <option value="CATEGORY">CATEGORY (รวมหมวด)</option>
        </select>
        <button className="btn px-3 py-1 rounded border" onClick={createDelivery}>
          สร้างใบส่งสินค้า
        </button>
      </div>

      {doc && (
        <div className="print-area border rounded-xl p-4">
          <PrintDoc
            doc={{
              header: {
                docType: DOC_TYPES.DELIVERY_CONSIGNMENT,
                docNo: doc.docNo || 'DLV-CN-XXXX',
                docDate: doc.docDate || new Date().toISOString().slice(0, 10),
                title: 'DELIVERY',
              },
              issuer: doc.issuer,
              recipient: doc.recipient,
              lines: doc.lines,
              money: doc.money,
              payment: doc.payment,
            }}
          />
        </div>
      )}
    </div>
  );
}
