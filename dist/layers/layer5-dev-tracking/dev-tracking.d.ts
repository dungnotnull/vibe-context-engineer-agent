import type { CompressedMemory, ContextGraph, DevelopmentTrack } from '../../core/types.js';
export declare class DevelopmentTrackingEngine {
    private outputDir;
    private sprintNumber;
    constructor(outputDir: string);
    generate(memory: CompressedMemory, graph: ContextGraph): DevelopmentTrack;
    private buildTrack;
    private writeTrackingDocs;
    private writeSprintDoc;
    private loadSprintNumber;
    private saveSprintNumber;
    advanceSprint(): void;
}
