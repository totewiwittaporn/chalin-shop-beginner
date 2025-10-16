// client/src/components/purchases/PurchaseReceiveModal.jsx
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const nf = (n) => Number(n || 0).toLocaleString();

export default function PurchaseReceiveModal({ open, onClose, purchase, onReceived }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !purchase) return;
    // เตรียมรายการให้แก้ไขจำนวนรับจริงได้ (default = ordered - received เดิม)
    const next = (purchase.lines || []).map((l) => ({
      id: l.id,
      productId: l.productId,
      name: l.product?.name || `#${l.productId}`,
      barcode: l.product?.barcode || "",
      ordered: Number(l.ordered || 0),
      prevReceived: Number(l.received || 0),
      receiveNow: Math.max(0, Number(l.ordered || 0) - Number(l.received || 0)),
      costPrice: Number(l.costPrice || 0),
    }));
    setRows(next);
  }, [open, purchase]);

  if (!open || !purchase) return null;

  const totalReceive = rows.reduce((s, r) => s + (r.receiveNow * r.costPrice), 0);

  const setRow = (i, patch) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  async function submit() {
    try {
      // validate
      for (const r of rows) {
        const maxAvail = Math.max(0, r.ordered - r.prevReceived);
        if (r.receiveNow < 0 || r.receiveNow > maxAvail) {
          alert(`จำนวนรับของสินค้า ${r.name} ต้องอยู่ระหว่าง 0 ถึง ${maxAvail}`);
          return;
        }
      }

      setSaving(true);
      await api.post(`/api/purchases/${purchase.id}/receive`, {
        lines: rows
          .filter((r) => r.receiveNow > 0)
          .map((r) => ({ id: r.id, received: r.receiveNow })),
      });

      onReceived?.(); // ให้หน้าหลักรีเฟรช
      onClose?.();
    } catch (e) {
      console.error("[PurchaseReceiveModal] submit", e);
      alert("รับสินค้าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-3xl p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white px-6 py-3 text-lg font-semibold">
          ตรวจรับสินค้า • PO-{String(purchase.id).padStart(6, "0")}
        </div>

        <div className="p-4 bg-white/95">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2">สินค้า</th>
                  <th className="text-right px-3 py-2">สั่ง</th>
                  <th className="text-right px-3 py-2">รับแล้ว</th>
                  <th className="text-right px-3 py-2">รับครั้งนี้</th>
                  <th className="text-right px-3 py-2">ทุน/หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const maxAvail = Math.max(0, r.ordered - r.prevReceived);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.barcode || "—"}</div>
                      </td>
                      <td className="px-3 py-2 text-right">{nf(r.ordered)}</td>
                      <td className="px-3 py-2 text-right">{nf(r.prevReceived)}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-24 rounded-lg border px-2 py-1 text-right"
                          type="number"
                          min={0}
                          max={maxAvail}
                          value={r.receiveNow}
                          onChange={(e) =>
                            setRow(i, { receiveNow: Math.min(maxAvail, Math.max(0, Number(e.target.value))) })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">{nf(r.costPrice)}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 py-6">
                      ไม่มีรายการสำหรับรับเข้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-slate-600">
              มูลค่ารับครั้งนี้: <b>{nf(totalReceive)}</b>
            </div>
            <div className="flex gap-2">
              <Button kind="danger" onClick={onClose}>ยกเลิก</Button>
              <Button kind="success" onClick={submit} disabled={saving || rows.every(r => r.receiveNow <= 0)}>
                ยืนยันรับเข้า
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
