#!/usr/bin/env node
import { Command } from 'commander';
import { Pipeline } from './core/pipeline.js';
import { KnowledgeBrain } from './layers/layer7-knowledge-brain/knowledge-brain.js';
import { ResearchEngine } from './core/research-engine.js';
import { FeedbackCollector } from './layers/layer8-learning-engine/feedback-collector.js';
import { ABTestEngine } from './layers/layer8-learning-engine/ab-test-engine.js';
import { MultiRepoOrchestrator } from './core/multi-repo-orchestrator.js';
import { TeamMemoryManager } from './core/team-memory.js';
import { ConfigManager } from './core/config-manager.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
const DEFAULT_OUTPUT = '.vcea';
function createConfig(repoPath, options) {
    const agentTypes = options.agents ? options.agents.split(',') : ['claude-code', 'cursor', 'archon', 'aider', 'opencode', 'openhands'];
    return {
        repoPath: path.resolve(repoPath),
        outputDir: path.resolve(options.output || DEFAULT_OUTPUT),
        watchMode: false,
        agentTypes,
        graphStorage: options.graphStorage || 'json',
        neo4jUri: options.neo4jUri,
        neo4jUser: options.neo4jUser,
        neo4jPassword: options.neo4jPassword,
        modelEndpoint: options.modelEndpoint,
        modelName: options.modelName,
        retention: {
            shortTermDays: parseInt(options.shortTermDays || '7'),
            workingTermDays: parseInt(options.workingTermDays || '30'),
            longTermDays: parseInt(options.longTermDays || '365'),
            autoCleanup: options.autoCleanup !== 'false',
        },
    };
}
function formatResult(result) {
    const box = '═'.repeat(45);
    console.log(`\n${box}`);
    console.log('  Vibe Context Engineer Agent — Pipeline Run');
    console.log(`${box}\n`);
    console.log(`📡 Layer 1 — Observer: ${result.observer.length} change events`);
    for (const event of result.observer.slice(0, 5))
        console.log(`   [${event.type}] ${event.summary}`);
    if (result.observer.length > 5)
        console.log(`   ... and ${result.observer.length - 5} more`);
    console.log(`\n🔍 Layer 2 — Intelligence: ${result.intelligence.length} classified changes`);
    for (const cc of result.intelligence.slice(0, 3)) {
        const cats = cc.categories.join(', ');
        const breaking = cc.isBreaking ? ' ⚠️ BREAKING' : '';
        console.log(`   [${cc.complexity}] ${cats}${breaking}`);
    }
    if (result.intelligence.length > 3)
        console.log(`   ... and ${result.intelligence.length - 3} more`);
    console.log(`\n📦 Layer 3 — Compression: ${result.compression.facts.length} facts`);
    console.log(`   Strategy: ${result.compression.stats.compressionStrategy}`);
    console.log(`   Layers: ${result.compression.memoryLayers.map((l) => `${l.type}(${l.facts.length})`).join(', ')}`);
    console.log(`   Original: ~${result.compression.stats.originalTokens} tokens`);
    console.log(`   Compressed: ~${result.compression.stats.compressedTokens} tokens`);
    console.log(`   Reduction: ${(result.compression.stats.reductionRatio * 100).toFixed(1)}%`);
    console.log(`   Stale: ${result.compression.staleFacts.length} facts`);
    console.log(`\n🕸️  Layer 4 — Graph: ${result.graph.nodes.length} nodes, ${result.graph.relations.length} relations`);
    const nodeTypes = new Set(result.graph.nodes.map((n) => n.type));
    console.log(`   Types: ${[...nodeTypes].join(', ')}`);
    console.log(`\n📋 Layer 5 — Tracking:`);
    console.log(`   Sprint #${result.tracking.sprintNumber}`);
    console.log(`   Completed: ${result.tracking.completed.length}`);
    console.log(`   In Progress: ${result.tracking.inProgress.length}`);
    console.log(`   Planned: ${result.tracking.planned.length}`);
    console.log(`   Blockers: ${result.tracking.blockers.length}`);
    console.log(`   Decisions: ${result.tracking.decisions.length}`);
    console.log(`\n📤 Layer 6 — Context Packages: ${result.contextPackages.length} agents`);
    for (const pkg of result.contextPackages) {
        console.log(`   ${pkg.agent}: ${pkg.tokenUsage}/${pkg.maxTokens} tokens (${(pkg.compressionRatio * 100).toFixed(0)}% margin)`);
    }
    if (result.knowledge && result.knowledge.length > 0) {
        console.log(`\n🧠 Layer 7 — Knowledge Brain: ${result.knowledge.length} new items`);
        for (const item of result.knowledge.slice(0, 3))
            console.log(`   [${item.category}] ${item.summary.slice(0, 80)}`);
    }
    if (result.evaluation) {
        console.log(`\n📊 Layer 8 — Quality Evaluation:`);
        console.log(`   Overall: ${(result.evaluation.overallScore * 100).toFixed(0)}%`);
        console.log(`   Relevance: ${(result.evaluation.dimensions.relevance * 100).toFixed(0)}% | Completeness: ${(result.evaluation.dimensions.completeness * 100).toFixed(0)}% | Conciseness: ${(result.evaluation.dimensions.conciseness * 100).toFixed(0)}%`);
    }
    if (result.benchmark) {
        console.log(`\n⏱️  Benchmark: ${(result.benchmark.reductionRatio * 100).toFixed(1)}% reduction at quality ${(result.benchmark.qualityScore * 100).toFixed(0)}%`);
    }
    console.log(`\n${box}\n`);
}
const program = new Command();
program
    .name('vcea')
    .description('Vibe Context Engineer Agent — AI Memory OS for coding agents')
    .version('0.1.0');
program
    .command('run')
    .description('Run the complete 8-layer pipeline on a repository')
    .argument('<repoPath>', 'Path to the repository to analyze')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--agents <list>', 'Comma-separated agent types')
    .option('--graph-storage <type>', 'Graph backend (json|neo4j)', 'json')
    .option('--model-endpoint <url>', 'LLM endpoint')
    .option('--model-name <name>', 'LLM model name')
    .option('--short-term-days <n>', 'Short-term memory retention days', '7')
    .option('--working-term-days <n>', 'Working memory retention days', '30')
    .option('--long-term-days <n>', 'Long-term memory retention days', '365')
    .option('--no-auto-cleanup', 'Disable automatic stale data cleanup')
    .action(async (repoPath, options) => {
    try {
        const config = createConfig(repoPath, options);
        const pipeline = new Pipeline(config);
        const result = await pipeline.run();
        formatResult(result);
        console.log(`✅ Artifacts written to ${config.outputDir}`);
    }
    catch (err) {
        console.error('Pipeline failed:', err);
        process.exit(1);
    }
});
program
    .command('watch')
    .description('Watch a repository for changes and run pipeline continuously')
    .argument('<repoPath>', 'Path to the repository to watch')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--agents <list>', 'Comma-separated agent types')
    .action(async (repoPath, options) => {
    try {
        const config = createConfig(repoPath, options);
        config.watchMode = true;
        const pipeline = new Pipeline(config);
        console.log(`👀 Watching ${config.repoPath} for changes...`);
        await pipeline.watch((result) => formatResult(result));
        process.on('SIGINT', () => { pipeline.stopWatch(); console.log('\n👋 Watch mode stopped'); process.exit(0); });
    }
    catch (err) {
        console.error('Watch failed:', err);
        process.exit(1);
    }
});
program
    .command('graph')
    .description('Inspect the context graph')
    .argument('<repoPath>', 'Path to the repository')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--impact <nodeId>', 'Run impact analysis for a node')
    .option('--circular', 'Find circular dependencies')
    .option('--centrality', 'Show node centrality ranking')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    const pipeline = new Pipeline(config);
    const graph = pipeline.getGraph();
    if (graph.nodes.length === 0) {
        console.log('No graph data yet. Run `vcea run` first.');
        return;
    }
    if (options.impact) {
        const analysis = pipeline.analyzeImpact(options.impact);
        console.log(`\n🎯 Impact Analysis: ${options.impact}`);
        console.log(`Total Impact Score: ${analysis.totalImpactScore.toFixed(2)}`);
        console.log(`Impacted Nodes: ${analysis.impactedNodes.length}`);
        for (const n of analysis.impactedNodes.slice(0, 10)) {
            console.log(`  ${n.label} (distance: ${n.distance}, impact: ${n.impactScore.toFixed(3)})`);
        }
        return;
    }
    if (options.circular) {
        const cycles = pipeline.findCircularDeps();
        console.log(`\n🔴 Circular Dependencies: ${cycles.length}`);
        for (const cycle of cycles) {
            console.log(`  ${cycle.nodes.join(' → ')}`);
        }
        return;
    }
    if (options.centrality) {
        const centrality = pipeline.getCentrality();
        console.log('\n📊 Node Centrality:');
        let i = 0;
        for (const [nodeId, count] of centrality.entries()) {
            if (i++ >= 20)
                break;
            const node = graph.nodes.find((n) => n.id === nodeId);
            console.log(`  ${i}. ${node?.label || nodeId}: ${count} connections`);
        }
        return;
    }
    console.log(`\n🕸️  Context Graph — ${graph.nodes.length} nodes, ${graph.relations.length} relations\n`);
    for (const node of graph.nodes.slice(0, 30)) {
        console.log(`  [${node.type}] ${node.label}`);
    }
    if (graph.relations.length > 0) {
        console.log('\nKey Relations:');
        for (const rel of graph.relations.slice(0, 15)) {
            console.log(`  ${rel.source} → ${rel.type} → ${rel.target}`);
        }
    }
    console.log(`\nLast updated: ${graph.lastUpdated}`);
});
program
    .command('knowledge')
    .description('Query the knowledge brain')
    .argument('<repoPath>', 'Path to the repository')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--category <cat>', 'Filter by category')
    .option('--search <term>', 'Search knowledge items')
    .option('--semantic <query>', 'Semantic similarity search')
    .option('--validate', 'Validate all knowledge items')
    .option('--version <releaseNotes>', 'Create a KB version snapshot')
    .option('--cluster <n>', 'Cluster knowledge items')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    const kb = new KnowledgeBrain(config.outputDir);
    if (options.validate) {
        const results = kb.validateAll();
        const valid = results.filter((r) => r.isValid).length;
        console.log(`\n✅ Knowledge Validation: ${valid}/${results.length} valid`);
        for (const r of results.filter((r) => !r.isValid)) {
            console.log(`  ❌ ${r.itemId}: ${r.issues.join(', ')}`);
        }
        return;
    }
    if (options.version) {
        const v = kb.createVersion(options.version);
        console.log(`📦 Created version ${v.version} with ${v.items.length} items`);
        return;
    }
    if (options.cluster) {
        const clusters = kb.clusterKnowledge(parseInt(options.cluster) || 5);
        console.log(`\n📊 Knowledge Clusters: ${clusters.size}\n`);
        for (const [cid, items] of clusters) {
            console.log(`Cluster ${cid + 1} (${items.length} items):`);
            for (const item of items.slice(0, 3))
                console.log(`  - ${item.summary.slice(0, 80)}`);
            console.log('');
        }
        return;
    }
    let items;
    if (options.semantic) {
        const results = kb.semanticSearch(options.semantic);
        console.log(`\n🧠 Semantic Search: "${options.semantic}" — ${results.length} results\n`);
        for (const { item, score } of results) {
            console.log(`[${(score * 100).toFixed(0)}%] [${item.category}] ${item.summary.slice(0, 100)}`);
        }
        return;
    }
    items = options.search ? kb.search(options.search) : kb.query(options.category);
    console.log(`\n🧠 Knowledge Brain — ${items.length} items\n`);
    for (const item of items.slice(0, 20)) {
        console.log(`[${item.category}] ${item.summary}`);
        if (item.keyFindings.length > 0)
            console.log(`  Tags: ${item.keyFindings.join(', ')}`);
        console.log(`  Confidence: ${(item.confidenceScore * 100).toFixed(0)}% | Relevance: ${(item.relevanceScore * 100).toFixed(0)}%\n`);
    }
});
program
    .command('research')
    .description('Research engine operations')
    .argument('<repoPath>', 'Path to the repository')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--ingest-paper', 'Ingest a research paper (use with --title --url --abstract)')
    .option('--title <title>', 'Paper title')
    .option('--url <url>', 'Paper URL')
    .option('--abstract <text>', 'Paper abstract')
    .option('--authors <list>', 'Comma-separated authors')
    .option('--year <year>', 'Publication year')
    .option('--benchmark', 'Run context engineering benchmarks')
    .option('--report', 'Generate memory systems + agent architecture reports')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    const engine = new ResearchEngine(config.outputDir);
    if (options.ingestPaper) {
        const paper = {
            title: options.title || 'Untitled',
            authors: options.authors ? options.authors.split(',') : [],
            year: parseInt(options.year || '2024'),
            venue: '',
            url: options.url || '',
            abstract: options.abstract || '',
            keywords: [],
            citations: 0,
        };
        const item = engine.ingestPaper(paper);
        console.log(`📄 Ingested: [${item.category}] ${item.summary.slice(0, 80)}`);
        return;
    }
    if (options.benchmark) {
        const benchmarks = engine.runContextEngineeringBenchmark([1000, 5000, 10000, 50000]);
        console.log(`\n⏱️  Context Engineering Benchmarks — ${benchmarks.length} runs\n`);
        for (const b of benchmarks) {
            console.log(`[${b.strategy}] ${b.inputSize}→${b.outputSize} tokens | ${(b.reductionRatio * 100).toFixed(1)}% reduction | Quality: ${(b.qualityScore * 100).toFixed(0)}% | ${b.latencyMs}ms`);
        }
        return;
    }
    if (options.report) {
        engine.saveReports();
        console.log('✅ Reports saved to research/ directory');
        return;
    }
    console.log('Use --ingest-paper, --benchmark, or --report');
});
program
    .command('feedback')
    .description('Learning engine feedback operations')
    .argument('<repoPath>', 'Path to the repository')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--record', 'Record a feedback signal')
    .option('--source <source>', 'Feedback source')
    .option('--type <type>', 'Feedback type')
    .option('--score <score>', 'Score (0-1)')
    .option('--details <text>', 'Feedback details')
    .option('--stats', 'Show feedback statistics')
    .option('--ab-test', 'Run an A/B test comparison')
    .option('--strategy-a <name>', 'Strategy A name')
    .option('--strategy-b <name>', 'Strategy B name')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    if (options.stats) {
        const collector = new FeedbackCollector(config.outputDir);
        const stats = collector.getStats();
        console.log(`\n📊 Feedback Statistics\n`);
        console.log(`Total: ${stats.total} | Avg Score: ${(stats.averageScore * 100).toFixed(0)}%`);
        console.log(`By Source: ${JSON.stringify(stats.bySource)}`);
        console.log(`By Type: ${JSON.stringify(stats.byType)}`);
        console.log(`Trend: ${stats.trend}`);
        return;
    }
    if (options.record) {
        const collector = new FeedbackCollector(config.outputDir);
        const signal = collector.record({
            source: (options.source || 'manual'),
            type: (options.type || 'context-quality'),
            score: parseFloat(options.score || '0.7'),
            details: options.details || '',
            contextId: repoPath,
        });
        console.log(`✅ Feedback recorded: ${signal.id}`);
        return;
    }
    if (options.abTest) {
        const ab = new ABTestEngine();
        const testId = ab.createTest(options.strategyA || 'baseline', options.strategyB || 'experiment');
        console.log(`🧪 A/B Test created: ${testId}`);
        console.log(`   Variant A: ${options.strategyA || 'baseline'}`);
        console.log(`   Variant B: ${options.strategyB || 'experiment'}`);
        return;
    }
    console.log('Use --record, --stats, or --ab-test');
});
program
    .command('multi-repo')
    .description('Multi-repository orchestration')
    .argument('<repoPath>', 'Path to workspace base')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--config <path>', 'Path to multi-repo config JSON')
    .option('--run-all', 'Run pipeline on all configured repos')
    .option('--report', 'Generate aggregate multi-repo report')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    if (!options.config) {
        console.log('Supply --config with path to multi-repo JSON config');
        return;
    }
    const multiRepoConfig = JSON.parse(fs.readFileSync(options.config, 'utf-8'));
    config.multiRepo = multiRepoConfig;
    const orchestrator = new MultiRepoOrchestrator(config);
    if (options.runAll) {
        console.log(`🚀 Running pipeline on ${multiRepoConfig.repos?.length || 0} repos...`);
        const results = await orchestrator.runAll();
        const agg = orchestrator.aggregateKnowledge();
        console.log(`\n✅ Done. ${results.size} repos analyzed.`);
        console.log(`Total: ${agg.totalFacts} facts, ${agg.totalNodes} nodes, ${agg.totalRelations} relations`);
    }
    if (options.report) {
        const reportPath = orchestrator.writeAggregateReport();
        console.log(`📊 Report written to ${reportPath}`);
    }
});
program
    .command('team')
    .description('Team memory operations')
    .argument('<repoPath>', 'Path to the repository')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--team-name <name>', 'Team name')
    .option('--add-member <name>', 'Add a team member')
    .option('--role <role>', 'Member role')
    .option('--log-activity', 'Log team activity')
    .option('--show', 'Show team memory')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    const team = new TeamMemoryManager(config.outputDir, options.teamName || 'default');
    if (options.addMember) {
        const member = team.addMember(options.addMember, options.role || 'developer', [repoPath]);
        console.log(`👤 Member added: ${member.name} (${member.role})`);
        return;
    }
    if (options.logActivity) {
        team.logActivity('system', repoPath, 'pipeline-run', 'Pipeline executed');
        console.log('✅ Activity logged');
        return;
    }
    if (options.show) {
        const memory = team.getMemory();
        console.log(`\n👥 Team: ${memory.teamName}`);
        console.log(`Members: ${memory.members.length}`);
        for (const m of memory.members)
            console.log(`  - ${m.name} (${m.role})`);
        console.log(`Shared Knowledge: ${memory.sharedKnowledge.length} items`);
        console.log(`Activity Log: ${memory.activityLog.length} entries`);
        return;
    }
    console.log('Use --add-member, --log-activity, or --show');
});
program
    .command('config')
    .description('Configuration management')
    .argument('<repoPath>', 'Path to the repository')
    .option('-o, --output <dir>', 'Output directory', DEFAULT_OUTPUT)
    .option('--init', 'Initialize a config file')
    .option('--validate', 'Validate existing config')
    .option('--export <path>', 'Export config')
    .action(async (repoPath, options) => {
    const config = createConfig(repoPath, options);
    if (options.init) {
        const cfg = ConfigManager.createDefaultConfig(repoPath, config.outputDir);
        ConfigManager.save(cfg);
        console.log(`✅ Config initialized at ${config.outputDir}/vcea-config.json`);
        return;
    }
    if (options.validate) {
        const loaded = ConfigManager.load(repoPath, config.outputDir);
        const errors = ConfigManager.validate(loaded);
        if (errors.length === 0) {
            console.log('✅ Config is valid');
        }
        else {
            console.log('❌ Config issues:');
            for (const err of errors)
                console.log(`  - ${err}`);
        }
        return;
    }
    if (options.export) {
        const loaded = ConfigManager.load(repoPath, config.outputDir);
        const exportPath = options.export;
        fs.writeFileSync(exportPath, JSON.stringify(loaded, null, 2));
        console.log(`✅ Config exported to ${exportPath}`);
        return;
    }
    console.log('Use --init, --validate, or --export');
});
program.parse();
