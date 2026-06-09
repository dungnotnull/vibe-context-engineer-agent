import { RepositoryObserver } from '../layers/layer1-observer/repository-observer.js';
import { ChangeIntelligenceEngine } from '../layers/layer2-change-intelligence/change-intelligence.js';
import { MemoryCompressionEngine } from '../layers/layer3-memory-compression/memory-compression.js';
import { ContextGraphEngine } from '../layers/layer4-context-graph/context-graph.js';
import { DevelopmentTrackingEngine } from '../layers/layer5-dev-tracking/dev-tracking.js';
import { AgentContextBuilder } from '../layers/layer6-agent-context-builder/agent-context-builder.js';
import { KnowledgeBrain } from '../layers/layer7-knowledge-brain/knowledge-brain.js';
import { ResearchEngine } from './research-engine.js';
import { QualityEvaluator } from '../layers/layer8-learning-engine/quality-evaluator.js';
import { CompressionBenchmarker } from '../layers/layer8-learning-engine/compression-benchmarker.js';
import type { VceaConfig, PipelineResult, ContextGraph } from './types.js';

export class Pipeline {
  private config: VceaConfig;
  private observer: RepositoryObserver;
  private intelligence: ChangeIntelligenceEngine;
  private compression: MemoryCompressionEngine;
  private graph: ContextGraphEngine;
  private tracking: DevelopmentTrackingEngine;
  private contextBuilder: AgentContextBuilder;
  knowledge: KnowledgeBrain;
  private research: ResearchEngine;
  private evaluator: QualityEvaluator;
  private benchmarker: CompressionBenchmarker;

  constructor(config: VceaConfig) {
    this.config = config;
    this.observer = new RepositoryObserver(config);
    this.intelligence = new ChangeIntelligenceEngine();
    this.compression = new MemoryCompressionEngine(config.retention);
    this.graph = new ContextGraphEngine(config);
    this.tracking = new DevelopmentTrackingEngine(config.outputDir);
    this.contextBuilder = new AgentContextBuilder(config);
    this.knowledge = new KnowledgeBrain(config.outputDir);
    this.research = new ResearchEngine(config.outputDir);
    this.evaluator = new QualityEvaluator();
    this.benchmarker = new CompressionBenchmarker(config.outputDir);
  }

  async run(): Promise<PipelineResult> {
    const events = await this.observer.poll();
    const classified = this.intelligence.classify(events);
    const memory = this.compression.compress(classified);
    const ctxGraph = this.graph.build(classified, memory);
    const track = this.tracking.generate(memory, ctxGraph);
    const contextPackages = this.contextBuilder.build(memory, ctxGraph, track);
    const newKnowledge = this.knowledge.ingestFromPipeline(memory, ctxGraph);

    const handoff = this.contextBuilder.buildHandoff(
      'vcea', 'next', memory, ctxGraph, track
    );
    this.contextBuilder.writeHandoff('vcea', 'next', memory, ctxGraph, track);

    const cacheKey = this.config.repoPath;
    const contextDiff = this.contextBuilder.computeDiff(cacheKey, { memory, graph: ctxGraph, track });

    const evaluation = this.evaluator.evaluate(cacheKey, memory);

    const benchmark = this.benchmarker.runBenchmark(
      memory.stats.compressionStrategy,
      memory.stats.originalTokens,
      memory.stats.compressedTokens,
      evaluation.overallScore,
      0,
      { strategy: memory.stats.compressionStrategy }
    );

    return {
      observer: events,
      intelligence: classified,
      compression: memory,
      graph: ctxGraph,
      tracking: track,
      contextPackages,
      handoff,
      contextDiff: contextDiff || undefined,
      knowledge: newKnowledge,
      evaluation,
      benchmark,
    };
  }

  async watch(onUpdate: (result: PipelineResult) => void): Promise<void> {
    this.observer.startWatching(async (events) => {
      const classified = this.intelligence.classify(events);
      const memory = this.compression.compress(classified);
      const ctxGraph = this.graph.build(classified, memory);
      const track = this.tracking.generate(memory, ctxGraph);
      const contextPackages = this.contextBuilder.build(memory, ctxGraph, track);
      const newKnowledge = this.knowledge.ingestFromPipeline(memory, ctxGraph);
      const cacheKey = this.config.repoPath;
      const evaluation = this.evaluator.evaluate(cacheKey, memory);

      onUpdate({
        observer: events, intelligence: classified, compression: memory,
        graph: ctxGraph, tracking: track, contextPackages,
        knowledge: newKnowledge, evaluation,
      });
    });
  }

  stopWatch(): void { this.observer.stopWatching(); }

  getGraph(): ContextGraph { return this.graph.load(); }
  getKnowledgeBrain(): KnowledgeBrain { return this.knowledge; }
  getResearchEngine(): ResearchEngine { return this.research; }
  getBenchmarker(): CompressionBenchmarker { return this.benchmarker; }
  getEvaluator(): QualityEvaluator { return this.evaluator; }
  getContextBuilder(): AgentContextBuilder { return this.contextBuilder; }

  queryGraph(query: Parameters<ContextGraphEngine['query']>[0]): ReturnType<ContextGraphEngine['query']> {
    return this.graph.query(query);
  }

  analyzeImpact(nodeId: string): ReturnType<ContextGraphEngine['analyzeImpact']> {
    return this.graph.analyzeImpact(nodeId);
  }

  findCircularDeps(): ReturnType<ContextGraphEngine['findCircularDeps']> {
    return this.graph.findCircularDeps();
  }

  getCentrality(): ReturnType<ContextGraphEngine['getCentrality']> {
    return this.graph.getCentrality();
  }

  advanceSprint(): void { this.tracking.advanceSprint(); }
}
