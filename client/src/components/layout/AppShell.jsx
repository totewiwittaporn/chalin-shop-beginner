import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";

/**
 * โครงหน้า: | Sidebar (fixed/sticky) | [ Navbar (top) + Content Area (scroll) ]
 * - Sidebar: กว้าง 260px พื้นหลังเกรเดี้ยน ตลอดความสูง
 * - Navbar: ด้านบนของฝั่งขวา สีขาวอมฟ้า (semi-glass)
 * - Content Area: พื้นหลังขาวอมฟ้านวล ๆ (อ่านง่าย), เนื้อหาภายในค่อยใช้ Card/StatCard เป็นเกรเดี้ยน
 */
export default function AppShell() {
  const navigate = useNavigate();

  // เลือกเฉพาะ key จาก Zustand เพื่อเลี่ยง re-render ลูป
  const userFromStore = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState(userFromStore || null);

  useEffect(() => {
    let on = true;
    if (!token) {
      setProfile(null);
      return;
    }
    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (!on) return;
        setProfile(res.data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          try {
            await api.post("/api/auth/logout").catch(() => {});
          } catch {}
          logout?.();
          navigate("/", { replace: true });
        } else {
          // 404/อื่น ๆ: ใช้ข้อมูลจาก store ไปก่อน
          setProfile(userFromStore || null);
        }
      }
    })();
    return () => {
      on = false;
    };
  }, [token, userFromStore, logout, navigate]);

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar (ซ้ายสุด) */}
      <aside className="hidden md:block w-[260px] shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar user={profile || userFromStore} />
        </div>
      </aside>

      {/* ฝั่งขวา: Navbar (บน) + Content (ล่าง) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Navbar: ขาวอมฟ้านวล, glass เบา ๆ */}
        <div className="sticky top-0 z-[30]">
          <Navbar />
        </div>

        {/* Content Area: พื้นหลังขาวอมฟ้านวล ทั้งผืน */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full p-4 md:p-6 bg-[rgba(237,243,255,0.6)]">
            {/* เนื้อหาหน้าจริง */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
