import { create } from "zustand";
import api from "@/lib/api";

export const useUserStore = create((set) => ({
  users: [],
  loadUsers: async () => {
    const res = await api.get("/api/users"); // ต้องมี route จริง (ถ้ายังไม่มี ให้ซ่อนไว้ก่อน)
    set({ users: res.data || [] });
  },
}));