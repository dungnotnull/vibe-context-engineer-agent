import type { KnowledgeItem } from '../../core/types.js';
export declare class EmbeddingEngine {
    private dimensions;
    private readonly STOP_WORDS;
    constructor(dimensions?: number);
    embed(item: KnowledgeItem): number[];
    embedBatch(items: KnowledgeItem[]): Map<string, number[]>;
    similarity(a: number[], b: number[]): number;
    findSimilar(query: KnowledgeItem, candidates: KnowledgeItem[], threshold?: number, limit?: number): Array<{
        item: KnowledgeItem;
        score: number;
    }>;
    cluster(items: KnowledgeItem[], maxClusters?: number): Map<number, KnowledgeItem[]>;
    private tokenize;
    private hashString;
    private nextSeed;
    getDimensions(): number;
}
