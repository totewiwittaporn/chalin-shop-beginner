import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * RequireAuth
 * - รองรับทั้ง props: roles | allowed  (ใช้ตัวไหนก็ได้)
 * - รองรับทั้ง pattern: children-render และ Outlet-render
 */
export default function RequireAuth({ roles, allowed, children }) {
  const location = useLocation();

  // อ่าน user จาก store (แนวของโปรเจกต์คุณ)
  const { user } = useAuthStore.getState();

  // ถ้าโปรเจกต์คุณเก็บ token ไว้ใน store ก็ใช้จาก store ได้
  // ที่นี่อ่านจาก localStorage ตามเวอร์ชันที่คุณส่งมา
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const need = roles || allowed; // รองรับทั้งสองชื่อ

  // ยังไม่ล็อกอิน → ส่งกลับหน้า public (คุณใช้ "/" อยู่)
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // ตรวจ role ถ้ากำหนดรายการที่อนุญาตไว้
  if (need && user && !need.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // รองรับทั้งสองรูปแบบ: children priority > Outlet
  return children ? <>{children}</> : <Outlet />;
}
