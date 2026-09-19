# 11 — HTTP Method Magic String Violations

**Created:** 2026-02-27  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Medium

---

## Issue Summary

### What happened

A project-wide scan revealed **363 instances** across **36 spec files** where HTTP method strings are used as raw literals (`method: "POST"`, `method: 'GET'`, etc.) in `fetch()` calls and endpoint configurations, despite the `HttpMethod` enum being defined at `02-spec/02-coding-guidelines/02-typescript/http-method-enum.md` and already adopted in 9 files (183 compliant usages).

### Where it happened

- **Feature / Module:** Frontend spec code examples across all projects
- **File paths:** See [Affected Files](#affected-files) below

### Symptoms and impact

- **Inconsistency:** 9 files use `HttpMethod.*` correctly while 36 files use raw strings — mixed conventions across the spec tree
- **Violation of HttpMethod enum spec:** The enum spec explicitly marks `method: "POST"` as `❌ WRONG`
- **Cross-language parity gap:** Go backend uses `httpmethod.Variant`; frontend specs should use `HttpMethod.*`
- **Issue #09 scope gap:** Issue #09 fixed `hasMismatch`/`isEqual` helpers but didn't cover `fetch()` method parameters

### How it was discovered

Follow-up verification scan after Issue #09 and Issue #10 resolution on 2026-02-27. User requested a scan for `method: "POST"` / `method: "GET"` patterns specifically.

---

## Root Cause Analysis

### Direct cause

Frontend spec code examples were written before the `HttpMethod` enum spec was created, and existing examples were not retroactively updated.

### Contributing factors

1. The `HttpMethod` enum spec (`02-spec/02-coding-guidelines/02-typescript/http-method-enum.md`) was created after most frontend specs were already written
2. Only 9 files (primarily `02-spec/25-gsearch-cli/` and `02-spec/36-wp-seo-publish-cli/`) were updated to use the enum
3. No sweep was performed across the full spec tree when the enum spec was published

### Triggering conditions

Any spec code example using `fetch()` with a `method:` property containing a raw string literal.

### Why the existing spec did not prevent it

The `HttpMethod` enum spec defines the correct pattern but has no enforcement mechanism. Master coding guidelines §8 prohibits magic strings but the `method:` parameter in `fetch()` calls was not explicitly flagged.

---

## Fix Description

### What needs to change in the specs

All 36 affected files need `method: "POST"` → `method: HttpMethod.Post` (and similar for GET, PUT, PATCH, DELETE) replacements in their TypeScript/JavaScript code examples.

### New rules or constraints to add

1. **Rule:** All `fetch()` calls in TypeScript spec examples MUST use `HttpMethod.*` enum constants for the `method` parameter
2. **Rule:** Endpoint configuration arrays MUST use `HttpMethod.*` for method fields
3. **Rule:** Post-creation scan for any new spec file must check for `method: "string"` patterns

### Why the fix resolves the root cause

Replacing all raw strings with enum constants ensures consistency with the `HttpMethod` enum spec and Go backend parity. Combined with enforcement rules, new violations will be caught during review.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Affected Files

### Categorization

| Category | Description | Action |
|----------|-------------|--------|
| **TypeScript fetch()** | `method: 'POST'` in fetch calls | Replace with `HttpMethod.Post` |
| **TypeScript config** | `method: 'GET'` in endpoint arrays | Replace with `HttpMethod.Get` |
| **JavaScript (WP)** | `method: 'POST'` in vanilla JS | Replace with `HttpMethod.Post` |
| **Log/error output** | `Method: "GET"` in log format strings | **Exempt** — runtime output |
| **❌ WRONG examples** | `method: "POST"` in enum spec itself | **Exempt** — intentional bad example |
| **Default data** | `method: 'GET'` as default form value | Context-dependent |

### Tier 1 — High Violation Count (10+ matches each)

| File | ~Count | Key Patterns |
|------|--------|-------------|
| `02-spec/11-spec-management-software/05-features/25-ai-enhancements/02-03-audio-sync.md` | 12 | `method: 'POST'`, `method: 'DELETE'` in upload/transcribe/delete calls |
| `02-spec/11-spec-management-software/05-features/25-ai-enhancements/06-01-sharing-architecture.md` | 10 | `method: 'POST'`, `method: 'PUT'`, `method: 'DELETE'` in sharing API |
| `02-spec/11-spec-management-software/05-features/25-ai-enhancements/03-02-plan-execution.md` | 10 | `method: 'POST'` in plan execute/pause/resume/cancel |
| `02-spec/11-spec-management-software/05-features/25-ai-enhancements/03-03-approval-workflow.md` | 10 | `method: 'POST'`, `method: 'PATCH'` in approval API |
| `02-spec/27-ai-bridge-cli/02-frontend/05-dashboard-specification.md` | 10 | `method: 'POST'`, `method: 'PATCH'` in execution/plan API |
| `02-spec/11-spec-management-software/05-features/25-ai-enhancements/03-01-plan-generation.md` | 8 | `method: 'POST'` in plan generation |

### Tier 2 — Moderate Violation Count (5–9 matches each)

| File | ~Count | Key Patterns |
|------|--------|-------------|
| `02-spec/11-spec-management-software/05-features/06-ai-integration/08-ai-chat-ui.md` | 6 | `method: 'POST'` in AI generate/stream |
| `02-spec/11-spec-management-software/05-features/22-golang-search-cli/23-settings-ui-page.md` | 6 | `method: "PUT"`, `method: "POST"` in settings API |
| `02-spec/01-general-spec/03-quality/03-api-conventions-quality.md` | 5 | `method: 'POST'`, `method: 'PUT'`, `method: 'DELETE'` in base client |
| `02-spec/01-general-spec/10-wordpress/02-rest-api-wordpress.md` | 5 | `method: 'GET'`, `method: 'POST'`, `method: 'PUT'`, `method: 'DELETE'` |
| `02-spec/34-wp-plugin/03-exam-manager/02-frontend/frontend-full-spec.md` | 8 | `method: 'POST'` in login/signup/log-event |
| `02-spec/11-spec-management-software/05-features/25-ai-enhancements/04-04-diagram-ui.md` | 5 | `method: 'POST'` in diagram generation |
| `02-spec/25-gsearch-cli/02-frontend/01-settings-ui-page.md` | 5 | `method: "PUT"`, `method: "POST"` in settings |

### Tier 3 — Low Violation Count (1–4 matches each)

| File | ~Count |
|------|--------|
| `02-spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md` | 2 |
| `02-spec/04-error-resolution/01-retrospectives/02-retry-debounce-dedup-fixes.md` | 2 |
| `02-spec/11-spec-management-software/14-microservices/07-react-flow-canvas.md` | 2 |
| `02-spec/29-nexus-flow-cli/02-frontend/01-react-flow-canvas.md` | 2 |
| `02-spec/11-spec-management-software/05-features/24-code-generation-system/32-url-context-system.md` | 3 |
| `02-spec/11-spec-management-software/05-features/09-knowledge-memory/11-knowledge-memory-ui.md` | 3 |
| `02-spec/31-ai-transcribe-cli/02-frontend/01-testing-ui.md` | 4 |
| `02-spec/31-ai-transcribe-cli/02-frontend/02-component-library.md` | 3 |
| ~15 additional files | 1–3 each |

### Exempt Files (No Action Required)

| File | Reason |
|------|--------|
| `02-spec/02-coding-guidelines/02-typescript/http-method-enum.md` | Intentional `❌ WRONG` examples showing the anti-pattern |
| `02-spec/04-error-resolution/08-logging-and-diagnostics/session-based-logging.md` | Runtime log output format, not code |
| `02-spec/04-error-resolution/07-error-modal/copy-formats.md` | Runtime log output format, not code |
| `02-spec/04-error-resolution/06-error-handling/02-error-handling-reference.md` | Runtime error display format |

### Already Compliant Files (HttpMethod.* usage)

| File | Compliant Usages |
|------|-----------------|
| `02-spec/25-gsearch-cli/01-backend/49-testing-ui.md` | 28 |
| `02-spec/25-gsearch-cli/02-frontend/04-testing-ui-page.md` | 6 |
| `02-spec/36-wp-seo-publish-cli/02-frontend/01-connection-wizard.md` | 8 |
| `02-spec/36-wp-seo-publish-cli/02-frontend/02-content-manager.md` | 14 |
| `02-spec/36-wp-seo-publish-cli/02-frontend/03-variable-editor.md` | 6 |
| `02-spec/11-spec-management-software/05-features/29-trigger-event-system/00-overview.md` | 2 |
| 3 additional files | Various |

---

## Fix Strategy

### Phase 1 — Remediate Tier 1 Files (~6 files, ~60 violations)

Replace all `method: 'POST'` → `method: HttpMethod.Post` (and GET/PUT/PATCH/DELETE equivalents) in the highest-impact files.

### Phase 2 — Remediate Tier 2 Files (~7 files, ~40 violations)

### Phase 3 — Remediate Tier 3 Files (~20 files, ~60 violations)

### Phase 4 — Verification Scan

Run `method: ["'](?:GET|POST|PUT|PATCH|DELETE)["']` scan to confirm zero remaining violations outside exempt files.

---

## Prevention and Non-Regression

### Prevention rule

All TypeScript/JavaScript spec code examples using `fetch()` or endpoint configuration MUST use `HttpMethod.*` enum constants from `src/lib/enums/http-method.ts`. Raw HTTP method string literals (`"POST"`, `"GET"`, etc.) are prohibited in the `method:` parameter.

### Acceptance criteria / test scenarios

- [ ] Zero `method: "POST"` / `method: 'GET'` patterns in any TypeScript spec code example (excluding exempt files)
- [ ] All 36 affected files updated to use `HttpMethod.*` constants
- [ ] Master coding guidelines §8 updated to explicitly cover `method:` parameter pattern
- [ ] Existing compliant files (9 files, 183 usages) remain unaffected

### Guardrails or linting policies

Future scans should include regex: `method: ["'](?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)["']`

### Spec sections updated

- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/02-03-audio-sync.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/03-01-plan-generation.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/03-02-plan-execution.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/03-03-approval-workflow.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/04-04-diagram-ui.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/05-03-message-display.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/06-01-sharing-architecture.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/06-02-sync-mechanism.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/06-04-sharing-ui.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/06-cross-project-memory.md`
- `02-spec/11-spec-management-software/05-features/25-ai-enhancements/02-voice-resilience.md`
- `02-spec/11-spec-management-software/05-features/06-ai-integration/08-ai-chat-ui.md`
- `02-spec/11-spec-management-software/05-features/22-golang-search-cli/23-settings-ui-page.md`
- `02-spec/11-spec-management-software/05-features/27-automation-pipeline/32-stage-execution-tests.md`
- `02-spec/11-spec-management-software/05-features/30-ai-bridge/04-api-interface.md`
- `02-spec/11-spec-management-software/14-microservices/07-react-flow-canvas.md`
- `02-spec/27-ai-bridge-cli/02-frontend/05-dashboard-specification.md`
- `02-spec/01-general-spec/03-quality/03-api-conventions-quality.md`
- `02-spec/01-general-spec/05-ux/03-performance-optimization-ux.md`
- `02-spec/01-general-spec/10-wordpress/02-rest-api-wordpress.md`
- `02-spec/04-error-resolution/01-retrospectives/02-retry-debounce-dedup-fixes.md`
- `02-spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md`
- `02-spec/33-shared-cli-frontend/11-e2e-test-spec.md`
- `02-spec/25-gsearch-cli/01-backend/49-testing-ui.md`
- `02-spec/25-gsearch-cli/02-frontend/01-settings-ui-page.md`
- `02-spec/29-nexus-flow-cli/02-frontend/01-react-flow-canvas.md`
- `02-spec/34-wp-plugin/03-exam-manager/02-frontend/frontend-full-spec.md`
- `02-spec/34-wp-plugin/03-exam-manager/02-frontend/split-spec/31-theme-application.md`
- `02-spec/34-wp-plugin/04-link-manager/02-admin-ui/split-spec/18-overview-page.md`
- `02-spec/34-wp-plugin/05-wp-plugin-publish/01-backend/13-error-management.md`

---

## TODO and Follow-Ups

- [x] Remediate Tier 1 files (~60 violations across 6 files)
- [x] Remediate Tier 2 files (~40 violations across 7 files)
- [x] Remediate Tier 3 files (~60 violations across ~20 files)
- [x] Run verification scan to confirm zero remaining violations
- [ ] Update master coding guidelines §8 to cover `method:` parameter
- [ ] Update master status and remediation protocol

---

## Done Checklist

- [x] Issue write-up created at `02-spec/61-how-app-issues-track/11-http-method-magic-strings.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [ ] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [ ] Iterations recorded (if applicable)

---

## Cross-References

- [HttpMethod Enum Spec](../02-coding-guidelines/02-typescript/00-overview.md) — Defines the correct enum pattern
- [Issue #09](./09-magic-string-enum-comparison.md) — `hasMismatch`/`isEqual` magic string fix (precursor)
- [Issue #10](./10-domain-status-magic-strings.md) — Domain status magic string fix (sibling)
- [Master Coding Guidelines §8](../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md) — Magic strings zero tolerance
