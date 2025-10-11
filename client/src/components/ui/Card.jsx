import clsx from "clsx";

/**
 * Card UI
 * - variant="solid"     : การ์ดพื้นขาวนวล (default)
 * - variant="glass"     : การ์ดโปร่งแบบ glass
 * - variant="gradient"  : กราเดียนต์ฟ้า → ม่วง (ตัวหนังสือสีขาว)
 *
 * ใช้งาน:
 *   <Card className="p-4">...</Card>
 *   <Card variant="gradient" className="p-4">...</Card>
 *   <Card.Header>...</Card.Header>
 *   <Card.Body>...</Card.Body>
 *   <Card.Footer>...</Card.Footer>
 */

export function Card({
  as: Tag = "div",
  variant = "solid",
  className,
  children,
  ...rest
}) {
  const base = "rounded-2xl border overflow-hidden";
  const variants = {
    solid:
      "bg-[var(--card-bg)] border-[var(--card-border)] shadow-[0_8px_24px_rgba(15,23,42,.05)]",
    glass:
      "backdrop-blur-xl bg-white/55 border-[var(--card-border)] shadow-[0_8px_24px_rgba(15,23,42,.05)]",
    gradient:
      "bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white border-transparent shadow-[0_14px_40px_rgba(111,134,255,.12),0_6px_16px_rgba(17,24,39,.08)]",
  };

  return (
    <Tag className={clsx(base, variants[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}

function Section({ as: Tag = "div", className, children, ...rest }) {
  return (
    <Tag className={clsx("p-4 md:p-5", className)} {...rest}>
      {children}
    </Tag>
  );
}

Card.Header = function CardHeader(props) {
  return (
    <Section
      {...props}
      className={clsx(
        "border-b border-[var(--card-border)]/70",
        "[&_.__gradient_&]:border-white/20",
        props.className
      )}
    />
  );
};

Card.Body = function CardBody(props) {
  return <Section {...props} />;
};

Card.Footer = function CardFooter(props) {
  return (
    <Section
      {...props}
      className={clsx(
        "border-t border-[var(--card-border)]/70",
        "[&_.__gradient_&]:border-white/20",
        props.className
      )}
    />
  );
};

export default Card;
