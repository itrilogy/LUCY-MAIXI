import React from 'react';
import { ExportData } from '../../types';

interface ReportViewProps {
    data: ExportData | null;
    id?: string;
    onClose?: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ data, id = 'physiological-report', onClose }) => {
    if (!data) return null;

    const { metadata, rates, signals } = data;
    const avgHeartRate = rates.heart.length > 0
        ? (rates.heart.reduce((acc, curr) => acc + curr.value, 0) / rates.heart.length).toFixed(1)
        : '0.0';

    const avgRespRate = rates.respiratory.length > 0
        ? (rates.respiratory.reduce((acc, curr) => acc + curr.value, 0) / rates.respiratory.length).toFixed(1)
        : '0.0';

    const startTime = new Date(metadata.startTime).toLocaleString('zh-CN');
    const duration = ((new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime()) / 1000).toFixed(0);

    const renderWaveform = (values: number[], color: string, height: number = 60) => {
        if (!values || values.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>无波形数据</div>;

        // Downsample to keep PDF file size small and rendering fast
        const maxPoints = 400;
        const step = Math.max(1, Math.floor(values.length / maxPoints));
        const points = [];
        for (let i = 0; i < values.length; i += step) {
            points.push(values[i]);
        }

        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;

        const width = 714; // (A4 794px - padding 40px * 2)
        const pX = width / (points.length - 1 || 1);

        const pathData = points.map((v, i) => {
            const x = i * pX;
            // Map value to Y: higher value is higher on screen (smaller Y)
            const y = height - ((v - min) / range) * height;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');

        return (
            <svg width={width} height={height} style={{ display: 'block' }}>
                <path d={pathData} fill="none" stroke={color} strokeWidth="1.2" />
            </svg>
        );
    };

    return (
        <div
            id={id}
            style={{
                width: '794px',
                padding: '40px',
                backgroundColor: 'white',
                color: '#333',
                fontFamily: '"Microsoft YaHei", sans-serif',
                boxSizing: 'border-box',
                position: 'relative',
                margin: '0 auto'
            }}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        right: 24,
                        top: 24,
                        border: '1px solid #e0e0e0',
                        background: '#fff',
                        borderRadius: 20,
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: 12
                    }}
                >
                    关闭
                </button>
            )}
            {/* ... Header, Basic Info, Results Summary as before ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #006969', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1 style={{ color: '#006969', margin: 0, fontSize: '24px' }}>非接触式面部生理指标检测报告</h1>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                    <div>检测单号: {metadata.startTime.replace(/[^0-9]/g, '').slice(0, 14)}</div>
                    <div>页码: 1/1</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderLeft: '4px solid #006969', paddingLeft: '10px', fontSize: '16px', marginBottom: '10px' }}>基础信息</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                    <div><strong>检测时间:</strong> {startTime}</div>
                    <div><strong>检测时长:</strong> {duration} 秒</div>
                    <div><strong>设备采样率:</strong> {metadata.samplingRate} FPS</div>
                    <div><strong>总采样点:</strong> {metadata.totalSamples}</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderLeft: '4px solid #006969', paddingLeft: '10px', fontSize: '16px', marginBottom: '10px' }}>核心指标摘要</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ border: '1px solid #e0e0e0', padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>平均心率</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d32f2f', margin: '10px 0' }}>{avgHeartRate} <span style={{ fontSize: '16px' }}>BPM</span></div>
                        <div style={{ fontSize: '12px', color: '#888' }}>正常范围: 60 - 100</div>
                    </div>
                    <div style={{ border: '1px solid #e0e0e0', padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>平均呼吸率</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2', margin: '10px 0' }}>{avgRespRate} <span style={{ fontSize: '16px' }}>次/分</span></div>
                        <div style={{ fontSize: '12px', color: '#888' }}>正常范围: 12 - 20</div>
                    </div>
                </div>
            </div>

            {/* Signal Details with real waveforms */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderLeft: '4px solid #006969', paddingLeft: '10px', fontSize: '16px', marginBottom: '10px' }}>波形特征预览</h3>

                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px', color: '#666' }}>
                        <strong>BVP 信号趋势 (Blood Volume Pulse)</strong>
                        <span>信噪比: {rates.heart.length > 0 ? rates.heart[0].snr.toFixed(2) : 'N/A'} dB</span>
                    </div>
                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                        {renderWaveform(signals.bvp.raw, '#d32f2f', 80)}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px', color: '#666' }}>
                        <strong>呼吸信号趋势 (Respiratory)</strong>
                        <span>信噪比: {rates.respiratory.length > 0 ? rates.respiratory[0].snr.toFixed(2) : 'N/A'} dB</span>
                    </div>
                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                        {renderWaveform(signals.resp.raw, '#1976d2', 80)}
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '40px', padding: '15px', borderTop: '1px dashed #ccc', fontSize: '11px', color: '#888' }}>
                <strong>专业声明:</strong>
                <p style={{ margin: '5px 0' }}>1. 本检测基于远程光电容积脉搏波描计法 (rPPG) 技术实现，受环境光线、头部运动及摄像头质量影响较大。</p>
                <p style={{ margin: '5px 0' }}>2. 报告中的所有数值仅作为健康管理参考，不具有医疗诊断法律效力，不可作为临床治疗的唯一依据。</p>
                <p style={{ margin: '5px 0' }}>3. 如有任何身体不适，请务必咨询专业医疗机构进行正式检查。</p>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#aaa' }}>
                由脉息 · MaiXi（基于 MMRPhys-Live）自动生成 · 鹿溪联合创新实验室
            </div>
        </div>
    );
};

export default ReportView;
