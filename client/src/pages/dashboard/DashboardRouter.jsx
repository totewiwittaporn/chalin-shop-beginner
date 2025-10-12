import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { dashboardPathByRole } from "../../lib/roleRoute";

export default function DashboardRouter() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login", { replace: true }); return; }
    navigate(dashboardPathByRole(user.role), { replace: true });
  }, [user, navigate]);

  return null;
}
