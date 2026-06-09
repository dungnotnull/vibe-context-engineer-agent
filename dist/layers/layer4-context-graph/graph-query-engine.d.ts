import type { ContextGraph, GraphNode, GraphQuery, GraphQueryResult, GraphPath } from '../../core/types.js';
export declare class GraphQueryEngine {
    query(graph: ContextGraph, query: GraphQuery): GraphQueryResult;
    traverse(graph: ContextGraph, startNodeIds: string[], maxDepth: number): GraphPath[];
    private _dfs;
    findDependencies(graph: ContextGraph, nodeId: string, depth?: number): GraphNode[];
    findDependents(graph: ContextGraph, nodeId: string, depth?: number): GraphNode[];
    findCircularDependencies(graph: ContextGraph): GraphPath[];
    getCentrality(graph: ContextGraph): Map<string, number>;
}
