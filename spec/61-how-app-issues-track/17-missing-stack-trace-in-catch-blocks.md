# 17 — Missing Stack Trace in Catch Blocks

**Created:** 2026-03-03  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Critical

---

## Issue Summary

### What happened

Catch blocks throughout the codebase and spec examples log only `$e->getMessage()` without capturing the full stack trace from the exception. The exception object (`$e`) is never passed to the logger, making post-mortem debugging impossible.

### Where it happened

- **Feature / Module:** Error handling, logging, autoloader, all catch blocks
- **File paths:**
  - `spec/33-wp-plugin-development/07-error-handling.md` (10+ code examples)
  - `spec/33-wp-plugin-development/02-logging-standards.md` (FileLogger `error()` signature)
  - `spec/02-coding-guidelines/04-php/forbidden-patterns.md` (missing rule)
  - `spec/04-error-resolution/03-debugging-guides/01-debugging-php.md` (Logger class)
  - Any PHP file with `catch (Throwable $e)` that only uses `$e->getMessage()`

### Symptoms and impact

When an error occurs in production, logs contain only the error message string (e.g., "Database connection failed") with no stack trace. Engineers cannot determine the call chain, the originating file/line, or the sequence of events that led to the failure. Debugging requires reproducing the issue locally, which may be impossible for intermittent or environment-specific errors.

### How it was discovered

Code review of autoloader catch block:
```php
} catch (Throwable $e) {
    error_log(self::LOG_PREFIX . 'failed to load "' . $class . '" — ' . $e->getMessage());
}
```
This pattern discards the entire exception stack trace — a critical debugging resource.

---

## Root Cause Analysis

### Direct cause

The `FileLogger::error()` method signature did not accept a `Throwable` parameter, so catch blocks had no way to pass the exception even if they wanted to. The spec examples reinforced this pattern by showing `$e->getMessage()` as the only data extracted from caught exceptions.

### Contributing factors

1. The `FileLogger::error()` method was designed with only `string $message, string $file, int $line` — no exception parameter
2. Spec examples in `07-error-handling.md` consistently demonstrated the broken pattern
3. No forbidden pattern rule explicitly prohibited dropping the stack trace
4. The `logException()` method existed but was only shown in the "Logging Stack Traces" section, not integrated into the standard catch block pattern

### Triggering conditions

Every single catch block that uses `$e->getMessage()` without also calling `$e->getTraceAsString()` or passing `$e` to a logger that captures the trace.

### Why the existing spec did not prevent it

1. `forbidden-patterns.md` had rule 1.5 (no raw `error_log()`) but no rule about preserving stack traces
2. `07-error-handling.md` showed `logException()` as an advanced pattern, not as the mandatory default
3. `02-logging-standards.md` FileLogger `error()` didn't accept `?Throwable`

---

## Fix Description

### What was changed in the spec

1. **`spec/02-coding-guidelines/04-php/forbidden-patterns.md`** — Added rule 1.8: catch blocks that log `$e->getMessage()` without passing the exception are forbidden
2. **`spec/33-wp-plugin-development/07-error-handling.md`** — Added critical rule: every catch block must pass `$e` to the logger; updated all code examples
3. **`spec/33-wp-plugin-development/02-logging-standards.md`** — Changed `FileLogger::error()` signature: first parameter is now `Throwable $e` (not `string $message`); message and stack trace are extracted automatically
4. **`spec/04-error-resolution/03-debugging-guides/01-debugging-php.md`** — Updated Logger class to accept `Throwable` as first parameter

### New rules or constraints added

1. **Every catch block MUST pass `$e` to the logger.** No exception. The stack trace is a non-negotiable debugging artifact.
2. **`FileLogger::error()` signature is `error(Throwable $e, string $file = '', int $line = 0)`** — message is extracted from `$e->getMessage()`, stack trace is always appended via `$e->getTraceAsString()`.
3. **`ErrorLog(Throwable $e, string $context = '')` function** — for pre-FileLogger contexts. Internally calls `error_log($context . ' ' . $e->getMessage() . "\n" . $e->getTraceAsString())`. Replaces raw `error_log()` with manual concatenation.
4. **Forbidden pattern 1.8:** `$this->fileLogger->error($e->getMessage(), __FILE__, __LINE__)` — message as first param instead of Throwable.
5. **Forbidden pattern 1.9:** `error_log('Context: ' . $e->getMessage() . "\n" . $e->getTraceAsString())` — manual concatenation instead of `ErrorLog($e, 'Context:')`.

### Why the fix resolves the root cause

By making `Throwable` the **first and only required parameter** of both `FileLogger::error()` and `ErrorLog()`, it is physically impossible to call either without providing the exception. The stack trace is always captured automatically — no developer action required beyond `->error($e, __FILE__, __LINE__)` or `ErrorLog($e, 'context')`. Non-exception errors (e.g., path validation, JSON decode) use `$this->fileLogger->log('[ERROR] ...')` or `InitHelpers::errorLogWithPrefix()` instead.

### Config changes or defaults affected

None

### Logging or diagnostics required

The `FileLogger::error(Throwable $e, ...)` method logs `$e->getMessage()` followed by `\nStack trace:\n` + `$e->getTraceAsString()` — always, unconditionally.

---

## Prevention and Non-Regression

### Prevention rule

**Every `catch` block that has access to a `Throwable $e` MUST pass `$e` to the logger. Logging only `$e->getMessage()` without the stack trace is a critical violation.**

### Acceptance criteria / test scenarios

1. Grep for `catch (Throwable $e)` — every match must have a corresponding logger call that includes `$e` (not just `$e->getMessage()`)
2. Grep for `->error(.*getMessage()` — every match must also pass `$e` as a parameter
3. No `error_log(.*getMessage())` patterns in any PHP file (except Autoloader)
4. No `error_log('...' . $e->getMessage() . ... . $e->getTraceAsString())` — must use `ErrorLog($e, 'context')` instead

### Guardrails or linting policies

Regex scan: `catch\s*\(Throwable\s+\$e\).*?->error\([^)]*\$e->getMessage\(\)[^)]*\)` without `$e` as a separate parameter → violation

### Spec sections updated

- `spec/02-coding-guidelines/04-php/forbidden-patterns.md` (rule 1.8 + checklist)
- `spec/33-wp-plugin-development/07-error-handling.md` (critical rule + all examples)
- `spec/33-wp-plugin-development/02-logging-standards.md` (FileLogger signature)
- `spec/04-error-resolution/03-debugging-guides/01-debugging-php.md` (Logger class)

---

## TODO and Follow-Ups

- [x] Create issue write-up
- [x] Update forbidden patterns with rule 1.8
- [x] Update error handling spec with critical rule and fixed examples
- [x] Update logging standards FileLogger signature
- [x] Update debugging guide Logger class
- [x] Update memory files
- [x] Update remediation protocol registry

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/17-missing-stack-trace-in-catch-blocks.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [x] Iterations recorded (if applicable) — N/A, single iteration
