import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/axios"; // axios instance
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import BarcodeImage from "@/components/ui/BarcodeImage";
import ProductFormModal from "@/components/products/ProductFormModal";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

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

export default function ProductsPage() {
  const [sp] = useSearchParams();
  const initialQ = sp.get("q") || "";

  const [q, setQ] = useState(initialQ);
  const [list, setList] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [showAdd, setShowAdd] = useState(false);
  const [openScan, setOpenScan] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const inputRef = useRef(null);

  // ดึงข้อมูลสินค้า (debounced)
  const fetchProducts = useMemo(
    () =>
      debounce(async (params) => {
        try {
          setLoading(true);
          const res = await api.get("/api/products", {
            params: {
              q: params.q ?? q,
              page: params.page ?? page,
              pageSize,
            },
          });
          setList(res.data.items || []);
          setCount(res.data.total || 0);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }, 300),
    [q, page]
  );

  useEffect(() => {
    fetchProducts({ q, page });
  }, [q, page, fetchProducts]);

  const handleCreated = () => {
    setShowAdd(false);
    fetchProducts({ q, page: 1 });
    setPage(1);
  };

  const handleEdited = () => {
    setShowEdit(false);
    fetchProducts({ q, page });
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-4">
      {/* ส่วนที่ 1: แถบค้นหา + action */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts({ q, page: 1 })}
              placeholder="สแกน/พิมพ์บาร์โค้ด หรือ ชื่อสินค้า..."
            />
            <Button type="button" kind="white" onClick={() => setOpenScan(true)}>
              สแกน
            </Button>
            {/* ปุ่มไปหน้า Mapping พร้อม q */}
            <Link to={`/consignment/categories/mapping?q=${encodeURIComponent(q)}`}>
              <Button kind="editor">จับคู่หมวดจากคำค้น</Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAdd(true)}>เพิ่มสินค้า</Button>
          </div>
        </div>
      </Card>

      {/* ส่วนที่ 2: ตารางสินค้า */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <div className="text-sm text-muted">พบทั้งหมด {count.toLocaleString()} รายการ</div>
        </div>

        <Table>
          <Table.Head>
            <Table.Tr>
              <Table.Th className="w-[160px]">Barcode</Table.Th>
              <Table.Th>ชื่อสินค้า</Table.Th>
              <Table.Th className="w-[150px] text-right">ราคาซื้อ</Table.Th>
              <Table.Th className="w-[150px] text-right">ราคาขาย</Table.Th>
              <Table.Th className="w-[200px] text-right">เครื่องมือ</Table.Th>
            </Table.Tr>
          </Table.Head>

          <Table.Body loading={loading}>
            {list.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td className="font-mono text-sm">
                  <BarcodeImage value={p.barcode} />
                </Table.Td>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td className="text-right">{formatMoney(p.costPrice)}</Table.Td>
                <Table.Td className="text-right">{formatMoney(p.salePrice)}</Table.Td>
                <Table.Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      kind="white"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(p);
                        setShowEdit(true);
                      }}
                    >
                      แก้ไข
                    </Button>
                    {/* ปุ่มจับคู่รายบรรทัด ส่ง q=barcode หรือชื่อ */}
                    <Link
                      to={`/consignment/categories/mapping?q=${encodeURIComponent(
                        p.barcode || p.name || ""
                      )}`}
                    >
                      <Button kind="editor" size="sm">
                        จับคู่หมวด
                      </Button>
                    </Link>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}

            {!loading && list.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center text-muted py-10">
                  ไม่พบข้อมูลสินค้า
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Body>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-muted">
            หน้า {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              kind="white"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <Button
              kind="white"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: แก้ไขสินค้า */}
      {showEdit && (
        <ProductFormModal
          initial={editingProduct}
          mode="edit"
          onClose={() => setShowEdit(false)}
          onSaved={handleEdited}
          onUpdated={handleEdited}
        />
      )}

      {/* Modal: เพิ่มสินค้า */}
      {showAdd && (
        <ProductFormModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}

      {/* Modal: สแกนบาร์โค้ด */}
      <BarcodeScannerModal
        open={openScan}
        onClose={() => setOpenScan(false)}
        onDetected={(code) => {
          setQ(code);
          fetchProducts({ q: code, page: 1 });
          inputRef.current?.focus();
        }}
      />
    </div>
  );
}
