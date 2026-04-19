# Memory: architecture/database-terminology

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Overview

Standard terminology for database types across all CLI projects. When these terms are used, the meaning is explicit.

---

## Database Type Terminology

| Term | Meaning | Example Path |
|------|---------|--------------|
| **Root DB** | Global registry, settings, app list, counters | `data/aibridge.db`, `data/gsearch.db` |
| **Settings DB** | Global configuration (seeded + user) | Inside Root DB or `data/{app}/settings/config.db` |
| **App DB** | Application-scoped metadata | `data/{appName}/search.db` |
| **Session DB** | Per-session isolated storage | `data/{appName}/ai/chat/001-{id}.db` |
| **Cache DB** | Cached results with TTL | `data/{appName}/rag/cache/search/001-{slug}.db` |
| **Document DB** | RAG document chunks + embeddings | `data/{appName}/rag/documents/001-{id}.db` |

---

## AI Bridge Example (Complete Structure)

```
data/
├── aibridge.db                                    ← ROOT DB
│   ├── Settings table (seeded from config.seed.json)
│   ├── Applications table (app registry)
│   ├── Counters table (sequence tracking)
│   └── DbRegistry table (all child DBs)
│
└── myproject/                                     ← APP FOLDER
    │
    ├── search.db                                  ← APP DB (search metadata)
    │   ├── SearchLog table
    │   └── CacheSettings table
    │
    ├── rag/
    │   ├── cache/
    │   │   └── search/
    │   │       ├── 001-go-patterns-abc123.db      ← CACHE DB
    │   │       └── 002-react-hooks-def456.db
    │   │
    │   └── documents/
    │       ├── 001-readme.db                      ← DOCUMENT DB
    │       └── 002-main-go.db
    │
    ├── ai/
    │   └── chat/
    │       ├── 001-session-xyz.db                 ← SESSION DB
    │       │   ├── SessionMeta table
    │       │   ├── Messages table
    │       │   └── ToolCalls table
    │       └── 002-session-abc.db
    │
    └── settings/
        └── config.db                              ← SETTINGS DB (app-level override)
```

---

## GSearch Example

```
data/
├── gsearch.db                                     ← ROOT DB
│   ├── Settings table
│   ├── Counters table
│   └── DbRegistry table
│
└── searches/
    ├── search.db                                  ← APP DB (search history)
    │
    └── cache/
        ├── 001-ai-tools.db                        ← CACHE DB
        └── 002-golang-patterns.db
```

---

## BRun Example

```
data/
├── brun.db                                        ← ROOT DB
│   ├── Settings table
│   └── Profiles table
│
└── runs/
    ├── 001-backend-build.db                       ← SESSION DB (build run)
    │   ├── BuildRun table
    │   ├── BuildErrors table
    │   └── AssetOperations table
    └── 002-frontend-build.db
```

---

## Nexus Flow Example

```
data/
├── nexusflow.db                                   ← ROOT DB
│   ├── Settings table
│   ├── Pipelines table
│   └── Counters table
│
└── workflows/
    ├── pipeline-001/
    │   ├── executions/
    │   │   ├── 001-exec-abc.db                    ← SESSION DB (execution)
    │   │   └── 002-exec-def.db
    │   └── checkpoints/
    │       └── 001-checkpoint.db                  ← CACHE DB
    └── pipeline-002/
```

---

## Quick Reference Card

| When You Say... | You Mean This DB |
|-----------------|------------------|
| "Root DB" | `data/{cli}.db` |
| "Settings DB" | Settings table in Root DB or `settings/config.db` |
| "App DB" | `data/{appName}/search.db` or similar |
| "Session DB" | `data/{appName}/ai/chat/{seq}-{id}.db` |
| "Cache DB" | `data/{appName}/rag/cache/search/{seq}-{slug}.db` |
| "Document DB" | `data/{appName}/rag/documents/{seq}-{id}.db` |

---

## Sequence Numbering

All child DBs use 3-digit sequence prefixes tracked in Root DB:

- `001-`, `002-`, `003-` ... `999-`
- Counter stored in `Counters` table
- Enables easy sorting and navigation

---

*Explicit terminology = No confusion.*
