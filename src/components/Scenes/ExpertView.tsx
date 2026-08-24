import React, { useMemo } from 'react';
import { VitalSigns } from '@/types';
import { VitalSignsChart } from '@/components';
import { Binary, Waves, Microscope } from 'lucide-react';
import { poincarePoints } from '@/utils/hrv';
import SessionRateStats from '@/components/Dashboard/SessionRateStats';

interface ExpertViewProps {
    vitalSigns: VitalSigns;
    avgHeartRate: number;
    avgRespRate?: number;
    minHeartRate?: number;
    maxHeartRate?: number;
    isReady: boolean;
}

const ExpertView: React.FC<ExpertViewProps> = ({
    vitalSigns,
    avgHeartRate,
    minHeartRate = 0,
    maxHeartRate = 0,
    isReady
}) => {
    const hrv = vitalSigns.hrv;
    const points = useMemo(
        () => poincarePoints(vitalSigns.filteredBvpSignal || [], 30),
        [vitalSigns.filteredBvpSignal]
    );
    return (
        <div className="expert-view-container space-y-12 mb-8 animate-fade-in">
            {/* Precision Backplane Matrix */}
            {/* Precision Backplane Matrix - Top Research Hub */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-stretch">
                {/* Signal Statistics Panel */}
                <div className="xl:col-span-4 bg-white rounded-[3.5rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 relative overflow-hidden group">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm">
                                <Microscope className="w-6 h-6 text-slate-800" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-950 italic tracking-tight uppercase leading-none">科研统计指标</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic mt-2">信号精度算法 v3.2</p>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col justify-between">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group/item">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5 group-hover/item:text-slate-600 transition-colors">置信度 (信噪比)</span>
                                    <span className="text-3xl font-black text-slate-950 italic tabular-nums">{vitalSigns.bvpSNR?.toFixed(1) || '--'} <span className="text-xs opacity-30">dB</span></span>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group/item">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5 group-hover/item:text-slate-600 transition-colors">实时心率</span>
                                    <span className="text-3xl font-black text-slate-950 italic tabular-nums">{isReady && vitalSigns.heartRate > 0 ? Math.round(vitalSigns.heartRate) : '--'} <span className="text-xs opacity-30">BPM</span></span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <SessionRateStats avg={avgHeartRate} min={minHeartRate} max={maxHeartRate} />
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 mt-8 shadow-inner">
                                <div className="flex justify-between items-center mb-8 px-2">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">信号质量 (SQI)</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-xs font-black text-emerald-600 uppercase italic">信号标称锁定</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Mean IBI', value: hrv ? `${hrv.meanIbiMs.toFixed(0)} ms` : '--' },
                                        { label: 'SDNN', value: hrv ? `${hrv.sdnn.toFixed(1)} ms` : '--' },
                                        { label: 'RMSSD', value: hrv ? `${hrv.rmssd.toFixed(1)} ms` : '--' }
                                    ].map((stat, i) => (
                                        <div key={i} className="flex justify-between items-center px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                            <span className="text-sm font-black text-slate-950 font-mono italic">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Poincaré Plot & Advanced Viz */}
                <div className="xl:col-span-8 bg-white rounded-[4rem] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-500/10">
                                <Binary className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-950 italic tracking-tight uppercase leading-none">庞加莱散点图 (SD1/SD2)</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic mt-2">相空间生物分析矩阵</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>)}
                            </div>
                            <div className="text-xs font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 italic uppercase">科研矩阵开启</div>
                        </div>
                    </div>

                    <div className="relative z-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 p-10 h-[26rem] flex items-center justify-center overflow-hidden shadow-inner">
                        {/* Simulation of Phase Space Plot */}
                        <div className="relative w-96 h-96">
                            {/* Axes */}
                            <div className="absolute left-0 bottom-0 w-full h-px bg-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"></div>
                            <div className="absolute left-0 bottom-0 w-px h-full bg-slate-300 shadow-[1px_0_2px_rgba(0,0,0,0.05)]"></div>

                            {/* Data Points Simulation */}
                            <div className="absolute inset-0">
                                {points.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                        等待稳定 IBI
                                    </div>
                                )}
                                {points.map((pt, i) => {
                                    const min = 333;
                                    const max = 1500;
                                    const left = 8 + ((pt.x - min) / (max - min)) * 84;
                                    const top = 92 - ((pt.y - min) / (max - min)) * 84;
                                    return (
                                        <div
                                            key={i}
                                            className="absolute w-1.5 h-1.5 rounded-full bg-indigo-500/70"
                                            style={{ left: `${left}%`, top: `${top}%` }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Ellipse Mapping */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[65%] h-[45%] rounded-[50%_50%] border-2 border-dashed border-indigo-400/50 rotate-45 scale-[1.15] shadow-[0_0_40px_rgba(79,70,229,0.05)]"></div>
                                <div className="absolute w-[2px] h-[70%] bg-indigo-500/10 rotate-45"></div>
                                <div className="absolute w-[70%] h-[2px] bg-indigo-500/10 rotate-45"></div>
                            </div>
                        </div>

                        {/* Scanline Effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:100%_6px] pointer-events-none animate-pulse"></div>
                    </div>

                    <div className="mt-8 flex justify-between items-end relative z-10 px-6">
                        <div className="flex gap-16">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">SD1 (瞬时变异性)</span>
                                <span className="text-4xl font-black text-slate-900 tabular-nums italic tracking-tighter">{hrv ? hrv.sd1.toFixed(1) : '--'}<span className="text-sm opacity-30 ml-1">ms</span></span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">SD2 (长期变异性)</span>
                                <span className="text-4xl font-black text-slate-900 tabular-nums italic tracking-tighter">{hrv ? hrv.sd2.toFixed(1) : '--'}<span className="text-sm opacity-30 ml-1">ms</span></span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="text-xs font-black text-indigo-700 bg-indigo-100 px-6 py-2.5 rounded-2xl border border-indigo-200 italic shadow-sm">
                                自主神经反射锁定：<span className="text-indigo-950">开启</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signal Fidelity Section - Full Width */}
            <div className="bg-white p-12 rounded-[4rem] shadow-[0_30px_90px_rgba(0,0,0,0.03)] border border-slate-200 relative group overflow-hidden">
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl shadow-slate-950/30">
                            <Waves className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight leading-none">巴特沃斯四阶信号监测</h3>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] mt-2 block italic">高保真生物信号解析矩阵</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">通带范围</span>
                            <span className="text-xs font-black text-slate-950 italic">0.7 - 4.0 Hz</span>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">质量评分</span>
                            <span className="text-xs font-black text-emerald-600 italic">{vitalSigns.bvpQuality}</span>
                        </div>
                    </div>
                </div>
                <div className="h-[26rem] relative z-10">
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
                {/* Background Grid Ornament */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.01)_1px,_transparent_0)] bg-[size:40px_40px] pointer-events-none opacity-50"></div>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] pointer-events-none"></div>
            </div>
        </div>
    );
};

export default ExpertView;
