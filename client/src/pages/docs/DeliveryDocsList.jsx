import { useEffect, useState } from "react";
import GradientPanel from "@/components/theme/GradientPanel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import DocStatusBadge from "@/components/docs/DocStatusBadge";
import DocStatusActions from "@/components/docs/DocStatusActions";
import { Search, RefreshCcw } from "lucide-react";

export default function DeliveryDocsList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const url = new URL(`/api/docs`, window.location.origin);
      url.searchParams.set("kind", "DELIVERY");
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString());
      const data = await res.json();
      setRows(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, status]);

  const money = (v) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(v || 0));

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <GradientPanel
        title="รายการเอกสารส่งสินค้า (Delivery)"
        subtitle="รวมทุกสาขา/ฝากขาย — กรองได้ตามสถานะ/ค้นหาเลขที่"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-white/80" />
              <input
                className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                placeholder="ค้นหาเลขที่/หมายเหตุ"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">ทุกสถานะ</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="RECEIVED">RECEIVED</option>
            </select>
            <Button kind="white" leftIcon={<RefreshCcw size={16} />} onClick={load}>รีเฟรช</Button>
          </div>
        }
      >
        <Table.Root>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[140px]">เลขที่</Table.Th>
              <Table.Th className="w-[110px]">วันที่</Table.Th>
              <Table.Th>จาก</Table.Th>
              <Table.Th>ถึง</Table.Th>
              <Table.Th className="w-[120px] text-right">ยอดรวม</Table.Th>
              <Table.Th className="w-[120px] text-center">สถานะ</Table.Th>
              <Table.Th className="w-[260px] text-right">เครื่องมือ</Table.Th>
            </Table.Tr>
          </Table.Head>
          <Table.Body loading={loading}>
            {rows.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td className="font-mono">{r.docNo || `DOC-${r.id}`}</Table.Td>
                <Table.Td>{r.issueDate ? String(r.issueDate).slice(0,10) : "-"}</Table.Td>
                <Table.Td>{r.partyFromBranch?.name || "-"}</Table.Td>
                <Table.Td>{r.partyToPartner?.name || r.partyToBranch?.name || "-"}</Table.Td>
                <Table.Td className="text-right">{money(r.total ?? r.subtotal)}</Table.Td>
                <Table.Td className="text-center"><DocStatusBadge status={r.status} /></Table.Td>
                <Table.Td className="text-right"><DocStatusActions doc={r} onChanged={load} /></Table.Td>
              </Table.Tr>
            ))}
            {!loading && rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500 py-8">ไม่พบข้อมูล</Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table.Root>
      </GradientPanel>
    </div>
  );
}
