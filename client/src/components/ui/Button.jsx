import clsx from "clsx";
import { buttonClasses } from "./buttonStyles";

/**
 * Button (แบบมาตรฐาน)
 * - type: "button" | "submit" | "reset"        // ✅ HTML type
 * - kind: "primary" | "white" | "ghost" | "link" | "danger" | "gradient" | "success"  // ✅ สไตล์
 * - size: "sm" | "md" | "lg"
 * - loading, disabled, fullWidth, leftIcon, rightIcon
 *
 * หมายเหตุ:
 * - ยังรองรับ `variant` เป็น alias ของ kind ชั่วคราว
 * - โค้ดเก่าแบบ `type="success"` จะไม่ใช้กำหนดสไตล์อีกต่อไป
 */

export default function Button({
  type = "button",     // HTML type
  kind,                // สไตล์หลักที่แนะนำใช้
  variant,             // alias ชั่วคราวของ kind
  size = "md",
  className,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  ...rest
}) {
  const styleKey = (kind ?? variant ?? "white"); // ถ้าไม่ได้ส่ง kind/variant มา ใช้ white

  const classes = buttonClasses({
    type: styleKey,     // ฟังก์ชันภายในยังใช้ชื่อ key=type สำหรับ mapping สไตล์
    size,
    fullWidth,
    disabled: disabled || loading,
    className,
  });

  const Spinner = () => (
    <svg className="animate-spin h-[1.1em] w-[1.1em]" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {leftIcon && <span className={clsx("-ml-0.5")}>{leftIcon}</span>}
      <span>{loading ? "กำลังทำงาน..." : children}</span>
      {loading ? <Spinner /> : (rightIcon && <span className={clsx("-mr-0.5")}>{rightIcon}</span>)}
    </button>
  );
}
