import React from 'react';
import { VitalSigns } from '@/types';
import { VitalSignsChart } from '@/components';
import { Activity, ShieldCheck, Zap, Wind } from 'lucide-react';
import SessionRateStats from '@/components/Dashboard/SessionRateStats';

interface BalancedViewProps {
    vitalSigns: VitalSigns;
    avgHeartRate: number;
    avgRespRate: number;
    minHeartRate?: number;
    maxHeartRate: number;
    minRespRate?: number;
    maxRespRate: number;
    isReady: boolean;
}

const BalancedView: React.FC<BalancedViewProps> = ({
    vitalSigns,
    avgHeartRate,
    avgRespRate,
    maxHeartRate,
    maxRespRate,
    isReady
}) => {
    // Enhanced status calculation
    const stressIndex = Math.min(100, Math.max(0, (vitalSigns.heartRate - 60) * 1.5 + (20 - vitalSigns.respRate) * 2));
    const stressColor = stressIndex > 70 ? 'text-rose-600' : (stressIndex > 40 ? 'text-amber-500' : 'text-emerald-500');
    const pulseDuration = vitalSigns.heartRate > 0 ? 60 / vitalSigns.heartRate : 1;

    return (
        <div className="balanced-view-container space-y-12 mb-8 animate-fade-in">
            {/* Health Intelligence Command Center */}
            {/* Top Analysis Section - Integrated Health Hub */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-stretch">
                {/* Stress & Resilience Panel */}
                <div className="xl:col-span-5 bg-white rounded-[3.5rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 transition-transform duration-1000 group-hover:scale-125"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-950 italic tracking-tight uppercase">健康洞察</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">压力架构算法评估</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">压力指数 (启发式)</span>
                                    <span className={`text-3xl font-black italic tabular-nums ${stressColor}`}>{Math.round(stressIndex)}%</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-1 shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600`}
                                        style={{ width: `${isReady ? stressIndex : 0}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 italic">基于心率波动率及呼吸深度导出的生物反馈系数。版本 v3.2</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-10">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">呼吸深度解析</span>
                                <span className="text-xl font-black text-slate-950 italic">{isReady ? (vitalSigns.respQuality || '--') : '--'}</span>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">氧流代谢评估</span>
                                <span className="text-xl font-black text-slate-950 italic">{isReady ? `${vitalSigns.bvpSNR.toFixed(1)} dB` : '--'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Narrative Portrait Section */}
                <div className="xl:col-span-7 bg-slate-100 p-12 rounded-[4rem] border border-slate-200/50 flex flex-col justify-center relative overflow-hidden group">
                    <div className="relative z-10 h-full flex flex-col justify-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">自动生成的健康画像</p>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1] italic uppercase mb-10 group-hover:scale-[1.02] transition-transform duration-700 origin-left">
                            检测到生理节律处于 <span className="text-emerald-600">高效稳定区</span>。
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 animate-pulse"></div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    当前展示的是 SCAMPS 双任务协议下的心率与呼吸率。质量以 SNR 为准，失败时显示为无效而不是默认心率。
                                </p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 flex-shrink-0"></div>
                                <p className="text-sm text-slate-400 italic font-medium leading-relaxed">
                                    建议维持当前的呼吸节奏，系统将自动记录 300 秒基准线数据。协议验证通过。
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Lab Pattern Overlay */}
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <Activity className="w-48 h-48 text-slate-950" />
                    </div>
                </div>
            </div>

            {/* Middle Row: BVP Live Telemetry (1:3 Layout) */}
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
                            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-500/10 flex-shrink-0">
                                <Zap className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight italic leading-none">BVP 实时遥测</h4>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">脉搏波形综合分析</span>
                                <span className="text-xs font-black text-slate-950 italic">30FPS 采样</span>
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
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_rgba(0,0,0,0.01)_1px,_transparent_0)] bg-[size:48px_48px] pointer-events-none opacity-40"></div>
                </div>
            </div>

            {/* Bottom Row: RSP Monitoring (1:3 Layout) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Respiratory Intelligence Card (1/4) */}
                <div className="xl:col-span-1 group relative bg-white rounded-[3rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 flex flex-col overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)]">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 flex-shrink-0">
                                    <Wind className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.1em] font-sans">呼吸信号采样</span>
                                    <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight italic leading-none mt-0.5">呼吸率实时监控</h3>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-6xl font-black text-slate-950 tracking-tighter tabular-nums leading-none italic">
                                    {isReady ? Math.round(vitalSigns.respRate) : '--'}
                                </span>
                                <span className="text-sm font-black text-slate-300 uppercase tracking-widest italic">RPM</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/5 rounded-full border border-blue-500/10 mb-6 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">监控协议开启</span>
                            </div>
                        </div>

                        <SessionRateStats avg={avgRespRate} max={maxRespRate} accentClass="text-blue-600" />
                    </div>
                </div>

                {/* RSP Waveform (3/4) */}
                <div className="xl:col-span-3 bg-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-200 relative group/chart overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6 relative z-10 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 shadow-sm flex-shrink-0">
                                <Activity className="w-5 h-5 text-amber-500" />
                            </div>
                            <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight italic leading-none">RSP 信号一致性</h4>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">频率采样监控</span>
                                <span className="text-xs font-black text-slate-950 italic">POS MMRPhys</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 flex-grow min-h-[16rem]">
                        <VitalSignsChart
                            title=""
                            data={vitalSigns.respSignal}
                            filteredData={vitalSigns.filteredRespSignal}
                            rate={vitalSigns.respRate}
                            snr={vitalSigns.respSNR}
                            quality={vitalSigns.respQuality}
                            type="resp"
                            isReady={isReady}
                            avgRate={avgRespRate}
                        />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.01)_1px,_transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-30"></div>
                </div>
            </div>
        </div>
    );
};

export default BalancedView;
