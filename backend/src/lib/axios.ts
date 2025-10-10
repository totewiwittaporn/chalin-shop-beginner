// src/lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("token"); // ← ดึง “ค่าเปล่า”
  if (raw && config.headers) {
    // ป้องกัน Bearer ซ้ำ หรือเครื่องหมายคำพูด/ช่องว่างแฝง
    const token = raw.replace(/^Bearer\s+/i, "").trim();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
