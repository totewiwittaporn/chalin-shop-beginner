// client/src/components/transfers/TransferForm.jsx
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Button from "@/components/ui/Button.jsx";
import api from "@/lib/axios";

export default function TransferForm({ onClose, onSubmit, editDoc, currentUser }) {
  const [fromBranchId, setFromBranchId] = useState(currentUser?.branch?.id || 1);
  const [toType, setToType] = useState(editDoc?.toBranchId ? "BRANCH" : "CONSIGN");
  const [toBranchId, setToBranchId] = useState(editDoc?.toBranchId || "");
  const [toConsignmentPartnerId, setToConsignmentPartnerId] = useState(editDoc?.toConsignmentPartnerId || "");
  const [notes, setNotes] = useState(editDoc?.notes || "");
  const [items, setItems] = useState(
    editDoc?.lines?.map((l) => ({ productId: l.productId, qty: l.qty })) || [{ productId: "", qty: 1 }]
  );

  const [branches, setBranches] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (async () => {
      // ปรับพาธ API ของคุณเอง หากมีบริการ list อยู่แล้ว
      const [b, p, pr] = await Promise.allSettled([
        api.get("/api/branches"),
        api.get("/api/consignment/partners"),
        api.get("/api/products", { params: { pageSize: 1000 } }),
      ]);
      if (b.status === "fulfilled") setBranches(b.value.data.items || b.value.data || []);
      if (p.status === "fulfilled") setPartners(p.value.data.items || p.value.data || []);
      if (pr.status === "fulfilled") setProducts(pr.value.data.items || pr.value.data || []);
    })();
  }, []);

  function setItem(idx, patch) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addRow() {
    setItems((prev) => [...prev, { productId: "", qty: 1 }]);
  }
  function removeRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      fromBranchId: Number(fromBranchId),
      toBranchId: toType === "BRANCH" ? Number(toBranchId) : undefined,
      toConsignmentPartnerId: toType === "CONSIGN" ? Number(toConsignmentPartnerId) : undefined,
      notes,
      items: items
        .map((it) => ({ productId: Number(it.productId), qty: Number(it.qty) }))
        .filter((it) => it.productId && it.qty > 0),
    };
    await onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <Card className="w-full max-w-3xl bg-white">
        <Card.Header className="flex items-center justify-between">
          <div className="text-lg font-semibold">{editDoc ? "แก้ไขใบส่งสินค้า" : "สร้างใบส่งสินค้า"}</div>
          <Button kind="ghost" onClick={onClose}>ปิด</Button>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm">จากสาขา</label>
                <select
                  className="w-full border rounded-lg px-2 py-2"
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">ปลายทาง</label>
                <select
                  className="w-full border rounded-lg px-2 py-2"
                  value={toType}
                  onChange={(e) => setToType(e.target.value)}
                >
                  <option value="BRANCH">สาขา</option>
                  <option value="CONSIGN">ร้านฝากขาย</option>
                </select>
              </div>
              <div>
                {toType === "BRANCH" ? (
                  <>
                    <label className="text-sm">สาขาปลายทาง</label>
                    <select
                      className="w-full border rounded-lg px-2 py-2"
                      value={toBranchId}
                      onChange={(e) => setToBranchId(e.target.value)}
                    >
                      <option value="">-- เลือก --</option>
                      {branches
                        .filter((b) => String(b.id) !== String(fromBranchId))
                        .map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="text-sm">ร้านฝากขาย</label>
                    <select
                      className="w-full border rounded-lg px-2 py-2"
                      value={toConsignmentPartnerId}
                      onChange={(e) => setToConsignmentPartnerId(e.target.value)}
                    >
                      <option value="">-- เลือก --</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm">หมายเหตุ</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="font-medium">รายการสินค้า</div>
              <div className="grid gap-2">
                {items.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_120px_80px] gap-2 items-center">
                    <select
                      className="border rounded-lg px-2 py-2"
                      value={row.productId}
                      onChange={(e) => setItem(idx, { productId: e.target.value })}
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.barcode ? `${p.barcode} — ` : ""}{p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="border rounded-lg px-2 py-2"
                      value={row.qty}
                      onChange={(e) => setItem(idx, { qty: e.target.value })}
                    />
                    <div className="flex gap-1">
                      <Button kind="white" type="button" onClick={() => removeRow(idx)}>ลบ</Button>
                      {idx === items.length - 1 && (
                        <Button kind="ghost" type="button" onClick={addRow}>+ เพิ่ม</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button kind="white" type="button" onClick={onClose}>ยกเลิก</Button>
              <Button type="submit">{editDoc ? "บันทึกการแก้ไข" : "สร้าง"}</Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
}
