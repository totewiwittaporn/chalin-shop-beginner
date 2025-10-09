import { useMemo, useRef, useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import dayjs from 'dayjs';
import { Plus, X, Search, Scan, Eye, ClipboardCheck, PackageCheck, Ban } from 'lucide-react';

const money = (n) => (Number(n||0)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});

function DialogBase({ title, children, actions, onClose, maxW = 'max-w-5xl' }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative z-10 w-[96vw] ${maxW} card p-5`}>
        <div className="h-title mb-3">{title}</div>
        <div className="grid gap-4">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function SupplierPicker({ suppliers, value, onPick, onCreate }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return suppliers.slice(0, 6);
    return suppliers.filter(v =>
      (v.name||'').toLowerCase().includes(s) ||
      (v.address||'').toLowerCase().includes(s) ||
      (v.contact||'').toLowerCase().includes(s)
    ).slice(0, 6);
  }, [q, suppliers]);

  return (
    <div className="grid gap-2">
      <div className="flex gap-2 items-center">
        <Search size={16} className="text-slate-500" />
        <input
          className="glass rounded-2xl px-4 py-2 outline-none w-full"
          placeholder="ค้นหาผู้จำหน่าย…"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {results.map(s => (
          <button key={s.id} className="text-left rounded-xl px-3 py-2 hover:bg-slate-100/60"
            onClick={()=> onPick(s)}>
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-muted">{s.contact || '-'}</div>
            <div className="text-xs text-muted truncate">{s.address || '-'}</div>
          </button>
        ))}
        {results.length === 0 && (
          <div className="text-xs text-muted">ไม่พบผู้จำหน่ายที่ค้นหา คุณสามารถกรอกข้อมูลแล้วบันทึกเป็นผู้จำหน่ายใหม่ได้</div>
        )}
      </div>
      {!!q && (
        <div className="flex justify-end">
          <button className="btn btn-outline" onClick={()=> onCreate(q)}>สร้างผู้จำหน่ายใหม่จากคำค้น: “{q}”</button>
        </div>
      )}
    </div>
  );
}

function CreatePurchaseDialog({ onClose, onSave, products, suppliers }) {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [supplier, setSupplier] = useState({ id: null, name: '', address: '', contact: '' });
  const [scan, setScan] = useState('');
  const [lines, setLines] = useState([]);
  const inputRef = useRef(null);

  const productsBySku = useMemo(() => Object.fromEntries(products.map(p => [String(p.sku||'').toLowerCase(), p])), [products]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + (Number(l.qty)||0) * (Number(l.price)||0), 0), [lines]);

  const addLine = (prod) => {
    setLines(prev => {
      const idx = prev.findIndex(l => l.productId === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Number(next[idx].qty||0)+1 };
        return next;
      }
      return [...prev, { productId: prod.id, name: prod.name, sku: prod.sku, qty: 1, price: prod.basePrice ?? 0 }];
    });
    setScan('');
    setTimeout(()=> inputRef.current?.focus(), 0);
  };

  const onEnterScan = () => {
    const s = scan.trim().toLowerCase();
    if (!s) return;
    const prod = productsBySku[s] || products.find(p => String(p.name||'').toLowerCase().includes(s));
    if (prod) addLine(prod);
  };

  const setLine = (idx, patch) => {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const removeLine = (idx) => setLines(prev => prev.filter((_,i)=> i!==idx));

  const canSave = date && supplier.name && lines.length > 0;

  return (
    <DialogBase
      title="สร้างคำสั่งซื้อ"
      onClose={onClose}
      actions={<>
        <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={()=> onSave({ date, supplier, lines })}>บันทึกคำสั่งซื้อ</button>
      </>}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm text-muted">วันที่</label>
          <input type="date" className="glass rounded-2xl px-4 py-2 outline-none"
            value={date} onChange={(e)=> setDate(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted">ผู้จำหน่าย (ค้นหา/เลือก หรือกรอกใหม่)</label>
          <SupplierPicker
            suppliers={suppliers}
            value={supplier}
            onPick={(s)=> setSupplier({ id: s.id, name: s.name||'', address: s.address||'', contact: s.contact||'' })}
            onCreate={(name)=> setSupplier({ id: null, name, address: '', contact: '' })}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted">ที่อยู่</label>
          <textarea className="glass rounded-2xl px-4 py-2 outline-none min-h-[80px]"
            value={supplier.address}
            onChange={(e)=> setSupplier(prev => ({ ...prev, address: e.target.value }))} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted">ช่องทางติดต่อ (Line@/Shopee/Facebook/อื่น ๆ)</label>
          <input className="glass rounded-2xl px-4 py-2 outline-none"
            value={supplier.contact}
            onChange={(e)=> setSupplier(prev => ({ ...prev, contact: e.target.value }))}
            placeholder="Line@: @yourshop, Shopee: yourshop, FB: /yourpage" />
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <Scan size={16} className="text-slate-500" />
          <input
            ref={inputRef}
            className="glass rounded-2xl px-4 py-2 outline-none w-full"
            placeholder="สแกนบาร์โค้ด (SKU) หรือพิมพ์ชื่อ/รหัส แล้ว Enter เพื่อเพิ่ม +1"
            value={scan}
            onChange={(e)=> setScan(e.target.value)}
            onKeyDown={(e)=> e.key==='Enter' && onEnterScan()}
          />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/60 backdrop-blur">
              <tr>
                <th className="text-left p-2">สินค้า</th>
                <th className="text-right p-2">จำนวน</th>
                <th className="text-right p-2">ราคา/หน่วย</th>
                <th className="text-right p-2">รวม</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={idx} className="border-t border-slate-100/60">
                  <td className="p-2">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted">{l.sku}</div>
                  </td>
                  <td className="p-2 text-right">
                    <input type="number" min="0" className="glass rounded-xl px-2 py-1 w-24 text-right"
                      value={l.qty}
                      onChange={(e)=> setLine(idx, { qty: Number(e.target.value)||0 })} />
                  </td>
                  <td className="p-2 text-right">
                    <input type="number" min="0" step="0.01" className="glass rounded-xl px-2 py-1 w-28 text-right"
                      value={l.price}
                      onChange={(e)=> setLine(idx, { price: Number(e.target.value)||0 })} />
                  </td>
                  <td className="p-2 text-right">{money((Number(l.qty)||0)*(Number(l.price)||0))}</td>
                  <td className="p-2 text-right">
                    <button className="btn btn-outline px-2 py-1" onClick={()=> setLines(prv=> prv.filter((_,i)=> i!==idx))}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td className="p-4 text-center text-muted" colSpan={5}>ยังไม่มีสินค้าในคำสั่งซื้อ</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="p-2 font-medium text-right" colSpan={3}>ยอดรวม</td>
                <td className="p-2 text-right font-semibold">{money(subtotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </DialogBase>
  );
}

function CheckPurchaseDialog({ onClose, purchase, onSaveChecking, products }) {
  // Prepare lines with received qty (default = ordered)
  const byId = useMemo(()=> Object.fromEntries(products.map(p=>[p.id,p])), [products]);
  const [rows, setRows] = useState(
    (purchase.lines || []).map(l => ({
      productId: l.productId,
      name: byId[l.productId]?.name || l.name,
      sku: byId[l.productId]?.sku || l.sku,
      ordered: Number(l.qty)||0,
      price: Number(l.price)||0,
      received: Number(l.received ?? l.qty) || 0,
    }))
  );

  const totalOrdered = useMemo(()=> rows.reduce((s,r)=> s + r.ordered * r.price, 0), [rows]);
  const totalReceived = useMemo(()=> rows.reduce((s,r)=> s + r.received * r.price, 0), [rows]);

  const setRow = (idx, patch) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  return (
    <DialogBase
      title={`ตรวจเช็คสินค้า: ${purchase.docNo}`}
      onClose={onClose}
      actions={<>
        <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" onClick={()=> onSaveChecking(rows)}>บันทึกผลตรวจเช็ค</button>
      </>}
    >
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white/60 backdrop-blur">
            <tr>
              <th className="text-left p-2">สินค้า</th>
              <th className="text-right p-2">สั่ง</th>
              <th className="text-right p-2">รับจริง</th>
              <th className="text-right p-2">ราคาซื้อ</th>
              <th className="text-right p-2">รวม (รับจริง)</th>
              <th className="text-right p-2">ขาด/เกิน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const diff = Number(r.received||0) - Number(r.ordered||0);
              return (
                <tr key={idx} className="border-t border-slate-100/60">
                  <td className="p-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted">{r.sku}</div>
                  </td>
                  <td className="p-2 text-right">{r.ordered}</td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      min="0"
                      className="glass rounded-xl px-2 py-1 w-24 text-right"
                      value={r.received}
                      onChange={(e)=> setRow(idx, { received: Number(e.target.value)||0 })}
                    />
                  </td>
                  <td className="p-2 text-right">{money(r.price)}</td>
                  <td className="p-2 text-right">{money((Number(r.received)||0)*r.price)}</td>
                  <td className={`p-2 text-right ${diff===0?'text-slate-600': diff>0?'text-emerald-700':'text-red-700'}`}>
                    {diff>0?'+':''}{diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td className="p-2 font-medium text-right" colSpan={4}>รวมตามรับจริง</td>
              <td className="p-2 text-right font-semibold">{money(totalReceived)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </DialogBase>
  );
}

function ViewPurchaseDialog({ onClose, purchase, supplier }) {
  return (
    <DialogBase title={`ใบสั่งซื้อ: ${purchase.docNo}`} onClose={onClose} actions={<button className="btn btn-primary" onClick={onClose}>ปิด</button>}>
      <div className="grid md:grid-cols-2 gap-2">
        <div><div className="text-sm text-muted">วันที่</div><div className="font-medium">{purchase.docDate}</div></div>
        <div><div className="text-sm text-muted">ผู้จำหน่าย</div><div className="font-medium">{supplier?.name||'-'}</div></div>
        <div className="md:col-span-2"><div className="text-sm text-muted">ที่อยู่</div><div className="">{supplier?.address||'-'}</div></div>
        <div className="md:col-span-2"><div className="text-sm text-muted">ติดต่อ</div><div className="">{supplier?.contact||'-'}</div></div>
      </div>
      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white/60 backdrop-blur">
            <tr>
              <th className="text-left p-2">สินค้า</th>
              <th className="text-right p-2">จำนวน</th>
              <th className="text-right p-2">ราคา/หน่วย</th>
              <th className="text-right p-2">รวม</th>
            </tr>
          </thead>
          <tbody>
            {purchase.lines.map((l,i)=> (
              <tr key={i} className="border-t border-slate-100/60">
                <td className="p-2">{l.name} <span className="text-xs text-muted">{l.sku}</span></td>
                <td className="p-2 text-right">{l.qty}</td>
                <td className="p-2 text-right">{money(l.price)}</td>
                <td className="p-2 text-right">{money(l.qty*l.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td className="p-2 font-medium text-right" colSpan={3}>ยอดรวม</td>
              <td className="p-2 text-right font-semibold">{money(purchase.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </DialogBase>
  );
}

export default function PurchasesPage() {
  const {
    products,
    suppliers,
    purchases,
    addSupplierIfMissingOrGetId,
    addPurchase,
    setPurchaseStatus,
    updatePurchaseChecking,     // NEW
    receivePurchaseToInventory, // NEW
  } = useDataStore();

  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [checking, setChecking] = useState(null); // purchase object

  const suppliersById = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s])), [suppliers]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = purchases.map(p => ({ ...p, supplierName: suppliersById[p.supplierId]?.name || '-' }));
    if (!s) return arr;
    return arr.filter(p =>
      (p.docNo||'').toLowerCase().includes(s) ||
      (p.docDate||'').toLowerCase().includes(s) ||
      (p.supplierName||'').toLowerCase().includes(s)
    );
  }, [q, purchases, suppliersById]);

  const columns = [
    { key: 'docNo', header: 'เลขที่เอกสาร' },
    { key: 'docDate', header: 'วันที่ทำเอกสาร' },
    { key: 'supplier', header: 'ผู้จำหน่าย', render: (_, row) => row.supplierName },
    { key: 'total', header: 'ยอดรวม', render: (v,row) => money(row.total) },
    { key: 'status', header: 'สถานะ', render: (v,row) => (
      <span className={
        row.status === 'ORDERED' ? 'text-amber-700' :
        row.status === 'CHECKING' ? 'text-blue-700' :
        row.status === 'RECEIVED' ? 'text-emerald-700' :
        row.status === 'CANCELED' ? 'text-slate-500' : ''
      }>
        {row.status === 'ORDERED' ? 'สั่งซื้อสินค้า' :
         row.status === 'CHECKING' ? 'ตรวจเช็คสินค้า' :
         row.status === 'RECEIVED' ? 'รับสินค้า' :
         row.status === 'CANCELED' ? 'ยกเลิก' : row.status}
      </span>
    ) },
    { key: 'tools', header: 'เครื่องมือ', render: (_, row) => (
      <div className="flex gap-2">
        {row.status === 'ORDERED' && (
          <>
            <button className="btn btn-outline px-2 py-1" title="ตรวจเช็คสินค้า"
              onClick={()=> setChecking(row)}>
              <ClipboardCheck size={16} />
            </button>
            <button className="btn btn-outline px-2 py-1" title="ยกเลิกใบสั่งซื้อ"
              onClick={()=> setPurchaseStatus(row.id, 'CANCELED')}>
              <Ban size={16} />
            </button>
          </>
        )}
        {row.status === 'CHECKING' && (
          <button className="btn btn-outline px-2 py-1" title="รับสินค้า"
            onClick={()=> receivePurchaseToInventory(row.id)}>
            <PackageCheck size={16} />
          </button>
        )}
        {(row.status === 'RECEIVED' || row.status === 'CANCELED') && (
          <button className="btn btn-outline px-2 py-1" title="ดูบิล"
            onClick={()=> setViewing(row)}>
            <Eye size={16} />
          </button>
        )}
      </div>
    )},
  ];

  const onSaveNew = ({ date, supplier, lines }) => {
    const supplierId = addSupplierIfMissingOrGetId({
      name: supplier.name,
      address: supplier.address,
      contact: supplier.contact,
    });

    const byId = new Map(products.map(p=>[p.id,p]));
    const normLines = lines
      .filter(l => l.qty>0 && l.price>=0)
      .map(l => {
        const p = byId.get(l.productId);
        return { productId: l.productId, name: p?.name||l.name, sku: p?.sku||l.sku, qty: Number(l.qty)||0, price: Number(l.price)||0 };
      });

    addPurchase({ date, supplierId, lines: normLines });
    setCreating(false);
  };

  const onSaveChecking = (rows) => {
    if (!checking) return;
    updatePurchaseChecking(checking.id, rows.map(r => ({
      productId: r.productId,
      received: Number(r.received)||0,
    })));
    setChecking(null);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            className="glass rounded-2xl px-4 py-2 outline-none"
            placeholder="ค้นหาเลขที่เอกสาร/วันที่/ผู้จำหน่าย…"
            value={q}
            onChange={(e)=> setQ(e.target.value)}
          />
          <button className="btn btn-primary" onClick={()=> setCreating(true)}>
            <Plus className="mr-2" size={16} /> สร้างคำสั่งซื้อ
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={filtered.map(p => ({ ...p, tools: '' }))} />
      </Card>

      {creating && (
        <CreatePurchaseDialog
          onClose={()=> setCreating(false)}
          onSave={onSaveNew}
          products={products}
          suppliers={suppliers}
        />
      )}

      {checking && (
        <CheckPurchaseDialog
          onClose={()=> setChecking(null)}
          purchase={checking}
          onSaveChecking={onSaveChecking}
          products={products}
        />
      )}

      {viewing && (
        <ViewPurchaseDialog
          onClose={()=> setViewing(null)}
          purchase={viewing}
          supplier={suppliersById[viewing.supplierId]}
        />
      )}
    </div>
  );
}
