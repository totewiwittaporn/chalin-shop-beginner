// client/src/pages/ConsignmentSalesPage.jsx
import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import dayjs from 'dayjs';
import { resolveCommissionPct, calcNetUnitPrice } from '../utils/consignmentCalc.js';

export default function ConsignmentSalesPage() {
  const {
    consignmentShops = [], products = [], consignmentCategories = [], productConsignmentMap = [], consignmentCategoryOverrides = [],
    postConsignmentSales
  } = useDataStore();

  const [shopId, setShopId] = useState(consignmentShops[0]?.id || null);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [scan, setScan] = useState('');
  const [lines, setLines] = useState([]);

  const byId = useMemo(()=> new Map(products.map(p=>[p.id,p])), [products]);
  const shop = useMemo(()=> consignmentShops.find(s=> s.id===shopId), [consignmentShops, shopId]);

  const catByProduct = useMemo(()=> {
    const map = new Map();
    for (const link of productConsignmentMap) {
      if (link.shopId === shopId) map.set(link.productId, link.categoryId);
    }
    return map;
  }, [productConsignmentMap, shopId]);

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
    { key: 'category', header: 'หมวด (ร้าน)' },
    { key: 'price', header: 'ราคาขาย/ชิ้น', render: (_, r, idx) => (
      <input type="number" min="0" step="0.01" className="glass rounded-xl px-2 py-1 w-28 text-right"
        value={r.price} onChange={(e)=> onEdit(idx, { price: Number(e.target.value)||0 })} />
    ) },
    { key: 'qty', header: 'จำนวน', render: (_, r, idx) => (
      <input type="number" min="0" className="glass rounded-xl px-2 py-1 w-20 text-right"
        value={r.qty} onChange={(e)=> onEdit(idx, { qty: Number(e.target.value)||0 })} />
    ) },
    { key: 'netUnit', header: 'Net/ชิ้น (ตามคอม)' },
    { key: 'amountNet', header: 'รวมสุทธิ' },
    { key: 'commissionPct', header: 'คอม (%)' },
    { key: 'commissionAmount', header: 'คอม (บาท)' },
    { key: 'tools', header: 'ลบ', render: (_, __, idx) => <button className="btn btn-outline px-2 py-1" onClick={()=> onRemove(idx)}>ลบ</button> },
  ];

  const data = lines.map(l => {
    const p = byId.get(l.productId) || {};
    const catId = catByProduct.get(l.productId);
    const cat = consignmentCategories.find(c => c.id===catId);
    const ov  = consignmentCategoryOverrides.find(o => o.shopId===shopId && o.categoryId===catId);
    const pct = resolveCommissionPct({ categoryOverride: ov, shop });
    const unitGross = Number(l.price ?? p.salePrice ?? p.basePrice ?? 0);
    const qty = Number(l.qty)||0;
    const unitNet = calcNetUnitPrice({ product: { ...p, salePrice: unitGross }, category: cat, shop, categoryOverride: ov });
    const amountNet = unitNet * qty;
    const amountGross = unitGross * qty;
    const commissionAmount = amountGross - amountNet;

    return {
      ...l,
      sku: p.sku, name: p.name,
      category: cat?.name || '-',
      netUnit: unitNet,
      amountNet,
      commissionPct: pct,
      commissionAmount,
      tools: ''
    };
  });

  const totals = useMemo(()=> {
    let net = 0, com = 0;
    for (const r of data) { net += Number(r.amountNet||0); com += Number(r.commissionAmount||0); }
    return { net, com };
  }, [data]);

  const canPost = shopId && lines.length>0 && lines.every(l => Number(l.qty)>0);

  const onPost = () => {
    if (!canPost) return;
    const payload = {
      type: 'CONSIGNMENT_SALES',
      date,
      shopId,
      lines: lines.map(l => ({ productId: l.productId, qty: Number(l.qty)||0, price: Number(l.price)||0 })),
      totals
    };
    if (typeof postConsignmentSales === 'function') postConsignmentSales(payload);
    alert('โพสต์ยอดขายฝากขาย (mock)');
    setLines([]);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 items-center">
          <select className="glass rounded-2xl px-4 py-2 outline-none" value={shopId||''} onChange={(e)=> setShopId(Number(e.target.value)||null)}>
            {consignmentShops.map(s => <option key={s.id} value={s.id}>{s.nameInternal || s.name}</option>)}
          </select>
          <input type="date" className="glass rounded-2xl px-4 py-2 outline-none" value={date} onChange={(e)=> setDate(e.target.value)} />
          <input className="glass rounded-2xl px-4 py-2 outline-none" placeholder="สแกน/ค้นหา SKU หรือชื่อ…" value={scan} onChange={(e)=> setScan(e.target.value)} onKeyDown={onScanEnter} />
          <div className="flex gap-2 justify-end xl:col-span-2">
            <button className="btn btn-outline" onClick={()=> setLines([])}>ล้าง</button>
            <button className="btn btn-primary" disabled={!canPost} onClick={onPost}>โพสต์ยอดขาย</button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={data} />
      </Card>

      <Card className="p-5">
        <div className="flex justify-end gap-8 text-lg">
          <div>คอมรวม: <span className="font-semibold">{totals.com.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
          <div>สุทธิรวม: <span className="font-semibold">{totals.net.toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
        </div>
      </Card>
    </div>
  );
}
