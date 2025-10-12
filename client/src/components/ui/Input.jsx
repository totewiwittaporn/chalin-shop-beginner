// client/src/components/ui/Input.jsx
import clsx from "clsx";

/**
 * Input (Glass Blue theme)
 * - แก้ปัญหา className ทับค่าเดิม: รวม class แบบปลอดภัยด้วย clsx
 * - บังคับสีตัวอักษร/placeholder เอง เพื่อไม่ให้โดน text-white ของ parent (เช่น Card gradient)
 * - โทนกรอบ/พื้นหลัง/โฟกัสให้เหมือนกันทุกช่อง
 */
export default function Input({ className = "", ...props }) {
  const base =
    "w-full rounded-xl border px-3 py-2 outline-none " +
    // สีพื้น/กรอบ/ตัวอักษร (อ่านง่ายบนการ์ด gradient)
    "bg-white text-slate-900 placeholder-slate-500 " +
    "border-slate-300 " +
    // โฮเวอร์ & โฟกัส
    "hover:border-slate-400 focus:border-slate-400 " +
    "focus:ring-2 focus:ring-primary/30 focus:ring-offset-0";

  return <input className={clsx(base, className)} {...props} />;
}
