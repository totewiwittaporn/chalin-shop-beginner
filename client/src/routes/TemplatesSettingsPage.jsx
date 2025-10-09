// client/src/routes/TemplatesSettingsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

/** Small helpers */
function KindTabs({ kind, setKind }) {
  const tabs = [
    { key: 'delivery', label: 'Template Delivery' },
    { key: 'invoice',  label: 'Template Invoice' },
    { key: 'receipt',  label: 'Template Receipt' },
  ];
  return (
    <div className="flex gap-2">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`btn ${kind===t.key ? 'btn-primary' : 'btn-outline'}`}
          onClick={()=> setKind(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const HEAD_CHOICES = [
  { value: 'CHALIN_CLOTHES', label: 'Chalin Clothes' },
  { value: 'SUKANYA_WIWITPHORN', label: 'นาง สุกัญญา วิวิธพร' },
];
const DELIVERY_BODY_CHOICES = [
  { value: 'F1_ITEMS', label: 'F1: รายการต่อสินค้า' },
  { value: 'F2_GROUP_BY_CATEGORY', label: 'F2: รวมตามหมวด (แนะนำ)' },
];
const INVOICE_BODY_CHOICES = [
  { value: 'B1_MONTHLY_DESC', label: 'B1: แถวสรุป (ค่าขายสินค้า (เดือน/ปี))' },
  { value: 'B2_CONSIGNMENT_MONTH', label: 'B2: แถวสรุป (Consignment / (เดือน))' },
  { value: 'B3_GROUP_BY_CATEGORY', label: 'B3: รวมตามหมวด (แนะนำ)' },
];
const RECEIPT_BODY_CHOICES = [
  { value: 'ITEMS_SUMMARY', label: 'สรุปรายการอย่างย่อ' },
];
const FOOTER_CHOICES = [
  { value: 'CHALISA', label: 'ลงชื่อผู้ส่ง: Chalisa / ผู้รับ: วันนี้' },
  { value: 'SUKANYA', label: 'ลงชื่อผู้ส่ง: สุกัญญา / ผู้รับ: วันนี้' },
];

function EditTemplateDialog({ kind, initial, onClose, onSave }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState(() => initial || {
    name: '',
    head: { type: 'CHALIN_CLOTHES', showTaxId: true, logo: null },
    body: kind === 'delivery'
      ? { type: 'F2_GROUP_BY_CATEGORY', columns: ['no','code','name','qty','unitPrice','amount'] }
      : kind === 'invoice'
        ? { type: 'B3_GROUP_BY_CATEGORY', columns: ['no','code','desc','qty','unitPrice','amount'] }
        : { type: 'ITEMS_SUMMARY', columns: ['desc','amount'] },
    footer: { type: 'CHALISA', showReceiverToday: true, notes: '' },
    options: { paper: kind==='receipt' ? 'A5' : 'A4', currency: 'THB' },
  });

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const onHeadField = (k) => (e) => onChange('head', { ...form.head, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const onFooterField = (k) => (e) => onChange('footer', { ...form.footer, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const onBodyType = (e) => onChange('body', { ...form.body, type: e.target.value });

  const bodyChoices = kind==='delivery' ? DELIVERY_BODY_CHOICES : kind==='invoice' ? INVOICE_BODY_CHOICES : RECEIPT_BODY_CHOICES;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 card p-5 w-[96vw] max-w-3xl">
        <div className="h-title mb-3">{isNew ? 'เพิ่ม Template' : 'แก้ไข Template'}</div>

        <div className="grid gap-6">
          <div>
            <label className="text-sm text-muted">ชื่อ Template</label>
            <input className="glass rounded-2xl px-4 py-2 outline-none w-full"
              value={form.name} onChange={(e)=> onChange('name', e.target.value)} placeholder="เช่น Delivery – F2/Chalisa (default)"/>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="font-semibold mb-3">ส่วนหัว (Head)</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted">ผู้ส่ง</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.head?.type||'CHALIN_CLOTHES'} onChange={onHeadField('type')}>
                  {HEAD_CHOICES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!form.head?.showTaxId} onChange={onHeadField('showTaxId')} />
                แสดง Tax ID ในส่วนหัว
              </label>
              <div>
                <label className="text-sm text-muted">โลโก้ (URL)</label>
                <input className="glass rounded-2xl px-4 py-2 outline-none w-full"
                  value={form.head?.logo||''} onChange={onHeadField('logo')} placeholder="https://..."/>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="font-semibold mb-3">ส่วนเนื้อหา (Body)</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted">รูปแบบ</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.body?.type||''} onChange={onBodyType}>
                  {bodyChoices.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-muted">คอลัมน์ (คั่นด้วย comma)</label>
                <input className="glass rounded-2xl px-4 py-2 outline-none w-full"
                  value={(form.body?.columns||[]).join(',')}
                  onChange={(e)=> onChange('body', { ...form.body, columns: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                  placeholder="เช่น no,code,name,qty,unitPrice,amount"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="font-semibold mb-3">ส่วนท้าย (Footer)</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted">ผู้ลงชื่อ</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.footer?.type||'CHALISA'} onChange={onFooterField('type')}>
                  {FOOTER_CHOICES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!form.footer?.showReceiverToday} onChange={onFooterField('showReceiverToday')} />
                แสดงช่อง "ผู้รับสินค้า: วันนี้"
              </label>
              <div className="md:col-span-3">
                <label className="text-sm text-muted">หมายเหตุ</label>
                <input className="glass rounded-2xl px-4 py-2 outline-none w-full"
                  value={form.footer?.notes||''} onChange={onFooterField('notes')} placeholder="ข้อความท้ายใบ..." />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="font-semibold mb-3">ตัวเลือก (Options)</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted">ขนาดกระดาษ</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full"
                  value={form.options?.paper||'A4'}
                  onChange={e=> onChange('options', { ...form.options, paper: e.target.value })}>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted">สกุลเงิน</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full"
                  value={form.options?.currency||'THB'}
                  onChange={e=> onChange('options', { ...form.options, currency: e.target.value })}>
                  <option value="THB">THB</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={()=> onSave(form)}>{isNew ? 'เพิ่ม Template' : 'บันทึก'}</button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesSettingsPage() {
  const {
    templates = { delivery:[], invoice:[], receipt:[] },
    initDefaultTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    consignmentDocRefs = [],
    consignmentShops = [],
  } = useDataStore();

  const [kind, setKind] = useState('delivery');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); // {id?...} | null

  useEffect(()=> {
    if (!templates?.delivery?.length && typeof initDefaultTemplates === 'function') {
      initDefaultTemplates();
    }
  }, [templates, initDefaultTemplates]);

  const list = templates?.[kind] || [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(t => (t.name||'').toLowerCase().includes(s));
  }, [q, list]);

  const usageCount = (tplId) => consignmentDocRefs.filter(r =>
    (kind==='delivery' && r.deliveryTemplateId===tplId) ||
    (kind==='invoice'  && r.invoiceTemplateId===tplId)  ||
    (kind==='receipt'  && r.receiptTemplateId===tplId)
  ).length;

  const columns = [
    { key: 'name', header: 'ชื่อ Template' },
    { key: 'head', header: 'Head', render: (_, r) => r.head?.type },
    { key: 'body', header: 'Body', render: (_, r) => r.body?.type },
    { key: 'footer', header: 'Footer', render: (_, r) => r.footer?.type },
    { key: 'used', header: 'ใช้โดยร้าน (นับ)', render: (_, r) => usageCount(r.id) },
    { key: 'tools', header: 'เครื่องมือ', render: (_, r) => (
      <div className="flex gap-2">
        <button className="btn btn-outline px-2 py-1" onClick={()=> setEdit(r)}><Pencil size={16}/></button>
        <button className="btn btn-outline px-2 py-1" onClick={()=> alert('Preview (จะเชื่อมกับ doc preview/paper print)')}><Eye size={16}/></button>
        <button className="btn btn-outline px-2 py-1" onClick={()=> {
          if (!confirm('ลบ Template นี้?')) return;
          deleteTemplate(kind, r.id);
        }}><Trash2 size={16}/></button>
      </div>
    ) }
  ];

  const onSave = (data) => {
    if (edit?.id) updateTemplate(kind, edit.id, data);
    else createTemplate(kind, data);
    setEdit(null);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <KindTabs kind={kind} setKind={setKind} />
          <div className="flex items-center gap-3">
            <input className="glass rounded-2xl px-4 py-2 outline-none" placeholder="ค้นหา template…"
              value={q} onChange={(e)=> setQ(e.target.value)} />
            <button className="btn btn-primary" onClick={()=> setEdit({})}>
              <Plus className="mr-2" size={16}/> เพิ่ม Template
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={filtered.map(x => ({ ...x, used: '' }))} />
      </Card>

      {edit && (
        <EditTemplateDialog kind={kind} initial={edit?.id ? edit : null} onClose={()=> setEdit(null)} onSave={onSave} />
      )}
    </div>
  );
}
