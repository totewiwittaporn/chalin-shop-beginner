import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import GradientPanel from "@/components/theme/GradientPanel";
import GlassModal from "@/components/theme/GlassModal";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import PrintDoc from "@/components/docs/PrintDoc";
import { DOC_TYPES } from "@/config/docTemplates";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { Search, ScanLine, Plus, Trash2, Printer, Download, RefreshCcw } from "lucide-react";

const money = (v) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(v || 0));

export default function ConsignmentDeliveryPage() {
  const user = useAuthStore((s) => s.user);
  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isConsign = role === "CONSIGN" || role === "CONSIGNMENT" || role === "CONSIGN_PARTNER";

  const [actionType, setActionType] = useState(isConsign ? "RETURN" : "SEND");

  // [1] เลือกต้นทาง/ปลายทาง
  const [branches, setBranches] = useState([]);
  const [partners, setPartners] = useState([]);
  const [branchQ, setBranchQ] = useState("");
  const [partnerQ, setPartnerQ] = useState("");
  const [fromBranchId, setFromBranchId] = useState(null);
  const [toBranchId, setToBranchId] = useState(null);
  const [toPartnerId, setToPartnerId] = useState(null);

  useEffect(() => {
    (async () => {
      const [brRes, ptRes] = await Promise.all([
        api.get("/api/branches"),
        api.get("/api/consignment/partners", { params: { page: 1, pageSize: 100 } }),
      ]);
      const brs = brRes?.data?.items || brRes?.data || [];
      const pts = ptRes?.data?.items || ptRes?.data || [];
      setBranches(brs);
      setPartners(pts);

      if (isAdmin) {
        if (!fromBranchId && brs.length) setFromBranchId(brs[0].id);
        if (!toPartnerId && pts.length) setToPartnerId(pts[0].id);
        if (!toBranchId && brs.length) setToBranchId((brs.find((b) => b.isMain) || brs[0]).id);
      } else if (isConsign) {
        const myBranchId = user?.branchId || brs.find((b) => b.isMyBranch)?.id || brs[0]?.id || null;
        setFromBranchId(myBranchId);
        const main = brs.find((b) => b.isMain) || brs[0];
        setToBranchId(main?.id || null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [2] ค้นหา
  const [lineMode, setLineMode] = useState("ITEM"); // ITEM | CATEGORY
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [openScanner, setOpenScanner] = useState(false);
  const lastScanTimeRef = useRef(0);

  const canSearch = useMemo(() => {
    if (lineMode === "ITEM") return true;
    return !!toPartnerId; // CATEGORY ต้องมี partner
  }, [lineMode, toPartnerId]);

  async function runSearch() {
    if (!canSearch) return;
    setSearching(true);
    try {
      if (lineMode === "ITEM") {
        const { data } = await api.get("/api/products/search", { params: { q, page: 1, pageSize: 50 } });
        setResults(data?.items || data || []);
      } else {
        const { data } = await api.get(`/api/consignment/partners/${toPartnerId}/categories`, { params: { q, page: 1, pageSize: 50 } });
        const cats = data?.items || [];
        const merged = [];
        for (const c of cats) {
          const r = await api.get(`/api/consignment/categories/${c.id}/products`);
          const items = r?.data?.items || r?.data || [];
          items.forEach((p) => merged.push({ ...p, __cat: { id: c.id, code: c.code, name: c.name } }));
        }
        setResults(merged);
      }
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, lineMode, toPartnerId]);

  // [3] ตะกร้า
  const [lines, setLines] = useState([]);

  function addLine(item) {
    const exist = lines.find((l) => l.productId === item.id);
    if (exist) {
      setLines((prev) => prev.map((l) => (l.productId === item.id ? { ...l, qty: l.qty + 1 } : l)));
    } else {
      setLines((prev) => [
        ...prev,
        {
          productId: item.id,
          barcode: item.barcode,
          name: item.name,
          unitPrice: Number(item.salePrice || item.unitPrice || 0),
          qty: 1,
          categoryId: item.__cat?.id || null,
          displayName: item.__cat ? item.name : undefined, // เผื่อ override
        },
      ]);
    }
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
  const [createdDoc, setCreatedDoc] = useState(null);

  async function saveDocument() {
    if (!lines.length) return alert("ยังไม่มีสินค้าในรายการ");

    if (isAdmin) {
      if (actionType === "SEND" && (!fromBranchId || !toPartnerId)) return alert("โปรดเลือกสาขาต้นทางและร้านฝากขายปลายทาง");
      if (actionType === "RETURN" && (!fromBranchId || !toBranchId)) return alert("โปรดเลือกสาขาต้นทางและสาขาปลายทาง");
    } else if (isConsign) {
      if (actionType !== "RETURN") return alert("ผู้ใช้ CONSIGN ทำได้เฉพาะการคืนของเท่านั้น");
      if (!fromBranchId || !toBranchId) return alert("ไม่พบข้อมูลสาขาต้นทาง/ปลายทาง");
    }

    setSaving(true);
    try {
      const payload = {
        actionType,
        lineMode,
        fromBranchId,
        toPartnerId: actionType === "SEND" ? toPartnerId : null,
        toBranchId: actionType === "RETURN" ? toBranchId : null,
        lines: lines.map(({ productId, qty, unitPrice, categoryId, displayName }) => ({
          productId,
          qty,
          unitPrice,
          categoryId,
          displayName,
        })),
        note: lineMode === "CATEGORY" ? "ส่งแบบอิงหมวดร้านฝากขาย" : "ส่งแบบอิงสินค้า",
      };
      const res = await api.post("/api/deliveries/consignment", payload);
      const doc = res?.data?.doc || null;
      setCreatedDoc(doc);
      await loadDocs();
      setLines([]);
      alert("บันทึกใบส่งสินค้าเรียบร้อย");
    } finally {
      setSaving(false);
    }
  }

  // [4] เอกสาร
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docQ, setDocQ] = useState("");

  async function loadDocs() {
    setDocsLoading(true);
    try {
      const { data } = await api.get("/api/deliveries/consignment", { params: { q: docQ, page: 1, pageSize: 30 } });
      setDocs(data?.items || data || []);
    } finally {
      setDocsLoading(false);
    }
  }
  useEffect(() => { loadDocs(); }, []);
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

  return (
    <div className="min-h-[calc(100vh-140px)] w-full p-4 sm:p-6 md:p-8">
      <div className="grid gap-6">
        {/* STEP 1 */}
        <GradientPanel
          title="1) เลือกร้านค้า / จุดส่ง-รับ"
          subtitle={isAdmin ? "ADMIN: เลือกสาขาต้นทาง-ปลายทางได้" : "CONSIGN: คืนสินค้าจากสาขาของคุณไปยังสาขาหลักเท่านั้น"}
          actions={
            <div className="flex items-center gap-2">
              <label className="text-white/90 text-sm">โหมดเอกสาร</label>
              <select
                className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                disabled={isConsign}
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                <option value="SEND">ส่งไปยังร้านฝากขาย</option>
                <option value="RETURN">คืนกลับสาขาหลัก</option>
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
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" placeholder="ค้นหาสาขา" value={branchQ} onChange={(e) => setBranchQ(e.target.value)} />
              </div>
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                disabled={!isAdmin && isConsign}
                value={fromBranchId || ""}
                onChange={(e) => setFromBranchId(Number(e.target.value) || null)}
              >
                {branches
                  .filter((b) => (branchQ ? `${b.code ?? ""} ${b.name ?? ""}`.toLowerCase().includes(branchQ.toLowerCase()) : true))
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.code ? `[${b.code}] ` : ""}{b.name}</option>
                  ))}
              </select>
            </div>

            {/* to (partner or branch) */}
            {actionType === "SEND" ? (
              <div className="grid gap-2">
                <div className="text-sm font-medium text-slate-600">ปลายทาง: ร้านฝากขาย</div>
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none" placeholder="ค้นหาร้านฝากขาย" value={partnerQ} onChange={(e) => setPartnerQ(e.target.value)} />
                </div>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                  disabled={!isAdmin}
                  value={toPartnerId || ""}
                  onChange={(e) => setToPartnerId(Number(e.target.value) || null)}
                >
                  {partners
                    .filter((p) => (partnerQ ? `${p.code ?? ""} ${p.name ?? ""}`.toLowerCase().includes(partnerQ.toLowerCase()) : true))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ""}{p.name}</option>
                    ))}
                </select>
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
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.code ? `[${b.code}] ` : ""}{b.name}{b.isMain ? " (หลัก)" : ""}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </GradientPanel>

        {/* STEP 2 */}
        <GradientPanel
          title="2) ค้นหาสินค้า"
          subtitle={lineMode === "ITEM" ? "ค้นหาตามสินค้า (SKU/ชื่อ/บาร์โค้ด)" : "ค้นหาหมวดร้านฝากขาย แล้วเลือกสินค้าที่อยู่ในหมวดนั้น"}
          actions={
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                value={lineMode}
                onChange={(e) => setLineMode(e.target.value)}
              >
                <option value="ITEM">โหมด ITEM (ชื่อสินค้าปกติ)</option>
                <option value="CATEGORY">โหมด CATEGORY (ชื่อจากหมวดร้านฝากขาย)</option>
              </select>
              <Button kind="white" leftIcon={<ScanLine size={16} />} onClick={() => setOpenScanner(true)}>สแกนบาร์โค้ด</Button>
            </div>
          }
        >
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
              placeholder={lineMode === "ITEM" ? "พิมพ์ชื่อ/บาร์โค้ดสินค้า" : "พิมพ์ชื่อหมวดของร้านฝากขาย"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button kind="success" onClick={runSearch} disabled={!canSearch || searching}>{searching ? "กำลังค้นหา..." : "ค้นหา"}</Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th className="w-[140px]">Barcode</Table.Th>
                  <Table.Th>ชื่อสินค้า{lineMode === "CATEGORY" ? " / หมวด" : ""}</Table.Th>
                  <Table.Th className="w-[120px] text-right">ราคา</Table.Th>
                  <Table.Th className="w-[120px] text-right">เครื่องมือ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body loading={searching}>
                {results.map((it) => (
                  <Table.Tr key={`${it.id}-${it.__cat?.id || "item"}`}>
                    <Table.Td className="font-mono">{it.barcode || "-"}</Table.Td>
                    <Table.Td>
                      <div className="flex flex-col">
                        <span>{it.name}</span>
                        {it.__cat && <span className="text-xs text-slate-500">[{it.__cat.code || "-"}] {it.__cat.name}</span>}
                      </div>
                    </Table.Td>
                    <Table.Td className="text-right">{money(it.salePrice ?? it.unitPrice ?? 0)}</Table.Td>
                    <Table.Td className="text-right">
                      <Button kind="success" size="sm" onClick={() => addLine(it)} leftIcon={<Plus size={14} />}>เพิ่ม</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!searching && results.length === 0 && (
                  <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-6">ไม่มีผลลัพธ์</Table.Td></Table.Tr>
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
              <Button kind="success" onClick={saveDocument} disabled={saving || !lines.length}>{saving ? "กำลังบันทึก..." : "บันทึกเอกสารส่งของ"}</Button>
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
                    <Table.Td>
                      <div className="flex flex-col">
                        <span>{l.displayName || l.name}</span>
                        {l.categoryId && <span className="text-xs text-slate-500">[CAT #{l.categoryId}]</span>}
                      </div>
                    </Table.Td>
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
                      <Button kind="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => removeLine(l.productId)}>ลบ</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {lines.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6} className="text-center text-slate-500 py-6">ยังไม่มีสินค้าในรายการ</Table.Td></Table.Tr>
                )}
              </Table.Body>
            </Table.Root>
          </div>

          {createdDoc && (
            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-medium text-slate-600 mb-2">เอกสารที่เพิ่งบันทึก</div>
              <PrintDoc
                doc={{
                  header: {
                    docType: DOC_TYPES.DELIVERY_CONSIGNMENT,
                    docNo: createdDoc.docNo || createdDoc.no || "DLV-CN-XXXX",
                    docDate: createdDoc.docDate || createdDoc.date || new Date().toISOString().slice(0, 10),
                    title: actionType === "RETURN" ? "RETURN" : "DELIVERY",
                  },
                  issuer: createdDoc.issuer,
                  recipient: createdDoc.recipient,
                  lines: createdDoc.items || createdDoc.lines,
                  money: createdDoc.money || { grand: createdDoc.total },
                  payment: createdDoc.payment,
                }}
              />
            </div>
          )}
        </GradientPanel>

        {/* STEP 4 */}
        <GradientPanel
          title="4) รายการใบส่งสินค้า"
          subtitle="ค้นหาย้อนหลังและพิมพ์เอกสารได้"
          actions={
            <div className="flex items-center gap-2">
              <Button kind="white" leftIcon={<RefreshCcw size={16} />} onClick={loadDocs}>รีเฟรช</Button>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-white/80" />
                <input className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900" placeholder="ค้นหาเลขที่/คู่ค้า/สาขา" value={docQ} onChange={(e) => setDocQ(e.target.value)} />
              </div>
            </div>
          }
        >
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th className="w-[160px]">เลขที่เอกสาร</Table.Th>
                  <Table.Th className="w-[120px]">วันที่</Table.Th>
                  <Table.Th>ผู้รับ/ร้านฝากขาย</Table.Th>
                  <Table.Th className="w-[140px] text-right">ยอดสุทธิ</Table.Th>
                  <Table.Th className="w-[160px] text-right">เครื่องมือ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body loading={docsLoading}>
                {docs.map((d) => (
                  <Table.Tr key={d.id}>
                    <Table.Td className="font-mono">{d.docNo || d.no}</Table.Td>
                    <Table.Td>{(d.docDate || d.date || "").slice(0, 10)}</Table.Td>
                    <Table.Td>{d.recipient?.name || d.partnerName || "-"}</Table.Td>
                    <Table.Td className="text-right">{money(d.money?.grand || d.total || 0)}</Table.Td>
                    <Table.Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" kind="white" leftIcon={<Printer size={14} />} onClick={() => window.open(`/api/deliveries/consignment/${d.id}/print`, "_blank")}>พิมพ์</Button>
                        <Button size="sm" kind="white" leftIcon={<Download size={14} />} onClick={() => window.open(`/api/deliveries/consignment/${d.id}/print?format=pdf`, "_blank")}>PDF</Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!docsLoading && docs.length === 0 && (
                  <Table.Tr><Table.Td colSpan={5} className="text-center text-slate-500 py-6">ไม่พบเอกสาร</Table.Td></Table.Tr>
                )}
              </Table.Body>
            </Table.Root>
          </div>
        </GradientPanel>
      </div>

      <BarcodeScannerModal open={openScanner} onClose={() => setOpenScanner(false)} onDetected={onScanDetected} />

      <GlassModal open={false} title="สรุปการทำงานของหน้า" onClose={() => {}}>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          <li>ADMIN เลือกต้นทาง-ปลายทางได้อิสระ, CONSIGN ทำได้เฉพาะ RETURN (สาขาตัวเอง → สาขาหลัก)</li>
          <li>โหมด ITEM: ค้นหาสินค้าปกติ (ชื่อ/บาร์โค้ด)</li>
          <li>โหมด CATEGORY: ค้นหาหมวดของร้านฝากขาย แล้วเลือกสินค้าที่อยู่ในหมวดนั้น</li>
          <li>เพิ่มสินค้าเข้ารายการ, กำหนดจำนวน, บันทึกเอกสาร</li>
          <li>ดู/ค้นหาเอกสารย้อนหลังและพิมพ์ได้</li>
        </ul>
      </GlassModal>
    </div>
  );
}
