import { useMemo, useState } from 'react';
import { useAuthStore, ROLES } from '../store/authStore.js';
import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';

function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export default function ProfilePage() {
  const { user, setUser, setRole } = useAuthStore();
  const { branches } = useDataStore();
  const [name, setName] = useState(user?.name || '');
  const [role, setRoleLocal] = useState(user?.role || 'ADMIN');
  const [branchId, setBranchId] = useState(user?.branchId || branches[0]?.id || 1);
  const [email] = useState(user?.email || 'demo@example.com'); // mock
  const [avatarPreview, setAvatarPreview] = useState(null);

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: `${b.code || ''} ${b.name}`.trim() })),
    [branches]
  );

  const currentBranchName = useMemo(
    () => branchOptions.find((b) => b.value === branchId)?.label || '-',
    [branchOptions, branchId]
  );

  const handleSave = (e) => {
    e.preventDefault();
    // อัปเดต store (mock)
    setUser({ ...user, name, branchId, role });
    setRole(role); // เพื่อ sync role (และ localStorage) ให้ตรงกัน
    alert('บันทึกข้อมูลโปรไฟล์เรียบร้อย (mock)');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSignOut = () => {
    // mock signout: ล้าง role แล้วรีเฟรช
    localStorage.removeItem('role');
    location.href = '/';
  };

  return (
    <div className="grid gap-6">
      {/* ส่วนหัวโปรไฟล์ */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden glass flex items-center justify-center text-xl font-semibold">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initialsOf(name || user?.name)
              )}
            </div>
            <div>
              <div className="text-xl font-semibold">{name || user?.name}</div>
              <div className="text-sm text-muted">
                {role} • {currentBranchName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="btn btn-outline cursor-pointer">
              อัปโหลดรูป
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <button className="btn btn-primary" onClick={handleSave}>
              บันทึก
            </button>
          </div>
        </div>
      </Card>

      {/* แบบฟอร์มข้อมูล */}
      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-6 xl:col-span-2">
          <div className="h-title mb-4">ข้อมูลผู้ใช้งาน</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">ชื่อที่แสดง</label>
              <input
                className="w-full glass rounded-2xl px-4 py-2 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">อีเมล</label>
              <input
                className="w-full glass rounded-2xl px-4 py-2 outline-none opacity-70"
                value={email}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">สาขา (Branch)</label>
              <select
                className="w-full glass rounded-2xl px-4 py-2 outline-none"
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
              >
                {branchOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* สวิตช์ Role (dev) */}
            <div>
              <label className="block text-sm text-muted mb-1">Role (dev)</label>
              <select
                className="w-full glass rounded-2xl px-4 py-2 outline-none"
                value={role}
                onChange={(e) => setRoleLocal(e.target.value)}
                title="Switch role for demo"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="submit" className="btn btn-primary">
              บันทึกการเปลี่ยนแปลง
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setName(user?.name || '');
                setRoleLocal(user?.role || 'ADMIN');
                setBranchId(user?.branchId || branches[0]?.id || 1);
              }}
            >
              รีเซ็ต
            </button>
          </div>
        </Card>

        {/* กล่องการตั้งค่า/อันตราย */}
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="h-title mb-4">ความปลอดภัย</div>
            <div className="grid gap-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => alert('ยังไม่เชื่อมต่อ backend — ทำหน้าเปลี่ยนรหัสผ่านได้ภายหลัง')}
              >
                เปลี่ยนรหัสผ่าน (เร็ว ๆ นี้)
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="h-title mb-3">ออกจากระบบ</div>
            <p className="text-sm text-muted mb-4">
              สำหรับเดโมจะเคลียร์ค่า role ใน localStorage และโหลดหน้าใหม่
            </p>
            <button type="button" className="btn btn-outline" onClick={handleSignOut}>
              ออกจากระบบ (mock)
            </button>
          </Card>
        </div>
      </form>
    </div>
  );
}
