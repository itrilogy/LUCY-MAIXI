import React from 'react';

interface SessionRateStatsProps {
    avg: number;
    max: number;
    min?: number;
    unit?: string;
    accentClass?: string;
}

const formatRate = (value: number): string => {
    if (!isFinite(value) || value <= 0 || value >= 300) return '--';
    return String(Math.round(value));
};

const SessionRateStats: React.FC<SessionRateStatsProps> = ({
    avg,
    max,
    min,
    unit = '',
    accentClass = 'text-rose-600'
}) => {
    return (
        <div className={`grid ${min !== undefined ? 'grid-cols-3' : 'grid-cols-2'} gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100`}>
            <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">本次均值</span>
                <span className="text-xl font-black text-slate-950 italic tabular-nums">
                    {formatRate(avg)}{unit ? <span className="text-[10px] text-slate-400 ml-1">{unit}</span> : null}
                </span>
            </div>
            {min !== undefined && (
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">采集最低</span>
                    <span className="text-xl font-black text-slate-500 italic tabular-nums">{formatRate(min)}</span>
                </div>
            )}
            <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">采集最高</span>
                <span className={`text-xl font-black italic tabular-nums ${accentClass}`}>{formatRate(max)}</span>
            </div>
        </div>
    );
};

export default SessionRateStats;
