import type { ClassifiedChange, CompressedMemory, ContextGraph, VceaConfig } from '../../core/types.js';
import { GraphQueryEngine } from './graph-query-engine.js';
import { ImpactAnalyzer } from './impact-analyzer.js';
export declare class ContextGraphEngine {
    private config;
    private storagePath;
    private queryEngine;
    private impactAnalyzer;
    private neo4j;
    constructor(config: VceaConfig);
    build(changes: ClassifiedChange[], memory: CompressedMemory): ContextGraph;
    query(query: Parameters<GraphQueryEngine['query']>[1]): ReturnType<GraphQueryEngine['query']>;
    analyzeImpact(nodeId: string): ReturnType<ImpactAnalyzer['analyze']>;
    assessRisk(changedNodeIds: string[]): ReturnType<ImpactAnalyzer['calculateChangeRisk']>;
    findCircularDeps(): ReturnType<GraphQueryEngine['findCircularDependencies']>;
    getCentrality(): ReturnType<GraphQueryEngine['getCentrality']>;
    private extractNodes;
    private extractRelations;
    private mergeNodes;
    private mergeRelations;
    load(): ContextGraph;
    private save;
}
