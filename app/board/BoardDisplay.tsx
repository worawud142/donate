"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";

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
            {/* Full Background Image */}
            <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden">
                <Image
                    src={domeSrc}
                    alt="ภาพโดมโรงเรียน"
                    fill
                    className={`object-cover opacity-85 transition-transform ease-in-out ${isFullscreen ? 'duration-[15000ms] scale-110' : 'duration-[2000ms] group-hover:scale-105'}`}
                    priority
                />
                {/* Brighter Gradient Overlays for Readability but keeps image visible */}
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/80 via-blue-900/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
            </div>

            {/* Songkran-style Decorative Triangle Flags */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Top triangle flags */}
                <div className="absolute top-0 left-0 flex gap-3 animate-pulse">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-red-500 transform rotate-12 origin-top shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-yellow-400 transform -rotate-6 origin-top shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-green-500 transform rotate-6 origin-top shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-blue-500 transform -rotate-12 origin-top shadow-lg" />
                </div>
                
                <div className="absolute top-0 right-0 flex gap-3 animate-pulse delay-100">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-purple-500 transform -rotate-6 origin-top shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-pink-500 transform rotate-12 origin-top shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-orange-500 transform -rotate-12 origin-top shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-cyan-500 transform rotate-6 origin-top shadow-lg" />
                </div>
                
                {/* Bottom triangle flags */}
                <div className="absolute bottom-0 left-0 flex gap-3 animate-pulse delay-200">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-red-500 transform -rotate-12 origin-bottom shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-yellow-400 transform rotate-6 origin-bottom shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-green-500 transform -rotate-6 origin-bottom shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-blue-500 transform rotate-12 origin-bottom shadow-lg" />
                </div>
                
                <div className="absolute bottom-0 right-0 flex gap-3 animate-pulse delay-300">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-purple-500 transform rotate-6 origin-bottom shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-pink-500 transform -rotate-12 origin-bottom shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-orange-500 transform rotate-12 origin-bottom shadow-lg" />
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-cyan-500 transform -rotate-6 origin-bottom shadow-lg" />
                </div>
                
                {/* Floating smaller triangle flags */}
                <div className="absolute top-1/4 left-1/6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-amber-400 transform rotate-45 shadow-md animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute top-1/3 right-1/6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-rose-400 transform -rotate-45 shadow-md animate-bounce delay-100" style={{ animationDuration: '3.5s' }} />
                <div className="absolute bottom-1/3 left-1/5 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-indigo-400 transform rotate-30 shadow-md animate-bounce delay-200" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 right-1/5 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-emerald-400 transform -rotate-30 shadow-md animate-bounce delay-300" style={{ animationDuration: '3.2s' }} />
            </div>

            <div className={`relative z-10 flex h-full flex-col justify-between w-full mx-auto ${isFullscreen ? 'p-12 md:p-24 max-w-[120rem]' : 'p-6 md:p-12'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className={`font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9),0_8px_16px_rgba(255,215,0,0.4),0_16px_32px_rgba(255,215,0,0.2)] tracking-tight transition-all ${isFullscreen ? 'text-5xl md:text-8xl mt-4 leading-tight' : 'mt-1 text-3xl md:text-5xl'}`}>
                            ตุ้มโฮมศิษย์เก่า ปีที่ 3
                        </h1>
                        <h2 className={`font-bold text-sky-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8),0_4px_12px_rgba(135,206,250,0.3)] transition-all ${isFullscreen ? 'text-3xl md:text-5xl mt-6' : 'mt-2 text-lg md:text-2xl'}`}>
                            สานต่อศรัทธา เติมเต็มโดม สร้างโอกาสทางการศึกษา
                        </h2>
                        <div className={`font-semibold text-sky-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8),0_2px_8px_rgba(135,206,250,0.2)] transition-all ${isFullscreen ? 'text-2xl md:text-4xl mt-4 opacity-80' : 'mt-1 text-base md:text-xl opacity-80'}`}>
                            โรงเรียนบ้านขัวก่าย
                        </div>
                    </div>

                    <div className="relative group/logo">
                        {/* Animated Glow Behind Logo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur-xl opacity-60 animate-pulse transition-opacity duration-1000 group-hover/logo:opacity-100" />
                        <div className="absolute inset-[-4px] bg-gradient-to-br from-white/60 to-white/10 rounded-full animate-[spin_4s_linear_infinite] opacity-50 pointer-events-none" />

                        <div className={`relative rounded-full border-[3px] border-white/80 bg-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.3)] shrink-0 transition-transform hover:scale-105 duration-500 flex items-center justify-center overflow-hidden ${isFullscreen ? 'p-1 mb-6 w-[208px] h-[208px]' : 'p-0.5 w-[92px] h-[92px]'}`}>
                            <Image
                                src={logoSrc}
                                alt="โลโก้โรงเรียนบ้านขัวก่าย"
                                width={isFullscreen ? 200 : 88}
                                height={isFullscreen ? 200 : 88}
                                className="rounded-full object-cover bg-white w-full h-full"
                            />
                        </div>
                    </div>
                </div>
                <div className={`absolute inset-0 flex flex-col justify-center items-center w-full h-full ${isFullscreen ? 'p-12 md:p-24' : 'p-6 md:p-12'}`}>
                    <div className={`font-bold text-yellow-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9),0_6px_16px_rgba(255,215,0,0.3)] text-center ${isFullscreen ? 'text-7xl md:text-[7.5rem] pb-6' : 'text-6xl md:text-[6.5rem] pb-4'}`}>
                        {selectedLabel}
                    </div>
                    <div className={`flex items-baseline justify-center gap-4 md:gap-8 ${isFullscreen ? 'pb-12' : 'pb-6'}`}>
                        <div className={`font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9),0_8px_20px_rgba(255,215,0,0.4)] transition-all ${isFullscreen ? 'text-5xl md:text-8xl' : 'text-2xl md:text-5xl'}`}>
                            จำนวน
                        </div>
                        <div className={`font-black tracking-tight md:leading-none text-yellow-200 drop-shadow-[0_3px_6px_rgba(0,0,0,0.9),0_10px_25px_rgba(255,215,0,0.5),0_20px_40px_rgba(255,215,0,0.3)] transition-all ${isFullscreen ? 'text-7xl md:text-[7.5rem]' : 'text-6xl md:text-[6.5rem]'}`}>
                            {selectedTotal.toLocaleString("th-TH")}
                        </div>
                        <div className={`font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9),0_8px_20px_rgba(255,215,0,0.4)] uppercase tracking-widest transition-all ${isFullscreen ? 'text-5xl md:text-8xl' : 'text-2xl md:text-5xl'}`}>
                            บาท
                        </div>
                    </div>
                    {selectedTeam && (
                        <div className={`font-semibold text-yellow-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9),0_6px_16px_rgba(255,215,0,0.3)] text-center ${isFullscreen ? 'text-2xl md:text-4xl' : 'text-lg md:text-2xl'}`}>
                            {selectedTeam}
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Toggle Button */}
            <button
                onClick={toggleFullscreen}
                className={`absolute z-[110] p-4 md:p-5 rounded-full bg-white/10 hover:bg-white/30 border border-white/20 backdrop-blur-md text-white transition-all shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:opacity-100 ${isFullscreen ? 'bottom-8 right-8 opacity-30 hover:scale-110 hover:opacity-100' : 'bottom-4 right-4 md:bottom-6 md:right-6 opacity-0 translate-y-2 group-hover:translate-y-0 hover:scale-110'}`}
                title={isFullscreen ? "ออกจากเต็มจอ" : "ขยายเต็มจอ (เสมือนจอใหญ่)"}
            >
                {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
            </button>
        </div>
    );
}
