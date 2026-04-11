"use client";

import { forwardRef } from "react";
import CountUp from "@/components/CountUp";

export type ECardData = {
    fullName: string;
    amount: number;
    batch?: number | null;
    teamName?: string;
};

type Props = {
    data: ECardData | null;
    domeSrc: string;
    logoSrc: string;
    showName?: boolean;
    showBatch?: boolean;
};

const ECardTemplate = forwardRef<HTMLDivElement, Props>(({ data, domeSrc, logoSrc, showName = true, showBatch = true }, ref) => {
    if (!data) return null;

    return (
        <div
            ref={ref}
            // Standard 4:5 ratio for portrait social media posts
            className="relative w-[1080px] h-[1350px] bg-slate-50 overflow-hidden font-sans flex flex-col items-center shadow-2xl"
            style={{
                // Using transform scale allows us to render it big (for high-res) 
                // but preview it small in the admin UI if needed.
                transformOrigin: "top left"
            }}
        >
            {/* --- Background Image Section --- */}
            <div className="absolute top-0 left-0 w-full h-[60%]">
                <img
                    src={domeSrc}
                    alt="โดมโรงเรียน"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                />
                {/* Gradient fade to white/slate-50 at the bottom of the image */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-50" />
            </div>

            {/* --- Top Header / Purpose --- */}
            <div className="relative z-10 w-full pt-16 px-12 text-center text-white drop-shadow-md">
                <h2 className="text-4xl font-semibold tracking-wide mb-2 opacity-95">
                    "ตุ้มโฮมศิษย์เก่า ปีที่ 3"
                </h2>
                <h1 className="text-4xl font-bold tracking-tight mb-2 text-yellow-300 drop-shadow-lg">
                    เพื่อสมทบทุนสร้างโดมอเนกประสงค์
                </h1>
                <h2 className="text-3xl font-medium tracking-wide opacity-90">
                    โรงเรียนบ้านขัวก่าย
                </h2>
            </div>

            {/* --- Logo Space --- */}
            <div className="relative z-10 mt-8 mb-4">
                <div className="relative w-[220px] h-[220px] rounded-full border-[8px] border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                    <img
                        src={logoSrc}
                        alt="โลโก้โรงเรียน"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </div>

            {/* --- Main Content (The Glass/White Card) --- */}
            <div className="relative z-10 w-[90%] bg-white/95 backdrop-blur-sm rounded-[3rem] shadow-2xl border-4 border-yellow-400/30 p-8 text-center mb-4 flex flex-col items-center">
                <h3 className="text-3xl font-bold text-slate-800 mb-4">ขอขอบพระคุณ</h3>

                {showName && (
                    <div className="text-6xl font-black text-blue-900 mb-2 tracking-tight drop-shadow-sm min-h-[80px]">
                        {data.fullName}
                    </div>
                )}

                {showBatch && data.batch && (
                    <div className={`${showName ? "text-4xl" : "text-5xl"} font-bold text-blue-800/80 mb-2 tracking-tight drop-shadow-sm`}>
                        ศิษย์เก่า รุ่น {data.batch}
                    </div>
                )}

                {data.teamName && (
                    <div className="text-2xl font-bold text-slate-600 mb-4 border-b-2 border-slate-100 pb-2 inline-block px-8">
                        {data.teamName}
                    </div>
                )}

                <div className="text-3xl font-medium text-slate-700 mb-4 mt-2">
                    ที่ร่วมบริจาคสมทบทุนการศึกษาในครั้งนี้
                </div>

                <div className="flex items-center justify-center gap-6 mt-2 mb-6 bg-blue-50/50 py-4 px-16 rounded-3xl border border-blue-100">
                    <div className="text-4xl font-bold text-slate-600">จำนวนเงิน</div>
                    <div className="text-[5.5rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 drop-shadow-sm">
                        {data.amount.toLocaleString("th-TH")}
                    </div>
                    <div className="text-4xl font-bold text-slate-600">บาท</div>
                </div>

                <div className="text-2xl font-medium text-slate-700 leading-relaxed max-w-4xl mx-auto px-4 mt-2">
                    ขอให้ท่านและครอบครัวจงประสบแต่ความสุข ความเจริญ ด้วยอายุ วรรณะ สุขะ พละ ปฏิภาณ ธนสารสมบัติ ทุกประการเทอญ
                </div>
            </div>

            {/* --- Footer Details --- */}
            <div className="relative z-10 w-full mt-auto bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white p-8 grid grid-cols-2 gap-8 items-center border-t-8 border-yellow-500 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">

                {/* Account Info */}
                <div className="flex flex-col gap-3 border-r border-white/20 pr-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-500 text-blue-950 font-bold px-4 py-1 rounded text-xl">เลขบัญชี</div>
                        <div className="text-4xl font-bold tracking-wider text-yellow-400">020230032103</div>
                    </div>
                    <div className="text-2xl font-medium text-slate-200 mt-2">
                        ชื่อบัญชี ผ้าป่าเพื่อการศึกษาโรงเรียนบ้านขัวก่าย
                    </div>
                    <div className="text-xl font-light text-slate-300">
                        บัญชีธนาคาร ธ.ก.ส.
                    </div>
                    <div className="text-lg text-emerald-400 font-semibold mt-2">
                        * สามารถลดหย่อนภาษีได้ 2 เท่า
                    </div>
                </div>

                {/* Contacts Info */}
                <div className="pl-4 flex flex-col justify-center">
                    <div className="text-xl font-bold text-yellow-500 mb-4 uppercase tracking-widest border-b border-yellow-500/30 pb-2 inline-block">
                        ติดต่อประสานงาน
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-xl font-medium text-slate-200">
                        <div className="text-right text-slate-400">ผอ.อภัย ปังอุทา</div>
                        <div className="tracking-wider">090-920-2229</div>

                        <div className="text-right text-slate-400">ครูอุราพร ธุระแพง</div>
                        <div className="tracking-wider">081-053-3296</div>

                        <div className="text-right text-slate-400">ครูปิลานี อุปพงษ์</div>
                        <div className="tracking-wider">092-793-6519</div>
                    </div>
                </div>

            </div>
        </div>
    );
});

ECardTemplate.displayName = "ECardTemplate";
export default ECardTemplate;
