import { useState, useCallback } from 'react';
import { VitalSigns } from '@/types';

export const useVitalSigns = () => {
    const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
        heartRate: 0,
        respRate: 0,
        bvpSignal: [],
        respSignal: [],
        bvpSNR: 0,
        respSNR: 0,
        filteredBvpSignal: [],
        filteredRespSignal: [],
        bvpQuality: 'poor',
        respQuality: 'poor',
        actionUnits: undefined,
        hrv: null
    });

    const [performance, setPerformance] = useState({
        averageUpdateTime: 0,
        updateCount: 0,
        bufferUtilization: 0
    });

    // Update vital signs
    const updateVitalSigns = useCallback((data: Partial<VitalSigns>) => {
        setVitalSigns(prev => ({
            ...prev,
            ...data
        }));
    }, []);

    // Update performance metrics
    const updatePerformance = useCallback((metrics: Partial<typeof performance>) => {
        setPerformance(prev => ({
            ...prev,
            ...metrics
        }));
    }, []);

    // Reset all data
    const resetData = useCallback(() => {
        setVitalSigns({
            heartRate: 0,
            respRate: 0,
            bvpSignal: [],
            respSignal: [],
            bvpSNR: 0,
            respSNR: 0,
            filteredBvpSignal: [],
            filteredRespSignal: [],
            bvpQuality: 'poor',
            respQuality: 'poor',
            actionUnits: undefined,
            hrv: null
        });
        setPerformance({
            averageUpdateTime: 0,
            updateCount: 0,
            bufferUtilization: 0
        });
    }, []);

    // Note: Automatic resetData on capture stop was removed 
    // to allow data persistence for export and review.
    // resetData() will now be called manually from App.tsx 
    // when starting a new capture or loading a new video.

    return {
        vitalSigns,
        performance,
        updateVitalSigns,
        updatePerformance,
        resetData
    };
};