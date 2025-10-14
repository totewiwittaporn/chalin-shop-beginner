import { useState } from 'react'
import { docsAPI } from '@/services/docs.api'
import PrintDoc from '@/components/docs/PrintDoc'
import { DOC_TYPES } from '@/config/docTemplates'


export default function BranchPOS() {
const [cart, setCart] = useState([])
const [doc, setDoc] = useState(null)


const addMock = () => setCart((c) => [...c, { name: 'Sample Item', amount: 100 }])


const checkout = async () => {
const grandTotal = cart.reduce((s, i) => s + (i.amount || 0), 0)
// minimal payload — adjust to your backend
const payload = {
context: 'BRANCH_POS',
branchId: 1,
refDocId: `sale_${Date.now()}`,
payments: [{ kind: 'CASH', amount: grandTotal }],
}
const res = await docsAPI.createReceipt(payload)
setDoc(res.doc)
}


return (
<div className="p-4 space-y-4">
<h2 className="text-xl font-semibold">POS — สาขา</h2>
<div className="flex gap-2">
<button className="btn btn-primary px-3 py-1 rounded bg-slate-800 text-white" onClick={addMock}>เพิ่มสินค้า (mock)</button>
<button className="btn px-3 py-1 rounded border" onClick={checkout} disabled={!cart.length}>ชำระเงิน</button>
</div>
<ul className="list-disc pl-6">
{cart.map((i, idx) => <li key={idx}>{i.name} — {i.amount}</li>)}
</ul>


{doc && (
<div className="print-area border rounded-xl p-4">
<PrintDoc doc={{
header: { docType: DOC_TYPES.RECEIPT_STANDARD, docNo: doc.docNo || 'RCPT-XXXX', docDate: doc.docDate || new Date().toISOString().slice(0,10) },
issuer: doc.issuer, recipient: doc.recipient,
lines: doc.lines?.length ? doc.lines : cart.map((c, i) => ({ no: i+1, name: c.name, amount: c.amount })),
money: doc.money || { grandTotal: cart.reduce((s,i)=>s+i.amount,0) },
payment: doc.payment || { cash: true },
}} />
</div>
)}
</div>
)
}