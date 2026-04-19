# Memory: features/ai-bridge/long-chain-command-system

**Updated:** 2026-02-05
**Version:** 1.0.0  

---

## Summary

AI Bridge is migrating from external agentic dependencies (like Quincoder) to an internal Long-Chain Command System. This new system will feature a command registry and a parallel execution engine, designed to replace external reasoning steps with internal, Go-based implementations. The goal is to achieve faster, more accurate results, with processing times for 100k documents targeted at <50ms, with a 92-97% recall rate. It aims to integrate long-chain suggestions directly into every query and conversation, with a strong emphasis on parallel processing for tasks like reading multiple files or URLs.

---

## Key Components

| Component | Purpose |
|-----------|---------|
| Command Registry | Manages built-in and custom command definitions |
| Step Executor | Implements 9 step types (ReadFile, ReadURL, Search, VectorQuery, Transform, Filter, Aggregate, Branch, Execute) |
| Parallel Engine | Concurrent execution of independent steps via worker pool |
| Dependency Resolver | DAG construction, topological sort, cycle detection |
| Progress Streamer | WebSocket streaming at `/ws/longchain/{id}` |

---

## Error Range

- **9970-9989**: Long-Chain Command System errors

---

## Database Tables

- `LongChainCommands`: Command definitions with trigger patterns
- `LongChainSteps`: Step configurations per command
- `LongChainExecutions`: Execution history and results

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Query Latency | <50ms for 100k documents |
| Recall Accuracy | 92-97% |
| Concurrent URLs | 20 parallel fetches |
| Concurrent Files | 50 parallel reads |

---

## Key References

- Specification: `spec/22-ai-bridge-cli/01-backend/50-long-chain-command-system.md`
- Plan: `.lovable/plan.md` (Phase 1)
