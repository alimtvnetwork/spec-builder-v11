# Master Coding Guidelines — Cross-Language Enforcement Reference

> **Version:** 1.2.0
> **Updated:** 2026-03-09
> **Applies to:** PHP, Go, TypeScript — all code in this project
> **Purpose:** Single source of truth for any developer or AI to produce standards-compliant code

---

## How to Use This Document

This is the **master reference**. Every rule here is enforced across all languages. Language-specific details are in:
- [PHP Standards](../04-php/00-overview.md)
- [Go Standards](../03-golang/04-golang-standards-reference.md)
- [TypeScript Standards](../02-typescript/08-typescript-standards-reference.md)
- [Database Naming](./07-database-naming.md)
- [Boolean Principles](./02-boolean-principles.md)
- [No-Negatives](./12-no-negatives.md)
- [Test Naming & Structure](./14-test-naming-and-structure.md)

---

## 1. Naming Conventions

### 1.1 — Universal Rules

| Element | Convention | PHP Example | Go Example | TS Example |
|---------|-----------|-------------|------------|------------|
| Class / Struct | PascalCase | `SnapshotManager` | `SnapshotManager` | `SnapshotManager` |
| Enum type name | PascalCase + `Type` suffix | `StatusType` | `status.Variant` (package-scoped) | `StatusType` |
| Enum case / constant | PascalCase | `StatusType::Success` | `status.Success` | `StatusType.Success` |
| Method (exported) | camelCase (PHP) / PascalCase (Go) | `processUpload()` | `ProcessUpload()` | `processUpload()` |
| Variable | camelCase | `$pluginSlug` | `pluginSlug` | `pluginSlug` |
| Boolean variable | `is`/`has`/`can`/`should`/`was` + camelCase | `$isActive` | `isActive` | `isActive` |
| File name (source) | PascalCase | `SnapshotManager.php` | `SnapshotManager.go` | `SnapshotManager.tsx` |
| Directory (Go pkg) | snake_case | — | `site_health/` | — |
| Abbreviations | First letter only caps | `$postId`, `$fileUrl` | `postId`, `fileUrl` | `postId`, `fileUrl` |
| JSON / API keys | PascalCase | `"PluginSlug"` | `"PluginSlug"` | `"PluginSlug"` |

### 1.2 — Abbreviation Standard (ALL LANGUAGES)

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `ID` | `Id` |
| `URL` | `Url` |
| `MD5` | `Md5` |
| `JSON` | `Json` |
| `API` | `Api` |
| `IP` | `Ip` |
| `SQL` | `Sql` |
| `HTTP` | `Http` |
| `HTML` | `Html` |
| `YAML` | `Yaml` |
| `XML` | `Xml` |
| `CSS` | `Css` |
| `DB` | `Db` |

> **Go Standard Library Exemptions:** `MarshalJSON()`, `UnmarshalJSON()`, `Error() string`, and `String() string` are required by Go's standard library interfaces. These method names are **exempt** and MUST retain their original spelling. Go standard library struct fields accessed on framework types (e.g., `r.URL.Path` from `net/http`) are also exempt — you cannot rename them. All **custom** identifiers (struct fields, variables, function names, parameters, enum constants, `variantLabels` values) follow the table above.

### 1.3 — Source File Naming: PascalCase (ALL LANGUAGES)

Source code files that define a **single primary type** (struct, class, component, enum) MUST be named in PascalCase to match the definition name.

| Scenario | File Name | Why |
|----------|-----------|-----|
| Go struct `SiteManager` | `SiteManager.go` | Matches primary type |
| PHP class `SnapshotManager` | `SnapshotManager.php` | Matches primary class |
| TS component `UserProfile` | `UserProfile.tsx` | Matches primary component |
| Go enum package `content_type` | `Variant.go` | Matches Go enum convention (type is `Variant`) |
| PHP enum `StatusType` | `StatusType.php` | Matches enum type name |
| Go test file for `SiteManager` | `SiteManager_test.go` | Matches source + `_test` suffix |

**Exemptions (keep lowercase):**

| File | Reason |
|------|--------|
| `main.go`, `index.ts`, `index.php` | Package/module entry points |
| `helpers.go`, `utils.ts` | Multi-purpose utility files with no single primary type |
| `routes.go`, `middleware.go` | Infrastructure files not tied to one definition |
| Go package directories | Stay `snake_case` per Go convention (`site_health/`) |

**Spec/documentation files** are **NOT** affected — they remain lowercase kebab-case with numeric prefixes (e.g., `01-architecture.md`). See [File Naming Convention](../../11-spec-management-software/02-instructions/01-file-naming-convention.md).

```
❌ WRONG — Go file with snake_case for a single-type file
snapshot_manager.go   →  contains type SnapshotManager

✅ CORRECT — PascalCase matches the definition
SnapshotManager.go   →  contains type SnapshotManager
```

```
❌ WRONG — TypeScript component with kebab-case
user-profile.tsx     →  contains function UserProfile

✅ CORRECT — PascalCase matches the component
UserProfile.tsx      →  contains function UserProfile
```

### 1.4 — Zero Underscore Policy

**Snake_case is prohibited** for all logic-level identifiers across PHP, Go, and TypeScript. This includes:
- Variables, method names, properties, parameters
- Log context array keys (PHP): use camelCase (`'postId'`, not `'post_id'`)
- Internal array keys used in code logic

**Exemptions** (persistence-level only):
- WordPress hooks, capabilities, option keys, core table/column names
- Database migration rename maps (old→new mappings)
- PHP superglobals (`$_GET`, `$_POST`)
- HTML form `name` attributes and URL query parameters
- WP-Cron arguments, manifest JSON keys
- Go `runtime.GOOS` comparisons (`"windows"`, `"darwin"`)

---

## 2. Database Naming — PascalCase

> Full reference: [database-naming.md](./07-database-naming.md)

### Rules

| Element | Convention | Example |
|---------|-----------|---------|
| Custom table names | PascalCase | `Transactions`, `AgentSites` |
| Custom column names | PascalCase | `PluginSlug`, `CreatedAt` |
| Index names | `Idx` prefix + PascalCase | `IdxTransactions_CreatedAt` |
| WordPress core tables | snake_case (EXEMPT) | `wp_posts`, `wp_options` |

### Common Mistakes

```php
// ❌ MISTAKE: Using camelCase or snake_case for DB columns
$record = array(
    'pluginSlug' => $slug,       // Wrong — camelCase
    'created_at' => $now,        // Wrong — snake_case
);

// ✅ CORRECT: PascalCase matches the schema
$record = array(
    'PluginSlug' => $slug,
    'CreatedAt'  => $now,
);
```

```go
// ❌ MISTAKE: snake_case in SQL and struct tags
const query = `SELECT plugin_slug FROM transactions`
type Tx struct {
    PluginSlug string `db:"plugin_slug"`
}

// ✅ CORRECT: PascalCase db tag, no redundant json tag
const query = `SELECT PluginSlug FROM Transactions`
type Tx struct {
    PluginSlug string `db:"PluginSlug"`
}
```

---

## 3. Boolean Standards — Positive Logic

> Full reference: [boolean-principles.md](./02-boolean-principles.md) and [no-negatives.md](./12-no-negatives.md)

### 6 Non-Negotiable Principles

| # | Principle | Rule |
|---|-----------|------|
| P1 | `is`/`has`/`can`/`should`/`was` prefix | Every boolean must start with `is`, `has`, `can`, `should`, or `was` |
| P2 | No negative words | `not`, `no`, `non` are banned from boolean names |
| P3 | Named guards | Never use `!` on function calls — use semantic inverse |
| P4 | Extract complex expressions | 2+ operators → extract to named boolean |
| P5 | No boolean parameters | Use separate named methods or options objects |
| P6 | No mixed polarity | `isX && !isY` → extract to single-intent name |

### Common Mistakes

```php
// ❌ P1 violation: Missing prefix
$active = true;
$loaded = false;

// ✅ CORRECT
$isActive = true;
$isLoaded = false;
```

```php
// ❌ P2 violation: Negative word in name
$isNotReady = true;
$hasNoPermission = true;

// ✅ CORRECT: Positive semantic synonym
$isPending = true;
$isUnauthorized = true;
```

```php
// ❌ P3 violation: Raw negation on function call
if (!$order->isValid()) { return; }
if (!file_exists($path)) { return; }

// ✅ CORRECT: Semantic inverse / guard function
if ($order->isInvalid()) { return; }
if (PathHelper::isFileMissing($path)) { return; }
```

```go
// ❌ P3 violation in Go: Raw negation
if !v.IsValid() {
    return variantLabels[Invalid]
}
if !pathutil.IsDir(gitDir) {
    return err
}

// ✅ CORRECT: Positive counterpart
if v.IsInvalid() {
    return variantLabels[Invalid]
}
if pathutil.IsDirMissing(gitDir) {
    return err
}
```

### Go-Specific Exemptions

These Go patterns are **exempt** from the no-negation rule:
- `if !ok` — idiomatic comma-ok pattern
- `if !requireService(...)` / `if !decodeJSON(...)` — handler guard returns
- `if err != nil` — idiomatic error check
- `if !strings.HasPrefix(...)` — stdlib calls (extract if repeated 3+ times)

---

## 3.1 `isDefined` / `isDefinedAndValid` — Positive Null/Existence Guards

> Language-specific details: [Go Standards](../03-golang/04-golang-standards-reference.md) · [PHP Standards](../04-php/07-php-standards-reference.md) · [TypeScript Standards](../02-typescript/08-typescript-standards-reference.md)

Raw `!== null` / `!= nil` combined with validity checks creates cognitive overhead. Use positive guard methods/functions that express intent as a single word.

### Guard Table (Cross-Language)

| Guard | Replaces | PHP | Go | TypeScript |
|-------|----------|-----|-----|------------|
| **isDefined** | `!= null`, `!= nil` | `$x->isDefined()` | `x.IsDefined()` | `isDefined(x)` |
| **isDefinedAndValid** | `!= null && isValid()` | `$x->isDefinedAndValid()` | `x.IsDefinedAndValid()` | `isDefinedAndValid(x)` |
| **isEmpty** | `== null`, `== nil` | `$x->isEmpty()` | `x.IsEmpty()` | `isEmpty(x)` |
| **isInvalid** | `!isValid()` | `$x->isInvalid()` | `x.IsInvalid()` | — |

### Common Mistakes

```php
// ❌ FORBIDDEN: Nested null + validity check
if ($config !== null) {
    if ($config->isValid()) {
        $this->applyConfig($config);
    }
}

// ❌ FORBIDDEN: Compound with null check
if ($config !== null && $config->isValid()) {
    $this->applyConfig($config);
}

// ✅ REQUIRED: Single positive guard
if ($config->isDefinedAndValid()) {
    $this->applyConfig($config);
}
```

```go
// ❌ FORBIDDEN: Raw nil check
if config != nil {
    applyConfig(config)
}

// ✅ REQUIRED: Positive existence check
if config.IsDefined() {
    applyConfig(config)
}
```

```typescript
// ❌ FORBIDDEN: Raw null/undefined checks
if (config !== null && config !== undefined) {
  applyConfig(config);
}

// ✅ REQUIRED: Type-narrowing guard function
if (isDefined(config)) {
  applyConfig(config); // TypeScript narrows to Config
}
```

### On Result Wrappers (Already Built-in)

| Method | Go | PHP | Meaning |
|--------|-----|-----|---------|
| isDefined | `result.IsDefined()` | `$result->isDefined()` | Value was set |
| isSafe | `result.IsSafe()` | `$result->isSafe()` | Value exists AND no error (≈ isDefinedAndValid) |
| isEmpty | `result.IsEmpty()` | `$result->isEmpty()` | No value set |
| hasError | `result.HasError()` | `$result->hasError()` | Operation failed |

---

## 4. Enum Standards

### 4.1 — PHP Enums

| Rule | Detail |
|------|--------|
| Type suffix | `StatusType`, `ActionType` — always `Type` suffix |
| Backed values | String-backed with PascalCase case names |
| Required methods | `isEqual()`, `isOtherThan()`, `isAnyOf()` on every backed enum |
| Comparison | Use `$status->isEqual(StatusType::Success)`, never `===` |
| Namespace | `RiseupAsia\Enums` |
| File location | `includes/Enums/{EnumName}Type.php` |

### 4.2 — Go Enums

| Rule | Detail |
|------|--------|
| Underlying type | `byte` (exception: `HttpStatusType` uses `int`) |
| Zero value | `Invalid = iota` — mandatory |
| Labels | `variantLabels` array with PascalCase strings |
| Required methods | `String()`, `Label()`, `IsValid()`, `IsInvalid()`, `Is{Value}()`, `IsOther()`, `IsAnyOf()`, `All()`, `ByIndex()`, `Parse()`, `Values()`, `MarshalJSON()`, `UnmarshalJSON()` |
| Package location | `internal/enums/{snake_case}/Variant.go` |
| Protocol exemption | `content_type`, `endpoint`, `header`, `response_key`, `response_message` preserve functional values |

### Common Mistakes

```php
// ❌ MISTAKE: Using raw === for enum comparison
if ($status === StatusType::Success) { ... }

// ✅ CORRECT: Use isEqual()
if ($status->isEqual(StatusType::Success)) { ... }
```

```go
// ❌ MISTAKE: snake_case in variantLabels
var variantLabels = [...]string{
    Invalid:  "invalid",
    PerTable: "per_table",   // Wrong
    SingleDb: "single_db",   // Wrong
}

// ✅ CORRECT: PascalCase labels
var variantLabels = [...]string{
    Invalid:  "Invalid",
    PerTable: "PerTable",
    SingleDb: "SingleDb",
}
```

---

## 5. Code Style — Formatting Rules

> Full reference: [code-style.md](./04-code-style.md)

| Rule | Description |
|------|-------------|
| R1 | Always use braces — no single-line `if` |
| R2 | Zero nested `if` — absolute ban |
| R3 | Extract complex conditions into named booleans |
| R4 | Blank line before `return`/`throw` when preceded by statements |
| R5 | Blank line after `}` when followed by more code (5a: if, 5b: loops, 5c: try/switch) |
| R6 | Max 15 lines per function body |
| R7 | Zero nested `if` reinforcement |
| R9a | Function signatures >2 params → one per line with trailing comma |
| R9b | Function calls >2 args → one per line |
| R9c | PHP array literals >2 items → one per line |
| R10 | Blank line before control structures when preceded by assignments |
| R11 | Long string concatenations → line-by-line |
| R12 | No empty line after opening brace |
| R13 | No empty line at start of file |

### Common Mistakes

```php
// ❌ R2 violation: Nested if
if ($request !== null) {
    if ($request->hasParam('file')) {
        $this->process($request);
    }
}

// ✅ CORRECT: Early return + flat
if ($request === null) {
    return;
}

if ($request->hasParam('file')) {
    $this->process($request);
}
```

```php
// ❌ R4 violation: No blank line before return
$result = $this->compute($data);
return $result;

// ✅ CORRECT
$result = $this->compute($data);

return $result;
```

```go
// ❌ R6 violation: Function too long (>15 lines)
func ProcessUpload(ctx context.Context, req Request) error {
    // 25 lines of code...
}

// ✅ CORRECT: Decompose into helpers
func ProcessUpload(ctx context.Context, req Request) error {
    if err := validateUpload(req); err != nil {
        return err
    }

    result, err := executeUpload(ctx, req)
    if err != nil {
        return apperror.Wrap(err, apperror.ErrUploadFailed, "upload failed")
    }

    return logAndRespond(ctx, result)
}
```

---

## 6. Error Handling

### PHP
- Use `try/catch` with `Throwable` (unqualified, imported via `use`)
- Never use leading backslash: `\Throwable` → `Throwable`

### Go
- All errors via `apperror.New()` or `apperror.Wrap()` — automatic stack traces
- Never use `fmt.Errorf()` for service errors
- Service methods return `apperror.Result[T]` — never raw `(T, error)` or multi-value tuples (§7.1)
- Zero type assertions in business logic — use concrete typed structs (§7.2)
- Error codes follow `E{category}xxx` convention

### 6.0 — Serialization Invariant & No Raw `error` in Structs

**`*AppError` is fully serializable.** Every `*AppError` round-trips through JSON (and YAML) preserving code, message, details, values, diagnostics, stack trace, and cause message. This enables error transport across HTTP APIs, subprocess protocols, database storage, and log aggregation.

**Struct fields that hold errors must use `*AppError` (Go), `Throwable` (PHP), or the framework's structured error type (TypeScript) — never raw `error`, `string`, or untyped exceptions.**

```go
// ❌ FORBIDDEN — error interface is not serializable
type JobResult struct {
    Output string
    Err    error     // json.Marshal → {} — all context lost
}

// ✅ REQUIRED — *AppError serializes with full diagnostic context
type JobResult struct {
    Output   string
    AppError *apperror.AppError `json:",omitempty"`
}
```

```php
// ❌ FORBIDDEN — bare string error
class JobResult {
    public string $error;  // no stack trace, no code, no diagnostics
}

// ✅ REQUIRED — Throwable with stack trace
class JobResult {
    public ?Throwable $error;  // preserves stack trace and context
}
```

**Rationale:** Raw `error` is an opaque interface — it cannot be serialized, queried, or transported. `*AppError` carries structured data (code, stack, diagnostics) that survives every boundary: HTTP responses, subprocess JSON protocol, error history DB, AI diagnostic clipboard, and log aggregation.

See [apperror §10.6 — No Raw `error` in Struct Fields](../../04-error-resolution/10-apperror-package/01-apperror-reference.md#106-no-raw-error-in-struct-fields-invariant-i-2) for the full rule.

### 6.1 — Result Guard Rule (Zero Silent Failures)

Every Result/DbResult wrapper **MUST** have its error state checked before accessing the contained value. Accessing `.value()` / `.Value()` without a prior `hasError()` or `isSafe()` guard is a **spec violation**.

**Principle:** No error may ever be swallowed. If a result carries an error, it must be explicitly handled — logged, returned, or propagated. The framework-level `.value()` / `.Value()` accessor should log immediately when called on an errored result, reducing diagnostic steps. If an error exists, the accessor returns empty/zero and the framework logs the error automatically.

```php
// PHP — DbResult / DbResultSet / DbExecResult
$result = $query->queryOne(...);

// ❌ WRONG: No guard — error silently swallowed
$result->value();

// ✅ CORRECT: Guard before access
if ($result->hasError()) {
    $this->logger->logException($result->error(), 'context');

    return null;
}

return $result->value();
```

```php
// PHP — DbResultSet (collection access)
$results = $query->queryAll(...);

// ❌ WRONG: No guard — iterating potentially empty/errored set
foreach ($results->items() as $row) { ... }

// ✅ CORRECT: Guard before iteration
if ($results->hasError()) {
    $this->logger->logException($results->error(), 'query failed');

    return [];
}

return $results->items();
```

```php
// PHP — DbExecResult (write operations)
$execResult = $query->execute(...);

// ❌ WRONG: No guard — assuming success
$execResult->affectedRows();

// ✅ CORRECT: Guard before access
if ($execResult->hasError()) {
    $this->logger->logException($execResult->error(), 'execute failed');

    return false;
}

return $execResult->affectedRows() > 0;
```

```go
// Go — Propagation Rules (Result[T], ResultSlice[T], ResultMap[K,V])
// .AppError() returns *AppError — always preserves stack trace and context.
// Named AppError() (not Error()) to avoid confusion with Go's native error interface.

// ✅ Same-type → direct return (applies to Result, ResultSlice, ResultMap)
result := svc.GetById(ctx, id)           // Result[Plugin]
if result.HasError() { return result }    // no re-wrapping needed
plugin := result.Value()

// ✅ Cross-type → Fail/FailSlice/FailMap IS needed
plugins := s.pluginService.List(ctx)      // ResultSlice[Plugin]
if plugins.HasError() {
    return apperror.FailSlice[SyncResult](plugins.AppError())
}

// ❌ WRONG — redundant (same type re-wrapped)
if result.HasError() { return apperror.Fail[Plugin](result.AppError()) }

// ✅ Collection access — guard via IsSafe()
if result.IsSafe() {
    for _, item := range result.Items() { process(item) }
}

// ✅ Adapter unwrap — Result[T] → (*T, error) // EXEMPTED: framework boundary adapter
func (a *Adapter) GetById(ctx context.Context, id int64) (*models.Plugin, error) {
    result := a.Service.GetById(ctx, id)
    if result.HasError() { return nil, result.AppError() }
    v := result.Value()
    return &v, nil
}
```

> **Full examples with PHP/Go/TypeScript:** see [apperror § Result Guard Rule](../../04-error-resolution/10-apperror-package/01-apperror-reference.md#12-result-guard-rule--mandatory-error-check-before-value-access)

#### Enforcement Checklist

- [ ] Every `result.Value()` / `$result->value()` call is preceded by `HasError()` / `hasError()` or `IsSafe()` / `isSafe()`
- [ ] Every `result.Items()` / `$results->items()` call is preceded by a guard
- [ ] Every `result.Get(key)` on `ResultMap` is preceded by a guard
- [ ] Every `$execResult->affectedRows()` on `DbExecResult` is preceded by a guard
- [ ] No error is silently discarded — all errors are logged, returned, or propagated
- [ ] Cross-service callers (direct `*service.Service` refs) guard results the same way

### Common Mistakes

```go
// ❌ MISTAKE: Raw error without stack trace
return fmt.Errorf("failed to upload: %w", err)

// ✅ CORRECT: apperror with automatic stack trace
return apperror.Wrap(err, apperror.ErrUploadFailed, "failed to upload plugin")
```

```go
// ❌ MISTAKE: Compound guard — redundant double-check after HasError()
if publishResult.HasError() || (publishResult.IsSafe() && !publishResult.Value().IsSuccess) {
    return publishResult
}

// ✅ CORRECT: HasError() is the only guard needed
if publishResult.HasError() {
    return publishResult
}
```

> **Rule:** `HasError()` is the single source of truth for failure. Never combine it with `IsSafe() && !Value().Field` conditions — that conflates transport-level errors with business-level validation, which must be handled separately at the domain layer if needed.

```php
// ❌ MISTAKE: Leading backslash on global types
catch (\Throwable $e) { ... }

// ✅ CORRECT: Use import
use Throwable;
// ...
catch (Throwable $e) { ... }
```

---

## 7. Type Safety

### PHP
- Native type declarations on all parameters, return values, properties
- Remove redundant PHPDoc when native types are present
- Max 3 parameters per function

### Go
- Zero `any`/`interface{}`/`map[string]any` in business logic
- `json.RawMessage` only at architectural boundaries
- Concrete domain models for all handler decoding

### Common Mistakes

```go
// ❌ MISTAKE: Type erasure
func ProcessData(data interface{}) interface{} { ... }

// ✅ CORRECT: Concrete types
func ProcessData(data PluginDetails) apperror.Result[PluginSummary] { ... }
```

---

## 7.1 Single Return Value Rule (Go)

**Every Go function must return exactly one value.** Multiple return values like `(bool, *Result, bool, *AppError)` are **prohibited**. Use a typed result struct instead.

### Why

Multiple return values:
- Create ambiguous call sites — callers must remember positional meaning
- Break serialization — you cannot JSON-encode a multi-return tuple
- Defeat the Result pattern — error handling becomes scattered across return positions

### Rule

| ❌ Prohibited | ✅ Required |
|--------------|------------|
| `func F() (T, error)` | `func F() apperror.Result[T]` |
| `func F() (T, bool)` | `func F() apperror.Result[T]` (use `.IsEmpty()` for "not found") |
| `func F() (bool, *R, bool, *AppError)` | `func F() apperror.Result[OnboardResult]` with a typed payload struct |
| `func F() (int, string, error)` | `func F() apperror.Result[MyOutput]` with `MyOutput` struct |

**One exception:** Go's idiomatic comma-ok pattern for map lookups (`v, ok := m[k]`) and type assertions within the `apperror` package internals are exempt. All **custom function signatures** follow this rule.

### Example: Before and After

```go
// ❌ PROHIBITED: 4 return values — positional, ambiguous, unserializable
func (s *Service) OnboardUpload(
    ctx context.Context,
    req OnboardRequest,
) (bool, *OnboardUploadResult, bool, *apperror.AppError) {
    // ...
    return true, result, false, nil
}

// Caller — positional guessing, fragile
isNew, result, hasConflict, appErr := svc.OnboardUpload(ctx, req)
if appErr != nil { ... }
if hasConflict { ... }
```

```go
// ✅ REQUIRED: Single typed result
type OnboardOutcome struct {
    IsNew       bool
    HasConflict bool
    Upload      OnboardUploadResult
}

func (s *Service) OnboardUpload(
    ctx context.Context,
    req OnboardRequest,
) apperror.Result[OnboardOutcome] {
    // ...
    return apperror.Ok(OnboardOutcome{
        IsNew:       true,
        HasConflict: false,
        Upload:      uploadResult,
    })
}

// Caller — clear, self-documenting
result := svc.OnboardUpload(ctx, req)
if result.HasError() { return result }
outcome := result.Value()
if outcome.HasConflict { ... }
```

### Payload Struct Naming

Name the return struct after the operation + `Outcome` or `Output`:

| Operation | Payload Struct |
|-----------|---------------|
| `OnboardUpload` | `OnboardOutcome` |
| `CheckSync` | `SyncCheckOutput` |
| `PublishPlugin` | `PublishOutcome` |
| `ValidateConfig` | `ValidationOutput` |

---

## 7.2 No Type Assertions / Casting (Go)

**Type assertions (`.(*Type)`, `.(string)`, `.(float64)`) are prohibited** in business logic and service code. Their presence indicates missing concrete types upstream.

**Canonical utility:** All unavoidable casts must go through `typecast.CastOrFail[T]()` from `pkg/typecast/`, which returns `apperror.Result[T]` on failure. See [Casting Elimination Patterns](./03-casting-elimination-patterns.md) for the full specification, including `CastSliceOrFail[T]`, stack-skip requirements, and test patterns.

### Why

Type assertions:
- Panic at runtime if the unchecked form is used (`x.(string)` without comma-ok)
- Signal that the data model is untyped (`interface{}`, `map[string]any`)
- Defeat the generics-first and strict-typing policies

### Rule

| ❌ Prohibited | ✅ Required |
|--------------|------------|
| `msg["text"].(string)` | Deserialize into a concrete struct |
| `cached.(float64)` | Use a typed cache: `TypedCache[float64]` |
| `payload.(*AIRequest)` | Use generics: `Envelope[AIRequest]` |
| `int(normMap["max"].(float64))` | Struct field: `NormConfig.Max int` |
| `x, _ := val.(T)` (swallowed error) | `typecast.CastOrFail[T](val)` — never discard |
| `x.(T)` bare assertion | `typecast.CastOrFail[T](x)` — returns `AppError` |

**Cast errors must NEVER be swallowed.** The blank-identifier pattern (`_, _ :=`) and bare assertions are both prohibited. All casts produce an `*apperror.AppError` on failure that must be returned or logged.

**Exemptions:**
- Go standard library interfaces: `net.Listener.Addr().(*net.TCPAddr)` — framework boundary
- `apperror` package internals — error unwrapping
- Test helpers using `require` / `assert` (test-only code) — but prefer `typecast.CastOrFail[T]` + `t.Fatalf`
- Annotate any exemption with `// EXEMPTED: <reason>` and use `.WithSkip(1)` in wrapper functions

### Example: Before and After

```go
// ❌ PROHIBITED: Type assertion on map values — runtime panic risk
func (a *Analyzer) loadWeights(cfg map[string]any) {
    a.weights = Weights{
        Stars:    cfg["github_stars"].(float64),
        Jobs:     cfg["job_postings"].(float64),
        Packages: cfg["package_downloads"].(float64),
    }
}

// ✅ REQUIRED: Concrete config struct — compile-time safe
type WeightsConfig struct {
    Stars    float64
    Jobs     float64
    Packages float64
}

func (a *Analyzer) loadWeights(cfg WeightsConfig) {
    a.weights = Weights{
        Stars:    cfg.Stars,
        Jobs:     cfg.Jobs,
        Packages: cfg.Packages,
    }
}
```

```go
// ❌ PROHIBITED: Swallowed cast error
results, _ := resp.Results.([]interface{})

// ✅ REQUIRED: Safe cast via utility
result := typecast.CastOrFail[[]interface{}](resp.Results)
if result.HasError() {
    return apperror.Fail[MyOutput](result.AppError())
}
results := result.Value()
```

```go
// ❌ PROHIBITED: Casting from cache
if cached, ok := s.cache.Load(key); ok {
    return cached.(float64), nil
}

// ✅ REQUIRED: Typed cache wrapper
type TypedCache[T any] struct { sync.Map }

func (c *TypedCache[T]) Load(key string) (T, bool) {
    v, ok := c.Map.Load(key)
    if !ok {
        var zero T
        return zero, false
    }

    return v.(T), true  // EXEMPTED: Generic wrapper internal cast
}

// Caller — no assertion needed
if val, ok := s.cache.Load(key); ok {
    return val, nil
}
```

---

## 8. Magic Strings — Zero Tolerance

All repeated strings must be captured in enums or typed constants:

| Category | PHP Solution | Go Solution |
|----------|-------------|-------------|
| Hook names | `HookType::RestApiInit->value` | N/A |
| Capabilities | `CapabilityType::ManageOptions->value` | N/A |
| Table names | `TableType::Transactions->value` | Typed const |
| Error codes | `ErrorType::DATABASE_ERROR` | `apperror.ErrDatabase` |
| HTTP methods | `HttpMethodType::Post->value` | `http.MethodPost` |
| Log levels | `LogLevelType::Error->value` | `loglevel.Error.Lower()` |
| Status values | `StatusType::Success->value` | `status.Success.String()` |

### 8.1 — Comparison Helper Arguments

**Comparison helpers (`hasMismatch`, `isEqual`, `isMatch`) must always use enum constants — never raw string literals.**

```php
// ❌ WRONG: Magic string in comparison
if (hasMismatch($participant->status, 'active')) { ... }
if (isEqual($env, 'development')) { ... }

// ✅ CORRECT: Enum constant in comparison
if (hasMismatch($participant->status, ParticipantStatus::Active->value)) { ... }
if (isEqual($env, AppEnvType::Development->value)) { ... }
```

> **See also:** [Issue #09 — Magic String Enum Comparisons](../../61-how-app-issues-track/09-magic-string-enum-comparison.md)

### 8.2 — Domain Status Comparisons

**All `===` comparisons against domain status, phase, role, or categorical string literals are PROHIBITED.** Use the corresponding enum constant instead.

```typescript
// ❌ FORBIDDEN: Raw string literal in status comparison
if (status === 'active') { ... }
if (execution.status === 'running') { ... }
if (connection.status === 'connected') { ... }
if (message.status === 'streaming') { ... }

// ✅ REQUIRED: Enum constant
if (status === EntityStatus.Active) { ... }
if (execution.status === ExecutionStatus.Running) { ... }
if (connection.status === ConnectionStatus.Connected) { ... }
if (message.status === MessageStatus.Streaming) { ... }
```

```go
// ❌ FORBIDDEN
if participant.Status == "active" { ... }

// ✅ REQUIRED
if participant.Status == entitystatus.Active { ... }
```

**Standardized domain enums:** `ExecutionStatus`, `ConnectionStatus`, `ExportStatus`, `MessageStatus`, `EntityStatus` — see [TypeScript Enum Inventory](../02-typescript/08-typescript-standards-reference.md#enum-inventory).

**Exempt patterns** (no enum required):
- Framework/runtime APIs: `process.env.NODE_ENV === 'production'`
- Browser Web APIs: `mediaRecorder.state === 'recording'`
- Language operators: `typeof x === 'string'`
- Library internals: React Query `event.type === 'updated'`

> **See also:** [Issue #10 — Domain Status Magic Strings](../../61-how-app-issues-track/10-domain-status-magic-strings.md)

---

## 9. File & Function Organization

### PHP
- PSR-4 autoloading: file name = class name
- One class/enum per file
- Traits must declare all their own `use` imports

### Go
- File target: 300 lines (hard limit 400)
- Function body: max 15 lines
- Split large files: `_crud.go`, `_helpers.go`, `_validation.go`
- Import order: stdlib → internal → third-party (3 groups, blank-line separated)

---

## 10. Array Key Conventions (PHP-Specific)

| Context | Convention | Example |
|---------|-----------|---------|
| Log context keys | camelCase | `'postId'`, `'masterDir'`, `'agentId'` |
| DB column keys | PascalCase | `'PluginSlug'`, `'CreatedAt'` |
| API response keys | Via `ResponseKeyType` enum | `ResponseKeyType::SnapshotId->value` |
| Persistence keys | Exempt (native casing) | `'schema_version'`, WP options |

### Common Mistakes

```php
// ❌ MISTAKE: snake_case in log context
$this->fileLogger->info('Post created', array('post_id' => $postId));

// ✅ CORRECT: camelCase
$this->fileLogger->info('Post created', array('postId' => $postId));
```

```php
// ❌ MISTAKE: camelCase for DB columns
$this->db->insert(TableType::Transactions->value, array('pluginSlug' => $slug));

// ✅ CORRECT: PascalCase matches schema
$this->db->insert(TableType::Transactions->value, array('PluginSlug' => $slug));
```

---

## 11. Lint Scripts (Go)

| Script | Rule | Status |
|--------|------|--------|
| `scripts/lint-file-size.sh` | No `.go` file > 300 lines | ✅ Active |
| `scripts/lint-func-size.sh` | No function body > 15 lines | ✅ Active |
| `scripts/lint-negative.sh` | No `IsNot*`, `HasNo*` function names | ✅ Active |

---

## 12. Cross-Language Enum Synchronization

Any modification to an enum must follow the [enum-consumer-checklist.md](../../11-spec-management-software/18-enum-consumer-checklist.md):
1. Update PHP enum file
2. Update Go enum file (if mirrored)
3. Update TypeScript constants/types
4. Update database migration (if stored values change)
5. Update API documentation
6. Update admin templates referencing the enum

---

## 13. Test Naming & Structure

> Full reference: [14-test-naming-and-structure.md](./14-test-naming-and-structure.md)

| Rule | Description |
|------|-------------|
| R1 | Test file mirrors source file name with test suffix |
| R2 | Three-part naming: `Test{Unit}_{Scenario}_{ExpectedOutcome}` |
| R3 | 3+ similar scenarios → table-driven tests with named cases |
| R4 | Test helpers use descriptive verb prefixes; `t.Helper()` required (Go) |
| R5 | Test body follows Arrange / Act / Assert with blank line separators |
| R6 | Each test independently runnable — no shared mutable state |
| R7 | Integration tests skippable in short/fast mode |

---

## Quick Checklist for Any Code Change

```
[ ] Naming: camelCase variables, PascalCase classes/enums/DB columns
[ ] JSON/API keys: PascalCase (e.g., "PluginSlug", "SiteId" — never "SITE_ID" or "siteId")
[ ] Abbreviations: Id (not ID), Url (not URL), Md5 (not MD5), Json (not JSON), Api (not API)
[ ] Null guards: isDefined()/isDefinedAndValid() — never raw != null/nil + isValid()
[ ] Booleans: is/has prefix, no negative words, no raw ! on calls
[ ] Enums: Type suffix, isEqual() not ===, PascalCase case names
[ ] DB: PascalCase tables/columns, PascalCase array keys for inserts
[ ] Formatting: braces always, zero nesting, blank before return, 15-line max
[ ] Errors: apperror.Wrap (Go), Throwable imported (PHP), no fmt.Errorf
[ ] Results: hasError()/isSafe() checked before .value()/.Value() — use .AppError() in Go (not .Error())
[ ] Single return: Go functions return ONE value (Result[T] or typed struct) — never (T, bool, error)
[ ] No casting: zero type assertions in Go business logic — use concrete structs
[ ] No magic strings: all via enums/typed constants
[ ] Log keys: camelCase in PHP context arrays
[ ] Types: no any/interface{} (Go), native types + no redundant PHPDoc (PHP)
[ ] Tests: three-part naming, AAA pattern, table-driven for 3+ cases, t.Helper() in Go helpers
```

---

*Master coding guidelines v1.1.0 — 2026-02-25*
