// client/src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
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
        `flex items-center gap-2 px-3 py-2 rounded-xl transition text-white/95 ${isActive ? 'active shadow-sm' : 'hover:bg-white/30'}`
      }
    >
      {Icon && <Icon size={18} />}
      <span className="text-sm font-medium hidden lg:inline">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const groups = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.ADMIN;

  return (
    <aside className="hidden md:flex sidebar min-h-screen lg:w-64 md:w-[72px] p-4 flex-col gap-4 sticky top-0">
      <div className="text-gray-200 font-semibold text-lg px-1 hidden lg:block">Chalin Shop</div>
      <div className="rounded-2xl p-3 bg-white/30 w-full">
        {groups.map((g, idx) => (
          <div key={idx} className="mb-3">
            {g.section ? (
              <div className="uppercase text-[11px] tracking-wide opacity-90 mb-2 hidden lg:block">
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
      <div className="mt-auto text-xs opacity-80 px-1 hidden lg:block">v0.1 • glass-blue</div>
    </aside>
  );

  return (
    <aside
      className="
        hidden md:block
        fixed inset-y-0 left-0 z-40
        w-[72px] lg:w-64
        bg-gradient-to-b from-[#9db9ff] to-[#6f86ff]
        border-r border-white/20
        overflow-y-auto
        px-3 lg:px-4 py-4
      "
    >
      <div className="hidden lg:block text-white/95 font-semibold text-lg mb-3 px-1">
        Chalin Shop
      </div>

      <nav className="space-y-3">
        {groups.map((g, idx) => (
          <div key={idx}>
            <div className="hidden lg:block uppercase text-[11px] tracking-wide text-white/80 mb-2">
              {g.section}
            </div>
            <div className="grid gap-1">
              {g.items.map((it) => (
                <SideLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden lg:block mt-6 text-[11px] text-white/70 px-1">
        v0.1 • glass-blue
      </div>
    </aside>
  );
}
