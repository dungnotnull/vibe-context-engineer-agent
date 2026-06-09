import type { MemoryFact, MemoryLayer } from '../../core/types.js';
export declare class MemoryLayerManager {
    private config;
    private layers;
    constructor(config: {
        shortTermDays: number;
        workingTermDays: number;
        longTermDays: number;
    });
    classifyAndStore(facts: MemoryFact[]): {
        layers: MemoryLayer[];
        staleFacts: MemoryFact[];
    };
    promoteFact(fact: MemoryFact): void;
    detectStaleFacts(): MemoryFact[];
    getLayer(type: string): MemoryLayer | undefined;
    getAllLayers(): MemoryLayer[];
    getAllFacts(): MemoryFact[];
    private determineLayer;
    private isExpired;
    private moveToLayer;
}
