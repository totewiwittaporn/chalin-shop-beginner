import { Link } from "react-router-dom";
import { buttonClasses } from "@/components/ui/buttonStyles";

/**
 * LinkButton (ลิงก์หน้าตาเป็นปุ่ม)
 * kind:
 *  "primary" | "white" | "ghost" | "link" |
 *  "success" | "editor" | "warning" | "danger" | "gradient"
 *
 * size: "sm" | "md" | "lg"
 * options: fullWidth, disabled
 * สามารถใช้ `variant` เป็น alias ของ kind ได้ (เผื่อรหัสเก่า)
 */
export default function LinkButton({
  to,
  href,
  kind,
  variant, // alias ชั่วคราว
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  const styleKey = kind ?? variant ?? "white";
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
