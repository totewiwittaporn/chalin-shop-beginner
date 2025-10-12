import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    if (!open) return;
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    (async () => {
      try {
        const inputs = await BrowserMultiFormatReader.listVideoInputDevices();
        setDevices(inputs);
        const backCam =
          inputs.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          inputs[0]?.deviceId;
        setDeviceId(backCam || "");
        if (backCam) {
          await start(backCam);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    async function start(id) {
      await codeReaderRef.current.decodeFromVideoDevice(id, videoRef.current, (res) => {
        if (res) {
          const text = res.getText();
          onDetected?.(text);
          onClose?.();
        }
      });
    }

    return () => {
      try {
        codeReaderRef.current?.reset();
      } catch {}
    };
  }, [open]);

  useEffect(() => {
    if (!open || !deviceId || !codeReaderRef.current) return;
    codeReaderRef.current.reset();
    codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (res) => {
      if (res) {
        const text = res.getText();
        onDetected?.(text);
        onClose?.();
      }
    });
  }, [deviceId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-[92vw] max-w-md rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">สแกนบาร์โค้ด</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-slate-100">
            ปิด
          </button>
        </div>

        <div className="mb-2">
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Camera"}
              </option>
            ))}
          </select>
        </div>

        <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
          <video ref={videoRef} className="h-64 w-full object-cover" playsInline muted autoPlay />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-28 w-64 rounded-2xl border-2 border-sky-400/80 shadow-[0_0_24px_rgba(56,189,248,0.6)]"></div>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          ต้องอนุญาตสิทธิ์กล้อง และใช้งานผ่าน HTTPS หรือ localhost
        </p>
      </div>
    </div>
  );
}
