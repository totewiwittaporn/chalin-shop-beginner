import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MobileMenuDrawer from './MobileMenuDrawer.jsx';
import { useAuthStore } from '../../store/authStore.js';
import api from '../../lib/api';

function initials(name) {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase?.() || '').join('') || 'U';
}

export default function Navbar() {
  const navigate = useNavigate();

  // ✅ เลือกทีละคีย์จาก zustand กัน object ใหม่ทุก render
  const userFromStore = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);

  const [profile, setProfile] = useState(userFromStore || null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const displayUser = useMemo(() => profile || userFromStore, [profile, userFromStore]);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!token) { setProfile(null); return; }
      try {
        const res = await api.get('/api/auth/me');
        if (!on) return;
        setProfile(res.data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          doLogout(false);
        } else {
          // 404/อื่น ๆ: อย่า logout
          setProfile(userFromStore || null);
        }
      }
    })();
    return () => { on = false; };
  }, [token, userFromStore]);

  async function doLogout(jumpHome = true) {
    try { await api.post('/api/auth/logout').catch(() => {}); } catch {}
    logout?.();
    try { localStorage.removeItem('token'); } catch {}
    setProfile(null);
    if (jumpHome) navigate('/', { replace: true });
  }

  const name = displayUser?.name || displayUser?.email || 'ผู้ใช้งาน';
  const role = String(displayUser?.role || '').toUpperCase() || 'GUEST';
  const branch = displayUser?.branch?.name || displayUser?.branchName || displayUser?.branchId || null;

  return (
    <header className="navbar border-b border-white/10">
      <div className="container-app h-14 flex items-center justify-between gap-3">
        {/* Mobile left */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-white/70 border border-[var(--card-border)]"
            onClick={() => setDrawerOpen(true)}
            aria-label="open menu"
          >
            ☰
          </button>
          <Link to="/" className="font-semibold tracking-wide">Chalin Shop</Link>
        </div>

        {/* Desktop center */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/" className="font-semibold tracking-wide mr-2">Chalin Shop</Link>
          <div className="w-[42vw] max-w-xl">
            <input
              placeholder="Search…"
              className="input-glass w-full"
            />
          </div>
        </div>

        {/* Right: user */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-[11px] opacity-70">{role}{branch ? ` • ${branch}` : ''}</div>
          </div>
          <div className="size-9 grid place-items-center rounded-2xl bg-white/70 border border-[var(--card-border)] font-semibold">
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
