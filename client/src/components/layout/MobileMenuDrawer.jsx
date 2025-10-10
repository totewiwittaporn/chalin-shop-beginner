// src/components/layout/MobileMenuDrawer.jsx
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MOBILE_GROUPS } from '../../nav.mobile.js'; // ← ระวังพาธ: 2 ชั้นขึ้นจาก /components/layout

function Group({ label, items, defaultOpen=false, onItemClick }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10">
      <button
        className="w-full flex items-center justify-between py-3"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-medium">{label}</span>
        <span className={`i-lucide-chevron-down transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid pb-3">
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onItemClick}
              className={({isActive}) =>
                `px-3 py-2 rounded-xl hover:bg-white/10 ${isActive ? 'bg-white/10 font-semibold' : ''}`
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
  if (!open) return null;

  const groups = MOBILE_GROUPS(role.toLowerCase?.() || role);

  return (
    // ตัว Drawer กินเต็มหน้าจอ และซ้อนบนสุด
    <div className="md:hidden fixed inset-0 z-50">
      {/* ฉากหลังคลิกเพื่อปิด */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* แถบเมนูเลื่อนจากซ้าย */}
      <div className="absolute top-0 bottom-0 left-0 w-[86%] max-w-[360px] bg-background p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">เมนู</div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="close">✕</button>
        </div>

        {/* ปุ่มไปหน้าแดชบอร์ด */}
        <Link to="/" onClick={onClose} className="block px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-medium mb-3">
          Dashboard
        </Link>

        {/* กลุ่มเมนูแบบ Accordion — ไม่มีช่องค้นหาตามที่ขอ */}
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
  );
}
