import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FeedbackSignal } from '../../core/types.js';

export class FeedbackCollector {
  private feedbackPath: string;
  private signals: FeedbackSignal[] = [];

  constructor(outputDir: string) {
    this.feedbackPath = path.join(outputDir, 'feedback.json');
    fs.mkdirSync(outputDir, { recursive: true });
    this.load();
  }

  record(signal: Omit<FeedbackSignal, 'id' | 'timestamp'>): FeedbackSignal {
    const entry: FeedbackSignal = {
      id: randomUUID(),
      ...signal,
      timestamp: new Date().toISOString(),
    };
    this.signals.push(entry);
    this.save();
    return entry;
  }

  query(filters: { source?: string; type?: string; minScore?: number; since?: string }): FeedbackSignal[] {
    let results = this.signals;

    if (filters.source) {
      results = results.filter((s) => s.source === filters.source);
    }
    if (filters.type) {
      results = results.filter((s) => s.type === filters.type);
    }
    if (filters.minScore !== undefined) {
      const minScore = filters.minScore;
      results = results.filter((s) => s.score >= minScore);
    }
    if (filters.since) {
      const sinceDate = new Date(filters.since).getTime();
      results = results.filter((s) => new Date(s.timestamp).getTime() >= sinceDate);
    }

    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getStats(): {
    total: number;
    averageScore: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    trend: 'improving' | 'declining' | 'stable';
  } {
    if (this.signals.length === 0) {
      return { total: 0, averageScore: 0, bySource: {}, byType: {}, trend: 'stable' };
    }

    const averageScore = this.signals.reduce((s, sig) => s + sig.score, 0) / this.signals.length;

    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const sig of this.signals) {
      bySource[sig.source] = (bySource[sig.source] || 0) + 1;
      byType[sig.type] = (byType[sig.type] || 0) + 1;
    }

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (this.signals.length >= 4) {
      const recent = this.signals.slice(0, Math.floor(this.signals.length / 2));
      const older = this.signals.slice(Math.floor(this.signals.length / 2));
      const recentAvg = recent.reduce((s, sig) => s + sig.score, 0) / recent.length;
      const olderAvg = older.reduce((s, sig) => s + sig.score, 0) / older.length;
      if (recentAvg > olderAvg + 0.1) trend = 'improving';
      else if (recentAvg < olderAvg - 0.1) trend = 'declining';
    }

    return { total: this.signals.length, averageScore, bySource, byType, trend };
  }

  private load(): void {
    try {
      if (fs.existsSync(this.feedbackPath)) {
        this.signals = JSON.parse(fs.readFileSync(this.feedbackPath, 'utf-8'));
      }
    } catch {
      this.signals = [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.feedbackPath, JSON.stringify(this.signals, null, 2));
  }
}
