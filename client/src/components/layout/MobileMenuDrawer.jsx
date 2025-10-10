// src/components/layout/MobileMenuDrawer.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link } from 'react-router-dom';
import { MOBILE_GROUPS } from '../../nav.mobile.js'; // ระวังพาธ

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

export default function MobileMenuDrawer({ open, onClose, role='ADMIN' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const groups = MOBILE_GROUPS((role?.toLowerCase?.() || role));

  return createPortal(
    <div className="md:hidden fixed inset-0 z-[9999]">
      {/* โปร่งใสเมื่อเปิดแฮมเบอร์เกอร์ */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* แพแนลรวมเมนู: เพิ่มชั้นพื้นหลังกึ่งทึบ + blur นิดๆ */}
      <div className="absolute top-0 bottom-0 left-0 w-[86%] max-w-[360px] p-3">
        <div className="h-full overflow-y-auto rounded-r-2xl shadow-2xl
                        bg-white/85 dark:bg-slate-900/80 backdrop-blur-md
                        text-gray-900 dark:text-slate-100 p-4">
          {/* header ด้านในของ Drawer */}
          <div className="flex items-center justify-between mb-2">
            {/* กดชื่อระบบกลับ Dashboard ได้อีกทาง (ซ้ำกับบน navbar แต่มีไว้ใน Drawer ด้วยกรณีสกอร์ลลงมาไกล) */}
            <Link to="/" onClick={onClose} className="font-semibold">Chalin Shop</Link>
            <button className="btn btn-ghost" onClick={onClose} aria-label="close">✕</button>
          </div>
          <div className="h-px bg-black/10 dark:bg-white/10 mb-3" />

          {/* กลุ่มเมนู — ลบ Dashboard ออกตามที่ขอ */}
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
        </div>
      </div>
    </div>,
    document.body
  );
}
