import { useEffect, useMemo, useState } from "react";
import GradientPanel from "@/components/theme/GradientPanel.jsx";
import Button from "@/components/ui/Button.jsx";
import api from "@/lib/api";

/** Utilities */
const DOC_TYPES = [
  { value: "DELIVERY", label: "ใบส่งสินค้า (DELIVERY)" },
  { value: "INVOICE", label: "ใบวางบิล/ใบแจ้งหนี้ (INVOICE)" },
  { value: "RECEIPT", label: "ใบเสร็จ (RECEIPT)" },
  { value: "CONSALE", label: "ขายฝากขาย (CONSALE)" },
];
const pick = (res) => res?.data?.data ?? res?.data ?? [];
const parseJSON = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

/** ColumnBuilder: ช่วยสร้าง columns JSON แบบไม่ต้องพิมพ์ทั้งหมดเอง */
function ColumnBuilder({ value, onChange }) {
  const [cols, setCols] = useState(() => Array.isArray(value?.columns) ? value.columns : [
    { key: "sku", label: "รหัส", width: 80, align: "left" },
    { key: "name", label: "สินค้า", flex: 1, wrap: true },
    { key: "qty", label: "จำนวน", width: 70, align: "right", format: "number", sum: true },
  ]);
  const [showIndex, setShowIndex] = useState(!!value?.showIndex);
  const [footerSum, setFooterSum] = useState(() => value?.footer?.sumKeys ?? ["qty"]);

  useEffect(() => {
    onChange?.({ showIndex, columns: cols, footer: { showSum: footerSum?.length > 0, sumKeys: footerSum } });
  }, [cols, showIndex, footerSum]); // eslint-disable-line

  function addCol() {
    setCols((prev) => [...prev, { key: "", label: "", width: 80, align: "left" }]);
  }
  function update(index, patch) {
    setCols((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }
  function remove(index) {
    setCols((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="scale-110" checked={showIndex} onChange={(e) => setShowIndex(e.target.checked)} />
        แสดงลำดับแถว (showIndex)
      </label>

      <div className="rounded-2xl border p-3 bg-white/80">
        <div className="text-sm font-medium mb-2">คอลัมน์</div>
        <div className="space-y-2">
          {cols.map((c, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <input className="md:col-span-2 border rounded-xl px-3 py-2" placeholder="key เช่น sku"
                value={c.key} onChange={(e)=>update(idx,{ key:e.target.value })}/>
              <input className="md:col-span-3 border rounded-xl px-3 py-2" placeholder="label เช่น รหัส"
                value={c.label} onChange={(e)=>update(idx,{ label:e.target.value })}/>
              <input className="md:col-span-2 border rounded-xl px-3 py-2" placeholder="width เช่น 80"
                value={c.width ?? ""} onChange={(e)=>update(idx,{ width:e.target.value===""?undefined:Number(e.target.value) })}/>
              <select className="md:col-span-2 border rounded-xl px-3 py-2"
                value={c.align ?? "left"} onChange={(e)=>update(idx,{ align:e.target.value })}>
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
              <label className="md:col-span-1 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="scale-110" checked={!!c.wrap} onChange={(e)=>update(idx,{ wrap:e.target.checked })}/>
                wrap
              </label>
              <select className="md:col-span-2 border rounded-xl px-3 py-2"
                value={c.format ?? ""} onChange={(e)=>update(idx,{ format:e.target.value || undefined })}>
                <option value="">format</option>
                <option value="number">number</option>
                <option value="currency">currency</option>
              </select>
              <label className="md:col-span-1 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="scale-110" checked={!!c.sum} onChange={(e)=>update(idx,{ sum:e.target.checked })}/>
                sum
              </label>
              <Button className="md:col-span-1 bg-red-500 hover:bg-red-600 text-white" onClick={()=>remove(idx)}>ลบ</Button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between">
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={addCol}>เพิ่มคอลัมน์</Button>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-1">รวมผลท้ายตาราง (sumKeys)</div>
        <input className="w-full border rounded-xl px-3 py-2" placeholder="เช่น qty,amount"
          value={footerSum.join(",")} onChange={(e)=>setFooterSum(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}/>
        <div className="text-xs text-slate-500 mt-1">แยกด้วยคอมมา (รองรับ key ที่มี sum=true)</div>
      </div>
    </div>
  );
}

/** PreviewTable: แสดงผล preview จาก columns JSON */
function PreviewTable({ spec }) {
  const columns = spec?.columns ?? [];
  return (
    <div className="rounded-2xl border overflow-auto bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-100">
            {spec?.showIndex && <th className="px-2 py-2 text-left w-10">#</th>}
            {columns.map((c, i) => (
              <th key={i} className="px-2 py-2 text-left" style={{ width: c.width }}>{c.label || c.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[{sku:"SKU-001", name:"ตัวอย่างสินค้า", qty:5, price:25, amount:125}].map((row, rIdx)=>(
            <tr key={rIdx} className="odd:bg-white even:bg-slate-50">
              {spec?.showIndex && <td className="px-2 py-2">{rIdx+1}</td>}
              {columns.map((c, i)=>{
                let v = row[c.key];
                if (c.format === "currency" && typeof v === "number") v = v.toLocaleString(undefined,{minimumFractionDigits:2});
                if (c.format === "number" && typeof v === "number") v = v.toLocaleString();
                return <td key={i} className="px-2 py-2 align-top">{v ?? "-"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Dialog แบบง่าย (ใช้โทน Glass Blue) */
function Modal({ title, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}/>
      <div className="absolute inset-0 p-4 flex items-center justify-center">
        <div className="w-[95vw] max-w-3xl rounded-3xl p-[2px]" style={{ background: "linear-gradient(135deg,#7aa6ff,#b8c7ff)" }}>
          <div className="rounded-3xl bg-[#f6f9ff]">
            <div className="flex items-center justify-between p-5">
              <div className="text-lg font-semibold text-slate-700">{title}</div>
              <button onClick={onClose} className="rounded-full px-2 py-1 hover:bg-slate-200">✕</button>
            </div>
            <div className="px-5 pb-3">{children}</div>
            <div className="px-5 pb-5 flex justify-end gap-2">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TableTemplatesTab() {
  const [docType, setDocType] = useState("DELIVERY");
  const [hq, setHq] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  // form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [columnsJSON, setColumnsJSON] = useState("");
  const [columnsSpec, setColumnsSpec] = useState({ showIndex: true, columns: [] });

  // Load HQ + list
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const act = await api.get("/api/headquarters/active");
        setHq(act?.data ?? null);
      } catch {
        setHq(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hq?.id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/headquarters/${hq.id}/table-templates`, { params: { docType } });
        const arr = pick(res);
        setRows(Array.isArray(arr) ? arr : []);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [hq?.id, docType]);

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => (r.name||"").toLowerCase().includes(s));
  }, [rows, q]);

  function openCreate() {
    setEditing(null);
    setName("");
    setIsDefault(false);
    const spec = { showIndex: true, columns: [
      { key: "sku", label: "รหัส", width: 80, align: "left" },
      { key: "name", label: "สินค้า", flex: 1, wrap: true },
      { key: "qty", label: "จำนวน", width: 70, align: "right", format: "number", sum: true },
    ], footer: { showSum: true, sumKeys: ["qty"] } };
    setColumnsSpec(spec);
    setColumnsJSON(JSON.stringify(spec, null, 2));
    setJsonMode(false);
    setModalOpen(true);
  }
  function openEdit(row) {
    setEditing(row);
    setName(row.name || "");
    setIsDefault(!!row.isDefault);
    const spec = typeof row.columns === "object" ? row.columns : parseJSON(row.columns, { showIndex: true, columns: [] });
    setColumnsSpec(spec);
    setColumnsJSON(JSON.stringify(spec, null, 2));
    setJsonMode(false);
    setModalOpen(true);
  }

  async function saveTemplate() {
    if (!hq?.id) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        docType,
        isDefault: !!isDefault,
        columns: jsonMode ? parseJSON(columnsJSON, columnsSpec) : columnsSpec,
      };
      if (!body.name) throw new Error("กรุณากรอกชื่อเทมเพลต");

      if (editing) {
        const res = await api.put(`/api/headquarters/${hq.id}/table-templates/${editing.id}`, body);
        const updated = res?.data ?? body;
        setRows(prev => prev.map(x => x.id === editing.id ? updated : x));
      } else {
        const res = await api.post(`/api/headquarters/${hq.id}/table-templates`, body);
        const created = res?.data ?? body;
        setRows(prev => [created, ...prev]);
      }

      // ถ้า tick isDefault ให้รีเฟรชรายการเพื่อสะท้อน default ใหม่
      if (body.isDefault) {
        const res = await api.get(`/api/headquarters/${hq.id}/table-templates`, { params: { docType } });
        const arr = pick(res);
        setRows(Array.isArray(arr) ? arr : []);
      }

      setModalOpen(false);
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(row) {
    if (!hq?.id) return;
    setSaving(true);
    try {
      await api.patch(`/api/headquarters/${hq.id}/table-templates/${row.id}/default`);
      // reload
      const res = await api.get(`/api/headquarters/${hq.id}/table-templates`, { params: { docType } });
      const arr = pick(res);
      setRows(Array.isArray(arr) ? arr : []);
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "ตั้งค่า default ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!hq?.id) return;
    if (!confirm(`ลบเทมเพลต "${row.name}" ?`)) return;
    setSaving(true);
    try {
      await api.delete(`/api/headquarters/${hq.id}/table-templates/${row.id}`);
      setRows(prev => prev.filter(x => x.id !== row.id));
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <GradientPanel
        title="ตั้งค่าเทมเพลตตารางเอกสาร"
        subtitle="กำหนดโครงคอลัมน์สำหรับใบส่งสินค้า/ใบวางบิล ฯลฯ (เลือกชนิดเอกสารด้านล่าง)"
        innerClassName="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">ชนิดเอกสาร (DocType)</label>
            <select className="w-full border rounded-2xl px-3 py-2" value={docType} onChange={(e)=>setDocType(e.target.value)} disabled={loading || saving}>
              {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">ค้นหา</label>
            <input className="w-full border rounded-2xl px-3 py-2" placeholder="พิมพ์ชื่อเทมเพลต..." value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate} disabled={!hq?.id || saving}>เพิ่มเทมเพลต</Button>
        </div>

        <div className="rounded-2xl border bg-white/95 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">ชื่อเทมเพลต</th>
                <th className="px-3 py-2 text-left">default?</th>
                <th className="px-3 py-2 text-left">ตัวอย่างคอลัมน์</th>
                <th className="px-3 py-2 text-right w-[220px]">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="px-3 py-3" colSpan={4}>กำลังโหลด...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td className="px-3 py-3" colSpan={4}>ไม่พบข้อมูล</td></tr>}
              {!loading && filtered.map(row=>{
                const spec = typeof row.columns === "object" ? row.columns : parseJSON(row.columns, {});
                const head = (spec?.columns ?? []).slice(0,3).map(c => c.label || c.key).join(" | ");
                return (
                  <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.isDefault ? "Yes" : "-"}</td>
                    <td className="px-3 py-2">{head || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={()=>openEdit(row)}>แก้ไข</Button>
                        <Button className="bg-slate-600 hover:bg-slate-700 text-white" onClick={()=>setDefault(row)} disabled={row.isDefault}>ตั้ง default</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={()=>remove(row)}>ลบ</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GradientPanel>

      {/* Modal: สร้าง/แก้ไข */}
      {modalOpen && (
        <Modal
          title={editing ? "แก้ไขเทมเพลตตาราง" : "เพิ่มเทมเพลตตาราง"}
          onClose={()=>setModalOpen(false)}
          actions={
            <>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={()=>setModalOpen(false)} disabled={saving}>ยกเลิก</Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={saveTemplate} disabled={saving}>{saving?"กำลังบันทึก...":"บันทึก"}</Button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-slate-600">ชื่อเทมเพลต</label>
              <input className="w-full border rounded-xl px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="เช่น DELIVERY — ไม่แสดงราคา"/>
              <label className="inline-flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" className="scale-110" checked={isDefault} onChange={(e)=>setIsDefault(e.target.checked)}/>
                ตั้งเป็นค่าเริ่มต้นของ HQ สำหรับชนิดเอกสารนี้
              </label>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">โครงคอลัมน์</div>
                  <button className="text-xs underline" onClick={()=>setJsonMode(v=>!v)}>
                    {jsonMode ? "ใช้ตัวช่วย (Builder)" : "แก้เป็น JSON"}
                  </button>
                </div>

                {!jsonMode ? (
                  <ColumnBuilder value={columnsSpec} onChange={setColumnsSpec} />
                ) : (
                  <textarea className="w-full min-h-[280px] border rounded-xl px-3 py-2 font-mono text-xs"
                    value={columnsJSON} onChange={(e)=>setColumnsJSON(e.target.value)} />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">ตัวอย่างแสดงผล (Preview)</div>
              <PreviewTable spec={jsonMode ? parseJSON(columnsJSON, columnsSpec) : columnsSpec} />
              <div className="text-xs text-slate-500">
                * ตัวอย่างใช้ข้อมูลจำลอง 1 แถว (SKU-001) เพื่อดูการจัดวางและรูปแบบตัวเลข/สกุลเงิน
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
