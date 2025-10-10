import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useDataStore } from '../store/dataStore.js';
import { Store, Building2, ClipboardCheck, ArrowLeft } from 'lucide-react';

function normalizeScope(s, role) {
  const v = (s || '').toLowerCase();
  if (role === 'STAFF') return 'branch';
  if (role === 'CONSIGNMENT') return 'consignment';
  if (v === 'branch' || v === 'branches') return 'branch';
  if (v === 'consignment' || v === 'shop') return 'consignment';
  return 'branch'; // default for page
}

export default function CountInventoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || 'ADMIN';
  const branchId = user?.branchId || null;

  const {
    products,
    inventory,
    branches,
    consignmentShops,
    setInventoryQty,            // for applying on save
    createCountInventoryReport, // new method (add to store)
  } = useDataStore();

  const [params] = useSearchParams();
  const initialScope = normalizeScope(params.get('scope'), role);
  const [scope, setScope] = useState(initialScope);
  const [branch, setBranch] = useState(role==='STAFF' ? branchId : Number(params.get('locationId')) || branches[0]?.id || null);
  const [shop, setShop] = useState(Number(params.get('locationId')) || consignmentShops[0]?.id || null);

  const isAdmin = role === 'ADMIN';
  const effectiveScope = role==='STAFF' ? 'branch' : role==='CONSIGNMENT' ? 'consignment' : scope;

  // Indexes
  const skuById = useMemo(() => Object.fromEntries(products.map(p => [p.id, p.sku || ''])), [products]);
  const idBySku = useMemo(() => Object.fromEntries(products.map(p => [String(p.sku || '').toLowerCase(), p.id])), [products]);
  const nameById = useMemo(() => Object.fromEntries(products.map(p => [p.id, p.name || ''])), [products]);
  const productSorted = useMemo(() => [...products].sort((a,b)=> (a.name||'').localeCompare(b.name||'')), [products]);

  // Count state { productId -> counted }
  const [counts, setCounts] = useState({}); // e.g., {1:3, 2:1}
  const totalItems = useMemo(()=> Object.values(counts).reduce((s,v)=> s+Number(v||0), 0), [counts]);

  // Helpers
  const getLocation = () => {
    if (effectiveScope === 'branch') return { type: 'BRANCH', id: role==='STAFF' ? branchId : branch };
    if (effectiveScope === 'consignment') return { type: 'CONSIGNMENT', id: shop };
    return { type: 'MAIN', id: 1 };
  };

  const getStockAtLoc = (pid) => {
    const loc = getLocation();
    return inventory
      .filter(i => i.locationType === loc.type && i.locationId === loc.id && i.productId === pid)
      .reduce((s,i)=> s+i.qty, 0);
  };

  // Search/Scan
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    // Exact SKU match goes first
    const exactSku = idBySku[s];
    const list = [];
    if (exactSku) list.push(products.find(p => p.id === exactSku));
    // Name or SKU contains
    productSorted.forEach(p => {
      const inName = (p.name || '').toLowerCase().includes(s);
      const inSku = (p.sku || '').toLowerCase().includes(s);
      if ((inName || inSku) && (!exactSku || p.id !== exactSku)) list.push(p);
    });
    return list.slice(0, 8);
  }, [q, idBySku, productSorted, products]);

  const addOne = (pid) => {
    setCounts(prev => ({ ...prev, [pid]: Number(prev[pid] || 0) + 1 }));
    setQ('');
    // Keep focus for fast scanning
    setTimeout(()=> inputRef.current?.focus(), 0);
  };

  const onEnter = () => {
    const s = q.trim().toLowerCase();
    if (!s) return;
    // Prefer exact SKU match
    const pid = idBySku[s] || matches[0]?.id;
    if (pid) addOne(pid);
  };

  const rows = useMemo(() => {
    const ids = Object.keys(counts).map(Number);
    const r = ids.map(pid => {
      const counted = Number(counts[pid] || 0);
      const stock = getStockAtLoc(pid);
      const diff = counted - stock;
      return {
        productId: pid,
        name: nameById[pid] || ('#'+pid),
        counted,
        stock,
        diff,
      };
    });
    return r.sort((a,b)=> a.name.localeCompare(b.name));
  }, [counts, inventory, branch, shop, scope, nameById]);

  const canSave = rows.length > 0 && getLocation().id;

  const onSave = () => {
    const loc = getLocation();
    // Build items
    const items = rows.map(r => ({
      productId: r.productId,
      counted: r.counted,
      stockBefore: r.stock,
      diff: r.diff,
    }));
    if (typeof createCountInventoryReport === 'function') {
      createCountInventoryReport({
        locationType: loc.type,
        locationId: loc.id,
        items,
      });
    } else {
      // Fallback: apply directly
      items.forEach(it => {
        setInventoryQty({
          locationType: loc.type,
          locationId: loc.id,
          productId: it.productId,
          qty: it.counted,
        });
      });
    }
    alert('บันทึกผลนับสต็อกแล้ว (mock)');
    navigate('/inventory');
  };

  useEffect(()=>{
    inputRef.current?.focus();
  }, []);

  const LocationSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {isAdmin && (
        <div className="flex gap-2">
          <button
            className={`btn ${effectiveScope==='branch' ? 'btn-primary' : 'btn-outline'}`}
            onClick={()=> setScope('branch')}
          >
            <Store className="mr-2" size={16} /> ร้านสาขา
          </button>
          <button
            className={`btn ${effectiveScope==='consignment' ? 'btn-primary' : 'btn-outline'}`}
            onClick={()=> setScope('consignment')}
          >
            <Store className="mr-2" size={16} /> ร้านฝากขาย
          </button>
        </div>
      )}
      {effectiveScope === 'branch' && (
        <select
          className="glass rounded-2xl px-4 py-2 outline-none"
          value={role==='STAFF' ? branchId : branch || ''}
          disabled={role==='STAFF'}
          onChange={(e)=> setBranch(Number(e.target.value)||null)}
        >
          {role!=='STAFF' && <option value="">— เลือกร้านสาขา —</option>}
          {branches.map(b => (
            <option key={b.id} value={b.id}>
              {b.code || ''} {b.name}
            </option>
          ))}
        </select>
      )}
      {effectiveScope === 'consignment' && (
        <select
          className="glass rounded-2xl px-4 py-2 outline-none"
          value={shop || ''}
          onChange={(e)=> setShop(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— เลือกร้านฝากขาย —</option>
          {consignmentShops.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
      <div className="text-right font-medium self-center">รวมจำนวน: {totalItems}</div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <button className="btn btn-outline" onClick={()=> navigate(-1)}>
          <ArrowLeft className="mr-2" size={16} /> ย้อนกลับ
        </button>
        <div className="h-title">Count Inventory</div>
      </div>

      <Card className="p-5">
        <LocationSelector />
      </Card>

      <Card className="p-5">
        <label className="block text-sm text-muted mb-2">สแกนบาร์โค้ดหรือพิมพ์ชื่อ/รหัสสินค้า แล้วกด Enter</label>
        <input
          ref={inputRef}
          className="w-full glass rounded-2xl px-4 py-2 outline-none"
          placeholder="สแกน/ค้นหาสินค้า…"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
          onKeyDown={(e)=> e.key==='Enter' && onEnter()}
        />
        {/* Suggestions */}
        {q && (
          <div className="mt-2 grid gap-1">
            <small className="text-muted">ผลลัพธ์ที่ตรง (สูงสุด 8 รายการ):</small>
            <div className="grid">
              {matches.map(p => (
                <button
                  key={p.id}
                  className="text-left px-3 py-2 rounded-xl hover:bg-slate-100/50"
                  onClick={()=> addOne(p.id)}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted">{p.sku}</div>
                </button>
              ))}
              {matches.length === 0 && <div className="text-xs text-muted px-3 py-2">ไม่พบสินค้า</div>}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-0">
        <Table
          columns={[
            { key: 'name', header: 'ชื่อสินค้า' },
            { key: 'counted', header: 'จำนวนสินค้า' },
            { key: 'stock', header: 'จำนวนที่มีอยู่จริงในสต็อก' },
            { key: 'diff', header: 'จำนวนขาด/เกิน', render: (v)=> (
              <span className={`${v===0 ? 'text-slate-600' : v>0 ? 'text-emerald-700' : 'text-red-700'} font-medium`}>
                {v>0?'+':''}{v}
              </span>
            ) },
          ]}
          data={rows}
        />
      </Card>

      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          disabled={!canSave}
          onClick={onSave}
          title="บันทึกการนับและตัดสต็อกตามที่นับได้ (mock)"
        >
          <ClipboardCheck className="mr-2" size={16} /> บันทึกการนับสินค้า
        </button>
      </div>
    </div>
  );
}
