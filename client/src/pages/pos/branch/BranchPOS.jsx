// client/src/pages/branch-pos/BranchPOS.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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
import { searchProductsSimple } from "@/api/products";
import api from "@/lib/api";

const DEFAULT_ROLE = "ADMIN";
const DEFAULT_BRANCH_NAME = "สาขาหลัก";
const STAFF_DISCOUNT_CAPS = { pctMax: 10, amountMax: 200 };

export default function BranchPOS({
  role = DEFAULT_ROLE,
  branchName = DEFAULT_BRANCH_NAME,
  branchId: staffBranchId,
}) {
  const [cart, setCart] = useState([]);
  const [discountBill, setDiscountBill] = useState({ type: "amount", value: 0 });
  const [note, setNote] = useState("");

  const [q, setQ] = useState("");
  const [suggests, setSuggests] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const fetchTimer = useRef(null);

  const [openScanner, setOpenScanner] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const docsTableRef = useRef(null);
  const containerRef = useRef(null);

  const [branchCtx, setBranchCtx] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pos.branchCtx") || "null"); } catch { return null; }
  });

  const fixedBranch = role === "STAFF" ? { id: staffBranchId, name: branchName } : null;
  const currentBranchId = role === "ADMIN" ? branchCtx?.id : fixedBranch?.id;

  const subtotal = useMemo(
    () => cart.reduce((s, it) => s + (it.unitPrice * it.qty - (it.lineDiscount || 0)), 0),
    [cart]
  );

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

  // -------------------- Cart helpers --------------------
  function addOrIncLine(product, opts = { qty: 1, merge: true }) {
    const qtyToAdd = Number(opts.qty || 1);
    setCart((prev) => {
      const idx = opts.merge !== false
        ? prev.findIndex(x => x.productId === product.id && x.unitPrice === product.price)
        : -1;

      const available = product.stockQty != null ? Number(product.stockQty) : Infinity;

      if (idx >= 0) {
        const cur = prev[idx];
        const nextQty = Math.min(available, cur.qty + qtyToAdd);
        if (nextQty === cur.qty) return prev;
        const next = [...prev];
        next[idx] = { ...cur, qty: nextQty };
        return next;
      }

      if (available <= 0) return prev;

      const line = {
        lineId: crypto.randomUUID(),
        productId: product.id,
        sku: product.sku || product.barcode || null,
        name: product.name || "",
        qty: Math.min(qtyToAdd, available),
        unitPrice: Number(product.price) || 0,
        lineDiscount: 0,
        stockQty: available,
      };
      return [...prev, line];
    });
  }

  const onChangeQty = (lineId, qty) =>
    setCart((c) => c.map((x) => {
      if (x.lineId !== lineId) return x;
      const want = Math.max(0, Number(qty) || 0);
      const limit = Number(x.stockQty ?? Infinity);
      return { ...x, qty: Math.min(want, limit) };
    }));

  const onChangePrice = (lineId, price) =>
    setCart((c) => c.map((x) => x.lineId === lineId ? { ...x, unitPrice: Math.max(0, Number(price) || 0) } : x));

  const onChangeLineDiscount = (lineId, v) =>
    setCart((c) => c.map((x) => x.lineId === lineId ? { ...x, lineDiscount: Math.max(0, Number(v) || 0) } : x));

  const onRemove = (lineId) => setCart((c) => c.filter((x) => x.lineId !== lineId));

  function clearAll() {
    if (confirm("ล้างตะกร้าทั้งหมด?")) {
      setCart([]);
      setDiscountBill({ type: "amount", value: 0 });
      setNote("");
    }
  }

  // -------------------- Autocomplete: ใช้ Axios + ส่ง branchId --------------------
  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    if (!q.trim()) {
      setSuggests([]);
      setOpenSuggest(false);
      setHighlight(-1);
      return;
    }
    fetchTimer.current = setTimeout(async () => {
      try {
        const items = await searchProductsSimple(q.trim(), 20, currentBranchId);
        setSuggests(items);
        setOpenSuggest(true);
        setHighlight(items.length ? 0 : -1);
      } catch (e) {
        console.error("autocomplete search failed:", e);
        setSuggests([]);
        setOpenSuggest(false);
        setHighlight(-1);
      }
    }, 200);
    return () => fetchTimer.current && clearTimeout(fetchTimer.current);
  }, [q, currentBranchId]);

  function focusSearch() {
    document.getElementById("pos-search")?.focus();
  }

  function chooseSuggestByIndex(i) {
    const it = suggests[i];
    if (!it) return;
    addOrIncLine({
      id: it.id,
      name: it.name,
      price: it.price,
      barcode: it.barcode,
      sku: it.sku,
      stockQty: it.stockQty ?? Infinity,
    }, { qty: 1, merge: true });

    setQ("");
    setSuggests([]);
    setOpenSuggest(false);
    setHighlight(-1);
    focusSearch();
  }

  function onSearchKeyDown(e) {
    if (!openSuggest || !suggests.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggests.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0) chooseSuggestByIndex(highlight);
    } else if (e.key === "Escape") {
      setOpenSuggest(false);
    }
  }

  useEffect(() => {
    function onDocClick(e) {
      const box = containerRef.current;
      if (box && !box.contains(e.target)) setOpenSuggest(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function handleOpenPayment() {
    if (cart.length === 0) return;
    if (role === "ADMIN" && !currentBranchId) { alert("กรุณาเลือกสาขาที่ทำรายการก่อน"); return; }
    if (role === "STAFF" && !currentBranchId) { alert("ไม่พบสาขาของผู้ใช้ โปรดติดต่อผู้ดูแลระบบ"); return; }
    setOpenPayment(true);
  }

  async function onConfirmPayment(payInfo) {
    let evidenceUrl = null;
    if (payInfo.evidenceFile) {
      try { evidenceUrl = URL.createObjectURL(payInfo.evidenceFile); }
      catch (e) { console.error("upload evidence failed", e); alert("อัปโหลดหลักฐานไม่สำเร็จ"); return; }
    }

    const payload = {
      header: {
        docType: "SALE_POS",
        docDate: new Date().toISOString().slice(0, 10),
        branchId: currentBranchId,
        note,
      },
      lines: cart.map((c, i) => ({
        no: i + 1,
        sku: c.sku,
        name: c.name,
        qty: c.qty,
        price: c.unitPrice,
        discount: Number(c.lineDiscount || 0),
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
      // ใช้ axios instance เพื่อแนบ token + baseURL
      const { data } = await api.post("/api/sales/branch", payload);
      // สำเร็จ → เคลียร์สถานะ
      setCart([]);
      setDiscountBill({ type: "amount", value: 0 });
      setNote("");
      setOpenPayment(false);
      docsTableRef.current?.reload?.();
    } catch (e) {
      console.error(e);
      alert("บันทึก/ชำระเงินไม่สำเร็จ");
    }
  }

  function handleScanDetected(code) {
    setQ(String(code || "").trim());
    setOpenScanner(false);
    focusSearch();
  }

  const branchTitle = role === "ADMIN"
    ? (branchCtx?.name || "ยังไม่เลือกสาขา")
    : (fixedBranch?.name || "ไม่ทราบสาขา");

  return (
    <div className="space-y-6">
      <GradientPanel
        title={`POS — ${branchTitle}`}
        subtitle="ค้นหาหรือสแกนเพื่อเพิ่มสินค้าอย่างรวดเร็ว"
        actions={
          <div className="flex items-center gap-3 flex-wrap relative">
            <BranchSwitcher
              role={role}
              fixedBranch={fixedBranch}
              fetchPath="/api/branches"
              onChange={(ctx) => setBranchCtx(ctx)}
            />

            {/* ช่องค้นหาหลัก + Autocomplete */}
            <div ref={containerRef} className="relative w-[360px] max-w-full text-gray-800">
              <Input
                id="pos-search"
                placeholder="ค้นหา: บาร์โค้ด / SKU / ชื่อสินค้า"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onSearchKeyDown}
                onFocus={() => { if (suggests.length) setOpenSuggest(true); }}
              />
              {openSuggest && suggests.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {suggests.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => chooseSuggestByIndex(i)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between ${i === highlight ? "bg-blue-50" : "bg-white"} hover:bg-blue-50`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-xs text-slate-800 ml-3">{s.barcode || s.sku || "-"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              />
            </Card.Body>
          </Card>

          <SummaryPanel
            subtotal={subtotal}
            billDiscountAmount={billDiscountAmount}
            discountBill={discountBill}
            setDiscountBill={setDiscountBill}
            total={total}
            role={role}
            canEditPrice={canEditPrice}
            discountCaps={discountCaps}
            onOpenPayment={handleOpenPayment}
            note={note}
            setNote={setNote}
            cartEmpty={cart.length === 0}
          />
        </div>
      </GradientPanel>

      <BarcodeScannerModal open={openScanner} onClose={() => setOpenScanner(false)} onDetected={handleScanDetected} />

      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} total={total} role={role} onConfirm={onConfirmPayment} />

      {/* ใช้ค่าเริ่มต้น apiPath = "/api/sales/branch" ซึ่งตรงกับ backend */}
      <SalesDocsTable ref={docsTableRef} branchId={currentBranchId} />
    </div>
  );
}
