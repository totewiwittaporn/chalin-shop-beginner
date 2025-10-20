// client/src/pages/branch-pos/SalesDocsTable.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import GradientPanel from "@/components/theme/GradientPanel";
import GlassModal from "@/components/theme/GlassModal";

/**
 * Props:
 *  - branchId?: number
 *  - pageSize?: number = 10
 *  - apiPath?: string = "/api/sales/branch"
 *  - title?: string
 */
const SalesDocsTable = forwardRef(function SalesDocsTable(
  {
    branchId,
    pageSize = 10,
    apiPath = "/api/sales/branch",
    title = "เอกสารขายล่าสุด",
  },
  ref
) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // print modal state
  const [printOpen, setPrintOpen] = useState(false);
  const [printTab, setPrintTab] = useState("compact"); // compact | full
  const [selectedSale, setSelectedSale] = useState(null);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (branchId) p.set("branchId", String(branchId));
    return p.toString();
  }, [page, pageSize, branchId]);

  async function fetchList() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get(`${apiPath}?${queryParams}`);

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const norm = items.map((d) => ({
        id: d.id ?? d.docId ?? d._id ?? crypto.randomUUID(),
        docNo: d.code ?? d.docNo ?? d.number ?? "-",
        docDate: d.date ?? d.docDate ?? d.createdAt ?? null,
        total: Number(
          d.total ??
            d.grandTotal ??
            d.amount ??
            (typeof d.totals?.grandTotal !== "undefined"
              ? d.totals.grandTotal
              : 0)
        ),
        createdBy: d.createdByName ?? d.createdBy ?? d.userName ?? "-",
        status: d.status ?? "-",
        _raw: d,
      }));

      setRows(norm);
      setTotal(Number(data?.total ?? norm.length));
    } catch (e) {
      console.error("list sales failed:", e);
      setRows([]);
      setTotal(0);
      setErr("โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams, apiPath]);

  useImperativeHandle(ref, () => ({ reload: () => fetchList() }));

  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));
  const money = (n) =>
    (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const openPrint = (row) => {
    setSelectedSale(row?._raw || row);
    setPrintTab("compact");
    setPrintOpen(true);
  };

  return (
    <>
      <GradientPanel
        title={title}
        subtitle={`หน้า ${page} / ${pageCount}`}
        innerClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.Tr>
                {/* เอา # และ สาขา ออกตามคำขอ */}
                <Table.Th className="w-44">เลขที่เอกสาร</Table.Th>
                <Table.Th className="w-32">วันที่</Table.Th>
                <Table.Th className="w-32 text-right">ยอดรวม</Table.Th>
                <Table.Th className="w-40">โดย</Table.Th>
                <Table.Th className="w-28">สถานะ</Table.Th>
                <Table.Th className="w-28 text-right">การทำงาน</Table.Th>
              </Table.Tr>
            </Table.Head>

            <Table.Body>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="py-8 text-center text-slate-500">
                    {loading ? "กำลังโหลด..." : err || "ยังไม่มีรายการ"}
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td className="font-medium">{r.docNo}</Table.Td>
                    <Table.Td>
                      {r.docDate ? new Date(r.docDate).toLocaleDateString() : "-"}
                    </Table.Td>
                    <Table.Td className="text-right">{money(r.total)}</Table.Td>
                    <Table.Td>{r.createdBy || "-"}</Table.Td>
                    <Table.Td>{r.status}</Table.Td>
                    <Table.Td className="text-right">
                      <Button kind="primary" onClick={() => openPrint(r)}>
                        พิมพ์
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        <div className="flex items-center justify-between px-3 py-3 border-t border-slate-100">
          <div className="text-xs text-slate-600">
            ทั้งหมด {total} รายการ
            {branchId ? ` • สาขา: ${branchId}` : ""}
          </div>
          <div className="flex gap-2">
            <Button
              kind="white"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <Button
              kind="white"
              disabled={page >= pageCount || loading}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              ถัดไป
            </Button>
            <Button kind="primary" disabled={loading} onClick={() => fetchList()}>
              รีเฟรช
            </Button>
          </div>
        </div>
      </GradientPanel>

      {/* Print Modal */}
      <GlassModal
        open={printOpen}
        title={`พิมพ์ใบเสร็จ ${selectedSale?.code || selectedSale?.docNo || ""}`}
        onClose={() => setPrintOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button kind="white" onClick={() => setPrintOpen(false)}>
              ปิด
            </Button>
            <Button
              kind="primary"
              onClick={() => {
                // ตรงนี้สามารถต่อยอดให้เปิดหน้าพิมพ์เฉพาะแท็บได้
                window.print();
              }}
            >
              พิมพ์
            </Button>
          </div>
        }
      >
        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            className={
              "px-3 py-1 rounded-full text-sm " +
              (printTab === "compact"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300")
            }
            onClick={() => setPrintTab("compact")}
          >
            ใบเสร็จแบบย่อ
          </button>
          <button
            className={
              "px-3 py-1 rounded-full text-sm " +
              (printTab === "full"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300")
            }
            onClick={() => setPrintTab("full")}
          >
            ใบเสร็จแบบเต็มรูปแบบ
          </button>
        </div>

        {/* Tab contents (ตัวอย่างโครงสร้าง, ต่อ template ได้เลย) */}
        {printTab === "compact" ? (
          <div className="text-sm leading-6">
            <div className="font-semibold mb-2">ใบเสร็จ (แบบย่อ)</div>
            <div>เลขที่: {selectedSale?.code || selectedSale?.docNo || "-"}</div>
            <div>วันที่: {selectedSale?.date ? new Date(selectedSale.date).toLocaleString() : "-"}</div>
            <div>ยอดรวม: {money(selectedSale?.total)}</div>
            <div>โดย: {selectedSale?.createdByName || selectedSale?.createdBy || "-"}</div>
            <hr className="my-3" />
            <div className="text-slate-500">
              * ปรับรูปแบบและรายการสินค้าได้ที่คอมโพเนนต์นี้ (compact)
            </div>
          </div>
        ) : (
          <div className="text-sm leading-6">
            <div className="font-semibold mb-2">ใบเสร็จ (เต็มรูปแบบ)</div>
            <div>เลขที่: {selectedSale?.code || selectedSale?.docNo || "-"}</div>
            <div>วันที่: {selectedSale?.date ? new Date(selectedSale.date).toLocaleString() : "-"}</div>
            <div>ยอดรวม: {money(selectedSale?.total)}</div>
            <div>โดย: {selectedSale?.createdByName || selectedSale?.createdBy || "-"}</div>
            <hr className="my-3" />
            <div className="text-slate-500">
              * ปรับหัวกระดาษ/ที่อยู่ร้าน/รายการสินค้า/สรุปเงิน/ขอบคุณลูกค้า ได้ที่คอมโพเนนต์นี้ (full)
            </div>
          </div>
        )}
      </GlassModal>
    </>
  );
});

export default SalesDocsTable;
