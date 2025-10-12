import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("token") || "";
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      // กันเข้า URL ภายในถ้าหมดอายุ/ไม่มีสิทธิ์
      if (typeof window !== "undefined") window.location.replace("/");
    }
    return Promise.reject(error);
  }
);

export default api;
