# Error Handling Rule

> **Source:** `02-spec/04-error-resolution/` & `02-spec/01-general-spec/01-foundation/02-error-management-foundation.md`  
> **Scope:** Cross-language

---

## Rules

1. **Never Swallow Errors:** Every caught exception/error must be logged with context or wrapped and returned.
2. **Preserve Stack Traces:** Never log bare `$e->getMessage()` in PHP without capturing `$e->getTraceAsString()`.
3. **Structured Envelopes:** All API and service responses must use standardized envelope: `{ success: boolean, data: T, error?: ApiError, meta: ApiMeta }`.
4. **Go Result Types:** Service functions in Go must return `apperror.Result[T]` or outcome structs with `*apperror.AppError`. Bare tuple returns `(T, error)` are forbidden.
5. **No `fmt.Errorf()` in Services:** All application errors must use `apperror.New()` or `apperror.Wrap()` with assigned numeric error codes.
6. **No Raw `error` in Structs:** Struct fields holding errors must use serializable `*apperror.AppError`.
