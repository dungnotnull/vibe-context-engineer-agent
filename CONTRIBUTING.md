# Contributing

## Getting Started

```bash
git clone <repo-url>
cd vibe-context-engineer-agent
npm install
npm run build
```

## Development

```bash
npm run typecheck   # Type checking (strict mode)
npm run dev -- run . # Run against current directory
```

## Project Structure

```
src/
├── core/           # Pipeline, types, shared engines
│   ├── types.ts               # All TypeScript interfaces
│   ├── pipeline.ts            # 8-layer orchestrator
│   ├── research-engine.ts     # Phase 0: benchmarks
│   ├── multi-repo-orchestrator.ts
│   ├── team-memory.ts
│   ├── governance.ts
│   ├── plugin-system.ts
│   └── config-manager.ts
├── cli.ts          # Commander.js CLI (9 commands)
└── layers/
    ├── layer1-observer/    # Git + file monitoring
    ├── layer2-change-intelligence/
    ├── layer3-memory-compression/
    ├── layer4-context-graph/
    ├── layer5-dev-tracking/
    ├── layer6-agent-context-builder/
    ├── layer7-knowledge-brain/
    └── layer8-learning-engine/
```

## Code Style

- TypeScript strict mode enabled
- ESM modules (NodeNext resolution)
- No comments — code should be self-documenting
- Keep modules focused and composable
- Every layer is independently testable

## Pull Requests

1. Run `npm run typecheck` — must pass with zero errors
2. Run `npm run build` — must succeed
3. Run `npm run dev -- run .` — pipeline must complete without errors
4. Update CHANGELOG.md with your changes

## Issues

Use the issue tracker for bugs and feature requests.
