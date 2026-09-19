# AI Bridge CLI Specification — Changelog


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

All notable changes to the AI Bridge CLI specification are documented here.

---

## v5.0.0 — 2026-03-09

### Global Version Bump

Project-wide major version increment (+1.0.0) applied to all specification files in `22-ai-bridge-cli`.

#### Changed
- All spec files received a major version bump and date update to 2026-03-09.
- Part of a global effort spanning ~638 files across all 30+ spec folders, establishing a new project-wide versioning baseline.

---

## v4.0.1 — 2026-03-05

### fmt.Errorf Elimination

Final scan converting all remaining `fmt.Errorf` calls to `apperror.Wrap`/`apperror.New` with proper multi-line formatting.

#### Changed
- **40-gsearch-context-integration.md**: `EnrichPromptContext` signature `(*EnrichedContext, error)` → `apperror.Result[*EnrichedContext]`; `handleFetchError` signature `(*RecoveryResult, error)` → `apperror.Result[*RecoveryResult]`. All `fmt.Errorf` calls replaced with `apperror.Wrap`/`apperror.New`.
- **29-gsearch-url-extraction.md**: `FetchAuthorityMetrics` internal error accumulation converted from `[]error` with `fmt.Errorf` to `[]*apperror.AppError` with `apperror.Wrap`. `FetchWithFallback` fallback chain converted from `fmt.Errorf` wrapping to `apperror.Wrap` per source. Tuple-style returns (`return nil, ...` / `return cached, nil`) converted to `apperror.Fail[T]`/`apperror.Ok(T)`.
- **45-plan-synchronization.md**: `PlanWatcher.Start()` signature `error` → `*apperror.AppError`; `fmt.Errorf("AB9904: %w", err)` → `apperror.Wrap` with `ErrPlanWatcherFailed`.

#### Not Changed (Exemptions)
- `36-session-scoped-rag-memory.md` L174: `fmt.Errorf` inside `UnmarshalJSON` (EXEMPTED: stdlib interface).
- `51-vector-database-integration.md` L134: `fmt.Errorf` inside `UnmarshalJSON` (EXEMPTED: stdlib interface).
- `35-unified-revisions-architecture.md` L262/L279: `fmt.Errorf` inside `insertMetadata` (EXEMPTED: gorm.Transaction callback).
- `03-startup-modes.md` L297: `fmt.Errorf` inside cobra `RunE` (EXEMPTED: cobra.Command callback).
- `43-code-pattern-learning.md` / `47-onboarding-guide.md` / `40-gsearch-context-integration.md` L719: descriptive text/diagrams, not executable code.

---

## v4.0.0 — 2026-03-04

### Full Compliance Remediation

Comprehensive audit and remediation bringing the AI Bridge CLI specification suite to 100/100 compliance.

#### Version Normalization
- All spec files (00–57, 58-rubric-validation/*, 99-acceptance-criteria) aligned to **Version 4.0.0** with date 2026-03-04.
- Resolved prior version drift across v0.1.0–v3.1.0.
- Frontend spec `02-implementation-checklist` synchronized.

#### Return Signature Migration
- **100+ functions** converted from `(T, error)` tuples to `apperror.Result[T]` or `*apperror.AppError`.
- Multi-return tuples replaced with dedicated outcome structs:
  - `SequenceAllocation` — sequence ID + allocated range
  - `RetryDecision` — should-retry + backoff duration
  - `ReadabilityScore` — score + grade + suggestions
  - `CachedAuthorityResult` — authority data + cache-hit flag
  - `CitatedContent` — content + citation metadata
- Stdlib interface implementations (`MarshalJSON`, `UnmarshalJSON`, `DialContext`) annotated `// EXEMPTED`.

#### Raw Error Conversion
- ~20 raw `error` returns across 11 files converted to `*apperror.AppError`:
  - `MigrateCodeTasks`, `MigrateChatSessions`, `MigrateSeoContent` (33-database-migration-guide)
  - `LoadCsv`, `LoadJson`, `LoadYaml` (19-ai-seo-variable-system)
  - `TrackRows`, `handleAhrefsResponse`, `Cleanup`, `CleanupStale` (29-gsearch-url-extraction)
  - `ProcessFile` (13-ai-seo-generate)
  - `IngestChunk`, `InvalidateCaches` (11-rag-reindexing)
  - `RetryWithBackoff` (16-ai-seo-error-codes)
  - `ArchiveOldChunks` (36-session-scoped-rag-memory)
  - `AcceptSuggestion` (34-suggestions-system)
  - `OnRevisionCreated` (35-unified-revisions-architecture)
  - `Validate` (06-configuration)
- Stdlib boundary functions (`cobra.RunE`, `gorm.Transaction`, `rate.Limiter.Wait`) annotated `// EXEMPTED`.
- `SaveHtml` in 29-gsearch-url-extraction corrected from `(string, error)` tuple to `apperror.Result[string]`.

#### Error Code Remediation
- Resolved overlap between 9900s and 9620s error code ranges.
- All 55 error codes verified allocated across ranges 9000–9499.

#### Naming Convention Remediation
- 130+ constants renamed to PascalCase with `Err` prefix (e.g., `ERR_MODEL_NOT_FOUND` → `ErrModelNotFound`).
- Legacy enum patterns (byte/iota) converted to compliant form.
- Abbreviation casing fixed (e.g., `SeoService` not `SEOService`).

#### Embedding Alignment
- `nomic-embed-text` dimension standardized to 768 across all specs.

---

## v3.1.0 — 2026-01-31

### Initial Specification Suite

- 7 core spec files created (00-overview through 06-configuration).
- Cross-references to `06-ai-integration`, `error-code-registry` established.
- Initial consistency report generated (100/100).

---

*Keep this file updated when specs change.*
