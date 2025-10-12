import api from "@/lib/api";

/** ดึงรายการร้านฝากขาย */
export async function listShops({ q = "", status } = {}) {
  const res = await api.get("/api/consignment/partners", {
    params: { q, ...(status ? { status } : {}) },
  });
  return res.data;
}

/** สร้างร้านฝากขาย */
export async function createShop(payload) {
  const res = await api.post("/api/consignment/partners", payload);
  return res.data;
}

/** แก้ไขร้านฝากขาย */
export async function updateShop(id, payload) {
  const res = await api.put(`/api/consignment/partners/${id}`, payload);
  return res.data;
}
