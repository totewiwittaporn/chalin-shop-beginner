import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { ClipboardCheck, Store, Building2 } from 'lucide-react';

function ScopePills({ scope, setScope, isAdmin }) {
  return (
    <div className="flex flex-wrap gap-2">
      {isAdmin && (
        <button
          className={`btn ${scope === 'main' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setScope('main')}
        >
          <Building2 className="mr-2" size={16} /> สต็อกกลาง
        </button>
      )}
      <button
        className={`btn ${scope === 'branch' ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => setScope('branch')}
      >
        <Store className="mr-2" size={16} /> สาขา
      </button>
      <button
        className={`btn ${scope === 'consignment' ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => setScope('consignment')}
      >
        <Store className="mr-2" size={16} /> ฝากขาย
      </button>
    </div>
  );
}

export default function InventoryPage({ defaultScope = 'main' }) {
  const navigate = useNavigate();
  const {
    products = [],
    branches = [],
    consignmentShops = [],
    centralStock = {},
    branchStock = {},
    consignmentStock = {},
  } = useDataStore();

  const [params] = useSearchParams();
  const paramScope = (params.get('scope') || defaultScope).toLowerCase();
  const [scope, setScope] = useState(
    ['main', 'branch', 'consignment'].includes(paramScope) ? paramScope : 'main'
  );
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState(branches[0]?.id || null);
  const [shop, setShop] = useState(consignmentShops[0]?.id || null);

  const skuById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.sku || ''])),
    [products]
  );
  const nameById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name || `#${p.id}`])),
    [products]
  );

  // แปลง bucket → แถวสำหรับตาราง
  const rows = useMemo(() => {
    let bucket = {};
    if (scope === 'main') {
      // centralStock: { productId: qty }
      bucket = centralStock || {};
      const arr = Object.entries(bucket).map(([pid, qty]) => ({
        productId: Number(pid),
        sku: skuById[pid] || '',
        name: nameById[pid] || `#${pid}`,
        qty: Number(qty || 0),
      }));
      return filterSort(arr, q);
    }

    if (scope === 'branch') {
      // branchStock: { [branchId]: { productId: qty } }
      const bId = branch || branches[0]?.id;
      const bBucket = (branchStock && branchStock[bId]) || {};
      const arr = Object.entries(bBucket).map(([pid, qty]) => ({
        productId: Number(pid),
        sku: skuById[pid] || '',
        name: nameById[pid] || `#${pid}`,
        qty: Number(qty || 0),
      }));
      return filterSort(arr, q);
    }

    // consignment
    const sId = shop || consignmentShops[0]?.id;
    const cBucket = (consignmentStock && consignmentStock[sId]) || {};
    const arr = Object.entries(cBucket).map(([pid, qty]) => ({
      productId: Number(pid),
      sku: skuById[pid] || '',
      name: nameById[pid] || `#${pid}`,
      qty: Number(qty || 0),
    }));
    return filterSort(arr, q);
  }, [scope, q, branch, shop, branches, consignmentShops, centralStock, branchStock, consignmentStock, skuById, nameById]);

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'สินค้า' },
    { key: 'qty', header: 'คงเหลือ', render: (val) => <span className="font-medium">{val}</span> },
  ];

  const goCount = () => {
    const sp = new URLSearchParams();
    sp.set('scope', scope);
    if (scope === 'branch' && branch) sp.set('locationId', String(branch));
    if (scope === 'consignment' && (shop || consignmentShops[0]?.id)) {
      sp.set('locationId', String(shop || consignmentShops[0].id));
    }
    navigate(`/inventory/count?${sp.toString()}`);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] gap-3 items-center">
          <ScopePills scope={scope} setScope={setScope} isAdmin={true} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scope === 'branch' && (
              <select
                className="glass rounded-2xl px-4 py-2 outline-none"
                value={branch || ''}
                onChange={(e) => setBranch(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— เลือกสาขา —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {(b.code ? b.code + ' ' : '') + (b.name || '')}
                  </option>
                ))}
              </select>
            )}
            {scope === 'consignment' && (
              <select
                className="glass rounded-2xl px-4 py-2 outline-none"
                value={shop || ''}
                onChange={(e) => setShop(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— เลือกร้านฝากขาย —</option>
                {consignmentShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameInternal || s.name}
                  </option>
                ))}
              </select>
            )}
            <input
              className="glass rounded-2xl px-4 py-2 outline-none md:col-span-2"
              placeholder="ค้นหา SKU/ชื่อสินค้า…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={goCount}>
              <ClipboardCheck className="mr-2" size={16} />
              นับสต็อก
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={rows} />
      </Card>
    </div>
  );
}

function filterSort(arr, q) {
  const s = (q || '').trim().toLowerCase();
  const res = s
    ? arr.filter((r) => (r.name || '').toLowerCase().includes(s) || (r.sku || '').toLowerCase().includes(s))
    : arr;
  return res.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}
