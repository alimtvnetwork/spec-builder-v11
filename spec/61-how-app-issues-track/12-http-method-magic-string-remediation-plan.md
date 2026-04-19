# 12 — HTTP Method Magic String Remediation Plan

**Created:** 2026-02-27  
**Version:** 1.0.0  
**Status:** ✅ Resolved  
**Severity:** High

---

## Issue Summary

### What happened

363 HTTP method magic string violations (`method: "POST"`, `method: "GET"`, etc.) remain across 36 spec files. Issue #11 documented and resolved the rule, but the per-file remediation was not executed.

### Where it happened

- **Feature / Module:** All spec modules containing endpoint configuration or fetch examples
- **File paths:** 36 files across `spec/11-spec-management-software/`, `spec/28-shared-cli-frontend/`, `spec/20-gsearch-cli/` through `spec/26-ai-transcribe-cli/`, `spec/32-wp-seo-publish-cli/`, `spec/53-e2-activity-feed/`

### Symptoms and impact

Spec code examples still model the anti-pattern (`method: "POST"`) that the coding guidelines explicitly prohibit. New implementations based on these specs will introduce magic strings into production code.

### How it was discovered

Audit #07 (`07-magic-string-tuple-return-audit.md`) and Issue #11 (`11-http-method-magic-strings.md`) quantified the violations.

---

## Root Cause Analysis

### Direct cause

Issue #11 established the rule and enum spec but did not include a file-by-file remediation pass.

### Contributing factors

- Large surface area (36 files, 363 instances) made inline remediation impractical in a single pass
- No automated linting exists for spec markdown files

### Triggering conditions

Any spec file containing `method: "GET"`, `method: "POST"`, `method: "PUT"`, `method: "PATCH"`, `method: "DELETE"`, `method: "HEAD"`, or `method: "OPTIONS"` as string literals.

### Why the existing spec did not prevent it

The `HttpMethod` enum spec (`spec/02-coding-guidelines/02-typescript/http-method-enum.md`) was created but not retroactively applied to existing spec examples.

---

## Prioritized Remediation Plan

### Tier 1 — Critical Path (highest actual violation counts)

Files with the highest violation density. ✅ **REMEDIATED 2026-02-27.**

> **Note:** The original estimates (20+, 15+) for the 3 AI-integration files were inaccurate — those files had already been remediated. The actual highest-impact files were identified by live regex scan and fixed below.

| # | File | Actual Violations | Status |
|---|------|-------------------|--------|
| 1 | `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/11-rest-api-endpoints.md` | 40 `.Methods("...")` | ✅ Fixed |
| 2 | `spec/11-spec-management-software/05-features/06-ai-integration/14-telemetry-dashboard.md` | 7 `.Methods("GET")` | ✅ Fixed |
| 3 | `spec/04-error-resolution/07-error-modal/03-error-modal-reference.md` | 2 `method: 'POST'` | ✅ Fixed |
| 4 | `spec/04-error-resolution/07-error-modal/react-components.md` | 1 `method: 'POST'` | ✅ Fixed |
| 5 | `spec/04-error-resolution/01-retrospectives/01-health-endpoint-mismatch.md` | 2 `.Methods("GET")` | ✅ Fixed |
| 6 | `spec/01-general-spec/01-foundation/error-resolution/01-health-endpoint-mismatch.md` | 2 `.Methods("GET")` | ✅ Fixed |
| 7 | `spec/11-spec-management-software/05-features/24-code-generation-system/28-file-modification-display.md` | 8 `.Methods("...")` | ✅ Fixed |

### Tier 2 — High Impact ✅ **REMEDIATED 2026-03-11**

> **Note:** Original estimates referenced non-existent directories. Actual violations found via live regex scan. JSON preset data files are exempt — only TypeScript/Go code examples were remediated.

| # | File | Actual Violations | Status |
|---|------|-------------------|--------|
| 4 | `spec/11-spec-management-software/05-features/08-search/` | 0 (directory doesn't exist) | ✅ N/A |
| 5 | `spec/11-spec-management-software/05-features/03-automation/` | 0 (directory doesn't exist) | ✅ N/A |
| 6 | `spec/11-spec-management-software/05-features/09-file-management/` | 0 (directory doesn't exist) | ✅ N/A |
| 7 | `spec/28-shared-cli-frontend/04-api-tester.md` | 0 (JSON presets — exempt) | ✅ Exempt |
| 8 | `spec/20-gsearch-cli/01-backend/49-testing-ui.md` | 3 `endpoint.method !== "GET"` | ✅ Fixed |
| 9 | `spec/20-gsearch-cli/01-backend/48-unified-rest-api.md` | 1 CORS AllowMethods | ✅ Fixed |
| 10 | `spec/20-gsearch-cli/01-backend/12-testing-strategy.md` | 7 `httpmock.RegisterResponder` | ✅ Fixed |
| 11 | `spec/20-gsearch-cli/02-frontend/02-frontend-architecture.md` | 0 (JSON presets — exempt) | ✅ Exempt |

### Tier 3 — Medium Impact ✅ **VERIFIED 2026-03-12**

> **Note:** Live regex scan confirmed all remaining matches in Tier 3 scopes are exempt (JSON config values, enum definitions, action strings — not HTTP method magic strings in code).

| # | Scope | Actual Violations | Status |
|---|-------|-------------------|--------|
| 9 | `spec/21-brun-cli/` | 0 (JSON config + enum def — exempt) | ✅ Exempt |
| 10 | `spec/22-ai-bridge-cli/` | 0 (no matches) | ✅ Clean |
| 11 | `spec/24-nexus-flow-cli/` | 0 (enum def + UI string — exempt) | ✅ Exempt |
| 12 | `spec/25-spec-reverse-cli/` | 0 (no matches) | ✅ Clean |
| 13 | `spec/32-wp-seo-publish-cli/` | 0 (JSON data + enum def — exempt) | ✅ Exempt |
| 14 | `spec/53-e2-activity-feed/` | 0 (action strings — not HTTP methods) | ✅ Exempt |

### Tier 4 — Low Impact ✅ **VERIFIED 2026-03-12**

All remaining matches are in issue tracking files (showing ❌ patterns) or guideline docs — zero actionable violations.

---

## Remediation Rules

### Search pattern

```regex
method:\s*["'](GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)["']
```

### Replacement mapping

| Magic String | Enum Constant |
|-------------|---------------|
| `"GET"` | `HttpMethod.Get` |
| `"HEAD"` | `HttpMethod.Head` |
| `"POST"` | `HttpMethod.Post` |
| `"PUT"` | `HttpMethod.Put` |
| `"PATCH"` | `HttpMethod.Patch` |
| `"DELETE"` | `HttpMethod.Delete` |
| `"OPTIONS"` | `HttpMethod.Options` |

### Additional rules

1. Add `import { HttpMethod } from "@/lib/enums/http-method-type"` to any TypeScript example that doesn't already have it
2. Go examples use `httpmethodtype.Post` (from `pkg/enums/httpmethodtype`)
3. Endpoint config arrays must use enum constants, not string literals
4. Type constraints (`method: "POST" | "PUT"`) become `method: HttpMethod.Post | HttpMethod.Put`

---

## Fix Description

### What was changed in the spec

This issue file created as tracking artifact. No spec files remediated yet.

### New rules or constraints added

None beyond Issue #11's existing rules. This issue tracks execution.

### Why the fix resolves the root cause

Systematic file-by-file replacement eliminates all magic string examples from specs, ensuring new implementations copy correct patterns.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Prevention and Non-Regression

### Prevention rule

After remediation, run the search regex above across all spec files — result must be zero matches (excluding this issue file's documentation examples).

### Acceptance criteria / test scenarios

- GIVEN all 36 files are remediated WHEN the regex scan runs THEN zero violations found
- GIVEN a new spec file is created WHEN it contains HTTP method references THEN it must use `HttpMethod.*` constants

### Guardrails or linting policies

Future: markdown linter rule to flag `method: "GET"` patterns in spec code blocks.

### Spec sections updated

- `spec/02-coding-guidelines/02-typescript/http-method-enum.md` (already done in Issue #11)
- `spec/02-coding-guidelines/03-golang/03-httpmethod-enum.md` (already done in Issue #11)

---

## TODO and Follow-Ups

- [x] Remediate Tier 1 files (7 files, 62 violations fixed — 2026-02-27)
- [x] Remediate Tier 2 files (5 scopes scanned, 11 violations fixed, 2 scopes exempt — 2026-03-11)
- [x] Verify Tier 3 files (6 scopes — all exempt, zero actionable violations — 2026-03-12)
- [x] Verify Tier 4 files (remaining — all in guideline/issue docs — 2026-03-12)
- [x] Run full verification scan — confirmed zero remaining violations
- [x] Close this issue and update status to Resolved

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/12-http-method-magic-string-remediation-plan.md`
- [x] All tier remediations complete
- [x] Verification scan confirms zero violations
- [x] Memory updated with summary and prevention rule
- [x] Master status updated

---

*Issue #12 — HTTP Method Magic String Remediation Plan — 2026-02-27*
