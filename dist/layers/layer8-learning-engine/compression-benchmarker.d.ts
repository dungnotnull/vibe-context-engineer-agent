import type { CompressionBenchmark } from '../../core/types.js';
export declare class CompressionBenchmarker {
    private resultsPath;
    private results;
    constructor(outputDir: string);
    runBenchmark(strategy: string, inputSize: number, outputSize: number, qualityScore: number, latencyMs: number, settings: Record<string, unknown>): CompressionBenchmark;
    compareStrategies(benchmarks: CompressionBenchmark[]): Record<string, {
        avgReduction: number;
        avgQuality: number;
        avgLatency: number;
        count: number;
    }>;
    findOptimalStrategy(benchmarks: CompressionBenchmark[], weights?: {
        reduction: number;
        quality: number;
        latency: number;
    }): {
        strategy: string;
        score: number;
    };
    getAllResults(): CompressionBenchmark[];
    private load;
    private save;
}
