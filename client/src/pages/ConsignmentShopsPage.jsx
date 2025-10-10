// client/src/pages/ConsignmentShopsPage.jsx
import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useDataStore } from '../store/dataStore.js';
import { Plus, Search } from 'lucide-react';

function AddShopDialog({ onClose, onSave, deliveryTemplates, invoiceTemplates, receiptTemplates }) {
  const [form, setForm] = useState({
    nameInternal: '',
    commissionPct: '',
    companyTh: '',
    companyEn: '',
    addressTh: '',
    addressEn: '',
    phone: '',
    taxId: '',
    deliveryTemplateId: deliveryTemplates[0]?.id || null,
    invoiceTemplateId: invoiceTemplates[0]?.id || null,
    receiptTemplateId: receiptTemplates[0]?.id || null,
  });

  const canSave = form.nameInternal.trim() && form.commissionPct !== '' && form.taxId.trim();
  const handle = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = () => {
    if (!canSave) return;
    onSave({
      nameInternal: form.nameInternal.trim(),
      commissionPct: Number(form.commissionPct) || 0,
      companyTh: form.companyTh.trim(),
      companyEn: form.companyEn.trim(),
      addressTh: form.addressTh.trim(),
      addressEn: form.addressEn.trim(),
      phone: form.phone.trim(),
      taxId: form.taxId.trim(),
      deliveryTemplateId: Number(form.deliveryTemplateId)||null,
      invoiceTemplateId: Number(form.invoiceTemplateId)||null,
      receiptTemplateId: Number(form.receiptTemplateId)||null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 card p-5 w-[96vw] max-w-3xl">
        <div className="h-title mb-3">เพิ่มร้านฝากขาย</div>
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted">ชื่อร้าน (ภายใน)</label>
              <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.nameInternal} onChange={handle('nameInternal')} placeholder="เช่น LITTLE, RO" />
            </div>
            <div>
              <label className="text-sm text-muted">ค่าคอมมิชชั่น (%)</label>
              <input type="number" min="0" step="0.1" className="glass rounded-2xl px-4 py-2 outline-none w-full text-right"
                value={form.commissionPct} onChange={handle('commissionPct')} placeholder="เช่น 30" />
            </div>
            <div>
              <label className="text-sm text-muted">ชื่อบริษัท (ภาษาไทย)</label>
              <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.companyTh} onChange={handle('companyTh')} />
            </div>
            <div>
              <label className="text-sm text-muted">ชื่อบริษัท (ภาษาอังกฤษ)</label>
              <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.companyEn} onChange={handle('companyEn')} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted">ที่อยู่ (ภาษาไทย)</label>
              <textarea className="glass rounded-2xl px-4 py-2 outline-none w-full min-h-[70px]" value={form.addressTh} onChange={handle('addressTh')} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted">ที่อยู่ (ภาษาอังกฤษ)</label>
              <textarea className="glass rounded-2xl px-4 py-2 outline-none w-full min-h-[70px]" value={form.addressEn} onChange={handle('addressEn')} />
            </div>
            <div>
              <label className="text-sm text-muted">เบอร์โทรติดต่อ</label>
              <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.phone} onChange={handle('phone')} />
            </div>
            <div>
              <label className="text-sm text-muted">เลขประจำตัวผู้เสียภาษี</label>
              <input className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.taxId} onChange={handle('taxId')} placeholder="0-0000-00000-00-0"/>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="font-semibold mb-3">Template เอกสาร</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted">Delivery Template</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.deliveryTemplateId} onChange={handle('deliveryTemplateId')}>
                  {deliveryTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted">Invoice Template</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.invoiceTemplateId} onChange={handle('invoiceTemplateId')}>
                  {invoiceTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted">Receipt Template</label>
                <select className="glass rounded-2xl px-4 py-2 outline-none w-full" value={form.receiptTemplateId} onChange={handle('receiptTemplateId')}>
                  {receiptTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={submit}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

export default function ConsignmentShopsPage() {
  const {
    consignmentShops = [],
    addConsignmentShop, // must exist in store
    templates = { delivery:[], invoice:[], receipt:[] },
  } = useDataStore();

  const [q, setQ] = useState('');
  const [openAdd, setOpenAdd] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return consignmentShops;
    return consignmentShops.filter(x =>
      (x.nameInternal || '').toLowerCase().includes(s) ||
      (x.companyTh || '').toLowerCase().includes(s) ||
      (x.companyEn || '').toLowerCase().includes(s) ||
      (x.taxId || '').toLowerCase().includes(s)
    );
  }, [q, consignmentShops]);

  const columns = [
    { key: 'nameInternal', header: 'ชื่อร้าน (ภายใน)' },
    { key: 'commissionPct', header: 'ค่าคอม (%)' },
    { key: 'companyTh', header: 'ชื่อบริษัท (TH)' },
    { key: 'taxId', header: 'เลขผู้เสียภาษี' },
  ];

  const onSaveShop = (payload) => {
    if (typeof addConsignmentShop === 'function') {
      // Save basic info
      addConsignmentShop(payload);
    } else {
      alert('ยังไม่ได้ติดตั้งเมธอด addConsignmentShop() ใน store');
    }
    setOpenAdd(false);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <input className="glass rounded-2xl px-4 py-2 outline-none w-full"
              placeholder="ค้นหา ชื่อร้าน/บริษัท/เลขผู้เสียภาษี…"
              value={q} onChange={(e)=> setQ(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={()=> setOpenAdd(true)}>
            <Plus className="mr-2" size={16} /> เพิ่มร้านฝากขาย
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={filtered} />
      </Card>

      {openAdd && (
        <AddShopDialog
          onClose={()=> setOpenAdd(false)}
          onSave={onSaveShop}
          deliveryTemplates={templates.delivery||[]}
          invoiceTemplates={templates.invoice||[]}
          receiptTemplates={templates.receipt||[]}
        />
      )}
    </div>
  );
}
