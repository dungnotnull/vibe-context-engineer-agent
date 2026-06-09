import type { ClassifiedChange, CompressedMemory } from '../../core/types.js';
export declare class MemoryCompressionEngine {
    private hierarchicalSummarizer;
    private memoryLayers;
    private staleDetector;
    constructor(retentionDays?: {
        shortTermDays: number;
        workingTermDays: number;
        longTermDays: number;
    });
    compress(changes: ClassifiedChange[]): CompressedMemory;
    private extractFacts;
    private deduplicate;
    private semanticCluster;
    private rankByImportance;
    private estimateTokens;
    private countFactsByType;
}
