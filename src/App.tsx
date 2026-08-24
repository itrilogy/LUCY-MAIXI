import React, { useEffect, useState, useCallback, useRef } from 'react';
import { VideoDisplay, Controls } from '@/components';
import ReportView from '@/components/Report/ReportView';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useVitalSigns } from '@/hooks/useVitalSigns';
import { useInferenceWorker } from '@/hooks/useInferenceWorker';
import { useFrameScheduler } from '@/hooks/useFrameScheduler';
import { useCaptureSession } from '@/hooks/useCaptureSession';
import {
    StatusMessage as StatusMessageType,
    InferenceResult as InferenceResultType,
    ExportData as ExportDataType,
    SceneConfig,
    SceneType
} from '@/types';
import { SCENES, DEFAULT_SCENE, sceneHasTask } from '@/config/scenes';
import { SceneSelector } from '@/components';
import MainDashboard from '@/components/Dashboard/MainDashboard';
import GlobalMetricsRow from '@/components/Dashboard/GlobalMetricsRow';
import { Zap } from 'lucide-react';
import AboutModal from '@/components/AboutModal/AboutModal';

const emptyCumulative = () => ({
    heartRateSum: 0,
    heartRateCount: 0,
    heartRateMin: Infinity,
    heartRateMax: -Infinity,
    respRateSum: 0,
    respRateCount: 0,
    respRateMin: Infinity,
    respRateMax: -Infinity
});

const App: React.FC = () => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<StatusMessageType>({
        message: '正在初始化系统...',
        type: 'info'
    });
    const [reportData, setReportData] = useState<ExportDataType | null>(null);
    const [selectedScene, setSelectedScene] = useState<SceneConfig>(DEFAULT_SCENE);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [processorEpoch, setProcessorEpoch] = useState(0);

    const { capabilities, isChecking } = useDeviceCapabilities();
    const { vitalSigns, updateVitalSigns, updatePerformance, resetData } = useVitalSigns();
    const capture = useCaptureSession();
    const selectedSceneRef = useRef(selectedScene);
    selectedSceneRef.current = selectedScene;
    const isCapturingRef = useRef(false);
    const cumulativeMetricsRef = useRef(emptyCumulative());

    const handleInferenceResults = useCallback((res: InferenceResultType) => {
        if (!isCapturingRef.current) return;
        const heartInstant = res.bvp?.metrics.instantRate ?? 0;
        const respInstant = res.resp?.metrics.instantRate ?? 0;
        if (res.sessionStats?.heart.count) {
            cumulativeMetricsRef.current = {
                heartRateSum: res.sessionStats.heart.avg * res.sessionStats.heart.count,
                heartRateCount: res.sessionStats.heart.count,
                heartRateMin: res.sessionStats.heart.min,
                heartRateMax: res.sessionStats.heart.max,
                respRateSum: res.sessionStats.resp.avg * res.sessionStats.resp.count,
                respRateCount: res.sessionStats.resp.count,
                respRateMin: res.sessionStats.resp.min || Infinity,
                respRateMax: res.sessionStats.resp.max || -Infinity
            };
        } else {
            if (heartInstant > 0) {
                cumulativeMetricsRef.current.heartRateSum += heartInstant;
                cumulativeMetricsRef.current.heartRateCount += 1;
                cumulativeMetricsRef.current.heartRateMin = Math.min(
                    cumulativeMetricsRef.current.heartRateMin,
                    heartInstant
                );
                cumulativeMetricsRef.current.heartRateMax = Math.max(
                    cumulativeMetricsRef.current.heartRateMax,
                    heartInstant
                );
            }
            if (respInstant > 0) {
                cumulativeMetricsRef.current.respRateSum += respInstant;
                cumulativeMetricsRef.current.respRateCount += 1;
                cumulativeMetricsRef.current.respRateMin = Math.min(
                    cumulativeMetricsRef.current.respRateMin,
                    respInstant
                );
                cumulativeMetricsRef.current.respRateMax = Math.max(
                    cumulativeMetricsRef.current.respRateMax,
                    respInstant
                );
            }
        }
        updateVitalSigns({
            heartRate: res.bvp.metrics.rate,
            respRate: res.resp?.metrics.rate ?? 0,
            bvpSignal: res.bvp.raw,
            respSignal: res.resp?.raw ?? [],
            filteredBvpSignal: res.bvp.filtered,
            filteredRespSignal: res.resp?.filtered ?? [],
            bvpSNR: res.bvp.metrics.quality.snr,
            respSNR: res.resp?.metrics.quality.snr ?? 0,
            bvpQuality: res.bvp.metrics.quality.quality,
            respQuality: res.resp?.metrics.quality.quality ?? 'poor',
            actionUnits: res.actionUnits,
            hrv: res.hrv ?? null
        });
        if (res.performanceMetrics) updatePerformance(res.performanceMetrics);
    }, [updateVitalSigns, updatePerformance]);

    const inference = useInferenceWorker({
        onStatus: setStatusMessage,
        onResult: handleInferenceResults
    });

    const scheduler = useFrameScheduler({
        getProcessor: () => capture.processorRef.current,
        isReady: () => inference.isInitialized && isCapturingRef.current,
        sendWindow: inference.sendWindow
    });

    useEffect(() => {
        if (isChecking || !capabilities) return;
        if (!capabilities.isCompatible) {
            setStatusMessage({ message: '当前浏览器缺少 WebAssembly，无法运行本地推理。', type: 'error' });
            return;
        }
        capture.ensureProcessor(selectedSceneRef.current);
        setProcessorEpoch(v => v + 1);
        capture.bindFaceLost(async () => {
            scheduler.stop();
            inference.stopCapture();
            await capture.stop();
            isCapturingRef.current = false;
            setIsCapturing(false);
            scheduler.setBufferProgress(0);
            resetData();
            cumulativeMetricsRef.current = emptyCumulative();
            setStatusMessage({ message: '未检测到人脸。请重新开始采集。', type: 'warning' });
        });
        inference.initScene(selectedSceneRef.current);
    }, [capabilities, isChecking]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStartCapture = async () => {
        try {
            const scene = selectedSceneRef.current;
            resetData();
            cumulativeMetricsRef.current = emptyCumulative();
            inference.startCapture();
            isCapturingRef.current = true;
            await capture.startCamera(scene);
            setIsCapturing(true);
            scheduler.start(scene);
            setStatusMessage({ message: '正在捕获指标数据...', type: 'success' });
        } catch {
            isCapturingRef.current = false;
            inference.stopCapture();
            setIsCapturing(false);
            setStatusMessage({ message: '开启捕获失败', type: 'error' });
        }
    };

    const handleStopCapture = async () => {
        isCapturingRef.current = false;
        setIsCapturing(false);
        scheduler.stop();
        inference.stopCapture();
        await capture.stop();
        setStatusMessage({ message: '捕获已停止。', type: 'info' });
    };

    const handleVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const scene = selectedSceneRef.current;
            resetData();
            cumulativeMetricsRef.current = emptyCumulative();
            inference.startCapture();
            isCapturingRef.current = true;
            await capture.startVideoFile(scene, file);
            setIsCapturing(true);
            scheduler.start(scene);
            setStatusMessage({ message: `正在处理视频: ${file.name}`, type: 'success' });
        } catch {
            isCapturingRef.current = false;
            inference.stopCapture();
            setIsCapturing(false);
            setStatusMessage({ message: '视频加载失败', type: 'error' });
        }
        e.target.value = '';
    };

    const handleSceneChange = (id: SceneType) => {
        const scene = SCENES.find(s => s.id === id);
        if (!scene || isCapturingRef.current) return;
        setSelectedScene(scene);
        selectedSceneRef.current = scene;
        scheduler.resetCollection();
        resetData();
        cumulativeMetricsRef.current = emptyCumulative();
        capture.ensureProcessor(scene);
        setProcessorEpoch(v => v + 1);
        inference.initScene(scene);
        setStatusMessage({ message: `正在准备 ${scene.name} 场景...`, type: 'info' });
    };

    const handleExport = async () => {
        try {
            const data = await inference.requestExport();
            const blob = new Blob([JSON.stringify({
                ...data,
                scene: {
                    id: selectedScene.id,
                    name: selectedScene.name,
                    model: selectedScene.shortModelName,
                    preprocess: selectedScene.preprocess,
                    tasks: selectedScene.tasks
                }
            }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `biopulse-data-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setStatusMessage({ message: '导出失败：暂无完整测量数据', type: 'warning' });
        }
    };

    const handleGenerateReport = async () => {
        try {
            const data = await inference.requestExport();
            setReportData(data);
        } catch {
            setStatusMessage({ message: '无法生成报告：请先完成一次测量', type: 'warning' });
        }
    };

    const showResp = sceneHasTask(selectedScene, 'resp');
    const isReady = (isCapturing || vitalSigns.heartRate > 0 || vitalSigns.bvpSignal.length > 0)
        && scheduler.bufferProgress >= 100;
    const avgHeartRate = cumulativeMetricsRef.current.heartRateCount > 0
        ? cumulativeMetricsRef.current.heartRateSum / cumulativeMetricsRef.current.heartRateCount
        : 0;
    const avgRespRate = cumulativeMetricsRef.current.respRateCount > 0
        ? cumulativeMetricsRef.current.respRateSum / cumulativeMetricsRef.current.respRateCount
        : 0;

    if (isChecking) {
        return <div className="h-screen flex items-center justify-center font-black italic uppercase text-slate-400">Initializing MaiXi...</div>;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-6 lg:px-12 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_rgba(0,0,0,0.02)_1px,_transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-50"></div>

            <div className="w-full max-w-[1720px] flex flex-col gap-12 relative z-10">
                <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-10 gap-8">
                    <div className="flex items-center gap-8">
                        <img
                            src="/brand/favicon.svg"
                            alt="脉息 · MaiXi"
                            className="w-20 h-20 rounded-[1.8rem] shadow-[0_15px_35px_rgba(13,94,66,0.18)] ring-1 ring-[#0D5E42]/10"
                        />
                        <div>
                            <h1
                                className="text-5xl font-black tracking-tighter uppercase italic leading-none flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setIsAboutModalOpen(true)}
                            >
                                <span className="text-slate-950">脉息 · MaiXi</span>
                                <span className="text-rose-600 not-italic text-2xl mt-1">3.2 <span className="text-slate-300 text-sm italic lowercase tracking-wider ml-2">远程视觉生理感知</span></span>
                            </h1>
                            <div className="mt-3">
                                <span className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">光映微澜，脉息自明</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        <SceneSelector
                            scenes={SCENES}
                            currentSceneId={selectedScene.id}
                            onSceneChange={handleSceneChange}
                            isCapturing={isCapturing}
                        />
                    </div>
                </header>

                <AboutModal
                    isOpen={isAboutModalOpen}
                    onClose={() => setIsAboutModalOpen(false)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-3 xl:col-span-4 space-y-8">
                        <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.04)] border border-slate-200 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-950 rounded-2xl text-white shadow-xl shadow-slate-950/20"><Zap className="w-6 h-6" /></div>
                                        <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">实时采集监控</h2>
                                    </div>
                                    <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 pl-[3.25rem]">
                                        <span>请将面部置于椭圆框内</span>
                                        <span className="text-slate-300 mx-1">•</span>
                                        <span>{selectedScene.shortModelName} · {selectedScene.frameWidth}×{selectedScene.frameHeight}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 rounded-[2rem] px-5 py-3 border border-slate-100 shadow-sm relative overflow-hidden">
                                    {!inference.isInitialized && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100"><div className="h-full bg-blue-500 animate-pulse" style={{ width: '40%' }}></div></div>}
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">引擎状态</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${inference.isInitialized ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-400 animate-pulse'}`}></div>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{inference.isInitialized ? '信号锁定开启' : '引擎初始化中'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <VideoDisplay
                                key={processorEpoch}
                                videoProcessor={capture.processorRef.current}
                                faceDetected={capture.processorRef.current?.isFaceDetected() || false}
                                bufferProgress={scheduler.bufferProgress}
                                isCapturing={isCapturing}
                            />

                            <div className="mt-10 pt-10 border-t border-slate-100">
                                <Controls
                                    isInitialized={inference.isInitialized}
                                    isCapturing={isCapturing}
                                    onStart={handleStartCapture}
                                    onStop={handleStopCapture}
                                    onVideoFileSelected={handleVideoFileSelected}
                                    onExport={handleExport}
                                    onGenerateReport={handleGenerateReport}
                                />
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-100 relative z-10 w-full">
                                <GlobalMetricsRow
                                    vitalSigns={vitalSigns}
                                    avgHeartRate={avgHeartRate}
                                    avgRespRate={avgRespRate}
                                    isReady={isReady}
                                    bufferProgress={scheduler.bufferProgress}
                                    hideResp={!showResp}
                                />
                            </div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.01)_1px,_transparent_0)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
                        </div>
                    </div>

                    <div className="lg:col-span-9 xl:col-span-8 flex flex-col gap-8">
                        <div className="animate-slide-up transform-gpu">
                            <MainDashboard
                                sceneId={selectedScene.id}
                                vitalSigns={vitalSigns}
                                avgHeartRate={avgHeartRate}
                                avgRespRate={avgRespRate}
                                minHeartRate={cumulativeMetricsRef.current.heartRateMin}
                                maxHeartRate={cumulativeMetricsRef.current.heartRateMax}
                                minRespRate={cumulativeMetricsRef.current.respRateMin}
                                maxRespRate={cumulativeMetricsRef.current.respRateMax}
                                isReady={isReady}
                                bufferProgress={scheduler.bufferProgress}
                            />
                        </div>
                    </div>
                </div>

                <footer className="bg-white/60 backdrop-blur-md rounded-[3rem] p-10 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="max-w-2xl flex items-center gap-8">
                        <div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 block mb-2">测量协议说明</span>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                默认「标准健康监测」与 mmrphys-live-base 对齐（SCAMPS /255、12 s 起算、30 s FFT）。
                                各场景仅展示该模型真实输出的任务。本系统仅作科研与健康参考，不作临床诊断。
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        {statusMessage && (
                            <div className="px-5 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                                <span className="text-xs font-black text-slate-400 uppercase block mb-1">系统状态</span>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${statusMessage.type === 'error' ? 'bg-rose-500' : statusMessage.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'} ${statusMessage.type === 'info' ? 'animate-pulse' : ''}`} />
                                    <span className={`text-xs font-black tracking-widest lowercase ${statusMessage.type === 'error' ? 'text-rose-600' : statusMessage.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {statusMessage.message}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="px-5 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                            <span className="text-xs font-black text-slate-400 uppercase block mb-1">编译版本</span>
                            <span className="text-xs font-black text-slate-900 tracking-widest lowercase">v3.2.1-protocol</span>
                        </div>
                    </div>
                </footer>
            </div>

            {reportData && (
                <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-xl flex items-center justify-center p-8">
                    <div className="w-full max-w-5xl h-[90vh] overflow-y-auto bg-white rounded-[4rem] shadow-2xl relative">
                        <ReportView data={reportData} onClose={() => setReportData(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
