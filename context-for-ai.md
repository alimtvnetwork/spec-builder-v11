# context-for-ai.md

**Version:** 4.0.0  
**Updated:** 2026-09-19  
**Purpose:** Single-page AI onboarding for rapid context acquisition (~5 min read)

---

## 🚨 CRITICAL CONSTRAINT

**THIS IS A SPEC-ONLY REPOSITORY.**

| ❌ Never Do | ✅ Always Do |
|-------------|--------------|
| Implement code | Write specifications |
| Suggest "Implement X" | Suggest spec improvements |
| Generate source files | Generate documentation |

---

## 📍 Navigation

| Resource | Path | Purpose |
|----------|------|---------|
| **Memory Index** | `.ai-memory/memory/readme.md` | Core memory index |
| **What to Read** | `.ai-memory/memory/what-to-read.md` | Reading guidance for AI agents |
| **Strictly Avoid** | `.ai-memory/memory/strictly-avoid.md` | Prohibited operations and patterns |
| **Coding Guidelines** | `.ai-memory/coding-guidelines.md` | Grounded coding guidelines |
| **Master Plans Index** | `.ai-memory/plans/readme.md` | Plan tracking and roadmap |
| **Error Registry** | `02-spec/03-error-manage/03-error-code-registry/01-registry.md` | All error code ranges |

---

## 📐 Core Architectural Patterns

### 1. Split Database System (4-Tier SQLite)

All CLI tools use a standardized 4-tier database architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    SPLIT DB SYSTEM                      │
├──────────────┬──────────────┬──────────────┬───────────┤
│   SYSTEM     │    CONFIG    │   SESSION    │   CACHE   │
│  (Read-Only) │  (User Mods) │  (Ephemeral) │   (TTL)   │
├──────────────┼──────────────┼──────────────┼───────────┤
│ system.db    │ config.db    │ session.db   │ cache.db  │
│ Seeded data  │ User prefs   │ Runtime state│ API cache │
│ Never modify │ Migrations   │ Cleared/run  │ Auto-purge│
└──────────────┴──────────────┴──────────────┴───────────┘
```

**Key Rules:**
- System DB is seeded from embedded JSON, never modified at runtime
- Config DB uses versioned migrations with rollback support
- Session DB is cleared on application restart
- Cache DB auto-purges based on TTL

---

### 2. Seedable Configuration Pattern

All configuration follows a versioned lifecycle:

```
Embedded JSON → First Run Seed → User Modifications → Migration
     ↓                ↓                   ↓              ↓
  defaults.json   config.db v1      user changes    config.db v2
```

**Seeding Condition (Golden Rule):**
```
IF NOT EXISTS 
   OR (SeedVersion > StoredVersion AND IsUserModified == FALSE)
THEN seed the value
```

**Version Format:** `YYYYMMDD.N` (e.g., `20260204.1`)

---

### 3. Error Code Registry

All errors use numeric codes in assigned ranges:

| System | Range | Example |
|--------|-------|---------|
| General | 1000-1999 | `1001: Invalid configuration` |
| Spec Management | 2000-2999 | `2001: Spec parsing error` |
| GSearch CLI | 7000-7919 | `7001: Search provider unavailable` |
| BRun CLI | 7100-7599 | `7101: Build step failed` |
| Nexus Flow CLI | 8000-8349 | `8001: Workflow not found` |
| AI Bridge CLI | 9000-9999 | `9001: Model connection failed` |
| WP Plugin Builder | 10000-10499 | `10001: Template not found` |
| Spec Reverse CLI | 11000-11999 | `11001: AST extraction failed` |
| WP SEO Publish CLI | 12000-12599 | `12001: API timeout` |
| WP Plugin Publish | 13000-13499 | `13001: Authentication failure` |
| AI Transcribe CLI | 14000-14499 | `14001: Audio pipeline error` |
| Exam Manager | 14500-14999 | `14501: Question bank empty` |
| License Manager | 15000-15999 | `15001: License invalid` |

**Standard Error Envelope:**
```json
{
  "success": false,
  "error": {
    "code": 7001,
    "message": "Search provider unavailable",
    "details": "Google API returned 503"
  }
}
```

---

### 4. Initialization Order (ALL Languages)

Every application follows this startup sequence:

```
1. Configuration    → Load env vars and config files FIRST
2. Directories      → Ensure all required directories exist
3. Database         → Initialize connections (only after dirs exist)
4. Services         → Initialize business logic components
5. Server/App       → Start ONLY after all dependencies ready
```

---

## 📁 Directory Structure

```
02-spec/                        # Specification documents
├── 01-spec-authoring-guide/    # Spec authoring standards
├── 02-coding-guidelines/       # Cross-language coding guidelines
├── 03-error-manage/            # Error handling, AppError, code registry
├── 04-database-conventions/    # Database standards and ORM patterns
├── 05-split-db-architecture/   # 4-tier SQLite split DB architecture
├── 06-seedable-config-architecture/ # Config seeding and migration patterns
├── 07-design-system/           # Unified design system
├── 08-docs-viewer-ui/          # Docs viewer UI specs
├── 09-code-block-system/       # Code block system specs
├── 10-research/                # Architectural research
├── 11-powershell-integration/  # PowerShell automation standards
├── 12-cicd-pipeline-workflows/ # CI/CD workflows and quality gates
├── 13-generic-cli/             # Generic CLI patterns
├── 14-update/                  # Update mechanisms
├── 15-distribution-and-runner/ # Distribution architecture
├── 16-generic-release/         # Release ceremony standards
├── 17-consolidated-guidelines/ # Master consolidated guidelines
├── 18-wp-plugin-how-to/        # WordPress plugin development
├── 19-main-worker-service/     # Main / worker service architecture
├── 21-app/                     # Spec Management software architecture
├── 22-app-issues/              # App issues & retrospectives
├── 23-app-db/                  # App database schema
├── 24-app-ui-design-system/    # App UI design system
├── 25-gsearch-cli/             # Google Search CLI (7000-7919)
├── 26-brun-cli/                # Build Runner CLI (7100-7599)
├── 27-ai-bridge-cli/           # AI Bridge CLI (9000-9999, 19000-19049)
├── 28-ai-bridge-non-vector-rag/ # AI Bridge Non-Vector RAG
├── 29-nexus-flow-cli/          # Nexus Flow CLI (8000-8349)
├── 30-spec-reverse-cli/        # Spec Reverse CLI (11000-11999)
├── 31-ai-transcribe-cli/       # AI Transcribe CLI (14000-14499)
├── 32-license-manager/         # License Manager (15000-15999)
└── ...                         # Additional specs

.ai-memory/
├── memory/                     # Grounded agent memory & learned context
├── plans/                      # Master plans (pending, completed, subtasks)
├── coding-guidelines.md        # Quick reference coding guidelines
├── strictly-avoid.md           # Strictly prohibited operations
└── what-to-read.md             # Reading order for AI onboarding

01-prompts/                     # 100 standardized AI execution prompts
03-ai-scripts/                  # 42 automation & verification scripts
.agents/                        # Native skills and agent rules
```

---

## 🏷️ Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Folders | `NN-kebab-case` | `02-coding-guidelines/` |
| Spec files | `NN-kebab-case.md` | `01-overview.md` |
| Database tables | `PascalCase` | `SearchResults` |
| Go packages | `lowercase` | `internal/search` |
| TypeScript | `PascalCase` | `SearchResult.ts` |
| Error codes | Numeric ranges | `7001`, `9042` |

---

## 🔧 Coding Standards

| Language | Rule |
|----------|------|
| TypeScript | No `any`, no `unknown`, use Enums for categories |
| Go | Structured logging, `*appfault.AppError` return type, correlation IDs |
| SQL | WAL mode for SQLite, prepared statements only |
| All | Exhaustive switch patterns with `never` assertion |

---

## 🗃️ Database Operation Standards

### Mandatory Rules

| Rule | Requirement |
|------|-------------|
| **No Raw SQL** | Use ORM 99% of time (exceptions: FTS5, vectors, CTEs) |
| **Stack Traces** | Auto-capture on every error via `runtime.Callers()` |
| **Affected Rows** | Log expected vs actual for all write operations |
| **Table Name** | Required in every database log entry |
| **Relationships** | Find parent first, then manipulate via ORM |

### DBOperation Wrapper

All database operations MUST use the centralized wrapper:

```go
op := database.NewDBOperation("TableName", database.OpCreate).
    ExpectRows(1)

result := op.Execute(func() (int64, error) {
    tx := r.db.Create(entity)
    return tx.RowsAffected, tx.Error
})
```

---

## ⚡ 60-Second Summary

1. **No code** — This repo is specifications only
2. **Split DB** — 4-tier SQLite (System, Config, Session, Cache)
3. **Seedable Config** — Versioned configuration with migrations
4. **Error Codes** — Numeric ranges per system (7xxx, 8xxx, 9xxx...)
5. **Init Order** — Config → Dirs → DB → Services → App
6. **Naming** — `NN-kebab-case` folders, `PascalCase` tables, `PascalCase` TS
