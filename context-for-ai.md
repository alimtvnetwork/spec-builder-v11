# context-for-ai.md

**Version:** 3.0.0  
**Updated:** 2026-02-04  
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
| **Memory Index** | `.lovable/memories/00-memory-index.md` | Complete 78-file inventory |
| **Debugging Cheat Sheet** | `.lovable/memories/technical/debugging-cheat-sheet.md` | Multi-language debugging |
| **Error Registry** | `.lovable/memories/technical/error-code-registry.md` | All error code ranges |
| **Training Package** | `.lovable/memories/training/` | Full AI training context |

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
| GSearch CLI | 7000-7099 | `7001: Search provider unavailable` |
| BRun CLI | 7100-7599 | `7101: Build step failed` |
| Nexus Flow CLI | 8000-8399 | `8001: Workflow not found` |
| AI Bridge CLI | 9000-9499 | `9001: Model connection failed` |
| WP Plugin Builder | 10000-10999 | `10001: Template not found` |
| Exam Manager | 11000-11999 | `11001: Question bank empty` |
| Link Manager | 14000-14999 | `14001: Link validation failed` |

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
spec/                           # Specification documents
├── 01-general-spec/            # Project-wide standards
├── 02-error-resolution/        # Debugging & error handling
├── 03-shared-cli-patterns/     # Common CLI patterns
├── 04-split-db/                # Database architecture
├── 05-seedable-configuration/  # Config system
├── 07-gsearch-cli/             # Google Search CLI (7000-7099)
├── 08-build-runner-cli/        # Build Runner CLI (7100-7599)
├── 09-nexus-flow-cli/          # Workflow CLI (8000-8399)
├── 10-ai-bridge-cli/           # AI integration CLI (9000-9499)
└── ...                         # Additional specs

.lovable/
├── memories/                   # AI training context (78 files)
│   ├── 00-memory-index.md      # 📍 COMPREHENSIVE INVENTORY
│   ├── training/               # Onboarding packages (12 files)
│   ├── constraints/            # Critical rules (5 files)
│   ├── architecture/           # Core patterns (7 files)
│   ├── features/               # Feature specs (28 files)
│   └── technical/              # Implementation details (11 files)
├── plan.md                     # Current roadmap
└── reliability-risk-report.md  # Risk assessment
```

---

## 🏷️ Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Folders | `NN-kebab-case` | `07-gsearch-cli/` |
| Spec files | `NN-kebab-case.md` | `01-overview.md` |
| Database tables | `snake_case` | `search_results` |
| Go packages | `lowercase` | `internal/search` |
| TypeScript | `PascalCase` | `SearchResult.ts` |
| Error codes | Numeric ranges | `7001`, `9042` |

---

## 🔧 Coding Standards

| Language | Rule |
|----------|------|
| TypeScript | No `any`, no `unknown`, use Enums for categories |
| Go | `zerolog` for logging, correlation IDs required |
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

### Relationship-First Pattern

```
❌ WRONG:  db.Exec("INSERT INTO File (ProjectId, Name) VALUES (?, ?)", id, name)

✅ CORRECT:
  1. var project Project
  2. db.First(&project, "Id = ?", projectId)
  3. project.Files = append(project.Files, File{Name: name})
  4. db.Save(&project)
```

### Error Log Format

```json
{
  "Table": "User",
  "Operation": "Create",
  "ExpectedRows": 1,
  "AffectedRows": 0,
  "Duration": "5.678ms",
  "error": "UNIQUE constraint failed",
  "Stack": ["repo.go:45 (Create)", "svc.go:112 (Register)"]
}
```

---

## ⚡ 60-Second Summary

1. **No code** — This repo is specifications only
2. **Split DB** — 4-tier SQLite (System, Config, Session, Cache)
3. **Seedable Config** — Versioned configuration with migrations
4. **Error Codes** — Numeric ranges per system (7xxx, 8xxx, 9xxx...)
5. **Init Order** — Config → Dirs → DB → Services → App
6. **Naming** — `NN-kebab-case` folders, `snake_case` tables, `PascalCase` TS

---

## 🚀 AI Training Tiers

| Tier | Files | Coverage |
|------|-------|----------|
| **Tier 1: Essential** | ~15 files | 80% context |
| **Tier 2: Supporting** | ~25 files | Full patterns |
| **Tier 3: Reference** | Remaining | On-demand |

**Quick Start:** Feed this file + `constraints/01-no-code-policy.md`

**Full Training:** Feed entire `.lovable/memories/` folder

---

## Cross-Reference

| Resource | Path |
|----------|------|
| Memory Index | `.lovable/memories/00-memory-index.md` |
| **Database Standards Hub** | `.lovable/memories/standards/00-database-standards-hub.md` |
| **Unified Pre-Flight Checklist** | `.lovable/memories/standards/unified-preflight-checklist.md` |
| **CLI Compliance Audit Template** | `.lovable/memories/standards/cli-compliance-audit-template.md` |
| Training Entry | `.lovable/memories/training/00-onboarding.md` |
| Handoff Package | `.lovable/memories/training/06-ai-handoff-package.md` |
| Quickstart Guide | `.lovable/memories/training/08-ai-quickstart-guide.md` |

---

## 🗺️ Database Standards Relationship Map

<presentation-mermaid>
graph TB
    subgraph "Single Source of Truth"
        HUB["🎯 Database Standards Hub<br/>.lovable/memories/standards/<br/>00-database-standards-hub.md"]
    end

    subgraph "Memory Files"
        M1["DBOperation Wrapper Implementation<br/>db-operation-wrapper-implementation.md"]
        M2["ORM Relationship-First Mandate<br/>orm-relationship-first-mandate.md"]
        M3["Stack Trace Capture Pattern<br/>stack-trace-capture-pattern.md"]
        M4["CLI Cross-Reference Completion<br/>cli-cross-reference-completion.md"]
    end

    subgraph "Specification Documents"
        S1["pkg/database Operations<br/>02-spec/11-spec-management-software/<br/>13-shared-packages/06-pkg-database-operations.md"]
        S2["Split DB Architecture<br/>02-spec/06-split-db-architecture/<br/>00-overview.md"]
    end

    subgraph "Go CLI Tools (Compliant)"
        G1["GSearch CLI"]
        G2["BRun CLI"]
        G3["AI Bridge CLI"]
        G4["Nexus Flow CLI"]
        G5["Spec Reverse CLI"]
        G6["AI Transcribe CLI"]
        G7["WP SEO Publish CLI"]
        G8["WP Plugin Builder CLI"]
        G9["WP Plugin Publish"]
    end

    subgraph "PHP Plugins (Excluded)"
        P1["Exam Manager<br/>WordPress $wpdb"]
        P2["Link Manager<br/>WordPress $wpdb"]
    end

    HUB --> M1
    HUB --> M2
    HUB --> M3
    HUB --> M4
    HUB --> S1
    HUB --> S2

    S1 --> G1
    S1 --> G2
    S1 --> G3
    S1 --> G4
    S1 --> G5
    S1 --> G6
    S1 --> G7
    S1 --> G8
    S1 --> G9

    P1 -.->|"Uses WordPress patterns"| HUB
    P2 -.->|"Uses WordPress patterns"| HUB

    style HUB fill:#f9f,stroke:#333,stroke-width:3px
    style S1 fill:#bbf,stroke:#333,stroke-width:2px
    style P1 fill:#fbb,stroke:#333,stroke-width:1px
    style P2 fill:#fbb,stroke:#333,stroke-width:1px
</presentation-mermaid>

---

## 🗺️ Seedable Configuration Relationship Map

<presentation-mermaid>
graph TB
    subgraph "Core Specification"
        SEED["🌱 Seedable Config Architecture<br/>02-spec/07-seedable-config-architecture/<br/>00-overview.md"]
    end

    subgraph "Memory Files"
        SM1["Seedable Configuration Pattern<br/>.lovable/memories/patterns/<br/>seedable-configuration.md"]
        SM2["CW Config Architecture<br/>.lovable/memories/architecture/<br/>03-cw-config-architecture.md"]
        SM3["Validation Data Architecture<br/>.lovable/memories/technical/<br/>validation-data-architecture.md"]
        SM4["Settings Service Standard<br/>.lovable/memories/technical/<br/>settings-service-standard.md"]
    end

    subgraph "Key Concepts"
        C1["🔐 Golden Rule<br/>Seed only if NOT EXISTS<br/>OR newer version + not user-modified"]
        C2["📁 config.seed.json<br/>Embedded default values"]
        C3["📊 settings table<br/>Runtime storage"]
        C4["📜 settings_history<br/>Audit trail"]
    end

    subgraph "CLI Integrations"
        CLI1["GSearch CLI"]
        CLI2["BRun CLI"]
        CLI3["AI Bridge CLI"]
        CLI4["Nexus Flow CLI"]
        CLI5["Spec Reverse CLI"]
        CLI6["AI Transcribe CLI"]
        CLI7["WP SEO Publish CLI"]
    end

    subgraph "Shared Architecture"
        SA["Shared CLI Frontend<br/>02-spec/03-shared-cli-frontend/"]
    end

    SEED --> SM1
    SEED --> SM2
    SEED --> SM3
    SEED --> SM4

    SEED --> C1
    SEED --> C2
    SEED --> C3
    SEED --> C4

    SA --> SEED
    SA --> CLI1
    SA --> CLI2
    SA --> CLI3
    SA --> CLI4
    SA --> CLI5
    SA --> CLI6
    SA --> CLI7

    C2 -->|"First Run"| C3
    C3 -->|"User Changes"| C4

    style SEED fill:#9f9,stroke:#333,stroke-width:3px
    style C1 fill:#ff9,stroke:#333,stroke-width:2px
    style SA fill:#bbf,stroke:#333,stroke-width:2px
</presentation-mermaid>

---

## 🔗 Architectural Patterns Cross-Reference

The **Database Standards** and **Seedable Configuration** patterns are tightly coupled foundational pillars. All CLI tools must implement both.

### Pattern Relationship

| Database Standards | Seedable Configuration | Integration Point |
|--------------------|------------------------|-------------------|
| DBOperation Wrapper | Settings table schema | Wrapper used when reading/writing settings |
| ORM Relationship-First | config.seed.json | Settings model follows ORM patterns |
| 7-field logging | settings_history | Audit logging uses same field structure |
| Stack trace capture | Validation data access | Errors in config loading include traces |

### Training Bundles

| Pattern | Bundle Path | Purpose |
|---------|-------------|---------|
| Database Standards | `.lovable/memories/training/11-database-standards-training-bundle.md` | DBOperation, ORM, Logging |
| Seedable Configuration | `.lovable/memories/training/12-seedable-config-training-bundle.md` | Config seeding, typed accessors |

### Unified Compliance

A CLI tool is considered **fully compliant** only when it implements:

1. ✅ DBOperation wrapper for all database calls
2. ✅ ORM Relationship-First pattern (no raw SQL)
3. ✅ 7-field structured logging
4. ✅ config.seed.json for defaults
5. ✅ Typed setting constants and accessors
6. ✅ Settings versioning with migration support

### Visual: Combined Architecture

<presentation-mermaid>
graph LR
    subgraph "CLI Application Startup"
        A["1. Load config.seed.json"] --> B["2. Initialize Root DB"]
        B --> C["3. Seed settings table"]
        C --> D["4. All operations use DBOperation wrapper"]
    end

    subgraph "Runtime Operations"
        D --> E["Read: settings.GetInt(KeyName)"]
        D --> F["Write: op.Execute(...)"]
        E --> G["ORM query via wrapper"]
        F --> G
        G --> H["Structured logging<br/>(7 mandatory fields)"]
    end

    subgraph "Standards Hub"
        DB["Database Standards Hub"]
        SC["Seedable Config Spec"]
    end

    DB -.-> D
    SC -.-> C

    style A fill:#9f9,stroke:#333
    style D fill:#f9f,stroke:#333
    style H fill:#bbf,stroke:#333
</presentation-mermaid>
