# Learned: Error Management Philosophy & Standard Envelopes

> **Source:** `spec/04-error-resolution/` & `spec/03-error-code-registry/`

---

## 1. Core Error Philosophy

- Never swallow errors; every error must be logged with operation context or wrapped and returned.
- Mandatory stack traces on every failure (`runtime.Callers()` in Go, `$e->getTraceAsString()` in PHP).
- Universal API response envelope:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": 7001,
      "message": "Search provider unavailable",
      "details": { "provider": "google" },
      "stack": "..."
    },
    "meta": {
      "requestId": "req-123",
      "timestamp": "2026-09-19T00:00:00Z",
      "version": "v1"
    }
  }
  ```

## 2. Go Error Rules

- Service functions in Go must return `apperror.Result[T]` or outcome structs with `*apperror.AppError`. Bare tuples `(*Type, error)` and bare void returns are forbidden.
- No `fmt.Errorf()` in business logic; use `apperror.New()` or `apperror.Wrap()` with assigned numeric codes.
- `*AppError` is serializable across processes and networks.
