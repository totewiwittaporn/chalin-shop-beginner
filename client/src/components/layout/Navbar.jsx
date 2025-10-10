// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, ROLES } from '../../store/authStore.js';
import MobileMenuDrawer from './MobileMenuDrawer.jsx';

export default function Navbar() {
  const { user, setRole } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar border-b border-white/10">
      <div className="container-app h-14 flex items-center justify-between gap-3">
        {/* --- Mobile header layout --- */}
        <div className="md:hidden flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost px-3 py-2"
              onClick={() => setOpen(true)}
              aria-label="open menu"
            >
              ☰
            </button>
            {/* ชื่อระบบ ลิ้งกลับ Dashboard */}
            <Link to="/" className="font-semibold tracking-wide">Chalin Shop</Link>
          </div>

          {/* ชื่อ User + Role (ทดสอบ) */}
          <div className="text-xs px-2 py-1 rounded-lg bg-white/10">
            {(user?.name || 'User')} • {(user?.role || 'ADMIN')}
          </div>
        </div>

        {/* --- Desktop/Tablet header layout --- */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div className="flex-1 max-w-xl">
            <input placeholder="Search…" className="w-full glass rounded-2xl px-4 py-2 outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm hidden md:inline">Role</span>
            <select
              className="rounded-xl border border-border bg-surface px-2 py-1 text-sm"
              value={user.role}
              onChange={(e)=>setRole(e.target.value)}
            >
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Drawer เมนูมือถือ (Portal) */}
      <MobileMenuDrawer open={open} onClose={()=>setOpen(false)} role={user.role} />
    </header>
  );
}
