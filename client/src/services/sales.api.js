import api from "@/lib/api";

export async function createSale(payload) {
  const { data } = await api.post("/api/sales", payload);
  return data;
}

export async function paySale(id, payload) {
  const { data } = await api.post(`/api/sales/${id}/pay`, payload);
  return data;
}

export async function getSale(id) {
  const { data } = await api.get(`/api/sales/${id}`);
  return data;
}

export async function listSales(params) {
  const { data } = await api.get("/api/sales", { params });
  return data;
}
