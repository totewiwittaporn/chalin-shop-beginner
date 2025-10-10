// client/src/pages/ConsignmentCategoriesPage.jsx
import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react';

export default function ConsignmentCategoriesPage() {
  const {
    consignmentShops = [],
    products = [],
    consignmentCategories = [],
    productConsignmentMap = [],
    consignmentCategoryOverrides = [],
    upsertConsignmentCategory,
    deleteConsignmentCategory,
    linkProductToShopCategory,
    unlinkProductFromShop,
    setConsignmentCategoryCommission,
  } = useDataStore();

  const [shopId, setShopId] = useState(consignmentShops[0]?.id || null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [pickProductsOpen, setPickProductsOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const cats = useMemo(() => consignmentCategories.filter(c => c.shopId === shopId), [consignmentCategories, shopId]);
  const filteredCats = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cats;
    return cats.filter(c => (c.code || '').toLowerCase().includes(s) || (c.name || '').toLowerCase().includes(s));
  }, [cats, q]);

  const productsInSelected = useMemo(() => {
    if (!selectedCategoryId) return [];
    const ids = productConsignmentMap.filter(m => m.shopId === shopId && m.categoryId === selectedCategoryId).map(m => m.productId);
    const byId = new Set(ids);
    return products.filter(p => byId.has(p.id));
  }, [productConsignmentMap, products, shopId, selectedCategoryId]);

  const productsNotInSelected = useMemo(() => {
    const mappedIds = new Set(productConsignmentMap.filter(m => m.shopId === shopId).map(m => m.productId));
    return products.filter(p => !mappedIds.has(p.id));
  }, [productConsignmentMap, products, shopId]);

  const onSaveCategory = () => {
    if (!editing) return;
    if (!editing.name) { alert('กรุณากรอกชื่อหมวด'); return; }
    upsertConsignmentCategory(shopId, editing);
    setEditing(null);
  };

  const commissionOfSelected = useMemo(() => {
    if (!selectedCategoryId) return '';
    const ov = consignmentCategoryOverrides.find(o => o.shopId === shopId && o.categoryId === selectedCategoryId);
    return ov?.commissionPct ?? '';
  }, [consignmentCategoryOverrides, shopId, selectedCategoryId]);

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] gap-3 items-center">
          <select className="glass rounded-2xl px-4 py-2 outline-none" value={shopId || ''} onChange={(e)=> setShopId(Number(e.target.value) || null)}>
            {consignmentShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="glass rounded-2xl px-4 py-2 outline-none" placeholder="ค้นหาหมวด (ชื่อ/รหัส)" value={q} onChange={(e)=> setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={()=> setEditing({ id: null, code: '', name: '', netUnitPrice: '' })}>
            <Plus className="mr-2" size={16} /> เพิ่มหมวด
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-0">
          <Table
            columns={[
              { key: 'code', header: 'รหัส' },
              { key: 'name', header: 'ชื่อหมวด' },
              { key: 'net', header: 'ราคา/ชิ้น (Net)', render: (_, r) => r.netUnitPrice ?? '—' },
              { key: 'tools', header: 'เครื่องมือ', render: (_, r) => (
                <div className="flex gap-2">
                  <button className="btn btn-outline px-2 py-1" title="แก้ไข"
                    onClick={()=> setEditing({ id: r.id, code: r.code||'', name: r.name||'', netUnitPrice: r.netUnitPrice ?? '' })}>
                    <Pencil size={16} />
                  </button>
                  <button className="btn btn-outline px-2 py-1" title="ลบ"
                    onClick={()=> {
                      if (confirm('ลบหมวดนี้? สินค้าที่ผูกกับหมวดนี้ในร้านนี้จะถูกปลดออกทั้งหมด')) {
                        deleteConsignmentCategory(shopId, r.id);
                        if (selectedCategoryId === r.id) setSelectedCategoryId(null);
                      }
                    }}>
                    <Trash2 size={16} />
                  </button>
                  <button className="btn btn-outline px-2 py-1" title="เลือกหมวด"
                    onClick={()=> setSelectedCategoryId(r.id)}>
                    <Settings2 size={16} />
                  </button>
                </div>
              )},
            ]}
            data={filteredCats.map(c => ({ ...c, tools: '' }))}
          />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">
              หมวดที่เลือก: {selectedCategoryId ? (cats.find(c=>c.id===selectedCategoryId)?.name || '-') : '—'}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted">ค่าคอม (หมวดนี้):</span>
              <input
                className="glass rounded-xl px-3 py-1 w-24 text-right"
                type="number" min="0" max="100" step="0.1"
                value={commissionOfSelected}
                onChange={(e)=> {
                  if (!selectedCategoryId) return;
                  setConsignmentCategoryCommission({
                    shopId,
                    categoryId: selectedCategoryId,
                    commissionPct: e.target.value === '' ? undefined : Number(e.target.value)
                  });
                }}
              />
              <span className="text-sm">%</span>
              <button className="btn btn-primary ml-3" disabled={!selectedCategoryId} onClick={()=> setPickProductsOpen(true)}>
                เพิ่มสินค้าเข้าหมวด
              </button>
            </div>
          </div>

          <Table
            columns={[
              { key: 'sku', header: 'SKU' },
              { key: 'name', header: 'ชื่อสินค้า' },
              { key: 'tools', header: 'เครื่องมือ', render: (_, r) => (
                <button className="btn btn-outline px-2 py-1" onClick={()=> unlinkProductFromShop({ productId: r.id, shopId })}>
                  เอาออก
                </button>
              ) }
            ]}
            data={productsInSelected.map(p => ({ ...p, tools: '' }))}
          />
        </Card>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setEditing(null)} />
          <div className="relative z-10 card p-5 w-[96vw] max-w-lg">
            <div className="h-title mb-3">{editing.id ? 'แก้ไขหมวด' : 'เพิ่มหมวด'}</div>
            <div className="grid gap-3">
              <div>
                <label className="text-sm text-muted">รหัส</label>
                <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={editing.code} onChange={(e)=> setEditing(prev => ({ ...prev, code: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-muted">ชื่อหมวด</label>
                <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={editing.name} onChange={(e)=> setEditing(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-muted">ราคา/ชิ้น (Net) (ว่าง = ราคาขาย - ค่าคอม)</label>
                <input type="number" step="0.01" min="0" className="glass rounded-2xl px-4 py-2 outline-none w-full"
                  value={editing.netUnitPrice}
                  onChange={(e)=> setEditing(prev => ({ ...prev, netUnitPrice: e.target.value === '' ? '' : Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={()=> setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={onSaveCategory}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {pickProductsOpen && selectedCategoryId && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setPickProductsOpen(false)} />
          <div className="relative z-10 card p-5 w-[96vw] max-w-3xl">
            <div className="h-title mb-3">เพิ่มสินค้าเข้าหมวด</div>
            <div className="grid gap-2 max-h-[60vh] overflow-auto">
              {productsNotInSelected.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100/50">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted">{p.sku}</div>
                  </div>
                  <button className="btn btn-outline" onClick={()=> linkProductToShopCategory({ productId: p.id, shopId, categoryId: selectedCategoryId })}>
                    เพิ่ม
                  </button>
                </div>
              ))}
              {productsNotInSelected.length === 0 && (
                <div className="text-center text-sm text-muted py-6">สินค้าทั้งหมดในร้านนี้ถูกจัดหมวดแล้ว</div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn btn-primary" onClick={()=> setPickProductsOpen(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
