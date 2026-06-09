import type { KnowledgeItem, CompressionBenchmark, QualityEvaluation } from './types.js';
interface PaperMetadata {
    title: string;
    authors: string[];
    year: number;
    venue: string;
    url: string;
    abstract: string;
    keywords: string[];
    citations: number;
}
interface MemorySystemReview {
    systemName: string;
    category: 'working' | 'episodic' | 'semantic' | 'long-term' | 'hybrid';
    architecture: string;
    strengths: string[];
    weaknesses: string[];
    contextReductionRatio: number;
    suitabilityScore: number;
}
interface AgentArchitectureStudy {
    agentName: string;
    contextStrategy: string;
    maxContextSize: number;
    memoryRetention: string;
    compressionApproach: string;
    benchmarkScores: Record<string, number>;
}
export declare class ResearchEngine {
    private outputDir;
    private papers;
    private memoryReviews;
    private agentStudies;
    constructor(outputDir: string);
    ingestPaper(paper: PaperMetadata): KnowledgeItem;
    reviewMemorySystem(system: MemorySystemReview): KnowledgeItem;
    studyAgentArchitecture(study: AgentArchitectureStudy): KnowledgeItem;
    runContextEngineeringBenchmark(inputSizes: number[]): CompressionBenchmark[];
    evaluateCompressionQuality(original: string, compressed: string, referenceFacts: string[]): QualityEvaluation;
    generateMemorySystemsReport(): string;
    generateAgentArchitectureReport(): string;
    private classifyPaperCategory;
    private computePaperRelevance;
    private saveBenchmarks;
    getBenchmarks(): CompressionBenchmark[];
    saveReports(): void;
}
export {};
