import { useState } from 'react'
import { deliveryAPI } from '@/services/delivery.api'
import PrintDoc from '@/components/docs/PrintDoc'
import { DOC_TYPES } from '@/config/docTemplates'


export default function BranchDelivery() {
const [doc, setDoc] = useState(null)


const createDelivery = async () => {
const res = await deliveryAPI.createBranch({
toBranchId: 3,
lines: [ { productId: 101, qty: 10, unitPrice: 25 }, { productId: 102, qty: 5, unitPrice: 25 } ],
note: 'เติมสต็อก',
})
setDoc(res.doc)
}


return (
<div className="p-4 space-y-4">
<h2 className="text-xl font-semibold">Delivery — สาขา</h2>
<button className="btn px-3 py-1 rounded border" onClick={createDelivery}>สร้างใบส่งสินค้า</button>
{doc && (
<div className="print-area border rounded-xl p-4">
<PrintDoc doc={{
header: { docType: DOC_TYPES.DELIVERY_BRANCH, docNo: doc.docNo || 'DLV-BR-XXXX', docDate: doc.docDate || new Date().toISOString().slice(0,10), title: 'ใบส่งสินค้า' },
issuer: doc.issuer, recipient: doc.recipient,
lines: doc.lines,
money: doc.money,
payment: doc.payment,
}} />
</div>
)}
</div>
)
}