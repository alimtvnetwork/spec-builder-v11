# 08 — P7 Inline Assignment Rule Contradiction

**Created:** 2026-02-26  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** High

---

## Issue Summary

### What happened

The P7 rule in `02-spec/02-coding-guidelines/03-golang/02-boolean-standards.md` originally prohibited **all** semicolon-separated inline assignments in `if` conditions without exemptions, while `02-spec/02-coding-guidelines/01-cross-language/04-code-style.md` simultaneously demonstrated `if err := fn(); err != nil` as correct idiomatic Go in multiple code examples. This created a direct contradiction: following one spec required violating the other.

### Where it happened

- **Feature / Module:** Coding standards — control flow rules
- **File paths:**
  - `02-spec/02-coding-guidelines/03-golang/02-boolean-standards.md` (P7 rule definition)
  - `02-spec/02-coding-guidelines/01-cross-language/04-code-style.md` (code examples using `if err := ...`)
  - `02-spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` (§10 log key rules)

### Symptoms and impact

Any developer or AI following the P7 rule strictly would refactor all `if err := fn(); err != nil` patterns — the most fundamental Go idiom — into two-line assignments. Conversely, following the code-style examples would violate P7. The contradiction made it impossible to write compliant code.

### How it was discovered

During a systematic scan of all spec files for P7 violations (inline function calls in `if` conditions), 341 matches were found. The vast majority (335+) were idiomatic `if err := fn(); err != nil` error handling — revealing that the P7 rule as written contradicted both Go convention and the project's own code examples.

---

## Root Cause Analysis

### Direct cause

The P7 rule was written with the correct intent (prohibit hiding value extraction inside control flow) but with overly broad scope that inadvertently banned Go's most fundamental error-handling idiom.

### Contributing factors

1. The P7 rule was authored in the context of `os.Stat` misuse and non-error value extraction, then generalized too broadly
2. `code-style.md` was authored independently and correctly used `if err := fn(); err != nil` as idiomatic Go
3. No cross-validation was performed between the two specs to detect the conflict
4. The original P7 text mentioned comma-ok as the "only exemption" without considering error propagation

### Triggering conditions

Any Go code that uses `if err := fn(); err != nil` — which is virtually all Go code.

### Why the existing spec did not prevent it

The specs were authored in isolation. No consistency check existed to detect when two spec files prescribed contradictory rules for the same pattern.

---

## Fix Description

### What was changed in the spec

1. **`02-spec/02-coding-guidelines/03-golang/02-boolean-standards.md`** — Added explicit exemptions section to P7:
   - `if err := fn(); err != nil` — idiomatic Go error propagation
   - `if r := recover(); r != nil` — idiomatic Go panic recovery
   - Comma-ok patterns: `if v, ok := m[k]; ok {`
   - Type assertions: `if v, ok := x.(T); ok {`

2. **`02-spec/01-general-spec/01-foundation/01-coding-standards-foundation.md`** — Added §10.3 Exemptions listing the same four patterns, with cross-reference to P7

3. **`.ai-memory/memories/architecture/coding-standards/control-flow.md`** — Updated to reflect exemptions

### New rules or constraints added

P7 now has a clear scope: it prohibits inline assignments for **non-error value extraction** (e.g., `if userId := GetUserId(ctx); userId != ""`), while explicitly exempting the four idiomatic Go patterns listed above.

### Why the fix resolves the root cause

The exemptions align P7's scope with its original intent (preventing hidden value extraction in control flow) while preserving idiomatic Go patterns that `code-style.md` correctly demonstrates. The two specs are no longer in conflict.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Iterations History

### Iteration 1 — Initial broad scan

- **What was tried:** Scanned all spec files for `if x := fn()` patterns, intending to fix all violations
- **Why it pivoted:** 341 matches found, 335+ were idiomatic `if err := fn(); err != nil` — fixing these would break all Go code

### Iteration 2 — Rule revision + targeted fixes

- **What was tried:** Added exemptions to P7 for error/recover/comma-ok/type-assert patterns, then fixed only the 2 genuine non-exempt violations
- **Outcome:** Successfully resolved — `09-agentic-mode.md` (cache extraction) and `07-integration-tests-pipeline.md` (env var parsing) were the only true violations

---

## Prevention and Non-Regression

### Prevention rule

When authoring a new coding standard rule, cross-reference all existing spec code examples to verify the rule does not contradict established patterns. Any rule that would invalidate 100+ existing code examples is likely too broad.

### Acceptance criteria / test scenarios

1. `02-spec/02-coding-guidelines/03-golang/02-boolean-standards.md` P7 section must list all four exemptions
2. `02-spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` §10.3 must list matching exemptions
3. `02-spec/02-coding-guidelines/01-cross-language/04-code-style.md` examples using `if err := fn(); err != nil` must not violate P7
4. Scanning for non-exempt `if x := fn(); x != ""` patterns should return zero results

### Guardrails or linting policies

None currently automated. Recommend adding cross-spec consistency checks for control-flow rules.

### Spec sections updated

- `02-spec/02-coding-guidelines/03-golang/02-boolean-standards.md` — P7 exemptions added
- `02-spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` — §10.3 exemptions added
- `.ai-memory/memories/architecture/coding-standards/control-flow.md` — Updated

---

## TODO and Follow-Ups

- [x] P7 exemptions added to boolean-standards.md
- [x] §10.3 exemptions added to coding-standards-foundation.md
- [x] Memory updated (control-flow.md)
- [x] 2 genuine violations fixed (09-agentic-mode.md, 07-integration-tests-pipeline.md)
- [ ] Add cross-spec contradiction check to consistency report process

---

## Done Checklist

- [x] Issue write-up created at `02-spec/61-how-app-issues-track/08-p7-inline-assignment-contradiction.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [x] Iterations recorded
