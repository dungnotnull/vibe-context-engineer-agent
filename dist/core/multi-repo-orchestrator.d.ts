import type { ManagedConfig, RepoEntry, PipelineResult } from './types.js';
export declare class MultiRepoOrchestrator {
    private config;
    private results;
    constructor(config: ManagedConfig);
    runAll(): Promise<Map<string, PipelineResult>>;
    runOne(repoName: string): Promise<PipelineResult | null>;
    getRepoList(): RepoEntry[];
    getResult(repoName: string): PipelineResult | undefined;
    aggregateKnowledge(): {
        totalFacts: number;
        totalNodes: number;
        totalRelations: number;
        byRepo: Record<string, {
            facts: number;
            nodes: number;
            relations: number;
        }>;
    };
    writeAggregateReport(): string;
}
