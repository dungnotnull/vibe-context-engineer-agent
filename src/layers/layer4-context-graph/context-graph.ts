import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ClassifiedChange, CompressedMemory, ContextGraph, GraphNode, GraphRelation, VceaConfig } from '../../core/types.js';
import { GraphQueryEngine } from './graph-query-engine.js';
import { ImpactAnalyzer } from './impact-analyzer.js';
import { Neo4jConnector } from './connectors/neo4j-connector.js';

export class ContextGraphEngine {
  private config: VceaConfig;
  private storagePath: string;
  private queryEngine: GraphQueryEngine;
  private impactAnalyzer: ImpactAnalyzer;
  private neo4j: Neo4jConnector | null = null;

  constructor(config: VceaConfig) {
    this.config = config;
    this.storagePath = path.join(config.outputDir, 'context-graph.json');
    this.queryEngine = new GraphQueryEngine();
    this.impactAnalyzer = new ImpactAnalyzer();
    if (config.graphStorage === 'neo4j' && config.neo4jUri) {
      this.neo4j = new Neo4jConnector(config.neo4jUri, config.neo4jUser || 'neo4j', config.neo4jPassword || 'password');
    }
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  build(changes: ClassifiedChange[], memory: CompressedMemory): ContextGraph {
    const existing = this.load();
    const nodes = this.extractNodes(changes, memory, existing);
    const relations = this.extractRelations(changes, nodes, existing);
    const now = new Date().toISOString();

    const graph: ContextGraph = {
      nodes: this.mergeNodes(existing.nodes, nodes),
      relations: this.mergeRelations(existing.relations, relations),
      lastUpdated: now,
      version: (existing.version || 0) + 1,
    };

    this.save(graph);
    if (this.neo4j) {
      this.neo4j.pushGraph(graph).catch(() => {});
    }

    return graph;
  }

  query(query: Parameters<GraphQueryEngine['query']>[1]): ReturnType<GraphQueryEngine['query']> {
    const graph = this.load();
    return this.queryEngine.query(graph, query);
  }

  analyzeImpact(nodeId: string): ReturnType<ImpactAnalyzer['analyze']> {
    const graph = this.load();
    return this.impactAnalyzer.analyze(graph, nodeId);
  }

  assessRisk(changedNodeIds: string[]): ReturnType<ImpactAnalyzer['calculateChangeRisk']> {
    const graph = this.load();
    return this.impactAnalyzer.calculateChangeRisk(graph, changedNodeIds);
  }

  findCircularDeps(): ReturnType<GraphQueryEngine['findCircularDependencies']> {
    const graph = this.load();
    return this.queryEngine.findCircularDependencies(graph);
  }

  getCentrality(): ReturnType<GraphQueryEngine['getCentrality']> {
    const graph = this.load();
    return this.queryEngine.getCentrality(graph);
  }

  private extractNodes(changes: ClassifiedChange[], memory: CompressedMemory, existing: ContextGraph): GraphNode[] {
    const nodes: GraphNode[] = [...existing.nodes];
    const nodeIds = new Set(nodes.map((n) => n.id));
    const now = new Date().toISOString();

    for (const change of changes) {
      for (const component of change.affectedComponents) {
        const id = `component:${component}`;
        if (!nodeIds.has(id)) {
          nodeIds.add(id);
          nodes.push({ id, type: 'component', label: component, metadata: { complexity: change.complexity, lastChanged: change.event.timestamp }, createdAt: now, updatedAt: now, version: 1 });
        } else {
          const ex = nodes.find((n) => n.id === id);
          if (ex) { ex.metadata.lastChanged = change.event.timestamp; ex.updatedAt = now; ex.version++; }
        }
      }
      for (const dep of change.affectedDependencies) {
        const id = `dependency:${dep}`;
        if (!nodeIds.has(id)) {
          nodeIds.add(id);
          nodes.push({ id, type: 'dependency', label: dep, metadata: { lastChanged: change.event.timestamp }, createdAt: now, updatedAt: now, version: 1 });
        }
      }
    }

    for (const fact of memory.facts) {
      if (fact.type === 'milestone' || fact.type === 'decision') {
        const id = `${fact.type}:${fact.id}`;
        if (!nodeIds.has(id)) {
          nodeIds.add(id);
          nodes.push({ id, type: fact.type === 'milestone' ? 'feature' : 'decision', label: fact.content.slice(0, 80), metadata: { confidence: fact.confidence, timestamp: fact.timestamp, tags: fact.tags }, createdAt: now, updatedAt: now, version: 1 });
        }
      }
    }

    return nodes;
  }

  private extractRelations(changes: ClassifiedChange[], nodes: GraphNode[], existing: ContextGraph): GraphRelation[] {
    const relations: GraphRelation[] = [...existing.relations];
    const relationKeys = new Set(relations.map((r) => `${r.source}->${r.type}->${r.target}`));

    for (const change of changes) {
      for (const component of change.affectedComponents) {
        const sourceId = `component:${component}`;
        for (const dep of change.affectedDependencies) {
          const depId = `dependency:${dep}`;
          const key = `${sourceId}->depends_on->${depId}`;
          if (!relationKeys.has(key)) { relationKeys.add(key); relations.push({ source: sourceId, target: depId, type: 'depends_on', weight: 1 }); }
        }
        const relatedNodes = nodes.filter((n) => (n.type === 'feature' || n.type === 'decision') && change.event.timestamp === n.metadata.timestamp);
        for (const rn of relatedNodes) {
          const key = `${rn.id}->introduces->${sourceId}`;
          if (!relationKeys.has(key)) { relationKeys.add(key); relations.push({ source: rn.id, target: sourceId, type: 'introduces', weight: 1 }); }
        }
      }
    }

    return relations;
  }

  private mergeNodes(existing: GraphNode[], incoming: GraphNode[]): GraphNode[] {
    const map = new Map<string, GraphNode>();
    for (const n of existing) map.set(n.id, n);
    for (const n of incoming) {
      const curr = map.get(n.id);
      if (curr) map.set(n.id, { ...curr, metadata: { ...curr.metadata, ...n.metadata }, updatedAt: n.updatedAt, version: (curr.version || 0) + 1 });
      else map.set(n.id, n);
    }
    return [...map.values()];
  }

  private mergeRelations(existing: GraphRelation[], incoming: GraphRelation[]): GraphRelation[] {
    const seen = new Set(existing.map((r) => `${r.source}->${r.type}->${r.target}`));
    const merged = [...existing];
    for (const r of incoming) {
      const key = `${r.source}->${r.type}->${r.target}`;
      if (!seen.has(key)) { seen.add(key); merged.push(r); }
    }
    return merged;
  }

  load(): ContextGraph {
    try {
      if (fs.existsSync(this.storagePath)) return JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
    } catch {}
    return { nodes: [], relations: [], lastUpdated: '', version: 0 };
  }

  private save(graph: ContextGraph): void {
    fs.writeFileSync(this.storagePath, JSON.stringify(graph, null, 2));
  }
}
