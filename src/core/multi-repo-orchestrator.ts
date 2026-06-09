import * as fs from 'node:fs';
import * as path from 'node:path';
import { Pipeline } from './pipeline.js';
import type { ManagedConfig, MultiRepoConfig, RepoEntry, PipelineResult, TeamMemory } from './types.js';

export class MultiRepoOrchestrator {
  private config: ManagedConfig;
  private results = new Map<string, PipelineResult>();

  constructor(config: ManagedConfig) {
    this.config = config;
  }

  async runAll(): Promise<Map<string, PipelineResult>> {
    const repos = this.config.multiRepo?.repos || [];
    const results = new Map<string, PipelineResult>();

    for (const repo of repos) {
      const repoConfig: ManagedConfig = {
        ...this.config,
        repoPath: path.resolve(repo.path),
        outputDir: path.join(this.config.outputDir, 'repos', repo.name),
      };

      const pipeline = new Pipeline(repoConfig);
      const result = await pipeline.run();
      results.set(repo.name, result);
    }

    this.results = results;
    return results;
  }

  async runOne(repoName: string): Promise<PipelineResult | null> {
    const repos = this.config.multiRepo?.repos || [];
    const repo = repos.find((r) => r.name === repoName);
    if (!repo) return null;

    const repoConfig: ManagedConfig = {
      ...this.config,
      repoPath: path.resolve(repo.path),
      outputDir: path.join(this.config.outputDir, 'repos', repo.name),
    };

    const pipeline = new Pipeline(repoConfig);
    const result = await pipeline.run();
    this.results.set(repoName, result);
    return result;
  }

  getRepoList(): RepoEntry[] {
    return this.config.multiRepo?.repos || [];
  }

  getResult(repoName: string): PipelineResult | undefined {
    return this.results.get(repoName);
  }

  aggregateKnowledge(): {
    totalFacts: number;
    totalNodes: number;
    totalRelations: number;
    byRepo: Record<string, { facts: number; nodes: number; relations: number }>;
  } {
    const byRepo: Record<string, { facts: number; nodes: number; relations: number }> = {};
    let totalFacts = 0;
    let totalNodes = 0;
    let totalRelations = 0;

    for (const [name, result] of this.results) {
      const facts = result.compression.facts.length;
      const nodes = result.graph.nodes.length;
      const relations = result.graph.relations.length;
      byRepo[name] = { facts, nodes, relations };
      totalFacts += facts;
      totalNodes += nodes;
      totalRelations += relations;
    }

    return { totalFacts, totalNodes, totalRelations, byRepo };
  }

  writeAggregateReport(): string {
    const agg = this.aggregateKnowledge();
    const report = [
      '# Multi-Repository Analysis',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `## Summary`,
      '',
      `- Total Repos: ${this.results.size}`,
      `- Total Facts: ${agg.totalFacts}`,
      `- Total Graph Nodes: ${agg.totalNodes}`,
      `- Total Graph Relations: ${agg.totalRelations}`,
      '',
      '## Per Repository',
      '',
    ];

    for (const [name, stats] of Object.entries(agg.byRepo)) {
      report.push(`### ${name}`);
      report.push(`- Facts: ${stats.facts}`);
      report.push(`- Graph Nodes: ${stats.nodes}`);
      report.push(`- Graph Relations: ${stats.relations}`);
      report.push('');
    }

    const reportPath = path.join(this.config.outputDir, 'MULTI-REPO-REPORT.md');
    fs.writeFileSync(reportPath, report.join('\n'));
    return reportPath;
  }
}
