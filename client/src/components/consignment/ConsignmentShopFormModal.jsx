import { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal.jsx";
import Button from "@/components/ui/Button.jsx";

export default function ConsignmentShopFormModal({
  open,
  mode = "create", // "create" | "edit"
  initial = null,
  onClose,
  onSubmit,
  busy = false,
}) {
  const isEdit = mode === "edit";
  const formId = "consignment-partner-form";

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [statusSelect, setStatusSelect] = useState("ACTIVE");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [amountInWordsLang, setAmountInWordsLang] = useState("TH");
  const [lineMode, setLineMode] = useState("ITEM");
  const [partnerLogoUrl, setPartnerLogoUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial && isEdit) {
      setCode(initial.code ?? "");
      setName(initial.name ?? "");
      setStatusSelect(initial.isActive ? "ACTIVE" : "INACTIVE");
      setPhone(initial.phone ?? "");
      setTaxId(initial.taxId ?? "");
      setCommissionRate(initial.commissionRate == null ? "" : String(initial.commissionRate));
      setAddressLine1(initial.addressLine1 ?? "");
      setAddressLine2(initial.addressLine2 ?? "");
      setAddressLine3(initial.addressLine3 ?? "");
      setAmountInWordsLang(initial.amountInWordsLang ?? "TH");
      setLineMode(initial.lineMode ?? "ITEM");
      setPartnerLogoUrl(initial.partnerLogoUrl ?? "");
    } else {
      setCode(""); setName(""); setStatusSelect("ACTIVE");
      setPhone(""); setTaxId(""); setCommissionRate("");
      setAddressLine1(""); setAddressLine2(""); setAddressLine3("");
      setAmountInWordsLang("TH"); setLineMode("ITEM"); setPartnerLogoUrl("");
    }
  }, [open, isEdit, initial]);

  const canSave = useMemo(() => code.trim() && name.trim(), [code, name]);

  function handleSubmit(e) {
    e?.preventDefault();
    if (!canSave || busy) return;

    const cr = commissionRate.trim() === "" ? null : Number(commissionRate);
    if (cr !== null && Number.isNaN(cr)) {
      alert("ค่าคอมมิชันต้องเป็นตัวเลข หรือเว้นว่าง");
      return;
    }

    const payload = {
      code: code.trim(),
      name: name.trim(),
      phone: phone.trim() || null,
      taxId: taxId.trim() || null,
      commissionRate: cr,
      isActive: statusSelect === "ACTIVE",
      status: statusSelect,
      addressLine1: addressLine1.trim() || null,
      addressLine2: addressLine2.trim() || null,
      addressLine3: addressLine3.trim() || null,
      amountInWordsLang: amountInWordsLang || null,
      lineMode: lineMode || null,
      partnerLogoUrl: partnerLogoUrl.trim() || null,
    };

    onSubmit?.(payload);
  }

  const triggerSubmit = () => {
    const f = document.getElementById(formId);
    if (f) f.requestSubmit();
  };

  return (
    <GlassModal
      open={open}
      title={isEdit ? "แก้ไขร้านฝากขาย" : "เพิ่มร้านฝากขาย"}
      onClose={busy ? undefined : onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button kind="danger" type="button" onClick={onClose} disabled={busy}>
            ยกเลิก
          </Button>
          <Button
            kind="success"
            type="button"
            onClick={triggerSubmit}
            disabled={!canSave || busy}
            loading={busy}
          >
            บันทึก
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">รหัส (code)</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="เช่น RO, LITTLE"
              maxLength={30}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">ชื่อร้าน (name)</label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น LITTLE SHOP"
              maxLength={120}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">เบอร์โทร (phone)</label>
            <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">เลขผู้เสียภาษี (taxId)</label>
            <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={taxId} onChange={(e) => setTaxId(e.target.value)} maxLength={20} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">ค่าคอมมิชัน (%)</label>
            <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="เช่น 10 หรือเว้นว่าง" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">สถานะ</label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={statusSelect} onChange={(e) => setStatusSelect(e.target.value)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">ที่อยู่บรรทัดที่ 1</label>
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">ที่อยู่บรรทัดที่ 2</label>
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">ที่อยู่บรรทัดที่ 3</label>
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={addressLine3} onChange={(e) => setAddressLine3(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">ภาษาเขียนจำนวนเงิน</label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={amountInWordsLang} onChange={(e) => setAmountInWordsLang(e.target.value)}>
              <option value="TH">TH</option>
              <option value="EN">EN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">โหมดสรุปบรรทัด</label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={lineMode} onChange={(e) => setLineMode(e.target.value)}>
              <option value="ITEM">ITEM</option>
              <option value="CATEGORY">CATEGORY</option>
              <option value="SUMMARY">SUMMARY</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">โลโก้ร้าน (URL)</label>
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" value={partnerLogoUrl} onChange={(e) => setPartnerLogoUrl(e.target.value)} placeholder="https://..." />
        </div>
      </form>
    </GlassModal>
  );
}
