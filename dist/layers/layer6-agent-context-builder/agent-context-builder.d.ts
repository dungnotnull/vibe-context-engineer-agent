import type { CompressedMemory, ContextGraph, DevelopmentTrack, AgentContextPackage, VceaConfig } from '../../core/types.js';
import { ContextDiffEngine } from './context-diff-engine.js';
export declare class AgentContextBuilder {
    private outputDir;
    private config;
    private handoffEngine;
    contextDiffEngine: ContextDiffEngine;
    constructor(config: VceaConfig);
    build(memory: CompressedMemory, graph: ContextGraph, track: DevelopmentTrack): AgentContextPackage[];
    buildHandoff(from: string, to: string, memory: CompressedMemory, graph: ContextGraph, track: DevelopmentTrack): import("../../core/types.js").HandoffPackage;
    writeHandoff(from: string, to: string, memory: CompressedMemory, graph: ContextGraph, track: DevelopmentTrack): string;
    computeDiff(cacheKey: string, state: {
        memory: CompressedMemory;
        graph: ContextGraph;
        track: DevelopmentTrack;
    }): import("../../core/types.js").ContextDiff | null;
    private buildForAgent;
    private buildMarkdown;
    private buildJson;
    private buildYaml;
    private trimToTokens;
    private writePackage;
}
