import Link from "next/link";
import BoardDisplay from "@/app/board/BoardDisplay";
import { supabaseService } from "@/lib/supabase-server";
import { getServiceSupabaseEnv } from "@/lib/supabase-config";

type BoardPageProps = {
  searchParams?: Promise<{
    view?: string;
    key?: string;
    label?: string;
  }>;
};

type DonorInfo = {
  total: number;
  batches: Map<number, number>;
  team_name?: string;
};

function pickMainBatch(batches: Map<number, number>): number | null {
  const rows = [...batches.entries()].sort((a, b) => b[1] - a[1]);
  return rows.length > 0 ? rows[0][0] : null;
}

export default async function AdminBoardPage({ searchParams }: BoardPageProps) {
  const supabaseEnv = getServiceSupabaseEnv();
  if (!supabaseEnv) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <h1 className="text-xl font-bold">ระบบเชื่อมต่อฐานข้อมูลยังไม่พร้อม</h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            กรุณาตั้งค่า Supabase service environment variables ให้ครบก่อนเข้า Board
          </p>
        </div>
      </main>
    );
  }

  const supabase = supabaseService();

  const [{ data: settings }, { data: donations }] = await Promise.all([
    supabase
      .from("settings")
      .select("target_amount")
      .eq("id", 1)
      .single(),
    supabase
      .from("donations")
      .select("amount, alumni_batch, full_name, team_name, verified, publish, status, created_at")
      .eq("verified", true)
      .eq("publish", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const target = Number(settings?.target_amount ?? process.env.DEFAULT_TARGET_AMOUNT ?? 500000);
  const byBatch = new Map<number, number>();
  const byDonor = new Map<string, DonorInfo>();
  let totalAll = 0;

  for (const d of donations || []) {
    const amount = Number(d.amount || 0);
    totalAll += amount;

    if (typeof d.alumni_batch === "number") {
      byBatch.set(d.alumni_batch, (byBatch.get(d.alumni_batch) || 0) + amount);
    }

    const donorName = String(d.full_name || "ไม่ระบุชื่อ").trim() || "ไม่ระบุชื่อ";
    const current = byDonor.get(donorName) || { total: 0, batches: new Map<number, number>() };
    current.total += amount;
    if (typeof d.alumni_batch === "number") {
      current.batches.set(d.alumni_batch, (current.batches.get(d.alumni_batch) || 0) + amount);
    }
    current.team_name = d.team_name || undefined;
    byDonor.set(donorName, current);
  }

  const batchRows = [...byBatch.entries()].sort((a, b) => b[1] - a[1]);
  const donorRows = [...byDonor.entries()]
    .map(([name, info]) => ({
      name,
      total: info.total,
      mainBatch: pickMainBatch(info.batches),
      team_name: info.team_name,
    }))
    .sort((a, b) => b.total - a.total);

  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams?.view === "donor" ? "donor" : "batch";
  const labelMode = resolvedSearchParams?.label === "name" ? "name" : "batch";
  const keyParam = resolvedSearchParams?.key || "";

  let selectedLabel = "ยอดบริจาครวม";
  let selectedTotal = totalAll;
  let selectedTeam: string | undefined;

  if (view === "batch") {
    const parsed = Number(keyParam);
    const selectedBatch = Number.isInteger(parsed) && byBatch.has(parsed) ? parsed : batchRows[0]?.[0] ?? null;
    if (selectedBatch !== null) {
      selectedTotal = byBatch.get(selectedBatch) || 0;
      selectedLabel = labelMode === "name" ? `กลุ่มผู้บริจาครุ่น ${selectedBatch}` : `รุ่น ${selectedBatch}`;
    }
  } else {
    const selectedDonor = donorRows.find((d) => d.name === keyParam) ?? donorRows[0] ?? null;
    if (selectedDonor) {
      selectedTotal = selectedDonor.total;
      selectedTeam = selectedDonor.team_name;
      if (labelMode === "name") {
        selectedLabel = selectedDonor.name;
      } else {
        selectedLabel = selectedDonor.mainBatch ? `รุ่น ${selectedDonor.mainBatch}` : "ไม่ระบุรุ่น";
      }
    }
  }

  const logoSrc = "/school-logo.jpg";
  const domeSrc = "/dome.JPG";

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 font-sans p-4 md:p-8">
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-200/40 blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl animate-fade-up">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
          >
            ← กลับหน้าแอดมิน
          </Link>
          <div className="text-xs md:text-sm text-slate-500 font-medium px-3 py-1 bg-white/60 rounded-full border border-slate-200">
            ป้ายสัดส่วน 16:9 สำหรับแสดงหน้าจอ
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="px-4 py-6 md:px-8">
            <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4" method="GET" action="/admin/board">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                เลือกประเภทข้อมูล
                <select name="view" defaultValue={view} className={selectClass}>
                  <option value="batch">ศิษย์เก่า (รุ่น)</option>
                  <option value="donor">ผู้บริจาค (รายชื่อ)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-600">
                เลือกรายการ
                <select name="key" defaultValue={keyParam} className={selectClass}>
                  {view === "batch"
                    ? batchRows.map(([batch]) => (
                        <option key={batch} value={String(batch)}>
                          รุ่น {batch}
                        </option>
                      ))
                    : donorRows.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-600">
                ข้อความบนป้าย
                <select name="label" defaultValue={labelMode} className={selectClass}>
                  <option value="name">โชว์ชื่อ</option>
                  <option value="batch">โชว์รุ่น</option>
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  แสดงผลป้าย
                </button>
              </div>
            </form>

            <BoardDisplay
              domeSrc={domeSrc}
              logoSrc={logoSrc}
              selectedLabel={selectedLabel}
              selectedTotal={selectedTotal}
              selectedTeam={selectedTeam}
            />

            <p className="mt-3 text-xs text-slate-500">
              วางไฟล์ภาพที่ `public/school-logo.jpg` และ `public/dome.png` เพื่อให้แสดงภาพจริง
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
              <h2 className="text-center text-lg font-semibold text-slate-900 md:text-2xl">ข้อมูลสำหรับเลือกแสดงบนป้าย</h2>
              {view === "batch" ? (
                batchRows.length === 0 ? (
                  <p className="mt-3 text-center text-slate-600">ยังไม่มีข้อมูลรุ่นที่เผยแพร่</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {batchRows.slice(0, 12).map(([batch, amount], idx) => (
                      <div key={batch} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 gap-2">
                        <div className="font-medium text-slate-800 min-w-0 truncate">{idx + 1}. รุ่น {batch}</div>
                        <div className="font-semibold text-slate-900 shrink-0 whitespace-nowrap">{amount.toLocaleString("th-TH")} บาท</div>
                      </div>
                    ))}
                  </div>
                )
              ) : donorRows.length === 0 ? (
                <p className="mt-3 text-center text-slate-600">ยังไม่มีข้อมูลผู้บริจาคที่เผยแพร่</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {donorRows.slice(0, 12).map((donor, idx) => (
                    <div key={donor.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 gap-2">
                      <div className="font-medium text-slate-800 min-w-0 truncate">
                        {idx + 1}. {donor.name}
                        {donor.mainBatch ? ` (รุ่น ${donor.mainBatch})` : ""}
                      </div>
                      <div className="font-semibold text-slate-900 shrink-0 whitespace-nowrap">{donor.total.toLocaleString("th-TH")} บาท</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
