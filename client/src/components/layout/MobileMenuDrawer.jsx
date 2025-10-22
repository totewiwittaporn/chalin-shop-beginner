import { Fragment, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { SIDEBAR_GROUPS } from "@/nav.config";
import { useSidebarStore } from "@/store/ui/sidebarStore";
import { LogOut } from "lucide-react";

export default function MobileMenuDrawer({ user }) {
  const roleLower = String(user?.role || "guest").toLowerCase();
  const groups = useMemo(() => SIDEBAR_GROUPS(roleLower), [roleLower]);

  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  if (!mobileOpen) return null;

  function triggerLogout() {
    closeMobile();
    window.dispatchEvent(new Event("app:logout"));
  }

  return (
    <Fragment>
      <div onClick={closeMobile} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" />
      <aside className="fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white md:hidden">
        <div className="h-full flex flex-col py-4">
          <div className="px-4 text-lg font-semibold">เมนู</div>
          <div className="h-px bg-white/25 mx-4 my-2" />
          <div className="flex-1 overflow-y-auto px-2">
            {groups.map((g) => (
              <div key={g.id} className="mb-3">
                <div className="px-2 text-sm/6 font-medium opacity-90">{g.label}</div>
                <div className="mt-1 grid">
                  {g.items?.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        [
                          "px-3 py-2 rounded-xl transition",
                          "text-white/90 hover:text-white",
                          isActive ? "bg-white/20" : "hover:bg-white/15",
                        ].join(" ")
                      }
                    >
                      {it.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 pt-2 border-t border-white/20">
            <button
              onClick={triggerLogout}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-red-500/90 hover:bg-red-500 text-white"
            >
              <LogOut className="size-4" />
              ออกจากระบบ
            </button>
          </div>

          <div className="px-4 py-2 text-[12px] text-white/90">
            {(user?.name || user?.username || "User")} • {(user?.role || "").toUpperCase()}
          </div>
        </div>
      </aside>
    </Fragment>
  );
}
