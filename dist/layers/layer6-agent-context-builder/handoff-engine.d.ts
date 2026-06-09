import type { HandoffPackage, DevelopmentTrack, CompressedMemory, ContextGraph } from '../../core/types.js';
export declare class HandoffEngine {
    private outputDir;
    constructor(outputDir: string);
    generate(fromAgent: string, toAgent: string, track: DevelopmentTrack, memory: CompressedMemory, graph: ContextGraph): HandoffPackage;
    private buildSummary;
    private buildCurrentState;
    private buildNextSteps;
    write(handoff: HandoffPackage): string;
}
