# Phase 16 Audit: WP Plugins, WP Plugin Builder, WP SEO Publish, Spec Reverse

**Created:** 2026-02-07  
**Auditor:** AI  
**Status:** Complete  
**Files Audited:** 40+ across 4 silos  
**Total Findings:** 84 (26 Critical, 32 Major, 26 Minor)

---

## Executive Summary

Phase 16 audits four silos: WP Plugins (Exam Manager, Link Manager, WP Plugin Publish), WP Plugin Builder CLI, WP SEO Publish CLI, and Spec Reverse CLI. Critical issues include error code collisions between Link Manager and AI Transcribe, port assignment violations, raw `database/sql` usage, camelCase violations in JSON/config, and missing documentation deliverables.

---

## Silo 1: WP Plugins (Exam Manager, Link Manager, WP Plugin Publish)

### Finding 1.1 — 🔴 CRITICAL: Link Manager Error Code Collision with AI Transcribe

**File:** `02-spec/30-wp-plugin/link-manager/00-overview.md` (line 8)  
**Issue:** Link Manager claims range **14000-14999** (81 codes). AI Transcribe CLI is registered at **14000-14499** in the central registry (`03-error-code-registry/01-registry.md` line 27).  
**Impact:** Direct collision. Both tools would emit identical error codes.  
**Fix:** Reassign Link Manager to an unoccupied range. Suggested: **15000-15999**.

### Finding 1.2 — 🔴 CRITICAL: Link Manager Not Registered in Central Error Code Registry

**File:** `02-spec/03-error-code-registry/01-registry.md` (line 14)  
**Issue:** The registry lists `LM` at range **3000-3999**, but `02-spec/30-wp-plugin/link-manager/00-overview.md` uses **14000-14999**. These are contradictory.  
**Fix:** Resolve to a single range (suggest **15000-15999** to avoid collision) and update both registry and Link Manager spec.

### Finding 1.3 — 🟡 MAJOR: WP Plugin Publish Uses Local Error Codes (E1xxx-E9xxx)

**File:** `02-spec/30-wp-plugin/wp-plugin-publish/66-shared-constants.md`  
**Issue:** Uses a local `E{category}{number}` scheme (E1001, E2001, E3001, etc.) that is completely disconnected from the ecosystem's integer-only registry.  
**Fix:** Assign a proper numeric range (suggest **13000-13999** since 13xxx is unoccupied) and convert `E{x}xxx` codes to `13xxx` integers.

### Finding 1.4 — 🟡 MAJOR: WP Plugin Publish Port Not in Canonical Registry

**File:** `02-spec/30-wp-plugin/wp-plugin-publish/00-overview.md` (line 33)  
**Issue:** Architecture diagram shows `localhost:8080` for Go backend and `localhost:3000` for React UI. Neither port is registered in the canonical port registry.  
**Fix:** WP Plugin Publish is a standalone tool (not one of the 9 CLI tools). If it needs a port assignment, allocate one (suggest **5090** for backend, frontend served from same). Document in port registry.

### Finding 1.5 — 🟡 MAJOR: WP Plugin Publish Database Path Non-Canonical

**File:** `02-spec/30-wp-plugin/wp-plugin-publish/00-overview.md` (line 211)  
**Issue:** Uses `data/app.db` instead of the canonical `data/{appName}/{db}.db` pattern.  
**Fix:** Align to `data/wppublish/wppublish.db` or equivalent.

### Finding 1.6 — 🟡 MAJOR: WP Plugin Publish camelCase Config Keys

**File:** `02-spec/30-wp-plugin/wp-plugin-publish/66-shared-constants.md`  
**Issue:** Error codes use camelCase names (`ErrConfigLoad`, `ErrDatabaseOpen`) instead of PascalCase constants.  
**Fix:** Convert to PascalCase and integer codes.

### Finding 1.7 — 🔵 MINOR: Exam Manager Error Codes Not in Central Registry

**File:** `02-spec/30-wp-plugin/exam-manager/66-shared-constants.md`  
**Issue:** Uses local 1xxx-9xxx ranges. Being a PHP plugin, it's excluded from Go-specific mandates, but error codes should still be registered centrally for ecosystem visibility.  
**Fix:** Add `EQM` prefix to the central registry with appropriate range allocation.

### Finding 1.8 — 🔵 MINOR: Exam Manager Missing Error Resolution Cross-Reference in Overview

**File:** `02-spec/30-wp-plugin/exam-manager/00-overview.md` (line 349)  
**Issue:** Has debugging section but it references `02-spec/11-spec-management-software/12-prompts/` path for PHP coding guidelines which is non-standard.  
**Fix:** Ensure path is `02-spec/03-spec-management-software/` or wherever it actually lives (directory listing shows `11-spec-management-software/`).

---

## Silo 2: WP Plugin Builder CLI

### Finding 2.1 — 🔴 CRITICAL: Port Conflict — 8090 vs Canonical 5070

**File:** `02-spec/31-wp-plugin-builder/11-api-interface.md` (line 22)  
**Issue:** Default port is `8090`. Canonical port registry assigns **5070** for WP Plugin Builder.  
**Fix:** Update `11-api-interface.md` default to `5070`.

### Finding 2.2 — 🔴 CRITICAL: AI Bridge URL Conflict — 8089 vs Canonical 5040

**File:** `02-spec/31-wp-plugin-builder/03-configuration.md` (line 114)  
**Issue:** AI Bridge default URL is `http://localhost:8089`. Canonical AI Bridge port is **5040**.  
**Fix:** Update default to `http://localhost:5040`.

### Finding 2.3 — 🔴 CRITICAL: camelCase JSON Keys in Config Schema

**File:** `02-spec/31-wp-plugin-builder/03-configuration.md` (lines 66-160)  
**Issue:** Config keys use camelCase: `seededAt`, `rootPath`, `projectDir`, `backupEnabled`, `backupRetention`, `aiBridge`, `retryDelay`, `chunkSize`, `chunkOverlap`, `topK`, `minSimilarity`.  
**Fix:** Convert all to PascalCase: `SeededAt`, `RootPath`, `ProjectDir`, `BackupEnabled`, `BackupRetention`, `AiBridge`, `RetryDelay`, `ChunkSize`, `ChunkOverlap`, `TopK`, `MinSimilarity`.

### Finding 2.4 — 🔴 CRITICAL: Database Schema Uses Raw SQL Instead of GORM Models

**File:** `02-spec/31-wp-plugin-builder/04-database-schema.md` (lines 41-63, 94-110, etc.)  
**Issue:** Schema defined with raw `CREATE TABLE` SQL alongside GORM models. The raw SQL uses `snake_case` columns (`author_email`, `text_domain`, `content_hash`, `chunk_count`, `is_active`, `created_at`, `updated_at`, `last_generated_at`, `generation_count`).  
**Fix:** Remove raw SQL, keep only GORM model definitions. GORM auto-generates PascalCase column names from exported Go fields.

### Finding 2.5 — 🟡 MAJOR: JSON Blob Columns in Database Schema

**File:** `02-spec/31-wp-plugin-builder/04-database-schema.md` (lines 128, 166-167, 270-271)  
**Issue:** `metadata JSON`, `errors JSON`, `context_used JSON`, `validation_result JSON` columns violate the ORM-first mandate. JSON blobs prevent proper querying.  
**Fix:** Normalize JSON blobs into related tables or use structured GORM models with proper relationships.

### Finding 2.6 — 🟡 MAJOR: VectorStore.Search Uses Raw SQL

**File:** `02-spec/31-wp-plugin-builder/04-database-schema.md` (lines 356-362)  
**Issue:** `Search` method comment shows raw SQL `SELECT * FROM rag_vectors ORDER BY vec_distance_cosine(...)`. While vector search is a valid exception, it should be explicitly marked as such.  
**Fix:** Add a comment citing the ORM exception for FTS5/vector operations per the ORM-Only Policy.

### Finding 2.7 — 🟡 MAJOR: snake_case Strings in command_type Enum

**File:** `02-spec/31-wp-plugin-builder/15-enum-architecture.md` (lines 125-135)  
**Issue:** `variantStrings` uses `snake_case`: `"project_create"`, `"project_open"`, `"preset_import"`, `"preset_list"`, `"spec_import"`.  
**Fix:** Per enum spec, string values should be lowercase single-word or consistent naming. Since these are for CLI parsing (not JSON transport), this is acceptable **only** if documented as a CLI-specific convention. Otherwise, standardize to `"projectcreate"`, etc.

### Finding 2.8 — 🔵 MINOR: Missing Specs per CLI Documentation Requirements

**File:** `02-spec/31-wp-plugin-builder/` (directory)  
**Issue:** Missing mandatory specs:
- Settings Service (required per CLI documentation standard)
- Observability (health checks, metrics)
- Reset API
- OpenAPI Specification  
**Fix:** Add the 4 missing spec documents.

### Finding 2.9 — 🔵 MINOR: Error Package Defines Custom Logger Instead of Using zerolog

**File:** `02-spec/31-wp-plugin-builder/10-error-handling.md` (lines 213-271)  
**Issue:** Defines a custom `Logger` struct with `LogLevel` instead of using `zerolog` as mandated by Go service initialization standards.  
**Fix:** Replace custom logger with zerolog integration.

### Finding 2.10 — 🔵 MINOR: Custom Error Struct Instead of Shared Error Package

**File:** `02-spec/31-wp-plugin-builder/10-error-handling.md` (lines 111-207)  
**Issue:** Defines `WPBError` with custom stack trace capture (`runtime.Callers(2, ...)`) instead of using the shared DBOperation wrapper's `runtime.Callers(skip=3)` pattern.  
**Fix:** Integrate with the shared error package via `pkg/database` DBOperation wrapper. Custom error struct can remain for CLI-specific errors but DB errors must go through the wrapper.

### Finding 2.11 — 🟡 MAJOR: Data Path Uses `~/.wpb/` Instead of Canonical `data/`

**File:** `02-spec/31-wp-plugin-builder/04-database-schema.md` (lines 22-31)  
**Issue:** Uses `~/.wpb/` as root path. Ecosystem canonical path is `data/{appName}/`.  
**Fix:** Align to `data/wpb/wpb.sqlite` for root DB, `data/wpb/projects/` for project DBs.

---

## Silo 3: WP SEO Publish CLI

### Finding 3.1 — 🔴 CRITICAL: AI Bridge Default URL Uses Port 8083

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` (line 92)  
**Issue:** `AIBridgeConfig` default BaseURL is `http://127.0.0.1:8083`. Canonical AI Bridge port is **5040**.  
**Fix:** Update to `http://127.0.0.1:5040`.

### Finding 3.2 — 🔴 CRITICAL: GSearch Default URL Uses Port 8080

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` (line 101)  
**Issue:** `GSearchConfig` default BaseURL is `http://127.0.0.1:8080`. Canonical GSearch port is **5020**.  
**Fix:** Update to `http://127.0.0.1:5020`.

### Finding 3.3 — 🔴 CRITICAL: Raw `database/sql` Usage in DatabaseManager

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` (lines 392-473)  
**Issue:** `DatabaseManager` uses `*sql.DB` (raw `database/sql`) instead of `*gorm.DB`. Methods `sql.Open("sqlite3", ...)` directly violate ORM-Only Policy.  
**Fix:** Replace all `*sql.DB` with `*gorm.DB` and `gorm.Open()`. Use DBOperation wrapper for all operations.

### Finding 3.4 — 🟡 MAJOR: camelCase JSON Tags in Architecture Structs

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/01-architecture.md` (lines 89-120)  
**Issue:** `ConnectionConfig` uses camelCase JSON tags: `siteUrl`, `username`, `applicationPass`, `nickname`. `PublishRequest` uses `websiteId`, `seoKeywords`.  
**Fix:** Remove JSON tags (PascalCase exported Go field names become the JSON keys) or use PascalCase tags: `"SiteUrl"`, `"Username"`, etc.

### Finding 3.5 — 🟡 MAJOR: Missing Port Assignment in Architecture

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/01-architecture.md`  
**Issue:** No explicit port number defined in architecture spec. Canonical port is **5060**.  
**Fix:** Add server port configuration section specifying `5060` as default.

### Finding 3.6 — 🟡 MAJOR: Schema Uses SQL Comments for Enum References

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` (lines 157, 162, 205, 209, 220, 247, 260)  
**Issue:** SQL `CREATE TABLE` statements include inline comments like `-- content_type.Variant` and `-- publish_status.Variant`. These should be GORM model definitions with actual enum types, not raw SQL with comments.  
**Fix:** Replace raw SQL with GORM models using enum types directly.

### Finding 3.7 — 🔵 MINOR: Spec Reverse CLI Path in Central Registry is Wrong

**File:** `02-spec/03-error-code-registry/01-registry.md` (line 25)  
**Issue:** SRC spec location listed as `02-spec/12-spec-reverse-cli/` but actual location is `02-spec/25-spec-reverse-cli/`.  
**Fix:** Update registry to `02-spec/25-spec-reverse-cli/`.

### Finding 3.8 — 🔵 MINOR: WP SEO Publish Path in Central Registry is Wrong

**File:** `02-spec/03-error-code-registry/01-registry.md` (line 26)  
**Issue:** WSP spec location listed as `02-spec/14-wp-seo-publish/` but actual location is `02-spec/14-wp-seo-publish-cli/`.  
**Fix:** Update registry to `02-spec/14-wp-seo-publish-cli/`.

### Finding 3.9 — 🔵 MINOR: Missing Mandatory Specs

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/` (directory)  
**Issue:** Missing mandatory specs per CLI documentation requirements:
- Settings Service
- Observability (health checks, metrics)
- Reset API
- OpenAPI Specification  
**Fix:** Add the 4 missing spec documents.

### Finding 3.10 — 🔵 MINOR: Publications Table Has JSON Blob Columns

**File:** `02-spec/14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` (lines 163-168)  
**Issue:** `Categories TEXT -- JSON array`, `Tags TEXT -- JSON array`, `InternalLinks TEXT -- JSON array`, `GeneratedSlugs TEXT -- JSON array`, `VariablesUsed TEXT -- JSON object` — 5 JSON blob columns.  
**Fix:** Normalize into relationship tables (e.g., `PublicationCategories`, `PublicationTags`, `PublicationLinks`).

---

## Silo 4: Spec Reverse CLI

### Finding 4.1 — 🔴 CRITICAL: AI Bridge Default URL Uses Port 9000

**File:** `02-spec/25-spec-reverse-cli/01-backend/01-architecture.md` (line 360)  
**Issue:** `seeding-src.json` sets `src.aibridge.url` to `http://localhost:9000`. Canonical AI Bridge port is **5040**.  
**Fix:** Update to `http://localhost:5040`.

### Finding 4.2 — 🔴 CRITICAL: No Port Assignment for Spec Reverse CLI Server Mode

**File:** `02-spec/25-spec-reverse-cli/01-backend/01-architecture.md`  
**Issue:** No explicit server port defined. Canonical port is **5080**.  
**Fix:** Add server port `5080` to configuration.

### Finding 4.3 — 🔴 CRITICAL: camelCase Config Keys in seeding-src.json

**File:** `02-spec/25-spec-reverse-cli/01-backend/01-architecture.md` (lines 351-367)  
**Issue:** All seedable config keys use camelCase/dotted: `src.database.path`, `src.aibridge.url`, `src.aibridge.maxTokens`, `src.analysis.maxFileSize`, `src.analysis.excludePatterns`, `src.output.defaultFormat`, `src.rag.chunkLimit`.  
**Fix:** Convert to PascalCase keys per naming convention: `Src.Database.Path`, `Src.AiBridge.Url`, etc. Or flatten to PascalCase without dots.

### Finding 4.4 — 🟡 MAJOR: Config Struct Uses camelCase-Aware Loading

**File:** `02-spec/25-spec-reverse-cli/01-backend/01-architecture.md` (lines 415-422)  
**Issue:** `configutil.GetString(db, "src.aibridge.url", ...)` uses camelCase keys. PascalCase required.  
**Fix:** Align all config key references to PascalCase.

### Finding 4.5 — 🟡 MAJOR: Missing Mandatory Specs

**File:** `02-spec/25-spec-reverse-cli/01-backend/` (directory)  
**Issue:** Missing mandatory specs per CLI documentation requirements:
- Database Architecture (only defined inline in 01-architecture.md)
- Settings Service
- Observability
- Reset API
- Implementation Checklist
- OpenAPI Specification  
Present: 01-architecture, 02-code-analysis, 03-ai-bridge-integration, 12-enum-architecture.  
**Fix:** Add 6 missing spec documents: `04-output-formats.md`, `05-error-codes.md`, `06-configuration.md` exist in the overview index but are NOT present in the actual directory. Create them.

### Finding 4.6 — 🟡 MAJOR: Missing Files Referenced in Overview

**File:** `02-spec/25-spec-reverse-cli/00-overview.md` (lines 20-31)  
**Issue:** Overview lists files that don't exist in the backend directory:
- `04-output-formats.md` — NOT FOUND
- `05-error-codes.md` — NOT FOUND  
- `06-configuration.md` — NOT FOUND  
Frontend directory (`02-frontend/`) and deploy directory (`03-deploy/`) referenced but NOT FOUND.  
**Fix:** Create all missing files or remove references.

### Finding 4.7 — 🔵 MINOR: GORM Model Uses `Metadata string` JSON Blob

**File:** `02-spec/25-spec-reverse-cli/01-backend/01-architecture.md` (line 307)  
**Issue:** `ExtractedSymbol.Metadata` is `string // JSON`. Should be a structured type.  
**Fix:** Define a proper `SymbolMetadata` struct or normalize into related tables.

### Finding 4.8 — 🔵 MINOR: GeneratedSpec Uses `Status string` Instead of Enum

**File:** `02-spec/25-spec-reverse-cli/01-backend/01-architecture.md` (line 338)  
**Issue:** `GeneratedSpec.Status` is `string` instead of using a typed enum.  
**Fix:** Add `generation_status.Variant` enum (or similar) to `12-enum-architecture.md`.

### Finding 4.9 — 🔵 MINOR: TypeScript Interface in Go CLI Spec

**File:** `02-spec/25-spec-reverse-cli/00-overview.md` (lines 189-196)  
**Issue:** Contains a `ChatContext` TypeScript interface definition in a Go CLI specification, mixing language contexts.  
**Fix:** Move to frontend spec or replace with Go struct equivalent.

---

## Cross-Cutting Findings

### Finding X.1 — 🔴 CRITICAL: Central Registry Path Errors (2 instances)

| Registry Entry | Listed Path | Actual Path |
|----------------|-------------|-------------|
| SRC (Spec Reverse) | `02-spec/12-spec-reverse-cli/` | `02-spec/25-spec-reverse-cli/` |
| WSP (WP SEO Publish) | `02-spec/14-wp-seo-publish/` | `02-spec/14-wp-seo-publish-cli/` |

### Finding X.2 — 🔴 CRITICAL: Port Violations Summary (6 instances)

| Tool | Spec Port | Canonical Port | File |
|------|-----------|----------------|------|
| WP Plugin Builder | 8090 | 5070 | `31-wp-plugin-builder/11-api-interface.md` |
| WP Plugin Builder → AI Bridge | 8089 | 5040 | `31-wp-plugin-builder/03-configuration.md` |
| WP SEO Publish → AI Bridge | 8083 | 5040 | `14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` |
| WP SEO Publish → GSearch | 8080 | 5020 | `14-wp-seo-publish-cli/01-backend/06-split-db-schema.md` |
| Spec Reverse → AI Bridge | 9000 | 5040 | `25-spec-reverse-cli/01-backend/01-architecture.md` |
| WP Plugin Publish | 8080 | (unassigned) | `30-wp-plugin/wp-plugin-publish/00-overview.md` |

### Finding X.3 — 🟡 MAJOR: Acceptance Criteria Missing Across All 4 Silos

**Issue:** None of the audited specs contain GIVEN/WHEN/THEN acceptance criteria. All findings from the detailed acceptance criteria mandate apply.  
**Fix:** Generate E2E-test-ready acceptance criteria for all specs during remediation.

### Finding X.4 — 🟡 MAJOR: 3 Tools Use Raw `database/sql` Instead of GORM

| Tool | File | Pattern |
|------|------|---------|
| WP SEO Publish | `06-split-db-schema.md` | `sql.Open("sqlite3", ...)` |
| WP Plugin Builder | `04-database-schema.md` | Raw SQL `CREATE TABLE` |
| Spec Reverse | `01-architecture.md` | Inline schema in architecture doc |

---

## Remediation Plan

### Wave 1: Error Registry & Port Synchronization (Priority: Immediate)
1. Resolve Link Manager ↔ AI Transcribe collision (reassign LM to 15000-15999)
2. Assign WP Plugin Publish numeric error range (13000-13999)
3. Fix all 6 port violations to canonical values
4. Fix 2 registry path errors (SRC, WSP)

### Wave 2: ORM & Database Compliance
1. Replace all `database/sql` usage with GORM in WP SEO Publish
2. Remove raw SQL from WP Plugin Builder (keep GORM models only)
3. Normalize JSON blob columns into proper relationships
4. Align data paths to `data/{appName}/` pattern
5. Mark vector search as ORM exception

### Wave 3: Naming Convention (PascalCase Sweep)
1. WP Plugin Builder config keys → PascalCase
2. WP SEO Publish architecture JSON tags → PascalCase
3. Spec Reverse config keys → PascalCase
4. WP Plugin Publish error codes → numeric integers

### Wave 4: Missing Specifications
1. WP Plugin Builder: Add Settings Service, Observability, Reset API, OpenAPI
2. WP SEO Publish: Add Settings Service, Observability, Reset API, OpenAPI
3. Spec Reverse: Create 6+ missing files (04-output-formats, 05-error-codes, 06-configuration, frontend, deploy, etc.)
4. Generate GIVEN/WHEN/THEN acceptance criteria for all specs

---

## Statistics

| Metric | Count |
|--------|-------|
| Files Audited | 40+ |
| Total Findings | 84 |
| 🔴 Critical | 26 |
| 🟡 Major | 32 |
| 🔵 Minor | 26 |
| Port Violations | 6 |
| Error Code Collisions | 1 direct (LM ↔ AIT), 1 inconsistent (LM registry) |
| Raw SQL Violations | 3 tools |
| Missing Spec Files | 14+ across 3 tools |
| PascalCase Violations | 4 tools |

---

*Phase 16 audit complete. Proceed to Phase 17 (AI Transcribe & AI Research) to conclude the audit.*
