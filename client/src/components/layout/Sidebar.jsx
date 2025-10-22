import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { SIDEBAR_GROUPS } from "@/nav.config";
import { useSidebarStore } from "@/store/ui/sidebarStore";

export default function Sidebar({ user }) {
  const roleLower = String(user?.role || "guest").toLowerCase();
  const groups = useMemo(() => SIDEBAR_GROUPS(roleLower), [roleLower]);

  const railWidth = useSidebarStore((s) => s.railWidth);
  const panelWidth = useSidebarStore((s) => s.panelWidth);
  const openGroupId = useSidebarStore((s) => s.openGroupId);
  const toggleGroup = useSidebarStore((s) => s.toggleGroup);
  const closePanel = useSidebarStore((s) => s.closePanel);

  const panelOpen = Boolean(openGroupId);
  const activeGroup = panelOpen ? groups.find((g) => g.id === openGroupId) : null;

  return (
    <>
      {/* Rail */}
      <aside
        className="fixed inset-y-0 left-0 z-40 text-white bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] backdrop-blur-md border-r border-white/15"
        style={{ width: railWidth }}
      >
        <div className="h-full flex flex-col items-center py-3 gap-2">
          <div className="flex-1 overflow-y-auto flex flex-col items-center gap-2 px-2">
            {groups.map((g) => {
              const Icon = g.icon;
              const active = openGroupId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  title={g.label}
                  className={[
                    "group size-11 rounded-full grid place-items-center border transition",
                    active
                      ? "bg-white/25 border-white/40 shadow-[0_8px_24px_rgba(255,255,255,.18)]"
                      : "bg-white/10 hover:bg-white/15 border-white/20",
                  ].join(" ")}
                >
                  {Icon ? (
                    <Icon className={["size-5", active ? "text-white" : "text-white/90"].join(" ")} />
                  ) : (
                    <span className="text-sm">{g.label?.[0] || "?"}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pb-2 text-[10px] text-white/85 tracking-wide">
            {(user?.role || "").toUpperCase() || "ROLE"}
          </div>
        </div>
      </aside>

      {/* Panel */}
      {panelOpen && activeGroup && (
        <aside
          className="fixed inset-y-0 z-30 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white backdrop-blur-md border-r border-white/15"
          style={{ left: railWidth, width: panelWidth }}
        >
          <div className="h-full flex flex-col py-3">
            <div className="px-4 pb-2 font-semibold tracking-wide">{activeGroup.label}</div>
            <div className="h-px bg-white/25 mx-4 mb-2" />
            <nav className="flex-1 overflow-y-auto px-3 pr-2">
              {activeGroup.items?.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end === true}
                  onClick={closePanel}
                  className={({ isActive }) =>
                    [
                      "block px-3 py-2 rounded-xl transition",
                      "text-white/90 hover:text-white",
                      "hover:bg-white/15 hover:border hover:border-white/25 backdrop-blur-sm",
                      isActive
                        ? "bg-white/20 border border-white/30 shadow-[0_8px_24px_rgba(255,255,255,.12)]"
                        : "border border-transparent",
                    ].join(" ")
                  }
                >
                  {it.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </>
  );
}
