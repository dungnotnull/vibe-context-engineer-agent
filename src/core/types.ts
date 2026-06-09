// ── Core File Change Types ──
export interface FileChange {
  filePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
  additions: number;
  deletions: number;
}

export interface HunkDetail {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
}

export interface FileDiffDetail {
  filePath: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  hunks: HunkDetail[];
  additions: number;
  deletions: number;
  language: string;
}

export interface StructuredDiff {
  commit?: string;
  author?: string;
  timestamp?: string;
  message?: string;
  files: FileChange[];
  fileDetails: FileDiffDetail[];
  rawDiff: string;
  summary: DiffSummary;
}

export interface DiffSummary {
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  fileTypes: Record<string, number>;
  touchedModules: string[];
  semanticSummary: string;
  keyChanges: string[];
}

// ── Observer Layer ──
export interface ChangeEvent {
  id: string;
  type: 'commit' | 'file-save' | 'branch-merge' | 'pr-merge' | 'initial-scan';
  timestamp: string;
  diffs: StructuredDiff[];
  summary: string;
  branch?: string;
  prNumber?: number;
  prTitle?: string;
}

export interface BranchMergeEvent {
  source: string;
  target: string;
  commitHash: string;
  author: string;
  timestamp: string;
  message: string;
  filesChanged: number;
}

export interface ProMergeEvent {
  prNumber: number;
  title: string;
  author: string;
  mergedAt: string;
  sourceBranch: string;
  targetBranch: string;
  commitHash: string;
}

// ── Change Intelligence Layer ──
export type ChangeCategory =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'config'
  | 'dependency'
  | 'schema'
  | 'api'
  | 'security'
  | 'performance'
  | 'breaking'
  | 'unknown';

export interface ClassifiedChange {
  event: ChangeEvent;
  categories: ChangeCategory[];
  affectedComponents: string[];
  affectedDependencies: string[];
  schemaChanges: SchemaChange[];
  apiChanges: ApiChange[];
  isBreaking: boolean;
  complexity: 'low' | 'medium' | 'high';
  taskCompletion?: TaskCompletionResult;
  architectureImpact?: ArchitectureImpact;
}

export interface SchemaChange {
  file: string;
  type: 'added' | 'removed' | 'modified';
  entity: string;
  field?: string;
}

export interface ApiChange {
  file: string;
  type: 'added' | 'removed' | 'modified' | 'signature-change';
  endpoint?: string;
  method?: string;
  oldSignature?: string;
  newSignature?: string;
}

export interface TaskCompletionResult {
  detectedTasks: DetectedTask[];
  completedTasks: string[];
  partialTasks: string[];
  abandonedTasks: string[];
}

export interface DetectedTask {
  description: string;
  status: 'completed' | 'partial' | 'abandoned';
  confidence: number;
  sourceHint: string;
  filesInvolved: string[];
}

export interface ArchitectureImpact {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  affectedArchitectureDomains: string[];
  newPatterns: string[];
  deprecatedPatterns: string[];
  structuralChanges: string[];
}

// ── Memory Compression Layer ──
export type MemoryFactType = 'fact' | 'decision' | 'milestone' | 'lesson' | 'metric' | 'risk';

export interface MemoryFact {
  id: string;
  type: MemoryFactType;
  content: string;
  confidence: number;
  timestamp: string;
  source: string;
  tags: string[];
  ttl?: number; // time-to-live in milliseconds, after which fact is considered stale
  accessCount: number;
  lastAccessed: string;
}

export interface HierarchicalSummary {
  level: 'file' | 'module' | 'component' | 'system';
  scope: string;
  summary: string;
  keyPoints: string[];
  childSummaries: HierarchicalSummary[];
  stats: { files: number; additions: number; deletions: number };
}

export interface MemoryLayer {
  type: 'short-term' | 'working' | 'long-term';
  facts: MemoryFact[];
  ttlMs: number;
  maxSize: number;
  lastCleaned: string;
}

export interface CompressedMemory {
  facts: MemoryFact[];
  hierarchicalSummary: HierarchicalSummary | null;
  memoryLayers: MemoryLayer[];
  staleFacts: MemoryFact[];
  stats: CompressedMemoryStats;
}

export interface CompressedMemoryStats {
  originalTokens: number;
  compressedTokens: number;
  reductionRatio: number;
  factsByType: Record<string, number>;
  stalenessRatio: number;
  compressionStrategy: string;
}

// ── Context Graph Layer ──
export interface GraphNode {
  id: string;
  type: 'component' | 'service' | 'feature' | 'decision' | 'dependency' | 'module' | 'team' | 'repository';
  label: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface GraphRelation {
  source: string;
  target: string;
  type: 'depends_on' | 'replaces' | 'fixes' | 'introduces' | 'owns' | 'imports' | 'implements' | 'contains';
  metadata?: Record<string, unknown>;
  weight: number;
}

export interface ContextGraph {
  nodes: GraphNode[];
  relations: GraphRelation[];
  lastUpdated: string;
  version: number;
}

export interface GraphQuery {
  matchNodes: { type?: string; labelPattern?: string; metadataFilter?: Record<string, unknown> };
  matchRelations?: { types?: string[]; minWeight?: number };
  traversalDepth: number;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  relations: GraphRelation[];
  paths: GraphPath[];
}

export interface GraphPath {
  nodes: string[];
  relations: string[];
  length: number;
}

export interface ImpactAnalysis {
  sourceNode: string;
  impactedNodes: ImpactedNode[];
  totalImpactScore: number;
  criticalPaths: GraphPath[];
}

export interface ImpactedNode {
  nodeId: string;
  label: string;
  distance: number;
  impactScore: number;
  relationChain: string[];
}

// ── Development Tracking Layer ──
export interface DevelopmentTrack {
  completed: TrackItem[];
  inProgress: TrackItem[];
  planned: TrackItem[];
  blockers: TrackItem[];
  decisions: TrackItem[];
  lastUpdated: string;
  sprintNumber: number;
}

export interface TrackItem {
  id: string;
  content: string;
  addedAt: string;
  confidence: number;
  source: string;
  category: string;
}

export interface Sprint {
  number: number;
  startDate: string;
  endDate: string;
  goals: string[];
  velocity: number;
  completedItems: number;
}

export interface ProgressReport {
  period: string;
  completedCount: number;
  inProgressCount: number;
  plannedCount: number;
  blockerCount: number;
  decisionCount: number;
  velocityTrend: number[];
  highlights: string[];
}

// ── Agent Context Builder Layer ──
export interface AgentProfile {
  name: string;
  maxTokens: number;
  preferences: {
    detailLevel: 'concise' | 'balanced' | 'detailed';
    includeGraph: boolean;
    includeHistory: boolean;
    format: 'markdown' | 'json' | 'yaml';
  };
}

export interface AgentContextPackage {
  agent: string;
  maxTokens: number;
  content: string;
  generatedAt: string;
  layers: string[];
  tokenUsage: number;
  compressionRatio: number;
}

export interface HandoffPackage {
  fromAgent: string;
  toAgent: string;
  summary: string;
  currentState: string;
  blockers: string[];
  decisions: string[];
  nextSteps: string[];
  generatedAt: string;
}

export interface ContextDiff {
  previousHash: string;
  currentHash: string;
  addedFacts: MemoryFact[];
  removedFacts: MemoryFact[];
  modifiedFacts: { before: MemoryFact; after: MemoryFact }[];
  newDecisions: string[];
  resolvedBlockers: string[];
}

// ── Knowledge Brain Layer ──
export interface KnowledgeItem {
  id: string;
  source: string;
  sourceType: 'research-paper' | 'blog' | 'documentation' | 'pipeline' | 'benchmark' | 'manual';
  publicationDate?: string;
  category: KnowledgeCategory;
  summary: string;
  keyFindings: string[];
  confidenceScore: number;
  relevanceScore: number;
  benchmarkImpact?: string;
  embedding?: number[];
  version: number;
  validatedAt?: string;
  validatedBy?: string;
  curated: boolean;
  references: string[];
  citations: number;
}

export type KnowledgeCategory =
  | 'context-engineering'
  | 'memory-systems'
  | 'ai-coding-agents'
  | 'repository-intelligence'
  | 'agent-architecture'
  | 'benchmark-results'
  | 'lesson-learned'
  | 'architectural-pattern';

export interface KnowledgeValidationResult {
  itemId: string;
  isValid: boolean;
  issues: string[];
  suggestedUpdates: string[];
  validatedAt: string;
}

export interface KnowledgeVersion {
  version: number;
  items: KnowledgeItem[];
  releasedAt: string;
  releaseNotes: string;
  benchmarkScore?: number;
}

// ── Learning Engine Layer ──
export interface FeedbackSignal {
  id: string;
  source: 'agent' | 'user' | 'benchmark' | 'auto';
  type: 'context-quality' | 'relevance' | 'completeness' | 'conciseness';
  score: number; // 0..1
  details: string;
  contextId: string;
  timestamp: string;
}

export interface QualityEvaluation {
  contextId: string;
  dimensions: {
    relevance: number;
    completeness: number;
    conciseness: number;
    accuracy: number;
    freshness: number;
  };
  overallScore: number;
  improvementSuggestions: string[];
  evaluatedAt: string;
}

export interface CompressionBenchmark {
  id: string;
  strategy: string;
  inputSize: number;
  outputSize: number;
  reductionRatio: number;
  qualityScore: number;
  latencyMs: number;
  settings: Record<string, unknown>;
  timestamp: string;
}

export interface ABTestResult {
  testId: string;
  variantA: { strategy: string; qualityScore: number; reductionRatio: number };
  variantB: { strategy: string; qualityScore: number; reductionRatio: number };
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  sampleSize: number;
  timestamp: string;
}

// ── Production Layer ──
export interface MultiRepoConfig {
  repos: RepoEntry[];
  baseDir: string;
}

export interface RepoEntry {
  path: string;
  name: string;
  role: string;
  branch?: string;
  watchEnabled: boolean;
}

export interface TeamMemory {
  id: string;
  teamName: string;
  members: TeamMember[];
  sharedKnowledge: KnowledgeItem[];
  sharedDecisions: TrackItem[];
  activityLog: TeamActivity[];
  lastSynced: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  repos: string[];
  joinedAt: string;
}

export interface TeamActivity {
  timestamp: string;
  memberId: string;
  repoPath: string;
  action: string;
  summary: string;
}

export interface GovernanceConfig {
  accessControl: AccessControl[];
  auditLog: AuditLogConfig;
  retention: RetentionPolicy;
  compliance: ComplianceConfig;
}

export interface AccessControl {
  resource: string;
  roles: string[];
  permissions: ('read' | 'write' | 'admin')[];
}

export interface AuditLogConfig {
  enabled: boolean;
  logPath: string;
  events: ('access' | 'modify' | 'delete' | 'export')[];
}

export interface RetentionPolicy {
  shortTermDays: number;
  workingTermDays: number;
  longTermDays: number;
  autoCleanup: boolean;
}

export interface ComplianceConfig {
  gdprEnabled: boolean;
  dataExportPath: string;
  anonymizationRules: string[];
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  hooks: PluginHook[];
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface PluginHook {
  event: string;
  handler: string;
  priority: number;
}

export interface ManagedConfig {
  repoPath: string;
  outputDir: string;
  watchMode: boolean;
  agentTypes: string[];
  graphStorage: 'json' | 'neo4j';
  neo4jUri?: string;
  neo4jUser?: string;
  neo4jPassword?: string;
  modelEndpoint?: string;
  modelName?: string;
  multiRepo?: MultiRepoConfig;
  governance?: GovernanceConfig;
  plugins?: Plugin[];
  retention: RetentionPolicy;
}

// ── Pipeline ──
export interface PipelineResult {
  observer: ChangeEvent[];
  intelligence: ClassifiedChange[];
  compression: CompressedMemory;
  graph: ContextGraph;
  tracking: DevelopmentTrack;
  contextPackages: AgentContextPackage[];
  handoff?: HandoffPackage;
  contextDiff?: ContextDiff;
  knowledge?: KnowledgeItem[];
  evaluation?: QualityEvaluation;
  benchmark?: CompressionBenchmark;
}

export type { ManagedConfig as VceaConfig };
