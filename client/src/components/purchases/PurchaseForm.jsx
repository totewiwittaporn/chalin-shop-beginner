// client/src/components/purchases/PurchaseForm.jsx
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import { Search, Plus, X } from "lucide-react";

const nf = (n) => Number(n || 0).toLocaleString();

export default function PurchaseForm({ onCreated }) {
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [form, setForm] = useState({
    supplierId: "",
    branchId: "",
    items: [
      // { product: {id,name,barcode,basePrice?}, qty, costPrice }
      { product: null, qty: 1, costPrice: 0 },
    ],
  });

  const [saving, setSaving] = useState(false);

  // ------- load masters -------
  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([
          api.get("/api/suppliers", { params: { q: "" } }),
          api.get("/api/branches"),
        ]);
        setSuppliers(s.data || []);
        setBranches(b.data?.items || b.data || []);
      } catch (e) {
        console.error("[PurchaseForm] load masters", e);
      }
    })();
  }, []);

  // ------- helpers -------
  const setItem = (i, patch) =>
    setForm((prev) => {
      const items = [...prev.items];
      items[i] = { ...items[i], ...patch };
      return { ...prev, items };
    });

  const addRow = () =>
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { product: null, qty: 1, costPrice: 0 }],
    }));

  const removeRow = (i) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const total = form.items.reduce(
    (s, l) => s + (Number(l.qty || 0) * Number(l.costPrice || 0)),
    0
  );

  async function handleSave() {
    try {
      const items = form.items
        .filter((l) => l.product && Number(l.qty) > 0)
        .map((l) => ({
          productId: l.product.id,
          ordered: Number(l.qty),
          costPrice: Number(l.costPrice || 0),
        }));

      if (!form.supplierId || !form.branchId || items.length === 0) {
        alert("กรุณาเลือกซัพพลายเออร์ เลือกสาขา และเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
        return;
      }

      setSaving(true);
      await api.post("/api/purchases", {
        supplierId: Number(form.supplierId),
        branchId: Number(form.branchId),
        items,
      });

      // reset
      setForm({
        supplierId: "",
        branchId: "",
        items: [{ product: null, qty: 1, costPrice: 0 }],
      });
      onCreated?.();
    } catch (e) {
      console.error("[PurchaseForm] save", e);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Master selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          className="rounded-xl border px-3 py-2"
          value={form.supplierId}
          onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))}
        >
          <option value="">เลือกซัพพลายเออร์</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          className="rounded-xl border px-3 py-2"
          value={form.branchId}
          onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
        >
          <option value="">เลือกสาขา</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name || `สาขา #${b.id}`}</option>
          ))}
        </select>
      </div>

      {/* Lines */}
      <div className="rounded-2xl border bg-white/95 p-3">
        <div className="grid grid-cols-12 gap-2 font-medium text-slate-600 mb-2">
          <div className="col-span-6">สินค้า</div>
          <div className="col-span-2 text-right">จำนวน</div>
          <div className="col-span-3 text-right">ต้นทุน/หน่วย</div>
          <div className="col-span-1"></div>
        </div>

        {form.items.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
            <div className="col-span-6">
              <ProductSearchInput
                value={l.product}
                onSelect={(p) => {
                  setItem(i, {
                    product: p,
                    costPrice: Number(p.basePrice ?? p.costPrice ?? 0),
                  });
                }}
                onClear={() => setItem(i, { product: null })}
              />
            </div>

            <div className="col-span-2">
              <input
                className="w-full rounded-xl border px-3 py-2 text-right"
                type="number"
                min={1}
                value={l.qty}
                onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-3">
              <input
                className="w-full rounded-xl border px-3 py-2 text-right"
                type="number"
                step="0.01"
                min={0}
                value={l.costPrice}
                onChange={(e) => setItem(i, { costPrice: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-1 flex justify-end">
              <Button kind="danger" size="sm" onClick={() => removeRow(i)}>
                ลบ
              </Button>
            </div>
          </div>
        ))}

        <div className="mt-2">
          <Button kind="white" onClick={addRow} leftIcon={<Plus size={16} />}>
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-slate-600">ยอดรวม: <b>{nf(total)}</b></div>
        <Button kind="success" onClick={handleSave} disabled={saving}>
          บันทึกใบสั่งซื้อ
        </Button>
      </div>
    </div>
  );
}

/* ===========================
   ProductSearchInput (Autocomplete)
   =========================== */
function ProductSearchInput({ value, onSelect, onClear }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    // close on outside click
    function onDocClick(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/api/products/search", { params: { q: query } });
        setResults(data.items || data || []);
        setOpen(true);
      } catch (e) {
        console.error("[ProductSearch] search", e);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // show selected
  const display = value ? `${value.name} (${value.barcode || "—"})` : query;

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          <Search size={14} className="text-slate-500" />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="ค้นหาสินค้า (ชื่อ/บาร์โค้ด)"
            value={display}
            onChange={(e) => {
              setQuery(e.target.value);
              if (value) onClear?.(); // ถ้าแก้ข้อความ ให้เคลียร์ selection เดิม
            }}
            onFocus={() => query && results.length > 0 && setOpen(true)}
          />
        </div>
        {value && (
          <button
            type="button"
            title="ล้างรายการ"
            className="rounded-full p-1 hover:bg-slate-100"
            onClick={() => { onClear?.(); setQuery(""); setOpen(false); }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-64 overflow-auto">
          {results.map((p) => (
            <div
              key={p.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              onClick={() => {
                onSelect?.(p);
                setQuery(`${p.name}`);
                setOpen(false);
              }}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-slate-500">
                {p.barcode ? `บาร์โค้ด: ${p.barcode}` : "—"}{p.basePrice != null ? ` • ทุน: ${nf(p.basePrice)}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
