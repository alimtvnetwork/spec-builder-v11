# 06 — Broken plan.md References

**Created:** 2026-02-25  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Medium

---

## Issue Summary

### What happened

Three cross-references in `plan.md` pointed to nonexistent or incorrect paths.

### Where it happened

- **Feature / Module:** Project plan / master roadmap
- **File paths:** `plan.md`

### Symptoms and impact

Broken links reduce trust in the spec ecosystem and can mislead AI agents or contributors following paths to source material.

### How it was discovered

Manual cross-reference scan of all paths in `plan.md` on 2026-02-25.

---

## Root Cause Analysis

### Direct cause

1. **Line 128:** `02-spec/33-shared-cli-frontend/15-hooks-library.md` — folder was renamed to `02-spec/33-shared-cli-frontend/` but plan.md was not updated.
2. **Line 153:** `02-spec/11-spec-management-software/05-features/SM-010-golang-backend-implementation.md` — referenced as if it existed, but the spec file was never created.
3. **Line 176:** `.ai-memory/memories/suggestions/01-suggestions-tracker.md` — previously referenced wrong directory (`memory` vs `memories`) and wrong filename; now corrected to canonical path.

### Contributing factors

- `plan.md` was not included in previous cross-reference validation scans (v9.1.0–v9.4.0), which focused on spec files and memory files.

### Triggering conditions

Any contributor or AI agent following the referenced paths would encounter missing files.

### Why the existing spec did not prevent it

Cross-reference scans did not include `plan.md` as a mandatory scan target.

---

## Fix Description

### What was changed in the spec

- `plan.md` line 128: path updated from `02-spec/33-shared-cli-frontend/` to `02-spec/33-shared-cli-frontend/`
- `plan.md` line 153: added annotation `*(spec not yet created)*`
- `plan.md` line 176: path corrected to `.ai-memory/memories/suggestions/README.md`

### New rules or constraints added

- `plan.md` must be included as a mandatory target in all future cross-reference validation scans.

### Why the fix resolves the root cause

All three paths now point to valid targets or are explicitly annotated as not-yet-created, eliminating silent broken references.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Prevention and Non-Regression

### Prevention rule

Every cross-reference validation scan must include `plan.md` as a mandatory scan target alongside spec and memory files.

### Acceptance criteria / test scenarios

- All paths in `plan.md` resolve to existing files or are explicitly annotated as not-yet-created.
- Future v9.x.0 scans include `plan.md` in their file list.

### Guardrails or linting policies

None

### Spec sections updated

- `plan.md` (3 path corrections)
- `02-02-spec/99-consistency-report.md` (v9.5.0 entry added)

---

## TODO and Follow-Ups

- [x] Fix applied to plan.md
- [x] Consistency report updated to v9.5.0
- [x] Issue write-up created
- [x] Memory updated

---

## Done Checklist

- [x] Issue write-up created at `02-spec/61-how-app-issues-track/06-broken-plan-md-references.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [x] Iterations recorded (if applicable) — N/A, single-pass fix
