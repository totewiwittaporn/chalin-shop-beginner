import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { dashboardPathByRole } from '../../lib/roleRoute';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LinkButton from '../../components/ui/LinkButton';

export default function PreAuthLanding() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(dashboardPathByRole(user.role), { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card variant="gradient" className="p-20">
      <div className="max-w-3xl w-full panel p-8">
        <div className="toolbar-glass p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-white/60 border border-[var(--card-border)] grid place-items-center font-bold">CS</div>
            <div className="text-xl sm:text-2xl font-semibold">Chalin Shop – ระบบจัดการ</div>
          </div>
        </div>

        <p className="text-muted leading-relaxed">
          ยินดีต้อนรับสู่ระบบ <span className="font-semibold">Chalin Shop</span> 🎉
          กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้ของคุณ หรือสร้างบัญชีใหม่หากยังไม่มี
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LinkButton type = "success" to="/login" className="btn-white text-center">เข้าสู่ระบบ (Login)</LinkButton>
          <LinkButton type = "white" to="/sign-up" className="btn-white text-center">สมัครสมาชิก (Sign Up)</LinkButton>
        </div>

        <div className="mt-6 text-xs text-muted">
          เคล็ดลับ: หากลืมรหัสผ่าน โปรดติดต่อผู้ดูแลระบบ (ADMIN) ของสาขาคุณ
        </div>
      </div>
      </Card>
    </div>
  );
}
