import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileMenuDrawer from "./MobileMenuDrawer.jsx";
import { useAuthStore } from "../../store/authStore.js";
import api from "../../lib/api";

function initials(name) {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase?.() || "").join("") || "U";
}

function roleHomePath(roleUpper) {
  const r = String(roleUpper || "").toUpperCase();
  if (r === "ADMIN") return "/dashboard/admin";
  if (r === "STAFF") return "/dashboard/staff";
  if (r === "CONSIGNMENT") return "/dashboard/consignment";
  if (r === "QUOTE_VIEWER") return "/docs/quotes"; // ใบเสนอสินค้า
  // เผื่อไม่มี role ให้พาไปตัว router รวม
  return "/dashboard";
}

/**
 * Navbar
 * - Desktop/Tablet: ไม่มีโลโก้/ชื่อระบบด้านซ้ายแล้ว (ตามคำขอ) — เหลือช่องค้นหา
 * - Mobile: แสดงปุ่มเมนู + โลโก้ "Chalin Shop" (ลิงก์ไปหน้าแรกตามบทบาท)
 * - พื้นหลัง: ขาวอมฟ้านวล (half-glass)
 */
export default function Navbar() {
  const navigate = useNavigate();

  const userFromStore = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState(userFromStore || null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const displayUser = useMemo(() => profile || userFromStore, [profile, userFromStore]);
  const name = displayUser?.name || displayUser?.email || "ผู้ใช้งาน";
  const role = String(displayUser?.role || "").toUpperCase() || "GUEST";
  const branch =
    displayUser?.branch?.name || displayUser?.branchName || displayUser?.branchId || null;

  const homeTo = roleHomePath(role);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!token) {
        setProfile(null);
        return;
      }
      try {
        const res = await api.get("/api/auth/me");
        if (!on) return;
        setProfile(res.data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          doLogout(false);
        } else {
          setProfile(userFromStore || null);
        }
      }
    })();
    return () => {
      on = false;
    };
  }, [token, userFromStore]);

  async function doLogout(jumpHome = true) {
    try {
      await api.post("/api/auth/logout").catch(() => {});
    } catch {}
    logout?.();
    try {
      localStorage.removeItem("token");
    } catch {}
    setProfile(null);
    if (jumpHome) navigate("/", { replace: true });
  }

  return (
    <header
      className={[
        "border-b border-[rgba(15,23,42,.08)]",
        "bg-[rgba(237,243,255,0.85)] backdrop-blur-md",
      ].join(" ")}
    >
      <div className="h-14 flex items-center justify-between gap-3 px-3 md:px-5">
        {/* Left (Mobile only): ปุ่มเมนู + โลโก้ลิงก์ไปหน้าตามบทบาท */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-white/70 border border-[var(--card-border)]"
            onClick={() => setDrawerOpen(true)}
            aria-label="open menu"
          >
            ☰
          </button>
          <Link to={homeTo} className="font-semibold tracking-wide">
            Chalin Shop
          </Link>
        </div>

        {/* Center (Desktop/Tablet): ช่องค้นหาเท่านั้น (ลบชื่อระบบออกแล้ว) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-[42vw] max-w-xl">
            <input placeholder="Search…" className="input-glass w-full" />
          </div>
        </div>

        {/* Right: โปรไฟล์/ออกจากระบบ */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <div className="text-sm font-medium text-[#0b1220]">{name}</div>
            <div className="text-[11px] text-[#0b1220]/70">
              {role}
              {branch ? ` • ${branch}` : ""}
            </div>
          </div>
          <div className="size-9 grid place-items-center rounded-2xl bg-white/90 border border-[var(--card-border)] font-semibold text-[#0b1220]">
            {initials(name)}
          </div>
          <button
            onClick={() => doLogout(true)}
            className="h-9 px-3 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
            title="ออกจากระบบ"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* เมนูมือถือ */}
      <MobileMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        user={displayUser}
        onLogout={() => doLogout(true)}
      />
    </header>
  );
}
