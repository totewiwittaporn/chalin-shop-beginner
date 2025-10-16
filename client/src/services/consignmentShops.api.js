import api from "@/lib/api";

/** GET list (รองรับ q, status=ACTIVE|INACTIVE) */
export async function listShops(params = {}) {
  const res = await api.get("/api/consignment/partners", { params });
  // รองรับทั้งรูปแบบ { items: [...] } หรือเป็น array ตรง ๆ
  return res.data?.items ?? res.data ?? [];
}

/** POST create */
export async function createShop(payload) {
  // ส่งทั้ง isActive และ status เพื่อความเข้ากันได้
  const p = {
    ...payload,
    isActive: payload.isActive ?? payload.status === "ACTIVE",
    status: payload.status ?? (payload.isActive ? "ACTIVE" : "INACTIVE"),
  };
  const res = await api.post("/api/consignment/partners", p);
  return res.data;
}

/** PUT update */
export async function updateShop(id, payload) {
  const p = {
    ...payload,
    isActive: payload.isActive ?? payload.status === "ACTIVE",
    status: payload.status ?? (payload.isActive ? "ACTIVE" : "INACTIVE"),
  };
  const res = await api.put(`/api/consignment/partners/${id}`, p);
  return res.data;
}
