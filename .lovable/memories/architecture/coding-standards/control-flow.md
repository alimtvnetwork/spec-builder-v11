# Memory: architecture/coding-standards/control-flow

**Updated:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Rule

Semicolon-separated assignments within `if` conditions (inline statements) are prohibited in application code. The following patterns are **exempt**:

1. **Error propagation:** `if err := fn(); err != nil { return err }` — idiomatic Go error handling
2. **Comma-ok pattern:** `if v, ok := m[k]; ok {`
3. **Type assertions:** `if v, ok := x.(T); ok {`
4. **Panic recovery:** `if r := recover(); r != nil {` — only in deferred functions

**Critical:** The error propagation exemption (#1) only applies to **simple error return** patterns. If the `if` body contains nested conditionals, additional logic, or error type discrimination, the inline assignment is **not exempt** — extract the call to a separate line.

The prohibition targets **non-error value extraction** patterns like `if cached := getFromCache(url); cached != nil` or `if userId := GetUserId(ctx); userId != ""`. These must extract the variable to a separate line before the condition.

For method chaining, each chained call must be placed on its own line.

## Nested If Prohibition

Nested `if` blocks inside error handlers are **strictly prohibited**. When an operation fails, wrap and return the error. Do not check error types (`os.IsNotExist`, `os.IsPermission`, `errors.Is`) inside error handlers unless the business logic **genuinely** requires different behavior.

```go
// ❌ PROHIBITED — nested if with error type discrimination
if err := os.Remove(path); err != nil {
    isRealError := !os.IsNotExist(err)
    if isRealError {
        return apperror.Wrap(err, code, "msg")
    }
}

// ✅ CORRECT — use pathutil, wrap and return
err := pathutil.Remove(path)
if err != nil {
    return err
}
```

## Blank Line After Closing Brace

A blank line is **mandatory** after every closing brace `}` when followed by another statement. The only exceptions are:

- **Chained control flow:** `} else {`, `} else if {`
- **Consecutive closing braces:** `}\n}`
- **Case/default in switch:** `}\ncase X:`, `}\ndefault:`

This applies to all Go code examples in specs, including `UnmarshalJSON` methods, guard clauses, and error-handling blocks. Example:

```go
if err != nil {
    return err
}

result := doSomething()
```

**Not:**
```go
if err != nil {
    return err
}
result := doSomething()
```

## Cross-References

| Reference | Location |
|-----------|----------|
| P7 Rule | `spec/02-coding-guidelines/03-golang/02-boolean-standards.md` § 2.5 |
| Coding Standards §10 | `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` |
| Issue #13 | `spec/61-how-app-issues-track/13-raw-filesystem-nested-if-violations.md` |
