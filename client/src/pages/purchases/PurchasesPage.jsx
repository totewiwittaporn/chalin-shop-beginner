// client/src/pages/purchases/PurchasesPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { Search, Plus, Inbox, CheckCircle2 } from "lucide-react";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import PurchaseReceiveModal from "@/components/purchases/PurchaseReceiveModal";

const nf = (n) => Number(n || 0).toLocaleString();

export default function PurchasesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [openCreate, setOpenCreate] = useState(false);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  // สำหรับรับเข้า
  const [openReceive, setOpenReceive] = useState(false);
  const [currentPo, setCurrentPo] = useState(null);

  async function fetchList() {
    setLoading(true);
    try {
      const params = { q, page, pageSize };
      if (status !== "ALL") params.status = status;
      const { data } = await api.get("/api/purchases", { params });
      setRows(data.items || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      console.error("[purchases] load list", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchList, 200);
    return () => clearTimeout(t);
  }, [q, status, page]);

  useEffect(() => { setPage(1); }, [q, status]);

  async function openReceiveModal(poSummary) {
    try {
      // ⬇️ ดึงข้อมูลฉบับเต็ม (มี lines + product) ก่อนเปิดโมดัล
      const { data } = await api.get(`/api/purchases/${poSummary.id}`);
      setCurrentPo(data);
      setOpenReceive(true);
    } catch (e) {
      console.error("[purchases] getOne", e);
      alert("ไม่สามารถเปิดรายการตรวจรับได้");
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* Filters */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Search size={16} className="opacity-90" />
                <input
                  className="w-[280px] sm:w-[360px] rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                  placeholder="ค้นหา (รหัสใบสั่งซื้อ, ซัพพลายเออร์, ชื่อ/บาร์โค้ดสินค้า)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="PENDING">กำลังสั่งซื้อ (PENDING)</option>
                  <option value="RECEIVED">รับเข้าแล้ว (RECEIVED)</option>
                  <option value="CANCELLED">ยกเลิก (CANCELLED)</option>
                  <option value="ALL">ทั้งหมด</option>
                </select>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button kind="success" onClick={() => setOpenCreate((v) => !v)} leftIcon={<Plus size={16} />}>
                  {openCreate ? "ปิดแบบฟอร์ม" : "เพิ่มใบสั่งซื้อ"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Create Form */}
          {openCreate && (
            <Card className="p-5 bg-white/95">
              <div className="mb-3 font-semibold text-slate-800">สร้างใบสั่งซื้อ</div>
              <PurchaseForm
                onCreated={() => {
                  setOpenCreate(false);
                  setPage(1);
                  fetchList(); // รีเฟรชตารางทันทีหลังบันทึก
                }}
              />
            </Card>
          )}

          {/* Table */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <div className="px-2 pb-3 text-sm text-slate-600">พบทั้งหมด {nf(total)} รายการ</div>

              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[100px]">เลขที่</Table.Th>
                    <Table.Th className="w-[160px]">วันที่</Table.Th>
                    <Table.Th>ซัพพลายเออร์</Table.Th>
                    <Table.Th className="w-[140px] text-right">ยอดรวม</Table.Th>
                    <Table.Th className="w-[140px]">สถานะ</Table.Th>
                    <Table.Th className="w-[220px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loading}>
                  {rows.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td className="font-mono">{r.code || `PO-${String(r.id).padStart(6, "0")}`}</Table.Td>
                      <Table.Td>{r.date ? new Date(r.date).toLocaleString() : "-"}</Table.Td>
                      <Table.Td>{r.supplier?.name || "-"}</Table.Td>
                      <Table.Td className="text-right">{nf(r.totalCost)}</Table.Td>
                      <Table.Td>
                        <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                          r.status === "RECEIVED" ? "bg-emerald-100 text-emerald-700"
                          : r.status === "CANCELLED" ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                        }`}>
                          {r.status}
                        </span>
                      </Table.Td>
                      <Table.Td className="text-right">
                        {r.status !== "RECEIVED" ? (
                          <Button kind="success" size="sm" leftIcon={<Inbox size={16}/>} onClick={() => openReceiveModal(r)}>
                            รับเข้า
                          </Button>
                        ) : (
                          <Button kind="white" size="sm" leftIcon={<CheckCircle2 size={16}/>} disabled>
                            รับแล้ว
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6} className="text-center text-slate-500 py-6">ไม่พบข้อมูล</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-slate-600">หน้า {page} / {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button kind="white" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ก่อนหน้า
                  </Button>
                  <Button kind="white" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    ถัดไป
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <PurchaseReceiveModal
        open={openReceive}
        onClose={() => setOpenReceive(false)}
        purchase={currentPo}
        onReceived={() => fetchList()}
      />
    </div>
  );
}
