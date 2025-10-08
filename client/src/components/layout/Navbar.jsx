import { useAuthStore, ROLES } from '../../store/authStore.js';

export default function Navbar() {
  const { user, setRole } = useAuthStore();
  return (
    <header className="navbar">
      <div className="container-app h-14 flex items-center justify-between">
        {/* left (ว่างไว้เพราะมีโลโก้ใน sidebar เดสก์ท็อป) */}
        <div className="hidden md:block w-40" />
        {/* search */}
        <div className="flex-1 max-w-xl">
          <input
            placeholder="Search…"
            className="w-full glass rounded-2xl px-4 py-2 outline-none"
          />
        </div>
        {/* role switch (dev) */}
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm hidden md:inline">Role</span>
          <select
            className="rounded-xl border border-border bg-surface px-2 py-1 text-sm"
            value={user.role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}
