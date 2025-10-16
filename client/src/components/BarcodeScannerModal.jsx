// client/src/components/BarcodeScannerModal.jsx
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function BarcodeScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    let active = true;
    async function start() {
      if (!open) return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) return;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch {
        // ถ้าไม่อนุญาตกล้องก็ใช้โหมด manual ได้
      }
    }
    start();
    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setStream(null);
    };
  }, [open]); // eslint-disable-line

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl p-4 bg-white rounded-2xl">
        <div className="text-lg font-semibold mb-3">สแกนบาร์โค้ด / กรอกด้วยมือ</div>

        <div className="grid gap-3">
          <div className="aspect-video bg-black/80 rounded-xl overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          </div>

          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2 outline-none"
              placeholder="พิมพ์/วางรหัสบาร์โค้ด"
              value={manual}
              onChange={(e)=> setManual(e.target.value)}
              onKeyDown={(e)=> e.key === "Enter" && manual && onDetected?.(manual)}
            />
            <Button kind="success" onClick={()=> manual && onDetected?.(manual)}>ตกลง</Button>
            <Button kind="danger" onClick={onClose}>ยกเลิก</Button>
          </div>

          <div className="text-xs text-slate-500">
            * หากไม่อนุญาตกล้อง สามารถกรอกบาร์โค้ดด้วยมือแล้วกด “ตกลง”
          </div>
        </div>
      </Card>
    </div>
  );
}
