import React from 'react';
import { Heart, Activity, Sliders } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: number | string;
    unit: string;
    avg?: number;
    colorClass: string;
    icon: string;
    isReady: boolean;
    bufferProgress?: number;
    status?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    unit,
    avg,
    colorClass,
    icon,
    isReady,
    bufferProgress = 0,
    status
}) => {
    const isError = value === '--' || (typeof value === 'number' && value === 0 && isReady);
    const showSampling = !isReady || (typeof value === 'number' && value === 0);

    // Get Lucide Icon component based on emoji fallback
    const renderIcon = () => {
        if (icon === '❤️') return <Heart className="w-8 h-8 text-rose-600 animate-bounce transition-all duration-300" />;
        if (icon === '🌬️') return <Activity className="w-8 h-8 text-blue-600" />;
        if (icon === '📈') return <Sliders className="w-8 h-8 text-emerald-600" />;
        return <span className="text-3xl">{icon}</span>;
    };

    return (
        <div className={`group relative bg-white p-5 2xl:p-6 rounded-[2.5rem] border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.03)] transition-all duration-700 hover:shadow-[0_40px_100px_rgba(15,23,42,0.08)] hover:-translate-y-2 overflow-hidden ${colorClass}`}>
            {/* Design Grain / Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_rgba(0,0,0,0.01)_1px,_transparent_0)] bg-[size:24px_24px] pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col gap-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-sans truncate pr-1">{label}</p>
                    {status && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-slate-300' : 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'} flex-shrink-0`}></div>
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic truncate">{status}</span>
                        </div>
                    )}
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform duration-500 flex-shrink-0 hidden lg:block xl:hidden 2xl:block">
                    {renderIcon()}
                </div>
            </div>

            <div className="relative z-10">
                {showSampling ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl xl:text-3xl font-black text-slate-200 italic tracking-tighter">采样中</span>
                            <span className="text-sm font-black text-slate-300 font-mono">
                                {bufferProgress > 0 && bufferProgress < 100 ? `${bufferProgress.toFixed(0)}%` : '...'}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500 transition-all duration-700 ease-out"
                                style={{ width: `${bufferProgress}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-slate-950 tracking-tighter tabular-nums leading-none italic truncate">
                            {typeof value === 'number' ? Math.round(value) : value}
                        </span>
                        <div className="flex flex-col mb-1.5 flex-shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>
                            <div className="mt-1 flex gap-0.5 opacity-60">
                                <div className="w-1 h-2 bg-rose-500/20 rounded-full"></div>
                                <div className="w-1 h-2 bg-rose-500/40 rounded-full"></div>
                                <div className="w-1 h-2 bg-rose-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {avg !== undefined && avg > 0 && !showSampling && (
                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center group/avg relative z-10 transition-all duration-500">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">协议参考基线</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 uppercase">均值参考</span>
                            <span className="text-[9px] font-black text-slate-300 italic">历史匹配</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 group-hover/avg:bg-white group-hover/avg:shadow-sm transition-all duration-300">
                        <span className="text-2xl font-black text-slate-950 italic tabular-nums">{Math.round(avg)}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{unit}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
