// client/src/pages/ProductsPage.jsx
import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { Plus, Search } from 'lucide-react';

function AddProductDialog({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', sku: '', basePrice: '', salePrice: '' });
  const canSave = form.name.trim() && form.sku.trim();

  const onSubmit = () => {
    if (!canSave) return;
    onSave({
      name: form.name.trim(),
      sku: form.sku.trim(),
      basePrice: form.basePrice === '' ? 0 : Number(form.basePrice),
      salePrice: form.salePrice === '' ? 0 : Number(form.salePrice),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 card p-5 w-[96vw] max-w-lg">
        <div className="h-title mb-3">เพิ่มสินค้า</div>
        <div className="grid gap-3">
          <div>
            <label className="text-sm text-muted">ชื่อสินค้า</label>
            <input
              className="glass rounded-2xl px-4 py-2 outline-none w-full"
              value={form.name}
              onChange={(e)=> setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="เช่น เสื้อยืดลินิน"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-muted">SKU / Barcode</label>
            <input
              className="glass rounded-2xl px-4 py-2 outline-none w-full"
              value={form.sku}
              onChange={(e)=> setForm(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="เช่น LN-TS-0001"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted">ราคาทุน (Base)</label>
              <input
                type="number" min="0" step="0.01"
                className="glass rounded-2xl px-4 py-2 outline-none w-full text-right"
                value={form.basePrice}
                onChange={(e)=> setForm(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-muted">ราคาขาย (Sale)</label>
              <input
                type="number" min="0" step="0.01"
                className="glass rounded-2xl px-4 py-2 outline-none w-full text-right"
                value={form.salePrice}
                onChange={(e)=> setForm(prev => ({ ...prev, salePrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={onSubmit}>บันทึกสินค้า</button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { products = [], addProduct } = useDataStore();
  const [q, setQ] = useState('');
  const [openAdd, setOpenAdd] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.sku || '').toLowerCase().includes(s)
    );
  }, [q, products]);

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'ชื่อสินค้า' },
    { key: 'salePrice', header: 'ราคาขาย', render: (v) => (Number(v||0)).toLocaleString(undefined,{ minimumFractionDigits:2, maximumFractionDigits:2 }) },
  ];

  const onSave = (payload) => {
    if (typeof addProduct === 'function') {
      addProduct(payload);
    } else {
      console.warn('addProduct() is not defined in dataStore.');
      alert('ยังไม่ได้ติดตั้งเมธอด addProduct() ใน store');
    }
    setOpenAdd(false);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <input
              className="glass rounded-2xl px-4 py-2 outline-none w-full"
              placeholder="ค้นหาชื่อสินค้า / SKU …"
              value={q}
              onChange={(e)=> setQ(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={()=> setOpenAdd(true)}>
            <Plus className="mr-2" size={16} /> เพิ่มสินค้า
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={filtered} />
      </Card>

      {openAdd && (
        <AddProductDialog
          onClose={()=> setOpenAdd(false)}
          onSave={onSave}
        />
      )}
    </div>
  );
}
