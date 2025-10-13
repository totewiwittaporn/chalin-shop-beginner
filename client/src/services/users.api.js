// client/src/services/users.api.js
import api from "@/lib/api";

/**
 * ดึงผู้ใช้ทั้งหมด (ยกเว้น ADMIN โดยปริยาย)
 * ควรยิงที่ /api/users (ไม่ใช่ /users)
 */
export async function listUsers(params = {}) {
  const { excludeRole = "ADMIN" } = params;
  const res = await api.get("/api/users", { params: { excludeRole } });
  return res.data; // { items, total }
}

/**
 * อัปเดต user
 * body: { name?, email?, role?, branchId?, partnerId? }
 * ควรยิงที่ /api/users/:id
 */
export async function updateUser(id, body) {
  const res = await api.patch(`/api/users/${id}`, body);
  return res.data;
}
