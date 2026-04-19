# 07 — Snake-Case Log Keys & Inline Function Calls in Spec Code Examples

**Created:** 2026-02-26  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** High

---

## Issue Summary

### What happened

Spec code examples across Go and PHP files used snake_case log context keys (e.g., `"project_id"`, `'stack_trace'`, `"site_id"`) and inline function calls in `if` conditions (e.g., `if userId := GetUserId(ctx); userId != ""`), both of which violate established coding standards.

### Where it happened

- **Feature / Module:** Cross-cutting — all spec code examples
- **File paths (snake_case log keys — 20+ files):**
  - `spec/11-spec-management-software/13-shared-packages/07-integration-patterns.md`
  - `spec/11-spec-management-software/14-microservices/02-specmanager.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/03-config-system.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/04-site-service.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/05-plugin-service.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/06-file-watcher.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/07-sync-service.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/08-publish-service.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/09-backup-service.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/10-wp-rest-client.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/13-error-management.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/16-split-db-architecture.md`
  - `spec/30-wp-plugin/05-wp-plugin-publish/02-frontend/26-ui-patterns.md`
  - `spec/11-spec-management-software/05-features/22-golang-search-cli/16-observability.md`
  - `spec/01-general-spec/02-systems/01-logging-system-systems.md`
  - `spec/01-general-spec/02-systems/03-conditional-helpers-systems.md`
  - `spec/01-general-spec/10-wordpress/07-overview-wordpress.md`
  - `spec/01-general-spec/10-wordpress/01-plugin-structure-wordpress.md`
  - `spec/01-general-spec/10-wordpress/02-rest-api-wordpress.md`
  - `spec/01-general-spec/10-wordpress/03-cron-system-wordpress.md`
  - `spec/01-general-spec/10-wordpress/04-admin-ui-wordpress.md`
  - `spec/01-general-spec/10-wordpress/05-sanitization-wordpress.md`
  - `spec/01-general-spec/10-wordpress/06-configuration-wordpress.md`
  - `spec/11-spec-management-software/12-prompts/01-coding-guideline/04-backend-php.md`
  - `spec/02-coding-guidelines/01-cross-language/04-code-style.md`
  - `spec/31-wp-plugin-builder/12-coding-guidelines.md`
- **File paths (inline function calls — 2 files):**
  - `spec/22-ai-bridge-cli/01-backend/09-agentic-mode.md`
  - `spec/11-spec-management-software/08-roadmap-overview/07-integration-tests-pipeline.md`

### Symptoms and impact

Spec code examples demonstrated patterns that directly contradict the project's coding standards, meaning any implementation following these examples would produce non-compliant code. Violations included:
- **100+ snake_case log context keys** (`stack_trace`, `project_id`, `site_id`, `duration_seconds`, `memory_peak`, `wp_version`, etc.)
- **2 inline function call assignments** in `if` conditions violating P7 rule
- **Snake_case PHP array keys** in config/data structures that should use PascalCase

### How it was discovered

Systematic regex-based scans across the entire spec tree, triggered by user request to enforce the no-magic-strings and camelCase log key rules documented in `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md`.

---

## Root Cause Analysis

### Direct cause

Spec code examples were written before the camelCase log key rule and P7 inline-call prohibition were established, or were written without awareness of these conventions.

### Contributing factors

1. No automated linting of spec code examples against coding standards
2. Multiple spec files authored at different times without cross-checking naming conventions
3. WordPress/PHP ecosystem's native snake_case convention influenced spec authors
4. Go's idiomatic `if err := fn(); err != nil` pattern was over-applied to non-error assignments

### Triggering conditions

Any code example in a spec file that includes log context keys or inline assignments in `if` conditions.

### Why the existing spec did not prevent it

The coding standards documents (`01-coding-standards-foundation.md`, `02-boolean-standards.md`) defined the rules correctly, but:
1. No cross-validation between rule definitions and code examples in other spec files
2. No "Known Pitfalls" sections warned about the WordPress snake_case influence
3. The P7 rule originally lacked exemptions for `if err := fn(); err != nil`, creating a contradiction with idiomatic Go error handling

---

## Fix Description

### What was changed in the spec

**Phase 1 — Inline function calls (P7 rule):**
- Updated `spec/02-coding-guidelines/03-golang/02-boolean-standards.md` and `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` to add explicit exemptions for error propagation, panic recovery, comma-ok, and type assertions
- Fixed 2 non-exempt violations in `09-agentic-mode.md` and `07-integration-tests-pipeline.md`

**Phase 2 — Snake_case log context keys:**
- Fixed 100+ snake_case log context keys across 20+ spec files
- Converted Go keys: `"project_id"`→`"projectId"`, `"spec_id"`→`"specId"`, `"site_id"`→`"siteId"`, `"trace_id"`→`"traceId"`, `"duration_ms"`→`"durationMs"`, `"word_count"`→`"wordCount"`, `"content_changed"`→`"contentChanged"`, etc.
- Converted PHP keys: `'stack_trace'`→`'stackTrace'`, `'php_version'`→`'phpVersion'`, `'wp_version'`→`'wpVersion'`, `'previous_version'`→`'previousVersion'`, `'duration_seconds'`→`'durationSeconds'`, `'memory_peak'`→`'memoryPeak'`, `'user_id'`→`'userId'`, etc.
- Converted PHP PascalCase array keys: `'plugin_slug'`→`'PluginSlug'`, `'sync_id'`→`'SyncId'`, `'chunk_size'`→`'ChunkSize'`, etc.
- Renamed snake_case PHP classes: `Sync_Result`→`SyncResult`, `Publish_Result`→`PublishResult`, `Backup_Service`→`BackupService`

### New rules or constraints added

1. **P7 exemptions formalized:** Error propagation (`if err := fn(); err != nil`), panic recovery, comma-ok patterns, and type assertions are explicitly exempt from the inline-call prohibition
2. **camelCase log keys rule reinforced:** All log context keys must use camelCase; external API parameters (WordPress `permission_callback`, etc.) are exempt
3. **Memory updated:** `.lovable/memories/architecture/naming-conventions/context-keys.md` and `.lovable/memories/architecture/coding-standards/control-flow.md` both updated with comprehensive rules and exemptions

### Why the fix resolves the root cause

The fixes correct all existing code examples to comply with the established naming conventions, eliminating the possibility of copy-paste propagation of non-compliant patterns. The updated memory files ensure future AI-generated code follows the same conventions.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Iterations History

### Iteration 1 — P7 inline-call scan

- **What was tried:** Broad scan for all `if x := fn()` patterns
- **Outcome:** Found 341 matches, but majority were idiomatic `if err := fn(); err != nil` — required adding exemptions to the P7 rule before fixing actual violations

### Iteration 2 — Snake_case log key scan (first pass)

- **What was tried:** Targeted scan for `WithContext("snake_case")`, `zap.String("snake_case")`, and `Logger::*('snake_case' =>)` patterns
- **Outcome:** Fixed 50+ violations across wp-plugin-publish and general-spec files

### Iteration 3 — Snake_case log key scan (second pass)

- **What was tried:** Broader scan for remaining `'stack_trace'`, `"project_id"`, and similar patterns in spec-management-software and wordpress spec files
- **Outcome:** Found and fixed 58 additional violations across 9 more files, achieving zero remaining violations

---

## Prevention and Non-Regression

### Prevention rule

All log context keys in spec code examples must use camelCase. PHP internal array keys must use PascalCase. External API parameters (WordPress core hooks, third-party APIs) are exempt. Inline function call assignments in `if` conditions are prohibited except for error propagation, panic recovery, comma-ok, and type assertions.

### Acceptance criteria / test scenarios

1. `grep -rn "'[a-z]\+_[a-z]\+'\s*=>" spec/ --include="*.md"` should return only WordPress-native keys (`permission_callback`, `sanitize_callback`, `hide_empty`, etc.) and database column references
2. `grep -rn '"[a-z]\+_[a-z]\+",\s*\w' spec/ --include="*.md"` should return only exempt patterns (error handling, test names, DB columns)
3. `grep -rn "WithContext(\"[a-z]\+_[a-z]\+\"" spec/ --include="*.md"` should return zero results

### Guardrails or linting policies

None currently automated. Recommend adding to consistency report scan checklist.

### Spec sections updated

- `spec/02-coding-guidelines/03-golang/02-boolean-standards.md` — P7 exemptions
- `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` — P7 exemptions
- `.lovable/memories/architecture/coding-standards/control-flow.md` — Updated
- `.lovable/memories/architecture/naming-conventions/context-keys.md` — Updated
- `.lovable/memories/architecture/coding-standards/no-magic-strings-log-keys.md` — Referenced

---

## TODO and Follow-Ups

- [x] All snake_case log context keys fixed to camelCase
- [x] All inline function call violations fixed
- [x] P7 exemptions documented
- [x] Memory files updated
- [ ] Add log key naming check to 99-consistency-report.md scan checklist

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/14-snake-case-log-keys-and-inline-calls.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [x] Iterations recorded
