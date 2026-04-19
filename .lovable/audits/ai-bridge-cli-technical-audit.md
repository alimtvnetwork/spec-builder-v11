# AI Bridge CLI Technical Audit Report

**Audit Date:** 2026-03-04  
**Auditor:** AI Technical Audit  
**Scope:** `spec/22-ai-bridge-cli/` (58+ backend files + rubric validation + frontend/deploy + consistency report)  
**Methodology:** Same as GSearch/BRun CLI audits — coding standards, cross-references, enum compliance, function design

---

## Summary

| Category | Score | Status |
|----------|-------|--------|
| Enum Architecture Compliance | 65% | ⚠️ Needs Remediation |
| Function Design Compliance | 35% | 🔴 Critical |
| Error Code Consistency | 40% | 🔴 Critical |
| Error Constant Naming | 50% | 🔴 Critical |
| Cross-Reference Integrity | 70% | ⚠️ Issues Found |
| Version Consistency | 40% | 🔴 Critical |
| Rubric Validation System | 75% | ⚠️ Minor Issues |
| RAG Pipeline Architecture | 80% | ⚠️ Minor Issues |
| Naming Convention Compliance | 75% | ⚠️ Issues Found |
| **Overall Health Score** | **58/100** | **Grade: D+** |

---

## Critical Findings

### C-01: Pervasive Tuple Return Violations

**Severity:** 🔴 Critical  
**Standard:** `function-design.md` — single-return rule (`apperror.Result[T]`)  
**Affected Files:** 01-architecture, 04-api-interface, 11-rag-reindexing, 36-session-scoped-rag, 51-vector-db, 54-memory-retrieval, 57-settings-service

Almost every Go function in the spec returns `(*T, error)` or `(T, error)` tuples:

| File | Function | Current Return | Required Return |
|------|----------|----------------|-----------------|
| `01-architecture.md` | `InputParser.Parse()` | `(*NormalizedRequest, error)` | `apperror.Result[NormalizedRequest]` |
| `01-architecture.md` | `BackendAdapter.Generate()` | `(*Response, error)` | `apperror.Result[Response]` |
| `01-architecture.md` | `BackendAdapter.GenerateStream()` | `(<-chan StreamChunk, error)` | `apperror.Result[<-chan StreamChunk]` |
| `01-architecture.md` | `BackendAdapter.ListModels()` | `([]ModelInfo, error)` | `apperror.Result[[]ModelInfo]` |
| `01-architecture.md` | `BackendManager.SelectBackend()` | `(BackendAdapter, error)` | `apperror.Result[BackendAdapter]` |
| `51-vector-db.md` | `VectorStore.Query()` | `(*QueryResult, error)` | `apperror.Result[QueryResult]` |
| `51-vector-db.md` | `EmbeddingProvider.Embed()` | `([]float32, error)` | `apperror.Result[[]float32]` |
| `51-vector-db.md` | `NewChromemStore()` | `(*ChromemStore, error)` | `apperror.Result[ChromemStore]` |
| `54-memory-retrieval.md` | `Retriever.Retrieve()` | `([]RetrievalResult, error)` | `apperror.Result[[]RetrievalResult]` |
| `36-session-scoped-rag.md` | `StartSession()` | `(*Session, error)` | `apperror.Result[Session]` |
| `36-session-scoped-rag.md` | `CloseSession()` | `error` | `*apperror.AppError` |
| `57-settings-service.md` | `SettingsService.GetString()` | `(string, error)` | `apperror.Result[string]` |
| `57-settings-service.md` | `SettingsService.GetInt()` | `(int, error)` | `apperror.Result[int]` |
| `57-settings-service.md` | All Get* methods | `(T, error)` | `apperror.Result[T]` |
| `11-rag-reindexing.md` | `RAGManager.InvalidateCaches()` | `error` | `*apperror.AppError` |

**Impact:** ~50+ functions violate the single-return rule.

---

### C-02: Error Code Range Overlaps (3 Conflicts)

**Severity:** 🔴 Critical

#### Conflict 1: Rubric Validation vs GSearch Context (9840-9845)

| Source | Code | Constant |
|--------|------|----------|
| `58-rubric-validation/00-overview.md` | 9840 | `ERR_RUBRIC_JUDGE_FAILED` |
| `error-codes.json` (GSearch Context) | 9840 | `ErrContextDetectionFailed` |
| `58-rubric-validation/00-overview.md` | 9841 | `ERR_RUBRIC_MAX_RETRIES` |
| `error-codes.json` (GSearch Context) | 9841 | `ErrGSearchNotAvailable` |
| Overlap continues through 9845 | | |

**Both claim 9840-9845.** The rubric validation system is not registered in `error-codes.json` at all.

#### Conflict 2: Memory Retrieval vs Adaptive Reasoning (9820-9826)

| Source | Code | Constant |
|--------|------|----------|
| `54-memory-retrieval-best-practices.md` | 9820 | `RETRIEVAL_FAILED` |
| `05-error-codes.md` / `error-codes.json` | 9820 | `ErrReasoningModeInvalid` |
| `54-memory-retrieval-best-practices.md` | 9821 | `TAG_PREFILTER_FAILED` |
| `05-error-codes.md` / `error-codes.json` | 9821 | `ErrReasoningTimeout` |
| Overlap continues through 9826 | | |

#### Conflict 3: RAG Reindexing vs Response Handling (9420-9421)

| Source | Code | Constant |
|--------|------|----------|
| `11-rag-reindexing.md` | 9420 | `REINDEX_SOURCE_NOT_FOUND` |
| `05-error-codes.md` | 9420 | `ErrOutputFormatFailed` |
| `11-rag-reindexing.md` | 9421 | `REINDEX_PERMISSION_DENIED` |
| `05-error-codes.md` | 9421 | `ErrOutputWriteFailed` |

---

### C-03: Error Constant Naming Violations (SCREAMING_SNAKE_CASE)

**Severity:** 🔴 Critical  
**Standard:** Error constants must use PascalCase with `Err` prefix (e.g., `ErrRubricJudgeFailed`)

| File | Found | Required |
|------|-------|----------|
| `58-rubric-validation/00-overview.md` | `ERR_RUBRIC_JUDGE_FAILED` | `ErrRubricJudgeFailed` |
| `58-rubric-validation/00-overview.md` | `ERR_RUBRIC_MAX_RETRIES` | `ErrRubricMaxRetries` |
| `58-rubric-validation/00-overview.md` | `ERR_RUBRIC_PARSE_FAILED` | `ErrRubricParseFailed` |
| `58-rubric-validation/00-overview.md` | `ERR_RUBRIC_PROFILE_UNKNOWN` | `ErrRubricProfileUnknown` |
| `58-rubric-validation/00-overview.md` | `ERR_RUBRIC_DIMENSION_UNKNOWN` | `ErrRubricDimensionUnknown` |
| `58-rubric-validation/00-overview.md` | `ERR_RUBRIC_THRESHOLD_INVALID` | `ErrRubricThresholdInvalid` |
| `36-session-scoped-rag-memory.md` | `RAG_MEMORY_LOAD_FAILED` | `ErrRagMemoryLoadFailed` |
| `36-session-scoped-rag-memory.md` | `RAG_MEMORY_THRESHOLD_EXCEEDED` | `ErrRagMemoryThresholdExceeded` |
| `36-session-scoped-rag-memory.md` | `RAG_ARCHIVE_FAILED` | `ErrRagArchiveFailed` |
| `36-session-scoped-rag-memory.md` | `RAG_SESSION_NOT_FOUND` | `ErrRagSessionNotFound` |
| `36-session-scoped-rag-memory.md` | `RAG_CHUNK_LIMIT_EXCEEDED` | `ErrRagChunkLimitExceeded` |
| `36-session-scoped-rag-memory.md` | `RAG_FRESH_SESSION_FAILED` | `ErrRagFreshSessionFailed` |
| `54-memory-retrieval-best-practices.md` | `RETRIEVAL_FAILED` | `ErrRetrievalFailed` |
| `54-memory-retrieval-best-practices.md` | `TAG_PREFILTER_FAILED` | `ErrTagPrefilterFailed` |
| `54-memory-retrieval-best-practices.md` | `VECTOR_SEARCH_FAILED` | `ErrVectorSearchFailed` |
| `54-memory-retrieval-best-practices.md` | `LINK_TRAVERSAL_FAILED` | `ErrLinkTraversalFailed` |
| `54-memory-retrieval-best-practices.md` | `TOKEN_BUDGET_EXCEEDED` | `ErrTokenBudgetExceeded` |
| `54-memory-retrieval-best-practices.md` | `EMBEDDING_FAILED` | `ErrEmbeddingFailed` |
| `54-memory-retrieval-best-practices.md` | `KEYWORD_EXTRACTION_FAILED` | `ErrKeywordExtractionFailed` |
| `11-rag-reindexing.md` | `REINDEX_SOURCE_NOT_FOUND` | `ErrReindexSourceNotFound` |
| `11-rag-reindexing.md` | `REINDEX_PERMISSION_DENIED` | `ErrReindexPermissionDenied` |
| `11-rag-reindexing.md` | All 8 error codes | SCREAMING_SNAKE_CASE | PascalCase with `Err` prefix |

**Impact:** 26+ error constants violate naming standards.

---

### C-04: String-Based Enums Instead of byte/iota

**Severity:** 🔴 Critical  
**Standard:** Enum spec v3.0.0 — `type Variant byte` with iota

| File | Type | Current | Required |
|------|------|---------|----------|
| `51-vector-database-integration.md` | `DistanceMetric` | `type DistanceMetric string` with string constants | `distancemetrictype.Variant byte` with iota |
| `57-settings-service.md` | `ConfigCategory` | `type ConfigCategory string` with string constants | `configcategorytype.Variant byte` with iota |
| `36-session-scoped-rag-memory.md` | `SessionCloseAction` | `type SessionCloseAction string` with string constants | `sessioncloseactiontype.Variant byte` with iota |

Note: `53-enum-architecture.md` correctly defines 28 enums with `byte/iota` pattern, but these 3 enums in other files don't follow it.

---

### C-05: Version Number Drift

**Severity:** 🔴 Critical

| Location | Version |
|----------|---------|
| `00-overview.md` (root) | 2.0.0 |
| `01-backend/00-overview.md` | 3.1.0 |
| `99-consistency-report.md` | 3.1.0 |
| `01-backend/01-architecture.md` | 1.0.0 |
| `01-backend/04-api-interface.md` | 2.0.0 |
| `01-backend/05-error-codes.md` | 2.0.0 |
| `01-backend/11-rag-reindexing.md` | 1.0.0 |
| `01-backend/36-session-scoped-rag-memory.md` | 1.0.0 |
| `01-backend/51-vector-database-integration.md` | 1.0.0 |
| `01-backend/53-enum-architecture.md` | (none — uses v3.0.0 spec ref) |
| `01-backend/54-memory-retrieval-best-practices.md` | 1.0.0 |
| `01-backend/57-settings-service.md` | 1.1.0 |
| `01-backend/58-rubric-validation/00-overview.md` | 1.0.0 |
| `error-codes.json` | 1.0.0 |

Root overview says 2.0.0 but backend overview says 3.1.0. No single authoritative version.

---

### C-06: Enum Method Formatting Violations in 53-enum-architecture.md

**Severity:** ⚠️ Major  
**Standard:** Enum spec v3.0.0 — expanded multi-line formatting; `/* standard */` placeholders prohibited

Most of the 28 enums in `53-enum-architecture.md` use compressed single-line format:

```go
// ❌ FOUND (lines 51-52)
const (Invalid Variant = iota; ReadFile; ReadUrl; Search; VectorQuery; Transform; Filter; Aggregate; Branch; Execute)
var variantLabels = [...]string{Invalid: "Invalid", ReadFile: "ReadFile", ...}
```

Only `htmlblogstatustype` (enum 26) shows expanded methods. The other 27 enums say "**Methods:** String, Label, IsValid, ..." without showing the mandatory expanded multi-line implementations.

---

### C-07: nomic-embed-text Embedding Dimension Inconsistency

**Severity:** ⚠️ Major

| File | Stated Dimension |
|------|-----------------|
| `51-vector-database-integration.md` | **768** (lines 68, 293, 258) |
| `04-verification-report.md` | **1536** (line 345) |

The actual nomic-embed-text model produces 768-dimensional vectors. The verification report is wrong.

---

### C-08: Consistency Report Is Stale and Inaccurate

**Severity:** ⚠️ Major

1. **File count mismatch:** Report lists 33 backend files but directory contains 58+ files + voice/ and 58-rubric-validation/ subdirectories.
2. **Claims 100% compliance** but this audit identifies 15+ substantive issues.
3. **Error code range table incorrect:** Reports `9700-9799 = RAG/embedding` but actual spec has `9700-9709 = Revision System` and `9800-9809 = RAG Session Memory`.
4. **Missing modules:** No mention of rubric validation (58-*), adaptive reasoning (37-39), plan system (44-49), vector DB (51), observability (56), or settings service (57).

---

### C-09: Enum Package Name Violation

**Severity:** ⚠️ Minor  
**Location:** `54-memory-retrieval-best-practices.md` line 211

```go
// ❌ FOUND
LinkType: link_type.Related,

// ✅ REQUIRED
LinkType: linktype.Related,
```

---

### C-10: camelCase JSON in Verification Report

**Severity:** ⚠️ Minor  
**Location:** `04-verification-report.md` lines 96-138

SSE event data and API responses use camelCase (`sessionId`, `sequenceNum`, `messageId`, `delta`) instead of PascalCase (`SessionId`, `SequenceNum`, `MessageId`, `Delta`).

---

### C-11: Raw `fmt.Errorf` Usage Instead of apperror

**Severity:** ⚠️ Major  
**Multiple files use `fmt.Errorf()` instead of `apperror.New()` or `apperror.Wrap()`:**

| File | Location |
|------|----------|
| `36-session-scoped-rag-memory.md` | `StartSession()` — `fmt.Errorf("failed to load RAG: %w", err)` |
| `54-memory-retrieval-best-practices.md` | `Retrieve()` — `fmt.Errorf("tag pre-filter: %w", err)` |
| `54-memory-retrieval-best-practices.md` | `Retrieve()` — `fmt.Errorf("embed query: %w", err)` |
| `57-settings-service.md` | `GetTyped[T]()` — `fmt.Errorf("unsupported setting type")` |
| `51-vector-database-integration.md` | `EmbedBatch()` — `fmt.Errorf("failed at index %d: %w", i, err)` |

---

### C-12: SettingsService Type Assertion in GetTyped

**Severity:** ⚠️ Minor  
**Location:** `57-settings-service.md` lines 163-193  
**Standard:** `typing-and-casting.md` — no manual type assertions

The `GetTyped[T]` function uses `any(zero).(type)` and `any(result).(T)` type assertions, which should go through `typecast.CastOrFail[T]`.

---

## Rubric Validation System Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Architecture Design | ✅ Excellent | Generate → Judge → Evaluate → Retry pipeline well-designed |
| 11 Rubric Dimensions | ✅ Complete | Each has scoring criteria, thresholds, weights |
| Profile System | ✅ Well-designed | coding, writing, research, chat, spec, all |
| Self-Validation Engine | ✅ Solid | Best-of-N selection, fail-fast, weighted scoring |
| Error Code Naming | 🔴 Critical | SCREAMING_SNAKE_CASE (C-03) |
| Error Code Range | 🔴 Critical | Overlaps with GSearch Context (C-02) |
| Tuple Returns | 🔴 Critical | `ValidateAndReturn()` returns `(ValidationResult, error)` |
| Database Schema | ✅ Good | GORM models with proper indexes |
| Observability | ✅ Good | Prometheus metrics defined |
| Missing from error-codes.json | ⚠️ Gap | Rubric codes 9840-9845 not registered |

---

## RAG Pipeline Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Session-Scoped Design | ✅ Excellent | Tier 1 (Core) + Tier 2 (Session) well-defined |
| 6-Step Retrieval Algorithm | ✅ Excellent | Keyword → Tag → Tier → Vector → Link → Budget |
| Tag Pre-Filtering | ✅ Strong | <5ms on 100k chunks, eliminates 95%+ |
| Vector DB Integration | ✅ Well-designed | chromem-go with Ollama embeddings |
| Memory Tier System | ✅ Good | 5 tiers with boost multipliers |
| Token Budget Allocation | ✅ Detailed | System/RAG/History/Message/Reserve split |
| Error Naming | 🔴 Critical | SCREAMING_SNAKE_CASE across 3 files |
| Error Code Overlaps | 🔴 Critical | 9820 and 9420 ranges conflict |
| Dimension Inconsistency | ⚠️ Major | 768 vs 1536 for nomic-embed-text |
| String-Based Enums | ⚠️ Major | DistanceMetric, SessionCloseAction |
| Tuple Returns | 🔴 Critical | All interfaces return tuples |

---

## Remediation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| P0 | C-01: Tuple returns → `apperror.Result[T]` | Very High (50+ functions) |
| P0 | C-02: Error code range overlaps (3 conflicts) | Medium |
| P0 | C-03: SCREAMING_SNAKE error constants → PascalCase | Medium (26+ constants) |
| P0 | C-05: Version alignment | Low |
| P1 | C-04: String-based enums → byte/iota | Medium |
| P1 | C-06: Enum method formatting in 53-enum-architecture.md | High (27 enums) |
| P1 | C-07: Embedding dimension inconsistency | Low |
| P1 | C-08: Stale consistency report | High |
| P1 | C-11: `fmt.Errorf` → `apperror.Wrap` | Medium |
| P2 | C-09: Enum package naming | Low |
| P2 | C-10: camelCase JSON in verification report | Low |
| P2 | C-12: Type assertion in GetTyped | Low |

---

## Positive Observations

1. **Rubric Validation System** is architecturally excellent — the Generate→Judge→Evaluate→Retry pipeline with 11 dimensions and configurable profiles is well-designed
2. **RAG Pipeline** is comprehensive — the 6-step retrieval algorithm with tag pre-filtering, memory tiers, and link traversal is a strong design
3. **53-enum-architecture.md** correctly defines 28 enums following the `byte/iota` pattern with proper package naming
4. **Database architecture** follows the Split DB pattern correctly with session-scoped isolation
5. **Error codes (error-codes.json)** uses proper PascalCase `Err` prefix naming (the conflicts are in the individual spec files)
6. **Settings Service** properly avoids `interface{}` with the `SettingValue` union struct
7. **Token Budget Allocation** in the RAG retrieval spec is well-defined with percentage-based tiers
8. **Observability spec (56)** defines Prometheus metrics, health checks, and tracing

---

## Files Audited

| File | Lines | Issues |
|------|-------|--------|
| `00-overview.md` (root) | 171 | C-05 |
| `01-backend/00-overview.md` | 543 | C-05 |
| `01-backend/01-architecture.md` | 253 | C-01 |
| `01-backend/04-api-interface.md` | 968 | C-01 |
| `01-backend/05-error-codes.md` | 380 | C-02 |
| `01-backend/11-rag-reindexing.md` | 438 | C-02, C-03 |
| `01-backend/36-session-scoped-rag-memory.md` | 459 | C-01, C-03, C-04, C-11 |
| `01-backend/51-vector-database-integration.md` | 785 | C-01, C-04 |
| `01-backend/53-enum-architecture.md` | 562 | C-06 |
| `01-backend/54-memory-retrieval-best-practices.md` | 412 | C-01, C-02, C-03, C-09, C-11 |
| `01-backend/57-settings-service.md` | 467 | C-01, C-04, C-12 |
| `01-backend/58-rubric-validation/00-overview.md` | 171 | C-02, C-03 |
| `01-backend/58-rubric-validation/07-code-quality.md` | 114 | Clean |
| `01-backend/58-rubric-validation/12-self-validation-engine.md` | 328 | C-01 |
| `04-verification-report.md` | 536 | C-07, C-10 |
| `99-consistency-report.md` | 238 | C-08 |
| `error-codes.json` | 302 | C-02 (defines authoritative codes) |

**Total lines audited: ~6,627**  
**Total spec files in scope: 70+ (58 backend + frontend + deploy + reports)**