// client/src/components/purchases/PurchaseForm.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import BarcodeImage from "@/components/ui/BarcodeImage";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

function formatMoney(n) {
  if (n === null || n === undefined) return "-";
  const num = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(num);
}

export default function PurchaseForm({ onCreated }) {
  const [supplierQ, setSupplierQ] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [branchId, setBranchId] = useState("");
  const [lines, setLines] = useState([]);
  const [openScan, setOpenScan] = useState(false);
  const [saving, setSaving] = useState(false);

  // mock suppliers/products loaders
  const [suggestSup, setSuggestSup] = useState([]);
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!supplierQ) { setSuggestSup([]); return; }
      const res = await api.get("/api/suppliers", { params: { q: supplierQ } }).catch(()=>({data:[]}));
      if (!ignore) setSuggestSup(res.data || []);
    })();
    return () => { ignore = true; };
  }, [supplierQ]);

  async function searchProduct(q) {
    const res = await api.get("/api/products", { params: { q, page: 1, pageSize: 10 } });
    return res.data.items || [];
  }

  async function addByBarcode(code) {
    const items = await searchProduct(code);
    const prod = items.find(i => i.barcode === code) || items[0];
    if (!prod) return;
    setLines((prev) => {
      const idx = prev.findIndex(l => l.productId === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: prod.id, name: prod.name, barcode: prod.barcode, costPrice: prod.costPrice || 0, qty: 1 }];
    });
  }

  function updateLine(i, patch) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function removeLine(i) { setLines((prev) => prev.filter((_, idx)=> idx !== i)); }

  const total = lines.reduce((s, l)=> s + (Number(l.costPrice||0) * Number(l.qty||0)), 0);

  async function save() {
    if (!supplier || !branchId || lines.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        supplierId: supplier.id,
        branchId: Number(branchId),
        items: lines.map(l => ({ productId: l.productId, ordered: Number(l.qty||0), costPrice: Number(l.costPrice||0) })),
      };
      await api.post("/api/purchases", payload);
      setLines([]);
      setSupplier(null);
      setSupplierQ("");
      if (onCreated) onCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted">ซัพพลายเออร์</label>
          {!supplier ? (
            <div className="relative">
              <Input value={supplierQ} onChange={(e)=> setSupplierQ(e.target.value)} placeholder="พิมพ์ชื่อเพื่อค้นหา..." />
              {!!suggestSup.length && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow">
                  {suggestSup.map(s => (
                    <button key={s.id} type="button" className="block w-full text-left px-3 py-2 hover:bg-slate-50" onClick={()=> { setSupplier(s); setSupplierQ(""); setSuggestSup([]); }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-slate-100 px-3 py-2">{supplier.name}</span>
              <Button kind="white" onClick={()=> setSupplier(null)}>เปลี่ยน</Button>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">สาขา</label>
          <select className="w-full rounded-xl border px-3 py-2" value={branchId} onChange={(e)=> setBranchId(e.target.value)}>
            <option value="">-- เลือกสาขา --</option>
            {/* สมมติ endpoint /api/branches */}
            <option value="1">สาขาหลัก</option>
            <option value="2">สาขา A</option>
          </select>
        </div>

        <div className="flex items-end justify-end">
          <Button onClick={save} disabled={saving || !supplier || !branchId || !lines.length}>
            บันทึกใบสั่งซื้อ
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <Input placeholder="สแกน/พิมพ์ Barcode หรือ ชื่อสินค้า..." onKeyDown={async(e)=>{
            if (e.key === "Enter") {
              const q = e.currentTarget.value.trim();
              if (!q) return;
              await addByBarcode(q);
              e.currentTarget.value = "";
            }
          }} />
          <Button kind="white" onClick={()=> setOpenScan(true)}>สแกน</Button>
        </div>

        <Table>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[160px]">Barcode</Table.Th>
              <Table.Th>สินค้า</Table.Th>
              <Table.Th className="w-[120px] text-right">ต้นทุน</Table.Th>
              <Table.Th className="w-[120px] text-right">จำนวน</Table.Th>
              <Table.Th className="w-[160px] text-right">รวม</Table.Th>
              <Table.Th className="w-[80px]"></Table.Th>
            </Table.Tr>
          </Table.Head>
          <Table.Body>
            {lines.map((l, i) => (
              <Table.Tr key={i}>
                <Table.Td className="font-mono text-sm"><BarcodeImage value={l.barcode} /></Table.Td>
                <Table.Td>{l.name}</Table.Td>
                <Table.Td className="text-right">
                  <input
                    type="number"
                    className="w-28 rounded-lg border px-2 py-1 text-right"
                    value={l.costPrice}
                    min="0"
                    step="0.01"
                    onChange={(e)=> updateLine(i, { costPrice: Number(e.target.value) })}
                  />
                </Table.Td>
                <Table.Td className="text-right">
                  <input
                    type="number"
                    className="w-24 rounded-lg border px-2 py-1 text-right"
                    value={l.qty}
                    min="1"
                    step="1"
                    onChange={(e)=> updateLine(i, { qty: Number(e.target.value) })}
                  />
                </Table.Td>
                <Table.Td className="text-right">{formatMoney((Number(l.costPrice)||0) * (Number(l.qty)||0))}</Table.Td>
                <Table.Td className="text-right">
                  <Button kind="white" size="sm" onClick={()=> removeLine(i)}>ลบ</Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {lines.length === 0 && (
              <Table.Tr><Table.Td colSpan={6} className="py-8 text-center text-muted">ยังไม่มีรายการสินค้า</Table.Td></Table.Tr>
            )}
          </Table.Body>
        </Table>

        <div className="mt-3 flex items-center justify-end gap-4">
          <div className="text-sm text-muted">รวมทั้งสิ้น</div>
          <div className="text-lg font-semibold">{formatMoney(total)}</div>
        </div>
      </Card>

      <BarcodeScannerModal
        open={openScan}
        onClose={()=> setOpenScan(false)}
        onDetected={(code)=> addByBarcode(code)}
      />
    </div>
  );
}