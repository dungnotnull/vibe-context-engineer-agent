import type { MemoryFact, CompressedMemory } from '../../core/types.js';
interface StalenessReport {
    staleFacts: MemoryFact[];
    stalenessRatio: number;
    oldestFactAge: number;
    recommendations: string[];
}
export declare class StaleDetector {
    analyze(memory: CompressedMemory): StalenessReport;
    private checkStaleness;
    private generateRecommendations;
}
export {};
