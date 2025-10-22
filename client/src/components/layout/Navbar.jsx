import { useSidebarStore } from "@/store/ui/sidebarStore";
import { Menu, LogOut } from "lucide-react";

export default function Navbar({ user }) {
  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const displayName = user?.name || user?.username || "User";
  const displayRole = (user?.role || "").toUpperCase() || "ROLE";

  function triggerLogout() {
    window.dispatchEvent(new Event("app:logout"));
  }

  return (
    <header className="w-full bg-white/70 backdrop-blur border-b border-black/10">
      {/* Mobile */}
      <div className="md:hidden h-12 flex items-center justify-between px-3">
        <button
          onClick={toggleMobile}
          className="size-10 grid place-items-center rounded-xl hover:bg-black/5"
          aria-label="open menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{displayName}</span>
          <span className="text-black/50">• {displayRole}</span>
        </div>
      </div>

      {/* Desktop/Tablet */}
      <div className="hidden md:flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-lg font-semibold tracking-wide">Chalin Shop</div>
          <div className="flex-1">
            <input
              placeholder="Search…"
              className="w-full h-10 px-3 rounded-xl bg-white border border-black/10 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pl-4">
          <div className="text-sm">
            <span className="font-medium">{displayName}</span>
            <span className="text-black/50"> • {displayRole}</span>
          </div>
          <button
            onClick={triggerLogout}
            className="inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-red-500/90 text-white hover:bg-red-500"
            title="ออกจากระบบ"
          >
            <LogOut className="size-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
