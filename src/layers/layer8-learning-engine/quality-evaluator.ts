import { randomUUID } from 'node:crypto';
import type { QualityEvaluation, CompressedMemory, FeedbackSignal } from '../../core/types.js';

export class QualityEvaluator {
  evaluate(contextId: string, memory: CompressedMemory, feedback?: FeedbackSignal[]): QualityEvaluation {
    const dimensions = {
      relevance: this.scoreRelevance(memory),
      completeness: this.scoreCompleteness(memory),
      conciseness: this.scoreConciseness(memory),
      accuracy: this.scoreAccuracy(memory, feedback),
      freshness: this.scoreFreshness(memory),
    };

    const overallScore =
      dimensions.relevance * 0.30 +
      dimensions.completeness * 0.25 +
      dimensions.conciseness * 0.20 +
      dimensions.accuracy * 0.15 +
      dimensions.freshness * 0.10;

    const suggestions = this.generateSuggestions(dimensions, memory);

    return {
      contextId,
      dimensions,
      overallScore,
      improvementSuggestions: suggestions,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private scoreRelevance(memory: CompressedMemory): number {
    if (memory.facts.length === 0) return 0;

    const relevantTags = [
      'feature', 'bugfix', 'breaking', 'api', 'schema', 'architecture',
      'dependency', 'security', 'performance', 'decision',
    ];

    const relevantFacts = memory.facts.filter((f) =>
      f.tags.some((t) => relevantTags.includes(t))
    );

    const ratio = relevantFacts.length / memory.facts.length;
    const avgConfidence = memory.facts.reduce((s, f) => s + f.confidence, 0) / memory.facts.length;

    return Math.min(1, ratio * 0.6 + avgConfidence * 0.4);
  }

  private scoreCompleteness(memory: CompressedMemory): number {
    if (memory.facts.length === 0) return 0;

    const types = new Set(memory.facts.map((f) => f.type));
    const expectedTypes = ['fact', 'decision', 'milestone', 'lesson', 'metric', 'risk'];
    const typeCoverage = expectedTypes.filter((t) => types.has(t as never)).length / expectedTypes.length;

    const hasHierarchical = memory.hierarchicalSummary !== null;
    const hasLayerInfo = memory.memoryLayers.length > 0;

    let score = typeCoverage * 0.5;
    if (hasHierarchical) score += 0.25;
    if (hasLayerInfo) score += 0.25;

    return Math.min(1, score);
  }

  private scoreConciseness(memory: CompressedMemory): number {
    const stats = memory.stats;
    if (stats.originalTokens === 0) return 1;

    const reductionRatio = stats.reductionRatio;
    const optimalRatio = 0.85;

    const concisenessScore = Math.min(1, reductionRatio / optimalRatio);
    const notOverCompressed = memory.facts.every((f) => f.confidence > 0.3);

    return concisenessScore * 0.7 + (notOverCompressed ? 0.3 : 0);
  }

  private scoreAccuracy(memory: CompressedMemory, feedback?: FeedbackSignal[]): number {
    if (!feedback || feedback.length === 0) return 0.75;

    const relevantFeedback = feedback.filter(
      (f) => f.type === 'relevance' || f.type === 'completeness'
    );

    if (relevantFeedback.length === 0) return 0.75;

    const avgFeedback = relevantFeedback.reduce((s, f) => s + f.score, 0) / relevantFeedback.length;
    return Math.min(1, avgFeedback);
  }

  private scoreFreshness(memory: CompressedMemory): number {
    if (memory.facts.length === 0) return 0;

    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    const ages = memory.facts.map((f) => {
      const age = now - new Date(f.timestamp).getTime();
      return Math.max(0, 1 - age / maxAge);
    });

    return ages.reduce((s, a) => s + a, 0) / ages.length;
  }

  private generateSuggestions(
    dimensions: QualityEvaluation['dimensions'],
    memory: CompressedMemory
  ): string[] {
    const suggestions: string[] = [];

    if (dimensions.relevance < 0.6) {
      suggestions.push('Low relevance: filter facts more aggressively by importance tags');
    }
    if (dimensions.completeness < 0.6) {
      suggestions.push('Low completeness: ensure all fact types (decisions, milestones, risks) are captured');
    }
    if (dimensions.conciseness < 0.5) {
      suggestions.push('Low conciseness: compression ratio can be improved with stronger deduplication');
    }
    if (dimensions.accuracy < 0.6) {
      suggestions.push('Low accuracy: fact confidence is low or feedback signals indicate issues');
    }
    if (dimensions.freshness < 0.5) {
      suggestions.push('Stale memory: many facts are outdated, consider forced cleanup');
    }
    if (memory.staleFacts.length > memory.facts.length * 0.3) {
      suggestions.push(`High staleness: ${memory.staleFacts.length} stale facts — run cleanup`);
    }
    if (suggestions.length === 0) {
      suggestions.push('Quality is good — no critical improvements needed');
    }

    return suggestions;
  }
}
