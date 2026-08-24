import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ExportData,
    InferenceResult,
    SceneConfig,
    StatusMessage
} from '@/types';
import { overlapFramesOf, subsequentFramesOf } from '@/config/scenes';
import { cloneImageData, transferableOf } from '@/utils/preprocessFrames';

interface UseInferenceWorkerArgs {
    onStatus: (status: StatusMessage) => void;
    onResult: (result: InferenceResult) => void;
}

export function useInferenceWorker({ onStatus, onResult }: UseInferenceWorkerArgs) {
    const workerRef = useRef<Worker | null>(null);
    const onStatusRef = useRef(onStatus);
    const onResultRef = useRef(onResult);
    const capturingRef = useRef(false);
    const busyRef = useRef(false);
    const [isInitialized, setIsInitialized] = useState(false);

    onStatusRef.current = onStatus;
    onResultRef.current = onResult;

    const attachWorker = useCallback(() => {
        const worker = new Worker(
            new URL('../workers/inferenceWorker.ts', import.meta.url),
            { type: 'module' }
        );
        worker.onmessage = (event: MessageEvent) => {
            const { type, status, error } = event.data;
            if (type === 'init') {
                if (status === 'success') {
                    setIsInitialized(true);
                    onStatusRef.current({ message: '系统就绪', type: 'success' });
                } else {
                    setIsInitialized(false);
                    onStatusRef.current({
                        message: `推理模块初始化失败: ${error}`,
                        type: 'error'
                    });
                }
                return;
            }
            if (type === 'inferenceResult') {
                busyRef.current = false;
                if (!capturingRef.current) return;
                if (status === 'success') {
                    onResultRef.current(event.data as InferenceResult);
                } else if (error) {
                    onStatusRef.current({ message: `推理失败: ${error}`, type: 'error' });
                }
                return;
            }
            if (type === 'exportData') {
                return;
            }
            if (type === 'error') {
                onStatusRef.current({ message: `后台服务错误: ${error}`, type: 'error' });
            }
        };
        workerRef.current = worker;
        return worker;
    }, []);

    const initScene = useCallback((scene: SceneConfig) => {
        setIsInitialized(false);
        const worker = workerRef.current ?? attachWorker();
        worker.postMessage({
            type: 'init',
            config: {
                modelPath: scene.modelPath,
                configPath: scene.configPath,
                initialFrames: scene.chunkLength,
                subsequentFrames: subsequentFramesOf(scene),
                minSecondsForMetrics: scene.minSecondsForMetrics,
                metricsWindowSeconds: scene.metricsWindowSeconds,
                preprocess: scene.preprocess,
                modelType: scene.modelType,
                tasks: scene.tasks
            }
        });
    }, [attachWorker]);

    const startCapture = useCallback(() => {
        capturingRef.current = true;
        busyRef.current = false;
        workerRef.current?.postMessage({ type: 'reset' });
        workerRef.current?.postMessage({ type: 'startCapture' });
    }, []);

    const stopCapture = useCallback(() => {
        capturingRef.current = false;
        busyRef.current = false;
        workerRef.current?.postMessage({ type: 'stopCapture' });
    }, []);

    const sendWindow = useCallback((frames: ImageData[], isInitial: boolean) => {
        if (!workerRef.current || busyRef.current || !capturingRef.current) {
            return false;
        }
        const copies = frames.map(cloneImageData);
        busyRef.current = true;
        workerRef.current.postMessage(
            {
                type: 'inferenceResult',
                frameBuffer: copies,
                timestamp: performance.now(),
                isInitialBatch: isInitial
            },
            transferableOf(copies)
        );
        return true;
    }, []);

    const requestExport = useCallback((): Promise<ExportData> => {
        return new Promise((resolve, reject) => {
            const worker = workerRef.current;
            if (!worker) {
                reject(new Error('Worker not ready'));
                return;
            }
            const timer = window.setTimeout(() => {
                worker.removeEventListener('message', handler);
                reject(new Error('Export timeout'));
            }, 4000);
            const handler = (event: MessageEvent) => {
                if (event.data.type !== 'exportData') return;
                worker.removeEventListener('message', handler);
                window.clearTimeout(timer);
                if (event.data.status === 'success') {
                    try {
                        resolve(JSON.parse(event.data.data) as ExportData);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(event.data.error || 'Export failed'));
                }
            };
            worker.addEventListener('message', handler);
            worker.postMessage({ type: 'exportData' });
        });
    }, []);

    const dispose = useCallback(() => {
        capturingRef.current = false;
        workerRef.current?.postMessage({ type: 'dispose' });
        workerRef.current?.terminate();
        workerRef.current = null;
    }, []);

    useEffect(() => () => dispose(), [dispose]);

    return {
        isInitialized,
        initScene,
        startCapture,
        stopCapture,
        sendWindow,
        requestExport,
        dispose,
        overlapFramesOf,
        subsequentFramesOf,
        setCapturing: (value: boolean) => {
            capturingRef.current = value;
        }
    };
}
