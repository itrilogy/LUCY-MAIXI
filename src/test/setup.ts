import { vi } from 'vitest';

const g = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
    HTMLCanvasElement?: typeof HTMLCanvasElement;
};

if (g.window) {
    Object.defineProperty(g.window, 'MediaDevices', {
        value: class {
            getUserMedia = vi.fn().mockResolvedValue({
                getTracks: () => [{
                    stop: vi.fn()
                }]
            });
        }
    });
}

if (g.HTMLCanvasElement) {
    g.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(324),
            width: 72,
            height: 72
        }),
        putImageData: vi.fn(),
        clearRect: vi.fn(),
        save: vi.fn(),
        beginPath: vi.fn(),
        clip: vi.fn(),
        ellipse: vi.fn()
    });
}

if (typeof WebAssembly !== 'undefined') {
    try {
        (globalThis as { WebAssembly: typeof WebAssembly }).WebAssembly = {
            ...WebAssembly,
            instantiate: vi.fn().mockResolvedValue({
                instance: {},
                module: {}
            }),
            compile: vi.fn().mockResolvedValue({})
        } as unknown as typeof WebAssembly;
    } catch {
        /* ignore */
    }
}
