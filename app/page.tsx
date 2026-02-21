// app/page.tsx
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function HomePage() {
  const supabase = supabasePublic();

  const [{ data: settings }, { data: donations }] = await Promise.all([
    supabase.from("settings").select("target_amount").eq("id", 1).single(),
    supabase
      .from("donations")
      .select("amount, alumni_batch, donor_type, created_at, full_name")
      .eq("verified", true)
      .eq("publish", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const target = Number(settings?.target_amount ?? process.env.DEFAULT_TARGET_AMOUNT ?? 500000);
  const total = (donations || []).reduce((sum, d: any) => sum + Number(d.amount || 0), 0);
  const percent = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  // รวมยอดตามรุ่น (Top 5)
  const byBatch = new Map<number, number>();
  for (const d of donations || []) {
    if (typeof d.alumni_batch === "number") {
      byBatch.set(d.alumni_batch, (byBatch.get(d.alumni_batch) || 0) + Number(d.amount || 0));
    }
  }
  const topBatches = [...byBatch.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen relative bg-slate-50 font-sans">

      {/* Decorative blurred blobs for minimal modern touch */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[100px] pointer-events-none z-0" />

      {/* Full-width Hero Section */}
      <div className="relative w-full min-h-[90vh] flex items-center justify-center pt-24 pb-32 md:pb-40 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/dome.JPG"
          alt="ภาพโครงการโดมอเนกประสงค์"
          fill
          className="object-cover absolute inset-0 z-0 animate-fade-in"
          priority
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-slate-900/60 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-900/40 to-slate-900/40 z-0 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center animate-fade-up mt-8 md:mt-16">
          <div className="flex justify-center mb-6">
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden shadow-[0_0_40px_10px_rgba(255,255,255,0.15)] border-4 border-white/90 z-10 transition-transform hover:scale-105 duration-500 focus:outline-none focus:ring-4 focus:ring-blue-300">
              <Image
                src="/school-logo.jpg"
                alt="School Logo"
                fill
                className="object-cover bg-white"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-sm text-sm font-medium tracking-wide mb-6">
            ✨ โครงการตุ้มโฮมศิษย์เก่า ปีที่ 3
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-2xl">
            ร่วมสร้าง <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-md">โดมอเนกประสงค์</span>
            <br /> <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-200 mt-4 block">โรงเรียนบ้านขัวก่าย</span>
          </h1>
          <p className="text-slate-200 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed mt-6 drop-shadow-md">
            สานฝัน พัฒนาการศึกษา เพื่อลูกหลานของเรา ยอดรวมโปร่งใสและตรวจสอบได้จากทุกยอดบริจาค
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <Link
              href="/donate"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-[0_8px_25px_-6px_rgba(14,165,233,0.6)] hover:from-blue-500 hover:to-cyan-400 hover:shadow-[0_12px_30px_-6px_rgba(14,165,233,0.8)] hover:-translate-y-0.5 transition-all duration-300 border border-blue-400/30"
            >
              + ร่วมสมทบทุน
            </Link>
            <Link
              href="/board"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 backdrop-blur-md text-white font-semibold shadow-[0_2px_15px_-4px_rgba(0,0,0,0.2)] border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300"
            >
              ดูป้ายทำเนียบรุ่น
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="relative max-w-5xl mx-auto px-6 pb-24 -mt-20 z-20">

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-up animation-delay-100">
          {/* Total Raised */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center transition-all hover:bg-white/90">
            <h3 className="text-slate-400 font-medium text-sm tracking-wider mb-2">ยอดบริจาครวม</h3>
            <div className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
              {total.toLocaleString()}
            </div>
            <span className="text-slate-400 font-medium">บาท</span>
          </div>

          {/* Progress Goal */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2 flex flex-col justify-center transition-all hover:bg-white/90">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-slate-400 font-medium text-sm tracking-wider mb-1">เป้าหมายโครงการ</h3>
                <div className="text-2xl font-bold text-slate-800">{target.toLocaleString()} บาท</div>
              </div>
              <div className="text-blue-500 font-semibold text-2xl">{percent}%</div>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-slate-400 text-sm text-right">ดำเนินการอัปเดตยอดเรียลไทม์</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up animation-delay-200">

          {/* Top Batches */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:bg-white/90">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                Top 5 รุ่นศิษย์เก่า
              </h2>
            </div>

            {topBatches.length === 0 ? (
              <div className="text-slate-400 py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">ยังไม่มีข้อมูลยอดบริจาคตามรุ่น</div>
            ) : (
              <ul className="space-y-3">
                {topBatches.map(([batch, sum], index) => (
                  <li key={batch} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-100 text-slate-500' : index === 2 ? 'bg-orange-100 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                        {index + 1}
                      </span>
                      <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">รุ่น {batch}</span>
                    </div>
                    <span className="font-bold text-slate-800">{sum.toLocaleString()} บาท</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Donors */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col transition-all hover:bg-white/90">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                ผู้บริจาคล่าสุด
              </h2>
              <Link href="/donors" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">ดูทั้งหมด &rarr;</Link>
            </div>

            {(donations || []).length === 0 ? (
              <div className="text-slate-400 py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">ยังไม่มีรายการที่ตรวจสอบแล้ว</div>
            ) : (
              <div className="flex-1">
                <ul className="space-y-4">
                  {(donations || []).slice(0, 5).map((d: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm uppercase">
                          {d.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">{d.full_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(d.created_at).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700">{Number(d.amount).toLocaleString()} ฿</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
