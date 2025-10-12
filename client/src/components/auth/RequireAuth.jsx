import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.js";

/**
 * กันเข้า URL ภายในถ้ายังไม่ล็อกอิน:
 * - ไม่มี token => เด้งกลับหน้าแรก "/"
 * - ส่ง roles={["ADMIN", ...]} ถ้าต้องจำกัดสิทธิ์เพิ่ม
 */
export default function RequireAuth({ roles }) {
  const location = useLocation();
  const { user } = useAuthStore.getState(); // ใช้ค่า snapshot เพื่อตัดสินใจเร็ว
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
