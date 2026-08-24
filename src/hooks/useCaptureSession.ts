import { useCallback, useRef } from 'react';
import { SceneConfig } from '@/types';
import { VideoProcessor } from '@/utils/videoProcessor';

export function useCaptureSession() {
    const processorRef = useRef<VideoProcessor | null>(null);

    const ensureProcessor = useCallback((scene: SceneConfig) => {
        if (!processorRef.current) {
            processorRef.current = new VideoProcessor();
        }
        processorRef.current.applySceneSpec({
            frameWidth: scene.frameWidth,
            frameHeight: scene.frameHeight,
            sequenceLength: scene.chunkLength
        });
        return processorRef.current;
    }, []);

    const startCamera = useCallback(async (scene: SceneConfig) => {
        const processor = ensureProcessor(scene);
        await processor.reset();
        await processor.startCapture();
        return processor;
    }, [ensureProcessor]);

    const startVideoFile = useCallback(async (scene: SceneConfig, file: File) => {
        const processor = ensureProcessor(scene);
        await processor.reset();
        await processor.loadVideoFile(file);
        return processor;
    }, [ensureProcessor]);

    const stop = useCallback(async () => {
        await processorRef.current?.stopCapture();
    }, []);

    const bindFaceLost = useCallback((handler: () => void) => {
        processorRef.current?.faceDetector.setOnDetectionStoppedCallback(handler);
    }, []);

    return {
        processorRef,
        ensureProcessor,
        startCamera,
        startVideoFile,
        stop,
        bindFaceLost
    };
}
