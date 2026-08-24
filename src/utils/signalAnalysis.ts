// src/utils/signalAnalysis.ts

export interface SignalQuality {
    snr: number;           // Signal-to-noise ratio
    quality: 'excellent' | 'good' | 'moderate' | 'poor';
}

export interface SignalMetrics {
    rate: number;
    instantRate?: number;
    quality: SignalQuality;
}

export class SignalAnalyzer {
    private static readonly FREQ_RANGES = {
        heart: {
            minFreq: 0.6,   // 36 BPM
            maxFreq: 3.3    // 198 BPM
        },
        resp: {
            minFreq: 0.1,   // 6 breaths/minute
            maxFreq: 0.54    // 32 breaths/minute
        }
    };

    private static readonly RATE_RANGES = {
        heart: {
            min: 36,
            max: 198,
            default: 0
        },
        resp: {
            min: 6,
            max: 32,
            default: 0
        }
    };

    /**
     * Analyze physiological signal and return comprehensive metrics
     */
    public static analyzeSignal(
        signal: number[],
        raw: number[],
        samplingRate: number,
        type: 'heart' | 'resp'
    ): SignalMetrics {
        // Validate input
        if (!signal?.length || signal.length < samplingRate) {
            return this.getDefaultMetrics(type);
        }

        try {
            // Apply specific preprocessing for heart rate vs respiratory signals
            let processedSignal = [...signal];

            // Step 1: Remove DC component
            processedSignal = this.removeDC(processedSignal);

            // Step 2: Apply windowing function to reduce spectral leakage
            const windowed = this.applyWindow(processedSignal);

            // Step 3: Compute FFT
            const fftResult = this.computeFFT(windowed);

            // Step 4: Find dominant frequency
            const { minFreq, maxFreq } = this.FREQ_RANGES[type];
            const peakFreq = this.findDominantFrequency(fftResult, samplingRate, minFreq, maxFreq);

            const rate = peakFreq > 0 ? peakFreq * 60 : 0;
            const quality = this.assessSignalQuality(processedSignal, raw, type, samplingRate, peakFreq);
            const validatedRate = this.validateRate(rate, type, quality);

            return {
                rate: validatedRate,
                quality
            };
        } catch (error) {
            console.warn(`Signal analysis error for ${type}:`, error);
            return this.getDefaultMetrics(type);
        }
    }

    // Zero-padding for better FFT frequency resolution
    private static zeroPad(signal: number[], targetLength: number): number[] {
        if (signal.length >= targetLength) return signal;
        const padded = new Array(targetLength).fill(0);
        for (let i = 0; i < signal.length; i++) {
            padded[i] = signal[i];
        }
        return padded;
    }

    private static getDefaultMetrics(type: 'heart' | 'resp'): SignalMetrics {
        const defaultRates = this.RATE_RANGES[type];
        return {
            rate: defaultRates.default,
            quality: {
                snr: 0,
                quality: 'poor'
            }
        };
    }

    private static validateRate(
        rate: number,
        type: 'heart' | 'resp',
        quality: SignalMetrics['quality']
    ): number {
        const range = this.RATE_RANGES[type];

        // Don't immediately reject respiration rates with poor quality
        // Only use default for very poor signals with near-zero SNR
        if (!isFinite(rate) || rate <= 0) {
            return 0;
        }

        if (quality.quality === 'poor' && quality.snr < 1) {
            return 0;
        }

        if (rate < range.min || rate > range.max) {
            return 0;
        }

        return rate;
    }

    /**
     * Calculate frequency-based SNR using physiological frequency bands
     * @param signal The filtered signal array
     * @param raw The raw unfiltered signal array
     * @param type The signal type ('heart' or 'resp')
     * @returns SNR value in decibels
     */
    private static calculateSNR(
        raw: number[],
        type: 'heart' | 'resp',
        sampleRate: number = 30,
        peakFreq: number = 0
    ): number {
        if (!raw?.length) {
            return -20;
        }

        try {
            const { minFreq, maxFreq } = this.FREQ_RANGES[type];
            const windowed = this.applyWindow(raw);
            const fft = this.computeFFT(windowed);

            const magnitudes = new Array(Math.floor(fft.real.length / 2));
            for (let i = 0; i < magnitudes.length; i++) {
                magnitudes[i] = Math.sqrt(fft.real[i] * fft.real[i] + fft.imag[i] * fft.imag[i]);
            }

            const freqResolution = sampleRate / fft.real.length;
            const bandHalfWidth = type === 'heart' ? 0.2 : 0.05;
            const peak = peakFreq > 0 ? peakFreq : this.bandPeakFrequency(magnitudes, freqResolution, minFreq, maxFreq);

            let peakPower = 0;
            let bandPower = 0;

            for (let i = 0; i < magnitudes.length; i++) {
                const freq = i * freqResolution;
                if (freq < minFreq || freq > maxFreq) continue;
                const power = magnitudes[i] * magnitudes[i];
                bandPower += power;
                if (Math.abs(freq - peak) <= bandHalfWidth || Math.abs(freq - peak * 2) <= bandHalfWidth) {
                    peakPower += power;
                }
            }

            const noisePower = Math.max(bandPower - peakPower, 1e-12);
            const snrValue = 10 * Math.log10(Math.max(peakPower, 1e-12) / noisePower);
            return isFinite(snrValue) ? snrValue : -20;
        } catch {
            return -20;
        }
    }

    private static bandPeakFrequency(
        magnitudes: number[],
        freqResolution: number,
        minFreq: number,
        maxFreq: number
    ): number {
        let best = 0;
        let bestPower = 0;
        for (let i = 1; i < magnitudes.length; i++) {
            const freq = i * freqResolution;
            if (freq < minFreq || freq > maxFreq) continue;
            const power = magnitudes[i] * magnitudes[i];
            if (power > bestPower) {
                bestPower = power;
                best = freq;
            }
        }
        return best;
    }

    private static assessSignalQuality(
        signal: number[],
        raw: number[],
        type: 'heart' | 'resp',
        sampleRate: number = 30,
        peakFreq: number = 0
    ): SignalMetrics['quality'] {
        if (signal.length < 30) {
            return {
                snr: 0,
                quality: 'poor'
            };
        }

        try {
            // Calculate SNR using the improved method, passing the sample rate
            const snr = this.calculateSNR(raw, type, sampleRate, peakFreq);

            // Determine quality level based on metrics - adjusted for respiration
            let quality: SignalMetrics['quality']['quality'] = 'poor';

            if (type === 'heart') {
                if (snr >= 10) quality = 'excellent';
                else if (snr >= 5) quality = 'good';
                else if (snr >= 3) quality = 'moderate';
            } else {
                // More lenient thresholds for respiration
                if (snr >= 8) quality = 'excellent';
                else if (snr >= 3) quality = 'good';
                else if (snr >= 1) quality = 'moderate';
            }

            return {
                snr,
                quality
            };
        } catch (error) {
            console.error('Error in signal quality assessment:', error);
            return {
                snr: 0,
                quality: 'poor'
            };
        }
    }

    // Simple DC removal
    public static removeDC(signal: number[]): number[] {
        if (signal.length === 0) return [];

        // Calculate simple mean
        const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;

        // Subtract mean from each sample
        return signal.map(val => val - mean);
    }

    private static applyWindow(signal: number[]): number[] {
        if (signal.length < 2) return signal.slice();
        return signal.map((x, i) => {
            const term = 2 * Math.PI * i / (signal.length - 1);
            const window = 0.54 - 0.46 * Math.cos(term);
            return x * window;
        });
    }

    private static computeFFT(signal: number[]): { real: number[]; imag: number[] } {
        // Validate input signal first
        const validatedSignal = signal.map(val => isFinite(val) ? val : 0);

        const n = validatedSignal.length;
        const result = {
            real: new Array(n).fill(0),
            imag: new Array(n).fill(0)
        };

        // Initialize with validated input signal
        for (let i = 0; i < n; i++) {
            result.real[i] = validatedSignal[i];
        }

        // Check if we have a power of 2
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(n)));
        if (n !== nextPowerOf2) {
            // If not a power of 2, pad with zeros
            result.real = this.zeroPad(result.real, nextPowerOf2);
            result.imag = this.zeroPad(result.imag, nextPowerOf2);
        }

        // Updated n after potential padding
        const adjustedN = result.real.length;
        const bits = Math.log2(adjustedN);

        // Bit reversal
        for (let i = 0; i < adjustedN; i++) {
            let rev = 0;
            for (let j = 0; j < bits; j++) {
                rev = (rev << 1) | ((i >> j) & 1);
            }
            if (rev > i) {
                [result.real[i], result.real[rev]] = [result.real[rev], result.real[i]];
                [result.imag[i], result.imag[rev]] = [result.imag[rev], result.imag[i]];
            }
        }

        // FFT computation with stability checks
        for (let step = 2; step <= adjustedN; step *= 2) {
            const halfStep = step / 2;
            const angle = -2 * Math.PI / step;

            for (let group = 0; group < adjustedN; group += step) {
                for (let pair = 0; pair < halfStep; pair++) {
                    const twiddle = {
                        real: Math.cos(angle * pair),
                        imag: Math.sin(angle * pair)
                    };

                    const pos = group + pair;
                    const match = group + pair + halfStep;

                    // Safe computation with checks for numerical stability
                    const product = {
                        real: twiddle.real * result.real[match] - twiddle.imag * result.imag[match],
                        imag: twiddle.real * result.imag[match] + twiddle.imag * result.real[match]
                    };

                    // Check for non-finite values
                    if (!isFinite(product.real)) product.real = 0;
                    if (!isFinite(product.imag)) product.imag = 0;

                    const newMatchReal = result.real[pos] - product.real;
                    const newMatchImag = result.imag[pos] - product.imag;

                    // Ensure result values are finite
                    result.real[match] = isFinite(newMatchReal) ? newMatchReal : 0;
                    result.imag[match] = isFinite(newMatchImag) ? newMatchImag : 0;

                    const newPosReal = result.real[pos] + product.real;
                    const newPosImag = result.imag[pos] + product.imag;

                    result.real[pos] = isFinite(newPosReal) ? newPosReal : 0;
                    result.imag[pos] = isFinite(newPosImag) ? newPosImag : 0;
                }
            }
        }

        return result;
    }

    private static findDominantFrequency(
        fft: { real: number[]; imag: number[] },
        samplingRate: number,
        minFreq: number,
        maxFreq: number
    ): number {
        const n = fft.real.length;
        const freqResolution = samplingRate / n;

        // Calculate power spectrum
        const powerSpectrum = new Array(Math.floor(n / 2)).fill(0);
        for (let i = 0; i < n / 2; i++) {
            const realVal = isFinite(fft.real[i]) ? fft.real[i] : 0;
            const imagVal = isFinite(fft.imag[i]) ? fft.imag[i] : 0;
            powerSpectrum[i] = realVal * realVal + imagVal * imagVal;
        }

        // Find peaks in the physiological frequency range
        const minIdx = Math.max(1, Math.floor(minFreq / freqResolution));
        const maxIdx = Math.min(Math.ceil(maxFreq / freqResolution), Math.floor(n / 2) - 1);

        // Find all significant peaks
        const peaks: { idx: number, freq: number, power: number }[] = [];
        for (let i = minIdx + 1; i < maxIdx - 1; i++) {
            if (powerSpectrum[i] > powerSpectrum[i - 1] &&
                powerSpectrum[i] > powerSpectrum[i + 1] &&
                powerSpectrum[i] > 0.1 * Math.max(...powerSpectrum.slice(minIdx, maxIdx))) {
                peaks.push({
                    idx: i,
                    freq: i * freqResolution,
                    power: powerSpectrum[i]
                });
            }
        }

        // Sort peaks by power
        peaks.sort((a, b) => b.power - a.power);

        if (peaks.length === 0) {
            return 0;
        }

        // Improved harmonic detection
        if (peaks.length >= 2) {
            const topPeak = peaks[0];

            // Look for potential fundamental frequencies
            for (let i = 1; i < peaks.length; i++) {
                const currentPeak = peaks[i];
                const ratio = topPeak.freq / currentPeak.freq;

                // Check if the top frequency is close to a harmonic (2x, 3x, 4x)
                const nearestHarmonic = Math.round(ratio);
                if (nearestHarmonic > 1 && nearestHarmonic <= 4) {  // Check up to 4th harmonic
                    const harmonicError = Math.abs(ratio - nearestHarmonic);

                    // If this is likely a harmonic (within 10% error)
                    if (harmonicError < 0.1) {
                        // Check if the lower frequency has sufficient power (at least 25% of the harmonic)
                        // and is in the expected physiological range
                        if (currentPeak.power > topPeak.power * 0.25 &&
                            currentPeak.freq >= minFreq &&
                            currentPeak.freq <= maxFreq) {
                            console.log(`Found likely fundamental frequency: ${currentPeak.freq.toFixed(2)}Hz (harmonic ratio: ${ratio.toFixed(2)})`);
                            return currentPeak.freq;
                        }
                    }
                }
            }
        }

        // If no clear harmonic relationship is found, validate the top peak
        const topFreq = peaks[0].freq;

        // Additional validation for physiologically unlikely frequencies
        if (topFreq > maxFreq * 0.8) {  // If frequency is in the upper range
            // Look for a lower frequency peak with significant power
            for (const peak of peaks) {
                if (peak.freq < topFreq * 0.6 && peak.freq >= minFreq &&
                    peak.power > peaks[0].power * 0.3) {
                    console.log(`Choosing lower frequency ${peak.freq.toFixed(2)}Hz over high frequency ${topFreq.toFixed(2)}Hz`);
                    return peak.freq;
                }
            }
        }

        return topFreq;
    }
}