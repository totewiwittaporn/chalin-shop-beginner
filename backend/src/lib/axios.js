// client/src/lib/axios.js
import axios from "axios";

// ลำดับการหา baseURL:
// 1) window.__API_URL__ (ถ้าตั้งไว้จาก index.html หรือ runtime script)
// 2) import.meta.env.VITE_API_URL / import.meta.env.NEXT_PUBLIC_API_URL (Vite หรือ Next ที่ถูก inline ตอน build)
// 3) process.env.NEXT_PUBLIC_API_URL / process.env.VITE_API_URL (บางกรณี Next ยังแทนค่าให้ได้)
// 4) fallback: http://localhost:5000
function resolveBaseURL() {
  // 1) runtime global
  if (typeof window !== "undefined" && window.__API_URL__) return window.__API_URL__;

  // 2) Vite or Next (build-time)
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
      if (import.meta.env.NEXT_PUBLIC_API_URL) return import.meta.env.NEXT_PUBLIC_API_URL;
    }
  } catch {}

  // 3) Next.js build-time replacement (บางเคส editor ยังขีดแดง แต่ build ใช้ค่าได้)
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  }

  // 4) fallback
  return "http://localhost:5000";
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true, // ถ้าใช้งาน cookie auth
});

// แนบ Bearer token อัตโนมัติก่อนยิงทุก request
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("token");
    if (raw) {
      const token = raw.replace(/^Bearer\s+/i, "").trim();
      config.headers = config.headers || {};
      // กันซ้ำ
      if (!/^Bearer\s+/i.test(config.headers.Authorization || "")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

// (ทางเลือก) แนบตัวจัดการ 401 เพื่อเคลียร์ token/redirect
// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err?.response?.status === 401) {
//       localStorage.removeItem("token");
//       // redirect ไปหน้า login ได้ตาม flow ของแอป
//     }
//     return Promise.reject(err);
//   }
// );

export default api;
