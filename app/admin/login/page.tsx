"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      router.push("/admin");
    } catch (error: any) {
      setErr(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 p-6 md:p-10 font-sans overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <form onSubmit={login} className="w-full bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 md:p-10 space-y-6 transition-all hover:bg-white/90">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">ระบบจัดการหลังบ้าน</h1>
            <p className="text-slate-500 text-sm mt-2">สำหรับผู้ดูแลระบบ โครงการโดมอเนกประสงค์</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">อีเมล (Email)</label>
              <input
                name="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="admin@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">รหัสผ่าน (Password)</label>
              <input
                name="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            สามารถใช้ระบบบันทึกรหัสผ่านของเบราว์เซอร์ได้
          </div>

          {err && <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-600 text-center">{err}</div>}

          <button
            disabled={loading}
            className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-60 disabled:cursor-not-allowed py-3.5 font-semibold shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" /> กำลังเข้าสู่ระบบ...
              </span>
            ) : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
