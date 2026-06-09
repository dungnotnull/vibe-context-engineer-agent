import type { Plugin, PluginHook } from './types.js';
interface PluginContext {
    emit(event: string, data: unknown): void;
    getConfig(): Record<string, unknown>;
}
type PluginHandler = (data: unknown, context: PluginContext) => unknown;
export declare class PluginSystem {
    private plugins;
    private handlers;
    private eventLog;
    register(plugin: Plugin, handler?: PluginHandler): void;
    unregister(pluginId: string): void;
    subscribe(pluginId: string, hook: PluginHook, handler: PluginHandler): void;
    emit(event: string, data: unknown): unknown[];
    getEventLog(): Array<{
        event: string;
        timestamp: string;
        data: unknown;
    }>;
    getPlugin(pluginId: string): Plugin | undefined;
    getAllPlugins(): Plugin[];
    enablePlugin(pluginId: string): boolean;
    disablePlugin(pluginId: string): boolean;
    saveState(outputDir: string): void;
    loadState(outputDir: string): void;
}
export {};
