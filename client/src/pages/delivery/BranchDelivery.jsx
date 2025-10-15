import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import * as Table from "@/components/ui/Table.jsx";
import GradientPanel from "@/components/theme/GradientPanel";
// ✅ ใช้ named export ให้ตรงกับไฟล์ของคุณ
import { useAuthStore } from "@/store/authStore";

export default function BranchDeliveryPage() {
  const nav = useNavigate();

  // ✅ ดึง user จาก store ของคุณ (ในไฟล์คุณใช้ key 'user')
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [branches, setBranches] = useState([]);
  const [issuer, setIssuer] = useState("");      // ใช้เฉพาะ ADMIN
  const [recipient, setRecipient] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // โหลดรายชื่อสาขาตามสิทธิ์ (ADMIN=ทั้งหมด, STAFF=[สาขาตัวเอง, Main])
  useEffect(() => {
    (async () => {
      const r = await api.get("/api/branches/options").catch(() => ({ data: [] }));
      setBranches(Array.isArray(r.data) ? r.data : []);
    })();
  }, []);

  // ค้นหาสินค้า
  useEffect(() => {
    let on = true;
    (async () => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      const r = await api.get("/api/products", { params: { q: query, limit: 10 } }).catch(() => ({ data: [] }));
      if (!on) return;
      const arr = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []);
      setSearchResults(arr.slice(0, 10));
    })();
    return () => { on = false; };
  }, [query]);

  const addProduct = (p) => {
    setLines((prev) => {
      const exists = prev.find(x => x.productId === p.id);
      if (exists) return prev.map(x => x.productId === p.id ? { ...x, qty: (x.qty || 0) + 1 } : x);
      return [...prev, { productId: p.id, name: p.name, barcode: p.barcode, qty: 1 }];
    });
    setQuery("");
    setSearchResults([]);
  };
  const updateQty = (id, qty) => setLines(prev => prev.map(l => l.productId === id ? { ...l, qty: Math.max(0, Number(qty||0)) } : l));
  const removeLine = (id) => setLines(prev => prev.filter(l => l.productId !== id));

  const canSubmit = useMemo(() => {
    if (!lines.some(l => Number(l.qty) > 0)) return false;
    if (isAdmin) return issuer && recipient && issuer !== recipient;
    // STAFF: backend จะบังคับ issuer=สาขาตัวเอง, recipient=Main (จาก /options)
    return !!recipient && recipient !== String(user?.branchId || "");
  }, [issuer, recipient, lines, isAdmin, user]);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const payload = {
        note: note || undefined,
        items: lines.filter(l => Number(l.qty) > 0).map(l => ({ productId: l.productId, qty: Number(l.qty) })),
        ...(isAdmin
          ? { issuerBranchId: Number(issuer), recipientBranchId: Number(recipient) }
          : { recipientBranchId: Number(recipient) }), // STAFF ไม่ต้องส่ง issuer (backend จะตั้งให้เป็นสาขาตัวเอง)
      };
      const r = await api.post("/api/deliveries", payload);
      nav(`/delivery/${r.data?.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          <GradientPanel
            title="ส่งสินค้า (Branch → Branch)"
            subtitle={isAdmin ? "เลือกต้นทางและปลายทาง" : "สาขาของคุณสามารถส่งคืนสินค้ากลับ Main เท่านั้น"}
            actions={<Button className="btn-white" onClick={() => nav(-1)}>ย้อนกลับ</Button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {isAdmin && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">สาขาต้นทาง</label>
                  <select
                    value={issuer}
                    onChange={e => setIssuer(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 bg-white"
                  >
                    <option value="">-- เลือกสาขา --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={isAdmin ? "col-span-2" : "col-span-3"}>
                <label className="block text-sm text-slate-600 mb-1">สาขาปลายทาง</label>
                <select
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="">-- เลือกสาขา --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-600 mb-1">หมายเหตุ</label>
                <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="ใส่หมายเหตุ (ถ้ามี)" />
              </div>
            </div>
          </GradientPanel>

          <GradientPanel title="ค้นหาสินค้า">
            <div className="relative">
              <Input
                className="input-glass"
                placeholder="พิมพ์ชื่อสินค้า/บาร์โค้ด (อย่างน้อย 2 ตัวอักษร)"
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
              {!!searchResults.length && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border shadow">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
                      type="button"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-auto font-mono text-sm">{p.barcode || "-"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GradientPanel>

          <GradientPanel title="รายการสินค้า (จะส่ง)">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th>สินค้า</Table.Th>
                  <Table.Th>บาร์โค้ด</Table.Th>
                  <Table.Th className="text-right w-[140px]">จำนวน</Table.Th>
                  <Table.Th className="text-right w-[80px]">ลบ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body>
                {lines.map(l => (
                  <Table.Tr key={l.productId}>
                    <Table.Td>{l.name}</Table.Td>
                    <Table.Td className="font-mono">{l.barcode || "-"}</Table.Td>
                    <Table.Td className="text-right">
                      <Input
                        type="number"
                        min="0"
                        value={l.qty}
                        onChange={e=>updateQty(l.productId, e.target.value)}
                        className="w-24 text-right"
                      />
                    </Table.Td>
                    <Table.Td className="text-right">
                      <Button onClick={()=>removeLine(l.productId)} kind="danger" size="sm">ลบ</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!lines.length && (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center text-muted py-10">
                      ยังไม่มีสินค้าในรายการ
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Body>
            </Table.Root>

            <div className="mt-4 flex justify-end">
              <Button disabled={!canSubmit || loading} onClick={submit}>
                {loading ? "กำลังบันทึก..." : "บันทึกเอกสารส่งของ"}
              </Button>
            </div>
          </GradientPanel>

        </div>
      </div>
    </div>
  );
}
