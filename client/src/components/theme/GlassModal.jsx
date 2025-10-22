// client/src/components/theme/GlassModal.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function GlassModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md", // "sm" | "md" | "lg" | "xl"
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "sm" ? "max-w-md"
    : size === "lg" ? "max-w-3xl"
    : size === "xl" ? "max-w-5xl"
    : "max-w-2xl"; // md

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-3 md:p-6">
        {/* กรอบแก้วตามธีม + เงาอ่อน */}
        <div
          className={[
            "w-full", sizeClass,
            "rounded-2xl border border-white/40",
            "bg-white/50 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.25)]",
            "overflow-hidden",
            // สูงสุดประมาณ 90% ของ viewport
            "max-h-[90vh]"
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header ตรึง */}
          <div className="sticky top-0 z-[1] bg-white/70 backdrop-blur px-4 md:px-5 py-3 border-b border-black/10">
            <div className="flex items-center justify-between gap-3">
              <div className="text-base md:text-lg font-semibold text-slate-800">{title}</div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10"
                aria-label="close"
                title="ปิด"
              >
                ✕
              </button>
            </div>
          </div>

          {/* เนื้อหา — เลื่อนเฉพาะส่วนนี้ */}
          <div className="px-4 md:px-5 py-4 overflow-y-auto"
               style={{ maxHeight: "calc(90vh - 56px - 64px)" /* 56 header + 64 footer approx */ }}>
            {children}
          </div>

          {/* Footer ตรึง */}
          <div className="sticky bottom-0 z-[1] bg-white/70 backdrop-blur px-4 md:px-5 py-3 border-t border-black/10">
            <div className="flex items-center justify-end gap-2">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
