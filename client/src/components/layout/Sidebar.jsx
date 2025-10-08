import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { NAV_BY_ROLE } from '../../config/nav.js';
import {
  LayoutDashboard,
  Package,
  Tags,
  Building2 as Building,
  Store,
  Boxes,
  ShoppingCart as Cart,
  ArrowLeftRight as Swap,
  Receipt,
  FileText,
  Settings,
  Users,
} from 'lucide-react';

const ICONS = {
  Dashboard: LayoutDashboard,
  Package,
  Tags,
  Building,
  Store,
  Boxes,
  Cart,
  Swap,
  Receipt,
  FileText,
  Settings,
  Users,
};

function SideLink({ to, label, icon }) {
  const Icon = icon && ICONS[icon] ? ICONS[icon] : null;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-xl transition text-white/95 ${
          isActive ? 'active shadow-sm' : 'hover:bg-white/30'
        }`
      }
    >
      {Icon && <Icon size={18} />}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const groups = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.ADMIN;

  return (
    <>
      {/* mobile bar */}
      <div className="md:hidden sidebar px-4 h-12 flex items-center justify-between">
        <div className="font-semibold">Chalin Shop</div>
        <button
          className="btn btn-outline px-3 py-1"
          onClick={() => setOpen((v) => !v)}
          aria-label="toggle sidebar"
        >
          ☰
        </button>
      </div>

      {/* drawer mobile */}
      {open && (
        <aside className="md:hidden sidebar py-3">
          <div className="container-app">
            {groups.map((g, idx) => (
              <div key={idx} className="mb-4">
                {g.section ? (
                  <div className="section-title uppercase text-[11px] tracking-wide mb-2 font-medium">
                    {g.section}
                  </div>
                ) : null}
                <div className="grid gap-1">
                  {g.items.map((it) => (
                    <SideLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* sidebar desktop */}
      <aside className="hidden md:flex sidebar min-h-screen w-64 p-4 flex-col gap-4 sticky top-0">
        <div className="text-gray-200 font-semibold text-lg px-1">Chalin Shop</div>
        <div className="rounded-2xl p-3 bg-white/30">
          {groups.map((g, idx) => (
            <div key={idx} className="mb-3">
              {g.section ? (
                <div className="uppercase text-[11px] tracking-wide opacity-90 mb-2">
                  {g.section}
                </div>
              ) : null}
              <div className="grid gap-1">
                {g.items.map((it) => (
                  <SideLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto text-xs opacity-80 px-1">v0.1 • glass-blue</div>
      </aside>
    </>
  );
}
