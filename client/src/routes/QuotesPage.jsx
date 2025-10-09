// client/src/routes/QuotesPage.jsx
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';

export default function QuotesPage() {
  const {
    products = [], prospects = [], quotes = [],
    addProspect, addQuote, setQuoteStatus,
    checkStockForQuote, convertQuoteToConsignmentShop, convertQuoteToDelivery,
    createPurchaseDraftFromQuote
  } = useDataStore();

  // state ส่วนหัว
  const [prospectId, setProspectId] = useState(prospects[0]?.id || null);
  const [mode, setMode] = useState('consignment'); // consignment | retail | wholesale
  const [commissionPct, setCommissionPct] = useState(30);
  const [whDiscount, setWhDiscount] = useState(15);
  const [expireDate, setExpireDate] = useState(dayjs().add(14,'day').format('YYYY-MM-DD'));
  const [note, setNote] = useState('');

  // สแกน/ค้นหา + รายการสินค้า
  const [scan, setScan] = useState('');
  const [lines, setLines] = useState([]); // [{ productId, priceOffer, qty }]

  // แผนที่ข้อมูลสินค้า
  const skuById   = useMemo(()=> Object.fromEntries(products.map(p=>[p.id, p.sku||''])), [products]);
  const nameById  = useMemo(()=> Object.fromEntries(products.map(p=>[p.id, p.name||'#'])), [products]);
  const saleById  = useMemo(()=> Object.fromEntries(products.map(p=>[p.id, Number(p.salePrice ?? p.basePrice ?? 0)])), [products]);

  const addLine = (pid) => {
    const i = lines.findIndex(l => l.productId === pid);
    if (i>=0) {
      const next = [...lines]; next[i] = { ...next[i], qty: (Number(next[i].qty)||0) + 1 };
      setLines(next);
    } else {
      let price = saleById[pid] || 0;
      if (mode === 'wholesale') price = price * (1 - (Number(whDiscount)||0)/100);
      setLines([...lines, { productId: pid, priceOffer: price, qty: 1 }]);
    }
  };

  const onScanEnter = (e) => {
    if (e.key !== 'Enter') return;
    const code = (scan||'').trim().toLowerCase();
    if (!code) return;
    const p = products.find(x => (x.sku||'').toLowerCase()===code || (x.name||'').toLowerCase()===code);
    if (p) addLine(p.id);
    else alert('ไม่พบสินค้า: ' + code);
    setScan('');
  };

  const onEdit   = (idx, patch) => setLines(prev => prev.map((x,i)=> i===idx ? { ...x, ...patch } : x));
  const onRemove = (idx) => setLines(prev => prev.filter((_,i)=> i!==idx));

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'สินค้า' },
    { key: 'priceOffer', header: 'ราคาเสนอ/ชิ้น', render: (_, r, idx) => (
      <input type="number" min="0" step="0.01" className="glass rounded-xl px-2 py-1 w-28 text-right"
        value={r.priceOffer} onChange={(e)=> onEdit(idx, { priceOffer: Number(e.target.value)||0 })} />
    ) },
    { key: 'qty', header: 'จำนวน', render: (_, r, idx) => (
      <input type="number" min="0" className="glass rounded-xl px-2 py-1 w-20 text-right"
        value={r.qty} onChange={(e)=> onEdit(idx, { qty: Number(e.target.value)||0 })} />
    ) },
    ...(mode === 'consignment' ? [
      { key: 'commissionPct', header: 'คอม (%)', render: () => Number(commissionPct||0) },
      { key: 'netUnit', header: 'Net/ชิ้น' },
    ] : []),
    { key: 'amount', header: 'รวม' },
    { key: 'tools', header: 'ลบ', render: (_, __, idx) => <button className="btn btn-outline px-2 py-1" onClick={()=> onRemove(idx)}>ลบ</button> },
  ];

  const tableData = lines.map(l => {
    const unit = Number(l.priceOffer||0);
    const qty = Number(l.qty||0);
    const amount = unit * qty;
    const netUnit = mode === 'consignment' ? unit * (1 - (Number(commissionPct)||0)/100) : unit;
    return {
      ...l,
      sku: skuById[l.productId] || '',
      name: nameById[l.productId] || ('#'+l.productId),
      amount,
      netUnit,
      commissionPct: Number(commissionPct||0),
    };
  });

  const totals = useMemo(()=> {
    const gross = tableData.reduce((s, r)=> s + Number(r.amount||0), 0);
    const commission = mode === 'consignment' ? gross * (Number(commissionPct)||0)/100 : 0;
    const net = gross - commission;
    return { gross, commission, net };
  }, [tableData, mode, commissionPct]);

  const canSave = prospectId && lines.length>0 && lines.every(l=> Number(l.qty)>0);

  const payloadFromState = () => ({
    date: dayjs().format('YYYY-MM-DD'),
    expireDate,
    prospectId,
    mode,
    commissionPct: Number(commissionPct||0),
    wholesaleDiscountPct: Number(whDiscount)||0,
    note,
    lines,
  });

  const onSaveDraft = () => {
    if (!canSave) return;
    const { docNo } = addQuote(payloadFromState());
    alert('บันทึกใบเสนอราคา (DRAFT): ' + docNo);
    setLines([]);
  };

  const onSend = () => {
    if (!canSave) return;
    const { id, docNo } = addQuote(payloadFromState());
    setQuoteStatus(id, 'SENT');
    alert('ส่งใบเสนอราคา: ' + docNo);
    setLines([]);
  };

  const onCheckStock = () => {
    if (!canSave) return;
    const { id } = addQuote(payloadFromState());
    const r = checkStockForQuote(id);
    if (r.ok) alert('สต็อกเพียงพอสำหรับใบเสนอราคานี้');
    else {
      const miss = r.need.map(n => `${skuById[n.productId] || n.productId} ขาด ${n.missingQty}`).join('\n');
      alert('สต็อกไม่พอ:\n' + miss);
    }
  };

  const onConvertToDelivery = () => {
    if (!canSave) return;
    const { id } = addQuote(payloadFromState());
    const r = checkStockForQuote(id);
    if (!r.ok) {
      if (!confirm('สต็อกไม่พอ ต้องการสร้างใบสั่งซื้อร่างจากรายการที่ขาดหรือไม่?')) return;
      createPurchaseDraftFromQuote(id);
      alert('สร้าง PO ร่างจากสินค้าที่ขาดแล้ว');
      return;
    }
    const shopId = convertQuoteToConsignmentShop(id); // หากยังไม่เป็นร้าน จะสร้างใหม่อัตโนมัติ
    const doc = convertQuoteToDelivery(id, shopId);
    alert('แปลงเป็นใบส่งฝากขายเรียบร้อย: ' + (doc?.docNo || 'CD-NEW'));
  };

  // เพิ่ม Prospect แบบเร็ว
  const [newProspect, setNewProspect] = useState({ name:'', address:'', contact:'' });
  const addProspectQuick = () => {
    if (!newProspect.name.trim()) return;
    const id = addProspect(newProspect);
    setProspectId(id);
    setNewProspect({ name:'', address:'', contact:'' });
  };

  const columnsHistory = [
    { key: 'docNo', header: 'เลขที่เอกสาร' },
    { key: 'date', header: 'วันที่' },
    { key: 'prospect', header: 'คู่ค้า' },
    { key: 'mode', header: 'โหมดราคา' },
    { key: 'amount', header: 'ยอดสุทธิ' },
    { key: 'status', header: 'สถานะ' },
  ];
  const dataHistory = (quotes||[]).map(q => ({
    docNo: q.docNo,
    date: q.date,
    prospect: (prospects.find(p=>p.id===q.prospectId)?.name) || '-',
    mode: q.mode,
    amount: (q.totals?.net ?? q.totals?.gross ?? 0).toLocaleString(undefined,{minimumFractionDigits:2}),
    status: q.status,
  }));

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <div className="text-sm opacity-70">คู่ค้า (Prospect)</div>
            <select className="glass rounded-2xl px-4 py-2 outline-none" value={prospectId||''} onChange={(e)=> setProspectId(e.target.value?Number(e.target.value):null)}>
              <option value="">— เลือกคู่ค้า —</option>
              {prospects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <div className="grid grid-cols-3 gap-2">
              <input className="glass rounded-2xl px-3 py-2 col-span-1" placeholder="ชื่อคู่ค้า" value={newProspect.name} onChange={(e)=> setNewProspect(prev=>({...prev, name:e.target.value}))} />
              <input className="glass rounded-2xl px-3 py-2 col-span-1" placeholder="ที่อยู่" value={newProspect.address} onChange={(e)=> setNewProspect(prev=>({...prev, address:e.target.value}))} />
              <input className="glass rounded-2xl px-3 py-2 col-span-1" placeholder="ติดต่อ" value={newProspect.contact} onChange={(e)=> setNewProspect(prev=>({...prev, contact:e.target.value}))} />
              <button className="btn btn-outline" onClick={addProspectQuick}>+ เพิ่มคู่ค้า</button>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm opacity-70">โหมดราคา</div>
            <div className="flex gap-2">
              <button className={`btn ${mode==='consignment'?'btn-primary':'btn-outline'}`} onClick={()=> setMode('consignment')}>Consignment</button>
              <button className={`btn ${mode==='retail'?'btn-primary':'btn-outline'}`} onClick={()=> setMode('retail')}>Retail</button>
              <button className={`btn ${mode==='wholesale'?'btn-primary':'btn-outline'}`} onClick={()=> setMode('wholesale')}>Wholesale</button>
            </div>
            {mode==='consignment' && (
              <div className="flex items-center gap-2">
                <span>คอมมิชชั่น:</span>
                <input type="number" min="0" max="100" className="glass rounded-2xl px-3 py-2 w-28 text-right" value={commissionPct} onChange={(e)=> setCommissionPct(Number(e.target.value)||0)} />
                <span>%</span>
              </div>
            )}
            {mode==='wholesale' && (
              <div className="flex items-center gap-2">
                <span>ส่วนลดจากปลีก:</span>
                <input type="number" min="0" max="100" className="glass rounded-2xl px-3 py-2 w-28 text-right" value={whDiscount} onChange={(e)=> setWhDiscount(Number(e.target.value)||0)} />
                <span>%</span>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="text-sm opacity-70">วันหมดอายุ & หมายเหตุ</div>
            <input type="date" className="glass rounded-2xl px-4 py-2 outline-none" value={expireDate} onChange={(e)=> setExpireDate(e.target.value)} />
            <input className="glass rounded-2xl px-4 py-2 outline-none" placeholder="หมายเหตุ..." value={note} onChange={(e)=> setNote(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-outline" onClick={onSaveDraft}>บันทึก DRAFT</button>
              <button className="btn btn-primary" onClick={onSend}>ส่งใบเสนอ</button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-center mb-3">
          <input className="glass rounded-2xl px-4 py-2 outline-none" placeholder="สแกน/ค้นหา SKU หรือชื่อ แล้วกด Enter" value={scan} onChange={(e)=> setScan(e.target.value)} onKeyDown={onScanEnter} />
          <div className="flex gap-2 justify-end">
            <button className="btn btn-outline" onClick={()=> setLines([])}>ล้าง</button>
            <button className="btn btn-primary" onClick={onCheckStock}>ตรวจสต็อก</button>
            <button className="btn btn-primary" onClick={onConvertToDelivery}>แปลงเป็นใบส่งของ</button>
          </div>
        </div>
        <Table columns={columns} data={tableData} />
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap gap-6 justify-end text-lg">
          <div>ยอด Gross: <span className="font-semibold">{totals.gross.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
          {mode==='consignment' && <div>คอมรวม: <span className="font-semibold">{totals.commission.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>}
          <div>ยอดสุทธิ: <span className="font-semibold">{totals.net.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-lg font-semibold mb-2">ประวัติใบเสนอราคา (ล่าสุด)</div>
        <Table
          columns={[
            { key: 'docNo', header: 'เลขที่เอกสาร' },
            { key: 'date', header: 'วันที่' },
            { key: 'prospect', header: 'คู่ค้า' },
            { key: 'mode', header: 'โหมดราคา' },
            { key: 'amount', header: 'ยอดสุทธิ' },
            { key: 'status', header: 'สถานะ' },
          ]}
          data={(quotes||[]).map(q => ({
            docNo: q.docNo,
            date: q.date,
            prospect: (prospects.find(p=>p.id===q.prospectId)?.name) || '-',
            mode: q.mode,
            amount: (q.totals?.net ?? q.totals?.gross ?? 0).toLocaleString(undefined,{minimumFractionDigits:2}),
            status: q.status,
          }))}
        />
      </Card>
    </div>
  );
}
