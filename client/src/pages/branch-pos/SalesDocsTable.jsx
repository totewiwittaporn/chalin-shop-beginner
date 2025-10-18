import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  openPopupWithMessage,
  showHtmlInPopup,
  showPdfInPopup,
  printAndClose,
} from "@/services/printPopup";

const API_LIST = "/api/sales/branch"; // GET ?q=&dateFrom=&dateTo=&page=&pageSize=
const apiPrintHtml = (id, size) => `/api/sales/branch/${id}/print?size=${size}`; // html default
const apiPrintPdf  = (id, size) => `/api/sales/branch/${id}/print?size=${size}&format=pdf`;

function useSalesList({ pageSize = 20 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  async function fetchList({ resetPage = false } = {}) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(resetPage ? 1 : page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`${API_LIST}?${params.toString()}`, { method: "GET" });
      const data = await res.json();
      const items = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data?.items) ? data.items : []);
      setRows(items);
      if (resetPage) setPage(1);
    } catch (e) {
      console.error("fetch sales list failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return {
    state: { rows, loading, q, dateFrom, dateTo, page, pageSize },
    set:   { setQ, setDateFrom, setDateTo, setPage },
    fetchList,
  };
}

const SalesDocsTable = forwardRef(function SalesDocsTable(_props, ref) {
  const { state, set, fetchList } = useSalesList({ pageSize: 20 });

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [state.page]);

  useImperativeHandle(ref, () => ({
    refresh: () => fetchList(),
    refreshFromStart: () => fetchList({ resetPage: true }),
  }), [fetchList]);

  const totalAmount = useMemo(
    () => state.rows.reduce((s, r) => s + Number(r?.total || r?.grandTotal || 0), 0),
    [state.rows]
  );

  async function viewHtml(id, size /* 'a4' | '58' */) {
    const popup = openPopupWithMessage("<div>กำลังโหลดเอกสาร...</div>");
    try {
      const res = await fetch(apiPrintHtml(id, size), { method: "GET" });
      const text = await res.text();
      const content =
        /^\s*{/.test(text) && /}\s*$/.test(text)
          ? `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${text}</pre>`
          : text;
      if (popup) showHtmlInPopup(popup, content);
      else {
        const blob = new Blob([content], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        window.location.assign(url);
      }
    } catch (e) {
      if (popup) showHtmlInPopup(popup, `<pre style="white-space:pre-wrap">โหลดเอกสารไม่สำเร็จ\n\n${String(e)}</pre>`);
    }
  }

  async function printPdf(id, size /* 'a4' | '58' */) {
    const popup = openPopupWithMessage("<div>กำลังเตรียมไฟล์ PDF...</div>");
    try {
      const res = await fetch(apiPrintPdf(id, size), { method: "GET" });
      const ctype = (res.headers.get("content-type") || "").toLowerCase();

      if (ctype.includes("application/pdf")) {
        const buf = await res.arrayBuffer();
        const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
        if (popup) { showPdfInPopup(popup, url); printAndClose(popup, 300); }
        else { window.location.assign(url); }
      } else {
        const text = await res.text();
        const content = /<\/?(html|body|head)/i.test(text)
          ? text
          : `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${text}</pre>`;
        if (popup) showHtmlInPopup(popup, content);
      }
    } catch (e) {
      if (popup) showHtmlInPopup(popup, `<pre style="white-space:pre-wrap">พิมพ์เอกสารไม่สำเร็จ\n\n${String(e)}</pre>`);
    }
  }

  return (
    <Card>
      <Card.Header className="flex items-center justify-between">
        <div className="font-medium">รายงาน/เอกสารการขาย (สาขา)</div>
        <div className="text-sm text-slate-500">
          {state.loading
            ? "กำลังโหลด..."
            : `ทั้งหมด ${state.rows.length.toLocaleString()} รายการ | รวมยอด ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        </div>
      </Card.Header>
      <Card.Body>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Input placeholder="ค้นหาเลขที่/ลูกค้า" value={state.q} onChange={(e) => set.setQ(e.target.value)} />
          <Input type="date" value={state.dateFrom} onChange={(e) => set.setDateFrom(e.target.value)} />
          <Input type="date" value={state.dateTo} onChange={(e) => set.setDateTo(e.target.value)} />
          <Button kind="primary" onClick={() => fetchList({ resetPage: true })}>ค้นหา</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">วันที่</th>
                <th className="px-3 py-2 text-left">เลขที่เอกสาร</th>
                <th className="px-3 py-2 text-left">ลูกค้า</th>
                <th className="px-3 py-2 text-right">ยอดสุทธิ</th>
                <th className="px-3 py-2 text-left">วิธีชำระ</th>
                <th className="px-3 py-2 text-left">สถานะ</th>
                <th className="px-3 py-2">การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{(r.docDate || "").slice(0,10)}</td>
                  <td className="px-3 py-2">{r.code || r.docNo || r.id}</td>
                  <td className="px-3 py-2">{r.customerName || "Walk-in"}</td>
                  <td className="px-3 py-2 text-right">
                    {Number(r.total ?? r.grandTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2">{r.paymentMethod || "-"}</td>
                  <td className="px-3 py-2">{r.status || "POSTED"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button kind="white" onClick={() => viewHtml(r.id, "58")}>ดูใบเสร็จย่อ (58)</Button>
                      <Button kind="white" onClick={() => viewHtml(r.id, "a4")}>ดูใบเสร็จเต็ม (A4)</Button>
                      <Button kind="primary" onClick={() => printPdf(r.id, "58")}>พิมพ์ย่อ</Button>
                      <Button kind="primary" onClick={() => printPdf(r.id, "a4")}>พิมพ์เต็ม</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.rows.length === 0 && !state.loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-400" colSpan={7}>
                    ไม่มีรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card.Body>
      <Card.Footer className="flex justify-between items-center">
        <Button kind="white" onClick={() => set.setPage((p) => Math.max(1, p - 1))}>ก่อนหน้า</Button>
        <div className="text-sm text-slate-500">หน้า {state.page}</div>
        <Button kind="white" onClick={() => set.setPage((p) => p + 1)}>ถัดไป</Button>
      </Card.Footer>
    </Card>
  );
});

export default SalesDocsTable;
