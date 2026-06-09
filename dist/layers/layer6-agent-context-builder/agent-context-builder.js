import * as fs from 'node:fs';
import * as path from 'node:path';
import { HandoffEngine } from './handoff-engine.js';
import { ContextDiffEngine } from './context-diff-engine.js';
const AGENT_PROFILES = {
    'claude-code': { name: 'Claude Code', maxTokens: 15000, preferences: { detailLevel: 'balanced', includeGraph: true, includeHistory: true, format: 'markdown' } },
    cursor: { name: 'Cursor', maxTokens: 8000, preferences: { detailLevel: 'concise', includeGraph: false, includeHistory: true, format: 'markdown' } },
    archon: { name: 'Archon', maxTokens: 12000, preferences: { detailLevel: 'detailed', includeGraph: true, includeHistory: true, format: 'json' } },
    aider: { name: 'Aider', maxTokens: 6000, preferences: { detailLevel: 'concise', includeGraph: false, includeHistory: false, format: 'markdown' } },
    opencode: { name: 'OpenCode', maxTokens: 10000, preferences: { detailLevel: 'balanced', includeGraph: true, includeHistory: true, format: 'markdown' } },
    openhands: { name: 'OpenHands', maxTokens: 12000, preferences: { detailLevel: 'detailed', includeGraph: true, includeHistory: true, format: 'json' } },
};
export class AgentContextBuilder {
    outputDir;
    config;
    handoffEngine;
    contextDiffEngine;
    constructor(config) {
        this.config = config;
        this.outputDir = path.join(config.outputDir, 'agent-contexts');
        this.handoffEngine = new HandoffEngine(config.outputDir);
        this.contextDiffEngine = new ContextDiffEngine();
        fs.mkdirSync(this.outputDir, { recursive: true });
    }
    build(memory, graph, track) {
        const packages = [];
        for (const agentType of this.config.agentTypes) {
            const profile = AGENT_PROFILES[agentType] || AGENT_PROFILES['claude-code'];
            packages.push(this.buildForAgent(agentType, profile, memory, graph, track));
        }
        return packages;
    }
    buildHandoff(from, to, memory, graph, track) {
        return this.handoffEngine.generate(from, to, track, memory, graph);
    }
    writeHandoff(from, to, memory, graph, track) {
        const handoff = this.buildHandoff(from, to, memory, graph, track);
        return this.handoffEngine.write(handoff);
    }
    computeDiff(cacheKey, state) {
        return this.contextDiffEngine.diff(cacheKey, state);
    }
    buildForAgent(agentType, profile, memory, graph, track) {
        const layers = [];
        let content;
        if (profile.preferences.format === 'markdown') {
            content = this.buildMarkdown(profile, memory, graph, track, layers);
        }
        else if (profile.preferences.format === 'yaml') {
            content = this.buildYaml(profile, memory, graph, track, layers);
        }
        else {
            content = this.buildJson(profile, memory, graph, track, layers);
        }
        const tokenUsage = Math.ceil(content.split(/\s+/).length * 1.3);
        const pkg = {
            agent: agentType,
            maxTokens: profile.maxTokens,
            content: this.trimToTokens(content, profile.maxTokens),
            generatedAt: new Date().toISOString(),
            layers,
            tokenUsage,
            compressionRatio: tokenUsage > 0 ? 1 - tokenUsage / Math.max(profile.maxTokens, 1) : 0,
        };
        this.writePackage(pkg);
        return pkg;
    }
    buildMarkdown(profile, memory, graph, track, layersOut) {
        let md = `# Context Package for ${profile.name}\n\n> Generated: ${new Date().toISOString()}\n> Token Budget: ${profile.maxTokens}\n\n`;
        layersOut.push('sprint');
        md += '## Current Sprint\n\n**In Progress:**\n';
        for (const item of track.inProgress.slice(0, 5))
            md += `- ${item.content}\n`;
        md += '\n**Recent Completions:**\n';
        for (const item of track.completed.slice(0, 5))
            md += `- ✓ ${item.content}\n`;
        md += '\n';
        if (track.decisions.length > 0) {
            layersOut.push('decisions');
            md += '## Recent Decisions\n\n';
            for (const d of track.decisions.slice(0, 5))
                md += `- 📐 ${d.content}\n`;
            md += '\n';
        }
        if (profile.preferences.includeHistory) {
            layersOut.push('memory');
            md += '## Project Memory\n\n';
            for (const fact of memory.facts.slice(0, 20))
                md += `- [${fact.type}] ${fact.content}\n`;
            md += '\n';
        }
        if (profile.preferences.includeGraph) {
            layersOut.push('graph');
            md += '## Architecture Overview\n\n';
            const componentNodes = graph.nodes.filter((n) => n.type === 'component');
            md += `**Components (${componentNodes.length}):**\n`;
            for (const n of componentNodes.slice(0, 10))
                md += `- \`${n.label}\`\n`;
            const featureNodes = graph.nodes.filter((n) => n.type === 'feature');
            if (featureNodes.length > 0) {
                md += `\n**Features (${featureNodes.length}):**\n`;
                for (const n of featureNodes.slice(0, 5))
                    md += `- ${n.label}\n`;
            }
            const deps = graph.relations.filter((r) => r.type === 'depends_on');
            if (deps.length > 0) {
                md += '\n**Key Dependencies:**\n';
                for (const r of deps.slice(0, 10))
                    md += `- \`${r.source}\` → depends_on → \`${r.target}\`\n`;
            }
            md += '\n';
        }
        if (track.blockers.length > 0) {
            layersOut.push('blockers');
            md += '## ⚠️ Blockers\n\n';
            for (const b of track.blockers)
                md += `- 🚫 ${b.content}\n`;
            md += '\n';
        }
        return md;
    }
    buildJson(profile, memory, graph, track, layersOut) {
        const pkg = {
            agent: profile.name,
            generated: new Date().toISOString(),
            budget: profile.maxTokens,
            sprint: { inProgress: track.inProgress.slice(0, 5).map((i) => i.content), completed: track.completed.slice(0, 5).map((i) => i.content) },
            decisions: track.decisions.slice(0, 5).map((d) => d.content),
            memory: profile.preferences.includeHistory ? memory.facts.slice(0, 15) : [],
            graph: profile.preferences.includeGraph ? { components: graph.nodes.filter((n) => n.type === 'component').slice(0, 10).map((n) => ({ id: n.id, label: n.label })), dependencies: graph.relations.filter((r) => r.type === 'depends_on').slice(0, 10).map((r) => ({ source: r.source, target: r.target })) } : null,
            blockers: track.blockers.map((b) => b.content),
        };
        layersOut.push('sprint', 'decisions', 'memory', 'graph');
        return JSON.stringify(pkg, null, 2);
    }
    buildYaml(_profile, memory, graph, track, layersOut) {
        layersOut.push('sprint', 'decisions', 'memory', 'graph');
        return [
            '# Context Package',
            `generated: ${new Date().toISOString()}`,
            `budget: ${_profile.maxTokens}`,
            '',
            'sprint:',
            '  in_progress:',
            ...track.inProgress.slice(0, 5).map((i) => `    - "${i.content}"`),
            '  completed:',
            ...track.completed.slice(0, 5).map((i) => `    - "${i.content}"`),
            '',
            'decisions:',
            ...track.decisions.slice(0, 5).map((d) => `  - "${d.content}"`),
            '',
            'memory_facts:',
            ...memory.facts.slice(0, 15).map((f) => `  - type: ${f.type}\n    content: "${f.content}"`),
            '',
            'components:',
            ...graph.nodes.filter((n) => n.type === 'component').slice(0, 10).map((n) => `  - id: ${n.id}\n    label: "${n.label}"`),
            '',
        ].join('\n');
    }
    trimToTokens(content, maxTokens) {
        const estimated = Math.ceil(content.split(/\s+/).length * 1.3);
        if (estimated <= maxTokens)
            return content;
        const words = content.split(/\s+/);
        return words.slice(0, Math.floor((maxTokens / 1.3) * 0.9)).join(' ') + '\n\n[Content trimmed for token budget]';
    }
    writePackage(pkg) {
        const ext = pkg.content.startsWith('{') ? 'json' : pkg.content.startsWith('#') ? 'md' : 'yaml';
        fs.writeFileSync(path.join(this.outputDir, `${pkg.agent}-context.${ext}`), pkg.content);
    }
}
