# Memory: architecture/coding-standards/php-file-logging-and-error-stack

**Updated:** 2026-03-03  
**Version:** 1.0.0  
**Scope:** All WordPress plugins

---

## File System Logging

Every log entry must be written to the file system via `FileLogger`. The plugin uses a dual-logging strategy:

1. **`plugin.log`** — All operational logs (info, debug, warning)
2. **`error.txt`** — Error-level entries only (for quick triage)

**Rule:** Every log call must persist to disk. In-memory-only logging is prohibited.

## File Load Logging

Every file that is loaded (included, required, autoloaded) **must** be logged. This includes:

- Plugin bootstrap files
- Class autoloading events
- Template file inclusions
- Configuration file reads

This ensures full traceability of the plugin's execution path.

## Error Stack on Failures — CRITICAL

**Every catch block that has access to a `Throwable $e` MUST pass `$e` to the logger.** Logging only `$e->getMessage()` without the stack trace is a critical violation. The stack trace is a non-negotiable debugging artifact.

### FileLogger `error()` Signature (Throwable-first)

```php
public function error(
    Throwable $e,
    string $file = '',
    int $line = 0,
): bool
```

The logger extracts `$e->getMessage()` and appends `$e->getTraceAsString()` internally.

### Required Pattern

```php
// ✅ REQUIRED — exception passed, stack trace preserved
catch (Throwable $e) {
    $this->fileLogger->error($e, __FILE__, __LINE__);
}
```

### Forbidden Pattern

```php
// ❌ FORBIDDEN — stack trace lost (forbidden-patterns.md rule 1.8)
catch (Throwable $e) {
    $this->fileLogger->error($e->getMessage(), __FILE__, __LINE__);
}
```

## Pre-FileLogger Exception Logging — `ErrorLog()`

When `FileLogger` is not yet available (early boot), use the centralized `ErrorLog()` function for exception logging. It wraps PHP's native `error_log()` with Throwable-first enforcement.

### Signature

```php
function ErrorLog(Throwable $e, string $context = ''): void {
    error_log($context . ' ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
```

### Required Pattern

```php
// ✅ REQUIRED — Throwable first, consistent formatting
catch (Throwable $e) {
    ErrorLog($e, 'RestoreHelperTrait::logRestoreAudit() failed:');
}
```

### Forbidden Pattern

```php
// ❌ FORBIDDEN — manual concatenation (forbidden-patterns.md rule 1.9)
catch (Throwable $e) {
    error_log('RestoreHelperTrait::logRestoreAudit() failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
```

## Pre-FileLogger Non-Exception Logging — `InitHelpers::errorLogWithPrefix()`

For plain string messages (no exception), use `InitHelpers::errorLogWithPrefix()`:

```php
// ✅ REQUIRED
InitHelpers::errorLogWithPrefix('PDO extension missing');
```

## Summary of Logging Functions

| Context | Has Exception? | Function |
|---------|---------------|----------|
| Normal code (FileLogger available) | Yes | `$this->fileLogger->error($e, __FILE__, __LINE__)` |
| Normal code (FileLogger available) | No | `$this->fileLogger->log('[ERROR] message', __FILE__, __LINE__)` |
| Early boot (pre-FileLogger) | Yes | `ErrorLog($e, 'context message')` |
| Early boot (pre-FileLogger) | No | `InitHelpers::errorLogWithPrefix('message')` |
| Autoloader only | Either | Raw `error_log()` (exempt — loads before everything) |

## Scope

This rule applies to:

1. **File load errors:** Catch the exception, pass `$e` to logger, log to both `plugin.log` and `error.txt`, and propagate a structured error.
2. **Endpoint errors:** The REST API error response must include the error stack in the response body (in development/debug mode) or log it and return a sanitized error code (in production).
3. **All other catch blocks:** Database operations, file operations, API calls, plugin initialization — no exceptions.

### Exception

The `Autoloader` class is exempt because it executes before both `FileLogger` and `ErrorLog()` are available. It may use raw `error_log()` but should still include `$e->getTraceAsString()` when possible.

## Reference

- `spec/02-coding-guidelines/04-php/forbidden-patterns.md` (rules 1.8, 1.9)
- `spec/33-wp-plugin-development/02-logging-standards.md`
- `spec/33-wp-plugin-development/07-error-handling.md`
- `spec/61-how-app-issues-track/17-missing-stack-trace-in-catch-blocks.md`
