export class ImpactAnalyzer {
    analyze(graph, sourceNodeId) {
        const impactedNodes = [];
        const criticalPaths = [];
        const visited = new Set();
        const queue = [
            { id: sourceNodeId, distance: 0, chain: [] },
        ];
        while (queue.length > 0) {
            const { id, distance, chain } = queue.shift();
            if (visited.has(id))
                continue;
            visited.add(id);
            const node = graph.nodes.find((n) => n.id === id);
            if (!node)
                continue;
            const outgoing = graph.relations.filter((r) => r.source === id);
            for (const rel of outgoing) {
                const weight = rel.weight || 1;
                const impactScore = weight / Math.max(distance + 1, 1);
                const newChain = [...chain, `${id}→${rel.type}→${rel.target}`];
                impactedNodes.push({
                    nodeId: rel.target,
                    label: graph.nodes.find((n) => n.id === rel.target)?.label || rel.target,
                    distance: distance + 1,
                    impactScore,
                    relationChain: newChain,
                });
                if (impactScore > 0.5) {
                    criticalPaths.push({
                        nodes: [id, rel.target],
                        relations: [rel.type],
                        length: 1,
                    });
                }
                queue.push({ id: rel.target, distance: distance + 1, chain: newChain });
            }
        }
        const totalImpactScore = impactedNodes.reduce((sum, n) => sum + n.impactScore, 0);
        return {
            sourceNode: sourceNodeId,
            impactedNodes: impactedNodes.sort((a, b) => b.impactScore - a.impactScore),
            totalImpactScore,
            criticalPaths: criticalPaths.slice(0, 20),
        };
    }
    calculateChangeRisk(graph, changedNodeIds) {
        const allImpacted = new Set();
        let totalRisk = 0;
        for (const nodeId of changedNodeIds) {
            const analysis = this.analyze(graph, nodeId);
            totalRisk += analysis.totalImpactScore;
            for (const impacted of analysis.impactedNodes) {
                allImpacted.add(impacted.nodeId);
            }
        }
        const highRiskNodes = [...allImpacted].filter((id) => {
            const centrality = graph.relations.filter((r) => r.source === id || r.target === id).length;
            return centrality >= 3;
        });
        let riskLevel;
        if (totalRisk > 50 || highRiskNodes.length > 10)
            riskLevel = 'critical';
        else if (totalRisk > 20 || highRiskNodes.length > 5)
            riskLevel = 'high';
        else if (totalRisk > 5 || highRiskNodes.length > 2)
            riskLevel = 'medium';
        else
            riskLevel = 'low';
        return { riskScore: Math.min(totalRisk, 100), riskLevel, highRiskNodes };
    }
}
