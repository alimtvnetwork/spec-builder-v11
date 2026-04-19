# Consolidated Remediation Plan — Phases 11-13

**Date:** 2026-02-07  
**Scope:** BRun CLI (P11) + AI Bridge Core (P12) + AI Bridge SEO (P13)  
**Total Findings:** 162 (60 critical, 61 warning, 28 minor/info, 13 correct)

---

## Owner Decisions (Applied Throughout)

These decisions from the project owner override any conflicting spec content:

| Decision | Detail |
|----------|--------|
| **RAG Path Convention** | `data/{appName}/rag/{type}/...` — type-first, then company/user scoping. SEO = `data/{appName}/rag/seo/{company}/...` |
| **Upload Path Convention** | `data/{appName}/upload/{reason}/{company}/{slug}-{taskId}/` — reason = `seo/blog`, `seo/faq`, `seo/paragraph`, etc. |
| **Upload Slug Strategy** | A centralized `SlugFor(context)` method generates the slug based on context type: **conversation** → conversation slug, **SEO project** → company/project slug, **codebase** → project slug. The slug method is the single source of truth for naming upload folders. |
| **Port Allocation** | Each CLI tool gets a unique port. No collisions. Best-judgment assignments below. |
| **AI Transcribe Exception** | AI Transcribe keeps its current ports (8030-8032). No migration needed. |

---

## 1. Critical Remediation Categories (Ranked by Impact)

### 🔴 CAT-1: PascalCase Enforcement (60+ occurrences across all 3 phases)

**Problem:** Pervasive `camelCase` JSON tags in Go structs, `snake_case` SQL columns, and `camelCase` config keys.

**Scope of Impact:**
- **P11 (BRun):** 14 files — ExecutionResult, BuildError, PortConfig, CopyResult, FirewallRule, StackFrame, ResetAPI, all JSON output examples
- **P12 (AI Bridge Core):** 28 occurrences — NormalizedRequest, Response, StreamChunk, BridgeError, all API examples (chat, RAG, image, video, voice), config.seed.json
- **P13 (AI Bridge SEO):** 6 occurrences — SEOError, ProgressError, config.seed.json, ParaKey constants

**Remediation:**
1. All Go struct JSON tags → PascalCase or omit tag (implicit PascalCase): `json:",omitempty"` 
2. All SQL columns → PascalCase via GORM AutoMigrate (no raw DDL)
3. All config.seed.json keys → PascalCase
4. All API documentation examples → PascalCase
5. All YAML config tags → PascalCase
6. SQL index names → PascalCase (e.g., `IdxCtasCompany`)
7. Sort parameter values → PascalCase (`CreatedDesc` not `created_desc`)

**Correct Patterns to Follow (already compliant):**
- `14-reset-and-export-api.md` (P12) — full PascalCase throughout
- `18-ai-seo-content-types.md` (P13) — structs + SQL correct
- `28-company-profile-management.md` (P13) — SQL DDL correct
- `04-api-interface.md` pagination section (P12) — correct envelope

---

### 🔴 CAT-2: Error Code Collisions (7 collision zones)

**Problem:** Multiple error codes assigned to different meanings across specs.

| Collision | Files | Codes | Resolution |
|-----------|-------|-------|------------|
| BRun CLI General vs GSearch | P11 `06-error-handling.md` | 7000-7006 | Relocate BRun to 7100-7105 (its allocated range) |
| BRun Settings vs Runtime | P11 `17-settings-service.md` | 7200+ | Relocate settings to 7550-7569 |
| BRun Reset vs Build Process | P11 `18-reset-api.md` | 7401-7407 | Relocate reset to 7570-7589 |
| AB Response vs Reset | P12 `05-error-codes.md` / `14-reset` | 9401 | Relocate reset to 9431-9449 |
| AB Response vs Reindex vs Import | P12 multiple | 9420-9427 | Relocate reindex/import to 9431-9449 |
| AB Agentic vs SEO | P12 `09-agentic-mode.md` | 9500-9508 | Relocate agentic to 9450-9470 |
| FAQ dual definitions | P12+P13 `05-` vs `16-` | 9541-9553 | Unify in `05-error-codes.md` as single source |

**Remediation:**
1. Designate `spec/21-brun-cli/06-error-handling.md` as BRun's error registry (range 7100-7599 only)
2. Designate `spec/22-ai-bridge-cli/01-backend/05-error-codes.md` as AI Bridge's sole error registry (9000-9999)
3. Archive/remove duplicate definitions from `16-ai-seo-error-codes.md` and `15-ai-seo-implementation-checklist.md`
4. Drop `AB-` and `BR-` prefixes — plain integers only
5. Apply unified FAQ error mapping (AC-P13-005)

**Authoritative Error Ranges (Final):**

| Range | Owner | Sub-Range | Purpose |
|-------|-------|-----------|---------|
| 7100-7199 | BRun | 7100-7109 | CLI/Config |
| 7200-7299 | BRun | | Runtime Execution |
| 7300-7399 | BRun | | Port Management |
| 7400-7499 | BRun | | Build Process / Assets |
| 7500-7549 | BRun | | Health Checks |
| 7550-7569 | BRun | | Settings Service |
| 7570-7589 | BRun | | Reset API |
| 9000-9099 | AI Bridge | | General/Startup |
| 9100-9199 | AI Bridge | | Input Parsing |
| 9200-9299 | AI Bridge | | Backend Connection |
| 9300-9399 | AI Bridge | | RAG/Request/Model |
| 9400-9430 | AI Bridge | | Response Handling |
| 9431-9449 | AI Bridge | | Reset/Import/Export |
| 9450-9470 | AI Bridge | | Agentic/Chain |
| 9501-9540 | AI Bridge | | SEO General |
| 9541-9553 | AI Bridge | | FAQ Generation |
| 9561-9595 | AI Bridge | | Paragraph + Blog |
| 9600-9613 | AI Bridge | | Database Architecture |
| 9700-9999 | AI Bridge | | Advanced Features |

---

### 🔴 CAT-3: Competing Database Schemas (3 collision zones)

**Problem:** Multiple specs define conflicting database schemas for the same data.

| Conflict | Resolution |
|----------|------------|
| BRun `10-data-models.md` (Single DB, uint PKs) vs `16-database-architecture.md` (Split DB, UUID PKs) | **16- is authoritative.** Archive/deprecate 10-. |
| AI Bridge `08-split-db-integration.md` (snake_case, `root.db`) vs `12-database-architecture.md` (mixed, `aibridge.db`) | **12- is authoritative.** Fix 12-'s internal inconsistencies (child tables → PascalCase). Archive 08- schema sections. |
| SEO paths: `data/{appName}/seo/` vs `data/{appName}/rag/seo/` | **`rag/seo/` is authoritative** per owner decision. |

**Canonical Path Hierarchy (Final — per owner decisions):**

```
data/
├── brun.db                              # BRun Root DB
├── aibridge.db                          # AI Bridge Root DB
├── {appName}/
│   ├── search.db                        # App-level search metadata
│   ├── rag/
│   │   ├── seo/
│   │   │   ├── {company}.db             # Company SEO root DB (registry + training)
│   │   │   ├── blog/{company}/{seq}-{slug}.db
│   │   │   ├── faq/{company}/{seq}-{slug}.db
│   │   │   └── paragraph/{company}/{seq}-{slug}.db
│   │   ├── code/{company}/{seq}-{taskId}.db
│   │   └── chat/{company}/{seq}-{sessionId}.db
│   ├── upload/
│   │   ├── seo/
│   │   │   ├── blog/{company}/{taskTitle}-{taskId}/
│   │   │   ├── faq/{company}/{taskTitle}-{taskId}/
│   │   │   └── paragraph/{company}/{taskTitle}-{taskId}/
│   │   └── {other-reason}/{company}/{taskTitle}-{taskId}/
│   └── runs/                            # BRun session DBs
│       └── {seq}-{profile}-{shortId}.db
```

---

### 🔴 CAT-4: Raw SQL / database/sql Violations (4 files)

**Problem:** Direct `database/sql` usage and raw SQL queries violate ORM-only mandate.

| File | Phase | Violation |
|------|-------|-----------|
| BRun `10-data-models.md` | P11 | `db.Exec("CREATE INDEX...")`, `Where("run_id = ?")` with snake_case |
| AI Bridge `08-split-db-integration.md` | P12 | `sql.Open()`, `db.QueryRow()`, `db.Exec()` throughout |
| AI Bridge `12-database-architecture.md` | P12 | Memory loading uses `sql.Open()`, `db.Query()` |
| AI Bridge `11-rag-reindexing.md` | P12 | Raw SQL schemas for reindex_jobs |

**Remediation:** Replace all with GORM + `pkg/database` DBOperation wrapper. Exceptions: FTS5, CTEs, vector search.

---

### 🔴 CAT-5: String-Based Enum Types (8 types across all phases)

| Enum | Phase | File | Target Package |
|------|-------|------|----------------|
| `RuntimeType string` | P11 | `01-core-architecture.md` | `runtime.Variant` (already exists in 19-) |
| `HealthStatus string` | P11 | `15-observability.md` | `health_status.Variant` |
| `ConfigCategory string` | P11 | `17-settings-service.md` | `config_category.Variant` |
| `HealthStatus string` | P12 | `11-observability.md` | `health_status.Variant` |
| `ConfigCategory string` | P12 | `12-settings-service.md` | `config_category.Variant` |
| `ValidationCategory string` | P13 | `17-ai-seo-core-guidelines.md` | `validation_category.Variant` |
| `SeoKey string` | P13 | `17-ai-seo-core-guidelines.md` | `seo_key.Variant` |
| `ParaKey string` | P13 | `25-ai-seo-paragraph-generation.md` | `para_key.Variant` |

**Remediation:** Convert all to `type Variant byte` with `iota`, implement 9 mandatory methods per `spec/17-enum-specification/`.

---

### 🔴 CAT-6: Port Unification

**Problem:** AI Bridge specs reference both port 8089 and 8080. Tools lack unique, non-colliding port assignments.

**Resolution:** Unique port per tool. AI Transcribe keeps 8030-8032 (exception granted).

| Tool | Port | Rationale |
|------|------|-----------|
| Spec Management | 5010 | Primary orchestrator, first in lineup |
| GSearch | 5020 | Core search engine, high-traffic |
| BRun | 5030 | Build runner, invoked by SM |
| AI Bridge | 5040 | AI gateway, central hub |
| Nexus Flow | 5050 | Workflow engine |
| WP SEO Publish | 5060 | WordPress publishing |
| WP Plugin Builder | 5070 | Plugin scaffolding |
| Spec Reverse | 5080 | Codebase analysis |
| AI Transcribe | 8030-8032 | **Exception** — STT (8030), TTS (8031), WebSocket (8032). Kept as-is per owner. |

> All specs referencing port 8080 or 8089 for AI Bridge must be updated to **5040**.

---

### 🔴 CAT-7: Duplicate/Deprecated API Endpoints (P13)

**Problem:** FAQ and Paragraph specs contain both company-scoped (correct) and non-scoped (deprecated) endpoints.

| Deprecated Endpoint | Correct Endpoint |
|---------------------|-----------------|
| `POST /api/v1/seo/faq/generate` | `POST /api/v1/seo/{company}/faq` |
| `POST /api/v1/seo/para/generate` | `POST /api/v1/seo/{company}/para` |

**Remediation:** Remove all non-scoped endpoints. Company always from URL path, never request body.

---

## 2. Warning-Level Remediation (Batch)

These can be addressed in a single sweep after critical items:

| Category | Count | Action |
|----------|-------|--------|
| JSON output examples (docs) | ~20 | Find-replace camelCase → PascalCase in all example JSON |
| YAML config tags | ~8 | Convert all `yaml:"camelCase"` to PascalCase or omit |
| Duplicate struct definitions | 2 | Remove BrunError from `09-integration-api.md`, keep canonical in `06-` |
| Stale cross-references | 3 | Fix `../22-golang-search-cli/` → `../../20-gsearch-cli/` |
| Outdated file inventories | 3 | Update `00-overview.md` in BRun and AI Bridge to list all files |
| Consistency report | 1 | Update `99-consistency-report.md` to validate PascalCase (not camelCase) |
| File numbering duplicates | 2 | Renumber AI Bridge `11-` and `12-` duplicates |
| Training data redundancy | 2 | FAQ/Para training should reference CompanyProfile table, not inline data |
| Transition density naming | 1 | Rename to `TransitionWordDensity` vs `TransitionSentenceStartRate` |
| Long spec splitting | 1 | Split `29-gsearch-url-extraction.md` (3121 lines) into sub-files |
| Implementation guide rewrite | 1 | `14-implementation-guide.md` must reference Split DB + PascalCase |

---

## 3. Remediation Execution Order

### Wave 1: Architectural Decisions (Blocks Everything)
1. ✅ Confirm canonical path hierarchy (RAG + Upload) — **DONE (owner decided)**
2. ✅ Confirm port range — **DONE (5010–5080, standardized)**
3. ✅ Assign specific ports per tool — **DONE (Wave 2 Port Unification)**
4. Designate authoritative schema files (BRun: 16-, AI Bridge: 12-)
5. Archive/deprecate competing schemas (BRun: 10-, AI Bridge: 08- schema sections)

### Wave 2: Error Code Registry (Blocks Implementation)
6. Resolve all 7 collision zones per CAT-2 table above
7. Consolidate into single registries per tool
8. Remove `AB-`/`BR-` prefixes

### Wave 3: Schema Standardization (Blocks Implementation)
9. Fix `12-database-architecture.md` internal inconsistency (child tables → PascalCase)
10. Update all SQL DDL to PascalCase columns
11. Replace all raw SQL with GORM + DBOperation wrapper
12. Update canonical path hierarchy in `00-overview.md`

### Wave 4: Serialization Sweep (Batch)
13. All Go struct JSON tags → PascalCase
14. All YAML config tags → PascalCase
15. All config.seed.json keys → PascalCase
16. All API documentation examples → PascalCase

### Wave 5: Enum Migration (Batch)
17. Convert 8 string-based enum types to byte variant pattern

### Wave 6: Documentation Cleanup
18. Remove deprecated endpoints from FAQ/Para specs
19. Fix file numbering, cross-references, inventories
20. Rewrite implementation guide
21. Update consistency report
22. Split oversized specs

---

## 4. Acceptance Criteria Summary

| Phase | AC Count | Range |
|-------|----------|-------|
| P11 (BRun) | 18 | AC-P11-001 to AC-P11-018 |
| P12 (AI Bridge Core) | 20 | AC-P12-001 to AC-P12-020 |
| P13 (AI Bridge SEO) | 14 | AC-P13-001 to AC-P13-014 |
| **Total** | **52** | |

All 52 acceptance criteria remain valid and should be verified during implementation.

---

## 5. Owner Decisions Log

All owner questions resolved:

| Question | Decision | Date |
|----------|----------|------|
| Port assignments | 5010-5080 range assigned per tool; AI Transcribe keeps 8030-8032 | 2026-02-07 |
| Upload slug strategy | Centralized `SlugFor(context)` method — conversation → conversation slug, SEO → company slug, codebase → project slug | 2026-02-07 |
| AI Transcribe port migration | Exception granted — stays at 8030-8032 | 2026-02-07 |
| RAG path hierarchy | `data/{appName}/rag/{type}/...` confirmed | 2026-02-07 |
| Upload path hierarchy | `data/{appName}/upload/{reason}/{company}/{slug}-{taskId}/` confirmed | 2026-02-07 |

---

*Consolidated from 162 findings across 58 specification files. 60 critical issues identified, organized into 7 remediation categories with a 6-wave execution plan. All owner decisions resolved.*
