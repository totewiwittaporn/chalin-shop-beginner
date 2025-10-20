import { useState } from "react";
import GradientPanel from "@/components/theme/GradientPanel.jsx";
import { Settings, Users, Building2 } from "lucide-react";
import UsersSettingsTab from "./tabs/UsersSettingsTab.jsx";
import HeadquartersSettingsTab from "./tabs/HeadquartersSettingsTab.jsx";

const TABS = [
  { key: "users", label: "ตั้งค่า User", icon: Users },
  { key: "hq", label: "สาขาหลัก + หัว/ท้ายเอกสาร", icon: Building2 },
  { key: "tabletpl", label: "เทมเพลตตารางเอกสาร", icon: Settings },
];

export default function SettingsPage() {
  const [active, setActive] = useState("hq");

  return (
    <div className="space-y-4">
      <GradientPanel
        title="หน้าตั้งค่า (ADMIN)"
        subtitle="ปรับผู้ใช้ สร้าง/สลับ Headquarters และตั้งค่าหัว/ท้ายเอกสาร"
        actions={
          <div className="hidden sm:flex items-center gap-2 text-sm opacity-90">
            <Settings className="w-4 h-4" />
            <span>Glass Blue Theme</span>
          </div>
        }
        className="from-[#9db9ff] to-[#6f86ff]"
        innerClassName="p-0"
      >
        {/* Tabs */}
        <div className="px-3 pt-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => {
              const isActive = active === key;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={[
                    "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition",
                    isActive ? "bg-white shadow text-slate-800" : "bg-white/40 hover:bg-white/70 text-slate-700",
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="rounded-2xl bg-white/95 p-3 sm:p-4">
            {active === "users" && <UsersSettingsTab />}
            {active === "hq" && <HeadquartersSettingsTab />}
            {active === "tabletpl" && <TableTemplatesTab />}
          </div>
        </div>
      </GradientPanel>
    </div>
  );
}
