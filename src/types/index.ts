// src/types/index.ts

import { VideoProcessor } from '../utils/videoProcessor';

// Performance Metrics
export interface PerformanceMetrics {
    averageUpdateTime: number;
    updateCount: number;
    bufferUtilization: number;
}



export interface SignalData {
    raw: Float32Array;
    filtered: Float32Array;
    snr: number;
}

export interface RatePoint {
    timestamp: string;
    value: number;
    snr: number;
    quality: 'excellent' | 'good' | 'moderate' | 'poor';
}

export interface VideoDisplayProps {
    videoProcessor: VideoProcessor | null;
    faceDetected: boolean;
    bufferProgress: number;
    isCapturing: boolean;
}

export interface VitalSignsChartProps {
    title: string;
    data: number[];
    filteredData?: number[];
    type: 'bvp' | 'resp';
    isReady: boolean;
    rate: number;
    snr: number;
    quality?: 'excellent' | 'good' | 'moderate' | 'poor';
}

export interface StatusMessageProps {
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

// Vital Signs Interface
export interface HrvMetrics {
    sdnn: number;
    rmssd: number;
    sd1: number;
    sd2: number;
    meanIbiMs: number;
    peakCount: number;
}

export interface VitalSigns {
    heartRate: number;
    respRate: number;
    bvpSignal: number[];
    respSignal: number[];
    bvpSNR: number;
    respSNR: number;
    filteredBvpSignal: number[];
    filteredRespSignal: number[];
    bvpQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    respQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    actionUnits?: number[];
    hrv?: HrvMetrics | null;
}

export interface ControlsProps {
    isCapturing: boolean;
    isInitialized: boolean;
    onStart: () => void;
    onStop: () => void;
    onExport: () => void;
    onGenerateReport: () => void;
    onVideoFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export type StatusMessage = {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
};

// Signal Metrics
export interface SignalMetrics {
    rate: number;
    instantRate?: number;
    quality: {
        snr: number;
        quality: 'excellent' | 'good' | 'moderate' | 'poor';
    };
}

export interface RateSessionStats {
    avg: number;
    min: number;
    max: number;
    count: number;
}

export interface SignalBuffers {
    bvp: {
        raw: number[];
        filtered: number[];
        metrics: SignalMetrics;
    };
    resp: {
        raw: number[];
        filtered: number[];
        metrics: SignalMetrics;
    };
    actionUnits?: number[];
    hrv?: HrvMetrics | null;
    sessionStats?: {
        heart: RateSessionStats;
        resp: RateSessionStats;
    };
    timestamp: string;
}

export interface SignalState {
    raw: number[];
    filtered: number[];
    metrics: SignalMetrics;
}

export interface ProcessedSignals {
    bvp: SignalState;
    resp: SignalState;
    timestamp: string;
    inferenceTime?: number;
}

// Export Data Structure
export interface ExportData {
    metadata: {
        samplingRate: number;
        startTime: string;
        endTime: string;
        totalSamples: number;
    };
    signals: {
        bvp: {
            raw: number[];
        };
        resp: {
            raw: number[];
        }
    };
    rates: {
        heart: RatePoint[];
        respiratory: RatePoint[];
    };
    timestamps: string[];
    performance?: PerformanceMetrics;
}

export interface InferenceResult {
    bvp: {
        raw: number[];
        filtered: number[];
        metrics: SignalMetrics;
    };
    resp: {
        raw: number[];
        filtered: number[];
        metrics: SignalMetrics;
    };
    actionUnits?: number[];
    hrv?: HrvMetrics | null;
    timestamp: string;
    performanceMetrics: PerformanceMetrics;
    sessionStats?: {
        heart: RateSessionStats;
        resp: RateSessionStats;
    };
}

export type SceneType = 'lite' | 'balanced' | 'pro' | 'expert';
export type SceneTask = 'bvp' | 'resp' | 'au' | 'hrv';
export type PreprocessType = 'scale255' | 'tscan' | 'bigsmall' | 'physformer';

export interface SceneConfig {
    id: SceneType;
    name: string;
    description: string;
    modelPath: string;
    configPath: string;
    shortModelName: string;
    features: string[];
    icon: string;
    recommendedFPS: number;
    chunkLength: number;
    frameWidth: number;
    frameHeight: number;
    tasks: SceneTask[];
    preprocess: PreprocessType;
    modelType: string;
    minSecondsForMetrics: number;
    metricsWindowSeconds: number;
    subsequentRatio: number;
}

export type WorkerRequestType =
    | 'init'
    | 'startCapture'
    | 'stopCapture'
    | 'reset'
    | 'inferenceResult'
    | 'exportData'
    | 'dispose';

export interface WorkerInitConfig {
    modelPath: string;
    configPath: string;
    initialFrames: number;
    subsequentFrames: number;
    minSecondsForMetrics: number;
    metricsWindowSeconds: number;
    preprocess: PreprocessType;
    modelType: string;
    tasks: SceneTask[];
    initGeneration?: number;
}

export interface WorkerMessage {
    type: string;
    status: 'success' | 'error';
    results?: unknown;
    error?: string;
    data?: string;
}

export interface FilterCoefficients {
    b: number[];  // feedforward coefficients
    a: number[];  // feedback coefficients
}

export interface ModelConfig {
    sampling_rate: number;
    input_size: number[] | Record<string, number[]>; // Can be number[] or object for multi-input
    output_names: string[];
    modelType?: string; // e.g., 'Balanced', 'TSCAN', 'PhysFormer', 'BigSmall'
}