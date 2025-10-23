// frontend/.../ConsignmentDelivery.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import GradientPanel from "@/components/theme/GradientPanel";
import ConfirmClearModal from "@/components/delivery/consignment/ConfirmClearModal";
import ConfirmSaveModal from "@/components/delivery/consignment/ConfirmSaveModal";

// ★★★ FIX: ตั้ง baseURL ให้ถูกต้อง
// ตั้งใน .env.development => VITE_API_BASE_URL="http://localhost:3000"
// ถ้าไม่ได้ตั้ง proxy ใช้ค่านี้; ถ้าตั้ง proxy ไว้ใน vite.config ให้ปล่อยว่างได้
const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL?.trim() ||
  "/api"; // fallback ให้ยิงผ่าน proxy path "/api"

const api = axios.create({
  baseURL: API_BASE,
  // withCredentials: true, // ถ้าต้องส่งคุกกี้ ให้เปิดบรรทัดนี้
});

// ช่วยตรวจว่า response กลายเป็น HTML ผิดปลายทางไหม
const isHTML = (data) =>
  typeof data === "string" && /^\s*<!doctype html>/i.test(data);

// ดึง Array จาก response ได้แม้คีย์จะแตกต่างกัน
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.branches)) return data.branches;
  if (Array.isArray(data?.data)) return data.data;
  if (data && typeof data === "object") {
    const firstArray = Object.values(data).find((v) => Array.isArray(v));
    if (Array.isArray(firstArray)) return firstArray;
  }
  return [];
};

const arrayify = (v) => extractArray(v ?? []);

const normalizeBranch = (b) => {
  if (!b || typeof b !== "object") return null;
  const id = b.id ?? b.branchId ?? b.code ?? b.uid ?? null;
  const name = b.name ?? b.branchName ?? b.title ?? b.displayName ?? b.code ?? null;
  return id != null && name != null ? { id, name } : null;
};

const normalizePartner = (p) => {
  if (!p || typeof p !== "object") return null;
  const id = p.id ?? p.partnerId ?? p.code ?? p.uid ?? null;
  const name = p.name ?? p.partnerName ?? p.title ?? p.displayName ?? p.code ?? null;
  return id != null && name != null ? { id, name } : null;
};

function fmtMoney(v) {
  try {
    return Number(v || 0).toLocaleString("th-TH", { style: "currency", currency: "THB" });
  } catch {
    return `${v}`;
  }
}

export default function ConsignmentDelivery() {
  const isAdmin = true;
  const isConsign = false;

  // ฟอร์มเอกสาร
  const [actionType, setActionType] = useState("SEND"); // SEND | RETURN
  const [fromBranchId, setFromBranchId] = useState(null);
  const [toBranchId, setToBranchId] = useState(null);
  const [toPartnerId, setToPartnerId] = useState(null);
  const [note, setNote] = useState("");

  // ดรอปดาวน์
  const [branches, setBranches] = useState([]); // [{id,name}]
  const [partners, setPartners] = useState([]); // [{id,name}]
  const [loadingMeta, setLoadingMeta] = useState(false);

  // สินค้าในรายการ
  const [lines, setLines] = useState([]); // [{ productId, barcode, name, salePrice/price, qty }]
  const [saving, setSaving] = useState(false);

  // modal
  const [openClear, setOpenClear] = useState(false);
  const [openSave, setOpenSave] = useState(false);

  // ค้นหา
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // โหลด branches & partners (ปลอดภัยกับทุกรูปแบบ response + กันกรณีได้ HTML)
  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      try {
        const [b, p] = await Promise.all([
          api.get("/branches"),
          api.get("/consignment/partners"),
        ]);

        if (isHTML(b?.data)) {
          console.error("[ConsignmentDelivery] /branches returned HTML. Check API_BASE or proxy.");
          setBranches([]);
        } else {
          const rawBranches = arrayify(b?.data);
          const normBranches = rawBranches.map(normalizeBranch).filter(Boolean);
          if (!normBranches.length) {
            console.warn("[ConsignmentDelivery] branches: unexpected shape", b?.data);
          }
          setBranches(normBranches);
        }

        if (isHTML(p?.data)) {
          console.error("[ConsignmentDelivery] /consignment/partners returned HTML. Check API_BASE or proxy.");
          setPartners([]);
        } else {
          const rawPartners = arrayify(p?.data);
          const normPartners = rawPartners.map(normalizePartner).filter(Boolean);
          if (!normPartners.length) {
            console.warn("[ConsignmentDelivery] partners: unexpected shape", p?.data);
          }
          setPartners(normPartners);
        }
      } catch (e) {
        console.error(e);
        setBranches([]);
        setPartners([]);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  // ค้นหาสินค้า
  async function doSearch() {
    const q = String(searchText || "").trim();
    if (!q) return setSearchResults([]);
    try {
      const resp = await api.get("/products/search", { params: { q, take: 20 } });
      if (isHTML(resp?.data)) {
        console.error("[ConsignmentDelivery] /products/search returned HTML. Check API_BASE or proxy.");
        setSearchResults([]);
        return;
      }
      const items = arrayify(resp?.data);
      setSearchResults(items);
    } catch (e) {
      console.error(e);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  }

  function addLine(p, qty = 1) {
    setLines((prev) => {
      const exists = prev.find((x) => x.productId === p.id);
      if (exists) {
        return prev.map((x) =>
          x.productId === p.id ? { ...x, qty: Number(x.qty || 0) + Number(qty || 1) } : x
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          barcode: p.barcode,
          name: p.name,
          // แสดงราคาใน UI — ราคาจริงคำนวณที่ฝั่งเซิร์ฟเวอร์ตอนบันทึก
          salePrice: Number(p.salePrice ?? p.price ?? 0),
          qty: Number(qty || 1),
        },
      ];
    });
  }

  function removeLine(productId) {
    setLines((prev) => prev.filter((x) => x.productId !== productId));
  }

  function updateQty(productId, qty) {
    setLines((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, qty: Math.max(1, Number(qty || 1)) } : x))
    );
  }

  function clearLines() {
    setLines([]);
  }

  const approxTotal = useMemo(() => {
    return lines.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.salePrice ?? it.price ?? 0), 0);
  }, [lines]);

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
        type: actionType,
        fromBranchId,
        toPartnerId: actionType === "SEND" ? toPartnerId : null,
        toBranchId: actionType === "RETURN" ? toBranchId : null,
        notes: note || null,
        lines: lines.map((it) => ({ productId: it.productId, qty: Number(it.qty || 1) })),
      };
      const res = await api.post("/deliveries/consignment", payload);
      if (isHTML(res?.data)) throw new Error("API /deliveries/consignment returned HTML. Check API_BASE or proxy.");
      const doc = res?.data || null;
      if (!doc) throw new Error("ไม่สามารถบันทึกเอกสารได้");

      setLines([]);
      alert("บันทึกใบส่งสินค้าเรียบร้อย");
      // window.open(`${API_BASE}/deliveries/consignment/${doc.id}/print`, "_blank");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "เกิดข้อผิดพลาดในการบันทึกเอกสาร");
    } finally {
      setSaving(false);
    }
  }

  const fromBranchName = branches.find((b) => b.id === fromBranchId)?.name;
  const toBranchName = branches.find((b) => b.id === toBranchId)?.name;
  const toPartnerName = partners.find((p) => p.id === toPartnerId)?.name;

  return (
    <div className="space-y-6">
      <GradientPanel title="ส่งสินค้าร้านฝากขาย">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">ประเภทเอกสาร</label>
            <select
              className="w-full rounded-xl border-gray-300"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <option value="SEND">ส่งไปยังร้านฝากขาย</option>
              <option value="RETURN">คืนเข้าสต็อกสาขา</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">หมายเหตุ</label>
            <input
              className="w-full rounded-xl border-gray-300"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="พิมพ์หมายเหตุ (ถ้ามี)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">สาขาต้นทาง</label>
            <select
              className="w-full rounded-xl border-gray-300"
              value={fromBranchId || ""}
              onChange={(e) => setFromBranchId(Number(e.target.value) || null)}
              disabled={loadingMeta}
            >
              <option value="">{loadingMeta ? "กำลังโหลด..." : "- เลือกสาขา -"}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {actionType === "RETURN" ? (
            <div>
              <label className="block text-sm text-gray-600 mb-1">ปลายทาง (สาขา)</label>
              <select
                className="w-full rounded-xl border-gray-300"
                value={toBranchId || ""}
                onChange={(e) => setToBranchId(Number(e.target.value) || null)}
                disabled={loadingMeta}
              >
                <option value="">{loadingMeta ? "กำลังโหลด..." : "- เลือกสาขา -"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-600 mb-1">ปลายทาง (ร้านฝากขาย)</label>
              <select
                className="w-full rounded-xl border-gray-300"
                value={toPartnerId || ""}
                onChange={(e) => setToPartnerId(Number(e.target.value) || null)}
                disabled={loadingMeta}
              >
                <option value="">{loadingMeta ? "กำลังโหลด..." : "- เลือกร้านฝากขาย -"}</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">ยอดโดยประมาณ</label>
            <div className="h-[38px] flex items-center px-3 rounded-xl border border-gray-200 bg-gray-50">
              <b>{fmtMoney(approxTotal)}</b>
            </div>
          </div>
        </div>
      </GradientPanel>

      <GradientPanel title="เพิ่มสินค้าเข้ารายการ">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border-gray-300"
            placeholder="พิมพ์ชื่อ/สแกนบาร์โค้ด แล้วกด Enter"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="px-4 rounded-xl bg-gray-100 hover:bg-gray-200" onClick={doSearch}>ค้นหา</button>
        </div>

        {!!searchResults.length && (
          <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left w-40">Barcode</th>
                  <th className="px-3 py-2 text-left">สินค้า</th>
                  <th className="px-3 py-2 text-right w-28">ราคาขาย</th>
                  <th className="px-3 py-2 text-right w-20">เพิ่ม</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600">{p.barcode || "-"}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(p.salePrice ?? p.price ?? 0)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => addLine(p, 1)}
                      >
                        + เพิ่ม
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GradientPanel>

      <GradientPanel title="รายการสินค้า">
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left w-40">Barcode</th>
                <th className="px-3 py-2 text-left">สินค้า</th>
                <th className="px-3 py-2 text-right w-24">จำนวน</th>
                <th className="px-3 py-2 text-right w-28">ราคาโดยประมาณ</th>
                <th className="px-3 py-2 text-right w-28">รวม</th>
                <th className="px-3 py-2 text-right w-20">ลบ</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((it) => {
                const price = Number(it.salePrice ?? it.price ?? 0);
                const qty = Number(it.qty || 0);
                const sum = price * qty;
                return (
                  <tr key={it.productId} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600">{it.barcode || "-"}</td>
                    <td className="px-3 py-2">{it.name || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="1"
                        className="w-20 text-right rounded-lg border-gray-300"
                        value={qty}
                        onChange={(e) => updateQty(it.productId, e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">{fmtMoney(price)}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(sum)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => removeLine(it.productId)}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!lines.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                    ยังไม่มีสินค้าในรายการ
                  </td>
                </tr>
              )}
            </tbody>
            {!!lines.length && (
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={4} className="px-3 py-2 text-right"><b>รวมทั้งสิ้น</b></td>
                  <td className="px-3 py-2 text-right font-bold">{fmtMoney(approxTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="mt-3 flex justify-between">
          <button
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={() => setOpenClear(true)}
          >
            ล้างรายการ
          </button>

          <button
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
            disabled={saving || !lines.length}
            onClick={() => setOpenSave(true)}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกเอกสารส่งของ"}
          </button>
        </div>
      </GradientPanel>

      {/* Modals */}
      <ConfirmClearModal
        open={openClear}
        onClose={() => setOpenClear(false)}
        onConfirm={clearLines}
      />
      <ConfirmSaveModal
        open={openSave}
        onClose={() => setOpenSave(false)}
        onConfirm={saveDocument}
        actionType={actionType}
        fromBranchName={fromBranchId ? (branches.find((b) => b.id === fromBranchId)?.name) : ""}
        toBranchName={toBranchId ? (branches.find((b) => b.id === toBranchId)?.name) : ""}
        toPartnerName={toPartnerId ? (partners.find((p) => p.id === toPartnerId)?.name) : ""}
        lines={lines}
      />
    </div>
  );
}
