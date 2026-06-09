import type { MemoryFact, MemoryLayer } from '../../core/types.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class MemoryLayerManager {
  private layers: Map<string, MemoryLayer> = new Map();

  constructor(private config: { shortTermDays: number; workingTermDays: number; longTermDays: number }) {
    this.layers.set('short-term', {
      type: 'short-term',
      facts: [],
      ttlMs: config.shortTermDays * MS_PER_DAY,
      maxSize: 200,
      lastCleaned: new Date().toISOString(),
    });
    this.layers.set('working', {
      type: 'working',
      facts: [],
      ttlMs: config.workingTermDays * MS_PER_DAY,
      maxSize: 500,
      lastCleaned: new Date().toISOString(),
    });
    this.layers.set('long-term', {
      type: 'long-term',
      facts: [],
      ttlMs: config.longTermDays * MS_PER_DAY,
      maxSize: 2000,
      lastCleaned: new Date().toISOString(),
    });
  }

  classifyAndStore(facts: MemoryFact[]): { layers: MemoryLayer[]; staleFacts: MemoryFact[] } {
    const now = Date.now();
    const staleFacts: MemoryFact[] = [];

    for (const fact of facts) {
      const layer = this.determineLayer(fact);
      const target = this.layers.get(layer)!;

      if (target.facts.length >= target.maxSize) {
        const oldest = target.facts.reduce((a, b) =>
          new Date(a.timestamp) < new Date(b.timestamp) ? a : b
        );
        if (this.isExpired(oldest, now)) {
          target.facts = target.facts.filter((f) => f.id !== oldest.id);
        } else {
          staleFacts.push(fact);
          continue;
        }
      }

      target.facts.push({
        ...fact,
        accessCount: (fact.accessCount || 0) + 1,
        lastAccessed: new Date().toISOString(),
      });
    }

    // Cleanup expired facts
    for (const layer of this.layers.values()) {
      layer.facts = layer.facts.filter((f) => !this.isExpired(f, now));
      layer.lastCleaned = new Date().toISOString();
    }

    return {
      layers: [...this.layers.values()],
      staleFacts,
    };
  }

  promoteFact(fact: MemoryFact): void {
    // Promote based on access patterns
    const allFacts = [...this.layers.values()].flatMap((l) => l.facts);
    const existing = allFacts.find((f) => f.id === fact.id);

    if (existing) {
      existing.accessCount = (existing.accessCount || 0) + 1;
      existing.lastAccessed = new Date().toISOString();

      if (existing.accessCount > 10) {
        this.moveToLayer(existing, 'long-term');
      } else if (existing.accessCount > 5) {
        this.moveToLayer(existing, 'working');
      }
    }
  }

  detectStaleFacts(): MemoryFact[] {
    const now = Date.now();
    const stale: MemoryFact[] = [];

    for (const layer of this.layers.values()) {
      for (const fact of layer.facts) {
        if (this.isExpired(fact, now)) {
          stale.push(fact);
        }
      }
    }

    return stale;
  }

  getLayer(type: string): MemoryLayer | undefined {
    return this.layers.get(type);
  }

  getAllLayers(): MemoryLayer[] {
    return [...this.layers.values()];
  }

  getAllFacts(): MemoryFact[] {
    return [...this.layers.values()].flatMap((l) => l.facts);
  }

  private determineLayer(fact: MemoryFact): string {
    const age = Date.now() - new Date(fact.timestamp).getTime();
    const shortTermMs = this.config.shortTermDays * MS_PER_DAY;
    const workingTermMs = this.config.workingTermDays * MS_PER_DAY;

    if (fact.type === 'milestone' || fact.type === 'decision') {
      return 'long-term';
    }
    if (fact.type === 'lesson' || fact.type === 'risk') {
      return 'working';
    }
    if (age < shortTermMs) {
      return 'short-term';
    }
    if (age < workingTermMs) {
      return 'working';
    }
    return 'long-term';
  }

  private isExpired(fact: MemoryFact, now: number): boolean {
    const ttl = fact.ttl || this.config.shortTermDays * MS_PER_DAY;
    const age = now - new Date(fact.timestamp).getTime();
    return age > ttl;
  }

  private moveToLayer(fact: MemoryFact, targetType: string): void {
    for (const layer of this.layers.values()) {
      layer.facts = layer.facts.filter((f) => f.id !== fact.id);
    }
    const target = this.layers.get(targetType);
    if (target && target.facts.length < target.maxSize) {
      target.facts.push(fact);
    }
  }
}
