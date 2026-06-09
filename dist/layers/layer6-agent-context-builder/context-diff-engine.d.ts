import type { CompressedMemory, ContextGraph, DevelopmentTrack, ContextDiff } from '../../core/types.js';
export declare class ContextDiffEngine {
    private cache;
    diff(cacheKey: string, current: {
        memory: CompressedMemory;
        graph: ContextGraph;
        track: DevelopmentTrack;
    }): ContextDiff | null;
    private hashString;
    getCacheInfo(): {
        keys: string[];
        size: number;
    };
}
