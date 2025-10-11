import { NavLink } from "react-router-dom";
import { MOBILE_GROUPS } from "../../nav.mobile"; // ปรับพาธให้ตรงกับไฟล์เมนูของคุณ
import { useMemo } from "react";

export default function Sidebar({ user }) {
  const role = String(user?.role || "GUEST").toLowerCase();
  const groups = useMemo(() => MOBILE_GROUPS(role), [role]);

  const itemCls = ({ isActive }) =>
    "block px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 " +
    (isActive ? "bg-black/10 dark:bg-white/20 font-semibold" : "");

  return (
    <div className="panel p-3">
      <div className="text-sm text-muted px-1 pb-2">เมนู</div>
      {groups.map((g) => (
        <div key={g.id} className="mb-2">
          <div className="text-xs uppercase tracking-wide text-muted px-1 mb-1">{g.label}</div>
          <nav className="grid gap-1">
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} className={itemCls}>
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}
