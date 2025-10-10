import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("token") || "";
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      // window.location.href = "/login"; // เปิดใช้ได้หากต้องการ
    }
    return Promise.reject(err);
  }
);

export default api;