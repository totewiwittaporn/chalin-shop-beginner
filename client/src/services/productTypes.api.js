import api from "@/lib/axios";

/** ดึงรายการหมวดสินค้า */
export async function listProductTypes({ search = "", page = 1, pageSize = 100 } = {}) {
  const { data } = await api.get("/api/product-types", { params: { search, page, pageSize } });
  return data; // คาดหวัง { items, total, page, pageSize } หรืออย่างน้อยมี items
}

/** เพิ่มหมวดสินค้า */
export async function createProductType(payload) {
  // payload: { name, code? }
  const { data } = await api.post("/api/product-types", payload);
  return data; // row ที่สร้าง
}

/** แก้ไขหมวดสินค้า */
export async function updateProductType(id, payload) {
  const { data } = await api.put(`/api/product-types/${id}`, payload);
  return data; // row ที่อัปเดต
}
