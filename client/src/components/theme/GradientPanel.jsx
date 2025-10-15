// client/src/components/theme/GradientPanel.jsx
import clsx from "clsx";

/**
 * GradientPanel
 * ชั้นนอก: พื้นหลังไล่เฉด (ข้อความสีขาว)
 * ชั้นใน: กล่องขาว/ขาวอมฟ้าโปร่ง สำหรับเนื้อหา
 *
 * Props:
 * - title, subtitle, actions: ส่วนหัวชั้นนอก (ตัวอักษรสีขาว)
 * - className: เติมคลาสให้ชั้นนอก (gradient)
 * - innerClassName: เติมคลาสให้ชั้นใน (white panel)
 * - children: เนื้อหาหลักวางในชั้นใน
 */
export default function GradientPanel({
  title,
  subtitle,
  actions,
  className,
  innerClassName,
  children,
}) {
  return (
    <section
      className={clsx(
        // gradient ชั้นนอก (ค่ามาตรฐานของธีม)
        "p-5 rounded-2xl text-white shadow-md bg-gradient-to-b from-[#9db9ff] to-[#6f86ff]",
        className
      )}
    >
      {/* ส่วนหัวบน gradient */}
      {(title || subtitle || actions) && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold leading-none">{title}</h2>}
            {subtitle && <p className="opacity-90 text-sm mt-1">{subtitle}</p>}
          </div>
          {!!actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* กล่องขาวชั้นใน */}
      <div
        className={clsx(
          "rounded-2xl bg-white/95 p-3 sm:p-4 text-slate-800 overflow-hidden",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
