import { useEffect, useMemo, useState } from "react";
import { getDocTemplates, getTableTemplates, updateDocTemplate, updateTableTemplate } from "@/services/templates.service";
import Button from "@/components/ui/Button";

const KINDS = ["DELIVERY", "INVOICE", "RECEIPT"];

export default function HQTemplatesDefaultsPanel({ hqId }) {
  const [docs, setDocs] = useState([]);
  const [tables, setTables] = useState([]);
  const [saving, setSaving] = useState(false);

  const byKindDoc = useMemo(() => {
    const out = {};
    KINDS.forEach(k => out[k] = (docs || []).filter(d => !d.docKind || d.docKind === k));
    return out;
  }, [docs]);

  const byKindTable = useMemo(() => {
    const out = {};
    KINDS.forEach(k => out[k] = (tables || []).filter(t => !t.docType || t.docType === k));
    return out;
  }, [tables]);

  useEffect(() => {
    if (!hqId) return;
    (async () => {
      const [d1, t1] = await Promise.all([
        getDocTemplates(hqId),
        getTableTemplates(hqId),
      ]);
      setDocs(Array.isArray(d1?.items) ? d1.items : d1);
      setTables(Array.isArray(t1?.items) ? t1.items : t1);
    })();
  }, [hqId]);

  const markDefault = async (type, id, docKind) => {
    setSaving(true);
    try {
      if (type === "doc") {
        await updateDocTemplate(hqId, id, { isDefault: true, docKind });
      } else {
        await updateTableTemplate(hqId, id, { isDefault: true, docType: docKind });
      }
      // reload
      const [d1, t1] = await Promise.all([
        getDocTemplates(hqId),
        getTableTemplates(hqId),
      ]);
      setDocs(Array.isArray(d1?.items) ? d1.items : d1);
      setTables(Array.isArray(t1?.items) ? t1.items : t1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {KINDS.map(kind => (
        <div key={kind} className="rounded-2xl border border-slate-200 p-4 bg-white/70">
          <div className="font-semibold text-slate-700 mb-2">
            ตั้งค่า default สำหรับ: {kind}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DOC TEMPLATES */}
            <div>
              <div className="text-sm text-slate-500 mb-1">หัว/ท้ายเอกสาร</div>
              <div className="space-y-2">
                {byKindDoc[kind].map(d => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-slate-500">id: {d.id}{d.isDefault ? " · default" : ""}</div>
                    </div>
                    {!d.isDefault && (
                      <Button size="sm" kind="secondary" disabled={saving} onClick={() => markDefault("doc", d.id, d.docKind || kind)}>
                        ตั้งเป็น default
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TABLE TEMPLATES */}
            <div>
              <div className="text-sm text-slate-500 mb-1">ตาราง/เนื้อหา</div>
              <div className="space-y-2">
                {byKindTable[kind].map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-slate-500">id: {t.id}{t.isDefault ? " · default" : ""}</div>
                    </div>
                    {!t.isDefault && (
                      <Button size="sm" kind="secondary" disabled={saving} onClick={() => markDefault("table", t.id, t.docType || kind)}>
                        ตั้งเป็น default
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
