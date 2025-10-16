// client/src/pages/consignment/ConsignmentManagerPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { Search, Plus, Pencil, Trash2, ChevronRight, ScanLine } from "lucide-react";
import ConsignmentShopFormModal from "@/components/consignment/ConsignmentShopFormModal";
import ConsignmentCategoryModal from "@/components/consignment/ConsignmentCategoryModal";
import ConsignmentCategoryMappingModal from "@/components/consignment/ConsignmentCategoryMappingModal";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { useAuthStore } from "@/store/authStore";

const money = (v) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(v || 0));

export default function ConsignmentManagerPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = String(role || "").toUpperCase() === "ADMIN";

  // --------- TOP: SHOPS ----------
  const [shops, setShops] = useState([]);
  const [shopQ, setShopQ] = useState("");
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [openShopModal, setOpenShopModal] = useState(false);
  const [editShop, setEditShop] = useState(null);
  const [loadingShops, setLoadingShops] = useState(false);

  async function loadShops() {
    setLoadingShops(true);
    try {
      const { data } = await api.get("/api/consignment/partners", {
        params: { q: shopQ, page: 1, pageSize: 100 },
      });
      const items = data?.items || [];
      setShops(items);
      if (!selectedShopId && items.length) setSelectedShopId(items[0].id);
    } finally {
      setLoadingShops(false);
    }
  }
  useEffect(() => { loadShops(); }, []);
  useEffect(() => {
    const t = setTimeout(loadShops, 300);
    return () => clearTimeout(t);
  }, [shopQ]);

  // --------- MIDDLE: CATEGORIES (of selected shop) ----------
  const [cats, setCats] = useState([]);
  const [catQ, setCatQ] = useState("");
  const [loadingCats, setLoadingCats] = useState(false);
  const [openCatModal, setOpenCatModal] = useState(false);
  const [catMode, setCatMode] = useState("create");
  const [editingCat, setEditingCat] = useState(null);

  async function loadCats(shopId) {
    if (!shopId) return setCats([]);
    setLoadingCats(true);
    try {
      const { data } = await api.get(`/api/consignment/partners/${shopId}/categories`, {
        params: { q: catQ, page: 1, pageSize: 100 },
      });
      setCats(data?.items || []);
    } finally {
      setLoadingCats(false);
    }
  }
  useEffect(() => { loadCats(selectedShopId); }, [selectedShopId]);
  useEffect(() => {
    const t = setTimeout(() => loadCats(selectedShopId), 300);
    return () => clearTimeout(t);
  }, [catQ]);

  // --------- BOTTOM: mapped products (in selected category) ----------
  const [selectedCat, setSelectedCat] = useState(null);
  const [mapped, setMapped] = useState([]);
  const [mappedLoading, setMappedLoading] = useState(false);

  async function loadMapped(categoryId) {
    if (!categoryId) { setMapped([]); return; }
    setMappedLoading(true);
    try {
      const { data } = await api.get(`/api/consignment/categories/${categoryId}/products`, {
        params: { page: 1, pageSize: 100 },
      });
      setMapped(data?.items || data || []);
    } finally {
      setMappedLoading(false);
    }
  }
  useEffect(() => { loadMapped(selectedCat?.id); }, [selectedCat]);

  // --------- Mapping modal / scan ----------
  const [openMapModal, setOpenMapModal] = useState(false);
  const [openScan, setOpenScan] = useState(false);

  // shop handlers
  function openCreateShop() { setEditShop(null); setOpenShopModal(true); }
  function openEditShop(shop) { if (!isAdmin) return; setEditShop(shop); setOpenShopModal(true); }
  const afterSavedShop = () => loadShops();

  // category handlers
  function openCreateCategory() { setCatMode("create"); setEditingCat(null); setOpenCatModal(true); }
  function openEditCategory(cat) { setCatMode("edit"); setEditingCat(cat); setOpenCatModal(true); }
  const afterSavedCategory = () => loadCats(selectedShopId);

  // mapping handlers
  function openMapping(cat) { setSelectedCat(cat); setOpenMapModal(true); }
  async function removeProductFromCategory(productId) {
    if (!selectedCat) return;
    if (!confirm("เอาสินค้านี้ออกจากหมวดใช่ไหม?")) return;
    await api.delete(`/api/consignment/categories/${selectedCat.id}/products/${productId}`);
    await loadMapped(selectedCat.id);
    await loadCats(selectedShopId);
  }

  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) || null,
    [shops, selectedShopId]
  );

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: "#f4f7ff" }}>
        <div className="grid gap-6">

          {/* TOP: SHOP FILTER */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-center">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Search size={16} className="opacity-90" />
                  <input
                    className="w-full rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900 placeholder-slate-600"
                    placeholder="ค้นหาร้านฝากขาย (รหัส/ชื่อ)"
                    value={shopQ}
                    onChange={(e) => setShopQ(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="rounded-xl border border-white/40 bg-white/95 px-3 py-2 outline-none text-slate-900"
                    value={selectedShopId || ""}
                    onChange={(e) => {
                      const id = Number(e.target.value) || null;
                      setSelectedShopId(id);
                      setSelectedCat(null);
                    }}
                  >
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `[${s.code}] ` : ""}{s.name}
                      </option>
                    ))}
                  </select>

                  {isAdmin && (
                    <>
                      <Button kind="success" onClick={openCreateShop} leftIcon={<Plus size={16} />}>
                        เพิ่มร้านฝากขาย
                      </Button>
                      {selectedShop && (
                        <Button
                          kind="editor"
                          onClick={() => openEditShop(selectedShop)}
                          leftIcon={<Pencil size={16} />}
                        >
                          แก้ไขร้านนี้
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="justify-self-end text-white/90 text-sm">
                {loadingShops ? "กำลังโหลดร้าน..." : selectedShop ? (
                  <div className="text-right">
                    <div className="opacity-90">ร้านที่เลือก</div>
                    <div className="font-semibold">
                      {selectedShop.code ? `[${selectedShop.code}] ` : ""}{selectedShop.name}
                      {selectedShop.isActive === false && <span className="ml-2 text-red-200">(INACTIVE)</span>}
                    </div>
                  </div>
                ) : "—"}
              </div>
            </div>
          </Card>

          {/* MIDDLE: CATEGORIES */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">หมวดหมู่ของร้านฝากขาย</div>
              {isAdmin && selectedShopId && (
                <Button kind="success" onClick={openCreateCategory} leftIcon={<Plus size={16} />}>
                  เพิ่มหมวดของร้าน
                </Button>
              )}
            </div>

            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="opacity-70" />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none"
                  placeholder="ค้นหาหมวด (รหัส/ชื่อ)"
                  value={catQ}
                  onChange={(e) => setCatQ(e.target.value)}
                />
              </div>

              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-[160px]">รหัส</Table.Th>
                    <Table.Th>ชื่อหมวด</Table.Th>
                    <Table.Th className="w-[140px] text-right">จำนวนสินค้า</Table.Th>
                    <Table.Th className="w-[240px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body loading={loadingCats}>
                  {cats.map((c) => (
                    <Table.Tr key={c.id} className="cursor-pointer" onClick={() => setSelectedCat(c)}>
                      <Table.Td className="font-mono">{c.code || "-"}</Table.Td>
                      <Table.Td className="flex items-center gap-2">
                        {c.name}
                        {selectedCat?.id === c.id && <ChevronRight size={16} className="text-slate-400" />}
                      </Table.Td>
                      <Table.Td className="text-right">{c.itemCount ?? "-"}</Table.Td>
                      <Table.Td className="text-right">
                        <div className="inline-flex gap-2">
                          <Button kind="success" size="sm" onClick={(e) => { e.stopPropagation(); openMapping(c); }}>
                            เพิ่มสินค้าเข้าหมวด
                          </Button>
                          {isAdmin && (
                            <Button
                              kind="editor"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); openEditCategory(c); }}
                              leftIcon={<Pencil size={14} />}
                            >
                              แก้ไข
                            </Button>
                          )}
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!loadingCats && cats.length === 0 && (
                    <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-6">ไม่พบหมวดหมู่</Table.Td></Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
            </div>
          </Card>

          {/* BOTTOM: PRODUCTS IN CATEGORY */}
          <Card className="p-5 bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">สินค้าในหมวด {selectedCat ? `"${selectedCat.name}"` : "(ยังไม่เลือกหมวด)"}</div>
              {selectedCat && (
                <div className="flex items-center gap-2">
                  <Button kind="white" onClick={() => setOpenScan(true)} leftIcon={<ScanLine size={16} />}>สแกนเพื่อค้นหา</Button>
                  <Button kind="success" onClick={() => openMapping(selectedCat)}>เพิ่มสินค้าเข้าหมวด</Button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/95 p-3 text-slate-800 overflow-hidden">
              {!selectedCat ? (
                <div className="text-slate-600 py-8 text-center">เลือกหมวดจากตารางด้านบนเพื่อดูรายการสินค้า</div>
              ) : (
                <Table.Root>
                  <Table.Head>
                    <Table.Tr>
                      <Table.Th className="w-[160px]">Barcode</Table.Th>
                      <Table.Th>ชื่อสินค้า</Table.Th>
                      <Table.Th className="w-[140px] text-right">ราคาขาย</Table.Th>
                      <Table.Th className="w-[140px] text-right">เครื่องมือ</Table.Th>
                    </Table.Tr>
                  </Table.Head>
                  <Table.Body loading={mappedLoading}>
                    {mapped.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td className="font-mono">{p.barcode}</Table.Td>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td className="text-right">{money(p.salePrice)}</Table.Td>
                        <Table.Td className="text-right">
                          <Button
                            kind="danger"
                            size="sm"
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => removeProductFromCategory(p.id)}
                          >
                            เอาออก
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {!mappedLoading && mapped.length === 0 && (
                      <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500 py-6">ยังไม่มีสินค้าในหมวดนี้</Table.Td></Table.Tr>
                    )}
                  </Table.Body>
                </Table.Root>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <ConsignmentShopFormModal
        open={openShopModal}
        mode={editShop ? "edit" : "create"}
        initial={editShop}
        onClose={() => setOpenShopModal(false)}
        onSubmit={async (payload) => {
          if (editShop) {
            await api.put(`/api/consignment/partners/${editShop.id}`, payload);
          } else {
            await api.post(`/api/consignment/partners`, payload);
          }
          setOpenShopModal(false);
          afterSavedShop();
        }}
      />

      <ConsignmentCategoryModal
        open={openCatModal}
        mode={catMode}
        initial={editingCat}
        partnerId={selectedShopId}
        onClose={() => setOpenCatModal(false)}
        onSubmit={async (payloadOrId, payloadMaybe) => {
          if (!selectedShopId) return;
          if (catMode === "create") {
            const payload = payloadOrId;
            await api.post(`/api/consignment/partners/${selectedShopId}/categories`, payload);
          } else {
            const id = payloadOrId;
            const payload = payloadMaybe;
            await api.put(`/api/consignment/partners/${selectedShopId}/categories/${id}`, payload);
          }
          setOpenCatModal(false);
          afterSavedCategory();
        }}
      />

      <ConsignmentCategoryMappingModal
        open={openMapModal}
        partnerId={selectedShopId}
        category={selectedCat}
        onClose={() => setOpenMapModal(false)}
        onAdded={async () => {
          setOpenMapModal(false);
          await loadMapped(selectedCat?.id);
          await loadCats(selectedShopId);
        }}
      />

      <BarcodeScannerModal
        open={openScan}
        onClose={() => setOpenScan(false)}
        onDetected={(code) => {
          setOpenScan(false);
          if (!selectedCat) return;
          setOpenMapModal(true);
          sessionStorage.setItem("consignment.mapping.initialQuery", code || "");
        }}
      />
    </div>
  );
}
