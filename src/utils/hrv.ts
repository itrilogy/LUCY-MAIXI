import { HrvMetrics } from '../types';

/**
 * Peak-interval HRV from a filtered BVP window.
 * Returns null when there are not enough physiologically plausible IBIs.
 */
export function computeHrvMetrics(signal: number[], fps: number): HrvMetrics | null {
    if (!signal.length || fps <= 0) return null;

    const minDistance = Math.max(2, Math.floor(fps * 0.3)); // ~200 BPM ceiling
    const peaks = findPeaks(signal, minDistance);
    if (peaks.length < 4) return null;

    const ibiMs: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
        const dt = ((peaks[i] - peaks[i - 1]) / fps) * 1000;
        if (dt >= 333 && dt <= 1500) {
            ibiMs.push(dt);
        }
    }
    if (ibiMs.length < 3) return null;

    const mean = ibiMs.reduce((a, b) => a + b, 0) / ibiMs.length;
    const sdnn = Math.sqrt(ibiMs.reduce((s, v) => s + (v - mean) ** 2, 0) / ibiMs.length);

    const successive: number[] = [];
    for (let i = 1; i < ibiMs.length; i++) {
        successive.push(ibiMs[i] - ibiMs[i - 1]);
    }
    const rmssd = Math.sqrt(successive.reduce((s, v) => s + v * v, 0) / successive.length);

    // Poincaré: SD1 / SD2 from successive IBIs
    const n = ibiMs.length - 1;
    let sumPlus = 0;
    let sumMinus = 0;
    let sumPlusSq = 0;
    let sumMinusSq = 0;
    for (let i = 0; i < n; i++) {
        const plus = (ibiMs[i] + ibiMs[i + 1]) / Math.SQRT2;
        const minus = (ibiMs[i] - ibiMs[i + 1]) / Math.SQRT2;
        sumPlus += plus;
        sumMinus += minus;
        sumPlusSq += plus * plus;
        sumMinusSq += minus * minus;
    }
    const meanPlus = sumPlus / n;
    const meanMinus = sumMinus / n;
    const sd2 = Math.sqrt(Math.max(0, sumPlusSq / n - meanPlus * meanPlus));
    const sd1 = Math.sqrt(Math.max(0, sumMinusSq / n - meanMinus * meanMinus));

    return {
        sdnn,
        rmssd,
        sd1,
        sd2,
        meanIbiMs: mean,
        peakCount: peaks.length
    };
}

export function findPeaks(signal: number[], minDistance: number): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < signal.length - 1; i++) {
        if (signal[i] > signal[i - 1] && signal[i] >= signal[i + 1]) {
            if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
                peaks.push(i);
            }
        }
    }
    return peaks;
}

export function poincarePoints(signal: number[], fps: number): Array<{ x: number; y: number }> {
    const minDistance = Math.max(2, Math.floor(fps * 0.3));
    const peaks = findPeaks(signal, minDistance);
    const ibi: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
        const dt = ((peaks[i] - peaks[i - 1]) / fps) * 1000;
        if (dt >= 333 && dt <= 1500) ibi.push(dt);
    }
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < ibi.length - 1; i++) {
        points.push({ x: ibi[i], y: ibi[i + 1] });
    }
    return points;
}
