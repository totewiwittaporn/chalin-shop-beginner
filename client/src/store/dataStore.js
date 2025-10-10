import { create } from "zustand";
import api from "../lib/api";

export const useDataStore = create((set, get) => ({
  products: [],
  productTypes: [],
  branches: [],

  // โหลดประเภทสินค้า (จริง)
  loadProductTypes: async (search = "") => {
    const res = await api.get("/api/product-types", { params: { search } });
    set({ productTypes: res.data || [] });
    return res.data || [];
  },

  // เพิ่ม/แก้/ลบ ประเภทสินค้า (ADMIN เท่านั้น)
  createProductType: async (name) => {
    const res = await api.post("/api/product-types", { name });
    // รีโหลด หรืออัปเดตในหน่วยความจำ
    await get().loadProductTypes();
    return res.data;
  },
  updateProductType: async (id, name) => {
    const res = await api.put(`/api/product-types/${id}`, { name });
    await get().loadProductTypes();
    return res.data;
  },
  removeProductType: async (id) => {
    await api.delete(`/api/product-types/${id}`);
    await get().loadProductTypes();
  },

  // โหลดรายชื่อสาขา (จริง)
  loadBranches: async () => {
    const res = await api.get("/api/branches");
    set({ branches: res.data || [] });
    return res.data || [];
  },
}));