import { useEffect, useMemo, useState } from "react";
import { getDocTemplates, getTableTemplates } from "@/services/templates.service";
import Button from "@/components/ui/Button";

const DOC_KINDS = [
  { value: "DELIVERY", label: "ใบส่งสินค้า" },
  { value: "INVOICE",  label: "ใบวางบิล" },
  { value: "RECEIPT",  label: "ใบเสร็จรับเงิน" },
];

export default function TemplatePicker({
  hqId,
  docKind, // "DELIVERY" | "INVOICE" | "RECEIPT"
  value = { headerTemplateId: null, tableTemplateId: null },
  onChange,
  onPreview, // optional
  className = "",
}) {
  const [docList, setDocList] = useState([]);
  const [tableList, setTableList] = useState([]);
  const [loading, setLoading] = useState(false);

  const toArray = (x) => (Array.isArray(x) ? x : []);

  const docOptions = useMemo(() => {
    const list = toArray(docList).filter((d) => !d.docKind || d.docKind === docKind);
    return [{ id: null, name: "— ใช้ค่าเริ่มต้น (HQ Default) —" }, ...list];
  }, [docList, docKind]);

  const tableOptions = useMemo(() => {
    const list = toArray(tableList).filter((t) => !t.docType || t.docType === docKind);
    return [{ id: null, name: "— ใช้ค่าเริ่มต้น (HQ Default) —" }, ...list];
  }, [tableList, docKind]);

  useEffect(() => {
    if (!hqId) return;
    (async () => {
      setLoading(true);
      try {
        const [docs, tables] = await Promise.all([
          getDocTemplates(hqId).catch(() => ({ items: [] })),
          getTableTemplates(hqId).catch(() => ({ items: [] })),
        ]);
        setDocList(Array.isArray(docs?.items) ? docs.items : toArray(docs));
        setTableList(Array.isArray(tables?.items) ? tables.items : toArray(tables));
      } finally {
        setLoading(false);
      }
    })();
  }, [hqId]);

  const handleChange = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    const id =
      val === "" || val === null || typeof val === "undefined"
        ? null
        : Number.isNaN(Number(val))
        ? null
        : Number(val);
    onChange?.({ ...value, [key]: id });
  };

  const kindLabel = DOC_KINDS.find((k) => k.value === docKind)?.label || docKind;

  return (
    <div className={`grid grid-cols-12 gap-3 items-end ${className}`}>
      <div className="col-span-12 md:col-span-3">
        <div className="text-slate-700 text-sm font-medium">{kindLabel}</div>
        <div className="text-xs text-slate-500">DocKind: {docKind}</div>
      </div>

      <label className="col-span-12 md:col-span-4">
        <div className="text-xs text-slate-500 mb-1">หัว/ท้ายเอกสาร (DocTemplate)</div>
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={value.headerTemplateId ?? ""}
          onChange={handleChange("headerTemplateId")}
          disabled={loading}
        >
          {docOptions.map((d) => (
            <option key={`doc-${d.id ?? "def"}`} value={d.id ?? ""}>
              {d.name}{d.isDefault ? "  (default)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="col-span-12 md:col-span-4">
        <div className="text-xs text-slate-500 mb-1">ตาราง/เนื้อหา (TableTemplate)</div>
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={value.tableTemplateId ?? ""}
          onChange={handleChange("tableTemplateId")}
          disabled={loading}
        >
          {tableOptions.map((t) => (
            <option key={`tbl-${t.id ?? "def"}`} value={t.id ?? ""}>
              {t.name}{t.isDefault ? "  (default)" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="col-span-12 md:col-span-1 flex justify-end">
        {onPreview && (
          <Button size="sm" kind="secondary" onClick={() => onPreview({ docKind, ...value })} disabled={loading}>
            Preview
          </Button>
        )}
      </div>
    </div>
  );
}
