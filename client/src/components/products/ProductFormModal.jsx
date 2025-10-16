import { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/theme/GlassModal.jsx";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/lib/axios";
import {
  listProductTypes,
  createProductType,
  updateProductType,
} from "@/services/productTypes.api.js";
import ProductTypeModal from "@/components/products/ProductTypeModal.jsx";
import { useAuthStore } from "@/store/authStore";

export default function ProductFormModal({
  open,
  mode = "create", // "create" | "edit"
  initial = null,   // { id, barcode, name, costPrice, salePrice, productTypeId }
  onClose,
  onSaved,          // callback หลังบันทึกสำเร็จ
}) {
  const isEdit = mode === "edit";
  const formId = "product-modal-form";
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = String(role || "").toUpperCase() === "ADMIN";

  // ฟอร์มสินค้า
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [productTypeId, setProductTypeId] = useState("");

  // รายการประเภทสินค้า
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // modal: product type (ตัวเดียว ใช้ mode สลับ create/edit)
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState("create"); // "create" | "edit"
  const [typeEditing, setTypeEditing] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // โหลดหมวดสินค้า
  async function refreshTypes({ selectId } = {}) {
    setLoadingTypes(true);
    try {
      const res = await listProductTypes({ pageSize: 200 });
      const items = res?.items ?? res ?? [];
      setTypes(items);
      if (selectId) setProductTypeId(String(selectId));
    } finally {
      setLoadingTypes(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    refreshTypes();
  }, [open]);

  // เซตค่าเริ่มต้น
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setBarcode(initial.barcode ?? "");
      setName(initial.name ?? "");
      setCostPrice(initial.costPrice ?? "");
      setSalePrice(initial.salePrice ?? "");
      setProductTypeId(initial.productTypeId ?? "");
      setError("");
    } else {
      setBarcode("");
      setName("");
      setCostPrice("");
      setSalePrice("");
      setProductTypeId("");
      setError("");
    }
  }, [open, isEdit, initial]);

  const canSave = useMemo(() => {
    if (!barcode.trim() || !name.trim()) return false;
    const cost = Number(costPrice);
    const sale = Number(salePrice);
    if (Number.isNaN(cost) || Number.isNaN(sale)) return false;
    return true;
  }, [barcode, name, costPrice, salePrice]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!canSave || saving) return;
    setError("");

    const payload = {
      barcode: barcode.trim(),
      name: name.trim(),
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      productTypeId: productTypeId ? Number(productTypeId) : null,
    };

    try {
      setSaving(true);
      if (isEdit && initial?.id) {
        await api.put(`/api/products/${initial.id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // --- handlers: เปิด/บันทึก modal product type (ADMIN only) ---
  function openCreateType() {
    if (!isAdmin) return;
    setTypeModalMode("create");
    setTypeEditing(null);
    setTypeModalOpen(true);
  }

  function openEditType() {
    if (!isAdmin || !productTypeId) return;
    const t = types.find((x) => String(x.id) === String(productTypeId));
    if (!t) return;
    setTypeModalMode("edit");
    setTypeEditing(t);
    setTypeModalOpen(true);
  }

  async function handleTypeSubmit(...args) {
    try {
      if (typeModalMode === "create") {
        const payload = args[0]; // { name, code? }
        const created = await createProductType(payload);
        setTypeModalOpen(false);
        await refreshTypes({ selectId: created.id });
      } else {
        const [id, payload] = args;
        await updateProductType(id, payload);
        setTypeModalOpen(false);
        await refreshTypes();
      }
    } catch (e) {
      alert(e?.response?.data?.error || "บันทึกหมวดไม่สำเร็จ");
    }
  }

  return (
    <>
      <GlassModal
        open={open}
        title={isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
        onClose={saving ? undefined : onClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button kind="danger" type="button" onClick={onClose} disabled={saving}>
              ยกเลิก
            </Button>
            <Button kind="success" type="submit" form={formId} disabled={!canSave || saving} loading={saving}>
              บันทึก
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="grid gap-3">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">บาร์โค้ด</label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="เช่น 8850..." />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">ชื่อสินค้า</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อที่แสดง" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">ราคาซื้อ (บาท)</label>
              <Input value={costPrice} onChange={(e) => setCostPrice(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">ราคาขาย (บาท)</label>
              <Input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-600">หมวดหมู่สินค้า (Product Type)</label>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Button kind="white" size="sm" onClick={openCreateType}>+ เพิ่มหมวด</Button>
                  <Button
                    kind="editor"
                    size="sm"
                    disabled={!productTypeId}
                    onClick={openEditType}
                  >
                    แก้ไขหมวด
                  </Button>
                </div>
              )}
            </div>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none text-slate-900"
              value={productTypeId || ""}
              onChange={(e) => setProductTypeId(e.target.value)}
              disabled={loadingTypes}
            >
              <option value="">{loadingTypes ? "กำลังโหลด..." : "— ไม่ระบุ —"}</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="text-[12px] text-slate-500 mt-1">
              * “หมวดหมู่สินค้า” ใช้จัดกลุ่มสินค้าโดยตรง (คนละส่วนกับหมวดเอกสารของร้านฝากขาย)
            </div>
          </div>
        </form>
      </GlassModal>

      {/* ADMIN only: Modal Product Type (โหมด create/edit ในไฟล์เดียว) */}
      {isAdmin && (
        <ProductTypeModal
          open={typeModalOpen}
          mode={typeModalMode}
          initial={typeModalMode === "edit" ? typeEditing : null}
          onClose={() => setTypeModalOpen(false)}
          onSubmit={handleTypeSubmit}
          busy={false}
        />
      )}
    </>
  );
}
