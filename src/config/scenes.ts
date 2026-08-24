import { SceneConfig } from '@/types';

/**
 * Single source of truth for the four measurement protocols.
 * chunkLength / spatial size / tasks / preprocess / metric windows must stay
 * in sync with public/models/<scene>/config.json.
 */
export const SCENES: SceneConfig[] = [
    {
        id: 'balanced',
        name: '标准健康监测',
        description: 'SCAMPS MMRPhys 双任务协议，与 mmrphys-live-base 对齐：/255 预处理，12 s 起算、30 s FFT 窗。',
        modelPath: '/models/rphys/SCAMPS_Multi_72x72.onnx',
        configPath: '/models/rphys/config.json',
        shortModelName: 'SCAMPS',
        features: ['心率', '呼吸率', '可复现基线'],
        icon: '⚖️',
        recommendedFPS: 30,
        chunkLength: 181,
        frameWidth: 72,
        frameHeight: 72,
        tasks: ['bvp', 'resp'],
        preprocess: 'scale255',
        modelType: 'Balanced',
        minSecondsForMetrics: 12,
        metricsWindowSeconds: 30,
        subsequentRatio: 0.66
    },
    {
        id: 'lite',
        name: '基础快速检测',
        description: 'TS-CAN 轻量流式网络，仅输出 BVP。界面不展示呼吸率。',
        modelPath: '/models/tscan/model.onnx',
        configPath: '/models/tscan/config.json',
        shortModelName: 'TS-CAN',
        features: ['心率数值', '低延迟响应'],
        icon: '⚡',
        recommendedFPS: 30,
        chunkLength: 20,
        frameWidth: 72,
        frameHeight: 72,
        tasks: ['bvp'],
        preprocess: 'tscan',
        modelType: 'TSCAN',
        minSecondsForMetrics: 6,
        metricsWindowSeconds: 12,
        subsequentRatio: 0.66
    },
    {
        id: 'pro',
        name: '驾驶/疲劳监测',
        description: 'BigSmall 多任务：BVP、呼吸与 12 维面部动作单元。疲劳指数为 AU 启发式，不作临床诊断。',
        modelPath: '/models/bigsmall/model.onnx',
        configPath: '/models/bigsmall/config.json',
        shortModelName: 'BigSmall',
        features: ['心率', '呼吸率', '面部 AUs'],
        icon: '🚗',
        recommendedFPS: 30,
        chunkLength: 3,
        frameWidth: 144,
        frameHeight: 144,
        tasks: ['bvp', 'resp', 'au'],
        preprocess: 'bigsmall',
        modelType: 'BigSmall',
        minSecondsForMetrics: 6,
        metricsWindowSeconds: 12,
        subsequentRatio: 0.66
    },
    {
        id: 'expert',
        name: '科研高精分析',
        description: 'PhysFormer：DiffNormalized 输入。HRV 仅在能抽出稳定 IBI 时计算，否则显示为无效。',
        modelPath: '/models/physformer/model.onnx',
        configPath: '/models/physformer/config.json',
        shortModelName: 'PhysFormer',
        features: ['BVP', 'HRV（IBI）', '散点图'],
        icon: '🧬',
        recommendedFPS: 30,
        chunkLength: 160,
        frameWidth: 128,
        frameHeight: 128,
        tasks: ['bvp', 'hrv'],
        preprocess: 'physformer',
        modelType: 'PhysFormer',
        minSecondsForMetrics: 12,
        metricsWindowSeconds: 30,
        subsequentRatio: 0.66
    }
];

export const DEFAULT_SCENE: SceneConfig = SCENES[0];

export function getSceneById(id: string): SceneConfig | undefined {
    return SCENES.find(scene => scene.id === id);
}

export function sceneHasTask(scene: SceneConfig, task: SceneConfig['tasks'][number]): boolean {
    return scene.tasks.includes(task);
}

export function subsequentFramesOf(scene: SceneConfig): number {
    return Math.max(1, Math.floor(scene.chunkLength * scene.subsequentRatio));
}

export function overlapFramesOf(scene: SceneConfig): number {
    return Math.max(0, scene.chunkLength - subsequentFramesOf(scene));
}
