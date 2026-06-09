import type { ABTestResult } from '../../core/types.js';
export declare class ABTestEngine {
    private activeTests;
    private results;
    createTest(strategyA: string, strategyB: string): string;
    recordTrial(testId: string, variant: 'A' | 'B', qualityScore: number, reductionRatio: number): void;
    concludeTest(testId: string): ABTestResult | null;
    getAllResults(): ABTestResult[];
    getActiveTest(testId: string): ABTestConfig | undefined;
    private avg;
}
interface ABTestConfig {
    strategyA: string;
    strategyB: string;
    resultsA: Array<{
        qualityScore: number;
        reductionRatio: number;
    }>;
    resultsB: Array<{
        qualityScore: number;
        reductionRatio: number;
    }>;
}
export {};
