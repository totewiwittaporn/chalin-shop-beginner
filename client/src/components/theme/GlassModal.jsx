// client/src/components/theme/GlassModal.jsx
import { X } from "lucide-react";

export default function GlassModal({ open, title, children, footer, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop เบลอ */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
        onClick={onClose}
      />
      {/* กล่อง gradient + กล่องขาว */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-3xl p-[2px] shadow-2xl"
             style={{ background: "linear-gradient(135deg,#7aa6ff, #b8c7ff)" }}>
          <div className="rounded-3xl bg-[#f6f9ff]">
            <div className="flex items-center justify-between p-5">
              <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
              <button
                className="rounded-full p-2 hover:bg-slate-200/70 transition"
                onClick={onClose}
                aria-label="close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-5">{children}</div>
            {footer && <div className="px-5 pb-5">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
