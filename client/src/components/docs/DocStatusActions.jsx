import Button from "@/components/ui/Button";
import { Printer, Send, CheckCircle2 } from "lucide-react";

export default function DocStatusActions({ doc, onChanged }) {
  const id = doc?.id;
  const status = String(doc?.status || "DRAFT").toUpperCase();

  async function setStatus(next) {
    await fetch(`/api/docs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    onChanged?.();
  }

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button kind="white" size="sm" leftIcon={<Printer size={16} />} onClick={() => window.open(`/api/print/document/${id}/pdf`, "_blank")}>
        พิมพ์ A4
      </Button>
      {status === "DRAFT" && (
        <Button kind="success" size="sm" leftIcon={<Send size={16} />} onClick={() => setStatus("SENT")}>
          ส่งออก (SENT)
        </Button>
      )}
      {status === "SENT" && (
        <Button kind="success" size="sm" leftIcon={<CheckCircle2 size={16} />} onClick={() => setStatus("RECEIVED")}>
          รับเข้า (RECEIVED)
        </Button>
      )}
    </div>
  );
}
