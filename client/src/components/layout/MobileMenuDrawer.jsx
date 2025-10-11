import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link } from 'react-router-dom';
import { MOBILE_GROUPS } from '../../nav.mobile.js'; // ปรับพาธให้ตรงกับไฟล์เมนูคุณ

function Group({ label, items, defaultOpen=false, onItemClick }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between py-3 px-1 font-medium"
        onClick={() => setOpen(v => !v)}
      >
        <span>{label}</span>
        <span className={`transition ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && (
        <div className="grid pb-2">
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onItemClick}
              className={({isActive}) =>
                `px-3 py-2 rounded-xl
                 hover:bg-black/5 dark:hover:bg-white/10
                 ${isActive ? 'bg-black/10 dark:bg-white/20 font-semibold' : ''}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileMenuDrawer({ open, onClose, role='ADMIN', user=null, onLogout }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const groups = MOBILE_GROUPS((role?.toLowerCase?.() || role));

  const name = user?.name || user?.email || 'ผู้ใช้งาน';
  const sub = [String(user?.role || '').toUpperCase(), user?.branch?.name || user?.branchName]
    .filter(Boolean).join(' • ');

  return createPortal(
    <div className="md:hidden fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute top-0 bottom-0 left-0 w-[86%] max-w-[360px] p-3">
        <div className="h-full overflow-y-auto rounded-r-2xl shadow-2xl
                        bg-white/85 dark:bg-slate-900/80 backdrop-blur-md
                        text-gray-900 dark:text-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Link to="/" onClick={onClose} className="font-semibold">Chalin Shop</Link>
            <button className="px-3 py-2 rounded-xl hover:bg-black/5" onClick={onClose} aria-label="close">✕</button>
          </div>

          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl border border-black/10 bg-white/60">
            <div className="size-10 grid place-items-center rounded-xl bg-white border border-black/10 font-semibold">
              {(name?.[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{name}</div>
              <div className="text-xs opacity-70 truncate">{sub || 'GUEST'}</div>
            </div>
          </div>

          <div className="h-px bg-black/10 dark:bg-white/10 mb-3" />

          <div className="grid">
            {groups.map((g, idx) => (
              <Group
                key={g.id || idx}
                label={g.label}
                items={g.items}
                defaultOpen={idx === 0}
                onItemClick={onClose}
              />
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={() => { onClose?.(); onLogout?.(); }}
              className="w-full h-11 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
