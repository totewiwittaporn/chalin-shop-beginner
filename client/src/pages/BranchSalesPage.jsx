import { useMemo, useState } from 'react';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import dayjs from 'dayjs';

export default function BranchSalesPage() {
  const { branches = [], products = [], addBranchSale } = useDataStore();
  const [branchId, setBranchId] = useState(branches[0]?.id || null);
  const [scan, setScan] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [pay, setPay] = useState('cash');
  const [lines, setLines] = useState([]);

  const byId = useMemo(()=> new Map(products.map(p=>[p.id,p])), [products]);

  const onScanEnter = (e) => {
    if (e.key !== 'Enter') return;
    const code = scan.trim().toLowerCase();
    if (!code) return;
    const p = products.find(x => (x.sku||'').toLowerCase()===code || (x.name||'').toLowerCase()===code);
    if (p) {
      const i = lines.findIndex(l => l.productId===p.id);
      if (i>=0) {
        const next = [...lines]; next[i] = { ...next[i], qty: (Number(next[i].qty)||0) + 1 };
        setLines(next);
      } else {
        setLines([...lines, { productId: p.id, qty: 1, price: Number(p.salePrice||0) }]);
      }
      setScan('');
    } else {
      alert('ไม่พบสินค้า: ' + code);
    }
  };

  const onEdit = (idx, patch) => setLines(prev => prev.map((x,i)=> i===idx ? { ...x, ...patch } : x));
  const onRemove = (idx) => setLines(prev => prev.filter((_,i)=> i!==idx));

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'ชื่อสินค้า' },
    { key: 'price', header: 'ราคา/ชิ้น', render: (_, r, idx) => (
      <input type="number" min="0" step="0.01" className="glass rounded-xl px-2 py-1 w-28 text-right"
        value={r.price} onChange={(e)=> onEdit(idx, { price: Number(e.target.value)||0 })} />
    ) },
    { key: 'qty', header: 'จำนวน', render: (_, r, idx) => (
      <input type="number" min="0" className="glass rounded-xl px-2 py-1 w-20 text-right"
        value={r.qty} onChange={(e)=> onEdit(idx, { qty: Number(e.target.value)||0 })} />
    ) },
    { key: 'amount', header: 'รวม', render: (_, r) => (Number(r.price||0)*Number(r.qty||0)).toLocaleString(undefined,{minimumFractionDigits:2}) },
    { key: 'tools', header: 'ลบ', render: (_, __, idx) => <button className="btn btn-outline px-2 py-1" onClick={()=> onRemove(idx)}>ลบ</button> },
  ];

  const data = lines.map(l => {
    const p = byId.get(l.productId) || {};
    return { ...l, sku: p.sku, name: p.name, amount: (Number(l.price||0)*Number(l.qty||0)), tools: '' };
  });

  const totals = useMemo(()=> {
    const sum = data.reduce((acc, r)=> acc + Number(r.amount||0), 0);
    return { sum };
  }, [data]);

  const canSave = branchId && lines.length>0 && lines.every(l => Number(l.qty)>0);

  const onPay = () => {
    if (!canSave) return;
    const payload = {
      type: 'BRANCH_SALE',
      date,
      branchId,
      payMethod: pay,
      lines: lines.map(l => ({ productId: l.productId, qty: Number(l.qty)||0, price: Number(l.price)||0 })),
      amount: totals.sum
    };
    if (typeof addBranchSale === 'function') addBranchSale(payload);
    alert('บันทึกการขายหน้าร้าน (mock)');
    setLines([]);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 items-center">
          <select className="glass rounded-2xl px-4 py-2 outline-none" value={branchId||''} onChange={(e)=> setBranchId(Number(e.target.value)||null)}>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="date" className="glass rounded-2xl px-4 py-2 outline-none" value={date} onChange={(e)=> setDate(e.target.value)} />
          <select className="glass rounded-2xl px-4 py-2 outline-none" value={pay} onChange={(e)=> setPay(e.target.value)}>
            <option value="cash">เงินสด</option>
            <option value="transfer">โอน</option>
            <option value="promptpay">พร้อมเพย์</option>
            <option value="card">บัตร</option>
          </select>
          <input className="glass rounded-2xl px-4 py-2 outline-none" placeholder="สแกน/ค้นหา SKU หรือชื่อ…" value={scan} onChange={(e)=> setScan(e.target.value)} onKeyDown={onScanEnter} />
          <div className="flex gap-2 justify-end">
            <button className="btn btn-outline" onClick={()=> setLines([])}>ล้าง</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={onPay}>บันทึกการขาย & พิมพ์ใบเสร็จ</button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={data} />
      </Card>

      <Card className="p-5">
        <div className="flex justify-end gap-6 text-lg">
          <div>ยอดสุทธิ: <span className="font-semibold">{totals.sum.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
        </div>
      </Card>
    </div>
  );
}
