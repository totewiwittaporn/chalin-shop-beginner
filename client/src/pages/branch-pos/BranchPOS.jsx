import { useMemo, useRef, useState } from "react";
import GradientPanel from "@/components/theme/GradientPanel";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

import CartTable from "./CartTable";
import SummaryPanel from "./SummaryPanel";
import PaymentModal from "./PaymentModal";
import SalesDocsTable from "./SalesDocsTable";
import BranchSwitcher from "@/components/branch/BranchSwitcher";

const DEFAULT_ROLE = "STAFF"; // 'ADMIN' | 'STAFF'
const DEFAULT_BRANCH_NAME = "สาขาหลัก";
const STAFF_DISCOUNT_CAPS = { pctMax: 10, amountMax: 200 };

export default function BranchPOS({ role = DEFAULT_ROLE, branchName = DEFAULT_BRANCH_NAME, branchId: staffBranchId }) {
  const [cart, setCart] = useState([]);
  const [discountBill, setDiscountBill] = useState({ type: "amount", value: 0 });
  const [note, setNote] = useState("");

  const [q, setQ] = useState("");
  const [openScanner, setOpenScanner] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const docsTableRef = useRef(null);

  const [branchCtx, setBranchCtx] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pos.branchCtx") || "null"); } catch { return null; }
  });

  const fixedBranch = role === "STAFF" ? { id: staffBranchId, name: branchName } : null;

  const subtotal = useMemo(() => cart.reduce((s, it) => s + (it.unitPrice * it.qty - (it.lineDiscount || 0)), 0), [cart]);
  const billDiscountAmount = useMemo(() => {
    if (discountBill.type === "percent") {
      const pct = Math.min(100, Math.max(0, Number(discountBill.value) || 0));
      return (pct / 100) * subtotal;
    }
    return Math.max(0, Number(discountBill.value) || 0);
  }, [discountBill, subtotal]);
  const total = useMemo(() => Math.max(0, subtotal - billDiscountAmount), [subtotal, billDiscountAmount]);

  const canEditPrice = role === "ADMIN";
  const discountCaps = role === "ADMIN" ? null : STAFF_DISCOUNT_CAPS;

  function addOrIncLine(product, opts = { qty: 1, merge: true }) {
    setCart((prev) => {
      const qty = Number(opts.qty || 1);
      const unitPrice = Number(product.unitPrice ?? product.price ?? 0);
      const idx = opts.merge !== false ? prev.findIndex(x => x.productId === product.id && x.unitPrice === unitPrice) : -1;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      const line = {
        lineId: crypto.randomUUID(),
        productId: product.id,
        sku: product.sku || "",
        name: product.name || `สินค้า #${product.id}`,
        unitPrice,
        qty,
        lineDiscount: 0,
      };
      return [...prev, line];
    });
  }

  function handleQuickAdd(input) {
    const txt = String(input || "").trim();
    if (!txt) return;
    const isNumeric = /^\d+$/.test(txt);
    const mock = isNumeric
      ? { id: Number(txt.slice(-6)) || Math.floor(Math.random() * 100000), sku: txt, name: `สินค้า-${txt}`, unitPrice: 25 }
      : { id: Math.floor(Math.random() * 100000), sku: txt.toUpperCase().replace(/\s+/g, "-"), name: txt, unitPrice: 25 };
    addOrIncLine(mock, { qty: 1, merge: true });
  }

  function handleScanDetected(code) {
    handleQuickAdd(code);
    setOpenScanner(false);
  }

  const onChangeQty = (lineId, qty) => setCart(c => c.map(x => x.lineId === lineId ? { ...x, qty: Math.max(0, Number(qty) || 0) } : x));
  const onChangePrice = (lineId, price) => setCart(c => c.map(x => x.lineId === lineId ? { ...x, unitPrice: Math.max(0, Number(price) || 0) } : x));
  const onChangeLineDiscount = (lineId, v) => setCart(c => c.map(x => x.lineId === lineId ? { ...x, lineDiscount: Math.max(0, Number(v) || 0) } : x));
  const onRemove = (lineId) => setCart(c => c.filter(x => x.lineId !== lineId));

  function clearAll() {
    if (confirm("ล้างตะกร้าทั้งหมด?")) {
      setCart([]);
      setDiscountBill({ type: "amount", value: 0 });
      setNote("");
    }
  }

  function handleOpenPayment() {
    if (cart.length === 0) return;
    if (role === "ADMIN" && !branchCtx?.id) {
      alert("กรุณาเลือกสาขาที่ทำรายการก่อน");
      return;
    }
    if (role === "STAFF" && !fixedBranch?.id) {
      alert("ไม่พบสาขาของผู้ใช้ โปรดติดต่อผู้ดูแลระบบ");
      return;
    }
    setOpenPayment(true);
  }

  async function onConfirmPayment(payInfo) {
    let evidenceUrl = null;
    if (payInfo.evidenceFile) {
      try { evidenceUrl = URL.createObjectURL(payInfo.evidenceFile); }
      catch (e) { console.error("upload evidence failed", e); alert("อัปโหลดหลักฐานไม่สำเร็จ"); return; }
    }

    const branchId = role === "ADMIN" ? branchCtx.id : fixedBranch.id;

    const payload = {
      header: {
        docType: "SALE_POS",
        docDate: new Date().toISOString().slice(0, 10),
        branchId,
        note,
      },
      lines: cart.map((c, idx) => ({
        no: idx + 1,
        sku: c.sku,
        name: c.name,
        qty: c.qty,
        price: c.unitPrice,
        discount: c.lineDiscount || 0,
        amount: c.unitPrice * c.qty - (c.lineDiscount || 0),
        productId: c.productId,
      })),
      totals: {
        subTotal: cart.reduce((s, it) => s + it.unitPrice * it.qty, 0),
        discountBill: Number(discountBill?.value || 0),
        grandTotal: total,
      },
      payment: {
        method: payInfo.method,
        receive: payInfo.receive,
        change: payInfo.change,
        ref: payInfo.ref,
        evidenceUrl,
      },
    };

    try {
      const res = await fetch("/api/sales/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      await res.json();

      setCart([]);
      setDiscountBill({ type: "amount", value: 0 });
      setNote("");
      setOpenPayment(false);

      if (docsTableRef.current?.refreshFromStart) {
        docsTableRef.current.refreshFromStart();
      }
    } catch (e) {
      console.error("save sale failed:", e);
      alert("บันทึกเอกสารขายไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <GradientPanel
        title={`POS — ${role === "ADMIN" ? (branchCtx?.name || "ยังไม่เลือกสาขา") : (fixedBranch?.name || "ไม่ทราบสาขา")}`}
        subtitle="ค้นหาหรือสแกนเพื่อเพิ่มสินค้าอย่างรวดเร็ว"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <BranchSwitcher
              role={role}
              fixedBranch={fixedBranch}
              onChange={(ctx) => setBranchCtx(ctx)}
              fetchUrl="/api/branches"
            />
            <Input
              placeholder="ค้นหา: บาร์โค้ด / SKU / ชื่อสินค้า (Enter เพื่อเพิ่ม)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) { handleQuickAdd(q); setQ(""); } }}
              className="w-[320px]"
            />
            <Button kind="primary" onClick={() => setOpenScanner(true)}>สแกนบาร์โค้ด</Button>
            <Button kind="danger" onClick={clearAll}>เคลียร์</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2">
            <Card.Header className="flex items-center justify-between">
              <div className="font-medium">ตะกร้าสินค้า</div>
              <div className="text-sm text-slate-500">บทบาท: <b>{role}</b></div>
            </Card.Header>
            <Card.Body>
              <CartTable
                role={role}
                canEditPrice={canEditPrice}
                cart={cart}
                onChangeQty={onChangeQty}
                onChangePrice={onChangePrice}
                onChangeLineDiscount={onChangeLineDiscount}
                onRemove={onRemove}
                onQuickAdd={(txt) => { handleQuickAdd(txt); }}
              />
            </Card.Body>
          </Card>

          <SummaryPanel
            role={role}
            subtotal={subtotal}
            discountBill={discountBill}
            discountCaps={discountCaps}
            note={note}
            onChangeBillDiscount={(type, value) => setDiscountBill({ type, value })}
            onChangeNote={(v) => setNote(v)}
            onOpenPayment={handleOpenPayment}
            onSaveDraft={() => alert("(mock) บันทึกพักบิลไว้ในเครื่อง")}
            onClear={clearAll}
            cartEmpty={cart.length === 0}
          />
        </div>
      </GradientPanel>

      <BarcodeScannerModal open={openScanner} onClose={() => setOpenScanner(false)} onDetected={handleScanDetected} />

      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} total={total} role={role} onConfirm={onConfirmPayment} />

      {/* ตารางรายงาน/เอกสารการขาย — อยู่หน้าเดียวกัน */}
      <SalesDocsTable ref={docsTableRef} />
    </div>
  );
}
