import api from "@/lib/api";

/** ดึงรายการสาขาทั้งหมด */
export async function getBranches() {
  const res = await api.get("/api/branches");
  return res.data;
}

/** สร้างสาขาใหม่ */
export async function createBranch(payload) {
  const res = await api.post("/api/branches", payload);
  return res.data;
}

/** แก้ไขสาขา */
export async function updateBranch(id, payload) {
  const res = await api.put(`/api/branches/${id}`, payload);
  return res.data;
}
