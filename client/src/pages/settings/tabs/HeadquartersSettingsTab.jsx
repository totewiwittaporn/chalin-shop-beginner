import { useEffect, useMemo, useState } from "react";
import GradientPanel from "@/components/theme/GradientPanel.jsx";
import Button from "@/components/ui/Button.jsx";
import api from "@/lib/api";

/** ช่วยดึง array จาก response ได้หลายโครงสร้าง */
const pickArray = (res) => res?.data?.items ?? res?.data?.rows ?? res?.data?.data ?? res?.data ?? [];

/** ยิงหลาย endpoint (เผื่อ backend ใช้ path/ชื่อไม่ตรงกัน) */
async function tryMany(requests = []) {
  for (const r of requests) {
    try {
      const { url, method = "get", body, params } = r;
      const res = await api[method](url, body ?? { params }, body ? { params } : undefined);
      return res;
    } catch (_) {}
  }
  return null;
}

export default function HeadquartersSettingsTab() {
  // HQ create/activate
  const [branches, setBranches] = useState([]);
  const [activeHQ, setActiveHQ] = useState(null);
  const [code, setCode] = useState("HQ");
  const [name, setName] = useState("สาขาหลัก (Headquarters)");
  const [stockBranchId, setStockBranchId] = useState("");
  const [makeActive, setMakeActive] = useState(true);

  // Doc settings
  const [doc, setDoc] = useState({
    companyName: "",
    tradeName: "",
    address1: "",
    address2: "",
    address3: "",
    phone: "",
    taxId: "",
    logoUrl: "",
    footerNote: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // โหลด Branch + HQ ที่ active + Doc settings ของ HQ
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Branch (ไว้เลือกเป็น stock ของ HQ)
        try {
          const res = await api.get("/api/branches", { params: { status: "ACTIVE", pageSize: 500 } });
          const arr = pickArray(res);
          setBranches(Array.isArray(arr) ? arr : []);
        } catch (_) {
          setBranches([]);
        }

        // HQ ที่ Active
        let hq = null;
        try {
          hq = (await api.get("/api/headquarters/active"))?.data ?? null;
        } catch (_) {}

        if (!hq) {
          // ถ้ายังไม่มี HQ เลย ก็ยังไม่โหลด doc settings
          setActiveHQ(null);
          return;
        }

        setActiveHQ(hq);

        // โหลด doc settings ของ HQ
        const res = await tryMany([
          { url: `/api/headquarters/${hq.id}/doc-settings` },
          { url: `/api/headquarters/${hq.id}/document-settings` },
          { url: `/api/headquarters/${hq.id}/settings`, params: { scope: "document" } },
        ]);

        const data = res?.data ?? {};
        setDoc((prev) => ({ ...prev, ...data }));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ id: b.id, name: b.name || `#${b.id}` })),
    [branches]
  );

  async function createHQ() {
    if (!code.trim() || !name.trim()) {
      alert("กรอก Code และ Name ให้ครบก่อนครับ");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        isActive: !!makeActive,
        stockBranchId: stockBranchId ? Number(stockBranchId) : null,
      };
      const created = (await api.post("/api/headquarters", payload)).data;
      if (payload.isActive) setActiveHQ(created);
      alert("สร้าง Headquarters เรียบร้อย");
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "สร้าง HQ ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function activateHQ(id) {
    if (!id) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/headquarters/${id}/activate`);
      setActiveHQ(res?.data?.active ?? null);
      alert("ตั้งให้เป็นสาขาหลักเรียบร้อย");
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "ตั้ง Active ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function saveDocSettings() {
    if (!activeHQ?.id) {
      alert("ยังไม่มี Headquarters ที่ Active — โปรดสร้างหรือสลับให้มี Active ก่อน");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...doc };
      // พยายาม PUT หลาย path
      const ok =
        (await tryMany([{ url: `/api/headquarters/${activeHQ.id}/doc-settings`, method: "put", body: payload }])) ||
        (await tryMany([{ url: `/api/headquarters/${activeHQ.id}/document-settings`, method: "put", body: payload }])) ||
        (await tryMany([{ url: `/api/headquarters/${activeHQ.id}/settings`, method: "put", body: { scope: "document", ...payload } }]));

      if (!ok) throw new Error("ไม่พบ endpoint สำหรับบันทึก doc-settings");
      alert("บันทึกส่วนหัว/ท้ายเอกสารเรียบร้อย");
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* กล่อง 1 — สถานะ HQ และสร้าง/สลับ Active */}
      <GradientPanel
        title="สาขาหลัก (Headquarters)"
        subtitle="สร้างหรือสลับ Headquarters ที่ Active และเลือกสต็อกหลักเชื่อมกับ Branch"
        innerClassName="space-y-4"
      >
        {/* สถานะ HQ ปัจจุบัน */}
        <div className="rounded-2xl border border-slate-200 p-3 bg-white/80 text-sm text-slate-700">
          <div className="font-medium mb-1">HQ ที่ Active ปัจจุบัน</div>
          {loading ? (
            <div className="text-slate-500">กำลังโหลด...</div>
          ) : activeHQ ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div><span className="text-slate-500">Code:</span> <b>{activeHQ.code}</b></div>
                <div><span className="text-slate-500">Name:</span> <b>{activeHQ.name}</b></div>
              </div>
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1 inline-flex w-fit">
                Active
              </div>
            </div>
          ) : (
            <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 inline-flex">
              ยังไม่มี Headquarters ที่ Active
            </div>
          )}
        </div>

        {/* ฟอร์มสร้าง HQ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-slate-600">รหัส (Code)</label>
            <input
              className="w-full border rounded-2xl px-3 py-2"
              placeholder="เช่น HQ"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600">ชื่อ (Name)</label>
            <input
              className="w-full border rounded-2xl px-3 py-2"
              placeholder="เช่น สาขาหลัก (Headquarters)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-600">สต็อกหลักเชื่อมกับ Branch (ไม่บังคับ)</label>
            <select
              className="w-full border rounded-2xl px-3 py-2"
              value={stockBranchId}
              onChange={(e) => setStockBranchId(e.target.value)}
              disabled={saving || loading}
            >
              <option value="">— ไม่เลือก —</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              id="makeActive"
              type="checkbox"
              className="scale-110"
              checked={makeActive}
              onChange={(e) => setMakeActive(e.target.checked)}
              disabled={saving}
            />
            <label htmlFor="makeActive" className="text-sm text-slate-700">ตั้งเป็น Headquarters ที่ Active ทันที</label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => {
              setCode("HQ");
              setName("สาขาหลัก (Headquarters)");
              setStockBranchId("");
              setMakeActive(true);
            }}
            disabled={saving}
          >
            ยกเลิก/ล้างข้อมูล
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={createHQ}
            disabled={saving}
          >
            {saving ? "กำลังสร้าง..." : "สร้างสาขาหลัก"}
          </Button>
        </div>

        {/* (ตัวเลือก) ปุ่มสลับ Active ถ้าคุณรู้ id ของ HQ อื่นอยู่แล้ว */}
        {/* <Button onClick={() => activateHQ(2)}>สลับ Active ไปที่ HQ id=2</Button> */}
      </GradientPanel>

      {/* กล่อง 2 — ตั้งค่าเอกสาร */}
      <GradientPanel
        title="ตั้งค่าส่วนหัว/ส่วนท้ายเอกสาร (Headquarters)"
        subtitle="ใช้ในการพิมพ์เอกสารทุกประเภท: ใบส่งของ ใบวางบิล ใบเสร็จ ฯลฯ"
        innerClassName="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ส่วนหัว */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">ส่วนหัวเอกสาร</div>
            <label className="block text-xs text-slate-600">ชื่อบริษัท/ร้าน (companyName)</label>
            <input className="w-full border rounded-2xl px-3 py-2"
              value={doc.companyName} onChange={(e) => setDoc({ ...doc, companyName: e.target.value })} />

            <label className="block text-xs text-slate-600 mt-2">ชื่อการค้า (tradeName)</label>
            <input className="w-full border rounded-2xl px-3 py-2"
              value={doc.tradeName} onChange={(e) => setDoc({ ...doc, tradeName: e.target.value })} />

            <label className="block text-xs text-slate-600 mt-2">โลโก้ (URL)</label>
            <input className="w-full border rounded-2xl px-3 py-2"
              placeholder="https://.../logo.png"
              value={doc.logoUrl} onChange={(e) => setDoc({ ...doc, logoUrl: e.target.value })} />

            <label className="block text-xs text-slate-600 mt-2">โทรศัพท์</label>
            <input className="w-full border rounded-2xl px-3 py-2"
              value={doc.phone} onChange={(e) => setDoc({ ...doc, phone: e.target.value })} />

            <label className="block text-xs text-slate-600 mt-2">เลขผู้เสียภาษี (13 หลัก)</label>
            <input className="w-full border rounded-2xl px-3 py-2"
              value={doc.taxId} onChange={(e) => setDoc({ ...doc, taxId: e.target.value })} />
          </div>

          {/* ที่อยู่ + ส่วนท้าย */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">ที่อยู่เอกสาร</div>
            <input className="w-full border rounded-2xl px-3 py-2"
              placeholder="ที่อยู่บรรทัด 1" value={doc.address1}
              onChange={(e) => setDoc({ ...doc, address1: e.target.value })} />
            <input className="w-full border rounded-2xl px-3 py-2"
              placeholder="ที่อยู่บรรทัด 2 (ถ้ามี)" value={doc.address2}
              onChange={(e) => setDoc({ ...doc, address2: e.target.value })} />
            <input className="w-full border rounded-2xl px-3 py-2"
              placeholder="ที่อยู่บรรทัด 3 (ถ้ามี)" value={doc.address3}
              onChange={(e) => setDoc({ ...doc, address3: e.target.value })} />

            <div className="text-sm font-semibold text-slate-700 mt-3">ส่วนท้ายเอกสาร</div>
            <textarea className="w-full border rounded-2xl px-3 py-2 min-h-[72px]"
              placeholder="ข้อความหมายเหตุท้ายเอกสาร เช่น เงื่อนไขการชำระเงิน"
              value={doc.footerNote} onChange={(e) => setDoc({ ...doc, footerNote: e.target.value })} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className="w-full border rounded-2xl px-3 py-2" placeholder="ธนาคาร"
                value={doc.bankName} onChange={(e) => setDoc({ ...doc, bankName: e.target.value })} />
              <input className="w-full border rounded-2xl px-3 py-2" placeholder="ชื่อบัญชี"
                value={doc.bankAccountName} onChange={(e) => setDoc({ ...doc, bankAccountName: e.target.value })} />
              <input className="w-full border rounded-2xl px-3 py-2" placeholder="เลขบัญชี"
                value={doc.bankAccountNumber} onChange={(e) => setDoc({ ...doc, bankAccountNumber: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={() => {
              setDoc({
                companyName: "", tradeName: "", address1: "", address2: "", address3: "",
                phone: "", taxId: "", logoUrl: "", footerNote: "",
                bankName: "", bankAccountName: "", bankAccountNumber: "",
              });
            }}
            disabled={saving}
          >
            เคลียร์ค่า
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={saveDocSettings}
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกหัว/ท้ายเอกสาร"}
          </Button>
        </div>
      </GradientPanel>
    </div>
  );
}
