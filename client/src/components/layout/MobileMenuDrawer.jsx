// client/src/components/MobileMenuDrawer.jsx
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MOBILE_GROUPS } from '../../nav.mobile';

function Group({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button className="w-full flex items-center justify-between py-3" onClick={()=>setOpen(v=>!v)}>
        <span className="font-medium">{label}</span>
        <span className={`i-lucide-chevron-down transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid gap-1 pb-3">
          {items.map(it=>(
            <NavLink key={it.to} to={it.to}
              className={({isActive}) => `px-3 py-2 rounded-xl hover:bg-white/10 ${isActive ? 'bg-white/10 font-semibold' : ''}`}
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileMenuDrawer({ open, onClose, role='admin' }) {
  if (!open) return null;
  const groups = MOBILE_GROUPS(role);
  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-0 bottom-0 left-0 w-[86%] max-w-[360px] bg-background p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">Menu</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <Link to="/" className="block px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-medium mb-3" onClick={onClose}>
          Dashboard
        </Link>
        <div className="grid">
          {groups.map(g => <Group key={g.id} label={g.label} items={g.items} />)}
        </div>
      </div>
    </div>
  );
}
