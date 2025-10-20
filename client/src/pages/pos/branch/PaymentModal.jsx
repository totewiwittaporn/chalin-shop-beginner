
import { useEffect, useMemo, useRef, useState } from "react";
import GlassModal from "@/components/theme/GlassModal";
import Button from "@/components/ui/Button";
import CameraCaptureModal from "@/components/CameraCaptureModal";

/**
 * PaymentModal v3
 * - ปุ่มถ่ายรูป = เปิด CameraCaptureModal
 * - ปุ่มอัปโหลดไฟล์ = เปิด file chooser
 * - แสดงพรีวิว/ลบ/เปลี่ยน, ส่งออก evidenceFile/evidencePreview ไป parent
 */
export default function PaymentModal({
  open,
  onClose,
  total = 0,
  role = "STAFF",
  policy,
  onConfirm, // ({ method, receive, change, ref?, evidenceFile?, evidencePreview? })
}) {
  const [method, setMethod] = useState("CASH");
  const [receive, setReceive] = useState(0);
  const [refNo, setRefNo] = useState("");

  // หลักฐาน
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState("");
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod("CASH");
    setReceive(0);
    setRefNo("");
    clearEvidence();
  }, [open]);

  function clearEvidence() {
    setEvidenceFile(null);
    if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    setEvidencePreview("");
  }

  function handlePickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setEvidenceFile(f);
    const url = URL.createObjectURL(f);
    setEvidencePreview(url);
    e.target.value = ""; // allow re-pick same file later
  }

  const change = useMemo(() => {
    if (method !== "CASH") return 0;
    const ch = Number(receive || 0) - Number(total || 0);
    return Math.max(0, ch);
  }, [method, receive, total]);

  const canConfirm = useMemo(() => {
    if (method === "CASH") return Number(receive || 0) >= Number(total || 0);
    return true;
  }, [method, receive, total]);

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm?.({
      method,
      receive: Number(receive || 0),
      change,
      ref: refNo?.trim() || undefined,
      evidenceFile: evidenceFile || undefined,
      evidencePreview: evidencePreview || undefined,
    });
  }

  return (
    <>
      <GlassModal
        open={open}
        onClose={onClose}
        title="ชำระเงิน"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button kind="white" onClick={onClose}>ย้อนกลับ</Button>
            <Button kind="success" onClick={handleConfirm} disabled={!canConfirm}>ยืนยันชำระ</Button>
          </div>
        }
      >
        <div className="grid gap-4">
          {/* ยอดชำระ */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">ยอดชำระ</span>
            <b className="text-lg">{(Number(total)||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</b>
          </div>

          {/* วิธีชำระ */}
          <div className="flex items-center gap-2">
            <MethodButton active={method === "CASH"} onClick={() => setMethod("CASH")}>CASH</MethodButton>
            <MethodButton active={method === "TRANSFER"} onClick={() => setMethod("TRANSFER")}>TRANSFER</MethodButton>
            <MethodButton active={method === "QR"} onClick={() => setMethod("QR")}>QR</MethodButton>
          </div>

          {method === "CASH" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                รับเงิน (บาท)
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-right"
                  value={receive}
                  onChange={(e) => setReceive(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  inputMode="decimal"
                />
              </label>
              <label className="text-sm">
                เงินทอน
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-right bg-slate-50"
                  value={change.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}
                  readOnly
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-3">
              <label className="text-sm">
                เลขอ้างอิง/Ref No.
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                />
              </label>

              {/* หลักฐานการชำระ */}
              <div className="grid gap-2">
                <div className="text-sm text-slate-600">หลักฐานการชำระ</div>

                {evidencePreview ? (
                  <div className="rounded-xl border p-2 bg-slate-50">
                    <img src={evidencePreview} alt="evidence" className="max-h-56 rounded-lg object-contain mx-auto" />
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Button kind="white" onClick={() => setShowCamera(true)}>ถ่ายใหม่</Button>
                      <Button kind="white" onClick={() => fileInputRef.current?.click()}>เลือกไฟล์</Button>
                      <Button kind="danger" onClick={clearEvidence}>ลบรูป</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button kind="primary" onClick={() => setShowCamera(true)}>ถ่ายรูปด้วยกล้อง</Button>
                    <Button kind="white" onClick={() => fileInputRef.current?.click()}>อัปโหลดจากไฟล์</Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickFile}
                />

                <p className="text-xs text-slate-500">
                  * เพื่อเปิดกล้องแบบสด กรุณาใช้งานบนมือถือ/แท็บเล็ต และอนุญาตสิทธิ์กล้อง
                </p>
              </div>
            </div>
          )}
        </div>
      </GlassModal>

      {/* กล้องถ่ายเอกสาร */}
      <CameraCaptureModal
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={({ file, previewUrl }) => {
          setShowCamera(false);
          if (!file) return;
          // เก็บไฟล์และพรีวิวไว้ที่ modal หลัก
          setEvidenceFile(file);
          // ถ้ามี preview เดิม ให้ revoke ก่อน
          if (evidencePreview) URL.revokeObjectURL(evidencePreview);
          setEvidencePreview(previewUrl);
        }}
      />
    </>
  );
}

function MethodButton({ active, children, ...rest }) {
  return (
    <button
      className={[
        "px-3 py-1.5 rounded-xl text-sm border",
        active ? "bg-[#3b82f6] text-white border-[#3b82f6]" : "bg-white border-slate-300 text-slate-700",
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
