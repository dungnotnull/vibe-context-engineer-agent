import type { KnowledgeItem, CompressedMemory, ContextGraph } from '../../core/types.js';
import { CuratedIngestionEngine } from './curated-ingestion.js';
interface ResearchSource {
    url: string;
    title: string;
    category: string;
    content?: string;
}
export declare class KnowledgeBrain {
    private storagePath;
    private items;
    private embeddingEngine;
    private validator;
    private versionManager;
    curatedIngestion: CuratedIngestionEngine;
    constructor(outputDir: string);
    ingestSource(source: ResearchSource): KnowledgeItem;
    ingestFromPipeline(memory: CompressedMemory, graph: ContextGraph): KnowledgeItem[];
    validateAll(): import('../../core/types.js').KnowledgeValidationResult[];
    createVersion(releaseNotes: string, benchmarkScore?: number): import("../../core/types.js").KnowledgeVersion;
    getVersion(versionNumber: number): import("../../core/types.js").KnowledgeVersion | null;
    query(category?: string, minRelevance?: number): KnowledgeItem[];
    search(term: string): KnowledgeItem[];
    semanticSearch(query: string, limit?: number): Array<{
        item: KnowledgeItem;
        score: number;
    }>;
    clusterKnowledge(maxClusters?: number): Map<number, KnowledgeItem[]>;
    getAll(): KnowledgeItem[];
    private extractFindings;
    private informationDensity;
    private computeRelevance;
    private detectPatterns;
    private load;
    private save;
}
export {};
