// client/src/pages/delivery/consignment/ConsignmentDelivery.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import GradientPanel from "@/components/theme/GradientPanel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { Search, ScanLine, Plus, Trash2, RefreshCcw } from "lucide-react";
// ✅ NEW: ปุ่มสร้าง/พิมพ์เอกสาร
import CreateDeliveryDocButton from "@/components/docs/CreateDeliveryDocButton.jsx";

const money = (v) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(v || 0));

const isHTML = (data) => typeof data === "string" && /^\s*<!doctype html>/i.test(data);
const arrayify = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && typeof resData === "object") {
    for (const k of ["items", "data", "rows", "result", "results", "list"]) {
      if (Array.isArray(resData[k])) return resData[k];
    }
  }
  return [];
};
const normalizeBranch = (b) => ({
  ...b,
  id: b?.id ?? b?.branchId ?? b?.uid ?? null,
  name: b?.name ?? b?.branchName ?? b?.title ?? b?.displayName ?? "",
  code: b?.code ?? b?.shortCode ?? "",
  isMain: Boolean(b?.isMain ?? b?.main),
  isMyBranch: Boolean(b?.isMyBranch),
});
const normalizePartner = (p) => ({
  ...p,
  id: p?.id ?? p?.partnerId ?? p?.uid ?? null,
  name: p?.name ?? p?.partnerName ?? p?.title ?? p?.displayName ?? "",
  code: p?.code ?? p?.partnerCode ?? "",
});

export default function ConsignmentDeliveryPage() {
  const user = useAuthStore((s) => s.user);
  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isConsign = role === "CONSIGN" || role === "CONSIGNMENT" || role === "CONSIGN_PARTNER";

  // โหมดทำรายการ
  const [mode, setMode] = useState(isConsign ? "RETURN" : "SEND"); // 'SEND' | 'RETURN'

  // [1] เลือกต้นทาง/ปลายทาง
  const [branches, setBranches] = useState([]);
  const [partners, setPartners] = useState([]);
  const [branchQ, setBranchQ] = useState("");
  const [partnerQ, setPartnerQ] = useState("");
  const [fromBranchId, setFromBranchId] = useState(null);
  const [toBranchId, setToBranchId] = useState(null);
  const [toPartnerId, setToPartnerId] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setMetaLoading(true);
        setMetaError("");

        const [brRes, ptRes] = await Promise.all([
          api.get("/api/branches"),
          api.get("/api/consignment/partners", { params: { page: 1, pageSize: 100 } }),
        ]);

        if (isHTML(brRes?.data)) throw new Error("API /api/branches ส่ง HTML กลับมา (ปลายทางไม่ใช่ JSON)");
        if (isHTML(ptRes?.data)) throw new Error("API /api/consignment/partners ส่ง HTML กลับมา (ปลายทางไม่ใช่ JSON)");

        const brs = arrayify(brRes?.data).map(normalizeBranch).filter((b) => b.id != null);
        const pts = arrayify(ptRes?.data).map(normalizePartner).filter((p) => p.id != null);

        setBranches(brs);
        setPartners(pts);

        if (isAdmin) {
          if (!fromBranchId && brs.length) setFromBranchId(brs[0].id);
          if (!toPartnerId && pts.length) setToPartnerId(pts[0].id);
          if (!toBranchId && brs.length) {
            const main = brs.find((b) => b.isMain) || brs[0];
            setToBranchId(main?.id || null);
          }
        } else if (isConsign) {
          const myBranchId =
            user?.branchId ||
            brs.find((b) => b.isMyBranch)?.id ||
            brs[0]?.id ||
            null;
          setFromBranchId(myBranchId);
          const main = brs.find((b) => b.isMain) || brs[0];
          setToBranchId(main?.id || null);
        }
      } catch (err) {
        console.error("[ConsignmentDelivery] meta load error:", err);
        setMetaError(err?.response?.data?.message || err?.message || "โหลดข้อมูลสาขา/ร้านฝากขายไม่สำเร็จ");
        setBranches([]);
        setPartners([]);
      } finally {
        setMetaLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [2] ค้นหาสินค้า (ชื่อ/บาร์โค้ด)
  const [q, setQ] = useState("");
  
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // 🔧 Scanner state (ประกาศครั้งเดียวที่นี่)
  const [openScanner, setOpenScanner] = useState(false);
  const lastScanTimeRef = useRef(0);

  const canSearch = useMemo(() => true, []);

  async function runSearch() {
    if (!canSearch) return;
    setSearching(true);
    try {
      const { data } = await api.get("/api/products/search", { params: { q, page: 1, pageSize: 50 } });
      setResults(arrayify(data));
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // [3] ตะกร้า
  const [lines, setLines] = useState([]);

  function addLine(item) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === item.id);
      const unitPrice = Number(item.salePrice ?? item.unitPrice ?? item.basePrice ?? 0);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1, unitPrice: next[idx].unitPrice ?? unitPrice };
        return next;
      }
      return [
        ...prev,
        {
          productId: item.id,
          barcode: item.barcode,
          name: item.name,
          unitPrice,
          qty: 1,
          displayName: item.name,
        },
      ];
    });
  }
  function updateQty(productId, qty) {
    const qNum = Math.max(1, Number(qty || 1));
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: qNum } : l)));
  }
  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }
  function clearLines() {
    setLines([]);
  }

  const [saving, setSaving] = useState(false);

  async function saveDocument(asDraft = false) {
    if (!lines.length) return alert("ยังไม่มีสินค้าในรายการ");

    if (isAdmin) {
      if (mode === "SEND" && (!fromBranchId || !toPartnerId)) return alert("โปรดเลือกสาขาต้นทางและร้านฝากขายปลายทาง");
      if (mode === "RETURN" && (!fromBranchId || !toBranchId)) return alert("โปรดเลือกสาขาต้นทางและสาขาปลายทาง");
    } else if (isConsign) {
      if (mode !== "RETURN") return alert("ผู้ใช้ CONSIGN ทำได้เฉพาะการคืนของเท่านั้น");
      if (!fromBranchId || !toBranchId) return alert("ไม่พบข้อมูลสาขาต้นทาง/ปลายทาง");
    }

    setSaving(true);
    try {
      const payload = {
        mode, // 'SEND' | 'RETURN'
        fromBranchId,
        toPartnerId: mode === "SEND" ? toPartnerId : null,
        toBranchId: mode === "RETURN" ? toBranchId : null,
        status: asDraft ? "DRAFT" : "SENT",
        lines: lines.map(({ productId, qty, unitPrice, displayName }) => ({
          productId,
          qty,
          unitPrice,
          displayName,
        })),
        note: mode === "RETURN" ? "คืนสินค้าจากฝากขาย" : "ส่งสินค้าฝากขาย",
      };
      await api.post("/api/consignment-deliveries", payload);
      await loadDocs();
      setLines([]);
      alert(asDraft ? "บันทึกร่างเรียบร้อย" : "บันทึกใบส่งสินค้าเรียบร้อย");
    } finally {
      setSaving(false);
    }
  }

  // [4] เอกสาร (ประวัติ)
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docQ, setDocQ] = useState("");

  async function loadDocs() {
    setDocsLoading(true);
    try {
      const { data } = await api.get("/api/consignment-deliveries", { params: { q: docQ, page: 1, pageSize: 30 } });
      const arr = Array.isArray(data?.items) ? data.items : arrayify(data);
      setDocs(arr);
    } finally {
      setDocsLoading(false);
    }
  }
  useEffect(() => {
    loadDocs();
  }, []);
  useEffect(() => {
    const t = setTimeout(loadDocs, 300);
    return () => clearTimeout(t);
  }, [docQ]);

  // สแกน
  function onScanDetected(code) {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 800) return;
    lastScanTimeRef.current = now;
    setQ(code || "");
    setOpenScanner(false);
  }

  // UI helpers
  function StatusChip({ status }) {
    const st = String(status || "").toUpperCase();
    if (st === "DRAFT")
      return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">ร่าง</span>;
    if (st === "SENT")
      return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs">ส่ง</span>;
    if (st === "RECEIVED")
      return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs">รับ</span>;
    if (st === "COMPLETED")
      return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs">เสร็จ</span>;
    if (st === "CANCELLED")
      return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs">ยกเลิก</span>;
    return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">{st || "-"}</span>;
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full p-4 sm:p-6 md:p-8">
      <div className="grid gap-6">
        {/* STEP 1 */}
        <GradientPanel
          title="1) เลือกร้านค้า / จุดส่ง-รับ"
          subtitle={isAdmin ? "ADMIN: เลือกสาขาต้นทาง-ปลายทางได้" : "CONSIGN: คืนสินค้าจากสาขาของคุณไปยังสาขาหลักเท่านั้น"}
          actions={
            <div className="flex items-center gap-2">
              <label className="text-white/90 text-sm">โหมดทำรายการ</label>
              <select
                className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                disabled={isConsign}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="SEND">ส่งไปยังร้านฝากขาย</option>
                <option value="RETURN">รับคืนเข้าที่สาขา</option>
              </select>
            </div>
          }
        >
          <div className="grid sm:grid-cols-2 gap-3">
            {/* from */}
            <div className="grid gap-2">
              <div className="text-sm font-medium text-slate-600">สาขาต้นทาง</div>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                <input
                  className="w/full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                  placeholder="ค้นหาสาขา"
                  value={branchQ}
                  onChange={(e) => setBranchQ(e.target.value)}
                />
              </div>
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                disabled={!isAdmin && isConsign}
                value={fromBranchId || ""}
                onChange={(e) => setFromBranchId(Number(e.target.value) || null)}
              >
                <option value="">— เลือกสาขา —</option>
                {branches
                  .filter((b) =>
                    branchQ ? `${b.code ?? ""} ${b.name ?? ""}`.toLowerCase().includes(branchQ.toLowerCase()) : true
                  )
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `[${b.code}] ` : ""}{b.name}{b.isMain ? " (หลัก)" : ""}
                    </option>
                  ))}
              </select>
              {metaLoading && <div className="text-xs text-slate-500">กำลังโหลดรายการสาขา...</div>}
              {metaError && <div className="text-xs text-red-600">{metaError}</div>}
            </div>

            {/* to (partner or branch) */}
            {mode === "SEND" ? (
              <div className="grid gap-2">
                <div className="text-sm font-medium text-slate-600">ปลายทาง: ร้านฝากขาย</div>
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    className="w/full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                    placeholder="ค้นหาร้านฝากขาย"
                    value={partnerQ}
                    onChange={(e) => setPartnerQ(e.target.value)}
                  />
                </div>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                  disabled={!isAdmin}
                  value={toPartnerId || ""}
                  onChange={(e) => setToPartnerId(Number(e.target.value) || null)}
                >
                  <option value="">— เลือกร้านฝากขาย —</option>
                  {partners
                    .filter((p) =>
                      partnerQ ? `${p.code ?? ""} ${p.name ?? ""}`.toLowerCase().includes(partnerQ.toLowerCase()) : true
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ` : ""}{p.name}
                      </option>
                    ))}
                </select>
                {metaLoading && <div className="text-xs text-slate-500">กำลังโหลดร้านฝากขาย...</div>}
                {metaError && <div className="text-xs text-red-600">{metaError}</div>}
              </div>
            ) : (
              <div className="grid gap-2">
                <div className="text-sm font-medium text-slate-600">ปลายทาง: สาขา</div>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                  disabled={!isAdmin && isConsign}
                  value={toBranchId || ""}
                  onChange={(e) => setToBranchId(Number(e.target.value) || null)}
                >
                  <option value="">— เลือกสาขา —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `[${b.code}] ` : ""}{b.name}{b.isMain ? " (หลัก)" : ""}
                    </option>
                  ))}
                </select>
                {metaLoading && <div className="text-xs text-slate-500">กำลังโหลดรายการสาขา...</div>}
                {metaError && <div className="text-xs text-red-600">{metaError}</div>}
              </div>
            )}
          </div>
        </GradientPanel>

        {/* STEP 2 */}
        <GradientPanel
          title="2) ค้นหาสินค้า"
          subtitle="ค้นหาตาม SKU/ชื่อ/บาร์โค้ด — ระบบจะใช้ 'ชื่อสินค้า' เป็นหลัก"
          actions={
            <div className="flex items-center gap-2">
              <Button kind="white" leftIcon={<ScanLine size={16} />} onClick={() => setOpenScanner(true)}>
                สแกนบาร์โค้ด
              </Button>
            </div>
          }
        >
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
              placeholder="พิมพ์ชื่อ/บาร์โค้ดสินค้า"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button kind="success" onClick={runSearch} disabled={!canSearch || searching}>
              {searching ? "กำลังค้นหา..." : "ค้นหา"}
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th className="w-[140px]">Barcode</Table.Th>
                  <Table.Th>ชื่อสินค้า</Table.Th>
                  <Table.Th className="w-[120px] text-right">ราคา</Table.Th>
                  <Table.Th className="w-[120px] text-right">เครื่องมือ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body loading={searching}>
                {results.map((it) => (
                  <Table.Tr key={it.id}>
                    <Table.Td className="font-mono">{it.barcode || "-"}</Table.Td>
                    <Table.Td>{it.name}</Table.Td>
                    <Table.Td className="text-right">{money(it.salePrice ?? it.unitPrice ?? it.basePrice ?? 0)}</Table.Td>
                    <Table.Td className="text-right">
                      <Button kind="success" size="sm" onClick={() => addLine(it)} leftIcon={<Plus size={14} />}>
                        เพิ่ม
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!searching && results.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center text-slate-500 py-6">
                      ไม่มีผลลัพธ์
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Body>
            </Table.Root>
          </div>
        </GradientPanel>

        {/* STEP 3 */}
        <GradientPanel
          title="3) รายการสินค้าที่จะส่ง / คืน"
          actions={
            <div className="flex items-center gap-2">
              <Button kind="danger" onClick={clearLines}>ล้างรายการ</Button>
              <Button kind="white" onClick={() => saveDocument(true)} disabled={saving || !lines.length}>
                {saving ? "กำลังบันทึก..." : "บันทึกร่าง"}
              </Button>
            </div>
          }
        >
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th className="w-[140px]">Barcode</Table.Th>
                  <Table.Th>สินค้า</Table.Th>
                  <Table.Th className="w-[120px] text-right">ราคา/หน่วย</Table.Th>
                  <Table.Th className="w-[160px] text-right">จำนวน</Table.Th>
                  <Table.Th className="w-[120px] text-right">รวม</Table.Th>
                  <Table.Th className="w-[120px] text-right">เครื่องมือ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body>
                {lines.map((l) => (
                  <Table.Tr key={l.productId}>
                    <Table.Td className="font-mono">{l.barcode || "-"}</Table.Td>
                    <Table.Td>{l.displayName || l.name}</Table.Td>
                    <Table.Td className="text-right">{money(l.unitPrice)}</Table.Td>
                    <Table.Td className="text-right">
                      <input
                        type="number"
                        min={1}
                        className="w-[120px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-right"
                        value={l.qty}
                        onChange={(e) => updateQty(l.productId, e.target.value)}
                      />
                    </Table.Td>
                    <Table.Td className="text-right">{money(l.unitPrice * l.qty)}</Table.Td>
                    <Table.Td className="text-right">
                      <Button kind="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => removeLine(l.productId)}>
                        ลบ
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {lines.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="text-center text-slate-500 py-6">
                      ยังไม่มีสินค้าในรายการ
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Body>
            </Table.Root>
          </div>
        </GradientPanel>

        {/* STEP 4 */}
        <GradientPanel
          title="4) รายการใบส่งสินค้า (Consignment)"
          subtitle="ค้นหาย้อนหลัง และเปิดดูรายละเอียด/จัดการสถานะ"
          actions={
            <div className="flex items-center gap-2">
              <Button kind="white" leftIcon={<RefreshCcw size={16} />} onClick={loadDocs}>
                รีเฟรช
              </Button>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-white/80" />
                <input
                  className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                  placeholder="ค้นหาเลขที่/คู่ค้า/สาขา"
                  value={docQ}
                  onChange={(e) => setDocQ(e.target.value)}
                />
              </div>
            </div>
          }
        >
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th className="w-[160px]">เลขที่</Table.Th>
                  <Table.Th className="w-[120px]">วันที่</Table.Th>
                  <Table.Th>ปลายทาง</Table.Th>
                  <Table.Th className="w-[140px] text-right">ยอดสุทธิ</Table.Th>
                  <Table.Th className="w-[120px] text-center">สถานะ</Table.Th>
                  <Table.Th className="w-[520px] text-right">เครื่องมือ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body loading={docsLoading}>
                {docs.map((d) => {
                  const recipientName = d.toPartner?.name || d.toBranch?.name || d.recipient?.name || "-";
                  const code = d.code || d.docNo || d.no || `CD-${d.id}`;
                  const dateStr = (d.date || d.docDate || "").slice(0, 10);
                  const total = d.total ?? d.money?.grand ?? 0;
                  const status = String(d.status || "SENT").toUpperCase();

                  return (
                    <Table.Tr key={d.id}>
                      <Table.Td className="font-mono">{code}</Table.Td>
                      <Table.Td>{dateStr}</Table.Td>
                      <Table.Td>{recipientName}</Table.Td>
                      <Table.Td className="text-right">{money(total)}</Table.Td>
                      <Table.Td className="text-center"><StatusChip status={status} /></Table.Td>
                      <Table.Td className="text-right">
                        <div className="flex flex-wrap gap-2 justify-end">
                          {/* ✅ NEW: สร้างเอกสาร/พิมพ์ใบส่ง (A4) จาก Document system */}
                          <CreateDeliveryDocButton deliveryId={d.id} kind="consignment" />

                          {/* ร่าง → ดูตัวอย่าง + ยืนยันส่ง */}
                          {status === "DRAFT" && (
                            <>
                              <Button size="sm" kind="white" onClick={() => window.open(`/api/consignment-deliveries/${d.id}`, "_blank")}>
                                ดูตัวอย่างเอกสาร
                              </Button>
                              <Button
                                size="sm"
                                kind="success"
                                onClick={async () => {
                                  await api.patch(`/api/consignment-deliveries/${d.id}/status`, { status: "SENT" });
                                  await loadDocs();
                                  alert("ยืนยันส่งเรียบร้อย");
                                }}
                              >
                                ยืนยันส่ง
                              </Button>
                            </>
                          )}

                          {/* ส่ง → ดู/พิมพ์ + ยืนยันรับ */}
                          {status === "SENT" && (
                            <>
                              <Button size="sm" kind="white" onClick={() => window.open(`/api/consignment-deliveries/${d.id}`, "_blank")}>
                                ดู/พิมพ์ใบส่งสินค้า
                              </Button>
                              <Button
                                size="sm"
                                kind="success"
                                onClick={async () => {
                                  await api.patch(`/api/consignment-deliveries/${d.id}/confirm`, { items: [] });
                                  await loadDocs();
                                  alert("ยืนยันรับสินค้าแล้ว (สถานะเป็น 'รับ')");
                                }}
                              >
                                ยืนยันรับ
                              </Button>
                            </>
                          )}

                          {/* รับ → ตรวจสอบ/แก้จำนวน + ปิดงานเป็น เสร็จ */}
                          {status === "RECEIVED" && (
                            <>
                              <Button
                                size="sm"
                                kind="white"
                                onClick={() => {
                                  // TODO: modal ตรวจสอบ/แก้จำนวนจริง
                                  alert("เร็ว ๆ นี้: หน้าต่างตรวจสอบ/แก้จำนวนจริงรายบรรทัด");
                                }}
                              >
                                ตรวจสอบ/แก้จำนวน
                              </Button>
                              <Button
                                size="sm"
                                kind="success"
                                onClick={async () => {
                                  await api.patch(`/api/consignment-deliveries/${d.id}/status`, { status: "COMPLETED" });
                                  await loadDocs();
                                  alert("ปิดงานเป็น 'เสร็จ' แล้ว");
                                }}
                              >
                                ปิดงาน → เสร็จ
                              </Button>
                            </>
                          )}

                          {/* เสร็จ → ดู/พิมพ์ */}
                          {status === "COMPLETED" && (
                            <Button size="sm" kind="white" onClick={() => window.open(`/api/consignment-deliveries/${d.id}`, "_blank")}>
                              ดู/พิมพ์ใบส่งสินค้า
                            </Button>
                          )}
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {!docsLoading && docs.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="text-center text-slate-500 py-6">ไม่พบรายการ</Table.Td>
                  </Table.Tr>
                )}
              </Table.Body>
            </Table.Root>
          </div>
        </GradientPanel>
      </div>

      <BarcodeScannerModal open={openScanner} onClose={() => setOpenScanner(false)} onDetected={onScanDetected} />
    </div>
  );
}
