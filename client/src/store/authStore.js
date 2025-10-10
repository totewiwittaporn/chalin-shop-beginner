import { create } from "zustand";
import api from "@/lib/api";

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,

  setToken: (t) => set({ token: t }),
  setUser: (u) => set({ user: u }),

  login: async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const token = String(res.data?.token || "").trim();
    localStorage.setItem("token", token);
    set({ token, user: res.data?.user || null });
    return res.data?.user || null;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  hydrateFromServer: async () => {
    const raw = localStorage.getItem("token") || "";
    if (!raw) return set({ token: null, user: null });
    set({ token: raw });
    try {
      const me = await api.get("/api/_debug/whoami");
      set({ user: me.data?.user || null });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, user: null });
    }
  },
}));