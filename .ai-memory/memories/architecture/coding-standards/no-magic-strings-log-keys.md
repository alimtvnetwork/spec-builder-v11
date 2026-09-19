# Memory: architecture/coding-standards/no-magic-strings-log-keys
Updated: 2026-03-03
**Version:** 1.0.0  

Three mandatory rules for log/context key usage in Go (and all languages):

1. **No magic strings:** All log context keys must be defined as named constants at package level (e.g., `LogKeyUserId = "userId"`). Inline string literals for keys are prohibited.

2. **No inline function calls in conditions:** Extract function return values to a separate variable before using them in an `if` condition. Never write `if x := fn(); x != "" {`. Instead: `x := fn()` then `if hasContent(x) {`.

3. **camelCase keys only:** Log context keys must use camelCase (`errorCode`, `stackTrace`, `requestId`). snake_case keys (`error_code`, `stack_trace`, `request_id`) are prohibited. External API parameters are exempt.

Canonical bad example:
```go
// ❌ FORBIDDEN — inline call + magic string + snake_case
if userId := GetUserId(ctx); userId != "" {
    args = append(args, "user_id", userId)
}
```

Canonical good example:
```go
// ✅ REQUIRED
const LogKeyUserId = "userId"

userId := GetUserId(context)
if hasContent(userId) {
    args = append(args, LogKeyUserId, userId)
}
```

Reference: `02-spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` § 10

**PHP-specific:** Plugin identity strings (name, slug, log prefix) must use `PluginConfigType` enum — see `php-plugin-identity-constants.md`.
