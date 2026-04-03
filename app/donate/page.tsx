// app/donate/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SLIP_MAX_DIMENSION = 1600;
const SLIP_MIN_SIZE_TO_COMPRESS = 350 * 1024;
const SLIP_COMPRESS_QUALITY = 0.82;

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("โหลดรูปสลิปไม่สำเร็จ"));
    });

    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch {
        // Some browsers decode lazily; the onload result is still usable for canvas draw.
      }
    }

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function compressSlipImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "slip";
  const shouldCompress =
    file.size > SLIP_MIN_SIZE_TO_COMPRESS ||
    file.type === "image/png" ||
    file.type === "image/webp";

  if (!shouldCompress) {
    return file;
  }

  try {
    const image = await loadImageFromFile(file);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      return file;
    }

    const scale = Math.min(1, SLIP_MAX_DIMENSION / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    if (scale === 1 && file.size <= SLIP_MIN_SIZE_TO_COMPRESS) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const webpBlob = await canvasToBlob(canvas, "image/webp", SLIP_COMPRESS_QUALITY);
    const outputBlob = webpBlob || (await canvasToBlob(canvas, "image/jpeg", SLIP_COMPRESS_QUALITY));
    if (!outputBlob) {
      return file;
    }

    const outputExt = outputBlob.type === "image/webp" ? "webp" : "jpg";
    return new File([outputBlob], `${baseName}-compressed.${outputExt}`, {
      type: outputBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Could not compress slip image, uploading original file instead.", error);
    return file;
  }
}

export default function DonatePage() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<"transfer" | "cash">("transfer");
  const router = useRouter();
  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSuccessName(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const fullName = String(fd.get("full_name") || "").trim();

    try {
      const slipFile = fd.get("slip");
      if (donationType === "transfer" && slipFile instanceof File && slipFile.size > 0) {
        const compressedSlip = await compressSlipImage(slipFile);
        fd.set("slip", compressedSlip, compressedSlip.name);
      }

      const res = await fetch("/api/donate", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "ส่งข้อมูลไม่สำเร็จ");
      setSuccessName(fullName);
      setSuccessMessage(json.message || "ระบบได้รับข้อมูลเรียบร้อยแล้ว");
      form.reset();
      setDonationType("transfer");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans p-6 md:p-10">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[100px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto animate-fade-up">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight leading-tight mb-3">
            ร่วมสมทบทุนสร้าง โดมอเนกประสงค์
          </h1>
          <p className="text-slate-500 text-lg font-light leading-relaxed mb-6">
            ขอขอบพระคุณทุกยอดบริจาค กรุณาแนบสลิปเพื่อให้แอดมินตรวจสอบความถูกต้อง
          </p>

          {/* Bank Account Details Card */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-sky-100/50 w-32 h-32">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center p-2 border border-slate-100 overflow-hidden">
                  <img src="/images/BAAC_Logo.png" alt="BAAC Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">บัญชีธนาคาร (ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร)</div>
                  <div className="text-lg font-semibold text-slate-800">ชื่อบัญชี: ( ผ้าป่าเพื่อการศึกษาโรงเรียนบ้านขัวก่าย)</div>
                  <div className="text-2xl font-bold text-sky-700 tracking-wider mt-1 font-mono">
                    020230032103
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText("020230032103");
                    const btn = document.getElementById("copy-btn-text");
                    if (btn) {
                      const original = btn.innerText;
                      btn.innerText = "คัดลอกแล้ว! ✅";
                      setTimeout(() => (btn.innerText = original), 2000);
                    }
                  }}
                  type="button"
                  className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span id="copy-btn-text">คัดลอกเลขบัญชี</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-10 space-y-6 transition-all hover:bg-white/90">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-600">ชื่อ-สกุล *</label>
            <input name="full_name" required className={fieldClass} placeholder="เช่น นายใจดี มีน้ำใจ" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">รุ่นศิษย์เก่า (ตัวเลข)</label>
              <input name="alumni_batch" inputMode="numeric" className={fieldClass} placeholder="เช่น ปี 2550, ปี 2551 (ถ้ามี)" />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">ประเภทผู้บริจาค *</label>
              <select name="donor_type" className={fieldClass} defaultValue="alumni">
                <option value="alumni">ศิษย์เก่า</option>
                <option value="parent">ผู้ปกครอง</option>
                <option value="organization">หน่วยงาน/ห้างร้าน</option>
                <option value="public">ประชาชนทั่วไป</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-600">ทีม/แก๊ง (ถ้าไม่ใช่ศิษย์เก่า)</label>
            <input name="team_name" className={fieldClass} placeholder="เช่น ทีมฟุตบอล, คณะวิศวกรรม, บริษัท ABC" />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-600">ประเภทการบริจาค *</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="donation_method"
                  value="transfer"
                  checked={donationType === "transfer"}
                  onChange={(e) => setDonationType("transfer")}
                  className="mr-2"
                />
                <span className="text-slate-700">โอนเงิน</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="donation_method"
                  value="cash"
                  checked={donationType === "cash"}
                  onChange={(e) => setDonationType("cash")}
                  className="mr-2"
                />
                <span className="text-slate-700">เงินสด</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">จำนวนเงิน (บาท) *</label>
              <input name="amount" required inputMode="decimal" className={fieldClass} placeholder="เช่น 500" />
            </div>
            {donationType === "transfer" ? (
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-600">วันที่โอน *</label>
                <input name="transfer_date" required type="date" className={fieldClass} />
              </div>
            ) : (
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-600">วันที่บริจาค *</label>
                <input name="donation_date" required type="date" className={fieldClass} />
              </div>
            )}
          </div>

          {donationType === "transfer" && (
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">ช่องทางโอน</label>
              <input name="channel" className={fieldClass} placeholder="เช่น ธนาคารกสิกรไทย / พร้อมเพย์" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">เบอร์ติดต่อ (ไม่บังคับ)</label>
              <input name="phone" className={fieldClass} placeholder="เช่น 081-xxx-xxxx" />
            </div>
            {donationType === "transfer" ? (
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-600">แนบสลิป (ระบบย่อรูปให้อัตโนมัติ) *</label>
                <input
                  name="slip"
                  required
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all file:cursor-pointer cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-600">หมายเหตุ (ไม่บังคับ)</label>
                <input name="cash_note" className={fieldClass} placeholder="เช่น บริจาคผ่านคุณครู/แอดมิน" />
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-600">ข้อความถึงโรงเรียน (ไม่บังคับ)</label>
            <textarea name="message" className={fieldClass} rows={3} placeholder="ความรู้ศึกดีๆ หรือคำอวยพร..." />
          </div>

          {error && <div className="text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl text-sm">{error}</div>}

          <div className="pt-4">
            <button
              disabled={loading}
              className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-60 disabled:cursor-not-allowed py-3.5 font-semibold shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" /> กำลังส่งข้อมูล...
                </span>
              ) : "ส่งข้อมูลบริจาค"}
            </button>
          </div>
        </form>
      </div>

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-2xl font-bold">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">ส่งข้อมูลสำเร็จ</h2>
                <p className="text-sm text-slate-500">ขอบคุณที่ร่วมสมทบทุน</p>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-800">
                {successName ? `ขอบคุณคุณ${successName}` : "ขอบคุณสำหรับการบริจาค"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
