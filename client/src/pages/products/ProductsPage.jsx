import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios"; // ✅ ชี้ไป axios instance ที่คุณใช้อยู่
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import ProductFormModal from "../../components/products/ProductFormModal";

// util เล็ก ๆ
const debounce = (fn, ms = 400) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

function formatMoney(n) {
  if (n === null || n === undefined) return "-";
  const num = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(num);
}

/**
 * Layout เป้าหมาย:
 * - Content Area bg ขาวอมฟ้านวล: ตั้งค่าที่ AppShell แล้ว (bg-[rgba(237,243,255,0.6)])
 * - ส่วนเนื้อหาในหน้านี้ใช้ Card variant="gradient" สำหรับหัวการ์ด/ฟิลเตอร์
 * - ตารางวางใน Card ปกติ (พื้นขาว) เพื่ออ่านตารางชัด
 */
export default function ProductsPage() {
  // คำค้น / modal / loading
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // pagination แบบง่าย (คุณจะต่อยอดเป็น server-side page ได้)
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // ดึงข้อมูลสินค้า
  const fetchProducts = useMemo(
    () =>
      debounce(async (params) => {
        try {
          setLoading(true);
          const res = await api.get("/api/products", {
            params: {
              q: params.q || "",
              page: params.page || 1,
              pageSize,
            },
          });
          setList(res.data.items || []);
          setCount(res.data.total || 0);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }, 400),
    []
  );

  useEffect(() => {
    fetchProducts({ q, page });
  }, [q, page, fetchProducts]);

  // สร้างสินค้าใหม่แล้วรีเฟรช
  async function handleCreated() {
    setShowAdd(false);
    // รีเซ็ตไปหน้าแรกและค้นหาปัจจุบัน
    setPage(1);
    fetchProducts({ q, page: 1 });
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="grid gap-4">
      {/* ส่วนที่ 1: หัวข้อ/ค้นหา/เพิ่มสินค้า (การ์ดเกรเดี้ยน) */}
      <Card variant="gradient" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white/85 text-base md:text-lg font-semibold">
              จัดการสินค้า
            </div>
            <div className="text-white/80 text-xs">
              ค้นหา / เพิ่มสินค้าใหม่เข้าสู่ระบบ
            </div>
          </div>
          <div className="flex-1 md:max-w-lg">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาจากชื่อสินค้า หรือบาร์โค้ด…"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button kind="success" type="button" onClick={() => setShowAdd(true)}>
              + เพิ่มสินค้า
            </Button>
          </div>
        </div>
      </Card>

      {/* ส่วนที่ 2: ตารางสินค้า (การ์ดพื้นขาวอ่านง่าย) */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <div className="text-sm text-muted">
            พบทั้งหมด {count.toLocaleString()} รายการ
          </div>
        </div>
        <Table>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[160px]">Barcode</Table.Th>
              <Table.Th>ชื่อสินค้า</Table.Th>
              <Table.Th className="w-[150px] text-right">ราคาซื้อ</Table.Th>
              <Table.Th className="w-[150px] text-right">ราคาขาย</Table.Th>
            </Table.Tr>
          </Table.Head>
          <Table.Body loading={loading}>
            {list.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td className="font-mono text-sm">{p.barcode}</Table.Td>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td className="text-right">{formatMoney(p.costPrice)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(p.salePrice)}</Table.Td>
              </Table.Tr>
            ))}
            {!loading && list.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center text-muted py-10">
                  ไม่พบข้อมูลสินค้า
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table>

        {/* pagination ง่าย ๆ */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(15,23,42,.08)] bg-white/60">
          <div className="text-xs text-muted">
            หน้า {page}/{totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              kind="white"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <Button
              kind="white"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal เพิ่มสินค้า */}
      {showAdd && (
        <ProductFormModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
