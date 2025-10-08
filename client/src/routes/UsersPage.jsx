import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, ROLES } from '../store/authStore.js';
import { useUserStore } from '../store/userStore.js';
import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Pencil, Trash2 } from 'lucide-react';

function RoleBadge({ role }) {
  const map = {
    ADMIN:        'bg-purple-100 text-purple-900',
    STAFF:        'bg-blue-100 text-blue-900',
    CONSIGNMENT:  'bg-emerald-100 text-emerald-900',
    QUOTE_VIEWER: 'bg-slate-200 text-slate-900',
  };
  return (
    <span className={`px-2 py-0.5 rounded-xl text-xs ${map[role] || 'bg-slate-100 text-slate-900'}`}>
      {role}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <Card className="p-5">
      <div className="h-title mb-3">{title}</div>
      {children}
    </Card>
  );
}

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const isAdmin = me?.role === 'ADMIN';
  const { users, updateUser, deleteUser } = useUserStore();
  const { branches } = useDataStore();

  // guard: admin only
  if (!isAdmin) {
    // คุณมีหน้า /403 ไหม? ถ้ายังไม่มี แสดงการ์ดแทน
    return (
      <Card className="p-6">
        <div className="text-lg font-semibold mb-2">403 – Unauthorized</div>
        <div className="text-sm text-muted">หน้านี้สำหรับผู้ดูแลระบบ (ADMIN) เท่านั้น</div>
      </Card>
    );
    // หรือใช้:
    // return <Navigate to="/403" replace />;
  }

  const branchNameById = useMemo(
    () => Object.fromEntries(branches.map((b) => [b.id, `${b.code || ''} ${b.name}`.trim()])),
    [branches]
  );

  // filters & search
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const hitQ =
        !q ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase());
      const hitRole = roleFilter === 'ALL' || u.role === roleFilter;
      const hitBranch =
        branchFilter === 'ALL' ||
        (branchFilter === 'NULL' && (u.branchId === null || u.branchId === undefined)) ||
        String(u.branchId) === String(branchFilter);

      return hitQ && hitRole && hitBranch;
    });
  }, [users, q, roleFilter, branchFilter]);

  // dialogs
  const [editing, setEditing] = useState(null);   // user object
  const [deleting, setDeleting] = useState(null); // user object

  const columns = [
    { key: 'name', header: 'ชื่อ' },
    { key: 'email', header: 'อีเมล' },
    {
      key: 'role',
      header: 'Role',
      render: (val) => <RoleBadge role={val} />,
    },
    {
      key: 'branchId',
      header: 'สาขา',
      render: (val) => branchNameById[val] || '-',
    },
    {
      key: 'active',
      header: 'สถานะ',
      render: (val) =>
        val ? (
          <span className="px-2 py-0.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs">Active</span>
        ) : (
          <span className="px-2 py-0.5 rounded-xl bg-slate-200 text-slate-900 text-xs">Disabled</span>
        ),
    },
    {
      key: 'actions',
      header: 'การทำงาน',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-outline px-2 py-1"
            onClick={() => setEditing(row)}
            title="แก้ไข"
          >
            <Pencil size={16} />
          </button>
          <button
            className="btn btn-outline px-2 py-1"
            onClick={() => setDeleting(row)}
            title="ลบ"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <Section title="ค้นหา / กรอง">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="glass rounded-2xl px-4 py-2 outline-none"
            placeholder="ค้นหาชื่อหรืออีเมล…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="glass rounded-2xl px-4 py-2 outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Role: ทุกประเภท</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="glass rounded-2xl px-4 py-2 outline-none"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="ALL">สาขา: ทั้งหมด</option>
            <option value="NULL">— ไม่มีสาขา —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code || ''} {b.name}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Card className="p-5">
        <div className="mb-3 h-title">ผู้ใช้งานทั้งหมด</div>
        <Table
          columns={columns}
          data={filtered.map((u) => ({ ...u, actions: '' }))}
        />
      </Card>

      {/* Edit Dialog */}
      {editing && (
        <EditUserDialog
          user={editing}
          branches={branches}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateUser(editing.id, patch);
            setEditing(null);
          }}
        />
      )}

      {/* Delete Dialog */}
      {deleting && (
        <ConfirmDeleteDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            deleteUser(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Dialog Components --------------- */

function DialogBase({ title, children, actions }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-[95vw] max-w-xl card p-5">
        <div className="h-title mb-3">{title}</div>
        <div className="grid gap-4">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function EditUserDialog({ user, branches, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [branchId, setBranchId] = useState(user.branchId ?? '');
  const [active, setActive] = useState(!!user.active);

  return (
    <DialogBase
      title="แก้ไขผู้ใช้งาน"
      actions={
        <>
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave({ name, email, role, branchId: branchId === '' ? null : Number(branchId), active })}
          >
            บันทึก
          </button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-muted mb-1">ชื่อ</label>
          <input className="w-full glass rounded-2xl px-4 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">อีเมล</label>
          <input className="w-full glass rounded-2xl px-4 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Role</label>
          <select className="w-full glass rounded-2xl px-4 py-2" value={role} onChange={(e)=>setRole(e.target.value)}>
            {ROLES.map((r)=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">สาขา (เว้นว่างถ้าไม่มี)</label>
          <select
            className="w-full glass rounded-2xl px-4 py-2"
            value={branchId === null ? '' : branchId}
            onChange={(e)=>setBranchId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">— ไม่มีสาขา —</option>
            {branches.map((b)=>(
              <option key={b.id} value={b.id}>{b.code || ''} {b.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} />
            <span className="text-sm">Active</span>
          </label>
        </div>
      </div>
    </DialogBase>
  );
}

function ConfirmDeleteDialog({ user, onClose, onConfirm }) {
  return (
    <DialogBase
      title="ยืนยันการลบผู้ใช้"
      actions={
        <>
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={onConfirm}>ลบ</button>
        </>
      }
    >
      <p className="text-sm">
        คุณต้องการลบผู้ใช้ <span className="font-medium">{user.name}</span> ({user.email}) ใช่หรือไม่?
      </p>
      <p className="text-xs text-muted">การลบนี้เป็นแบบ mock — ยังไม่เชื่อมต่อ backend</p>
    </DialogBase>
  );
}
