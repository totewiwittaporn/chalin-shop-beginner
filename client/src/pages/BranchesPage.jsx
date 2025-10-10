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
      <div className="relative z-10 w-[95vw] max-w-xl card p-5">
        <div className="h-title mb-3">{title}</div>
        <div className="grid gap-3">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function BranchDialog({ mode = 'create', initial = {}, onClose, onSave }) {
  const [code, setCode] = useState(initial.code || '');
  const [name, setName] = useState(initial.name || '');
  const [address, setAddress] = useState(initial.address || '');
  const [commission, setCommission] = useState(
    typeof initial.commission === 'number' ? String(initial.commission) : ''
  );

  const canSave = code.trim() && name.trim() && commission !== '' && !isNaN(parseFloat(commission));

  const normalizedCode = code.toUpperCase().replace(/\s+/g, '-');

  return (
    <DialogBase
      title={mode === 'create' ? 'เพิ่มร้านสาขา' : 'แก้ไขร้านสาขา'}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button
            className="btn btn-primary"
            disabled={!canSave || parseFloat(commission) < 0 || parseFloat(commission) > 100}
            onClick={() =>
              onSave({
                code: normalizedCode,
                name: name.trim(),
                address: address.trim(),
                commission: Math.max(0, Math.min(100, parseFloat(commission))),
              })
            }
          >
            บันทึก
          </button>
        </>
      }
    >
      <div className="grid gap-3">
        <div>
          <label className="block text-sm text-muted mb-1">
            รหัสสาขา <span className="text-xs">(เช่น PNA-KRBR-GVT)</span>
          </label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น PNA-KRBR-GVT"
          />
          <div className="text-xs text-muted mt-1">จะถูกบันทึกเป็น: <b>{normalizedCode || '-'}</b></div>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">ชื่อร้านสาขา <span className="text-xs">(เช่น CLS-GVT)</span></label>
          <input
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น CLS-GVT"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">ที่อยู่</label>
          <textarea
            className="w-full glass rounded-2xl px-4 py-2 outline-none min-h-[90px]"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="เช่น 140/8 หมู่ 3 ..."
          />
        </div>

        <div>
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
          <div className="text-xs text-muted mt-1">0–100% เท่านั้น</div>
        </div>
      </div>
    </DialogBase>
  );
}

export default function BranchesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { branches, addBranch, updateBranch } = useDataStore();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // branch object

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return branches;
    return branches.filter((b) =>
      (b.code || '').toLowerCase().includes(s) ||
      (b.name || '').toLowerCase().includes(s)
    );
  }, [branches, q]);

  const columns = [
    { key: 'code', header: 'รหัสสาขา' },
    { key: 'name', header: 'ชื่อร้านสาขา' },
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
            placeholder="ค้นหารหัส/ชื่อร้านสาขา…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => setCreating(true)}
            disabled={!isAdmin}
            title={isAdmin ? 'เพิ่มร้านสาขา' : 'เฉพาะ ADMIN'}
          >
            เพิ่มร้านสาขา
          </button>
        </div>
      </Card>

      {/* ส่วนที่ 2: ตาราง */}
      <Card className="p-0">
        <Table columns={columns} data={filtered.map((b) => ({ ...b, tools: '' }))} />
      </Card>

      {/* Dialogs */}
      {creating && (
        <BranchDialog
          mode="create"
          onClose={() => setCreating(false)}
          onSave={(payload) => {
            const exists = branches.some((b) => (b.code || '').toUpperCase() === payload.code.toUpperCase());
            if (exists) return alert('มีรหัสสาขานี้อยู่แล้ว');
            addBranch({ ...payload, type: 'BRANCH' });
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <BranchDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            const exists = branches.some(
              (b) => b.id !== editing.id && (b.code || '').toUpperCase() === payload.code.toUpperCase()
            );
            if (exists) return alert('มีรหัสสาขานี้อยู่แล้ว');
            updateBranch(editing.id, payload);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
