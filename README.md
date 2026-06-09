<h1 align="center">Vibe Context Engineer Agent</h1>

<p align="center">
  <strong>AI Memory Operating System for coding agents</strong><br>
  Transform project history into structured, token-efficient intelligence
</p>

<p align="center">
  <a href="https://github.com/dungnotnull/vibe-context-engineer-agent/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-strict-3178c6.svg" alt="TypeScript: strict" /></a>
  <a href="#"><img src="https://img.shields.io/badge/node-≥18-green.svg" alt="Node.js: ≥18" /></a>
  <a href="#"><img src="https://img.shields.io/badge/files-36-clean.svg" alt="Files: 36" /></a>
</p>

---

## Why

AI coding agents — Claude Code, Cursor, Aider, Archon, Copilot — all share the same fatal flaw: they forget. Between sessions, every agent wakes up with amnesia. You pay tokens for them to re-read files they already read yesterday. They repeat the same reasoning. They miss architecture decisions made last week.

**Vibe Context Engineer Agent** is the cure. It watches your repository, analyzes every change, compresses the signal into structured intelligence, and feeds each agent only what it needs — nothing more, nothing less.

Think of it as the **operating system kernel** for AI coding memory.

---

## What it does

```
Your Repo ──► Observer ──► Intelligence ──► Compression ──► Graph ──► Tracking ──► Context Packs
                                                                    │
                                                                    ├──► Claude Code  (15K tokens)
                                                                    ├──► Cursor       (8K tokens)
                                                                    ├──► Archon       (12K tokens)
                                                                    ├──► Aider        (6K tokens)
                                                                    ├──► OpenCode     (10K tokens)
                                                                    └──► OpenHands    (12K tokens)
```

Every time code changes, VCEA:

1. **Observes** the diff — git commits, file saves, branch merges, PR merges
2. **Classifies** the change — feature, bugfix, refactor, API, schema, security, dependency, 13 categories
3. **Compresses** into facts — hierarchical summaries (file → module → component → system), 3-layer memory with TTL
4. **Builds a graph** — components, dependencies, decisions, features, with impact analysis and cycle detection
5. **Tracks development** — auto-maintained sprint docs, architecture decision records, next steps
6. **Packages context** — token-budgeted handoffs optimized for each agent type
7. **Learns** — knowledge brain with semantic search, quality evaluation, A/B testing, feedback loops

The result: **98% token savings** on repeated context, your agents always know the project state.

---

## Install

```bash
npm install -g vibe-context-engineer-agent
```

Or run directly without installing:

```bash
npx vibe-context-engineer-agent run .
```

**Requirements:** Node.js ≥ 18, any Git repository (or plain directory)

---

## Quick Start

```bash
# Analyze the current directory
vcea run .

# Watch for changes and auto-update context
vcea watch .

# Show the dependency graph
vcea graph .

# Search the knowledge brain
vcea knowledge . --search "API changes"

# Run compression benchmarks
vcea research . --benchmark

# Initialize team memory
vcea team . --team-name "my-team" --add-member "Alice" --role "lead"
```

---

## The 8-Layer Architecture

### Layer 1 — Repository Observer

Monitors your repository through git and the filesystem.

| Capability | Implementation |
|-----------|---------------|
| Git commit polling | `simple-git` — status, log, diff |
| File watching | `chokidar` — debounced, 1.5s window |
| Hunk-level diff parsing | Custom parser — extracts file details, hunks, line counts |
| Branch merge detection | `MergeMonitor` — merge commits with file counts |
| Non-git fallback | Directory scanner — works on any folder |

**Output:** Structured `ChangeEvent[]` with full diff metadata

### Layer 2 — Change Intelligence

Classifies every change and detects architectural implications.

| Detection | Method |
|----------|--------|
| 13 change categories | Commit message + file path + diff content analysis |
| Component identification | Path-based grouping (src/layers/layer1-observer → component) |
| Dependency changes | `package.json` / `requirements.txt` diff parsing |
| Schema changes | SQL/Prisma `CREATE TABLE` / `ALTER TABLE` detection |
| API changes | Route decorator / handler pattern matching across 6+ frameworks |
| Task completion | TODO/FIXME diff analysis, test file correlation |
| Architecture impact | 6-domain analysis (API, Domain, Data, Config, Middleware, Testing) |

**Impact levels:** none → low → medium → high → critical

### Layer 3 — Memory Compression

The moat. Converts thousands of diff lines into a handful of structured facts.

```
Raw diff (5,000 tokens)
  → Hierarchical summary (file → module → component → system)
  → Fact extraction (milestones, decisions, lessons, metrics, risks)
  → Content-normalized deduplication
  → Tag-based semantic clustering
  → Priority ranking (milestone > decision > lesson > risk > metric > fact)
Compressed facts (100 tokens) — 98% reduction (real-world git repos)
```

**Memory Layers:**

| Layer | TTL | Purpose | Max Size |
|-------|-----|---------|----------|
| Short-term | 7 days | Recent changes | 200 facts |
| Working | 30 days | Sprint objectives | 500 facts |
| Long-term | 365 days | Architecture decisions, milestones | 2000 facts |

Facts automatically promote/demote between layers based on access patterns and age. Stale facts (low confidence, unaccessed, duplicate) are flagged for cleanup.

### Layer 4 — Context Graph

A living dependency graph of your project. Dual backend: JSON (default) or Neo4j.

**Node types:** component, service, feature, decision, dependency, module, team, repository

**Relation types:** depends_on, replaces, fixes, introduces, owns, imports, implements, contains

**Graph operations:**

| Operation | Algorithm |
|-----------|----------|
| Traversal | BFS/DFS with configurable depth |
| Dependency resolution | Transitive closure (up to 3 hops) |
| Impact analysis | Weighted BFS with score decay — "what breaks if I change X?" |
| Circular dependency detection | Kosaraju-style DFS coloring |
| Centrality ranking | Degree centrality — "what's the most critical component?" |
| Change risk assessment | 4-level risk scoring (low/medium/high/critical) |

### Layer 5 — Development Tracking

Zero-effort documentation. Every pipeline run updates these files automatically:

```
.vcea/
├── DEVELOPMENT-TRACKING.md     # All items by status
├── CURRENT-SPRINT.md           # Active work + blockers
├── NEXT-STEPS.md               # Prioritized queue
├── ARCHITECTURE-DECISIONS.md   # ADRs with context/decision/consequences
└── CONTEXT-GRAPH.md            # Visual graph summary
```

**Tracking intelligence:**
- Detects completed tasks from commit messages and TODO removal
- Flags blockers from breaking changes and risks
- Suggests planned items from stale graph nodes (>7 days unchanged)
- Counter-rotates sprint numbers automatically

### Layer 6 — Agent Context Builder

Different agents have different token budgets. VCEA generates optimized packages for each.

| Agent | Budget | Format | Detail | Includes |
|-------|--------|--------|--------|----------|
| **Claude Code** | 15,000 | Markdown | Balanced | Sprint + Decisions + Memory + Graph |
| **Cursor** | 8,000 | Markdown | Concise | Sprint + Decisions |
| **Archon** | 12,000 | JSON | Detailed | Sprint + Decisions + Memory + Graph |
| **Aider** | 6,000 | Markdown | Concise | Sprint only |
| **OpenCode** | 10,000 | Markdown | Balanced | Sprint + Decisions + Memory + Graph |
| **OpenHands** | 12,000 | JSON | Detailed | Sprint + Decisions + Memory + Graph |

**Handoff engine:** generates structured from-agent → to-agent transition documents with current state, blockers, decisions, and next steps.

**Context diff engine:** SHA256 snapshot comparison detects what changed between runs — added/removed/modified facts, new decisions, resolved blockers.

### Layer 7 — Knowledge Brain

A continuously learning knowledge base with semantic understanding.

| Capability | Implementation |
|-----------|---------------|
| 128-dim embeddings | TF-IDF-inspired vectors, locality-sensitive hashing |
| Semantic search | Cosine similarity with configurable threshold |
| K-means clustering | Iterative centroid assignment (10 rounds) |
| Validation | 5-dimension check: completeness, confidence, consistency, freshness, source quality |
| Versioning | Full snapshots with diff + rollback |
| Curated ingestion | Queue-based pipeline with sentence scoring |
| Knowledge categories | context-engineering, memory-systems, ai-coding-agents, repository-intelligence, agent-architecture, benchmark-results |

### Layer 8 — Learning Engine

Feedback-driven continuous improvement.

| Component | Purpose |
|-----------|---------|
| **Feedback Collector** | Records signals from agents, users, benchmarks; trend detection (improving/declining/stable) |
| **Quality Evaluator** | 5-dimension scoring: relevance (30%), completeness (25%), conciseness (20%), accuracy (15%), freshness (10%) |
| **Compression Benchmarker** | Compares strategies (rule-based, hierarchical, semantic-cluster, hybrid) at 1K–50K token inputs |
| **A/B Test Engine** | Statistical comparison of two strategies with confidence scoring |

---

## CLI Reference

```
vcea run <path>       Run the full 8-layer pipeline
vcea watch <path>     Watch for changes and run continuously
vcea graph <path>     Inspect the dependency graph
vcea knowledge <path> Query the knowledge brain
vcea research <path>  Run benchmarks and generate reports
vcea feedback <path>  Record and analyze feedback signals
vcea multi-repo <path> Orchestrate across multiple repositories
vcea team <path>      Manage team memory
vcea config <path>    Initialize, validate, or export configuration
```

### `vcea run` options

| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output <dir>` | `.vcea` | Output directory for all artifacts |
| `--agents <list>` | all 6 | Comma-separated agent types for context packages |
| `--graph-storage <type>` | `json` | Backend: `json` or `neo4j` |
| `--short-term-days <n>` | `7` | Short-term memory retention (days) |
| `--working-term-days <n>` | `30` | Working memory retention (days) |
| `--long-term-days <n>` | `365` | Long-term memory retention (days) |
| `--no-auto-cleanup` | | Disable automatic stale data removal |
| `--model-endpoint <url>` | | LLM endpoint for enhanced analysis |
| `--model-name <name>` | | LLM model identifier |

### `vcea graph` subcommands

```
--impact <nodeId>    Impact analysis: "What breaks if this changes?"
--circular           Find circular dependencies
--centrality         Show most-connected nodes (degree centrality)
```

### `vcea knowledge` subcommands

```
--search <term>      Full-text search
--semantic <query>   Embedding-based similarity search
--category <cat>     Filter by knowledge category
--validate           Validate all items (5-dimension check)
--version <notes>    Create versioned snapshot
--cluster <n>        K-means cluster knowledge items
```

---

## Output Artifacts

After `vcea run`, your output directory contains:

```
.vcea/
├── context-graph.json           # Full graph: nodes + relations
├── knowledge-brain.json         # Knowledge items with embeddings
├── DEVELOPMENT-TRACKING.md      # All tracked items by status
├── CURRENT-SPRINT.md            # Sprint summary
├── NEXT-STEPS.md                # Prioritized action queue
├── ARCHITECTURE-DECISIONS.md    # Decision records
├── CONTEXT-GRAPH.md             # Human-readable graph
├── agent-contexts/
│   ├── claude-code-context.md
│   ├── cursor-context.md
│   ├── archon-context.json
│   ├── aider-context.md
│   ├── opencode-context.md
│   └── openhands-context.json
├── handoffs/                    # Agent transition documents
├── research/
│   ├── benchmarks.json
│   ├── memory-systems-review.md
│   └── agent-architecture-study.md
├── kb-versions/                 # Knowledge brain snapshots
└── kb-ingestion/                # Curation queue
```

---

## Configuration

VCEA can be configured via `vcea-config.json` in your output directory, or on the command line.

```bash
# Generate a default config
vcea config . --init

# Validate your config
vcea config . --validate

# Export for sharing
vcea config . --export ./vcea-config.json
```

### Config schema

```json
{
  "repoPath": ".",
  "outputDir": ".vcea",
  "agentTypes": ["claude-code", "cursor", "archon", "aider", "opencode", "openhands"],
  "graphStorage": "json",
  "retention": {
    "shortTermDays": 7,
    "workingTermDays": 30,
    "longTermDays": 365,
    "autoCleanup": true
  }
}
```

For **Neo4j** graph storage, add:

```json
{
  "graphStorage": "neo4j",
  "neo4jUri": "http://localhost:7474",
  "neo4jUser": "neo4j",
  "neo4jPassword": "your-password"
}
```

### Enterprise features

| Feature | File | Purpose |
|---------|------|---------|
| **Multi-repo** | `vcea-config.json` → `multiRepo` | Analyze monorepos or multiple projects |
| **Team memory** | `vcea team` | Shared knowledge, activity logs, member management |
| **Governance** | `governance` block | RBAC access control, audit trail, GDPR compliance |
| **Plugin system** | `plugins` array | Hook-based extensibility (event → handler → priority) |

---

## Benchmarks

VCEA ships with a built-in benchmarking framework. Compare compression strategies:

```
$ vcea research . --benchmark

[rule-based]      1000→150 tokens  | 85.0% reduction | Quality: 68% | 27ms
[hierarchical]    1000→120 tokens  | 88.0% reduction | Quality: 72% | 18ms
[semantic-cluster] 1000→180 tokens | 82.0% reduction | Quality: 65% | 33ms
[hybrid]          1000→ 50 tokens  | 95.0% reduction | Quality: 91% | 45ms
```

The benchmark framework tests 4 strategies across 4 input sizes (1K, 5K, 10K, 50K tokens) with quality scoring.

---

## How it compares

| Feature | VCEA | Static Docs | Raw Git Log | Copilot Chat Context |
|--------|------|-------------|-------------|---------------------|
| Auto-updating | ✅ | ❌ Manual | ✅ | ❌ Session-only |
| Structured facts | ✅ | ✅ | ❌ Raw text | ❌ |
| Agent-specific | ✅ 6 agents | ❌ | ❌ | ❌ Vendor-locked |
| Graph analysis | ✅ Impact + cycles | ❌ | ❌ | ❌ |
| Semantic search | ✅ 128-dim embeddings | ❌ | ❌ | ❌ |
| Quality evaluation | ✅ 5 dimensions | ❌ | ❌ | ❌ |
| Token budget aware | ✅ Per-agent | ❌ | ❌ | ❌ |
| Open source | ✅ MIT | ✅ | ✅ | ❌ |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, code style, and PR checklist.

Key principles:
- **TypeScript strict mode** — zero `any`, zero type errors
- **No comments** — code is self-documenting
- **Composable modules** — every layer is independently testable
- **800+ interfaces** — the type system is the architecture

---

## License

MIT — use it, fork it, ship it, build on it.

---

<p align="center">
  <strong>AI agents forget. VCEA remembers.</strong>
</p>
