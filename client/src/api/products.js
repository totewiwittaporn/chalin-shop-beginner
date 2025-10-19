// client/src/api/products.js
import api from "@/lib/api";

// ใช้ endpoint เดียวกับหน้าส่งสินค้า และแนบ Bearer token อัตโนมัติจาก "@/lib/axios"
export async function searchProductsSimple(q, take = 20, branchId) {
  const params = { q, take: String(take) };
  if (branchId) params.branchId = String(branchId); // POS สามารถส่ง branchId เพื่อรวม stock สาขาได้
  const { data } = await api.get("/api/products/search", { params });
  return Array.isArray(data?.items) ? data.items : [];
}
