import type { ContextGraph, GraphNode, GraphRelation, GraphQuery, GraphQueryResult, GraphPath } from '../../core/types.js';

export class GraphQueryEngine {
  query(graph: ContextGraph, query: GraphQuery): GraphQueryResult {
    let matchedNodes = graph.nodes.filter((n) => {
      if (query.matchNodes.type && n.type !== query.matchNodes.type) return false;
      if (query.matchNodes.labelPattern) {
        const regex = new RegExp(query.matchNodes.labelPattern, 'i');
        if (!regex.test(n.label)) return false;
      }
      if (query.matchNodes.metadataFilter) {
        for (const [key, value] of Object.entries(query.matchNodes.metadataFilter)) {
          if (n.metadata[key] !== value) return false;
        }
      }
      return true;
    });

    let matchedRelations = graph.relations.filter((r) => {
      const sourceMatch = matchedNodes.some((n) => n.id === r.source);
      const targetMatch = matchedNodes.some((n) => n.id === r.target);
      if (!sourceMatch && !targetMatch) return false;
      if (query.matchRelations?.types && !query.matchRelations.types.includes(r.type))
        return false;
      if (query.matchRelations?.minWeight && r.weight < query.matchRelations.minWeight)
        return false;
      return true;
    });

    const paths = this.traverse(
      graph,
      matchedNodes.map((n) => n.id),
      query.traversalDepth
    );

    return { nodes: matchedNodes, relations: matchedRelations, paths };
  }

  traverse(graph: ContextGraph, startNodeIds: string[], maxDepth: number): GraphPath[] {
    const nodeIndex = new Map<string, GraphNode>();
    for (const n of graph.nodes) nodeIndex.set(n.id, n);

    const adjacency = new Map<string, GraphRelation[]>();
    for (const r of graph.relations) {
      if (!adjacency.has(r.source)) adjacency.set(r.source, []);
      adjacency.get(r.source)!.push(r);
    }

    const paths: GraphPath[] = [];
    const visited = new Set<string>();

    for (const startId of startNodeIds) {
      this._dfs(startId, maxDepth, nodeIndex, adjacency, visited, [], [], paths);
    }

    return paths;
  }

  private _dfs(
    currentId: string,
    remainingDepth: number,
    nodeIndex: Map<string, GraphNode>,
    adjacency: Map<string, GraphRelation[]>,
    visited: Set<string>,
    nodePath: string[],
    relPath: string[],
    results: GraphPath[]
  ): void {
    if (remainingDepth < 0 || visited.has(currentId)) return;

    visited.add(currentId);
    nodePath.push(currentId);

    const outgoing = adjacency.get(currentId) || [];
    for (const rel of outgoing) {
      relPath.push(`${rel.source}→${rel.type}→${rel.target}`);
      this._dfs(rel.target, remainingDepth - 1, nodeIndex, adjacency, visited, nodePath, relPath, results);
      relPath.pop();
    }

    if (nodePath.length > 1) {
      results.push({
        nodes: [...nodePath],
        relations: [...relPath],
        length: nodePath.length - 1,
      });
    }

    nodePath.pop();
    visited.delete(currentId);
  }

  findDependencies(graph: ContextGraph, nodeId: string, depth = 3): GraphNode[] {
    const deps = new Set<string>();
    const stack: { id: string; d: number }[] = [{ id: nodeId, d: 0 }];

    while (stack.length > 0) {
      const { id, d } = stack.pop()!;
      if (d >= depth || deps.has(id)) continue;
      deps.add(id);

      const outgoing = graph.relations.filter(
        (r) => r.source === id && (r.type === 'depends_on' || r.type === 'imports')
      );
      for (const rel of outgoing) {
        stack.push({ id: rel.target, d: d + 1 });
      }
    }

    return graph.nodes.filter((n) => deps.has(n.id));
  }

  findDependents(graph: ContextGraph, nodeId: string, depth = 3): GraphNode[] {
    const dependents = new Set<string>();
    const stack: { id: string; d: number }[] = [{ id: nodeId, d: 0 }];

    while (stack.length > 0) {
      const { id, d } = stack.pop()!;
      if (d >= depth || dependents.has(id)) continue;
      dependents.add(id);

      const incoming = graph.relations.filter(
        (r) => r.target === id && (r.type === 'depends_on' || r.type === 'imports')
      );
      for (const rel of incoming) {
        stack.push({ id: rel.source, d: d + 1 });
      }
    }

    return graph.nodes.filter((n) => dependents.has(n.id));
  }

  findCircularDependencies(graph: ContextGraph): GraphPath[] {
    const deps = graph.relations.filter((r) => r.type === 'depends_on');
    const adj = new Map<string, string[]>();
    for (const r of deps) {
      if (!adj.has(r.source)) adj.set(r.source, []);
      adj.get(r.source)!.push(r.target);
    }

    const cycles: GraphPath[] = [];
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    const parent = new Map<string, string>();

    const dfs = (node: string, nodePath: string[]): void => {
      color.set(node, GRAY);
      nodePath.push(node);

      for (const neighbor of adj.get(node) || []) {
        const c = color.get(neighbor);
        if (c === GRAY) {
          const cycleStart = nodePath.indexOf(neighbor);
          cycles.push({
            nodes: nodePath.slice(cycleStart),
            relations: [],
            length: nodePath.length - cycleStart,
          });
        } else if (c === undefined) {
          parent.set(neighbor, node);
          dfs(neighbor, nodePath);
        }
      }

      nodePath.pop();
      color.set(node, BLACK);
    };

    for (const n of graph.nodes) {
      if (!color.has(n.id)) {
        dfs(n.id, []);
      }
    }

    return cycles;
  }

  getCentrality(graph: ContextGraph): Map<string, number> {
    const centrality = new Map<string, number>();
    for (const n of graph.nodes) centrality.set(n.id, 0);
    for (const r of graph.relations) {
      centrality.set(r.source, (centrality.get(r.source) || 0) + 1);
      centrality.set(r.target, (centrality.get(r.target) || 0) + 1);
    }
    return new Map([...centrality.entries()].sort((a, b) => b[1] - a[1]));
  }
}
