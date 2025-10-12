// src/services/branches.api.js
import axios from "../lib/axios";

/** ดึงรายการสาขาทั้งหมด */
export async function getBranches() {
  const res = await axios.get("/api/branches");
  return res.data;
}

/** สร้างสาขาใหม่ */
export async function createBranch(payload) {
  // payload: { code, name, address?, commissionRate? }
  const res = await axios.post("/api/branches", payload);
  return res.data;
}

/** แก้ไขสาขา */
export async function updateBranch(id, payload) {
  const res = await axios.put(`/api/branches/${id}`, payload);
  return res.data;
}
