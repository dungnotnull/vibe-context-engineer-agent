import type { ContextGraph, ImpactAnalysis } from '../../core/types.js';
export declare class ImpactAnalyzer {
    analyze(graph: ContextGraph, sourceNodeId: string): ImpactAnalysis;
    calculateChangeRisk(graph: ContextGraph, changedNodeIds: string[]): {
        riskScore: number;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        highRiskNodes: string[];
    };
}
