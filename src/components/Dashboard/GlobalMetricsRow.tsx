import React from 'react';
import MetricCard from './MetricCard';
import { VitalSigns } from '@/types';

interface GlobalMetricsRowProps {
    vitalSigns: VitalSigns;
    avgHeartRate: number;
    avgRespRate: number;
    isReady: boolean;
    bufferProgress: number;
    hideResp?: boolean;
}

const GlobalMetricsRow: React.FC<GlobalMetricsRowProps> = ({
    vitalSigns,
    avgHeartRate,
    avgRespRate,
    isReady,
    bufferProgress,
    hideResp = false
}) => {
    return (
        <div className={`grid ${hideResp ? 'grid-cols-2' : 'grid-cols-3'} gap-3 md:gap-4 animate-fade-in w-full`}>
            <MetricCard
                label="心率 (BPM)"
                value={vitalSigns.heartRate}
                unit="BPM"
                avg={avgHeartRate}
                icon="❤️"
                colorClass="text-rose-600"
                isReady={isReady}
                bufferProgress={bufferProgress}
                status={vitalSigns.heartRate > 0 ? (vitalSigns.heartRate > 100 ? '偏高' : '已锁定') : '搜寻中'}
            />

            {!hideResp && (
            <MetricCard
                label="呼吸率 (RPM)"
                value={vitalSigns.respRate}
                unit="RPM"
                avg={avgRespRate}
                icon="🌬️"
                colorClass="text-blue-600"
                isReady={isReady}
                bufferProgress={bufferProgress}
                status={vitalSigns.respRate > 0 ? '平稳' : '采样中'}
            />
            )}

            <MetricCard
                label="信号置信度"
                value={vitalSigns.bvpSNR > 0 ? (vitalSigns.bvpSNR).toFixed(1) : '--'}
                unit="dB"
                icon="📈"
                colorClass="text-emerald-600"
                isReady={isReady}
                bufferProgress={bufferProgress}
                status={vitalSigns.bvpQuality === 'excellent' ? '协议通过' : (vitalSigns.bvpSNR > 3.0 ? '最佳' : '检测中')}
            />
        </div>
    );
};

export default GlobalMetricsRow;
