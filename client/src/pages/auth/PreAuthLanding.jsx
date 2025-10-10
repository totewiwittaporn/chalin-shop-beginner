import { Link } from 'react-router-dom';

export default function PreAuthLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-800 text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-2xl bg-white/20 grid place-items-center font-bold">
            CS
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Chalin Shop – ระบบจัดการ
          </h1>
        </div>
        <p className="text-white/90 leading-relaxed">
          ยินดีต้อนรับสู่ระบบ <span className="font-semibold">Chalin Shop</span> 🎉
          <br />
          กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้ของคุณ หรือสร้างบัญชีใหม่หากยังไม่มี
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-white text-sky-950 font-medium h-12 hover:bg-white/90 transition shadow-md"
          >
            เข้าสู่ระบบ (Login)
          </Link>
          <Link
            to="/sign-up"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-400/20 border border-cyan-300/30 text-white font-medium h-12 hover:bg-cyan-300/20 transition"
          >
            สมัครสมาชิก (Sign Up)
          </Link>
        </div>

        <div className="mt-6 text-xs text-white/70">
          เคล็ดลับ: หากลืมรหัสผ่าน โปรดติดต่อผู้ดูแลระบบ (ADMIN) ของสาขาคุณ
        </div>
      </div>
    </div>
  );
}
