import { useState } from 'react'
import { docsAPI } from '@/services/docs.api'
import PrintDoc from '@/components/docs/PrintDoc'
import { DOC_TYPES } from '@/config/docTemplates'


export default function ConsignmentPOS() {
const [mode, setMode] = useState('CATEGORY') // ITEM | CATEGORY | SUMMARY
const [doc, setDoc] = useState(null)


const createBill = async () => {
const payload = {
partnerId: 12,
lineMode: mode,
period: { year: 2025, month: 10 },
sourceId: `report_${Date.now()}`,
lines: [ { productId: 101, qty: 10, unitPrice: 25 }, { productId: 102, qty: 5, unitPrice: 25 } ],
note: 'ยอดขายเดือนนี้',
}
const res = await docsAPI.createBill(payload)
setDoc(res.doc)
}


return (
<div className="p-4 space-y-4">
<h2 className="text-xl font-semibold">POS — ฝากขาย</h2>
<div className="flex items-center gap-3">
<label className="font-medium">โหมดบรรทัด:</label>
<select className="border rounded px-2 py-1" value={mode} onChange={e=>setMode(e.target.value)}>
<option value="ITEM">ITEM (แยกรายชิ้น)</option>
<option value="CATEGORY">CATEGORY (รวมหมวด)</option>
<option value="SUMMARY">SUMMARY (รวมบรรทัดเดียว)</option>
</select>
<button className="btn px-3 py-1 rounded border" onClick={createBill}>สร้างใบวางบิล</button>
</div>


{doc && (
<div className="print-area border rounded-xl p-4">
<PrintDoc doc={doc} />
</div>
)}
</div>
)
}