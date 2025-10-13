// client/src/services/transfers.api.js
import api from "@/lib/axios"; // ยืนยันแล้วว่ามีไฟล์นี้

export async function listTransfers({ q = "", status = "", page = 1, pageSize = 20 } = {}) {
  const res = await api.get("/api/transfers", { params: { q, status, page, pageSize } });
  return res.data;
}

export async function getTransfer(id) {
  const res = await api.get(`/api/transfers/${id}`);
  return res.data;
}

export async function createTransfer(payload) {
  // payload: { fromBranchId, toBranchId?, toConsignmentPartnerId?, notes, items:[{productId, qty}] }
  const res = await api.post("/api/transfers", payload);
  return res.data;
}

export async function updateTransfer(id, payload) {
  const res = await api.put(`/api/transfers/${id}`, payload);
  return res.data;
}

export async function sendTransfer(id) {
  const res = await api.post(`/api/transfers/${id}/send`);
  return res.data;
}

export async function receiveTransfer(id) {
  const res = await api.post(`/api/transfers/${id}/receive`);
  return res.data;
}
