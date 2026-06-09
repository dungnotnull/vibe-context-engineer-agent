import * as fs from 'node:fs';
import * as path from 'node:path';
export class HandoffEngine {
    outputDir;
    constructor(outputDir) {
        this.outputDir = path.join(outputDir, 'handoffs');
        fs.mkdirSync(this.outputDir, { recursive: true });
    }
    generate(fromAgent, toAgent, track, memory, graph) {
        const summary = this.buildSummary(track, memory);
        const currentState = this.buildCurrentState(track, graph);
        const blockers = track.blockers.map((b) => b.content);
        const decisions = track.decisions.map((d) => d.content);
        const nextSteps = this.buildNextSteps(track, graph);
        return {
            fromAgent,
            toAgent,
            summary,
            currentState,
            blockers,
            decisions,
            nextSteps,
            generatedAt: new Date().toISOString(),
        };
    }
    buildSummary(track, memory) {
        const lines = [];
        const completedCount = track.completed.length;
        const inProgressCount = track.inProgress.length;
        const factCount = memory.facts.length;
        lines.push(`Project snapshot: ${completedCount} completed, ${inProgressCount} in progress, ${factCount} memory facts.`);
        if (track.decisions.length > 0) {
            lines.push(`Key decisions: ${track.decisions.slice(0, 3).map((d) => d.content).join('; ')}`);
        }
        if (factCount > 0) {
            const recent = memory.facts
                .filter((f) => Date.now() - new Date(f.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000)
                .slice(0, 3)
                .map((f) => f.content);
            if (recent.length > 0) {
                lines.push(`Recent activity: ${recent.join('; ')}`);
            }
        }
        return lines.join('\n');
    }
    buildCurrentState(track, graph) {
        const lines = [];
        if (track.inProgress.length > 0) {
            lines.push(`### Active Work\n${track.inProgress.map((i) => `- ${i.content}`).join('\n')}`);
        }
        if (track.blockers.length > 0) {
            lines.push(`### Blockers\n${track.blockers.map((b) => `- ${b.content}`).join('\n')}`);
        }
        const componentNodes = graph.nodes.filter((n) => n.type === 'component');
        if (componentNodes.length > 0) {
            lines.push(`### Architecture (${componentNodes.length} components)`);
            lines.push(componentNodes.slice(0, 5).map((n) => `- ${n.label}`).join('\n'));
        }
        return lines.join('\n\n');
    }
    buildNextSteps(track, graph) {
        const steps = [];
        if (track.blockers.length > 0) {
            const first = track.blockers[0];
            steps.push(`Resolve blocker: ${first.content}`);
        }
        if (track.planned.length > 0) {
            for (const p of track.planned.slice(0, 3)) {
                steps.push(`Planned: ${p.content}`);
            }
        }
        const staleComponents = graph.nodes.filter((n) => n.type === 'component' &&
            n.metadata.lastChanged &&
            new Date(n.metadata.lastChanged).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (staleComponents.length > 0) {
            steps.push(`${staleComponents.length} component(s) have not been updated in 30+ days`);
        }
        if (steps.length === 0) {
            steps.push('No pending next steps — system up to date');
        }
        return steps;
    }
    write(handoff) {
        const fileName = `handoff-${handoff.fromAgent}-to-${handoff.toAgent}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
        const content = `# Handoff: ${handoff.fromAgent} → ${handoff.toAgent}

> Generated: ${handoff.generatedAt}

## Summary

${handoff.summary}

## Current State

${handoff.currentState}

## Key Decisions

${handoff.decisions.map((d) => `- ${d}`).join('\n')}

## Blockers

${handoff.blockers.map((b) => `- ${b}`).join('\n') || 'None'}

## Next Steps

${handoff.nextSteps.map((s) => `- ${s}`).join('\n')}
`;
        const filePath = path.join(this.outputDir, fileName);
        fs.writeFileSync(filePath, content);
        return filePath;
    }
}
