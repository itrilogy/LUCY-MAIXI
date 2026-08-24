import { useCallback, useRef, useState } from 'react';
import { SceneConfig } from '@/types';
import { VideoProcessor } from '@/utils/videoProcessor';
import { overlapFramesOf, subsequentFramesOf } from '@/config/scenes';

interface SchedulerArgs {
    getProcessor: () => VideoProcessor | null;
    isReady: () => boolean;
    sendWindow: (frames: ImageData[], isInitial: boolean) => boolean;
}

export function useFrameScheduler({ getProcessor, isReady, sendWindow }: SchedulerArgs) {
    const intervalRef = useRef<number | null>(null);
    const collectionRef = useRef({
        frames: [] as ImageData[],
        initialCollectionComplete: false,
        framesSinceLastInference: 0
    });
    const [bufferProgress, setBufferProgress] = useState(0);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const resetCollection = useCallback(() => {
        collectionRef.current = {
            frames: [],
            initialCollectionComplete: false,
            framesSinceLastInference: 0
        };
        setBufferProgress(0);
    }, []);

    const start = useCallback((scene: SceneConfig) => {
        stop();
        resetCollection();
        const initial = scene.chunkLength;
        const subsequent = subsequentFramesOf(scene);
        const overlap = overlapFramesOf(scene);

        intervalRef.current = window.setInterval(() => {
            const processor = getProcessor();
            if (!processor?.isCapturing() || !isReady()) return;
            const newFrames = processor.getNewFrames();
            if (newFrames.length === 0) return;

            const state = collectionRef.current;
            state.frames.push(...newFrames);
            state.framesSinceLastInference += newFrames.length;

            const target = state.initialCollectionComplete ? subsequent : initial;
            const progress = Math.min(100, (state.framesSinceLastInference / target) * 100);
            setBufferProgress(state.initialCollectionComplete ? 100 : progress);

            if (!state.initialCollectionComplete && state.frames.length >= initial) {
                const windowFrames = state.frames.slice(-initial);
                sendWindow(windowFrames, true);
                state.initialCollectionComplete = true;
                state.framesSinceLastInference = 0;
                state.frames = state.frames.slice(-overlap);
            } else if (state.initialCollectionComplete && state.framesSinceLastInference >= subsequent) {
                const windowFrames = state.frames.slice(-initial);
                sendWindow(windowFrames, false);
                state.framesSinceLastInference = 0;
                state.frames = state.frames.slice(-overlap);
            }
        }, 33);
    }, [getProcessor, isReady, sendWindow, stop, resetCollection]);

    return {
        bufferProgress,
        setBufferProgress,
        start,
        stop,
        resetCollection
    };
}
