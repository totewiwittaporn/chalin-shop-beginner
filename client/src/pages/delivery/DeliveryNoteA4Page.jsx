import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "@/lib/api";

import { DeliveryNoteA4 } from "@/components/docs/DeliveryNoteA4.jsx";

export default function DeliveryNoteA4Page() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const [doc, setDoc] = useState(null);
  const [issuer, setIssuer] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const auto = sp.get("auto") === "1";

  // helper: ดึงสาขาทีละอัน พร้อม fallback ไป /api/branches/options
  const fetchBranch = async (branchId) => {
    if (!branchId) return null;
    // ทางหลัก: /api/branches/:id
    try {
      const r1 = await api.get(`/api/branches/${branchId}`);
      return r1.data || null;
    } catch {}
    // fallback: /api/branches/options → ค้นหา id
    try {
      const r2 = await api.get(`/api/branches/options`);
      const list = Array.isArray(r2.data) ? r2.data : [];
      return list.find(b => String(b.id) === String(branchId)) || null;
    } catch {}
    return null;
  };

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const r = await api.get(`/api/deliveries/${id}`);
        const d = r.data;

        const [iss, rec] = await Promise.all([
          fetchBranch(d?.issuerId),
          fetchBranch(d?.recipientId),
        ]);

        if (!on) return;
        setDoc(d);
        setIssuer(iss);
        setRecipient(rec);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  const viewModel = useMemo(() => {
    if (!doc) return null;
    const addr = (b) => {
      if (!b) return { name: "-", addr1: "", addr2: "", addr3: "", phone: "" };
      const name = (b.code ? `${b.code} — ` : "") + (b.name || "");
      // รองรับทั้ง address, addressLine1/2/3
      const addr1 = b.addressLine1 || b.address1 || b.address || "";
      const addr2 = b.addressLine2 || b.address2 || "";
      const addr3 = b.addressLine3 || b.address3 || "";
      const phone = b.phone || "";
      return { name, addr1, addr2, addr3, phone };
    };
    const items = (doc.items || []).map(it => ({
      description: it.product?.name || `#${it.productId}`,
      price: Number(it.price || 0),
      qty: Number(it.qty || 0),
    }));
    const total = Number(doc.total || items.reduce((s,i)=> s + i.price*i.qty, 0));
    return {
      docNo: doc.docNo || `#${doc.id}`,
      docDate: doc.docDate ? new Date(doc.docDate) : new Date(),
      from: addr(issuer),
      to: addr(recipient),
      items,
      total,
    };
  }, [doc, issuer, recipient]);

  useEffect(() => {
    if (!loading && viewModel && auto) {
      const t = setTimeout(() => window.print(), 200);
      return () => clearTimeout(t);
    }
  }, [loading, viewModel, auto]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @page { size: A4; margin: 14mm 12mm 16mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        .page-a4 {
          background: white;
          margin: 0 auto;
          box-shadow: 0 10px 28px rgba(15,23,42,.10);
        }
        @media screen {
          .page-a4 { width: 210mm; min-height: 297mm; padding: 12mm; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="font-semibold">ใบส่งสินค้า (พรีวิว A4)</div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-[#10b981] text-white">พิมพ์</button>
          <button onClick={() => window.close()} className="px-3 py-1.5 rounded-lg bg-[#ef4444] text-white">ปิด</button>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-4 py-4">
        {loading || !viewModel ? (
          <div className="text-center py-10 text-slate-500">กำลังโหลดเอกสาร…</div>
        ) : (
          <div className="page-a4">
            {/* ใช้คอมโพเนนต์เดโม่ของคุณ และส่ง props ที่ map แล้ว */}
            <DeliveryNoteA4 doc={viewModel} />
          </div>
        )}
      </div>
    </div>
  );
}
