# Memory: architecture/split-db-architecture

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/06-split-db-architecture/00-overview.md`

---

## Overview

Hierarchical SQLite database pattern (v3.0) with multi-layer support (2-4 layers), structured logging via Go `slog`, and zip-based import/export for portability.

**CRITICAL:** All field names use **PascalCase** (no underscores).

---

## Database Terminology

| Term | Meaning | Example Path |
|------|---------|--------------|
| **Root DB** | Global registry, settings, app list | `data/aibridge.db` |
| **App DB** | Application-scoped metadata | `data/{appName}/search.db` |
| **Company DB** | Company-scoped SEO training/registry | `data/{appName}/rag/seo/{company}.db` |
| **Session DB** | Per-session isolated storage | `data/{appName}/rag/chat/{company}/001-{id}.db` |
| **Cache DB** | Cached results with TTL | `data/{appName}/rag/cache/search/001-{slug}.db` |

---

## AI Bridge Path Structure (v3.0)

```
data/
├── aibridge.db                                # ROOT DB (settings, app registry, counters)
│
└── myproject/                                 # APP FOLDER
    ├── search.db                              # APP DB (search metadata)
    │
    └── rag/
        ├── cache/search/
        │   └── 001-golang-patterns.db         # CACHE DB (search results, 5-day TTL)
        │
        ├── code/
        │   └── {company}/
        │       └── 001-{task-id}.db           # CODE DB (per task)
        │
        ├── chat/
        │   └── {company}/
        │       └── 001-{session-id}.db        # CHAT DB (per session)
        │
        └── seo/
            ├── {company-slug}.db              # COMPANY ROOT DB (profile, training)
            │
            ├── blog/
            │   └── {company}/
            │       └── 001-{blog-slug}.db     # BLOG DB (per post)
            │
            ├── faq/
            │   └── {company}/
            │       └── 001-{faq-slug}.db      # FAQ DB (per content)
            │
            └── paragraph/
                └── {company}/
                    └── 001-{para-slug}.db     # PARA DB (per content)
```

---

## API → Database Mapping (AI Bridge)

| Endpoint | Target DB |
|----------|-----------|
| `POST /api/v1/chat/sessions` | Creates `data/{app}/rag/chat/{company}/{seq}-{id}.db` |
| `POST /api/v1/chat/sessions/:id/messages` | Writes to `data/{app}/rag/chat/{company}/{seq}-{id}.db` → Messages + ToolCalls |
| `POST /api/v1/code/tasks` | Creates `data/{app}/rag/code/{company}/{seq}-{task-id}.db` |
| `POST /api/v1/seo/{company}/blogs` | Creates `data/{app}/rag/seo/blog/{company}/{seq}-{slug}.db` |
| `POST /api/v1/seo/{company}/faq` | Creates `data/{app}/rag/seo/faq/{company}/{seq}-{slug}.db` |
| `POST /api/v1/seo/{company}/para` | Creates `data/{app}/rag/seo/paragraph/{company}/{seq}-{slug}.db` |

---

## CLI Database Paths

| CLI | Root DB | Session/Cache Path |
|-----|---------|-------------------|
| AI Bridge | `data/aibridge.db` | `data/{app}/rag/chat/{company}/{seq}-{id}.db` |
| GSearch | `data/gsearch.db` | `data/searches/cache/{seq}-{slug}.db` |
| BRun | `data/brun.db` | `data/runs/{seq}-{id}.db` |
| Nexus Flow | `data/nexusflow.db` | `data/workflows/{pipeline}/executions/{seq}-{id}.db` |

---

## Key Features

| Feature | Description |
|---------|-------------|
| Multi-layer | 2-4 layer depth based on complexity |
| Company-scoped | All content organized by company |
| Import/Export | Zip file support for portability |
| Logging | Structured JSON logging via `slog` |
| Counters | Sequential numbering (001-, 002-) tracked in Root DB |
| TTL | Configurable cache expiration (default 5 days) |
| PascalCase | All field names use PascalCase |

---

## Related Files

- `spec/06-split-db-architecture/00-overview.md` (full spec)
- `spec/06-split-db-architecture/01-cli-examples.md` (concrete examples)
- `spec/22-ai-bridge-cli/01-backend/26-database-paths-reference.md` (path reference)
- `.lovable/memories/training/09-database-naming-conventions.md` (naming rules)
