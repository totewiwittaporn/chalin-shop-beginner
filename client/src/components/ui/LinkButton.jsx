import { Link } from "react-router-dom";
import { buttonClasses } from "./buttonStyles";

/**
 * LinkButton (ลิงก์หน้าตาเป็นปุ่ม)
 * - kind: "primary" | "white" | "ghost" | "link" | "danger" | "gradient" | "success"
 * - size: "sm" | "md" | "lg"
 * - fullWidth, disabled
 * - ภายใน (to) / ภายนอก (href)
 * - รองรับ `variant` เป็น alias ของ kind ชั่วคราว
 */
export default function LinkButton({
  to,
  href,
  kind,
  variant,              // alias ชั่วคราว
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  const styleKey = (kind ?? variant ?? "white");
  const classes = buttonClasses({ type: styleKey, size, fullWidth, disabled, className });

  if (disabled) {
    return (
      <span className={classes} aria-disabled="true" {...rest}>
        {children}
      </span>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to || "#"} className={classes} {...rest}>
      {children}
    </Link>
  );
}
