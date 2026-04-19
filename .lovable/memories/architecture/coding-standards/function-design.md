# Memory: architecture/coding-standards/function-design
Updated: 2026-02-28
**Version:** 1.0.0  

Functions are limited to 15 lines of code, but error-handling blocks ('if err != nil'), 'apperror.Wrap' calls, and context-chaining lines are exempt from this count and must not be condensed to save space. Every function must return exactly one value: either an 'apperror.Result[T]' or a dedicated outcome struct (e.g., 'type ActionOutcome struct'). Multi-return tuples, including the standard '(T, error)' pattern, are prohibited to enforce a uniform return and error flow. A strict maximum of 3 parameters per function is enforced; functions requiring more must be refactored using classes or reusable structs.

**API client functions** follow the same single-return rule: `apiCallTo[T]` and all public client methods (e.g., `CleanupSnapshots`) must return `apperror.Result[T]`. The `apiCallInput` struct fields for Method and Operation must use enum constants (`httpmethod.Variant` and per-domain operation enums), never string literals.

**Blank line after closing brace:** A blank line is mandatory after a closing brace `}` before the next statement — not just before `return`, but before any subsequent line of code (e.g., function calls, assignments, control flow).

**Multi-line apperror calls:** All `apperror.New()`, `apperror.Wrap()`, `apperror.FailNew()`, and `apperror.FailWrap()` calls MUST place each argument on its own line. Method chaining (`.WithUrl()`, `.WithSlug()`, etc.) must also place each chained call on its own line.

```go
// ❌ FORBIDDEN — inline arguments
return apperror.FailNew[StatusResult](apperror.ErrGitNotRepo, "not a git repo")

// ✅ REQUIRED — each argument on its own line
return apperror.FailNew[StatusResult](
    apperror.ErrGitNotRepo,
    "not a git repo",
)

// ✅ REQUIRED — chaining on separate lines
return apperror.Wrap(
    err,
    "E5002",
    "remote site request failed",
).
    WithUrl(requestUrl).
    WithSlug(pluginSlug).
    WithStatusCode(resp.StatusCode)
```
