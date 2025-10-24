// frontend/.../ConfirmClearModal.jsx
import React from "react";
import GlassModal from "@/components/theme/GlassModal";

export default function ConfirmClearModal({ open, onClose, onConfirm }) {
  return (
    <GlassModal open={open} onClose={onClose} width={420} title="ล้างรายการ">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          ต้องการล้างสินค้าทั้งหมดในรายการใช่ไหม? การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            ล้างรายการ
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
