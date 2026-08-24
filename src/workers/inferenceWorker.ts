/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web';
import { ApplicationPaths } from '@/utils/paths';
import { SignalProcessor } from '../utils/signalProcessor';
import { configService } from '../services/configService';
import { preprocessFrames } from '../utils/preprocessFrames';
import { debugLog, debugWarn } from '../utils/logger';
import { PreprocessType, SceneTask, SignalBuffers, WorkerInitConfig } from '../types';

let isShuttingDown = false;
let globalStopRequested = false;
let initGeneration = 0;
let inferenceInFlight = false;

class InferenceWorker {
    private session: ort.InferenceSession | null = null;
    public signalProcessor: SignalProcessor | null = null;
    public isInitialized = false;
    private fps = 30;
    private frameHeight = 72;
    private frameWidth = 72;
    private sequenceLength = 181;
    private preprocess: PreprocessType = 'scale255';
    private tasks: SceneTask[] = ['bvp', 'resp'];
    private minSecondsForMetrics = 12;
    private metricsWindowSeconds = 30;

    async initialize(config?: WorkerInitConfig): Promise<void> {
        const generation = ++initGeneration;
        this.isInitialized = false;

        try {
            if (this.session) {
                await this.session.release();
                this.session = null;
            }

            await this.configureOrtEnvironment();

            const modelConfig = await configService.getConfig(config?.configPath);
            if (!modelConfig) {
                throw new Error('Failed to load model configuration');
            }

            this.preprocess = config?.preprocess || 'scale255';
            this.tasks = config?.tasks || ['bvp', 'resp'];
            this.sequenceLength = config?.initialFrames || modelConfig.FRAME_NUM || 181;
            this.minSecondsForMetrics = config?.minSecondsForMetrics ?? 12;
            this.metricsWindowSeconds = config?.metricsWindowSeconds ?? 30;

            const isBigSmall = this.preprocess === 'bigsmall' || modelConfig.modelType === 'BigSmall';
            const inputSizeObj = modelConfig.input_size as Record<string, number[]>;
            if (isBigSmall && inputSizeObj?.big) {
                this.frameWidth = inputSizeObj.big[3] || 144;
                this.frameHeight = inputSizeObj.big[2] || 144;
            } else if (Array.isArray(modelConfig.input_size)) {
                const inputArr = modelConfig.input_size;
                this.frameWidth = inputArr[inputArr.length - 1] || 72;
                this.frameHeight = inputArr[inputArr.length - 2] || 72;
            }

            if (config?.modelType === 'PhysFormer' || this.preprocess === 'physformer') {
                this.frameWidth = 128;
                this.frameHeight = 128;
            }

            if (modelConfig.sampling_rate) {
                this.fps = modelConfig.sampling_rate;
            }

            const modelPath = config?.modelPath || modelConfig.model_path;
            const session = await this.createSession(modelPath);

            if (generation !== initGeneration) {
                await session.release();
                this.session = null;
                return;
            }

            const initialFrames = config?.initialFrames || this.sequenceLength;
            const subsequentFrames = config?.subsequentFrames || Math.floor(initialFrames * 0.66);
            this.signalProcessor = new SignalProcessor(
                this.fps,
                initialFrames,
                subsequentFrames,
                this.minSecondsForMetrics,
                this.metricsWindowSeconds
            );

            await this.warmup();

            if (generation !== initGeneration) {
                return;
            }

            this.isInitialized = true;
            self.postMessage({ type: 'init', status: 'success', generation });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            self.postMessage({
                type: 'init',
                status: 'error',
                error: `Initialization failed: ${errorMessage}`
            });
        }
    }

    private async configureOrtEnvironment(): Promise<void> {
        ort.env.wasm.wasmPaths = {
            'ort-wasm.wasm': ApplicationPaths.ortWasm('ort-wasm.wasm'),
            'ort-wasm-simd.wasm': ApplicationPaths.ortWasm('ort-wasm-simd.wasm'),
            'ort-wasm-threaded.wasm': ApplicationPaths.ortWasm('ort-wasm-threaded.wasm'),
            'ort-wasm-simd-threaded.wasm': ApplicationPaths.ortWasm('ort-wasm-simd-threaded.wasm')
        };
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
    }

    private async createSession(modelPath?: string): Promise<ort.InferenceSession> {
        if (!modelPath) {
            throw new Error('No model path provided');
        }
        const fetchPath = modelPath.startsWith('http') || modelPath.startsWith('/')
            ? modelPath
            : `/${modelPath}`;

        const session = await ort.InferenceSession.create(fetchPath, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all',
            executionMode: 'sequential',
            enableCpuMemArena: true,
            enableMemPattern: true,
            logSeverityLevel: 3,
            intraOpNumThreads: 1,
            interOpNumThreads: 1
        });
        this.session = session;
        debugLog('InferenceWorker', 'Session created', session.inputNames, session.outputNames);
        return session;
    }

    private async warmup(): Promise<void> {
        if (!this.session) return;
        const dummyFrames: ImageData[] = [];
        for (let i = 0; i < this.sequenceLength; i++) {
            dummyFrames.push(new ImageData(this.frameWidth, this.frameHeight));
        }
        const feeds = this.buildFeeds(dummyFrames);
        try {
            const results = await this.session.run(feeds);
            this.disposeTensors(feeds);
            this.disposeTensors(results);
        } catch (error) {
            this.disposeTensors(feeds);
            debugWarn('InferenceWorker', 'Warmup failed (non-fatal)', error);
        }
    }

    private buildFeeds(frameBuffer: ImageData[]): { [key: string]: ort.Tensor } {
        const arrays = preprocessFrames(frameBuffer, {
            preprocess: this.preprocess,
            frameWidth: this.frameWidth,
            frameHeight: this.frameHeight,
            sequenceLength: this.sequenceLength
        });
        const feeds: { [key: string]: ort.Tensor } = {};
        for (const [name, tensor] of Object.entries(arrays)) {
            feeds[name] = new ort.Tensor('float32', tensor.data, tensor.dims);
        }
        return feeds;
    }

    private disposeTensors(map: { [key: string]: ort.Tensor } | ort.InferenceSession.OnnxValueMapType): void {
        Object.values(map).forEach(tensor => {
            try {
                (tensor as ort.Tensor)?.dispose?.();
            } catch {
                /* ignore */
            }
        });
    }

    private async processFrames(frameBuffer: ImageData[]): Promise<SignalBuffers | null> {
        if (!this.session || !this.signalProcessor || !this.signalProcessor.isCapturing) {
            return null;
        }
        if (!frameBuffer || frameBuffer.length < this.sequenceLength) {
            return null;
        }

        let feeds: { [key: string]: ort.Tensor } | null = null;
        let results: ort.InferenceSession.OnnxValueMapType | null = null;

        try {
            const inferenceStartTime = performance.now();
            feeds = this.buildFeeds(frameBuffer);
            results = await this.session.run(feeds);
            this.signalProcessor.setInferenceTime(performance.now() - inferenceStartTime);

            const outputNames = Object.keys(results);
            const bvpKey = outputNames.find(k =>
                k.toLowerCase().includes('bvp') || k === 'output' || k === 'rPPG'
            );
            const respKey = this.tasks.includes('resp')
                ? outputNames.find(k => k.toLowerCase().includes('resp') || k === 'rRSP')
                : undefined;
            const auKey = this.tasks.includes('au')
                ? outputNames.find(k => k.toLowerCase().includes('au'))
                : undefined;

            if (!bvpKey) {
                throw new Error(`Missing BVP output. Available: ${outputNames.join(', ')}`);
            }

            const bvpData = Array.from(results[bvpKey].data as Float32Array);
            const respData = respKey ? Array.from(results[respKey].data as Float32Array) : [];

            let actionUnits: number[] | undefined;
            if (auKey) {
                actionUnits = Array.from(results[auKey].data as Float32Array).slice(-12);
            }

            const timestamp = new Date().toISOString();
            const processedSignals = this.signalProcessor.processNewSignals(
                bvpData,
                respData,
                timestamp,
                {
                    hasResp: Boolean(respKey),
                    computeHrv: this.tasks.includes('hrv')
                }
            );

            return {
                bvp: {
                    raw: processedSignals.displayData.bvp,
                    filtered: processedSignals.displayData.filteredBvp || [],
                    metrics: processedSignals.bvp
                },
                resp: {
                    raw: processedSignals.displayData.resp,
                    filtered: processedSignals.displayData.filteredResp || [],
                    metrics: processedSignals.resp
                },
                actionUnits,
                timestamp,
                hrv: processedSignals.hrv,
                sessionStats: processedSignals.sessionStats
            } as SignalBuffers & { hrv?: unknown; sessionStats?: unknown };
        } finally {
            if (feeds) this.disposeTensors(feeds);
            if (results) this.disposeTensors(results);
        }
    }

    async runInference(frames: ImageData[]): Promise<void> {
        if (!this.signalProcessor || !this.isInitialized || isShuttingDown || globalStopRequested) return;
        if (!this.signalProcessor.isCapturing || inferenceInFlight) return;

        inferenceInFlight = true;
        try {
            const processingStart = performance.now();
            const processedSignals = await this.processFrames(frames);
            if (!processedSignals || isShuttingDown || !this.signalProcessor.isCapturing) return;

            self.postMessage({
                type: 'inferenceResult',
                status: 'success',
                bvp: processedSignals.bvp,
                resp: processedSignals.resp,
                actionUnits: processedSignals.actionUnits,
                hrv: (processedSignals as SignalBuffers & { hrv?: unknown }).hrv ?? null,
                sessionStats: processedSignals.sessionStats,
                timestamp: processedSignals.timestamp,
                performanceMetrics: {
                    averageUpdateTime: performance.now() - processingStart,
                    updateCount: 1,
                    bufferUtilization: 100
                }
            });
        } catch (error) {
            self.postMessage({ type: 'inferenceResult', status: 'error', error: String(error) });
        } finally {
            inferenceInFlight = false;
        }
    }

    async exportData(): Promise<void> {
        try {
            if (!this.signalProcessor) throw new Error('Signal processor not initialized');
            const data = this.signalProcessor.getExportData();
            if (!data?.signals?.bvp?.raw?.length && !data?.signals?.resp?.raw?.length) {
                throw new Error('No data to export');
            }
            self.postMessage({ type: 'exportData', status: 'success', data: JSON.stringify(data) });
        } catch (error) {
            self.postMessage({ type: 'exportData', status: 'error', error: String(error) });
        }
    }

    startCapture(): void {
        isShuttingDown = false;
        globalStopRequested = false;
        if (!this.signalProcessor) {
            this.signalProcessor = new SignalProcessor(
                this.fps,
                this.sequenceLength,
                Math.floor(this.sequenceLength * 0.66),
                this.minSecondsForMetrics,
                this.metricsWindowSeconds
            );
        }
        this.signalProcessor.reset();
        this.signalProcessor.startCapture();
        this.signalProcessor.isCapturing = true;
        self.postMessage({ type: 'startCapture', status: 'success' });
    }

    stopCapture(): void {
        globalStopRequested = true;
        if (this.signalProcessor) {
            this.signalProcessor.stopCapture();
            this.signalProcessor.isCapturing = false;
        }
        self.postMessage({ type: 'stopCapture', status: 'success' });
    }

    reset(): void {
        isShuttingDown = false;
        globalStopRequested = false;
        inferenceInFlight = false;
        if (this.signalProcessor) {
            this.signalProcessor.reset();
            this.signalProcessor.isCapturing = false;
        }
        self.postMessage({ type: 'reset', status: 'success' });
    }

    async dispose(): Promise<void> {
        isShuttingDown = true;
        globalStopRequested = true;
        if (this.session) {
            await this.session.release();
            this.session = null;
        }
        this.signalProcessor = null;
        this.isInitialized = false;
        self.postMessage({ type: 'dispose', status: 'success' });
    }
}

const worker = new InferenceWorker();

self.onmessage = async (e: MessageEvent) => {
    try {
        switch (e.data.type) {
            case 'reset':
                worker.reset();
                return;
            case 'stopCapture':
                worker.stopCapture();
                return;
            case 'exportData':
                await worker.exportData();
                return;
            case 'dispose':
                await worker.dispose();
                return;
            default:
                break;
        }

        if (isShuttingDown || globalStopRequested) {
            if (e.data.type !== 'init' && e.data.type !== 'startCapture') {
                return;
            }
        }

        if (e.data.type === 'inferenceResult' &&
            (!worker.signalProcessor || !worker.signalProcessor.isCapturing)) {
            return;
        }

        switch (e.data.type) {
            case 'init':
                await worker.initialize(e.data.config as WorkerInitConfig);
                break;
            case 'startCapture':
                globalStopRequested = false;
                isShuttingDown = false;
                worker.startCapture();
                break;
            case 'inferenceResult':
                await worker.runInference(e.data.frameBuffer);
                break;
            default:
                self.postMessage({
                    type: e.data.type,
                    status: 'error',
                    error: `Unknown message type: ${e.data.type}`
                });
        }
    } catch (error) {
        self.postMessage({
            type: e.data.type,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

self.addEventListener('error', (event: ErrorEvent) => {
    self.postMessage({ type: 'error', status: 'error', error: event.message || 'Unknown error' });
});

self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    self.postMessage({
        type: 'error',
        status: 'error',
        error: event.reason instanceof Error ? event.reason.message : String(event.reason)
    });
});

export { };
