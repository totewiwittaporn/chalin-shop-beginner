import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk(false);
    try {
      await api.post("/api/auth/register", { name, email, password });
      setOk(true);
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card variant="gradient" className="p-20">
      <div className="w-full max-w-md panel p-8">
        <div className="toolbar-glass p-3 mb-5">
          <div className="text-lg font-semibold">สมัครสมาชิก</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
            <Input
              type="text"
              className="input-glass w-full glass rounded-xl px-2 py-1 text-left"
              placeholder="สมชาย ใจดี"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">อีเมล</label>
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
            <label className="block text-sm mb-1">รหัสผ่าน</label>
            <Input
              type="password"
              className="input-glass w-full glass rounded-xl px-2 py-1 text-left"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}
          {ok && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              สมัครสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ…
            </div>
          )}

          <Button kind="success" type="submit" disabled={loading} className="btn-white w-full">
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </Button>
        </form>

        <div className="mt-6 text-ml text-muted">
          มีบัญชีอยู่แล้ว? <Link to="/login" className="underline">เข้าสู่ระบบ</Link>
        </div>
        <div className="mt-2 text-sm text-muted">
          ต้องการกลับหน้าแรก? <Link className="underline" to="/">ก่อนเข้าสู่ระบบ</Link>
        </div>
      </div>
      </Card>
    </div>
  );
}
