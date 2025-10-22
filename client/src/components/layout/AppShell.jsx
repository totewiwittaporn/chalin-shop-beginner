import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileMenuDrawer from "@/components/layout/MobileMenuDrawer";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/ui/sidebarStore";
import api from "@/lib/api";

// เช็คหน้าจอ >= md
function useIsMdUp() {
  const [isMdUp, setIsMdUp] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : true
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => setIsMdUp(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return isMdUp;
}

export default function AppShell() {
  const navigate = useNavigate();

  const userFromStore = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState(userFromStore || null);

  // ดัก logout จากปุ่มทุกที่
  useEffect(() => {
    async function doLogout() {
      try { await api.post("/api/auth/logout").catch(() => {}); }
      finally { logout?.(); navigate("/", { replace: true }); }
    }
    const handler = () => { doLogout(); };
    window.addEventListener("app:logout", handler);
    return () => window.removeEventListener("app:logout", handler);
  }, [logout, navigate]);

  // โหลดโปรไฟล์ตามเดิม
  useEffect(() => {
    let on = true;
    if (!token) { setProfile(null); return; }
    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (!on) return;
        setProfile(res.data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          try { await api.post("/api/auth/logout").catch(() => {}); } catch {}
          logout?.(); navigate("/", { replace: true });
        } else {
          setProfile(userFromStore || null);
        }
      }
    })();
    return () => { on = false; };
  }, [token, userFromStore, logout, navigate]);

  const user = profile || userFromStore;

  // Offset สำหรับ PC/Tablet
  const isMdUp = useIsMdUp();
  const getContentOffset = useSidebarStore((s) => s.getContentOffset);
  const desktopOffset = useMemo(() => getContentOffset(), [getContentOffset]);
  const appliedOffset = isMdUp ? desktopOffset : 0;

  return (
    <div
      className="h-screen w-full overflow-hidden"
      // สีพื้นหลังเป็นเกรเดียนตามธีมเดิม
      style={{
        background:
          "linear-gradient(180deg, rgba(222,234,255,0.9) 0%, rgba(227,236,255,0.9) 40%, rgba(235,242,255,0.9) 100%)",
      }}
    >
      {/* Sidebar: md+ เท่านั้น */}
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>

      {/* Mobile Drawer (ทับ content) */}
      <MobileMenuDrawer user={user} />

      {/* Main: ดัน Navbar + Content ตาม offset */}
      <div
        className="h-full flex flex-col transition-[margin-left] duration-200 ease-out"
        style={{ marginLeft: appliedOffset }}
      >
        {/* Navbar */}
        <div className="sticky top-0 z-[25]">
          <Navbar user={user} />
        </div>

        {/* Content Area — ลด padding, ไม่มีกรอบนอก, พื้นขาวอมฟ้าอ่อน */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-3 md:px-5 pt-3 md:pt-4 pb-6">
            <div className="rounded-2xl bg-[#f6f9ff]">
              {/* ระยะภายในเนื้อหา: เล็กลงให้ดูโปร่ง - ไม่กินที่ */}
              <div className="p-3 md:p-5">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
