import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Pencil } from 'lucide-react';

function DialogBase({ title, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[95vw] max-w-2xl card p-5">
        <div className="h-title mb-3">{title}</div>
        <div className="grid gap-3">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function ShopDialog({ mode = 'create', initial = {}, onClose, onSave }) {
  const [name, setName] = useState(initial.name || '');               // internal short name
  const [companyTh, setCompanyTh] = useState(initial.companyTh || '');
  const [companyEn, setCompanyEn] = useState(initial.companyEn || '');
  const [addressTh, setAddressTh] = useState(initial.addressTh || '');
  const [addressEn, setAddressEn] = useState(initial.addressEn || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [taxId, setTaxId] = useState(initial.taxId || '');
  const [commission, setCommission] = useState(
    typeof initial.commission === 'number' ? String(initial.commission) : ''
  );

  const canSave = name.trim() && companyTh.trim() && addressTh.trim() && commission !== '' && !isNaN(parseFloat(commission));

  return (
    <DialogBase
      title={mode === 'create' ? 'เพิ่มร้านฝากขาย' : 'แก้ไขร้านฝากขาย'}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button
            className="btn btn-primary"
            disabled={!canSave || parseFloat(commission) < 0 || parseFloat(commission) > 100}
            onClick={() =>
              onSave({
                name: name.trim(),
                companyTh: companyTh.trim(),
                companyEn: companyEn.trim(),
                addressTh: addressTh.trim(),
                addressEn: addressEn.trim(),
                phone: phone.trim(),
                taxId: taxId.trim(),
                commission: Math.max(0, Math.min(100, parseFloat(commission))),
              })
            }
          >
            บันทึก
          </button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">ชื่อร้าน (ภายใน)</label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น CLS-GVT"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">ค่าคอมมิชชั่น (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder="เช่น 10"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">ชื่อบริษัท (ไทย)</label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={companyTh}
            onChange={(e) => setCompanyTh(e.target.value)}
            placeholder="บริษัท ... จำกัด"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">ชื่อบริษัท (อังกฤษ)</label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={companyEn}
            onChange={(e) => setCompanyEn(e.target.value)}
            placeholder="Company Co., Ltd."
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">ที่อยู่ (ไทย)</label>
          <textarea
            className="w-full glass rounded-2xl px-4 py-2 outline-none min-h-[90px]"
            value={addressTh}
            onChange={(e) => setAddressTh(e.target.value)}
            placeholder="เช่น 140/8 หมู่ 3 ..."
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">ที่อยู่ (อังกฤษ)</label>
          <textarea
            className="w-full glass rounded-2xl px-4 py-2 outline-none min-h-[90px]"
            value={addressEn}
            onChange={(e) => setAddressEn(e.target.value)}
            placeholder="e.g., 140/8 Moo 3 ..."
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">เบอร์โทร</label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="เช่น 081-234-5678"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-muted mb-1">เลขประจำตัวผู้เสียภาษี</label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="0-0000-00000-00-0"
          />
        </div>
      </div>
    </DialogBase>
  );
}

export default function ConsignmentShopsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { consignmentShops, addConsignmentShop, updateConsignmentShop } = useDataStore();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // row object

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return consignmentShops;
    return consignmentShops.filter((r) => {
      const inStr = (x) => (x || '').toString().toLowerCase();
      return (
        inStr(r.name).includes(s) ||
        inStr(r.companyTh).includes(s) ||
        inStr(r.companyEn).includes(s) ||
        inStr(r.addressTh).includes(s) ||
        inStr(r.addressEn).includes(s) ||
        inStr(r.phone).includes(s) ||
        inStr(r.taxId).includes(s)
      );
    });
  }, [consignmentShops, q]);

  const columns = [
    { key: 'name', header: 'ชื่อร้าน' },
    { key: 'addressTh', header: 'ที่อยู่ (ไทย)', render: (val) => val || '-' },
    {
      key: 'tools',
      header: 'เครื่องมือ',
      render: (_, row) => (
        <div className="flex gap-2">
          {isAdmin && (
            <button
              className="btn btn-outline px-2 py-1"
              title="แก้ไข"
              onClick={() => setEditing(row)}
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      {/* ส่วนที่ 1: ค้นหา + ปุ่มเพิ่ม */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            className="glass rounded-2xl px-4 py-2 outline-none"
            placeholder="ค้นหาชื่อ/บริษัท/ที่อยู่/เบอร์/ภาษี…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => setCreating(true)}
            disabled={!isAdmin}
            title={isAdmin ? 'เพิ่มร้านฝากขาย' : 'เฉพาะ ADMIN'}
          >
            เพิ่มร้านฝากขาย
          </button>
        </div>
      </Card>

      {/* ส่วนที่ 2: ตาราง */}
      <Card className="p-0">
        <Table columns={columns} data={filtered.map((r) => ({ ...r, tools: '' }))} />
      </Card>

      {/* Dialogs */}
      {creating && (
        <ShopDialog
          mode="create"
          onClose={() => setCreating(false)}
          onSave={(payload) => {
            // กันชื่อซ้ำแบบง่าย ๆ
            const exists = consignmentShops.some((r) => (r.name || '').trim().toLowerCase() === payload.name.toLowerCase());
            if (exists) return alert('มีชื่อร้านนี้อยู่แล้ว');
            addConsignmentShop(payload);
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <ShopDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            const exists = consignmentShops.some(
              (r) => r.id !== editing.id && (r.name || '').trim().toLowerCase() === payload.name.toLowerCase()
            );
            if (exists) return alert('มีชื่อร้านนี้อยู่แล้ว');
            updateConsignmentShop(editing.id, payload);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
