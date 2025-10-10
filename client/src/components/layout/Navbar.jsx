// client/src/components/Navbar.jsx
import { useState } from 'react';
import { useAuthStore, ROLES } from '../../store/authStore.js';
import MobileMenuDrawer from './MobileMenuDrawer.jsx';

export default function Navbar() {
  const { user, setRole } = useAuthStore();
  const [open, setOpen] = useState(false);
  return (
    <header className="navbar">
      <div className="container-app h-14 flex items-center justify-between gap-3">
        <button className="md:hidden btn btn-ghost px-3 py-2" onClick={()=>setOpen(true)} aria-label="open menu">☰</button>
        <div className="flex-1 max-w-xl">
          <input placeholder="Search…" className="w-full glass rounded-2xl px-4 py-2 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm hidden md:inline">Role</span>
          <select className="rounded-xl border border-border bg-surface px-2 py-1 text-sm" value={user.role} onChange={(e)=>setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <MobileMenuDrawer open={open} onClose={()=>setOpen(false)} role={user.role} />
    </header>
  );
}
