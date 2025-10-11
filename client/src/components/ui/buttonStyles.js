import clsx from "clsx";

export const STYLES = {
  primary:
    "bg-[var(--brand-2)] text-white border border-transparent " +
    "shadow-[0_10px_24px_var(--ring-softer)] hover:shadow-[0_12px_28px_var(--ring-soft)]",
  white:
    "bg-white text-[#0b1220] border border-[rgba(15,23,42,.08)] " +
    "shadow-[0_10px_24px_var(--ring-softer)] hover:shadow-[0_12px_28px_var(--ring-soft)]",
  ghost:
    "bg-transparent text-[var(--ink)] border border-[rgba(15,23,42,.12)] hover:bg-white/60",
  link:
    "bg-transparent text-[var(--brand-2)] border border-transparent hover:underline px-0",
  danger:
    "bg-red-600 text-white border border-transparent " +
    "shadow-[0_10px_24px_rgba(220,38,38,.15)] hover:bg-red-700",
  gradient:
    "bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white border border-transparent " +
    "shadow-[0_12px_30px_rgba(111,134,255,.25)] hover:brightness-[1.02]",

  // ✅ ใหม่: ปุ่มเขียวสำหรับ Submit
  success:
    "bg-emerald-600 text-white border border-transparent " +
    "shadow-[0_10px_24px_rgba(16,185,129,.22)] hover:bg-emerald-700 " +
    "focus-visible:ring-emerald-300",
};

export const SIZES = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-4 text-[15px] rounded-xl",
  lg: "h-12 px-5 text-base rounded-2xl",
};

export function buttonClasses({
  type = "white",
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 transition focus:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)]";
  return clsx(
    base,
    STYLES[type] || STYLES.white,
    SIZES[size] || SIZES.md,
    fullWidth && "w-full",
    disabled && "opacity-60 pointer-events-none cursor-not-allowed",
    className
  );
}
