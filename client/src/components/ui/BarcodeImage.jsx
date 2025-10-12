import React from "react";
import Barcode from "react-barcode";

/**
 * Reusable barcode renderer that fits the project's "glass blue" theme.
 * - ใช้แสดงภาพบาร์โค้ด (เส้น) ไม่ใช่ตัวเลข
 *
 * Props:
 *   value: string | number (required)
 *   height?: number (default 38)
 *   width?: number (default 1.5)
 *   showValue?: boolean (default false)
 *   className?: string
 */
export default function BarcodeImage({
  value,
  height = 38,
  width = 1.5,
  showValue = false,
  className = "",
}) {
  const val = String(value || "").trim();
  if (!val) {
    return <span className="text-slate-400 italic">ไม่มีบาร์โค้ด</span>;
    }
  return (
    <div
      className={[
        "inline-flex rounded-xl bg-white/90 backdrop-blur px-2 py-1",
        "shadow-sm ring-1 ring-slate-200/70",
        className,
      ].join(" ")}
      title={val}
    >
      <Barcode
        value={val}
        height={height}
        width={width}
        displayValue={showValue}
        background="transparent"
        margin={0}
      />
    </div>
  );
}
