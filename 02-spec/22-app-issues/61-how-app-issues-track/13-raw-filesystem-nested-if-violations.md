# 13 — Raw Filesystem Calls, Nested If, and Unnecessary Error Type Checking

**Created:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Open  
**Severity:** Critical

---

## Issue Summary

### What happened

Go code examples across the spec tree use raw `os.*` filesystem calls (`os.Remove`, `os.Stat`, `os.MkdirAll`, `os.WriteFile`, `os.ReadFile`, `os.Rename`, `os.RemoveAll`) directly in application logic instead of `pathutil` wrappers. Many instances compound this with:

1. **Inline assignment in `if` with nested logic** — `if err := os.Remove(path); err != nil { if !os.IsNotExist(err) { ... } }` violates P7 (inline assignment is only exempt for simple error propagation, not nested logic)
2. **Nested `if` blocks** — Checking `os.IsNotExist(err)` inside an error handler creates prohibited nested conditionals
3. **Unnecessary error type discrimination** — When deleting a file, whatever error occurs should be wrapped and returned. Silently swallowing "file not found" errors masks real issues and adds unnecessary complexity
4. **Missing variable context in error wrapping** — File paths not included in error context via `WithPath()`

### Where it happened

- **Feature / Module:** All Go code examples across the spec tree
- **File paths:** 96 files with raw `os.*` calls (was 101); 40 files with inline `if err := os.*` (was 45); 23 files with `os.IsNotExist`

### Symptoms and impact

- Inconsistent error handling — some errors silently swallowed, others wrapped differently
- Violation of `pathutil` wrapper mandate (filesystem-access memory)
- Violation of P7 inline assignment rule (control-flow memory)
- Violation of nested `if` prohibition
- Missing error context makes debugging harder

### How it was discovered

User code review identified the pattern in a session service's `os.Remove` call.

---

## Root Cause Analysis

### Direct cause

Code examples were written before the `pathutil` wrapper mandate and P7 inline assignment rule were established.

### Contributing factors

- No automated scan for raw `os.*` calls in spec code examples
- `os.IsNotExist` was considered "idiomatic Go" without recognizing it creates unnecessary nested logic
- Error type discrimination (`IsNotExist`) was applied reflexively without evaluating whether the distinction matters

### Triggering conditions

Any Go code example that performs filesystem operations.

### Why the existing spec did not prevent it

The `filesystem-access` memory prohibits raw `os.*` calls but was not retroactively enforced across existing spec code examples. The control-flow memory did not explicitly prohibit nested `if` blocks for error type checking.

---

## Fix Description

### What was changed in the spec

1. Updated `.ai-memory/memories/architecture/coding-standards/control-flow.md` — added explicit prohibition of nested `if` for error type discrimination
2. Updated `.ai-memory/memories/architecture/coding-standards/filesystem-access.md` — strengthened language and added the anti-pattern example
3. Updated `.ai-memory/memories/workflow/03-mistake-remediation-protocol.md` — added issue #13 to registry

### New rules or constraints added

1. **No nested `if` for error type checking** — When an operation fails, wrap and return the error. Do not check `os.IsNotExist` or similar type discriminators inside error handlers unless the business logic genuinely requires different behavior for different error types.
2. **All `os.*` calls must use `pathutil` wrappers** — No exceptions in application code. `pathutil` methods return `*apperror.AppError` with path context automatically included.
3. **Inline `if` with nested logic is not exempt from P7** — The P7 error propagation exemption only applies to simple `if err := fn(); err != nil { return err }` patterns, not to patterns with nested conditionals inside.

### Why the fix resolves the root cause

- `pathutil` wrappers eliminate raw `os.*` calls and automatically include path context in errors
- Prohibiting nested `if` for error type discrimination eliminates the `os.IsNotExist` anti-pattern
- Tightening P7 exemption scope prevents inline assignments from being used with complex nested logic

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Prevention and Non-Regression

### Prevention rule

All filesystem operations in Go code examples must use `pathutil` wrappers. Error type discrimination (`os.IsNotExist`, `os.IsPermission`) inside error handlers is prohibited — wrap and return the error as-is.

### Acceptance criteria / test scenarios

- Zero `os.Remove`, `os.Stat`, `os.MkdirAll`, `os.WriteFile`, `os.ReadFile`, `os.Rename`, `os.RemoveAll` calls in application-level spec code (library boundary code exempt)
- Zero `os.IsNotExist` inside error handlers
- Zero nested `if` blocks inside `if err != nil` handlers

### Guardrails or linting policies

Regex scan: `os\.(Remove|Stat|MkdirAll|WriteFile|ReadFile|Rename|RemoveAll)` in spec Go code blocks

### Spec sections updated

- `.ai-memory/memories/architecture/coding-standards/control-flow.md`
- `.ai-memory/memories/architecture/coding-standards/filesystem-access.md`
- `.ai-memory/memories/workflow/03-mistake-remediation-protocol.md`

---

## Remediation Scope

| Category | Count | Files |
|----------|-------|-------|
| Raw `os.*` calls | ~100 (was ~1,912) | 8 files (was 96) |
| Inline `if err := os.*` | ~430 (was ~455) | 40 files (was 45) |
| `os.IsNotExist` checks | ~78 (was ~193) | 3 files (was 23) |

### Correct pattern

```go
// ❌ WRONG — raw os.Remove, inline assignment, nested if, os.IsNotExist
if err := os.Remove(legacyPath); err != nil {
    isRealError := !os.IsNotExist(err)
    if isRealError {
        return apperror.Wrap(err, apperror.ErrSessionDelete, "delete session log").
            WithPath(legacyPath)
    }
}

// ✅ CORRECT — pathutil wrapper, no nesting, no type discrimination
err := pathutil.Remove(legacyPath)
if err != nil {
    return err
}
```

---

## TODO and Follow-Ups

- [x] Remediate remaining raw `os.*` calls across spec files — **all application-level modules cleared** (Wave 44, 2026-03-12). Remaining ~100 matches are non-actionable anti-pattern examples in guidelines/standards docs and 1 EXEMPTED library-boundary wrapper.
- [x] Remediate `os.IsNotExist` in 02-spec/10-brun-cli, 02-spec/13-wp-plugin, 02-spec/14-wp-plugin-builder, 02-spec/07-seedable-config-architecture — **zero remaining**
- [x] `02-spec/06-split-db-architecture/` — **zero remaining** (Wave 31)
- [x] `02-spec/29-nexus-flow-cli/` — **zero remaining** (Wave 31)
- [x] Verify zero remaining actionable violations — **confirmed** (Wave 44, 2026-03-12)

---

## Done Checklist

- [x] Issue write-up created at `02-spec/61-how-app-issues-track/13-raw-filesystem-nested-if-violations.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [ ] Acceptance criteria updated or added
- [ ] Iterations recorded (if applicable)
