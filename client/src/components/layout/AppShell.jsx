import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";

export default function AppShell() {
  const navigate = useNavigate();

  // ✅ หลีกเลี่ยง useAuthStore ที่คืน object ใหม่ (ทำให้ React เตือน)
  const userFromStore = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);

  const [profile, setProfile] = useState(userFromStore || null);

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
          try { await api.post("/api/auth/logout").catch(()=>{}); } catch {}
          logout?.();
          navigate("/", { replace: true });
        } else {
          // 404 หรืออื่น ๆ: ใช้ข้อมูลจาก store ไปก่อน
          setProfile(userFromStore || null);
        }
      }
    })();
    return () => { on = false; };
    // อย่าใส่ logout/navigate ใน deps กันลูป
  }, [token, userFromStore, navigate, logout]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container-app flex gap-4 py-4">
        <aside className="hidden md:block w-[240px] shrink-0">
          <Sidebar user={profile || userFromStore} />
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
