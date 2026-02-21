"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import CountUp from "@/components/CountUp";

type Props = {
    domeSrc: string;
    logoSrc: string;
    selectedLabel: string;
    selectedTotal: number;
    selectedTeam?: string;
};

export default function BoardDisplay({
    domeSrc,
    logoSrc,
    selectedLabel,
    selectedTotal,
    selectedTeam,
}: Props) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative aspect-video overflow-hidden border border-slate-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] group transition-all duration-500 ease-out bg-slate-900 ${isFullscreen ? "fixed inset-0 z-[100] w-screen h-screen rounded-none border-none flex flex-col justify-between" : "rounded-2xl"
                }`}
        >
            {/* Full Background Image with Premium Overlays */}
            <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden">
                <Image
                    src={domeSrc}
                    alt="ภาพโดมโรงเรียน"
                    fill
                    className={`object-cover opacity-60 transition-transform ease-in-out ${isFullscreen ? 'duration-[15000ms] scale-110' : 'duration-[2000ms] group-hover:scale-105'}`}
                    priority
                />
                {/* Elegant Dark Vignette and Deep Blue Tint */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-blue-900/40 to-slate-900/60 mix-blend-multiply" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.7)_100%)] pointer-events-none" />

                {/* Ambient Glowing Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[100px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_2s] pointer-events-none" />
            </div>

            {/* Subtle Celebratory Stardust Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-[ping_3s_infinite]" />
                <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-200 rounded-full shadow-[0_0_12px_#fef08a] animate-[ping_4s_infinite_1s]" />
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-200 rounded-full shadow-[0_0_15px_#bfdbfe] animate-[ping_5s_infinite_2s]" />
                <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-[ping_3.5s_infinite_0.5s]" />
                <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-amber-100 rounded-full shadow-[0_0_10px_#fef3c7] animate-[ping_4.5s_infinite_1.5s]" />
            </div>

            <div className={`relative z-10 flex h-full flex-col justify-between w-full mx-auto ${isFullscreen ? 'p-12 md:p-24 lg:p-32 max-w-[140rem]' : 'p-6 md:p-8 lg:p-12'}`}>
                {/* Top Section: Headers and Logo */}
                <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                    <div className="text-center md:text-left w-full md:w-auto mt-2 md:mt-0 order-2 md:order-1 slide-in-bottom">
                        <h1 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-50 to-slate-300 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] transition-all ${isFullscreen ? 'text-4xl md:text-6xl lg:text-7xl mt-4 leading-tight' : 'mt-0.5 sm:mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl max-w-[80vw] truncate md:overflow-visible md:whitespace-normal'}`}>
                            ตุ้มโฮมศิษย์เก่า ปีที่ 3
                        </h1>
                        <h2 className={`font-medium text-blue-200 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all ${isFullscreen ? 'text-xl md:text-3xl lg:text-4xl mt-4' : 'mt-1 md:mt-2 text-xs sm:text-sm md:text-lg lg:text-xl max-w-[85vw] truncate md:overflow-visible md:whitespace-normal'}`}>
                            สานต่อศรัทธา เติมเต็มโดม สร้างโอกาสทางการศึกษา
                        </h2>
                        <div className={`font-light text-slate-300 tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-all ${isFullscreen ? 'text-lg md:text-xl lg:text-2xl mt-4 opacity-70' : 'mt-1 text-[10px] sm:text-xs md:text-sm lg:text-base opacity-60'}`}>
                            โรงเรียนบ้านขัวก่าย
                        </div>
                    </div>

                    <div className="relative group/logo self-center md:self-start order-1 md:order-2 mt-2 md:mt-0 shrink-0 fade-in">
                        {/* Elegant Logo Glow */}
                        <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-20 animate-[pulse_4s_inifnite] transition-opacity duration-700 group-hover/logo:opacity-40" />

                        <div className={`relative rounded-full border border-white/30 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 duration-700 flex items-center justify-center overflow-hidden ${isFullscreen ? 'p-2 mb-4 w-[140px] h-[140px] md:w-[180px] md:h-[180px]' : 'p-1 w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] md:w-[84px] md:h-[84px] lg:w-[100px] lg:h-[100px]'}`}>
                            <Image
                                src={logoSrc}
                                alt="โลโก้โรงเรียน"
                                fill
                                className="rounded-full object-cover bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Center Section: Glassmorphism Data Card */}
                <div className="flex-1 flex flex-col justify-center items-center w-full pointer-events-none mt-4 sm:mt-6 md:mt-0">
                    <div className={`relative w-full max-w-7xl mx-auto rounded-3xl sm:rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center transition-all ${isFullscreen ? 'py-16 md:py-24 px-8 mt-8' : 'py-6 sm:py-8 md:py-12 px-4 sm:px-8 mt-2'}`}>
                        {/* Floating glow inside the card */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none" />

                        <div className={`z-10 font-bold max-w-full text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100 drop-shadow-[0_2px_10px_rgba(253,224,71,0.2)] text-center break-words leading-tight ${isFullscreen ? 'text-4xl md:text-6xl lg:text-[6rem] pb-8' : 'text-2xl sm:text-3xl md:text-5xl lg:text-[5rem] pb-4 sm:pb-6'}`}>
                            {selectedLabel}
                        </div>

                        <div className={`z-10 flex items-baseline justify-center gap-2 sm:gap-4 md:gap-8 ${isFullscreen ? 'pb-8' : 'pb-2 sm:pb-4'}`}>
                            <div className={`font-semibold text-amber-200/80 tracking-widest uppercase transition-all ${isFullscreen ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-xs sm:text-sm md:text-2xl lg:text-3xl'}`}>
                                จำนวน
                            </div>
                            <div className={`font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 drop-shadow-[0_10px_30px_rgba(234,179,8,0.3)] transition-all ${isFullscreen ? 'text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem]' : 'text-4xl sm:text-5xl md:text-7xl lg:text-[8rem]'}`}>
                                <CountUp end={selectedTotal} duration={2500} />
                            </div>
                            <div className={`font-semibold text-amber-200/80 tracking-widest uppercase transition-all ${isFullscreen ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-xs sm:text-sm md:text-2xl lg:text-3xl'}`}>
                                บาท
                            </div>
                        </div>

                        {selectedTeam && (
                            <div className={`z-10 font-medium text-amber-100/70 tracking-wide text-center mt-2 sm:mt-4 ${isFullscreen ? 'text-xl md:text-3xl' : 'text-[10px] sm:text-xs md:text-lg'}`}>
                                ระดมทุนโดย: {selectedTeam}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fullscreen Toggle Button - Elegant Style */}
            <button
                onClick={toggleFullscreen}
                className={`absolute z-[110] p-4 md:p-5 rounded-full bg-slate-900/40 hover:bg-slate-800/60 border border-white/10 backdrop-blur-xl text-white/70 hover:text-white transition-all overflow-hidden group-hover:opacity-100 ${isFullscreen ? 'bottom-8 right-8 opacity-30 hover:scale-110 hover:opacity-100' : 'bottom-4 right-4 md:bottom-8 md:right-8 opacity-0 translate-y-4 group-hover:translate-y-0 hover:scale-110'}`}
                title={isFullscreen ? "ออกจากเต็มจอ" : "ขยายเต็มจอ (เสมือนจอใหญ่)"}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isFullscreen ? <Minimize size={24} className="relative z-10" /> : <Maximize size={24} className="relative z-10" />}
            </button>
        </div>
    );
}
