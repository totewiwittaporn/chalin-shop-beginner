import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { Pencil } from 'lucide-react';

function DialogBase({ title, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[95vw] max-w-lg card p-5">
        <div className="h-title mb-3">{title}</div>
        <div className="grid gap-3">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function EditTypeDialog({ initialName = '', onClose, onSave }) {
  const [name, setName] = useState(initialName);
  const canSave = name.trim().length > 0;
  return (
    <DialogBase
      title={initialName ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ name: name.trim() })}>
            บันทึก
          </button>
        </>
      }
    >
      <div>
        <label className="block text-sm text-muted mb-1">ชื่อประเภทสินค้า</label>
        <input
          autoFocus
          className="w-full glass rounded-2xl px-4 py-2 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น กิ๊บ, โบว์, ที่คาดผม"
          onKeyDown={(e)=>{ if(e.key==='Enter' && canSave) onSave({ name: name.trim() }); }}
        />
      </div>
    </DialogBase>
  );
}

export default function ProductTypesPage() {
  const { productTypes, products, addProductType, updateProductType /*, removeProductType */ } = useDataStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const countByType = useMemo(() => {
    const map = new Map();
    products.forEach(p => map.set(p.typeId, (map.get(p.typeId) || 0) + 1));
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return productTypes;
    return productTypes.filter(t => (t.name || '').toLowerCase().includes(s));
  }, [productTypes, q]);

  const columns = [
    { key: 'name', header: 'ประเภทสินค้า' },
    { key: 'count', header: 'จำนวนสินค้า', render: (_, row) => countByType.get(row.id) || 0 },
    { key: 'tools', header: 'เครื่องมือ', render: (_, row) => (
      <div className="flex gap-2">
        <button className="btn btn-outline px-2 py-1" title="แก้ไข" onClick={() => setEditing(row)}>
          <Pencil size={16} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            className="glass rounded-2xl px-4 py-2 outline-none"
            placeholder="ค้นหาประเภทสินค้า…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            เพิ่มประเภทสินค้า
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={filtered.map(t => ({ ...t, tools: '' }))} />
      </Card>

      {creating && (
        <EditTypeDialog
          initialName=""
          onClose={() => setCreating(false)}
          onSave={({ name }) => {
            const exists = productTypes.some(t => (t.name || '').trim().toLowerCase() === name.toLowerCase());
            if (exists) return alert('มีชื่อประเภทนี้อยู่แล้ว');
            addProductType({ name });
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <EditTypeDialog
          initialName={editing.name}
          onClose={() => setEditing(null)}
          onSave={({ name }) => {
            const exists = productTypes.some(t => t.id !== editing.id && (t.name || '').trim().toLowerCase() === name.toLowerCase());
            if (exists) return alert('มีชื่อประเภทนี้อยู่แล้ว');
            updateProductType(editing.id, { name });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
