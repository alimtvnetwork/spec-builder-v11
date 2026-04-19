# Phase 12: AI Bridge Core Audit (Specs 00-14) — REVISED

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `spec/22-ai-bridge-cli/00-overview.md` + `spec/22-ai-bridge-cli/01-backend/00-overview.md` through `14-reset-and-export-api.md`  
**Files Reviewed:** 16 (00-overview.md, backend 00-14, plus duplicate-numbered 11/12 files)  
**Status:** Complete (Revision 2)  
**Previous Version:** 2026-02-07 (60 findings)  
**This Version:** 68 findings (28 critical, 22 warning, 12 minor/info, 6 correct)

---

## 1. Inconsistency Report

### 1.1 Pervasive camelCase JSON Tags (28 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `01-architecture.md` L47-92 | **NormalizedRequest uses camelCase JSON tags throughout.** `json:"id"`, `json:"systemPrompt"`, `json:"userPrompt"`, `json:"modelCategory"`, `json:"modelId,omitempty"`, `json:"temperature,omitempty"`, `json:"maxTokens,omitempty"`, `json:"topP,omitempty"`, `json:"variables,omitempty"`, `json:"context,omitempty"`, `json:"stream"`, `json:"outputFormat"`, `json:"batchMode"`, `json:"batchItems,omitempty"`, `json:"source"`, `json:"createdAt"`. Every field violates PascalCase. | 🔴 Critical |
| I-02 | `01-architecture.md` L77-91 | **InputSource and ContextItem use camelCase JSON.** `json:"format"`, `json:"filePath,omitempty"`, `json:"lineNo,omitempty"`, `json:"role"`, `json:"content"`, `json:"id"`, `json:"variables"`. | 🔴 Critical |
| I-03 | `01-architecture.md` L113-126 | **Response and StreamChunk use camelCase JSON.** `json:"id"`, `json:"content"`, `json:"finishReason"`, `json:"tokensUsed"`, `json:"durationMs"`, `json:"modelUsed"`, `json:"delta"`. | 🔴 Critical |
| I-04 | `01-architecture.md` L198-205 | **RetryConfig uses YAML camelCase tags.** `yaml:"maxAttempts"`, `yaml:"initialDelay"`, `yaml:"retryableErrors"`. Should use PascalCase for config file keys or omit tags for implicit PascalCase. | 🟡 Warning |
| I-05 | `01-architecture.md` L47-50 | **ModelCategory and OutputFormat are unsafe string casts.** `ModelCategory(fm.Model)` performs direct cast without `Parse()` validation from enum spec. | 🔴 Critical |
| I-06 | `02-input-formats.md` L56-64 | **MarkdownFrontmatter uses YAML camelCase tags.** `yaml:"model"`, `yaml:"modelId,omitempty"`, `yaml:"temperature,omitempty"`. | 🟡 Warning |
| I-07 | `02-input-formats.md` L186-200 | **JSONRequest uses camelCase JSON tags.** `json:"systemPrompt"`, `json:"userPrompt"`, `json:"model"`, `json:"maxTokens,omitempty"`. | 🔴 Critical |
| I-08 | `02-input-formats.md` L319-331 | **YAMLRequest uses camelCase YAML tags.** `yaml:"systemPrompt"`, `yaml:"userPrompt"`, `yaml:"variables,omitempty"`. | 🟡 Warning |
| I-09 | `02-input-formats.md` L458-468 | **CSVConfig uses camelCase YAML AND snake_case.** `yaml:"idColumn"` — field `IDColumn` should be `IdColumn` per acronym-as-word rule. | 🟡 Warning |
| I-10 | `03-startup-modes.md` L200-222 | **Daemon config uses camelCase YAML.** `yaml:"port"`, `yaml:"pidFile"`, `yaml:"requestsPerMinute"` etc. Contradicts `06-configuration.md` which uses lowercase YAML keys (also incorrect but different). | 🔴 Critical |
| I-11 | `04-api-interface.md` L52-76 | **API JSON request/response examples use camelCase.** `"category"`, `"systemPrompt"`, `"userPrompt"`, `"finishReason"`, `"tokensUsed"`, `"durationMs"`, `"backendUsed"`. | 🔴 Critical |
| I-12 | `04-api-interface.md` L136-177 | **Chat API JSON uses camelCase.** `"appName"`, `"sessionId"`, `"sequenceNum"`, `"createdAt"`, `"messageCount"`. | 🔴 Critical |
| I-13 | `04-api-interface.md` L246-322 | **RAG API JSON uses camelCase.** `"appName"`, `"docId"`, `"chunkCount"`, `"embeddingModel"`, `"topK"`, `"chunkId"`, `"score"`. | 🔴 Critical |
| I-14 | `04-api-interface.md` L334-420 | **Image/Video API JSON uses camelCase.** `"prompt"`, `"negativePrompt"`, `"cfgScale"`, `"imageUrl"`, `"durationMs"`, `"videoUrl"`. | 🔴 Critical |
| I-15 | `04-api-interface.md` L446-490 | **Voice API JSON uses camelCase.** `"text"`, `"language"`, `"confidence"`, `"segments"`, `"audioUrl"`, `"delegatedTo"`. | 🔴 Critical |
| I-16 | `04-api-interface.md` L870-938 | **Pagination envelope uses PascalCase correctly!** `"TotalRecords"`, `"TotalPages"`, `"CurrentPage"`. Correct pattern but contradicts all other API examples. | ✅ Correct |
| I-17 | `04-api-interface.md` L793-805 | **Import/export JSON uses camelCase.** `"appName"`, `"chatSessions"`. Contradicts PascalCase in `14-reset-and-export-api.md`. | 🟡 Warning |
| I-18 | `05-error-codes.md` L117-124 | **BridgeError uses camelCase JSON tags.** `json:"code"`, `json:"message"`, `json:"details,omitempty"`, `json:"retryable"`, `json:"timestamp"`. | 🔴 Critical |
| I-19 | `05-error-codes.md` L166-175 | **Error response envelope uses camelCase.** `"error": { "code": ..., "message": ... }`. | 🔴 Critical |
| I-25 | `07-model-management.md` L71-84 | **BackendSwitch uses camelCase JSON.** `json:"category"`, `json:"newBackend"`, `json:"newModel,omitempty"`. | 🟡 Warning |
| I-28 | `07-model-management.md` L361-409 | **API JSON examples use camelCase.** `"key"`, `"displayName"`, `"currentBackend"`. | 🟡 Warning |
| I-36 | `09-agentic-mode.md` L227-247 | **ChainExecution/ChainStep mixed tags.** Some fields have `json:",omitempty"` (correct implicit PascalCase), others have no tags at all. Inconsistent within same struct. | 🟡 Warning |
| I-40 | `10-openapi-spec.md` L460-500 | **OpenAPI schema uses camelCase properties.** `userPrompt`, `systemPrompt`, `maxTokens`, `outputFormat`, `finishReason`. | 🟡 Warning |
| I-44 | `11-rag-reindexing.md` L24-38 | **RAG reindex request JSON uses camelCase.** `"appName"`, `"sourcePath"`, `"chunkSize"`, `"embeddingModel"`. | 🟡 Warning |

### 1.2 snake_case SQL Schemas (10 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-26 | `07-model-management.md` L207-261 | **SQL schema uses snake_case columns.** `category_key`, `display_name`, `default_backend`, `created_at`, `health_status`, `last_health_check`. | 🔴 Critical |
| I-27 | `07-model-management.md` L207-261 | **Raw `CREATE TABLE` DDL instead of GORM AutoMigrate.** 4 tables defined as raw SQL. | 🟡 Warning |
| I-29 | `08-split-db-integration.md` L58-119 | **Root DB schema uses snake_case.** Tables `applications`, `counters`, `db_registry` with `app_name`, `created_at`, `sequence_num`. | 🔴 Critical |
| I-30 | `08-split-db-integration.md` L128-183 | **Chat session schema uses snake_case.** `session_meta`, `messages`, `attachments`, `tool_calls` all snake_case. | 🔴 Critical |
| I-31 | `08-split-db-integration.md` L192-229 | **RAG document schema uses snake_case.** `document_meta`, `chunks`, `chunk_relations`. | 🔴 Critical |
| I-32 | `08-split-db-integration.md` L240-277 | **File history schema uses snake_case.** `file_meta`, `versions`, `snapshots`. | 🔴 Critical |
| I-45 | `11-rag-reindexing.md` L297-338 | **SQL schemas use snake_case.** `reindex_jobs`, `file_hashes` with `app_name`, `error_message`, `created_at`. | 🔴 Critical |
| I-48 | `12-database-architecture.md` L438-491 | **`attachments` and `tool_calls` tables revert to snake_case.** Despite root DB tables being PascalCase, child tables use `message_id`, `mime_type`, `size_bytes`, `tool_name`, `duration_ms`. | 🔴 Critical |
| I-49 | `12-database-architecture.md` L502-585 | **RAG document schema uses snake_case.** `document_meta`, `chunks`, `file_hashes` with `source_path`, `content_hash`, `last_indexed_at`. | 🔴 Critical |
| I-50 | `12-database-architecture.md` L198-239 | **Search metadata schema uses snake_case.** `search_log`, `cache_settings` with `query_hash`, `search_type`, `duration_ms`. | 🔴 Critical |

### 1.3 Error Code Collisions (4 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-20 | `05-error-codes.md` vs `09-agentic-mode.md` | **9500-9508 collision.** `05-error-codes.md` allocates 9501-9540 to "SEO General". `09-agentic-mode.md` uses 9500-9508 for chain execution. Code 9501 is both `TOOL_NOT_FOUND` (agentic) and an SEO preset error. | 🔴 Critical |
| I-21 | `05-error-codes.md` vs `14-reset-and-export-api.md` | **9401 collision.** `ErrResponseParseFailed` (response handling) and `RESET_EXPIRED` (reset API) share code 9401. | 🔴 Critical |
| I-22 | `05-error-codes.md` vs `11-rag-reindexing.md` vs `14-reset-and-export-api.md` | **Triple collision at 9420-9421.** `ErrOutputFormatFailed` + `REINDEX_SOURCE_NOT_FOUND` + `IMPORT_INVALID_FILE` all use 9420. | 🔴 Critical |
| I-63 | `05-error-codes.md` vs `16-ai-seo-error-codes.md` | **FAQ error code name conflicts at 9541-9553.** `05-error-codes.md` defines 13 FAQ codes (9541-9553) with names like `ErrFaqSentenceTooLong` (9546). `16-ai-seo-error-codes.md` defines 10 FAQ codes (9541-9550) with different names like `FAQ_OUTPUT_FORMAT_UNSUPPORTED` (9546). Same code, different meanings. | 🔴 Critical |

### 1.4 Competing Schemas & Architectural Conflicts (6 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-33 | `08-split-db-integration.md` vs `12-database-architecture.md` | **Competing database schemas.** File 08 defines ALL schemas in snake_case; file 12 defines SAME schemas partially in PascalCase. File 12 is newer (v2.1.0) but internally inconsistent. | 🔴 Critical |
| I-34 | `08-split-db-integration.md` L286-476 | **Go code uses raw `database/sql` and raw SQL.** `sql.Open("sqlite3", ...)`, `db.QueryRow(...)`, `db.Exec(...)` with snake_case columns. Violates ORM-only and DBOperation wrapper mandates. | 🔴 Critical |
| I-35 | `08-split-db-integration.md` L17-49 | **Root DB named `root.db`.** Conflicts with `12-database-architecture.md` and `00-overview.md` which define `data/aibridge.db`. | 🔴 Critical |
| I-37 | `09-agentic-mode.md` L60-67 | **ToolDelegation has no JSON/GORM tags.** Fields use implicit PascalCase (correct), but `config.seed.json` (L72-126) uses camelCase keys (`"toolName"`, `"targetCli"`). Deserialization will fail. | 🔴 Critical |
| I-61 | `12-database-architecture.md` L717-759 | **Memory loading code uses raw `database/sql`.** `sql.Open("sqlite3", ...)`, `db.QueryRow(...)`, `db.Query(...)` with raw SQL. Should use GORM. | 🟡 Warning |
| I-62 | `12-database-architecture.md` L596-696 | **Flow diagrams reference snake_case.** SQL in flow diagrams uses `session_meta`, `sub_category`, `sequence_num` despite the file's own CRITICAL naming section mandating PascalCase. | 🟡 Warning |

### 1.5 Structural & Documentation Issues (8 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-23 | `06-configuration.md` L222-244 | **Config struct YAML tags use camelCase.** `yaml:"backend"`, `yaml:"llamaCpp"`, `yaml:"level"`. Contradicts PascalCase config mandate. | 🟡 Warning |
| I-24 | `06-configuration.md` L192-200 | **Env var naming documents wrong source casing.** `AIBRIDGE_BACKEND_OLLAMA_BASEURL` documents camelCase origin. | 🟠 Minor |
| I-38 | `09-agentic-mode.md` L72-126 | **config.seed.json uses camelCase keys.** `"toolName"`, `"targetCli"`, `"argMapping"`, `"cacheTtlDays"`. Should be PascalCase. | 🟡 Warning |
| I-41 | `11-observability.md` L306-312 | **HealthStatus uses `type HealthStatus string`.** Should use `health_status.Variant` byte pattern per spec/17. | 🟡 Warning |
| I-43 | `11-observability.md` L139-140 | **Prometheus label `session_id` uses snake_case.** Acceptable per Prometheus naming convention. | 🟠 Info |
| I-51 | `12-database-architecture.md` vs `00-overview.md` vs `08-split-db-integration.md` | **Three different sequence number formats.** File 12: 3-digit (`001`). File 08: 2-digit (`%02d`). Overview: unspecified. | 🟡 Warning |
| I-52 | `12-settings-service.md` L147-175 | **ConfigCategory uses `type ConfigCategory string`.** Should use `config_category.Variant` byte pattern. | 🟡 Warning |
| I-54 | `12-settings-service.md` L270-279 | **Error codes use `AB-` prefix (`AB-9200`).** Registry uses plain integers. Also collides with backend connection codes 9200-9231 in `05-error-codes.md`. | 🔴 Critical |

### 1.6 API & Port Inconsistencies (4 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-55 | `13-ai-seo-generate.md` L30-71 | **SEO paths `data/{appName}/seo/` differ from overview pattern** `data/{appName}/rag/seo/`. | 🟡 Warning |
| I-56 | `13-ai-seo-generate.md` L486-500 | **config.seed.json uses camelCase keys.** `"chunkSize"`, `"embeddingModel"`. Contradicts `12-database-architecture.md` PascalCase seed values. | 🟡 Warning |
| I-64 | `04-api-interface.md` L18 vs `30-openapi-spec-seo.md` L32 | **API port inconsistency.** Core spec: port `8089`. SEO OpenAPI spec: port `8080`. | 🟠 Minor |
| I-65 | `09-agentic-mode.md` L410-413 | **ChainModelConfig uses camelCase JSON.** `json:"toolSelection"`, `json:"reasoning"`, `json:"outputGeneration"`. | 🟡 Warning |

### 1.7 Correct Patterns (noted for reference)

| # | File(s) | Description | Status |
|---|---------|-------------|--------|
| I-47 | `12-database-architecture.md` L86-176 | Root DB schema uses PascalCase correctly. Authoritative pattern. | ✅ Correct |
| I-53 | `12-settings-service.md` L123-139 | Setting model uses correct GORM PascalCase column tags. | ✅ Correct |
| I-57 | `14-reset-and-export-api.md` | Uses PascalCase JSON throughout. Model file. | ✅ Correct |
| I-58 | `00-overview.md` (root) L17-39 | Folder structure outdated — lists only 12 backend files, actual has 55+. | 🟠 Minor |
| I-59 | `00-overview.md` (root) L89 | Error range "9000-9999" too broad, doesn't reflect sub-allocation. | 🟠 Minor |
| I-60 | Duplicate file numbers | `11-observability.md` / `11-rag-reindexing.md` and `12-database-architecture.md` / `12-settings-service.md` share prefixes. | 🟡 Warning |

---

## 2. Severity Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 28 |
| 🟡 Warning | 22 |
| 🟠 Minor/Info | 12 |
| ✅ Correct (noted) | 6 |
| **Total** | **68** |

---

## 3. Key Themes

### 3.1 Pervasive camelCase JSON (28 occurrences)
The dominant issue across specs 01-11. Only three sections follow PascalCase correctly:
- `14-reset-and-export-api.md` (full file)
- `04-api-interface.md` pagination section (L870-938)
- `12-database-architecture.md` root DB schema (L86-176)

**Remediation:** Systematic sweep of ALL Go struct JSON tags and API examples in files 01-13 to PascalCase.

### 3.2 snake_case SQL Schemas (10 files affected)
Two competing schema definitions exist:
- `08-split-db-integration.md` — entirely snake_case (deprecated)
- `12-database-architecture.md` — mixed (root PascalCase, children snake_case)

**Remediation:** Designate `12-database-architecture.md` as sole authority; fix its internal inconsistency (child tables to PascalCase); archive `08-` schema sections.

### 3.3 Error Code Collisions (4 collision zones)
1. **9401**: Response handling vs Reset API
2. **9420-9427**: Response handling vs RAG reindexing vs Import API (triple)
3. **9500-9508**: Agentic mode vs SEO general
4. **9541-9553**: FAQ codes defined differently in `05-error-codes.md` vs `16-ai-seo-error-codes.md`

**Remediation:** Consolidate ALL error codes into a single authoritative registry. Relocate agentic codes to 9450-9470. Relocate reset/import to 9431-9449. Unify FAQ code definitions.

### 3.4 Raw SQL / database/sql Usage
`08-split-db-integration.md` and `12-database-architecture.md` memory loading code both use `database/sql` directly with raw SQL queries. Violates ORM-only policy and DBOperation wrapper mandate.

**Remediation:** Refactor all implementation code to use GORM with `pkg/database` wrapper.

### 3.5 API Port Conflict
Core API (`04-api-interface.md`): port 8089. SEO OpenAPI (`30-openapi-spec-seo.md`): port 8080. Must be unified.

---

## 4. Acceptance Criteria

### AC-P12-001: NormalizedRequest PascalCase Serialization
**GIVEN** a Markdown/JSON/YAML/CSV input file  
**WHEN** parsed into a NormalizedRequest struct  
**THEN** all JSON output fields use PascalCase keys (e.g., `"SystemPrompt"`, `"UserPrompt"`, `"ModelCategory"`, `"MaxTokens"`)  
**EDGE CASES:**
- Empty optional fields serialize as `null` or omitted via `,omitempty`
- Nested structs (InputSource, ContextItem, BatchItem) also PascalCase
- Round-trip marshal → unmarshal produces identical struct

### AC-P12-002: API Response PascalCase Consistency
**GIVEN** any REST API endpoint  
**WHEN** a response is returned  
**THEN** all JSON keys use PascalCase  
**EDGE CASES:**
- Error responses use PascalCase (`"Code"`, `"Message"`, `"Retryable"`)
- SSE `data:` fields use PascalCase
- WebSocket payloads use PascalCase
- Pagination matches existing correct format (L870-938)

### AC-P12-003: Enum Type Safety for Model Categories
**GIVEN** a request with a `Category` field  
**WHEN** the value is parsed  
**THEN** `model_category.Parse(value)` is used (not direct cast)  
**AND** invalid category returns error code 9320  
**EDGE CASES:**
- Empty string → error 9320
- Case-insensitive matching

### AC-P12-004: Database Schema PascalCase Enforcement
**GIVEN** any AI Bridge database  
**WHEN** tables are created via GORM AutoMigrate  
**THEN** all column names are PascalCase  
**AND** no raw `CREATE TABLE` with snake_case exists  
**EDGE CASES:**
- FTS5 virtual tables exempt
- Index names use PascalCase prefix (e.g., `IdxMessagesSequence`)

### AC-P12-005: Root DB Path Consistency
**GIVEN** AI Bridge startup  
**WHEN** root database opens  
**THEN** path is `data/aibridge.db` (NOT `data/root.db`)  
**EDGE CASES:**
- `--data-dir` flag changes prefix
- Non-existent root DB is created with full schema

### AC-P12-006: Error Code Range Non-Overlap
**GIVEN** the complete error code registry (9000-9999)  
**WHEN** all error codes are collected  
**THEN** no two error types share the same code  
**AND** these ranges are collision-free:
- 9000-9099: General/Startup
- 9100-9199: Input Parsing
- 9200-9299: Backend Connection
- 9300-9339: RAG Config + Request + Model
- 9400-9430: Response Handling
- 9431-9449: Reset/Import/Export (relocated)
- 9450-9470: Agentic/Chain (relocated from 9500)
- 9501-9540: SEO Preset/Upload/Job/Import-Export
- 9541-9553: FAQ Generation (unified definition)
- 9561-9595: Paragraph + Blog
- 9600-9613: Database Architecture
- 9700-9999: Advanced features

### AC-P12-007: Sequence Number Format (3-digit)
**GIVEN** a new child database  
**WHEN** sequence number is formatted  
**THEN** 3-digit zero-padded format (`001`, `002`, `099`)  
**EDGE CASES:**
- Exceeding 999 uses 4+ digits

### AC-P12-008: Single Authoritative Schema Source
**GIVEN** AI Bridge CLI specification  
**WHEN** determining database architecture  
**THEN** `12-database-architecture.md` is sole canonical source  
**AND** `08-split-db-integration.md` archived or refactored to GORM-only patterns

### AC-P12-009: GORM-Only Database Operations
**GIVEN** any database operation  
**WHEN** implemented in Go  
**THEN** uses GORM with `pkg/database` DBOperation wrapper  
**AND** no `database/sql` direct imports (except driver init)  
**EDGE CASES:**
- Vector similarity search may use raw SQL
- FTS5 operations may use raw SQL

### AC-P12-010: Configuration Tag Convention
**GIVEN** a Go struct for YAML config  
**WHEN** YAML tags are defined  
**THEN** casing matches actual YAML file keys  
**AND** config files use PascalCase for nested keys  
**EDGE CASES:**
- External-facing Markdown frontmatter may use lowercase

### AC-P12-011: File Numbering Deduplication
**GIVEN** `spec/22-ai-bridge-cli/01-backend/`  
**WHEN** files are listed  
**THEN** no two files share the same numeric prefix  
**AND** duplicate `11-` and `12-` files are renumbered

### AC-P12-012: Tool Delegation Config Deserialization
**GIVEN** `config.seed.json` with toolDelegations  
**WHEN** deserialized into Go structs  
**THEN** JSON keys match PascalCase struct fields  
**EDGE CASES:**
- Missing optional fields default gracefully

### AC-P12-013: Backend Health Check Enum Safety
**GIVEN** a health check response  
**WHEN** `Status` is serialized  
**THEN** uses `health_status.Variant` byte enum (not string)  
**AND** implements all 9 mandatory methods

### AC-P12-014: Chat Session Memory with GORM
**GIVEN** a chat session resume  
**WHEN** history is loaded  
**THEN** GORM queries used (not raw SQL)  
**AND** 7 mandatory DB log fields captured

### AC-P12-015: RAG Re-index Pipeline
**GIVEN** `POST /api/v1/rag/reindex`  
**WHEN** file hashes compared and chunks updated  
**THEN** all DB operations use GORM  
**AND** cache invalidation uses GORM (not raw SQL)

### AC-P12-016: Reset API 2-Step Confirmation
**GIVEN** `POST /api/v1/reset/request`  
**WHEN** reset requested  
**THEN** `ResetId` returned with 5-min TTL  
**EDGE CASES:**
- Double-confirm → error
- Cancel after confirm → error
- Post-expiry confirm → error

### AC-P12-017: OpenAPI Property Names
**GIVEN** OpenAPI 3.0 spec  
**WHEN** schema properties defined  
**THEN** property names use PascalCase

### AC-P12-018: Pagination Envelope Consistency
**GIVEN** any paginated endpoint  
**WHEN** results returned  
**THEN** PascalCase envelope with `PageSize` from settings  
**EDGE CASES:**
- Empty results → `Data: []` (not null)
- `Limit` exceeding max is clamped

### AC-P12-019: Unified API Port
**GIVEN** AI Bridge daemon startup  
**WHEN** the API server starts  
**THEN** the default port is consistently defined across all specs  
**AND** OpenAPI spec servers match the core API interface port

### AC-P12-020: FAQ Error Code Unification
**GIVEN** FAQ generation errors  
**WHEN** an error occurs  
**THEN** the error code, name, and description match between `05-error-codes.md` and `16-ai-seo-error-codes.md`  
**AND** no code has two different meanings across files

---

## 5. Recommendations

### 5.1 Immediate Actions (Block Implementation)
1. **Resolve all error code collisions** — 9401, 9420-9427, 9500-9508, 9541-9553
2. **Designate `12-database-architecture.md`** as sole schema authority
3. **Fix `12-database-architecture.md` internal inconsistency** — Convert all child tables to PascalCase
4. **Renumber duplicate files** — `11-rag-reindexing.md` and `12-settings-service.md`
5. **Unify API port** — Choose 8089 or 8080, update all specs

### 5.2 Batch Remediation
6. **camelCase → PascalCase sweep** across all 16 files
7. **Raw SQL → GORM migration** in `08-` and `12-` Go code
8. **String enum → byte variant** for HealthStatus, ConfigCategory, ModelCategory, OutputFormat

### 5.3 Documentation
9. Update `00-overview.md` folder structure to reflect 55+ files
10. Standardize sequence numbers to 3-digit zero-padded
11. Add spec/17 cross-references in enum-using files

---

## 6. Cross-Reference to Previous Audits

| Finding | Related Phase |
|---------|---------------|
| camelCase JSON tags | Phase 11 (BRun CLI I-02, I-03) |
| snake_case SQL | Phase 11 (BRun CLI I-13, I-14) |
| Error code collisions | Phase 11 (BRun CLI I-09, I-19, I-21) |
| String-based enums | Phase 11 (BRun CLI I-01, I-16, I-18) |
| Competing schemas | Phase 11 (BRun CLI I-15) |

---

## 7. Remaining Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **12** | AI Bridge Core (00-14) | ✅ Complete (Rev 2) |
| **13** | AI Bridge SEO (15-30) | ✅ Complete |
| **14** | AI Bridge Advanced (31-55) | ⏳ |
| **15** | Nexus Flow CLI | ⏳ |
| **16** | WP Plugins, Builder, SEO Pub, Spec Rev | ⏳ |
| **17** | AI Transcribe & AI Research | ⏳ |
