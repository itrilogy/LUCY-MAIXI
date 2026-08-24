// src/services/configService.ts
import { ApplicationPaths } from '@/utils/paths';

export type ModelConfig = {
    FRAME_NUM: number;
    TASKS: string[];
    FS: number;
    sampling_rate: number;
    input_size: number[] | Record<string, number[]>; // Flexible for multi-input
    output_names: string[];
    modelType?: string; // New: 'TSCAN', 'BigSmall', 'PhysFormer', 'Balanced'
    model_info: {
        name: string;
        version: string;
        description: string;
    };
    model_path: string;
    signal_parameters: {
        bvp: {
            min_rate: number;
            max_rate: number;
            buffer_size: number;
        };
        resp: {
            min_rate: number;
            max_rate: number;
            buffer_size: number;
        };
    };
};

class ConfigService {
    private static instance: ConfigService;
    private config: ModelConfig | null = null;
    private configPromise: Promise<ModelConfig> | null = null;
    private configLoadAttempted: boolean = false;

    private constructor() { }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    public async getConfig(configPath?: string): Promise<ModelConfig> {
        if (configPath) {
            return this.loadConfig(configPath);
        }
        if (!this.config) {
            this.config = await this.loadConfig();
        }
        return this.config;
    }

    public async getFrameWidth(): Promise<number> {
        try {
            const config = await this.getConfig();
            const inputSize = config.input_size;

            // BigSmall special case (144x144)
            if (config.modelType === 'BigSmall') return 144;

            // Standard [B, C, T, H, W] or similar
            if (Array.isArray(inputSize)) {
                return inputSize[inputSize.length - 1];
            }

            // Object based multi-input
            if (typeof inputSize === 'object' && inputSize !== null && 'width' in inputSize) {
                const w = (inputSize as Record<string, unknown>).width;
                if (typeof w === 'number') return w;
            }

            return 72;
        } catch (error) {
            return 72;
        }
    }

    public async getFrameHeight(): Promise<number> {
        try {
            const config = await this.getConfig();
            const inputSize = config.input_size;

            if (config.modelType === 'BigSmall') return 144;

            if (Array.isArray(inputSize) && inputSize.length >= 2) {
                return inputSize[inputSize.length - 2];
            }

            if (typeof inputSize === 'object' && inputSize !== null && 'height' in inputSize) {
                const h = (inputSize as Record<string, unknown>).height;
                if (typeof h === 'number') return h;
            }

            return 72;
        } catch (error) {
            return 72;
        }
    }

    public async getSequenceLength(): Promise<number> {
        try {
            const config = await this.getConfig();
            if (config.FRAME_NUM) {
                console.log(`[ConfigService] Found sequence length in config: ${config.FRAME_NUM}`);
                return config.FRAME_NUM;
            }

            // Check if input_size specifies a sequence length
            if (config.input_size && Array.isArray(config.input_size) && config.input_size.length >= 5) {
                const sequenceLength = config.input_size[2];
                console.log(`[ConfigService] Found sequence length in input_size: ${sequenceLength}`);
                return sequenceLength;
            }

            console.warn('[ConfigService] Could not find sequence length in config, using default of 181');
            return 181; // Default to 181 frames if not specified
        } catch (error) {
            console.warn('[ConfigService] Error getting sequence length, using default:', error);
            return 181;
        }
    }


    private async loadConfig(customPath?: string): Promise<ModelConfig> {
        try {
            const configPath = customPath || ApplicationPaths.rphysConfig();
            console.log(`[ConfigService] Loading model configuration from ${configPath}`);

            const response = await fetch(configPath, {
                cache: 'default', // Changed from force-cache to allow dynamic updates
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
            }

            const configData = await response.json();

            // Perform additional validation
            if (!configData || typeof configData !== 'object') {
                throw new Error('Config is null or not an object');
            }

            if (!configData.input_size || (typeof configData.input_size !== 'object' && !Array.isArray(configData.input_size))) {
                throw new Error('Config is missing valid input_size');
            }

            const config = configData as ModelConfig;

            // Only update the singleton choice if it's the default or explicitly requested to be main
            if (!customPath) {
                this.config = config;
            }

            this.configLoadAttempted = true;
            return config;
        } catch (error) {
            this.configLoadAttempted = true;
            console.error('[ConfigService] Error loading config:', error);
            throw error;
        }
    }
}

export const configService = ConfigService.getInstance();
export default configService;