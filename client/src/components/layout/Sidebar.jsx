import { NavLink, Link } from "react-router-dom";
import { useMemo } from "react";
import { MOBILE_GROUPS } from "../../nav.mobile"; // ปรับพาธให้ตรงโปรเจกต์คุณ

function roleHomePath(roleUpper) {
  const r = String(roleUpper || "").toUpperCase();
  if (r === "ADMIN") return "/dashboard/admin";
  if (r === "STAFF") return "/dashboard/staff";
  if (r === "CONSIGNMENT") return "/dashboard/consignment";
  if (r === "QUOTE_VIEWER") return "/docs/quotes"; // ใบเสนอสินค้า
  return "/dashboard"; // fallback
}

/**
 * Sidebar
 * - พื้นหลังเกรเดี้ยนจากธีม
 * - active/hover = glass (โปร่ง, เส้นขอบขาวบาง ๆ)
 * - แบรนด์ลิงก์ (CS + Chalin Shop) → ไปหน้าแรกตามบทบาท
 */
export default function Sidebar({ user }) {
  const roleLower = String(user?.role || "GUEST").toLowerCase();
  const roleUpper = String(user?.role || "GUEST").toUpperCase();

  const groups = useMemo(() => MOBILE_GROUPS(roleLower), [roleLower]);
  const homeTo = roleHomePath(roleUpper);

  const itemClass = ({ isActive }) =>
    [
      "px-3 py-2 rounded-xl transition",
      "text-white/90 hover:text-white",
      "hover:bg-white/15 hover:border hover:border-white/25",
      "backdrop-blur-sm",
      isActive
        ? "bg-white/20 border border-white/30 shadow-[0_8px_24px_rgba(255,255,255,.12)]"
        : "border border-transparent",
    ].join(" ");

  return (
    <div className="h-full w-full">
      {/* พื้นหลัง Sidebar = เกรเดี้ยนฟ้า → ม่วง */}
      <div className="h-full w-full bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white">
        <div className="h-full w-full flex flex-col px-4 py-3">
          {/* Header: แบรนด์ลิงก์ไปหน้าแรกตามบทบาท */}
          <Link to={homeTo} className="mb-3" aria-label="ไปหน้าแรก">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-2xl bg-white/85 grid place-items-center text-[#0b1220] font-bold">
                CS
              </div>
              <div className="text-lg font-semibold drop-shadow-sm">
                Chalin&nbsp;Shop
              </div>
            </div>
          </Link>

          <div className="h-px bg-white/25 mb-3" />

          {/* Groups */}
          <div className="flex-1 overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.id || g.label} className="mb-2">
                <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-white/75">
                  {g.label}
                </div>
                <nav className="grid gap-1">
                  {g.items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.end === true}
                      className={itemClass}
                    >
                      {it.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Footer (ย่อบทบาท/สาขา) */}
          <div className="mt-auto pt-2">
            <div className="text-[11px] text-white/80">
              {roleUpper}
              {user?.branch?.name ? ` • ${user.branch.name}` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
