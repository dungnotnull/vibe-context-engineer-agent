import type { ManagedConfig } from './types.js';
export declare class ConfigManager {
    static load(repoPath: string, outputDir?: string): ManagedConfig;
    static save(config: ManagedConfig): void;
    static createDefaultConfig(repoPath: string, outputDir: string): ManagedConfig;
    static validate(config: Partial<ManagedConfig>): string[];
    private static mergeDefaults;
}
