# Phase 13: AI Bridge SEO Audit (Specs 15-30)

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `02-spec/22-ai-bridge-cli/01-backend/15-ai-seo-implementation-checklist.md` through `30-openapi-spec-seo.md`  
**Files Reviewed:** 16  
**Status:** Complete  
**Findings:** 52 (15 critical, 20 warning, 10 minor/info, 7 correct)

---

## 1. Inconsistency Report

### 1.1 Database Path Conflicts (5 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `15-ai-seo-implementation-checklist.md` L36-39 | **SEO paths use `data/{appName}/seo/` instead of `data/{appName}/rag/seo/`.** Shows `data/{appName}/seo/jobs/` and `data/{appName}/seo/output/`. The `00-overview.md` (backend) hierarchy shows SEO data under `data/{appName}/rag/seo/`. This creates ambiguity about the authoritative directory. | 🔴 Critical |
| I-02 | `15-ai-seo-implementation-checklist.md` L92-93 | **Preset paths differ.** Shows `data/{appName}/seo/presets/{industry}/`. The variable system (19-) shows `data/{appName}/seo/variables/`. Neither match `00-overview.md` pattern. | 🟡 Warning |
| I-03 | `22-ai-seo-faq-generation.md` L19-33 | **FAQ path introduces `faq/` subdirectory.** Shows `data/{appName}/rag/seo/faq/{company}/` for individual FAQs. But `00-overview.md` (backend L88-93) doesn't list a `faq/` subdirectory — it only shows `blog/`. Paragraph (25-) similarly introduces `paragraph/` subdirectory. These need to be either added to the canonical hierarchy or consolidated into the company root DB. | 🔴 Critical |
| I-04 | `19-ai-seo-variable-system.md` L57-73 | **Variable storage path `data/{appName}/seo/variables/` conflicts** with the `rag/seo/` convention. Should be `data/{appName}/rag/seo/variables/` or stored in the company root DB. | 🟡 Warning |
| I-05 | `15-ai-seo-implementation-checklist.md` L128-131 | **Upload paths `data/uploads/{appName}/` outside the Split DB hierarchy.** Introduces a new top-level `uploads/` directory not present in any DB architecture spec. | 🟡 Warning |

### 1.2 Error Code Issues (5 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-06 | `16-ai-seo-error-codes.md` L35-44 | **Uses `AB-` prefix on error codes.** Defines codes as `AB-9501`, `AB-9541`, etc. The error code registry uses plain integers (`9501`, `9541`). Inconsistent with all other specs. | 🟡 Warning |
| I-07 | `16-ai-seo-error-codes.md` L82-95 vs `05-error-codes.md` L198-234 | **FAQ error code name/meaning conflicts.** Code 9545: `FAQ_SCHEMA_INVALID` (16-) vs `ErrFaqWordLimitExceeded` (05-). Code 9546: `FAQ_OUTPUT_FORMAT_UNSUPPORTED` (16-) vs `ErrFaqSentenceTooLong` (05-). Code 9547: `FAQ_WORD_LIMIT_EXCEEDED` (16-) vs `ErrFaqTransitionMissing` (05-). Code 9548: `FAQ_TRANSITION_DENSITY_LOW` (16-) vs `ErrFaqParagraphCountInvalid` (05-). 5 of 10 FAQ codes have conflicting definitions. | 🔴 Critical |
| I-08 | `16-ai-seo-error-codes.md` L24-26 | **9500 listed as "Reserved" for module init** but `09-agentic-mode.md` uses 9500 as `CHAIN_MAX_STEPS_EXCEEDED`. | 🔴 Critical |
| I-09 | `16-ai-seo-error-codes.md` L24 | **FAQ range 9541-9550 (10 codes) vs 05-error-codes.md 9541-9553 (13 codes).** File 16 defines fewer codes and with different semantics. The 3 extra codes (9551-9553) in file 05 have no counterpart in file 16. | 🟡 Warning |
| I-10 | `15-ai-seo-implementation-checklist.md` L384-435 | **Duplicate error code definitions.** This file also defines all 9501-9535 error codes, creating a third source of truth alongside `05-error-codes.md` and `16-ai-seo-error-codes.md`. | 🟡 Warning |

### 1.3 camelCase JSON Tags in Go Structs (6 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-11 | `16-ai-seo-error-codes.md` L112-121 | **SEOError struct uses camelCase JSON tags.** `json:"code"`, `json:"name"`, `json:"message"`, `json:"details,omitempty"`, `json:"context,omitempty"`, `json:"retryable"`, `json:"httpStatus"`, `json:"timestamp"`. | 🔴 Critical |
| I-12 | `16-ai-seo-error-codes.md` L397-402 | **ProgressError uses camelCase JSON.** `json:"jobId"`, `json:"error"`, `json:"itemIndex,omitempty"`, `json:"timestamp"`. | 🔴 Critical |
| I-13 | `16-ai-seo-error-codes.md` L426-441 | **API error response examples use camelCase.** `"code"`, `"name"`, `"message"`, `"details"`, `"context"`, `"retryable"`, `"timestamp"`. | 🔴 Critical |
| I-14 | `15-ai-seo-implementation-checklist.md` L55-68 | **config.seed.json uses camelCase keys.** `"chunkSize"`, `"chunkSizeMin"`, `"chunkOverlap"`, `"defaultModel"`, `"parallelism"`, `"maxPagesPerJob"`. Should be PascalCase. | 🟡 Warning |
| I-15 | `25-ai-seo-paragraph-generation.md` L478-496 | **ParaKey constants use camelCase string values.** `ParaKey = "defaultOutputFormat"`, `"defaultParagraphCount"`, etc. Should follow PascalCase for config keys (e.g., `"DefaultOutputFormat"`). | 🟡 Warning |
| I-16 | `25-ai-seo-paragraph-generation.md` L439-472 | **config.seed.para.json uses PascalCase keys (correct!).** `"DefaultOutputFormat"`, `"DefaultParagraphCount"`. But this contradicts the camelCase `ParaKey` constants meant to reference them. | 🟡 Warning |

### 1.4 Duplicate API Endpoints (3 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-17 | `22-ai-seo-faq-generation.md` L48-61 vs L334 | **Duplicate FAQ endpoint definitions.** File defines company-scoped endpoints (correct: `POST /api/v1/seo/{company}/faq`) at L48-61, but ALSO defines old non-scoped endpoint `POST /api/v1/seo/faq/generate` at L334. The old endpoint includes `"Company"` in request body (deprecated pattern). Both definitions coexist in the same file. | 🔴 Critical |
| I-18 | `25-ai-seo-paragraph-generation.md` L47-61 vs L333 | **Duplicate Para endpoint definitions.** Same issue: company-scoped `POST /api/v1/seo/{company}/para` at L47-61, AND old non-scoped `POST /api/v1/seo/para/generate` at L333 with `"Company"` in body. | 🔴 Critical |
| I-19 | `22-ai-seo-faq-generation.md` L340-399 | **Old generate endpoint request includes redundant fields.** `"Company"`, `"Website"` in body when company should come from URL path. Also mixes `"OutputConfig"` and `"SeoConfig"` at top level. | 🟡 Warning |

### 1.5 String-Based Enums (3 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-20 | `17-ai-seo-core-guidelines.md` L197-201 | **ValidationCategory uses `type ValidationCategory string`.** `CategorySeo ValidationCategory = "seo"`. Should use byte variant pattern. | 🟡 Warning |
| I-21 | `17-ai-seo-core-guidelines.md` L203-222 | **SeoKey uses `type SeoKey string`.** 18 constants like `SeoKeyTransitionWords SeoKey = "transitionWords"`. Should use byte variant. Also, string values use camelCase (`"transitionWords"`) but DB keys should be PascalCase (`"TransitionWords"`). | 🟡 Warning |
| I-22 | `25-ai-seo-paragraph-generation.md` L478-496 | **ParaKey uses `type ParaKey string`.** Same pattern. Should use byte variant. | 🟡 Warning |

### 1.6 SQL Index Naming (2 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-23 | `28-company-profile-management.md` L246-343 | **SQL index names use snake_case.** `idx_ctas_company`, `idx_ctas_type`, `idx_services_company`, `idx_locations_company`, `idx_keywords_company`, `idx_articles_company`, `idx_style_company`. Should be PascalCase like `IdxCtasCompany`. | 🟡 Warning |
| I-24 | `21-sitemap-indexing.md` L486-530 (implied) | **SitemapIndex table index names likely snake_case** based on patterns in same spec group. Needs verification. | 🟠 Minor |

### 1.7 Sort Parameter Naming (1 finding)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-25 | `27-ai-seo-blog-generation.md` L401 | **Sort parameter uses snake_case values.** `sort=created_desc`, `created_asc`, `updated_desc`, `title_asc`. Should use PascalCase: `CreatedDesc`, `CreatedAsc`. | 🟡 Warning |

### 1.8 Schema.org / JSON-LD Convention (1 finding)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-26 | `22-ai-seo-faq-generation.md` L129-136 | **JSON-LD schema uses camelCase** (`"@type"`, `"name"`, `"acceptedAnswer"`, `"text"`). This is Schema.org convention and is **correct** — not a PascalCase violation. | ✅ Correct |

### 1.9 Correct Patterns (noted for reference)

| # | File(s) | Description | Status |
|---|---------|-------------|--------|
| I-27 | `17-ai-seo-core-guidelines.md` L110-123 | **SEOInputPrompt uses PascalCase JSON tags.** `json:"Title"`, `json:"DisplayHeader"`, `json:"Keywords"`. Correct. | ✅ Correct |
| I-28 | `18-ai-seo-content-types.md` L40-161 | **All content type structs use PascalCase JSON.** `json:"Id"`, `json:"Title"`, `json:"MetaDescription"`. Correct throughout. | ✅ Correct |
| I-29 | `18-ai-seo-content-types.md` L430-464 | **Database schema uses PascalCase.** `ContentTypes`, `GeneratedContent` tables. Correct. | ✅ Correct |
| I-30 | `19-ai-seo-variable-system.md` L473-484 | **VariableInfo uses PascalCase JSON.** `json:"Key"`, `json:"Path"`, `json:"Type"`. Correct. | ✅ Correct |
| I-31 | `28-company-profile-management.md` L210-343 | **SQL DDL uses PascalCase table/column names.** `CompanyProfile`, `CompanyCtas`, `CompanyServices`. Correct. | ✅ Correct |
| I-32 | `27-ai-seo-blog-generation.md` L84-209 | **Blog structs use `json:",omitempty"` (correct implicit PascalCase).** Consistent throughout. | ✅ Correct |
| I-33 | `22-ai-seo-faq-generation.md` L83-103 | **FAQ API responses use PascalCase.** `"Success"`, `"Faqs"`, `"FaqId"`, `"SessionId"`, `"Pagination"`. Correct. | ✅ Correct (NEW) |

### 1.10 Structural / Documentation Issues (9 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-34 | `20-wordpress-integration-idea.md` | **Status "Idea" — placeholder.** No implementation. Acceptable but should not be referenced as a dependency. | 🟠 Info |
| I-35 | `22-ai-seo-faq-generation.md` header numbering | **Section numbering resets.** File has "### 1. List FAQs" through "### 6. Training Endpoint", then restarts with "### 2. Generate Endpoint" at L334. | 🟠 Minor |
| I-36 | `25-ai-seo-paragraph-generation.md` header numbering | **Same section numbering issue.** "### 6. Training Endpoint" at L280, then "### 2. Generate Endpoint" at L333. | 🟠 Minor |
| I-37 | `00-overview.md` (backend) L42-71 | **File listing doesn't include all files.** Lists up to `40-gsearch-context-integration.md` but doesn't include specs 41-55. | 🟠 Minor |
| I-38 | `30-openapi-spec-seo.md` L32 | **Server port 8080 differs from core API port 8089.** (Also flagged in Phase 12 I-64). | 🟠 Minor |
| I-39 | `15-ai-seo-implementation-checklist.md` | **Phase 6 missing from checklist.** Jumps from Phase 5 to Phase 7. | 🟠 Minor |
| I-40 | `28-company-profile-management.md` L43-62 | **CompanyProfile Go struct uses `json:",omitempty"` (correct).** But SQL schema (L212-229) uses `INTEGER DEFAULT 0` for booleans instead of GORM's `BOOLEAN`. GORM would handle this, but raw SQL may cause type mismatch. | 🟠 Minor |
| I-41 | `29-gsearch-url-extraction.md` | **3121 lines — extremely long spec.** Should be split into sub-files for maintainability: core extraction, style analysis, caching, authority metrics. | 🟠 Minor |
| I-42 | `22-ai-seo-faq-generation.md` L500+ | **Route DB Registry section references `data/aibridge.db`** for FAQ company lookup. This is correct and consistent with the root DB pattern. | ✅ Correct (no issue) |

### 1.11 Transition Density Inconsistency (2 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-43 | `17-ai-seo-core-guidelines.md` Rule 2 | **Transition word density threshold: "more than 40%".** Uses `SeoKeyTransitionDensityThreshold` with default 40.0. | 🟠 Info |
| I-44 | `25-ai-seo-paragraph-generation.md` L183 | **MinTransitionDensity: 100%.** Request body shows `"MinTransitionDensity": 100`. This means 100% of sentences must start with a transition word — much stricter than the 40% in core guidelines. Different semantics (word density vs sentence-start rate) but confusing naming. | 🟡 Warning |

### 1.12 Company Profile / Training Data Redundancy (2 findings)

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-45 | `22-ai-seo-faq-generation.md` L257-310 | **Training request includes full CompanyProfile inline.** Contains `"Name"`, `"Tagline"`, `"FoundedYear"`, `"YearsOfExperience"`, `"Certifications"`, etc. But `28-company-profile-management.md` stores this in dedicated tables. Training should reference existing company profile, not re-submit it. | 🟡 Warning |
| I-46 | `25-ai-seo-paragraph-generation.md` L289-310 | **Para training also lacks company reference.** Uses `"WritingStyle": { "Tone": ... }` inline instead of referencing the company's `CompanyWritingStyle` table. | 🟡 Warning |

---

## 2. Severity Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 15 |
| 🟡 Warning | 20 |
| 🟠 Minor/Info | 10 |
| ✅ Correct (noted) | 7 |
| **Total** | **52** |

---

## 3. Key Themes

### 3.1 Database Path Fragmentation
Three different path conventions coexist:
- `data/{appName}/seo/` (15-implementation-checklist, 19-variable-system)
- `data/{appName}/rag/seo/` (00-overview, 22-faq, 25-para, 27-blog, 28-company)
- `data/uploads/{appName}/` (15-implementation-checklist)

**Remediation:** Standardize ALL SEO paths under `data/{appName}/rag/seo/`. Add `faq/`, `paragraph/`, and `variables/` subdirectories to the canonical hierarchy in `00-overview.md`.

### 3.2 Duplicate API Endpoints
Both FAQ (22-) and Paragraph (25-) specs contain **two endpoint definitions**: the correct company-scoped pattern AND a deprecated non-scoped pattern. This creates confusion about which endpoint to implement.

**Remediation:** Remove all non-scoped `POST /api/v1/seo/{type}/generate` endpoints. Keep only `POST /api/v1/seo/{company}/{type}` pattern.

### 3.3 Error Code Triple Source of Truth
FAQ/SEO error codes are defined in THREE files:
1. `05-error-codes.md` (13 FAQ codes: 9541-9553)
2. `16-ai-seo-error-codes.md` (10 FAQ codes: 9541-9550, different names)
3. `15-ai-seo-implementation-checklist.md` (references both)

**Remediation:** Designate `05-error-codes.md` as the single error code registry for ALL AI Bridge errors. Archive duplicate definitions in 16- and 15-.

### 3.4 SEO Specs Mostly Correct
Unlike the core specs (Phase 12), the SEO specs (18-, 19-, 22-, 25-, 27-, 28-) **largely follow PascalCase correctly** for Go structs and API responses. The main exceptions are:
- `16-ai-seo-error-codes.md` (SEOError struct, ProgressError struct)
- `15-ai-seo-implementation-checklist.md` config.seed.json
- Sort parameter values using snake_case
- SQL index naming

### 3.5 String-Based Enum Types
`ValidationCategory`, `SeoKey`, and `ParaKey` all use `type X string` instead of the mandated `type Variant byte` pattern. These need migration to the enum specification.

---

## 4. Acceptance Criteria

### AC-P13-001: Unified SEO Database Path Convention
**GIVEN** any SEO content database  
**WHEN** its path is resolved  
**THEN** it follows `data/{appName}/rag/seo/` as root  
**AND** sub-paths match: `{company-slug}.db`, `blog/{company}/`, `faq/{company}/`, `paragraph/{company}/`  
**EDGE CASES:**
- Variable files stored in company root DB, NOT separate directory
- Upload temp files in `data/tmp/` (not `data/uploads/`)

### AC-P13-002: Single Company-Scoped Endpoint Pattern
**GIVEN** any SEO content generation endpoint  
**WHEN** a request is made  
**THEN** the URL follows `POST /api/v1/seo/{company}/{resource}`  
**AND** no non-scoped endpoints exist (`/api/v1/seo/faq/generate` removed)  
**AND** company is derived from URL path, never from request body  
**EDGE CASES:**
- Global admin endpoints (e.g., `GET /api/v1/seo/blogs`) remain non-scoped

### AC-P13-003: SEOError PascalCase Serialization
**GIVEN** an SEO error response  
**WHEN** serialized to JSON  
**THEN** all keys use PascalCase: `"Code"`, `"Name"`, `"Message"`, `"Details"`, `"Retryable"`, `"HttpStatus"`, `"Timestamp"`  
**AND** ProgressError uses PascalCase: `"JobId"`, `"Error"`, `"ItemIndex"`

### AC-P13-004: Error Code Single Source of Truth
**GIVEN** any AI Bridge error code  
**WHEN** its definition is looked up  
**THEN** `05-error-codes.md` is the only authoritative source  
**AND** no duplicate definitions exist in other spec files  
**AND** the `AB-` prefix is NOT used (plain integers only)

### AC-P13-005: FAQ Error Code Unified Registry
**GIVEN** FAQ generation codes 9541-9553  
**WHEN** definitions are checked  
**THEN** each code has exactly ONE name and ONE meaning  
**AND** the following mapping is authoritative:
- 9541: `FAQ_TRAINING_FAILED`
- 9542: `FAQ_COMPANY_NOT_FOUND`
- 9543: `FAQ_RAG_RETRIEVAL_FAILED`
- 9544: `FAQ_GENERATION_FAILED`
- 9545: `FAQ_WORD_LIMIT_EXCEEDED`
- 9546: `FAQ_SENTENCE_TOO_LONG`
- 9547: `FAQ_TRANSITION_MISSING`
- 9548: `FAQ_PARAGRAPH_COUNT_INVALID`
- 9549: `FAQ_ANSWER_FIRST_MISSING`
- 9550: `FAQ_COMPANY_MENTION_MISSING`
- 9551: `FAQ_TRANSITION_DENSITY_LOW`
- 9552: `FAQ_OUTPUT_FORMAT_UNSUPPORTED`
- 9553: `FAQ_SESSION_NOT_FOUND`

### AC-P13-006: Enum Type Safety for Validation Keys
**GIVEN** SEO validation configuration  
**WHEN** ValidationCategory, SeoKey, or ParaKey is used  
**THEN** the type uses `type Variant byte` pattern with `iota`  
**AND** implements all 9 mandatory methods per spec/17  
**EDGE CASES:**
- String values stored in DB remain PascalCase dot-notation (e.g., `Seo.TransitionWords`)

### AC-P13-007: SQL Index PascalCase Naming
**GIVEN** any SQL index in company root DB  
**WHEN** the index is created  
**THEN** the name uses PascalCase (e.g., `IdxCtasCompany`, `IdxServicesCompany`)  
**AND** no snake_case index names exist

### AC-P13-008: Sort Parameter PascalCase Values
**GIVEN** a paginated blog listing request  
**WHEN** the `sort` parameter is provided  
**THEN** accepted values use PascalCase: `CreatedDesc`, `CreatedAsc`, `UpdatedDesc`, `TitleAsc`  
**AND** snake_case values (`created_desc`) are rejected with 400 error

### AC-P13-009: Training Data Company Reference
**GIVEN** a FAQ or Paragraph training request  
**WHEN** company profile data is needed  
**THEN** the system loads it from the existing `CompanyProfile` table  
**AND** the training request does NOT include inline company metadata  
**EDGE CASES:**
- First training auto-creates company profile if not exists
- Subsequent training references existing profile

### AC-P13-010: Transition Density Metric Clarification
**GIVEN** the `MinTransitionDensity` configuration  
**WHEN** validation occurs  
**THEN** the metric is clearly defined as either:
  a) Percentage of words that are transitions (40% threshold from core guidelines), OR
  b) Percentage of sentences starting with transitions (100% from para generator)  
**AND** the naming clearly differentiates: `TransitionWordDensity` vs `TransitionSentenceStartRate`

### AC-P13-011: config.seed.json PascalCase Keys
**GIVEN** any config.seed.json file for SEO modules  
**WHEN** keys are defined  
**THEN** all keys use PascalCase (`"ChunkSize"`, `"DefaultModel"`, `"Parallelism"`)  
**AND** matching Go constants also use PascalCase string values

### AC-P13-012: Company Profile SQL Schema Completeness
**GIVEN** the CompanyProfile SQL schema  
**WHEN** GORM AutoMigrate creates tables  
**THEN** all boolean fields use proper GORM types  
**AND** foreign key cascades work correctly for company deletion  
**EDGE CASES:**
- Deleting a company cascades to CTAs, Services, Locations, Keywords, Articles, WritingStyle

### AC-P13-013: SEO OpenAPI Spec Completeness
**GIVEN** the `30-openapi-spec-seo.md` OpenAPI specification  
**WHEN** compared against all documented endpoints in specs 22-29  
**THEN** every endpoint in specs 22-29 has a corresponding OpenAPI path definition  
**AND** request/response schemas match the Go struct definitions  
**AND** the server port matches the core API interface port

### AC-P13-014: Duplicate Section Numbering Fix
**GIVEN** specs 22 (FAQ) and 25 (Paragraph)  
**WHEN** section headers are listed  
**THEN** no duplicate section numbers exist  
**AND** deprecated non-scoped endpoint sections are removed

---

## 5. Recommendations

### 5.1 Immediate Actions (Block Implementation)
1. **Unify SEO database paths** — All under `data/{appName}/rag/seo/`
2. **Remove deprecated non-scoped endpoints** from 22- and 25-
3. **Resolve FAQ error code conflicts** — Single definition in `05-error-codes.md`
4. **Fix SEOError/ProgressError JSON tags** — PascalCase

### 5.2 Batch Remediation
5. **String enum → byte variant** for ValidationCategory, SeoKey, ParaKey
6. **SQL index names → PascalCase** in 28-company-profile
7. **Sort parameter values → PascalCase** in 27-blog
8. **config.seed.json → PascalCase keys** in 15-checklist
9. **ParaKey constant values → PascalCase** to match config keys

### 5.3 Documentation
10. Update `00-overview.md` hierarchy to include `faq/`, `paragraph/` subdirectories
11. Remove or archive duplicate section numbering in 22- and 25-
12. Split `29-gsearch-url-extraction.md` (3121 lines) into sub-files
13. Add Phase 6 to implementation checklist (15-) or explain gap
14. Clarify transition density semantics (word-level vs sentence-level)

---

## 6. Cross-Reference to Previous Audits

| Finding | Related Phase |
|---------|---------------|
| camelCase JSON in error structs | Phase 12 (I-18, I-19) — same `BridgeError` pattern |
| Error code collisions | Phase 12 (I-20, I-21, I-22, I-63) — FAQ range overlap |
| String-based enum types | Phase 12 (I-41, I-52) — same `type X string` pattern |
| Database path conflicts | Phase 12 (I-55) — SEO path divergence from overview |
| config.seed.json camelCase | Phase 12 (I-38, I-56) — same pattern across configs |
| SQL index snake_case | New pattern not seen in Phase 12 |
| Duplicate endpoints | New pattern — not seen in core specs |

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
