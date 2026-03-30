// app/donors/page.tsx
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { getPublicSupabaseEnv } from "@/lib/supabase-config";

export default async function DonorsPage() {
  const supabaseEnv = getPublicSupabaseEnv();
  if (!supabaseEnv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <h1 className="text-xl font-bold">ระบบยังเชื่อมต่อฐานข้อมูลไม่สำเร็จ</h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            กรุณาตั้งค่า Supabase environment variables ให้ครบก่อนใช้งานหน้านี้
          </p>
        </div>
      </div>
    );
  }

  const supabase = createClient(supabaseEnv.url, supabaseEnv.anonKey);

  const { data } = await supabase
    .from("donations")
    .select("full_name, alumni_batch, donor_type, amount, transfer_date, created_at")
    .eq("verified", true)
    .eq("publish", true)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans p-6 md:p-10">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-200/40 blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto animate-fade-up">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight leading-tight mb-2">
              รายชื่อผู้บริจาค (ตรวจสอบแล้ว)
            </h1>
            <p className="text-slate-500 text-lg font-light">
              ขอขอบพระคุณทุกท่านที่ร่วมเป็นส่วนหนึ่งในการสร้างสรรค์โดมอเนกประสงค์
            </p>
          </div>

          <Link href="/donate" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-300 min-w-[max-content]">
            + ร่วมบริจาคเลย
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden transition-all hover:bg-white/90">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-slate-500 bg-slate-50/50 text-sm tracking-wider uppercase">
                <tr>
                  <th className="p-5 font-medium border-b border-slate-100">รายชื่อผู้บริจาค</th>
                  <th className="p-5 font-medium border-b border-slate-100 hidden sm:table-cell">ประเภท</th>
                  <th className="p-5 font-medium border-b border-slate-100 text-center">รุ่น</th>
                  <th className="p-5 font-medium border-b border-slate-100 text-right">จำนวนเงิน (บาท)</th>
                  <th className="p-5 font-medium border-b border-slate-100 hidden md:table-cell">วันที่โอน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {(data || []).length === 0 ? (
                  <tr>
                    <td className="p-8 text-slate-400 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <span className="text-4xl">📄</span>
                        <p>ยังไม่มีรายการบริจาคที่ผ่านการตรวจสอบและเผยแพร่</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (data || []).map((d: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {d.full_name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-slate-800">{d.full_name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-slate-500 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium">
                          {d.donor_type === 'alumni' ? 'ศิษย์เก่า' : d.donor_type === 'parent' ? 'ผู้ปกครอง' : d.donor_type === 'organization' ? 'หน่วยงาน' : 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="p-5 text-center text-slate-600">
                        {d.alumni_batch ? (
                          <span className="font-medium text-slate-700">รุ่น {d.alumni_batch}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <span className="font-semibold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          {Number(d.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-5 text-slate-400 text-sm hidden md:table-cell">
                        {d.transfer_date ? new Date(d.transfer_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
