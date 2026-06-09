import { randomUUID } from 'node:crypto';
import type { ClassifiedChange, CompressedMemory, MemoryFact, MemoryFactType } from '../../core/types.js';
import { HierarchicalSummarizer } from './hierarchical-summarizer.js';
import { MemoryLayerManager } from './memory-layers.js';
import { StaleDetector } from './stale-detector.js';

export class MemoryCompressionEngine {
  private hierarchicalSummarizer: HierarchicalSummarizer;
  private memoryLayers: MemoryLayerManager;
  private staleDetector: StaleDetector;

  constructor(retentionDays = { shortTermDays: 7, workingTermDays: 30, longTermDays: 365 }) {
    this.hierarchicalSummarizer = new HierarchicalSummarizer();
    this.memoryLayers = new MemoryLayerManager(retentionDays);
    this.staleDetector = new StaleDetector();
  }

  compress(changes: ClassifiedChange[]): CompressedMemory {
    const allFacts: MemoryFact[] = [];
    for (const change of changes) allFacts.push(...this.extractFacts(change));

    const deduped = this.deduplicate(allFacts);
    const clustered = this.semanticCluster(deduped);
    const ranked = this.rankByImportance(clustered);
    const hierarchical = this.hierarchicalSummarizer.summarize(changes);

    // Classify into memory layers
    const { layers, staleFacts: layerStale } = this.memoryLayers.classifyAndStore(ranked);

    const originalTokens = this.estimateTokens(changes);
    const compressedTokens = this.estimateTokens(ranked);

    const memory: CompressedMemory = {
      facts: ranked,
      hierarchicalSummary: hierarchical,
      memoryLayers: layers,
      staleFacts: layerStale,
      stats: {
        originalTokens,
        compressedTokens,
        reductionRatio: originalTokens > 0 ? 1 - compressedTokens / originalTokens : 0,
        factsByType: this.countFactsByType(ranked),
        stalenessRatio: layerStale.length / Math.max(ranked.length, 1),
        compressionStrategy: 'hierarchical-semantic-multilayer',
      },
    };

    // Run stale detection for additional analysis
    const stalenessReport = this.staleDetector.analyze(memory);
    memory.staleFacts = [...new Set([...memory.staleFacts, ...stalenessReport.staleFacts])];

    return memory;
  }

  private extractFacts(change: ClassifiedChange): MemoryFact[] {
    const facts: MemoryFact[] = [];
    const ts = change.event.timestamp;
    const source = change.event.diffs[0]?.commit || 'uncommitted';
    const now = new Date().toISOString();

    for (const cat of change.categories) {
      switch (cat) {
        case 'feature':
          facts.push({ id: randomUUID(), type: 'milestone', content: `New feature: ${change.event.summary}`, confidence: 0.9, timestamp: ts, source, tags: ['feature', ...change.affectedComponents], accessCount: 0, lastAccessed: now });
          break;
        case 'bugfix':
          facts.push({ id: randomUUID(), type: 'fact', content: `Bugfix: ${change.event.summary}`, confidence: 0.85, timestamp: ts, source, tags: ['bugfix'], accessCount: 0, lastAccessed: now });
          break;
        case 'refactor':
          facts.push({ id: randomUUID(), type: 'decision', content: `Refactor in ${change.affectedComponents.join(', ')}: ${change.event.summary}`, confidence: 0.8, timestamp: ts, source, tags: ['refactor', ...change.affectedComponents], accessCount: 0, lastAccessed: now });
          break;
        case 'dependency':
          for (const dep of change.affectedDependencies) facts.push({ id: randomUUID(), type: 'fact', content: `Dependency changed: ${dep}`, confidence: 0.95, timestamp: ts, source, tags: ['dependency', dep], accessCount: 0, lastAccessed: now });
          break;
        case 'schema':
          for (const sc of change.schemaChanges) facts.push({ id: randomUUID(), type: 'decision', content: `Schema ${sc.type}: ${sc.entity}${sc.field ? '.' + sc.field : ''} in ${sc.file}`, confidence: 0.9, timestamp: ts, source, tags: ['schema', sc.entity], accessCount: 0, lastAccessed: now });
          break;
        case 'api':
          for (const ac of change.apiChanges) facts.push({ id: randomUUID(), type: 'decision', content: `API ${ac.type}${ac.endpoint ? ' at ' + ac.endpoint : ''} in ${ac.file}`, confidence: 0.9, timestamp: ts, source, tags: ['api', ac.file], accessCount: 0, lastAccessed: now });
          break;
        case 'security':
          facts.push({ id: randomUUID(), type: 'risk', content: `Security-related change: ${change.event.summary}`, confidence: 0.8, timestamp: ts, source, tags: ['security', ...change.affectedComponents], accessCount: 0, lastAccessed: now });
          break;
        case 'performance':
          facts.push({ id: randomUUID(), type: 'metric', content: `Performance change: ${change.event.summary}`, confidence: 0.75, timestamp: ts, source, tags: ['performance'], accessCount: 0, lastAccessed: now });
          break;
        case 'config':
          facts.push({ id: randomUUID(), type: 'fact', content: `Config change: ${change.event.summary}`, confidence: 0.85, timestamp: ts, source, tags: ['config'], accessCount: 0, lastAccessed: now });
          break;
        case 'docs':
          facts.push({ id: randomUUID(), type: 'fact', content: `Documentation updated: ${change.event.summary}`, confidence: 0.8, timestamp: ts, source, tags: ['docs'], accessCount: 0, lastAccessed: now });
          break;
        case 'breaking':
          facts.push({ id: randomUUID(), type: 'lesson', content: `Breaking change in ${change.affectedComponents.join(', ')}: ${change.event.summary}`, confidence: 0.95, timestamp: ts, source, tags: ['breaking', ...change.affectedComponents], accessCount: 0, lastAccessed: now });
          break;
      }
    }

    if (change.isBreaking) {
      facts.push({ id: randomUUID(), type: 'lesson', content: `Breaking change in ${change.affectedComponents.join(', ')}: ${change.event.summary}`, confidence: 0.95, timestamp: ts, source, tags: ['breaking', ...change.affectedComponents], accessCount: 0, lastAccessed: now });
    }

    return facts;
  }

  private deduplicate(facts: MemoryFact[]): MemoryFact[] {
    const seen = new Map<string, MemoryFact>();
    for (const fact of facts) {
      const normalized = fact.content.toLowerCase().trim();
      const existing = seen.get(normalized);
      if (!existing || fact.confidence > existing.confidence) seen.set(normalized, { ...fact, confidence: Math.max(fact.confidence, existing?.confidence || 0) });
    }
    return [...seen.values()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private semanticCluster(facts: MemoryFact[]): MemoryFact[] {
    const clusters = new Map<string, MemoryFact[]>();
    for (const fact of facts) {
      const primaryTag = fact.tags[0] || 'misc';
      if (!clusters.has(primaryTag)) clusters.set(primaryTag, []);
      clusters.get(primaryTag)!.push(fact);
    }
    const merged: MemoryFact[] = [];
    for (const [, clusterFacts] of clusters) {
      if (clusterFacts.length <= 3) merged.push(...clusterFacts);
      else {
        const latest = clusterFacts.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
        merged.push({ ...latest, content: `${clusterFacts.length} related changes in ${latest.tags[0] || 'unknown'}: ${latest.content}`, type: 'fact' });
      }
    }
    return merged;
  }

  private rankByImportance(facts: MemoryFact[]): MemoryFact[] {
    const priority: Record<MemoryFactType, number> = { milestone: 0, decision: 1, lesson: 2, risk: 3, metric: 4, fact: 5 };
    return facts.sort((a, b) => {
      const pd = priority[a.type] - priority[b.type];
      if (pd !== 0) return pd;
      return b.confidence - a.confidence;
    });
  }

  private estimateTokens(data: unknown): number {
    const text = JSON.stringify(data);
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  private countFactsByType(facts: MemoryFact[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const f of facts) counts[f.type] = (counts[f.type] || 0) + 1;
    return counts;
  }
}
