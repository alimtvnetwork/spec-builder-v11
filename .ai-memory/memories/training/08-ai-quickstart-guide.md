# AI Quick-Start Training Guide

**Version:** 1.0.0  
**Created:** 2026-02-02  
**Read Time:** ~5 minutes  
**Purpose:** Rapid onboarding for AI models to understand core patterns

---

## 🎯 What You're Building

A **local-first specification management system** with:
- Go backend + React frontend
- SQLite hierarchical databases
- AI-powered spec generation via AI Bridge
- 8 CLI tools sharing common architecture

---

## ⚡ Core Patterns (Memorize These)

### 1. Split DB Architecture (CRITICAL)

Three-level SQLite hierarchy:

```
Base DB (global) → Workspace DB (team) → Project DB (project-specific)
```

**Key Rules:**
- Each level inherits from parent
- Settings cascade: Base → Workspace → Project (project wins)
- RAG chunks stored at project level with vectors
- Config uses `changelog.json` versioning

**Reference:** `02-spec/06-split-db-architecture/00-overview.md`

---

### 2. Seedable Configuration Pattern

All configurable values follow this flow:

```
JSON seed file → Database → UI editable → Runtime access
```

**Key Files:**
- `seeding-{category}.json` - Default values with version
- `changelog.json` - Migration log for config changes
- `Config` table - Runtime source of truth

**Example Seed:**
```json
{
  "version": "1.0.0",
  "values": {
    "ai.model.default": "llama3",
    "editor.autoSaveMs": 2000
  }
}
```

**Reference:** `02-spec/07-seedable-config-architecture/00-overview.md`

---

### 3. Error Code Registry

Strict prefix ranges by tool/module:

| Prefix | Range | Tool |
|--------|-------|------|
| GEN | 1000-1999 | General/Shared |
| SM | 2000-6999 | Spec Management |
| GS | 7000-7099 | GSearch CLI |
| BR | 7100-7599 | BRun CLI |
| NF | 8000-8399 | Nexus Flow |
| AB | 9000-9499 | AI Bridge |
| PS | 9500-9999 | PowerShell |
| WPB | 10000-10999 | WP Plugin Builder |
| SRC | 11000-11999 | Spec Reverse CLI |

**Error Format:**
```go
type AppError struct {
    Code       int            // e.g., 2001
    Constant   string         // e.g., "ERR_FILE_NOT_FOUND"
    Message    string
    Details    map[string]any
    Retryable  bool
}
```

**Reference:** `02-spec/03-error-code-registry/00-overview.md`

---

### 4. CLI Architecture Pattern

All CLIs share this structure:

```
cmd/
├── root.go          # Cobra root command
├── {action}.go      # Subcommands
internal/
├── config/          # Config loading
├── models/          # GORM models
├── services/        # Business logic
├── api/             # HTTP handlers (if applicable)
pkg/
└── shared/          # Cross-CLI utilities
```

**Shared Packages:**
- `pkg/dbutil` - SQLite connection + migrations
- `pkg/configutil` - Seedable config loader
- `pkg/errorutil` - Error creation + handling
- `pkg/logutil` - Structured logging

**Reference:** `02-spec/28-shared-cli-frontend/00-overview.md`

---

### 5. RAG Memory System

Retrieval-Augmented Generation for context injection:

```
Ingest → Chunk → Embed → Store → Query → Retrieve → Inject
```

**Chunk Table:**
```go
type RAGChunk struct {
    ID          string    `gorm:"primaryKey"`
    ArtifactID  string    `gorm:"index"`
    Content     string
    Embedding   []float32 `gorm:"serializer:json"`
    ChunkIndex  int
    SectionAnchor string
}
```

**Query Flow:**
1. User query → Embed with same model
2. Vector search in SQLite-vss
3. Top-K chunks → Rerank
4. Inject into LLM context

**Reference:** `02-spec/11-spec-management-software/05-features/09-knowledge-memory/`

---

## 📁 Folder Structure Convention

All spec folders follow:

```
NN-folder-name/
├── 00-overview.md           # Required: summary + index
├── 01-backend/              # Backend specs
│   ├── 01-architecture.md
│   └── 02-api-endpoints.md
├── 02-frontend/             # Frontend specs  
│   └── 01-components.md
├── 03-deploy/               # Deployment
│   └── 01-powershell.md
└── 99-consistency-report.md # Validation
```

**File Naming:** `NN-kebab-case-name.md`

---

## 🔧 API Response Envelope

ALL endpoints use this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-02T10:00:00Z",
    "version": "1.0.0"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": 2001,
    "constant": "ERR_FILE_NOT_FOUND",
    "message": "The requested file does not exist",
    "details": { "path": "/spec/missing.md" }
  },
  "meta": { ... }
}
```

---

## 🚨 Critical Constraints

1. **Spec-Only Phase:** NO implementation until specs are 100% complete
2. **PascalCase Columns:** All SQLite tables use PascalCase (e.g., `CreatedAt`)
3. **No `any` in TypeScript:** Use strict types or type guards
4. **Enums for Switches:** All switch statements must use TypeScript enums
5. **Readonly by Default:** All interface properties should be `readonly`

---

## 📚 Tier 1 Reading (Must Read First)

1. `02-spec/01-general-spec/00-overview.md` - Foundation standards
2. `02-spec/06-split-db-architecture/00-overview.md` - Database hierarchy
3. `02-spec/07-seedable-config-architecture/00-overview.md` - Config pattern
4. `02-spec/03-error-code-registry/00-overview.md` - Error standards

## Tier 2 Reading (Supporting)

5. `02-spec/28-shared-cli-frontend/00-overview.md` - CLI patterns
6. `02-spec/50-powershell-integration/00-overview.md` - Build scripts

---

## ✅ Validation Checklist

Before implementing any feature, verify:

- [ ] Error codes are in correct prefix range
- [ ] Database tables use PascalCase columns
- [ ] Config values have seed file entry
- [ ] API endpoints use standard envelope
- [ ] Cross-references point to valid files
- [ ] TypeScript has no `any` types

---

## 🔗 Quick Links

| Resource | Path |
|----------|------|
| Master Spec Index | `02-spec/00-overview.md` |
| SM Implementation Guide | `02-spec/11-spec-management-software/05-features/00-overview.md` |
| AI Bridge Spec | `02-spec/22-ai-bridge-cli/00-overview.md` |
| Reliability Report | `.lovable/reliability-risk-report.md` |
| Handoff Package | `.lovable/memories/training/06-ai-handoff-package.md` |

---

*Quick-start guide for AI model training. Read time: ~5 minutes.*
