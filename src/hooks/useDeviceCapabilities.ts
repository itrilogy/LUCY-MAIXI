// src/hooks/useDeviceCapabilities.ts
import { useState, useEffect } from 'react';

interface DeviceCapabilities {
    hasCamera: boolean;
    hasWebGL: boolean;
    hasWebAssembly: boolean;
    performance: {
        memory: number;
        cores: number;
        connection: string;
    };
    isCompatible: boolean;
}

export const useDeviceCapabilities = () => {
    const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkDeviceCapabilities = async () => {
            try {
                // Check camera
                const devices = await navigator.mediaDevices.enumerateDevices();
                const hasCamera = devices.some(device => device.kind === 'videoinput');

                // Check WebGL
                const canvas = document.createElement('canvas');
                const hasWebGL = !!(
                    window.WebGLRenderingContext &&
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
                );

                // Check WebAssembly
                const hasWebAssembly = typeof WebAssembly === 'object' &&
                    typeof WebAssembly.instantiate === 'function';

                // Get performance capabilities
                const nav = navigator as unknown as { deviceMemory?: number; connection?: { effectiveType?: string } };
                const performance = {
                    memory: nav.deviceMemory || 4,
                    cores: navigator.hardwareConcurrency || 2,
                    connection: nav.connection?.effectiveType || '4g'
                };

                // Check if device meets minimum requirements
                const isCompatible = hasWebAssembly && performance.cores >= 1;

                setCapabilities({
                    hasCamera,
                    hasWebGL,
                    hasWebAssembly,
                    performance,
                    isCompatible
                });
            } catch (error) {
                console.error('Error checking device capabilities:', error);
                setCapabilities(null);
            } finally {
                setIsChecking(false);
            }
        };

        checkDeviceCapabilities();
    }, []);

    return { capabilities, isChecking };
};