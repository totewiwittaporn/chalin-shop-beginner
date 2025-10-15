import { create } from "zustand";
import api from "@/lib/api";

/**
 * มาตรฐาน token:
 * - เก็บ localStorage key = "token"
 * - Authorization: Bearer <token>
 * Endpoint ตรวจผู้ใช้: GET /api/auth/me
 */
export const ROLES = ['ADMIN', 'STAFF', 'CONSIGNMENT', 'QUOTE_VIEWER'];

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,

  setToken: (t) => set({ token: t }),
  setUser: (u) => set({ user: u }),

  login: async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const token = String(res.data?.token || "").trim();
    localStorage.setItem("token", token);
    set({ token });
    // ดึงข้อมูล user สด ๆ จาก /me เพื่อให้แน่ใจว่า role/branch ตรง
    const me = await api.get("/api/auth/me");
    set({ user: me.data || null });
    return me.data || null;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  hydrateFromServer: async () => {
    const token = localStorage.getItem("token") || "";
    if (!token) return set({ token: null, user: null });
    set({ token });
    try {
      const me = await api.get("/api/auth/me");
      set({ user: me.data || null });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, user: null });
    }
  },
}));

