import React, { useMemo } from 'react';
import { VitalSigns } from '@/types';
import { VitalSignsChart } from '@/components';
import { Activity, Binary } from 'lucide-react';
import SessionRateStats from '@/components/Dashboard/SessionRateStats';

interface LiteViewProps {
    vitalSigns: VitalSigns;
    avgHeartRate: number;
    minHeartRate?: number;
    maxHeartRate: number;
    avgRespRate: number;
    minRespRate?: number;
    maxRespRate: number;
    isReady: boolean;
}

const LiteView: React.FC<LiteViewProps> = ({
    vitalSigns,
    avgHeartRate,
    maxHeartRate,
    isReady
}) => {
    // Breathing light effect synchronized with heart rate
    const pulseDuration = useMemo(() => {
        const hr = vitalSigns.heartRate > 0 ? vitalSigns.heartRate : 70;
        return (60 / hr).toFixed(2);
    }, [vitalSigns.heartRate]);

    return (
        <div className="lite-view-container space-y-12 mb-8 animate-fade-in">
            {/* Stats Overview Grid - Premium Lab Cards */}
            {/* BVP Section: 1:3 Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Heart Rate Analytics Card (1/4) */}
                <div className="xl:col-span-1 group relative bg-white rounded-[3rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 flex flex-col overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)]">
                    <div
                        className="absolute inset-x-0 bottom-0 h-1.5 bg-rose-500/20 transition-all"
                        style={{
                            animation: `biopulse-bar ${pulseDuration}s ease-in-out infinite`,
                            opacity: isReady ? 1 : 0
                        }}
                    />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 flex-shrink-0">
                                    <Activity className="w-5 h-5 text-rose-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.1em] font-sans">心脏血流密度</span>
                                    <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight italic leading-none mt-0.5">心率实时分析</h3>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-6xl font-black text-slate-950 tracking-tighter tabular-nums leading-none italic">
                                    {isReady ? Math.round(vitalSigns.heartRate) : '--'}
                                </span>
                                <span className="text-sm font-black text-slate-300 uppercase tracking-widest italic">BPM</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/5 rounded-full border border-rose-500/10 mb-6 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none">扫描主体</span>
                            </div>
                        </div>

                        <SessionRateStats avg={avgHeartRate} max={maxHeartRate} />
                    </div>
                </div>

                {/* BVP Waveform (3/4) */}
                <div className="xl:col-span-3 bg-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 relative group/chart overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6 relative z-10 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500 border border-rose-100"><Binary className="w-5 h-5" /></div>
                            <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight italic">BVP 脉搏动力信号解算</h4>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">信号归一化</span>
                                <span className="text-xs font-black text-slate-950 italic">Z-Score 激活</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 flex-grow min-h-[16rem]">
                        <VitalSignsChart
                            title=""
                            data={vitalSigns.bvpSignal}
                            filteredData={vitalSigns.filteredBvpSignal}
                            rate={vitalSigns.heartRate}
                            snr={vitalSigns.bvpSNR}
                            quality={vitalSigns.bvpQuality}
                            type="bvp"
                            isReady={isReady}
                            avgRate={avgHeartRate}
                        />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_rgba(0,0,0,0.02)_1px,_transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-50"></div>
                </div>
            </div>

            <p className="text-xs text-slate-400 font-medium italic">
                TS-CAN 仅输出 BVP。本场景不计算、不展示呼吸率。
            </p>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes biopulse-bar {
                    0% { width: 0%; left: 0; }
                    50% { width: 100%; left: 0; }
                    100% { width: 0%; left: 100%; }
                }
            `}} />
        </div>
    );
};

export default LiteView;
