import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CompressionBenchmark } from '../../core/types.js';

export class CompressionBenchmarker {
  private resultsPath: string;
  private results: CompressionBenchmark[] = [];

  constructor(outputDir: string) {
    this.resultsPath = path.join(outputDir, 'compression-benchmarks.json');
    fs.mkdirSync(outputDir, { recursive: true });
    this.load();
  }

  runBenchmark(
    strategy: string,
    inputSize: number,
    outputSize: number,
    qualityScore: number,
    latencyMs: number,
    settings: Record<string, unknown>
  ): CompressionBenchmark {
    const reductionRatio = inputSize > 0 ? 1 - outputSize / inputSize : 0;

    const benchmark: CompressionBenchmark = {
      id: randomUUID(),
      strategy,
      inputSize,
      outputSize,
      reductionRatio,
      qualityScore,
      latencyMs,
      settings,
      timestamp: new Date().toISOString(),
    };

    this.results.push(benchmark);
    this.save();
    return benchmark;
  }

  compareStrategies(
    benchmarks: CompressionBenchmark[]
  ): Record<string, { avgReduction: number; avgQuality: number; avgLatency: number; count: number }> {
    const grouped = new Map<string, CompressionBenchmark[]>();

    for (const b of benchmarks) {
      if (!grouped.has(b.strategy)) grouped.set(b.strategy, []);
      grouped.get(b.strategy)!.push(b);
    }

    const comparison: Record<string, { avgReduction: number; avgQuality: number; avgLatency: number; count: number }> = {};

    for (const [strategy, group] of grouped) {
      comparison[strategy] = {
        avgReduction: group.reduce((s, b) => s + b.reductionRatio, 0) / group.length,
        avgQuality: group.reduce((s, b) => s + b.qualityScore, 0) / group.length,
        avgLatency: group.reduce((s, b) => s + b.latencyMs, 0) / group.length,
        count: group.length,
      };
    }

    return comparison;
  }

  findOptimalStrategy(
    benchmarks: CompressionBenchmark[],
    weights = { reduction: 0.4, quality: 0.4, latency: 0.2 }
  ): { strategy: string; score: number } {
    const comparison = this.compareStrategies(benchmarks);
    let bestStrategy = '';
    let bestScore = -1;

    for (const [strategy, stats] of Object.entries(comparison)) {
      const normalizedReduction = stats.avgReduction;
      const normalizedQuality = stats.avgQuality;
      const normalizedLatency = 1 - Math.min(stats.avgLatency / 1000, 1);

      const score =
        normalizedReduction * weights.reduction +
        normalizedQuality * weights.quality +
        normalizedLatency * weights.latency;

      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }

    return { strategy: bestStrategy, score: bestScore };
  }

  getAllResults(): CompressionBenchmark[] {
    return [...this.results].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private load(): void {
    try {
      if (fs.existsSync(this.resultsPath)) {
        this.results = JSON.parse(fs.readFileSync(this.resultsPath, 'utf-8'));
      }
    } catch {
      this.results = [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.resultsPath, JSON.stringify(this.results, null, 2));
  }
}
