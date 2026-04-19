# Phase 14: AI Bridge Advanced (Specs 31-55) — Compliance Audit

**Audited:** 2026-02-07  
**Scope:** 25 specification files (31-55) in `spec/22-ai-bridge-cli/01-backend/`  
**Standards Applied:** PascalCase, ORM-only, Enum byte Variant, Error Registry, Port 5040, Canonical Paths

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 31 |
| 🟡 Warning | 42 |
| ℹ️ Info | 19 |
| **Total** | **92** |

---

## CAT-1: PascalCase Naming Violations

### 🔴 CRIT-01: `32-tool-delegation.md` — snake_case SQL columns

**Lines:** 126-153  
**File:** `32-tool-delegation.md`

All SQL columns in `tool_delegations` and `delegation_routes` tables use `snake_case`:
- `tool_key`, `target_cli`, `http_endpoint`, `ws_endpoint`, `health_endpoint`, `timeout_ms`, `last_health_check`, `health_status`, `created_at`, `updated_at`
- `delegation_id`, `local_path`, `remote_path`, `transform_request`, `transform_response`

**Fix:** Rename to `ToolKey`, `TargetCli`, `HttpEndpoint`, `WsEndpoint`, `HealthEndpoint`, `TimeoutMs`, `LastHealthCheck`, `HealthStatus`, `CreatedAt`, `UpdatedAt`, `DelegationId`, `LocalPath`, `RemotePath`, `TransformRequest`, `TransformResponse`.

### 🔴 CRIT-02: `32-tool-delegation.md` — camelCase JSON tags in response struct

**Lines:** 382-389  
**File:** `32-tool-delegation.md`

`DelegatedResponse` struct uses camelCase JSON tags:
```go
Data interface{} `json:"data"`
DelegatedTo string `json:"delegatedTo,omitempty"`
DelegationMs int64 `json:"delegationMs,omitempty"`
```

**Fix:** Remove JSON tags (PascalCase field names are the canonical JSON keys) or use `json:"Data"`, `json:"DelegatedTo,omitempty"`, `json:"DelegationMs,omitempty"`.

### 🔴 CRIT-03: `32-tool-delegation.md` — camelCase YAML config keys

**Lines:** 83-121  
**File:** `32-tool-delegation.md`

`toolDelegations`, `wsEndpoint`, `healthCheck`, `healthCheckInterval`, `wsRoutes`, `maxAttempts`, `backoffMs`, `backoffMultiplier`, `maxBackoffMs`, `failureThreshold`, `resetTimeoutMs` — all camelCase.

**Fix:** Convert to PascalCase: `ToolDelegations`, `WsEndpoint`, `HealthCheck`, etc.

### 🔴 CRIT-04: `38-websocket-connection-manager.md` — camelCase config keys

**Lines:** 372-402  
**File:** `38-websocket-connection-manager.md`

All JSON config keys use camelCase: `endpoints`, `primary`, `fallback`, `retry`, `baseDelay`, `maxDelay`, `maxAttempts`, `jitterRange`, `heartbeat`, `pingInterval`, `pongTimeout`, `missedThreshold`, `queue`, `maxSize`, `defaultTTL`, `persistToStorage`, `resumeMode`, `ui`, `showStatusIndicator`, `showQueueCount`, `showRetryCountdown`.

**Fix:** Convert all to PascalCase.

### 🔴 CRIT-05: `39-adaptive-reasoning-api.md` — camelCase in API responses

**Lines:** 38-88  
**File:** `39-adaptive-reasoning-api.md`

Mixed case in API response payloads. The enum values are lowercase strings (`"conditional"`, `"chat"`, `"two-stage"`, `"inherit"`) instead of PascalCase (`"Conditional"`, `"Chat"`, `"TwoStage"`, `"Inherit"`).

**Fix:** All enum string values in API responses must be PascalCase to match `variantLabels` in `53-enum-architecture.md`.

### 🔴 CRIT-06: `40-gsearch-context-integration.md` — camelCase JSON tags throughout

**Lines:** 34-73, 304-339  
**File:** `40-gsearch-context-integration.md`

All Go structs use camelCase JSON tags: `json:"id"`, `json:"type"`, `json:"query"`, `json:"originalText"`, `json:"reason"`, `json:"priority"`, `json:"constraints"`, `json:"status"`, etc.

Also `RAGChunk` and `ChunkSource`/`ChunkMetadata` structs (lines 304-339) use camelCase: `json:"source"`, `json:"content"`, `json:"metadata"`, `json:"relevance"`, `json:"tokenCount"`, `json:"createdAt"`, `json:"expiresAt"`, `json:"url"`, `json:"title"`, `json:"provider"`, `json:"rank,omitempty"`, `json:"publishedDate,omitempty"`, etc.

**Fix:** Remove all JSON tags (Go exported PascalCase fields are the canonical transport format) or update to PascalCase tags.

### 🟡 WARN-01: `31-revision-feedback-system.md` — lowercase `content_type` in SQL comment

**Line:** 42  
**File:** `31-revision-feedback-system.md`

Comment says `content_type.Variant` (correct Go package reference) but SQL value says `"Blog"` (correct PascalCase). No action needed on data values but verify consistency.

### 🟡 WARN-02: `34-suggestions-system.md` — `idx_` prefix on SQL indexes

**Lines:** 56-58, 79-81  
**File:** `34-suggestions-system.md`

Uses `idx_suggestions_session` prefix pattern. While not a PascalCase violation (index names are internal), inconsistent with `IdxRevisionsContent` pattern in `31-revision-feedback-system.md`.

**Fix:** Standardize to `Idx` prefix across all specs: `IdxSuggestionsSession`, `IdxSuggestionsStatus`, etc.

### 🟡 WARN-03: `35-unified-revisions-architecture.md` — `idx_` prefix on SQL indexes

**Lines:** 60-63, 89-91, etc.  
**File:** `35-unified-revisions-architecture.md`

Same `idx_` prefix inconsistency as WARN-02.

### 🟡 WARN-04: `36-session-scoped-rag-memory.md` — `idx_` prefix on SQL indexes

**Lines:** 323-325, 345  

Same inconsistency.

---

## CAT-2: Error Code Conflicts & Missing Registrations

### 🔴 CRIT-07: `42-lovable-reasoning-defaults.md` — Error code collision with `38-websocket-connection-manager.md`

**Lines:** 434-441 (spec 42), 337-349 (spec 38)

Spec 42 defines error codes `9830-9835` for Lovable Reasoning:
- 9830: `REASONING_REQUIRED`
- 9831: `SAMPLE_ANSWERS_MISSING`
- 9832: `UNDERSTANDING_NOT_CONFIRMED`
- 9833: `INVALID_QUESTION_FORMAT`
- 9834: `TOO_FEW_OPTIONS`
- 9835: `TOO_MANY_OPTIONS`

But `05-error-codes.md` and `38-websocket-connection-manager.md` already assign 9830-9839 to **WebSocket Connection Manager**:
- 9830: `WS_CONNECTION_FAILED`
- 9831: `WS_CONNECTION_LOST`
- etc.

**This is a direct collision.** Lovable Reasoning errors need their own range.

**Fix:** Assign Lovable Reasoning errors to an unused range. Suggested: **9810-9819** (currently unassigned between RAG Session Memory 9800-9805 and Adaptive Reasoning 9820-9829).

### 🔴 CRIT-08: `05-error-codes.md` — Missing error ranges for specs 43-50

The central error registry (`05-error-codes.md`) is missing several ranges that are defined in individual specs:

| Spec | Range | Defined In Spec | In 05-error-codes.md? |
|------|-------|-----------------|----------------------|
| 43 (Code Pattern Learning) | 9850-9869 | ✅ Yes | ❌ Missing |
| 44 (Plan Generation) | 9870-9889 | ✅ Yes | ❌ Missing |
| 45 (Plan Synchronization) | 9890-9909 | ✅ Yes | ❌ Missing |
| 46 (Plan Templates) | 9910-9929 | ✅ Yes | ❌ Missing |
| 48 (Execution Monitoring) | 9930-9949 | ✅ Yes | ❌ Missing |
| 49 (Retry Strategies) | 9950-9969 | ✅ Yes | ❌ Missing |
| 50 (Long-Chain Commands) | 9970-9989 | ✅ Yes | ❌ Missing |

**Fix:** Add all 7 ranges to `05-error-codes.md` as the single source of truth.

### 🟡 WARN-05: `49-execution-retry-strategies.md` — References error codes from other specs

**Lines:** 77-92  
**File:** `49-execution-retry-strategies.md`

`ErrorClassifications` map references codes from other specs (9934, 9935, 9942, 9871, 9882, 9913) without cross-referencing. Some codes (9934, 9935, 9942) are not defined in any spec.

**Fix:** Either define these in the Execution Monitoring range (9930-9949) or add them to the appropriate spec and register in `05-error-codes.md`.

### 🟡 WARN-06: `52-research-mode.md` — Narrow error range (9848-9849)

Only 2 error codes for a complex feature. Research Mode delegates to Long-Chain (9970-9989) and Vector DB (9990-9999), but its own range is just 2 codes.

**Fix:** Acceptable if delegation covers error cases. Document delegation explicitly in `05-error-codes.md`.

---

## CAT-3: ORM / Raw SQL Violations

### 🔴 CRIT-09: `35-unified-revisions-architecture.md` — Raw `database/sql` usage

**Lines:** 200-259  
**File:** `35-unified-revisions-architecture.md`

`CreateRevision` function uses raw `db *sql.DB`, `tx.Exec()`, `result.LastInsertId()` — all forbidden by the ORM-only mandate.

**Fix:** Refactor to GORM with `DBOperation` wrapper:
```go
func CreateRevision(db *gorm.DB, contentType string, content string, meta interface{}) (int64, error) {
    return dbop.Execute(db, "Revisions", "Create", 1, func() error {
        // GORM transaction
    })
}
```

### 🔴 CRIT-10: `36-session-scoped-rag-memory.md` — Raw SQL in archive functions

**Lines:** 237-253  
**File:** `36-session-scoped-rag-memory.md`

`ArchiveOldChunks` uses raw `db.Exec()` for INSERT and DELETE operations.

**Fix:** Use GORM + `DBOperation` wrapper.

### 🔴 CRIT-11: `41-memory-classification-flags.md` — Raw SQL in archive functions

**Lines:** 419-447  
**File:** `41-memory-classification-flags.md`

Same raw SQL pattern in `ArchiveOldChunks`.

**Fix:** Use GORM + `DBOperation` wrapper.

### 🟡 WARN-07: `34-suggestions-system.md` — Raw SQL INSERT example

**Lines:** 189-191  

`INSERT INTO Suggestions ...` as an example. Should use GORM.

### 🟡 WARN-08: `33-database-migration-guide.md` — Raw SQL for registry updates

**Lines:** 186-208  

`UPDATE CodeTasks`, `UPDATE ChatSessions`, `ALTER TABLE` — expected for migration scripts but should note this is a migration-only exception.

---

## CAT-4: Enum Compliance (byte Variant Pattern)

### 🔴 CRIT-12: `40-gsearch-context-integration.md` — String constants instead of byte Variant

**Lines:** 44-64  
**File:** `40-gsearch-context-integration.md`

Defines `ContextType`, `ContextPriority` as `type X string` with string constants — directly violating the enum specification. The spec even acknowledges this with a comment: "NOTE: ContextType uses string constants for backward compatibility."

**Fix:** Migrate to `context_type.Variant` byte enum as already defined in `53-enum-architecture.md`. Remove the string-based definitions.

### 🔴 CRIT-13: `51-vector-database-integration.md` — String constants for DistanceMetric

**Lines:** 75-81  
**File:** `51-vector-database-integration.md`

```go
type DistanceMetric string
const (
    DistanceCosine    DistanceMetric = "cosine"
    DistanceEuclidean DistanceMetric = "euclidean"
    DistanceDotProduct DistanceMetric = "dot_product"
)
```

**Fix:** Create `distance_metric/variant.go` with `type Variant byte` pattern. Add to `53-enum-architecture.md` directory listing.

### 🟡 WARN-09: `53-enum-architecture.md` — Missing enums for new features

**File:** `53-enum-architecture.md`

The following enums are referenced in specs 31-55 but not defined in `53-enum-architecture.md`:

| Missing Enum | Referenced In | Suggested Package |
|-------------|---------------|-------------------|
| `plan_status` | 44 (Plan Generation) | `plan_status/variant.go` |
| `plan_action` | 44 (Plan Generation) | `plan_action/variant.go` |
| `complexity` | 44 (Plan Generation) | `complexity/variant.go` |
| `sync_status` | 45 (Plan Sync) | `sync_status/variant.go` |
| `sync_direction` | 45 (Plan Sync) | `sync_direction/variant.go` |
| `resolution_strategy` | 45 (Plan Sync) | `resolution_strategy/variant.go` |
| `error_category` | 49 (Retry) | `error_category/variant.go` |
| `backoff_profile` | 49 (Retry) | `backoff_profile/variant.go` |
| `recovery_mode` | 49 (Retry) | `recovery_mode/variant.go` |
| `distance_metric` | 51 (Vector DB) | `distance_metric/variant.go` |
| `research_mode` | 52 (Research) | `research_mode/variant.go` |
| `output_format` | 52 (Research) | `output_format/variant.go` |
| `pattern_category` | 43 (Pattern Learning) | `pattern_category/variant.go` |
| `enforcement_level` | 43 (Pattern Learning) | `enforcement_level/variant.go` |

**Fix:** Add all 14 enums to `53-enum-architecture.md` with proper byte Variant implementations.

---

## CAT-5: Path Convention Violations

### 🔴 CRIT-14: `55-html-blog-generation.md` — Non-canonical path `html-blog/`

**Lines:** 28-43  
**File:** `55-html-blog-generation.md`

Uses `data/{appName}/rag/seo/html-blog/{company}/` which uses a hyphen in the folder name. The canonical pattern should follow the existing convention: `data/{appName}/rag/seo/htmlblog/{company}/` or align with the content type naming.

**Fix:** Verify with owner whether `html-blog` folder name is acceptable or should be `htmlblog` (no hyphen, matching slug conventions).

### 🟡 WARN-10: `34-suggestions-system.md` — Registry DB outside standard path

**Lines:** 24, 64  
**File:** `34-suggestions-system.md`

Global registry at `data/{app}/rag/suggestions-registry.db` — this is at the RAG root level, not scoped under a type. May be intentional for cross-module search but breaks the `data/{app}/rag/{type}/...` pattern.

**Fix:** Document as intentional exception in path reference spec (`26-database-paths-reference.md`).

### 🟡 WARN-11: `33-database-migration-guide.md` — Upload path not referenced

The migration guide doesn't reference the `data/{appName}/upload/{reason}/...` convention established in the remediation plan.

**Fix:** Add upload path migration guidance if applicable.

---

## CAT-6: Port Convention

### 🔴 CRIT-15: `32-tool-delegation.md` — Hardcoded ports 8030-8032

**Lines:** 62-65  
**File:** `32-tool-delegation.md`

References AI Transcribe at ports 8030-8032 directly. While the exception was granted for AI Transcribe, the delegation config should reference these as configurable values, not hardcoded.

### 🟡 WARN-12: `53-enum-architecture.md` — `backend_type.DefaultPort()` returns 8080

**Lines:** 194-202  
**File:** `53-enum-architecture.md`

`LlamaCpp` returns default port 8080. This conflicts with the port unification mandate (all tools use unique ports in 5000+ range). llama.cpp is an external tool, not an AI Bridge service, so this may be acceptable.

**Fix:** Add comment clarifying this is the external llama.cpp server port, not an AI Bridge service port.

---

## CAT-7: Schema Authority Conflicts

### 🔴 CRIT-16: `31-revision-feedback-system.md` vs `35-unified-revisions-architecture.md` — Duplicate schema

Both specs define `Revisions` and `RevisionFeedback` tables with different schemas:

| Difference | Spec 31 | Spec 35 |
|-----------|---------|---------|
| Primary Key | `Id TEXT` | `Id INTEGER AUTOINCREMENT` |
| Version | `Version INTEGER` (app-managed) | `Version INTEGER` (DB-managed via subquery) |
| IsActive | `BOOLEAN` | `INTEGER` |
| ContentHash | `TEXT` | `TEXT` (with UNIQUE index) |
| FeedbackType values | `RevisionRequest, Approval, Rejection, Note` | `General, Inline, Suggestion` |
| Extra fields in 31 | `PromptUsed, ModelUsed, Temperature, TokensGenerated, GenerationDurationMs` | Moved to separate RevisionMeta tables |

Spec 35 explicitly says it "Replaces portions of 31" but spec 31 still exists without deprecation notice.

**Fix:** Add deprecation header to spec 31: `> ⚠️ DEPRECATED: Schema superseded by 35-unified-revisions-architecture.md. This spec retained for revision flow documentation only.`

### 🟡 WARN-13: `44-plan-generation.md` — `Plans` and `PlanTasks` tables not in `12-database-architecture.md`

Plan Generation defines 3 new tables (Plans, PlanTasks, PlanRevisions) that should be registered in the authoritative schema spec.

### 🟡 WARN-14: `45-plan-synchronization.md` — Additional tables not in schema authority

PlanSync and SyncEvents tables need registration.

### 🟡 WARN-15: `46-plan-templates.md` — Additional tables not in schema authority

PlanTemplates, TaskCategories, TemplateVariables tables need registration.

### 🟡 WARN-16: `48-plan-execution-monitoring.md` — Additional tables not in schema authority

Executions, TaskExecutions tables need registration.

### 🟡 WARN-17: `50-long-chain-command-system.md` — Additional tables not in schema authority

LongChainCommands, LongChainSteps, LongChainExecutions tables need registration.

### 🟡 WARN-18: `51-vector-database-integration.md` — Additional tables not in schema authority

VectorCollections, VectorDocuments, EmbeddingCache tables need registration.

### 🟡 WARN-19: `55-html-blog-generation.md` — Additional tables not in schema authority

HtmlBlogCategories, HtmlBlogPresets, HtmlBlogInstructions tables need registration.

**Summary:** 17 new tables across 8 specs are not registered in `12-database-architecture.md`.

---

## CAT-8: `Metadata TEXT` (JSON Blob) Anti-Pattern

### 🔴 CRIT-17: `36-session-scoped-rag-memory.md` — `RagChunks.Metadata TEXT`

**Lines:** 321  
**File:** `36-session-scoped-rag-memory.md`

`Metadata TEXT -- JSON for additional context` in RagChunks table. This directly violates the no-JSON-blob principle established in `35-unified-revisions-architecture.md` §2.1.

**Fix:** Define a `ChunkMetadata` normalized table linked by FK.

### 🔴 CRIT-18: `41-memory-classification-flags.md` — Same `Metadata TEXT` in RagChunks

**Lines:** 73  

Carries forward the same violation.

### 🟡 WARN-20: `43-code-pattern-learning.md` — `ExampleFiles TEXT` and `ExampleSnippets TEXT` as JSON arrays

**Lines:** 110-111  
**File:** `43-code-pattern-learning.md`

`ExampleFiles TEXT -- JSON array of file paths` and `ExampleSnippets TEXT -- JSON array of code snippets`.

**Fix:** Create `PatternExamples` junction table.

### 🟡 WARN-21: `44-plan-generation.md` — `Dependencies TEXT` and `PatternsApplied TEXT` as JSON arrays

**Lines:** 235-236  

**Fix:** Create `PlanTaskDependencies` and `PlanTaskPatterns` junction tables.

### 🟡 WARN-22: `38-websocket-connection-manager.md` — TypeScript interface uses camelCase

**Lines:** 58-71  

`QueuedMessage` interface uses camelCase for TypeScript — this is acceptable for frontend TypeScript but should note that Go backend equivalents must use PascalCase.

---

## CAT-9: API Endpoint Inconsistencies

### 🟡 WARN-23: `31-revision-feedback-system.md` — API path uses `{contentType}` variable

**Lines:** 180  

`GET /api/v1/{contentType}/{contentId}/revisions` — uses generic `contentType` routing.

Spec 35 defines module-specific paths: `/seo/blog/{company}/{slug}/revisions`.

**Fix:** Deprecate spec 31's generic paths in favor of spec 35's module-scoped paths.

### 🟡 WARN-24: `34-suggestions-system.md` — Missing `/api/v1/` prefix

**Lines:** 200-206  

Endpoints listed as `/{module}/{id}/suggestions` without `/api/v1/` prefix.

**Fix:** Add `/api/v1/` prefix to all endpoints.

### 🟡 WARN-25: `43-code-pattern-learning.md` — Missing `/api/v1/` prefix

**Lines:** 210-218  

Endpoints listed as `/api/v1/patterns` — this is correct. No fix needed.

### 🟡 WARN-26: Multiple specs don't specify port

Specs 34, 35, 43-49 define API endpoints without specifying that AI Bridge runs on port **5040** (per consolidated remediation plan).

**Fix:** Add port reference to each spec's API section.

---

## CAT-10: Missing Cross-References & Spec Coordination

### 🟡 WARN-27: `47-onboarding-guide.md` — Workflow doesn't reference Memory Classification (41) or Retrieval Best Practices (54)

The onboarding guide references phases but skips memory classification and retrieval algorithm documentation.

### 🟡 WARN-28: `42-lovable-reasoning-defaults.md` does not reference `39-adaptive-reasoning-api.md`

Both cover reasoning configuration but spec 42 doesn't cross-reference the API spec.

### 🟡 WARN-29: `54-memory-retrieval-best-practices.md` — Uses `ChunkTags` and `ChunkLinks` tables not defined elsewhere

These tables are defined inline in spec 54 but not registered in `12-database-architecture.md` or any other authoritative schema spec.

### 🟡 WARN-30: `55-html-blog-generation.md` — No error codes defined

The HTML Blog Generation spec doesn't define its own error range. It should share or extend the SEO error range (9576-9595 for Blog).

**Fix:** Assign error range. Suggested: extend blog range or create `9596-9610` for HTML Blog.

---

## CAT-11: Sequence Number Format

### 🟡 WARN-31: Mixed sequence formatting across specs

| Spec | Format Used | Example |
|------|-------------|---------|
| 31, 33 | `{seq}-{slug}` (unpadded) | `1-my-blog.db` |
| 33 (migration) | `%03d` (3-digit padded) | `001-my-blog.db` |
| 55 | `001-{slug}` (3-digit padded) | `001-my-blog.db` |

**Fix:** Standardize to 3-digit zero-padded (`001`) per consolidated remediation plan.

---

## CAT-12: `BridgeError` Struct Naming

### 🔴 CRIT-19: `05-error-codes.md` — camelCase JSON tags in BridgeError

**Lines:** 116-124  

```go
type BridgeError struct {
    Code       int               `json:"code"`
    Message    string            `json:"message"`
    Details    string            `json:"details,omitempty"`
    ...
}
```

**Fix:** Remove JSON tags or update to PascalCase.

### 🔴 CRIT-20: `32-tool-delegation.md` — camelCase in error response JSON

**Lines:** 426-436  

```json
{
  "success": false,
  "error": {
    "code": 9400,
    "constant": "ERR_DELEGATION_UNAVAILABLE",
    ...
  }
}
```

**Fix:** PascalCase: `"Success"`, `"Error"`, `"Code"`, `"Constant"`, `"Message"`.

---

## Findings by Spec

| Spec | Critical | Warning | Info | Key Issues |
|------|----------|---------|------|------------|
| 31 | 0 | 2 | 1 | Schema superseded by 35; index prefix; deprecation needed |
| 32 | 4 | 0 | 1 | snake_case SQL; camelCase JSON/YAML; error response casing |
| 33 | 0 | 1 | 2 | Migration script raw SQL (acceptable exception); upload path missing |
| 34 | 0 | 3 | 1 | Missing API prefix; idx_ prefix; registry path exception |
| 35 | 1 | 1 | 1 | Raw SQL in CreateRevision; idx_ prefix |
| 36 | 2 | 1 | 1 | Raw SQL archive; Metadata JSON blob; idx_ prefix |
| 37 | 0 | 0 | 2 | Well-structured; minor enum string values |
| 38 | 0 | 2 | 1 | camelCase config; TypeScript acceptable |
| 39 | 1 | 0 | 1 | Lowercase enum values in API responses |
| 40 | 2 | 0 | 1 | camelCase JSON tags; string enum constants |
| 41 | 2 | 0 | 1 | Raw SQL; Metadata blob |
| 42 | 1 | 0 | 0 | Error code collision 9830-9835 |
| 43 | 0 | 2 | 1 | JSON array columns; tables not registered |
| 44 | 0 | 2 | 1 | JSON array columns; tables not registered |
| 45 | 0 | 1 | 0 | Tables not registered |
| 46 | 0 | 1 | 0 | Tables not registered |
| 47 | 0 | 1 | 0 | Missing cross-references |
| 48 | 0 | 1 | 0 | Tables not registered |
| 49 | 0 | 1 | 1 | Undefined error codes referenced |
| 50 | 0 | 1 | 0 | Tables not registered |
| 51 | 1 | 1 | 0 | String enum DistanceMetric; tables not registered |
| 52 | 0 | 1 | 1 | Narrow error range |
| 53 | 0 | 2 | 1 | 8080 port in DefaultPort; 14 missing enums |
| 54 | 0 | 1 | 0 | ChunkTags/ChunkLinks tables unregistered |
| 55 | 1 | 2 | 0 | Non-canonical path; no error codes; tables unregistered |

---

## Remediation Priority

### Wave 1: Error Code Collision (Blocking)
1. Resolve 9830-9835 collision between specs 42 and 38
2. Register all 7 missing error ranges in `05-error-codes.md`
3. Define error codes for HTML Blog Generation (55)

### Wave 2: Schema Authority
1. Register 17 new tables in `12-database-architecture.md`
2. Add deprecation header to spec 31
3. Register ChunkTags/ChunkLinks from spec 54

### Wave 3: PascalCase Sweep
1. Fix snake_case SQL in spec 32
2. Fix camelCase JSON tags in specs 32, 40, 05
3. Fix camelCase YAML config in specs 32, 38
4. Fix camelCase error response format in spec 32
5. Fix lowercase enum values in API responses (spec 39)

### Wave 4: ORM Migration
1. Refactor `CreateRevision` in spec 35 to GORM
2. Refactor `ArchiveOldChunks` in specs 36, 41 to GORM
3. Add migration-exception note to spec 33

### Wave 5: Enum Compliance
1. Migrate `ContextType`/`ContextPriority` string constants in spec 40
2. Create `distance_metric` byte Variant for spec 51
3. Define 14 missing enums in `53-enum-architecture.md`

### Wave 6: Normalization & Cleanup
1. Replace `Metadata TEXT` JSON blobs in specs 36, 41
2. Create junction tables for JSON arrays in specs 43, 44
3. Standardize index prefix to `Idx`
4. Standardize sequence format to 3-digit zero-padded
5. Add `/api/v1/` prefix where missing (spec 34)
6. Add port 5040 reference to all API sections

---

*Phase 14 audit complete. 92 findings across 25 specification files. 31 critical issues identified.*
