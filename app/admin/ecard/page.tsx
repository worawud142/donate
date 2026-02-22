"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toPng } from 'html-to-image';
import ECardTemplate, { ECardData } from "./ECardTemplate";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Donation = {
    id: string;
    full_name: string;
    alumni_batch: number | null;
    amount: number;
    transfer_date: string;
    status: string;
    team_name?: string;
};

export default function AdminECardPage() {
    const [items, setItems] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

    // Status flags for the image generation
    const [isGenerating, setIsGenerating] = useState(false);

    const ecardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            setLoading(true);
            setAuthError(null);

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                router.push("/admin/login");
                return;
            }

            // Fetch only approved donations
            const { data: itemsData, error: itemsError } = await supabase
                .from("donations")
                .select("id, full_name, alumni_batch, amount, transfer_date, status, team_name")
                .eq("status", "approved")
                .order("created_at", { ascending: false });

            if (itemsError) {
                setAuthError(`ดึงข้อมูลล้มเหลว: ${itemsError.message}`);
            } else {
                setItems(itemsData || []);
            }
            setLoading(false);
        }
        load();
    }, [router]);

    const handleDownload = useCallback(async () => {
        if (ecardRef.current === null || !selectedDonation) {
            return;
        }

        try {
            setIsGenerating(true);

            // Need a slight delay for fonts/images to fully render before screenshot if just opened
            await new Promise(resolve => setTimeout(resolve, 300));

            const dataUrl = await toPng(ecardRef.current, {
                quality: 1.0, width: 1080, height: 1350
            });

            const link = document.createElement('a');
            link.download = `ThankYou_ECard_${selectedDonation.full_name.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
            alert('เกิดข้อผิดพลาดในการสร้างรูปภาพ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsGenerating(false);
        }
    }, [selectedDonation]);

    const ecardData: ECardData | null = selectedDonation ? {
        fullName: selectedDonation.full_name,
        amount: selectedDonation.amount,
        batch: selectedDonation.alumni_batch,
        teamName: selectedDonation.team_name,
    } : null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans p-6 md:p-10">
            {/* Decorative blurred blobs */}
            <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-200/40 blur-[100px] pointer-events-none" />

            <div className="relative max-w-[90rem] mx-auto animate-fade-up">
                <div className="mb-6 flex gap-4">
                    <Link
                        href="/admin"
                        className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
                    >
                        ← กลับหน้าระบบแอดมิน (Dashboard)
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">สร้าง E-Card ขอบคุณผู้บริจาค</h1>
                        <p className="text-slate-500 mt-2 text-sm">สร้างรูปภาพโปสเตอร์ E-Card ทางการส่งให้ผู้บริจาค (เฉพาะรายการที่อนุมัติแล้ว)</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center gap-3 py-10 px-5 text-slate-500">
                        <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" /> กำลังโหลดข้อมูล...
                    </div>
                ) : authError ? (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-red-600">
                        {authError}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                        {/* Left side: List of Donors */}
                        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[75vh]">
                            <div className="p-5 border-b border-slate-100/80 bg-slate-50/50 font-semibold text-slate-700">
                                เลือกรายชื่อผู้บริจาคเพื่อสร้างป้าย
                            </div>
                            <div className="overflow-y-auto flex-1 p-2">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="text-slate-400 text-xs tracking-wider uppercase sticky top-0 bg-white/95 backdrop-blur z-10">
                                        <tr>
                                            <th className="p-3 font-medium border-b border-slate-100">ชื่อผู้บริจาค</th>
                                            <th className="p-3 font-medium border-b border-slate-100 text-center">รุ่น</th>
                                            <th className="p-3 font-medium border-b border-slate-100 text-right">ยอดเงิน</th>
                                            <th className="p-3 font-medium border-b border-slate-100 text-center">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/80">
                                        {items.map((d) => (
                                            <tr
                                                key={d.id}
                                                className={`transition-colors cursor-pointer ${selectedDonation?.id === d.id ? 'bg-blue-50/70 border-l-4 border-l-blue-500' : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'}`}
                                                onClick={() => setSelectedDonation(d)}
                                            >
                                                <td className="p-3">
                                                    <div className="font-medium text-slate-800">{d.full_name}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(d.transfer_date).toLocaleDateString('th-TH')}</div>
                                                </td>
                                                <td className="p-3 text-center text-slate-600">{d.alumni_batch ?? "-"}</td>
                                                <td className="p-3 text-right">
                                                    <span className="font-semibold text-slate-800">
                                                        {Number(d.amount).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm transition-colors ${selectedDonation?.id === d.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDonation(d);
                                                        }}
                                                    >
                                                        แสดงป้าย
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right side: Preview and Download */}
                        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col h-[75vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <span className="text-xl">🖼️</span> ดูตัวอย่างและดาวน์โหลด E-Card
                                </h2>
                                {selectedDonation && (
                                    <button
                                        onClick={handleDownload}
                                        disabled={isGenerating}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> กำลังสร้างภาพ...</>
                                        ) : (
                                            <>📥 ดาวน์โหลดภาพ (.png)</>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center p-4 overflow-hidden relative">
                                {!selectedDonation ? (
                                    <div className="text-center text-slate-400">
                                        <div className="text-4xl mb-4">👈</div>
                                        <div>คลิกเลือกรายการผู้บริจาคจากตารางทางซ้ายมือ<br />เพื่อดูตัวอย่างป้ายและกดดาวน์โหลด</div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full overflow-hidden flex items-center justify-center bg-transparent rounded-xl">
                                        {/* 
                         We render the full 1080x1350 template inside a container that scales it down 
                         using CSS transform so it acts like a thumbnail preview.
                      */}
                                        <div className="relative" style={{ width: '400px', height: '500px' }}>
                                            <div style={{ transform: 'scale(0.3703)', transformOrigin: 'top left' }}>
                                                <ECardTemplate
                                                    ref={ecardRef}
                                                    data={ecardData}
                                                    domeSrc="/dome.JPG"
                                                    logoSrc="/school-logo.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
