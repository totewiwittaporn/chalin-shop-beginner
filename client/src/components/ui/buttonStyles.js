// client/src/components/ui/buttonStyles.js
import clsx from "clsx";

const base =
  "inline-flex items-center gap-2 rounded-xl font-medium transition-shadow focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed";

const sizes = {
  sm: "text-sm px-3 py-1.5",
  md: "text-[15px] px-4 py-2",
  lg: "text-base px-5 py-2.5",
};

// palette
const kinds = {
  primary:
    "bg-[#3b82f6] text-white hover:shadow-md hover:brightness-105 focus:ring-[#3b82f6]/40",
  white:
    "bg-white text-slate-900 border border-slate-200 hover:shadow-sm focus:ring-slate-300/50",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100/60 focus:ring-slate-300/40",
  link: "bg-transparent underline text-[#3b82f6] px-0 py-0 focus:ring-[#3b82f6]/30",
  danger:
    "bg-[#ef4444] text-white hover:shadow-md hover:brightness-105 focus:ring-[#ef4444]/40",
  success:
    "bg-[#10b981] text-white hover:shadow-md hover:brightness-105 focus:ring-[#10b981]/40",
  gradient:
    "text-white bg-gradient-to-r from-[#6f86ff] to-[#9db9ff] hover:shadow-md focus:ring-[#6f86ff]/40",
  // ✅ ใหม่: ปุ่มสำหรับ “แก้ไข” สีเหลือง
  editor:
    "bg-[#f59e0b] text-white hover:shadow-md hover:brightness-105 focus:ring-[#f59e0b]/40",
};

export function buttonClasses({
  type = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
}) {
  return clsx(
    base,
    sizes[size] || sizes.md,
    kinds[type] || kinds.primary,
    fullWidth && "w-full justify-center",
    disabled && "pointer-events-none",
    className
  );
}
