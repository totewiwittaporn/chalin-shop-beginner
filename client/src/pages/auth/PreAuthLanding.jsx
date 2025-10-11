import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { dashboardPathByRole } from '../../lib/roleRoute';

export default function PreAuthLanding() {
  
    const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(dashboardPathByRole(user.role), { replace: true });
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--nav-fg)] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full backdrop-blur-xl bg-gradient-to-b from-[#9db9ff] to-[#6f86ff] border border-[var(--surface-border)] rounded-3xl shadow-2xl p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] grid place-items-center font-bold">
            CS
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Chalin Shop – ระบบจัดการ
          </h1>
        </div>
        <p className="text-[var(--muted)] leading-relaxed">
          ยินดีต้อนรับสู่ระบบ <span className="font-semibold">Chalin Shop</span> 🎉
          <br />
          กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้ของคุณ หรือสร้างบัญชีใหม่หากยังไม่มี
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] text-[var(--brand-contrast)] font-medium h-12 hover:opacity-90 transition shadow-md"
          >
            เข้าสู่ระบบ (Login)
          </Link>
          <Link
            to="/sign-up"
            className="inline-flex items-center justify-center rounded-xl bg-transparent border border-[var(--accent)] text-[var(--nav-fg)] font-medium h-12 hover:opacity-90 transition"
          >
            สมัครสมาชิก (Sign Up)
          </Link>
        </div>

        <div className="mt-6 text-xs text-[var(--muted)]">
          เคล็ดลับ: หากลืมรหัสผ่าน โปรดติดต่อผู้ดูแลระบบ (ADMIN) ของสาขาคุณ
        </div>
      </div>
    </div>
  );
}
