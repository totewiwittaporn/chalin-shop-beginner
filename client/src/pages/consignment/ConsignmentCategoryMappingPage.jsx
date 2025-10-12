import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import BarcodeImage from "@/components/ui/BarcodeImage.jsx";
import Button from "@/components/ui/Button.jsx";
import BarcodeScannerModal from "@/components/BarcodeScannerModal.jsx";
import { listShops } from "@/services/consignmentShops.api.js";
import { listCategories, listMappedProducts, mapProduct, unmapProduct } from "@/services/consignmentCategories.api.js";
import api from "@/lib/api";

export default function ConsignmentCategoryMappingPage() {
  const [searchParams] = useSearchParams();
  const qpPartnerId = Number(searchParams.get("partnerId") || 0);
  const qpCategoryId = Number(searchParams.get("categoryId") || 0);
  const qpQ = String(searchParams.get("q") || "");

  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState(qpPartnerId || null);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(qpCategoryId || null);

  const [mapped, setMapped] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [q, setQ] = useState(qpQ);
  const [openScan, setOpenScan] = useState(false);

  useEffect(() => {
    (async () => {
      const shops = await listShops();
      setPartners(shops || []);
      if (!qpPartnerId) {
        const pid = shops?.[0]?.id || null;
        setPartnerId(pid);
      }
    })();
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    (async () => {
      const cats = await listCategories(partnerId);
      setCategories(cats || []);
      if (!qpCategoryId) {
        setCategoryId(cats?.[0]?.id || null);
      }
      // สินค้าทั้งหมด (เพื่อเลือกไป map)
      const p = await api.get("/api/products", { params: { take: 1000 } });
      setAllProducts(p.data?.items || p.data || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  useEffect(() => {
    if (!partnerId || !categoryId) { setMapped([]); return; }
    (async () => {
      const rows = await listMappedProducts(partnerId, categoryId);
      setMapped(rows || []);
    })();
  }, [partnerId, categoryId]);

  const notMapped = useMemo(() => {
    const setMappedIds = new Set((mapped || []).map(p => p.id));
    const s = q.trim().toLowerCase();
    return (allProducts || [])
      .filter(p => !setMappedIds.has(p.id))
      // ✅ เปลี่ยนเป็น p.barcode แทน p.sku
      .filter(p => !s || (p.name || "").toLowerCase().includes(s) || (p.barcode || "").toLowerCase().includes(s));
  }, [allProducts, mapped, q]);

  async function handleMap(productId) {
    await mapProduct(partnerId, categoryId, productId);
    const rows = await listMappedProducts(partnerId, categoryId);
    setMapped(rows || []);
  }
  async function handleUnmap(productId) {
    await unmapProduct(partnerId, categoryId, productId);
    const rows = await listMappedProducts(partnerId, categoryId);
    setMapped(rows || []);
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Link to="/consignment/shops"><Button kind="danger">เลือกร้าน</Button></Link>
                {partnerId && (
                  <Link to={`/consignment/categories?partnerId=${partnerId}`}>
                    <Button kind="editor">จัดการหมวด</Button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[auto_auto_1fr] gap-3 items-center">
                <select className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                  value={partnerId || ""} onChange={(e)=> setPartnerId(Number(e.target.value) || null)}>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                  value={categoryId || ""} onChange={(e)=> setCategoryId(Number(e.target.value) || null)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-slate-900"
                  placeholder="ค้นหาสินค้า (ชื่อ/บาร์โค้ด)" value={q} onChange={(e)=> setQ(e.target.value)} />
                <Button kind="white" type="button" onClick={()=> setOpenScan(true)}>สแกน</Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
              <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
                <div className="font-semibold mb-2">สินค้าที่ถูกจับคู่แล้ว</div>
                <Table.Root>
                  <Table.Head>
                    <Table.Tr>
                      <Table.Th>Barcode</Table.Th>
                      <Table.Th>ชื่อสินค้า</Table.Th>
                      <Table.Th className="w-[100px] text-right">เอาออก</Table.Th>
                    </Table.Tr>
                  </Table.Head>
                  <Table.Body>
                    {mapped.map(p => (
                      <Table.Tr key={p.id}>
                        <Table.Td className="font-mono text-sm"><BarcodeImage value={p.barcode} /></Table.Td>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td className="text-right">
                          <Button kind="danger" size="sm" onClick={()=> handleUnmap(p.id)}>เอาออก</Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {mapped.length === 0 && <Table.Tr><Table.Td colSpan={3}>ไม่มีรายการ</Table.Td></Table.Tr>}
                  </Table.Body>
                </Table.Root>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
              <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
                <div className="font-semibold mb-2">สินค้า (ยังไม่ถูกจับคู่)</div>
                <Table.Root>
                  <Table.Head>
                    <Table.Tr>
                      <Table.Th>Barcode</Table.Th>
                      <Table.Th>ชื่อสินค้า</Table.Th>
                      <Table.Th className="w-[100px] text-right">เพิ่ม</Table.Th>
                    </Table.Tr>
                  </Table.Head>
                  <Table.Body>
                    {notMapped.map(p => (
                      <Table.Tr key={p.id}>
                        <Table.Td className="font-mono text-sm"><BarcodeImage value={p.barcode} /></Table.Td>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td className="text-right">
                          <Button kind="success" size="sm" onClick={()=> handleMap(p.id)}>เพิ่ม</Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {notMapped.length === 0 && <Table.Tr><Table.Td colSpan={3}>ไม่มีรายการ</Table.Td></Table.Tr>}
                  </Table.Body>
                </Table.Root>
              </div>
            </Card>
          </div>
        </div>
      </div>
    
      <BarcodeScannerModal
        open={openScan}
        onClose={() => setOpenScan(false)}
        onDetected={(code) => { setQ(code); }}
      />
    </div>
  );
}