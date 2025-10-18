import { useEffect, useRef, useState } from 'react';
import GlassModal from '@/components/theme/GlassModal';
import Button from '@/components/ui/Button';

/**
 * CameraCaptureModal
 * - เปิดกล้อง (facingMode: environment) เพื่อถ่ายรูปเอกสาร
 * - แสดงตัวอย่างก่อนยืนยัน, สามารถถ่ายใหม่ได้
 * - ส่งออก { file, previewUrl } ผ่าน onCapture
 */
export default function CameraCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedUrl, setCapturedUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let isActive = true;

    async function startCamera() {
      setError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!isActive) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error(e);
        setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์ หรือใช้โทรศัพท์มือถือ/แท็บเล็ต');
      }
    }

    startCamera();
    return () => {
      isActive = false;
      stopStream();
      // เคลียร์ preview
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      setCapturedUrl('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopStream() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob) return;

    const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const url = URL.createObjectURL(file);
    setCapturedUrl(url);
    // หยุดกล้องเพื่อประหยัดแบต/ทรัพยากร
    stopStream();
  }

  function retake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl('');
    // เปิดกล้องใหม่
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((e) => {
        console.error(e);
        setError('ไม่สามารถเปิดกล้องได้');
      });
  }

  async function confirmCapture() {
    // แปลง objectURL → File ใหม่ (เก็บไว้ใน state น้อยที่สุด)
    const res = await fetch(capturedUrl);
    const blob = await res.blob();
    const file = new File([blob], `evidence-${Date.now()}.jpg`, {
      type: blob.type || 'image/jpeg',
    });
    onCapture?.({ file, previewUrl: capturedUrl });
  }

  return (
    <GlassModal
      open={open}
      onClose={() => {
        stopStream();
        onClose?.();
      }}
      title="ถ่ายรูปเอกสาร"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            kind="white"
            onClick={() => {
              stopStream();
              onClose?.();
            }}
          >
            ยกเลิก
          </Button>
          {capturedUrl ? (
            <>
              <Button kind="editor" onClick={retake}>
                ถ่ายใหม่
              </Button>
              <Button kind="success" onClick={confirmCapture}>
                ใช้รูปนี้
              </Button>
            </>
          ) : (
            <Button kind="primary" onClick={takePhoto} disabled={!!error}>
              ถ่ายภาพ
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-3">
        {error ? <div className="text-red-600 text-sm">{error}</div> : null}

        {!capturedUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} playsInline className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border">
            <img
              src={capturedUrl}
              alt="preview"
              className="w-full max-h-[70vh] object-contain bg-slate-50"
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <p className="text-xs text-slate-500">
          เคล็ดลับ: วางเอกสารบนพื้นเรียบ แสงพอ ไม่นำเงาบังเอกสาร เพื่อให้ภาพคมชัด
        </p>
      </div>
    </GlassModal>
  );
}
