import UsersPage from "@/pages/users/UsersPage.jsx";

/**
 * UsersSettingsTab
 * - ห่อ UsersPage เดิมเพื่อใช้เป็นแท็บในหน้า Settings
 * - ไม่แก้ไขโค้ดภายใน UsersPage.jsx เพื่อเลี่ยง side effects
 */
export default function UsersSettingsTab() {
  return <UsersPage />;
}
