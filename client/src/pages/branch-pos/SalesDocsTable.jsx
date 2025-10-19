// client/src/pages/branch-pos/SalesDocsTable.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import api from "@/lib/api";

/**
 * Props:
 *  - branchId?: number
 *  - pageSize?: number = 10
 *  - apiPath?: string = "/api/sales/branch"  // GET list endpoint (ตรงกับ backend)
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
      // ใช้ axios instance => baseURL + Authorization header พร้อมใช้งาน
      const { data } = await api.get(`${apiPath}?${queryParams}`);

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const norm = items.map((d) => ({
        id: d.id ?? d.docId ?? d._id ?? crypto.randomUUID(),
        docNo: d.docNo ?? d.number ?? d.code ?? "-",
        docDate: d.docDate ?? d.date ?? d.createdAt ?? null,
        branchName: d.branchName ?? d.branch?.name ?? "-",
        total: Number(
          d.total ??
            d.grandTotal ??
            d.amount ??
            (typeof d.totals?.grandTotal !== "undefined"
              ? d.totals.grandTotal
              : 0)
        ),
        createdBy: d.createdBy ?? d.userName ?? d.createdUser ?? "-",
        status: d.status ?? "-",
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

  return (
    <Card>
      <Card.Header className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-slate-500">
          หน้า {page} / {pageCount}
        </div>
      </Card.Header>

      <Card.Body>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.Tr>
                <Table.Th className="w-10">#</Table.Th>
                <Table.Th className="w-36">เลขที่เอกสาร</Table.Th>
                <Table.Th className="w-32">วันที่</Table.Th>
                <Table.Th>สาขา</Table.Th>
                <Table.Th className="w-32 text-right">ยอดรวม</Table.Th>
                <Table.Th className="w-32">โดย</Table.Th>
                <Table.Th className="w-28">สถานะ</Table.Th>
              </Table.Tr>
            </Table.Head>

            <Table.Body>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="py-8 text-center text-slate-500">
                    {loading ? "กำลังโหลด..." : err || "ยังไม่มีรายการ"}
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((r, idx) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{(page - 1) * pageSize + idx + 1}</Table.Td>
                    <Table.Td className="font-medium">{r.docNo}</Table.Td>
                    <Table.Td>
                      {r.docDate
                        ? new Date(r.docDate).toLocaleDateString()
                        : "-"}
                    </Table.Td>
                    <Table.Td>{r.branchName || "-"}</Table.Td>
                    <Table.Td className="text-right">{money(r.total)}</Table.Td>
                    <Table.Td>{r.createdBy}</Table.Td>
                    <Table.Td>{r.status}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </Card.Body>

      <Card.Footer className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
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
          <Button
            kind="primary"
            disabled={loading}
            onClick={() => fetchList()}
            title="รีเฟรช"
          >
            รีเฟรช
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
});

export default SalesDocsTable;
