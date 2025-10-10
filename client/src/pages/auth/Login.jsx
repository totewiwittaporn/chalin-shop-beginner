import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/app", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-white/80">กรอกอีเมลและรหัสผ่านของคุณ</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">อีเมล</label>
            <input
              type="email"
              className="w-full h-11 rounded-xl px-4 bg-white/90 text-sky-950 placeholder-sky-900/50 outline-none focus:ring-4 focus:ring-cyan-300/40"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full h-11 rounded-xl px-4 bg-white/90 text-sky-950 placeholder-sky-900/50 outline-none focus:ring-4 focus:ring-cyan-300/40"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg p-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-white text-sky-950 font-semibold shadow-md hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-6 text-sm text-white/80">
          ยังไม่มีบัญชี? <Link to="/sign-up" className="underline">สมัครสมาชิก</Link>
        </div>
        <div className="mt-2 text-xs text-white/70">ต้องการกลับหน้าแรก? <Link className="underline" to="/welcome">ก่อนเข้าสู่ระบบ</Link></div>
      </div>
    </div>
  );
}