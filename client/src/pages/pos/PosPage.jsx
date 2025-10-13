import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import Button from "@/components/ui/Button.jsx";
import { uploadFile } from "@/services/uploads.api.js";
import { createSale, paySale } from "@/services/sales.api.js";
import api from "@/lib/api";

export default function PosPage() {
  const [branchId, setBranchId] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");

  // ชำระเงิน
  const [method, setMethod] = useState("CASH"); // CASH | TRANSFER | CARD
  const [cashGiven, setCashGiven] = useState("");
  const [transferFile, setTransferFile] = useState(null);
  const [cardFile, setCardFile] = useState(null);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [items]
  );
  const discount = 0;
  const total = subtotal - discount;
  const change = useMemo(() => {
    if (method !== "CASH") return 0;
    const cash = Number(cashGiven || 0);
    return Math.max(0, cash - total);
  }, [method, cashGiven, total]);

  // สแกน/ค้นหาสินค้าแบบเร็ว (demo: ค้นด้วย code/barcode ชุดเล็ก)
  async function handleAddByCode() {
    const code = query.trim();
    if (!code) return;
    const { data } = await api.get("/api/products", { params: { q: code, pageSize: 1 }});
    const p = data?.rows?.[0];
    if (!p) return;
    const existing = items.find((x) => x.productId === p.id);
    if (existing) {
      setItems(items.map((x) => x.productId === p.id ? { ...x, qty: x.qty + 1 } : x));
    } else {
      setItems([...items, { productId: p.id, name: p.name, qty: 1, unitPrice: Number(p.price || 0) }]);
    }
    setQuery("");
  }

  function inc(id) {
    setItems(items.map((x) => x.productId === id ? { ...x, qty: x.qty + 1 } : x));
  }
  function dec(id) {
    setItems(items.map((x) => x.productId === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x));
  }
  function removeItem(id) {
    setItems(items.filter((x) => x.productId !== id));
  }

  async function submitSale() {
    if (!branchId) return alert("เลือกสาขาก่อน");
    if (!items.length) return alert("ยังไม่มีสินค้า");
    const draft = await createSale({
      branchId: Number(branchId),
      note,
      items: items.map((x) => ({
        productId: x.productId,
        qty: x.qty,
        unitPrice: x.unitPrice,
      })),
    });

    // เตรียมหลักฐานอัปโหลด
    let evidenceUrl = null;
    if (method === "TRANSFER" && transferFile) {
      const up = await uploadFile(transferFile);
      evidenceUrl = up.url;
    }
    if (method === "CARD" && cardFile) {
      const up = await uploadFile(cardFile);
      evidenceUrl = up.url;
    }

    const payments = [];
    if (method === "CASH") {
      payments.push({ method, amount: Number(cashGiven || 0) });
    } else {
      payments.push({ method, amount: total, evidenceUrl });
    }

    const paid = await paySale(draft.id, { payments });
    alert(`ชำระสำเร็จ • เลขที่: ${draft.id} • เงินทอน: ${paid.change.toFixed(2)}`);

    // reset
    setItems([]);
    setNote("");
    setCashGiven("");
    setTransferFile(null);
    setCardFile(null);
  }

  // mock สาขาสำหรับเลือก (คุณอาจเชื่อม /api/branches)
  // ลองพ่วง backend จริง:
  const [branches,setBranches] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/branches", { params: { pageSize: 50 }});
        setBranches(data?.rows || []);
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-6">
      <Card title="Point of Sale (Branch)">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="col-span-1">
            <label className="block text-sm mb-1">Branch</label>
            <select className="w-full border rounded p-2"
              value={branchId}
              onChange={(e)=>setBranchId(e.target.value)}>
              <option value="">— เลือกสาขา —</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name || `#${b.id}`}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm mb-1">Scan/Search Product</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded p-2"
                placeholder="แสกน/พิมพ์ code แล้ว Enter"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==='Enter') handleAddByCode(); }} />
              <Button onClick={handleAddByCode}>Add</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Items">
        <Table
          columns={[
            { key: "name", header: "สินค้า" },
            { key: "qty", header: "จำนวน", className:"w-32" },
            { key: "unitPrice", header: "ราคา/หน่วย", className:"w-32 text-right" },
            { key: "lineTotal", header: "รวม", className:"w-32 text-right" },
            { key: "actions", header: "" },
          ]}
          rows={items.map(it => ({
            ...it,
            lineTotal: (it.qty * it.unitPrice).toFixed(2),
            actions: (
              <div className="flex gap-2 justify-end">
                <Button size="xs" onClick={()=>dec(it.productId)}>-</Button>
                <span className="px-2">{it.qty}</span>
                <Button size="xs" onClick={()=>inc(it.productId)}>+</Button>
                <Button size="xs" variant="danger" onClick={()=>removeItem(it.productId)}>ลบ</Button>
              </div>
            ),
          }))} />

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <textarea className="border rounded p-2 flex-1" rows={2}
            placeholder="หมายเหตุ (ถ้ามี)"
            value={note}
            onChange={(e)=>setNote(e.target.value)} />
          <div className="text-right min-w-[260px]">
            <div>Subtotal: <b>{subtotal.toFixed(2)}</b></div>
            <div>Discount: <b>{discount.toFixed(2)}</b></div>
            <div className="text-lg">Total: <b>{total.toFixed(2)}</b></div>
          </div>
        </div>
      </Card>

      <Card title="Payment">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Method</label>
            <select className="w-full border rounded p-2"
              value={method} onChange={(e)=>setMethod(e.target.value)}>
              <option value="CASH">เงินสด</option>
              <option value="TRANSFER">โอนเงิน</option>
              <option value="CARD">บัตร</option>
            </select>
          </div>

          {method === "CASH" && (
            <div>
              <label className="block text-sm mb-1">รับเงินมา (CASH)</label>
              <input className="w-full border rounded p-2 text-right"
                value={cashGiven} onChange={(e)=>setCashGiven(e.target.value)} />
              <div className="mt-1 text-right">เงินทอน: <b>{change.toFixed(2)}</b></div>
            </div>
          )}

          {method === "TRANSFER" && (
            <div>
              <label className="block text-sm mb-1">แนบสลิปโอน (รูปภาพ)</label>
              <input type="file" accept="image/*" onChange={(e)=>setTransferFile(e.target.files?.[0]||null)} />
            </div>
          )}

          {method === "CARD" && (
            <div>
              <label className="block text-sm mb-1">แนบสลิปรูดบัตร (รูปภาพ)</label>
              <input type="file" accept="image/*" onChange={(e)=>setCardFile(e.target.files?.[0]||null)} />
            </div>
          )}
        </div>

        <div className="mt-4 text-right">
          <Button onClick={submitSale}>ชำระเงินและปิดบิล</Button>
        </div>
      </Card>
    </div>
  );
}
