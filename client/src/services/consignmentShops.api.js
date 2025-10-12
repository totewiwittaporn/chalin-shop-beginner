import api from "@/lib/api";

export async function listShops(params = {}) {
  const res = await api.get("/api/consignment/partners", { params });
  // รองรับทั้งรูปแบบ { items: [...] } หรือเป็น array ตรง ๆ
  return res.data?.items ?? res.data ?? [];
}

export async function createShop(payload) {
  const res = await api.post("/api/consignment/partners", payload);
  return res.data;
}

export async function updateShop(id, payload) {
  const res = await api.put(`/api/consignment/partners/${id}`, payload);
  return res.data;
}
