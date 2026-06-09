export class GraphQueryEngine {
    query(graph, query) {
        let matchedNodes = graph.nodes.filter((n) => {
            if (query.matchNodes.type && n.type !== query.matchNodes.type)
                return false;
            if (query.matchNodes.labelPattern) {
                const regex = new RegExp(query.matchNodes.labelPattern, 'i');
                if (!regex.test(n.label))
                    return false;
            }
            if (query.matchNodes.metadataFilter) {
                for (const [key, value] of Object.entries(query.matchNodes.metadataFilter)) {
                    if (n.metadata[key] !== value)
                        return false;
                }
            }
            return true;
        });
        let matchedRelations = graph.relations.filter((r) => {
            const sourceMatch = matchedNodes.some((n) => n.id === r.source);
            const targetMatch = matchedNodes.some((n) => n.id === r.target);
            if (!sourceMatch && !targetMatch)
                return false;
            if (query.matchRelations?.types && !query.matchRelations.types.includes(r.type))
                return false;
            if (query.matchRelations?.minWeight && r.weight < query.matchRelations.minWeight)
                return false;
            return true;
        });
        const paths = this.traverse(graph, matchedNodes.map((n) => n.id), query.traversalDepth);
        return { nodes: matchedNodes, relations: matchedRelations, paths };
    }
    traverse(graph, startNodeIds, maxDepth) {
        const nodeIndex = new Map();
        for (const n of graph.nodes)
            nodeIndex.set(n.id, n);
        const adjacency = new Map();
        for (const r of graph.relations) {
            if (!adjacency.has(r.source))
                adjacency.set(r.source, []);
            adjacency.get(r.source).push(r);
        }
        const paths = [];
        const visited = new Set();
        for (const startId of startNodeIds) {
            this._dfs(startId, maxDepth, nodeIndex, adjacency, visited, [], [], paths);
        }
        return paths;
    }
    _dfs(currentId, remainingDepth, nodeIndex, adjacency, visited, nodePath, relPath, results) {
        if (remainingDepth < 0 || visited.has(currentId))
            return;
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
    findDependencies(graph, nodeId, depth = 3) {
        const deps = new Set();
        const stack = [{ id: nodeId, d: 0 }];
        while (stack.length > 0) {
            const { id, d } = stack.pop();
            if (d >= depth || deps.has(id))
                continue;
            deps.add(id);
            const outgoing = graph.relations.filter((r) => r.source === id && (r.type === 'depends_on' || r.type === 'imports'));
            for (const rel of outgoing) {
                stack.push({ id: rel.target, d: d + 1 });
            }
        }
        return graph.nodes.filter((n) => deps.has(n.id));
    }
    findDependents(graph, nodeId, depth = 3) {
        const dependents = new Set();
        const stack = [{ id: nodeId, d: 0 }];
        while (stack.length > 0) {
            const { id, d } = stack.pop();
            if (d >= depth || dependents.has(id))
                continue;
            dependents.add(id);
            const incoming = graph.relations.filter((r) => r.target === id && (r.type === 'depends_on' || r.type === 'imports'));
            for (const rel of incoming) {
                stack.push({ id: rel.source, d: d + 1 });
            }
        }
        return graph.nodes.filter((n) => dependents.has(n.id));
    }
    findCircularDependencies(graph) {
        const deps = graph.relations.filter((r) => r.type === 'depends_on');
        const adj = new Map();
        for (const r of deps) {
            if (!adj.has(r.source))
                adj.set(r.source, []);
            adj.get(r.source).push(r.target);
        }
        const cycles = [];
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = new Map();
        const parent = new Map();
        const dfs = (node, nodePath) => {
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
                }
                else if (c === undefined) {
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
    getCentrality(graph) {
        const centrality = new Map();
        for (const n of graph.nodes)
            centrality.set(n.id, 0);
        for (const r of graph.relations) {
            centrality.set(r.source, (centrality.get(r.source) || 0) + 1);
            centrality.set(r.target, (centrality.get(r.target) || 0) + 1);
        }
        return new Map([...centrality.entries()].sort((a, b) => b[1] - a[1]));
    }
}
