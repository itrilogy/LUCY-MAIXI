import { PreprocessType } from '../types';

export interface TensorFeed {
    data: Float32Array;
    dims: number[];
}

export interface PreprocessSpec {
    preprocess: PreprocessType;
    frameWidth: number;
    frameHeight: number;
    sequenceLength: number;
}

const EPS = 1e-7;

/**
 * Convert a face-crop window into ONNX feeds.
 * Balanced / scale255 matches mmrphys-live-base: RGB / 255, NCDHW, no Z-score.
 */
export function preprocessFrames(
    frameBuffer: ImageData[],
    spec: PreprocessSpec
): Record<string, TensorFeed> {
    if (frameBuffer.length < spec.sequenceLength) {
        throw new Error(`Insufficient frames. Need ${spec.sequenceLength}, got ${frameBuffer.length}`);
    }

    const frames = frameBuffer.slice(-spec.sequenceLength);
    const { frameHeight: H, frameWidth: W, sequenceLength: T, preprocess } = spec;

    if (preprocess === 'tscan') {
        return { input: buildTscan(frames, T, H, W) };
    }
    if (preprocess === 'bigsmall') {
        return buildBigSmall(frames, T, H, W);
    }
    if (preprocess === 'physformer') {
        return {
            input: buildPhysFormer(frames, T, H, W),
            gra_sharp: { data: new Float32Array([1.0]), dims: [] }
        };
    }
    return { input: buildScale255(frames, T, H, W) };
}

function buildScale255(frames: ImageData[], T: number, H: number, W: number): TensorFeed {
    const dims = [1, 3, T, H, W];
    const buffer = new Float32Array(1 * 3 * T * H * W);
    const frameStride = H * W;
    const channelStride = T * frameStride;

    for (let f = 0; f < frames.length; f++) {
        const data = frames[f].data;
        const srcW = frames[f].width;
        const srcH = frames[f].height;
        for (let h = 0; h < H; h++) {
            for (let w = 0; w < W; w++) {
                const sh = Math.min(srcH - 1, Math.floor(h * srcH / H));
                const sw = Math.min(srcW - 1, Math.floor(w * srcW / W));
                const pixelPos = (sh * srcW + sw) * 4;
                const pixelOffset = f * frameStride + h * W + w;
                buffer[pixelOffset] = data[pixelPos] / 255.0;
                buffer[channelStride + pixelOffset] = data[pixelPos + 1] / 255.0;
                buffer[2 * channelStride + pixelOffset] = data[pixelPos + 2] / 255.0;
            }
        }
    }

    return { data: buffer, dims };
}

function buildTscan(frames: ImageData[], T: number, H: number, W: number): TensorFeed {
    const buffer = new Float32Array(T * 6 * H * W);
    for (let f = 0; f < T; f++) {
        const current = frames[f].data;
        const prev = frames[f > 0 ? f - 1 : 0].data;
        const srcW = frames[f].width;
        const srcH = frames[f].height;
        for (let i = 0; i < H * W; i++) {
            const h = Math.floor(i / W);
            const w = i % W;
            const sh = Math.min(srcH - 1, Math.floor(h * srcH / H));
            const sw = Math.min(srcW - 1, Math.floor(w * srcW / W));
            const pos = (sh * srcW + sw) * 4;
            const offset = f * (6 * H * W) + i;
            for (let c = 0; c < 3; c++) {
                const cVal = current[pos + c];
                const pVal = prev[pos + c];
                buffer[offset + c * (H * W)] = (cVal - pVal) / (cVal + pVal + EPS);
                buffer[offset + (c + 3) * (H * W)] = cVal / 255.0;
            }
        }
    }
    return { data: buffer, dims: [T, 6, H, W] };
}

function buildBigSmall(frames: ImageData[], T: number, H: number, W: number): Record<string, TensorFeed> {
    const bigData = new Float32Array(T * 3 * H * W);
    const smallData = new Float32Array(T * 3 * 9 * 9);

    for (let f = 0; f < T; f++) {
        const data = frames[f].data;
        const srcW = frames[f].width;
        const srcH = frames[f].height;
        for (let i = 0; i < H * W; i++) {
            const h = Math.floor(i / W);
            const w = i % W;
            const sh = Math.min(srcH - 1, Math.floor(h * srcH / H));
            const sw = Math.min(srcW - 1, Math.floor(w * srcW / W));
            const srcIdx = (sh * srcW + sw) * 4;
            bigData[f * (3 * H * W) + 0 * (H * W) + i] = data[srcIdx] / 255.0;
            bigData[f * (3 * H * W) + 1 * (H * W) + i] = data[srcIdx + 1] / 255.0;
            bigData[f * (3 * H * W) + 2 * (H * W) + i] = data[srcIdx + 2] / 255.0;
        }

        const strideH = Math.max(1, Math.floor(H / 9));
        const strideW = Math.max(1, Math.floor(W / 9));
        for (let sh = 0; sh < 9; sh++) {
            for (let sw = 0; sw < 9; sw++) {
                const yh = Math.min(srcH - 1, Math.floor((sh * strideH) * srcH / H));
                const xw = Math.min(srcW - 1, Math.floor((sw * strideW) * srcW / W));
                const srcIdx = (yh * srcW + xw) * 4;
                const dstIdx = f * (3 * 81) + sh * 9 + sw;
                smallData[dstIdx] = data[srcIdx] / 255.0;
                smallData[dstIdx + 81] = data[srcIdx + 1] / 255.0;
                smallData[dstIdx + 162] = data[srcIdx + 2] / 255.0;
            }
        }
    }

    return {
        big_input: { data: bigData, dims: [T, 3, H, W] },
        small_input: { data: smallData, dims: [T, 3, 9, 9] }
    };
}

function buildPhysFormer(frames: ImageData[], T: number, H: number, W: number): TensorFeed {
    const dims = [1, 3, T, H, W];
    const dataSize = 1 * 3 * T * H * W;
    const buffer = new Float32Array(dataSize);
    const frameStride = H * W;
    const channelStride = T * frameStride;

    for (let f = 0; f < frames.length; f++) {
        const currentData = frames[f].data;
        const nextData = frames[f < frames.length - 1 ? f + 1 : f].data;
        const srcW = frames[f].width;
        const srcH = frames[f].height;

        for (let h = 0; h < H; h++) {
            for (let w = 0; w < W; w++) {
                const sh = Math.min(srcH - 1, Math.floor(h * srcH / H));
                const sw = Math.min(srcW - 1, Math.floor(w * srcW / W));
                const pixelPos = (sh * srcW + sw) * 4;
                const pixelOffset = f * frameStride + h * W + w;
                for (let c = 0; c < 3; c++) {
                    const cVal = nextData[pixelPos + c];
                    const pVal = currentData[pixelPos + c];
                    const diffVal = (f < frames.length - 1)
                        ? (cVal - pVal) / (cVal + pVal + EPS)
                        : 0;
                    buffer[c * channelStride + pixelOffset] = diffVal;
                }
            }
        }
    }

    let sum = 0;
    for (let i = 0; i < dataSize; i++) sum += buffer[i];
    const mean = sum / dataSize;
    let sq = 0;
    for (let i = 0; i < dataSize; i++) {
        const d = buffer[i] - mean;
        sq += d * d;
    }
    const std = Math.sqrt(sq / dataSize + 1e-6);
    for (let i = 0; i < dataSize; i++) {
        buffer[i] = (buffer[i] - mean) / std;
    }

    return { data: buffer, dims };
}

export function cloneImageData(frame: ImageData): ImageData {
    return new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height);
}

export function transferableOf(frames: ImageData[]): ArrayBuffer[] {
    return frames.map(frame => frame.data.buffer as ArrayBuffer);
}
