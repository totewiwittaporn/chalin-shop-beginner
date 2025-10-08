import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useDataStore } from '../store/dataStore.js';
import { ClipboardCheck, Store, Building2 } from 'lucide-react';

function normalizeScope(s, role) {
  const v = (s || '').toLowerCase();
  if (role === 'STAFF') return 'branch';
  if (role === 'CONSIGNMENT') return 'consignment';
  if (v === 'branch' || v === 'branches') return 'branch';
  if (v === 'consignment' || v === 'shop') return 'consignment';
  return 'main';
}

function ScopePills({ scope, setScope, role }) {
  const isAdmin = role === 'ADMIN';
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
      {(isAdmin || role === 'STAFF') && (
        <button
          className={`btn ${scope === 'branch' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setScope('branch')}
        >
          <Store className="mr-2" size={16} /> สาขา
        </button>
      )}
      {(isAdmin || role === 'CONSIGNMENT') && (
        <button
          className={`btn ${scope === 'consignment' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setScope('consignment')}
        >
          <Store className="mr-2" size={16} /> ฝากขาย
        </button>
      )}
    </div>
  );
}

export default function InventoryPage({ defaultScope = 'main' }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || 'ADMIN';
  const branchId = user?.branchId || null;

  const { products, inventory, branches, consignmentShops } = useDataStore();
  const skuById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.sku])), [products]);
  const nameById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products]
  );

  const [params] = useSearchParams();
  const initScope = normalizeScope(params.get('scope') || defaultScope, role);

  const [scope, setScope] = useState(initScope);
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState(role === 'STAFF' ? branchId : branches[0]?.id || null);
  const [shop, setShop] = useState(consignmentShops[0]?.id || null);

  const effectiveScope =
    role === 'STAFF' ? 'branch' : role === 'CONSIGNMENT' ? 'consignment' : scope;

  const rows = useMemo(() => {
    let filtered = inventory;
    if (effectiveScope === 'main') {
      filtered = inventory.filter((i) => i.locationType === 'MAIN');
    } else if (effectiveScope === 'branch') {
      const id = role === 'STAFF' ? branchId : branch;
      if (!id) return [];
      filtered = inventory.filter((i) => i.locationType === 'BRANCH' && i.locationId === id);
    } else if (effectiveScope === 'consignment') {
      if (!shop) {
        filtered = inventory.filter((i) => i.locationType === 'CONSIGNMENT');
      } else {
        filtered = inventory.filter(
          (i) => i.locationType === 'CONSIGNMENT' && i.locationId === shop
        );
      }
    }

    const map = new Map();
    filtered.forEach((i) => {
      map.set(i.productId, (map.get(i.productId) || 0) + i.qty);
    });

    const arr = [...map.entries()].map(([pid, qty]) => ({
      productId: pid,
      sku: skuById[pid] || '',
      name: nameById[pid] || '#' + pid,
      qty,
    }));

    const s = q.trim().toLowerCase();
    const result = s
      ? arr.filter((r) => r.name.toLowerCase().includes(s) || r.sku.toLowerCase().includes(s))
      : arr;

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, effectiveScope, branch, shop, q, role, branchId, skuById, nameById]);

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'สินค้า' },
    { key: 'qty', header: 'คงเหลือ', render: (val) => <span className="font-medium">{val}</span> },
  ];

  const isAdmin = role === 'ADMIN';
  const canCount =
    isAdmin &&
    ((effectiveScope === 'branch' && !!branch) ||
      (effectiveScope === 'consignment' && (!!shop || consignmentShops.length > 0)));

  const goCount = () => {
    const params = new URLSearchParams();
    params.set('scope', effectiveScope);
    if (effectiveScope === 'branch' && branch) params.set('locationId', String(branch));
    if (effectiveScope === 'consignment' && (shop || consignmentShops[0]?.id)) {
      params.set('locationId', String(shop || consignmentShops[0].id));
    }
    navigate(`/inventory/count?${params.toString()}`);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] gap-3 items-center">
          <ScopePills scope={effectiveScope} setScope={setScope} role={role} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {effectiveScope === 'branch' && (
              <select
                className="glass rounded-2xl px-4 py-2 outline-none"
                value={role === 'STAFF' ? branchId : branch || ''}
                disabled={role === 'STAFF'}
                onChange={(e) => setBranch(Number(e.target.value) || null)}
              >
                {role !== 'STAFF' && <option value="">— เลือกสาขา —</option>}
                {branches.map((b) => (
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
                onChange={(e) => setShop(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— ทั้งหมด (ฝากขาย) —</option>
                {consignmentShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
            <button
              className="btn btn-primary"
              disabled={!canCount}
              onClick={goCount}
              title={isAdmin ? 'นับสต็อก' : 'เฉพาะ ADMIN'}
            >
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
