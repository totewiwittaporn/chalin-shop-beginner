// client/src/components/docs/CreateDeliveryDocButton.jsx
import { useState } from "react";
import { Printer, FilePlus2 } from "lucide-react";

async function parseJSONSafe(res) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text(); // อ่านครั้งเดียว
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON: ${text.slice(0, 120)}...`);
    }
  }
  // ไม่ใช่ JSON → โยนรายละเอียด text ออกไป (เช่น HTML error)
  const msg = text?.slice(0, 200) || `HTTP ${res.status}`;
  throw new Error(msg);
}

export default function CreateDeliveryDocButton({
  deliveryId,
  kind = "branch", // "branch" | "consignment"
  className = "",
}) {
  const [loading, setLoading] = useState(false);

  async function ensureDocument() {
    setLoading(true);
    try {
      // 1) ตรวจว่ามีอยู่แล้ว?
      const chk = await fetch(`/api/docs/delivery/${deliveryId}`);
      if (!chk.ok) {
        const msg = await chk.text();
        throw new Error(`GET /api/docs/delivery/${deliveryId} → ${chk.status}\n${msg.slice(0,200)}`);
      }
      const c = await parseJSONSafe(chk);
      if (c?.documentId) return c.documentId;

      // 2) สร้างใหม่
      const crt = await fetch(`/api/docs/delivery/${kind}/${deliveryId}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!crt.ok) {
        const msg = await crt.text();
        throw new Error(`POST /api/docs/delivery/${kind}/${deliveryId}/create → ${crt.status}\n${msg.slice(0,200)}`);
      }
      const doc = await parseJSONSafe(crt);
      if (doc?.id) return doc.id;

      throw new Error("Unexpected response when creating document.");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateClick() {
    try {
      const id = await ensureDocument();
      if (!id) return;
      window.open(`/api/print/document/${id}/pdf`, "_blank");
    } catch (err) {
      console.error("[CreateDeliveryDocButton] error:", err);
      alert(`สร้างเอกสารไม่สำเร็จ:\n${err.message}`);
    }
  }

  return (
    <button
      type="button"
      onClick={onCreateClick}
      disabled={loading || !deliveryId}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow ${className} ${loading ? "opacity-60" : ""}`}
      title="สร้างเอกสารและพิมพ์ใบส่งสินค้า (A4)"
      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(99,102,241,0.9))", color: "white" }}
    >
      <FilePlus2 size={18} />
      <Printer size={18} />
      <span>{loading ? "กำลังสร้าง..." : "สร้างเอกสาร/พิมพ์ใบส่ง"}</span>
    </button>
  );
}
