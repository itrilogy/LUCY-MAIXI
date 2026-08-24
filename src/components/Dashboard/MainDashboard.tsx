import React from 'react';
import { VitalSigns, SceneType } from '@/types';
import DashboardLayout from './DashboardLayout';
import LiteView from '../Scenes/LiteView';
import BalancedView from '../Scenes/BalancedView';
import DrivingView from '../Scenes/DrivingView';
import ExpertView from '../Scenes/ExpertView';

interface MainDashboardProps {
    sceneId: SceneType;
    vitalSigns: VitalSigns;
    avgHeartRate: number;
    avgRespRate: number;
    minHeartRate: number;
    maxHeartRate: number;
    minRespRate: number;
    maxRespRate: number;
    isReady: boolean;
    bufferProgress: number;
}

const SCENE_METADATA: Record<SceneType, { name: string; icon: string; hideResp?: boolean }> = {
    lite: { name: '基础快速检测', icon: '⚡', hideResp: true },
    balanced: { name: '标准健康监测', icon: '⚖️' },
    pro: { name: '驾驶/疲劳监测', icon: '🚗' },
    expert: { name: '科研高精分析', icon: '🧬', hideResp: true }
};

const MainDashboard: React.FC<MainDashboardProps> = ({
    sceneId,
    vitalSigns,
    avgHeartRate,
    avgRespRate,
    minHeartRate,
    maxHeartRate,
    minRespRate,
    maxRespRate,
    isReady,
    bufferProgress
}) => {
    const metadata = SCENE_METADATA[sceneId];

    return (
        <DashboardLayout
            sceneName={metadata.name}
            sceneIcon={metadata.icon}
            vitalSigns={vitalSigns}
            avgHeartRate={avgHeartRate}
            avgRespRate={avgRespRate}
            isReady={isReady}
            bufferProgress={bufferProgress}
            hideResp={metadata.hideResp}
        >
            <div className="scene-content">
                {sceneId === 'lite' && (
                    <LiteView
                        vitalSigns={vitalSigns}
                        avgHeartRate={avgHeartRate}
                        minHeartRate={minHeartRate}
                        maxHeartRate={maxHeartRate}
                        avgRespRate={avgRespRate}
                        minRespRate={minRespRate}
                        maxRespRate={maxRespRate}
                        isReady={isReady}
                    />
                )}
                {sceneId === 'balanced' && (
                    <BalancedView
                        vitalSigns={vitalSigns}
                        avgHeartRate={avgHeartRate}
                        avgRespRate={avgRespRate}
                        minHeartRate={minHeartRate}
                        maxHeartRate={maxHeartRate}
                        minRespRate={minRespRate}
                        maxRespRate={maxRespRate}
                        isReady={isReady}
                    />
                )}
                {sceneId === 'pro' && (
                    <DrivingView
                        vitalSigns={vitalSigns}
                        avgHeartRate={avgHeartRate}
                        avgRespRate={avgRespRate}
                        minHeartRate={minHeartRate}
                        maxHeartRate={maxHeartRate}
                        minRespRate={minRespRate}
                        maxRespRate={maxRespRate}
                        isReady={isReady}
                    />
                )}
                {sceneId === 'expert' && (
                    <ExpertView
                        vitalSigns={vitalSigns}
                        avgHeartRate={avgHeartRate}
                        avgRespRate={avgRespRate}
                        minHeartRate={minHeartRate}
                        maxHeartRate={maxHeartRate}
                        isReady={isReady}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default MainDashboard;
