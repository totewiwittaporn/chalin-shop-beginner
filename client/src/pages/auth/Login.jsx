import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LinkButton from '@/components/ui/LinkButton';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card variant="gradient" className="p-20">
        <div className="w-full max-w-md panel p-8 ">
          <div className="toolbar-glass p-3 mb-5">
            <div className="text-lg font-semibold">เข้าสู่ระบบ</div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-ml mb-1">อีเมล</label>
              <Input
                type="email"
                className="input-glass w-full glass rounded-xl px-2 py-1 text-left"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-ml mb-1">รหัสผ่าน</label>
              <Input
                type="password"
                className="input-glass w-full glass rounded-xl px-2 py-1 text-left"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button kind="success" type="submit" disabled={loading} className="btn-white w-full">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="mt-6 text-ml text-muted">
            ยังไม่มีบัญชี?{' '}
            <Link type="link" to="/sign-up" className="underline">
              สมัครสมาชิก
            </Link>
          </div>
          <div className="mt-2 text-sm text-muted">
            ต้องการกลับหน้าแรก?{' '}
            <Link type="link" className="underline" to="/">
              ก่อนเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
