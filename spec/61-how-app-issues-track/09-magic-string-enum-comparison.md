# Issue #09 — Magic String Enum Comparisons


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Status:** Fixed  
> **Discovered:** 2026-02-27  
> **Severity:** Medium  
> **Affected Languages:** PHP

---

## Issue Summary

### Symptoms

Enum-backed status values compared against raw string literals instead of enum constants in `hasMismatch()` / `isEqual()` calls.

### Discovery

Manual audit of `hasMismatch()` and `isEqual()` calls across spec files revealed magic string arguments where enum constants should be used.

---

## Root Cause Analysis

### Direct Cause

Code examples used inline string literals (`'active'`, `'development'`) instead of referencing the corresponding enum case (e.g., `ParticipantStatus::Active->value`, `AppEnvType::Development->value`).

### Spec Failure

The §8 "Magic Strings — Zero Tolerance" rule in the master coding guidelines already covered HTTP methods and status values, but did not provide an explicit sub-rule for comparison helper arguments (`hasMismatch`, `isEqual`). This allowed violations to slip through in examples.

---

## Fix Description

### Rules Added

1. **Comparison helpers must use enum constants** — Every call to `hasMismatch()`, `isEqual()`, or any boolean comparison helper must use an enum case (e.g., `StatusType::Active->value`), never a raw string.
2. **Updated spec files** — Fixed all violating examples in `01-coding-standards-foundation.md` and `01-logging-system-systems.md`.
3. **Updated §8 in master guidelines** — Added explicit sub-rule for comparison helper arguments.

---

## Affected Files

| File | Violation | Fix |
|------|-----------|-----|
| `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md:133` | `hasMismatch($participant->status, 'active')` | `hasMismatch($participant->status, ParticipantStatus::Active->value)` |
| `spec/01-general-spec/02-systems/01-logging-system-systems.md:126` | `hasMismatch(getenv('APP_ENV'), 'development')` | `hasMismatch(getenv('APP_ENV'), AppEnvType::Development->value)` |

---

## Prevention and Non-Regression

### Rule

All comparison helper function arguments (`hasMismatch`, `isEqual`, `isMatch`) must reference enum constants — never raw string literals.

### Acceptance Criteria

- [x] Zero `hasMismatch(*, 'string')` or `isEqual(*, 'string')` patterns with raw literals in any spec file
- [x] Master coding guidelines §8 explicitly prohibits magic strings in comparison helpers

---

## Done Checklist

- [x] Issue documented in `spec/61-how-app-issues-track/09-magic-string-enum-comparison.md`
- [x] Affected spec files fixed
- [x] Master coding guidelines updated (§8 sub-rule)
- [x] Cross-reference validation complete
