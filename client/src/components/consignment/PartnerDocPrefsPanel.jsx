import { useEffect, useState } from "react";
import TemplatePicker from "@/components/docs/TemplatePicker";
import Button from "@/components/ui/Button";
import { getPartnerDocPrefs, updatePartnerDocPrefs } from "@/services/templates.service";

const KINDS = ["DELIVERY", "INVOICE", "RECEIPT"];

export default function PartnerDocPrefsPanel({ hqId, partnerId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState({
    DELIVERY: { headerTemplateId: null, tableTemplateId: null },
    INVOICE:  { headerTemplateId: null, tableTemplateId: null },
    RECEIPT:  { headerTemplateId: null, tableTemplateId: null },
  });

  useEffect(() => {
    if (!partnerId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getPartnerDocPrefs(partnerId).catch(() => ({ items: [] }));
        const map = {
          DELIVERY: { headerTemplateId: null, tableTemplateId: null },
          INVOICE:  { headerTemplateId: null, tableTemplateId: null },
          RECEIPT:  { headerTemplateId: null, tableTemplateId: null },
        };
        (res?.items || []).forEach((it) => {
          if (!KINDS.includes(it.docKind)) return;
          map[it.docKind] = {
            headerTemplateId: it.headerTemplateId ?? null,
            tableTemplateId: it.tableTemplateId ?? null,
          };
        });
        setPrefs(map);
      } catch {
        setError("โหลดการตั้งค่าไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [partnerId]);

  const onChangeKind = (kind) => (val) => setPrefs((prev) => ({ ...prev, [kind]: val }));

  const onSave = async () => {
    setSaving(true);
    try {
      const items = KINDS.map((k) => ({
        docKind: k,
        headerTemplateId: prefs[k].headerTemplateId ?? null,
        tableTemplateId: prefs[k].tableTemplateId ?? null,
      }));
      await updatePartnerDocPrefs(partnerId, items);
      alert("บันทึกตัวเลือกรูปแบบเอกสารของร้านฝากขายเรียบร้อย");
    } finally {
      setSaving(false);
    }
  };

  if (!partnerId) return <div className="text-slate-500">กรุณาเลือกร้านฝากขาย</div>;
  if (loading) return <div className="text-slate-500">กำลังโหลดการตั้งค่า…</div>;
  if (error) return <div className="text-rose-600">{error}</div>;

  return (
    <div className="space-y-4">
      {KINDS.map((k) => (
        <TemplatePicker
          key={k}
          hqId={hqId}
          docKind={k}
          value={prefs[k]}
          onChange={onChangeKind(k)}
          // onPreview={(sel) => ... (ถ้าต้องการปุ่มตัวอย่าง)
        />
      ))}
      <div className="flex justify-end">
        <Button kind="success" onClick={onSave} disabled={saving}>
          {saving ? "กำลังบันทึก…" : "บันทึกรูปแบบเอกสารของร้านนี้"}
        </Button>
      </div>
    </div>
  );
}
