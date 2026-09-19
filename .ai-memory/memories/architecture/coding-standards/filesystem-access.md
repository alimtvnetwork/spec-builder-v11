# Memory: architecture/coding-standards/filesystem-access

**Updated:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Rule

Direct use of raw filesystem calls (e.g., `os.Stat`, `os.MkdirAll`, `os.Remove`, `os.RemoveAll`, `os.ReadFile`, `os.WriteFile`, `os.Rename`, `file_exists`) in application logic is **strictly prohibited**. All filesystem operations must use `pathutil` (Go) or `PathHelper` (PHP) wrappers that return `*apperror.AppError` to ensure consistent error reporting and serializability.

## Anti-Patterns

```go
// ❌ PROHIBITED — raw os.Remove with inline assignment and nested if
if err := os.Remove(legacyPath); err != nil {
    isRealError := !os.IsNotExist(err)
    if isRealError {
        return apperror.Wrap(err, apperror.ErrSessionDelete, "delete session log").
            WithPath(legacyPath)
    }
}

// ❌ PROHIBITED — raw os.Stat with os.IsNotExist
if _, err := os.Stat(path); os.IsNotExist(err) {
    return fmt.Errorf("not found: %s", path)
}

// ❌ PROHIBITED — raw os.MkdirAll
if err := os.MkdirAll(dir, 0755); err != nil {
    return err
}
```

## Correct Pattern

```go
// ✅ CORRECT — pathutil wrapper returns *apperror.AppError with path context
err := pathutil.Remove(legacyPath)
if err != nil {
    return err
}

// ✅ CORRECT — pathutil for existence check
isExists := pathutil.Exists(path)
if !isExists {
    return apperror.New(apperror.ErrFileNotFound, "file not found")
}

// ✅ CORRECT — pathutil for directory creation
err := pathutil.EnsureDir(dir)
if err != nil {
    return err
}
```

## Error Type Discrimination

Checking `os.IsNotExist`, `os.IsPermission`, or similar error type functions inside error handlers is **prohibited**. The `pathutil` wrappers handle these internally and return properly typed `*apperror.AppError` with appropriate error codes. Application code should not second-guess what type of filesystem error occurred.

## Remediation Status

~1,912 raw `os.*` violations remain across 96 spec files (updated 2026-03-12, post-Wave 11). See `02-spec/61-how-app-issues-track/13-raw-filesystem-nested-if-violations.md`.

## Cross-References

| Reference | Location |
|-----------|----------|
| Issue #13 | `02-spec/61-how-app-issues-track/13-raw-filesystem-nested-if-violations.md` |
| Control Flow | `.lovable/memories/architecture/coding-standards/control-flow.md` |
