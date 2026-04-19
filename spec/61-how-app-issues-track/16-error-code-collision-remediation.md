# 16 — Error Code Collision Remediation (Resolutions 7–12)

**Created:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Critical

> 📋 **Summary report:** [collision-resolution-summary.md](../03-error-code-registry/03-collision-resolution-summary.md) — consolidated before/after table of all 13 resolutions.

---

## Issue Summary

### What happened

Six error code range collisions were discovered during a comprehensive consistency scan of the error code registry. Multiple Spec Management (SM) feature modules had been assigned error code ranges that directly overlapped with standalone CLI tool allocations (WSP, WPP), violating the ecosystem's collision-free registry constraint.

### Where it happened

- **Feature / Module:** SM Code Generation (feature 24), SM Project Editor (feature 28), SM WebSocket Events (feature 15), SM Suggestions (feature 21), SM Realtime (feature 18), SM GSearch CLI (feature 22), AIT Voice (feature 15)
- **File paths:**
  - `spec/11-spec-management-software/05-features/24-code-generation-system/16-error-codes.md`
  - `spec/11-spec-management-software/05-features/24-code-generation-system/05-parallel-executor.md`
  - `spec/11-spec-management-software/05-features/24-code-generation-system/15-websocket-events.md`
  - `spec/11-spec-management-software/05-features/24-code-generation-system/00-overview.md`
  - `spec/11-spec-management-software/05-features/28-project-editor/05-error-codes.md`
  - `spec/11-spec-management-software/05-features/21-suggestions-system.md`
  - `spec/11-spec-management-software/05-features/18-realtime/00-overview.md`
  - `spec/11-spec-management-software/05-features/22-golang-search-cli/15-error-codes.md`
  - `spec/26-ai-transcribe-cli/01-backend/03-stt-providers.md`
  - `spec/26-ai-transcribe-cli/01-backend/04-tts-providers.md`
  - `spec/26-ai-transcribe-cli/01-backend/00-overview.md`
  - `spec/03-error-code-registry/01-registry.md`

### Symptoms and impact

Error code collisions would cause ambiguous error identification at runtime. Multiple unrelated modules sharing the same numeric codes makes log analysis, debugging, and error routing impossible to disambiguate.

### How it was discovered

Discovered during a systematic cross-project error code collision scan on 2026-02-28. The scan compared all registered ranges in the master registry against actual codes used in spec files across the entire repository.

---

## Root Cause Analysis

### Direct cause

SM feature modules were assigned error code ranges (12xxx, 13xxx) without consulting the master error code registry, which already allocated those ranges to WSP (12000-12599) and WPP (13000-13999). Similarly, SM GSearch CLI used ad-hoc local codes (1xxx-12xxx) that collided with multiple projects.

### Contributing factors

1. SM features were specified before the centralized error code registry was fully established
2. No automated collision detection existed at specification time
3. SM Realtime and SM GSearch CLI used locally-scoped codes without checking global allocations
4. AIT voice specs referenced 13xxx codes that belonged to WPP's range

### Triggering conditions

Any attempt to implement two or more colliding modules in the same ecosystem would produce ambiguous error codes.

### Why the existing spec did not prevent it

The error code registry existed but was not consulted during SM feature specification. No mandatory "check registry before allocating" rule was enforced in the spec-writing workflow.

---

## Fix Description

### What was changed in the spec

Six collision resolutions were applied:

| Resolution | Collision | Old Range | New Range | Files Modified |
|------------|-----------|-----------|-----------|----------------|
| **#7** | SM-CG vs WSP | 12000-12799 | **SM-CG 16000-16799** | `16-error-codes.md`, `05-parallel-executor.md`, `15-websocket-events.md`, `00-overview.md` |
| **#8** | SM-PE vs WPP | 13000-13999 | **SM-PE 17000-17999** | `28-project-editor/05-error-codes.md` |
| **#9** | PS/AB SEO overlap | 9500-9540 | **No change** (intentional, format-separated) | Documented only |
| **#10** | AIT Voice vs WPP | 13200-13308 | **AIT 14150-14307** | `03-stt-providers.md`, `04-tts-providers.md`, `00-overview.md` |
| **#11** | SM Realtime vs WSP | 12001-12031 | **SM-RT 2800-2849** | `18-realtime/00-overview.md` |
| **#12** | SM GSearch vs multiple | 1xxx-12xxx (92 codes) | **SM-GS 18000-18249** | `22-golang-search-cli/15-error-codes.md` |
| **#13** | AB Lovable Reasoning vs WPB | 10500-10519 (AB), 10500-10899 (WPB) | **AB 19000-19019**, WPB compressed to **10000-10499** | 8 WPB spec files remapped, registry updated |

Additionally, a stale range table in `24-code-generation-system/00-overview.md` was updated from 12xxx to 16xxx during final verification. Resolution 13 compressed WPB from 10000-10999 into 10000-10499 (remapping 10501-10906 → 10421-10496) and moved AB Lovable Reasoning to 19000-19019.

### New rules or constraints added

1. **Mandatory registry check:** All new error code allocations MUST be verified against `spec/03-error-code-registry/01-registry.md` before assignment
2. **SM features use high ranges:** SM sub-modules now use 16000+ to avoid future collisions with standalone CLIs
3. **SM base range reserved:** SM-RT uses 2800-2849 within SM's canonical 2000-2999 allocation
4. **Reassignment annotation:** All remapped files include a `⚠️ REASSIGNED` notice with date and reason

### Why the fix resolves the root cause

Each colliding range was moved to a globally-unique allocation verified against the master registry. The registry was updated atomically with all 6 resolutions. No 12xxx or 13xxx codes remain in SM feature specs.

### Config changes or defaults affected

None — these are specification-level error codes, not runtime configuration.

### Logging or diagnostics required

None — the codes are not yet implemented. When implemented, each code must use the new range values.

---

## Prevention and Non-Regression

### Prevention rule

**Before assigning any error code range to a new module, the developer/AI MUST consult `spec/03-error-code-registry/01-registry.md` and register the new range before writing it into any spec file.** No local/ad-hoc code ranges are permitted.

### Acceptance criteria / test scenarios

- **AC-1:** `grep -rn "12[0-7][0-9][0-9]" spec/11-spec-management-software/` returns zero active error code definitions (data values like UUIDs excluded)
- **AC-2:** `grep -rn "13[0-9][0-9][0-9]" spec/26-ai-transcribe-cli/` returns zero error code definitions
- **AC-3:** Every range in `01-registry.md` has no overlapping entries (validated by range-gap analysis)
- **AC-4:** All SM feature error code files contain `⚠️ REASSIGNED` annotations where applicable

### Guardrails or linting policies

A future automated registry validator should parse `01-registry.md` and flag any overlapping ranges. Until implemented, manual scan is required after any new error code allocation.

### Spec sections updated

- `spec/03-error-code-registry/01-registry.md` — Resolutions 7-12 added, range table updated
- `spec/11-spec-management-software/05-features/24-code-generation-system/16-error-codes.md`
- `spec/11-spec-management-software/05-features/24-code-generation-system/05-parallel-executor.md`
- `spec/11-spec-management-software/05-features/24-code-generation-system/15-websocket-events.md`
- `spec/11-spec-management-software/05-features/24-code-generation-system/00-overview.md`
- `spec/11-spec-management-software/05-features/28-project-editor/05-error-codes.md`
- `spec/11-spec-management-software/05-features/21-suggestions-system.md`
- `spec/11-spec-management-software/05-features/18-realtime/00-overview.md`
- `spec/11-spec-management-software/05-features/22-golang-search-cli/15-error-codes.md`
- `spec/26-ai-transcribe-cli/01-backend/03-stt-providers.md`
- `spec/26-ai-transcribe-cli/01-backend/04-tts-providers.md`
- `spec/26-ai-transcribe-cli/01-backend/00-overview.md`
- `.lovable/memories/technical/error-code-registry-complete.md`

---

## TODO and Follow-Ups

- [x] All 12 affected spec files updated with new ranges
- [x] Master registry updated with Resolutions 7-12
- [x] Memory files updated with new allocations
- [x] Final consistency scan completed — zero remaining collisions
- [ ] Implement automated registry overlap validator (future tooling)

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/16-error-code-collision-remediation.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [x] Iterations recorded (if applicable) — N/A, single-pass resolution
