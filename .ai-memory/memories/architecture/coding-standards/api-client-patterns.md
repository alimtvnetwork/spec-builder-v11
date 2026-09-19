# Memory: architecture/coding-standards/api-client-patterns
Updated: 2026-02-28
**Version:** 1.0.0  

Three mandatory rules for API client code in Go (applies to all CLI apps):

1. **HTTP Method enum (shared):** All HTTP method strings (`"GET"`, `"POST"`, etc.) must use `httpmethodtype.Variant` from `pkg/enums/httpmethodtype/`. Inline string literals for methods are prohibited.

2. **Per-domain Operation enum:** Each API client domain defines its own operation enum (e.g., `snapshotoperationtype.Variant`, `siteoperationtype.Variant`). Inline operation strings (`"snapshot cleanup"`) are prohibited.

3. **`apperror.Result[T]` return:** API call helpers (e.g., `apiCallTo[T]`) MUST return `apperror.Result[T]`, not `(*T, error)`. Errors are wrapped into `AppError` internally. Callers use `.HasError()` / `.Value()` — never raw tuple destructuring.

**Blank line before return:** A blank line is mandatory before `return` when preceded by a closing `}` or other code.

Canonical bad example:
```go
// ❌ FORBIDDEN — magic strings + tuple return
func (c *Client) CleanupSnapshots(opts SnapshotCleanupOptions) (*SnapshotCleanupResult, error) {
    callInput := apiCallInput{
        Method:    "POST",
        Operation: "snapshot cleanup",
    }
    return doAPICall[SnapshotCleanupResult](c, callInput)
}
```

Canonical good example:
```go
// ✅ REQUIRED — enums + Result[T]
func (c *Client) CleanupSnapshots(opts SnapshotCleanupOptions) apperror.Result[SnapshotCleanupResult] {
    callInput := apiCallInput{
        Method:    httpmethodtype.Post,
        Operation: snapshotoperationtype.Cleanup,
        Endpoint:  snapshotEndpoint(ep.SnapshotsCleanup),
        Body:      opts,
    }

    return apiCallTo[SnapshotCleanupResult](c, callInput)
}
```

Struct definition:
```go
type apiCallInput struct {
    Method    httpmethodtype.Variant
    Endpoint  string
    Body      interface{}       // acceptable: framework boundary
    Operation snapshotoperationtype.Variant // or siteoperationtype.Variant, pluginoperationtype.Variant per domain
}
```

References:
- `02-spec/02-coding-guidelines/03-golang/readme.md` § Typed Constants & Enums
- `.lovable/memories/architecture/coding-standards/function-design` (single-return rule)
