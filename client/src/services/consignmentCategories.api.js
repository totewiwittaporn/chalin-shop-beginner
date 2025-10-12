import api from "@/lib/api";

// ----- Categories -----
export async function listCategories(partnerId, q = "") {
  const res = await api.get("/api/consignment/categories", { params: { partnerId, q } });
  return res.data;
}

export async function createCategory({ partnerId, code, name }) {
  const res = await api.post("/api/consignment/categories", { partnerId, code, name });
  return res.data;
}

export async function updateCategory(id, payload) {
  const res = await api.put(`/api/consignment/categories/${id}`, payload);
  return res.data;
}

// ----- Mapping -----
export async function listMappedProducts(partnerId, categoryId) {
  const res = await api.get(`/api/consignment/categories/partners/${partnerId}/categories/${categoryId}/products`);
  return res.data;
}

export async function mapProduct(partnerId, categoryId, productIdOrIds) {
  const payload = Array.isArray(productIdOrIds)
    ? { productIds: productIdOrIds }
    : { productId: productIdOrIds };
  const res = await api.post(`/api/consignment/categories/partners/${partnerId}/categories/${categoryId}/map`, payload);
  return res.data;
}

export async function unmapProduct(partnerId, categoryId, productId) {
  const res = await api.delete(`/api/consignment/categories/partners/${partnerId}/categories/${categoryId}/products/${productId}`);
  return res.data;
}
