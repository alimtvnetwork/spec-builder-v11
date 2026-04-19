# Golang Coding Standards

> **Version:** 3.5.0
> **Updated:** 2026-03-09
> **Applies to:** All Go backend code

---

## File Size — Target 300 Lines (Soft Limit 400)

Every `.go` file targets **300 lines**. Up to **400 lines is acceptable** but must include a top-of-file comment: `// NOTE: Needs refactor — exceeds 300-line target`. Split large files using these suffixes:

| Suffix | Purpose |
|--------|---------|
| `entity.go` | Struct + constructors |
| `entity_crud.go` | Database operations |
| `entity_helpers.go` | Private utilities |
| `entity_validation.go` | Validation logic |

---

## Function Size — Max 15 Lines

> **Canonical source:** [Cross-Language Code Style](../01-cross-language/04-code-style.md) — Rule 6

Every function body must be **15 lines or fewer**. Extract logic into small, well-named helpers.

```go
// ❌ FORBIDDEN: Long function
func ProcessUpload(ctx context.Context, req UploadRequest) error {
    // 20+ lines of validation, upload, logging...
}

// ✅ REQUIRED: Decomposed
func ProcessUpload(ctx context.Context, req UploadRequest) error {
    if err := validateUpload(req); err != nil {
        return err
    }

    result, err := executeUpload(ctx, req)
    if err != nil {
        return apperror.Wrap(
            err,
            "E5001",
            "upload failed",
        )
    }

    return logAndRespond(ctx, result)
}
```

---

## Zero Nested `if` — Absolute Ban

> **Canonical source:** [Cross-Language Code Style](../01-cross-language/04-code-style.md) — Rule 2 & 7

Nested `if` blocks are **absolutely forbidden** — zero tolerance. Flatten with combined conditions or early returns.

```go
// ❌ FORBIDDEN
if err != nil {
    if resp != nil {
        handleError(resp)
    }
}

// ✅ REQUIRED
if err != nil && resp != nil {
    handleError(resp)
}
```

---

## Abbreviation Casing — First Letter Only

> **Canonical source:** [Master Coding Guidelines §1.2](../01-cross-language/15-master-coding-guidelines.md)

Abbreviations in identifiers are treated as regular words — only capitalize the first letter. This applies to struct fields, variables, function names, parameters, enum constants, and `variantLabels` values.

| ❌ Wrong | ✅ Correct | Why |
|----------|-----------|-----|
| `SerpAPI` | `SerpApi` | API → Api |
| `BaseURL` | `BaseUrl` | URL → Url |
| `RequiresAPIKey` | `RequiresApiKey` | API → Api |
| `WithURL` | `WithUrl` | URL → Url |
| `postID` | `postId` | ID → Id |
| `fileURL` | `fileUrl` | URL → Url |
| `parseJSON` | `parseJson` | JSON → Json |
| `toYAML` | `toYaml` | YAML → Yaml |
| `httpAPI` | `httpApi` | API → Api |
| `sqlDB` | `sqlDb` | DB → Db |
| `htmlOutput` | `htmlOutput` | ✅ already correct (lowercase prefix) |

**Exemptions (Go standard library interfaces only):**
- `MarshalJSON()` / `UnmarshalJSON()` — required by `encoding/json`
- `Error() string` — required by `error` interface
- `String() string` — required by `fmt.Stringer`

These interface method names are mandated by Go's standard library and MUST retain their original spelling. All other identifiers follow the abbreviation rule.

---

## Type Safety — No `interface{}` or `any`

### Rule: Never use `interface{}` or `any` in exported APIs

```go
// ❌ FORBIDDEN
func ProcessData(data interface{}) interface{} { ... }
func FetchResults() (any, error) { ... }

// ✅ REQUIRED: Use concrete types or generics
func ProcessData(data PluginDetails) apperror.Result[PluginSummary] { ... }
func FetchResults[T any]() apperror.Result[T] { ... }
```

### Acceptable `any` Usage

1. **SQL query arguments** — `args ...any` in `dbutil` (framework boundary)
2. **Logger variadic parameters** — `map[string]any` for structured log fields (internal only)
3. **Third-party library interfaces** — When a library requires `interface{}`

---

## Error Handling — `apperror` Package

### Rule 1: Every error carries a mandatory stack trace

All errors created via `apperror.New()` or `apperror.Wrap()` automatically capture a full `StackTrace` at creation — no opt-in needed.

```go
// ❌ FORBIDDEN: loses stack trace
return fmt.Errorf("failed to upload: %w", err)

// ✅ REQUIRED: full stack trace captured automatically
return apperror.Wrap(
    err,
    "E5001",
    "failed to upload plugin",
)
```

### Rule 2: AppError-Only — No Raw `error` in Application Code

**All application code MUST use `*apperror.AppError` instead of Go's raw `error` type.** The standard `error` interface is only acceptable at framework boundaries — the moment you receive a raw `error` from a framework, stdlib call, or third-party library, you **must immediately wrap it** into an `AppError`.

```go
// ❌ FORBIDDEN: Returning raw error from application code
func (s *PluginService) Upload(ctx context.Context, req UploadRequest) error {
    file, err := os.Open(req.Path)
    if err != nil {
        return err  // ❌ Raw error escaping application boundary
    }
    // ...
}

// ✅ REQUIRED: Wrap immediately at the boundary
func (s *PluginService) Upload(ctx context.Context, req UploadRequest) apperror.Result[UploadResult] {
    file, err := os.Open(req.Path)
    if err != nil {
        return apperror.FailWrap[UploadResult](
            err,
            "E4001",
            "failed to open file: "+req.Path,
        )
    }
    // ...
}
```

#### Where Raw `error` Is Acceptable

| Context | Why | Example |
|---------|-----|---------|
| Receiving from stdlib/framework | You don't control the return type | `os.Open()`, `json.Unmarshal()`, `sql.Query()` |
| Implementing stdlib interfaces | Go requires `error` return | `io.Reader`, `http.Handler`, `encoding.Marshaler` |
| `main()` or top-level bootstrap | Before apperror is initialized | `log.Fatal(err)` |

#### Where Raw `error` Is FORBIDDEN

| Context | Required Instead |
|---------|-----------------|
| Service method returns | `apperror.Result[T]` / `*apperror.AppError` |
| Repository/store returns | `apperror.Result[T]` / `apperror.ResultSlice[T]` |
| Error propagation between services | `apperror.Fail[T](src.AppError())` |
| Error creation for business logic | `apperror.New("E1001", "message")` |
| Wrapping framework errors | `apperror.Wrap(err, "E1002", "context")` |

#### The Wrap-Immediately Pattern

```go
// Pattern: Wrap at first contact, propagate as AppError thereafter
func (s *SyncService) Pull(ctx context.Context, pluginID int64) apperror.Result[PullResult] {
    // Framework boundary — raw error received and IMMEDIATELY wrapped
    output, err := exec.CommandContext(ctx, "git", "pull").Output()
    if err != nil {
        return apperror.FailWrap[PullResult](
            err,
            "E7001",
            "git pull failed",
        )
    }

    // Application boundary — already AppError, propagate directly
    plugin := s.pluginService.GetById(ctx, pluginID)
    if plugin.HasError() {
        return apperror.Fail[PullResult](plugin.AppError())
    }

    return apperror.Ok(PullResult{Output: string(output)})
}
```

### StackTrace Type

```go
// Captured automatically — structured frames, not raw strings
type StackFrame struct {
    Function string
    File     string
    Line     int
}
type StackTrace []StackFrame

// Display methods
trace.String()      // full formatted multi-line trace
trace.CallerLine()  // "file.go:42" — compact single line
trace.IsEmpty()     // no frames captured
trace.Depth()       // number of frames
```

### AppError Display Methods

```go
err.Error()       // "[E5001] upload failed" — implements error interface
err.FullString()  // code + message + diagnostics + stack + cause chain
err.ToClipboard() // markdown-formatted error report for AI paste
```

### Context Enrichment — Typed Diagnostic Setters

```go
// ✅ Enriched error with diagnostic context
return apperror.Wrap(
    err,
    "E5002",
    "remote site request failed",
).
    WithUrl(requestUrl).
    WithSlug(pluginSlug).
    WithStatusCode(resp.StatusCode).
    WithSiteId(siteId)
```

### Error Code Convention

| Range | Category |
|-------|----------|
| E1xxx | Configuration errors |
| E2xxx | Database errors |
| E3xxx | WordPress API errors |
| E4xxx | File system errors |
| E5xxx | Sync errors |
| E6xxx | Backup errors |
| E7xxx | Git errors |
| E8xxx | Build errors |
| E9xxx | General errors |
| E10xxx | E2E test errors |
| E11xxx | Publish errors |
| E12xxx | Version errors |
| E13xxx | Session errors |
| E14xxx | Crypto errors |

---

## Generic Result Types — `apperror` Package

Three generic result types for all service returns. Replaces raw `(T, error)` tuples.

### `Result[T]` — Single Value

For operations that return one item or nothing.

```go
// Construction
result := apperror.Ok(plugin)             // success
result := apperror.Fail[Plugin](appErr)   // from AppError
result := apperror.FailWrap[Plugin](
    err,
    "E5001",
    "load failed",
)
result := apperror.FailNew[Plugin](
    "E4004",
    "not found",
)

// Query methods
result.HasError()    // true if operation failed
result.IsSafe()      // true if value exists AND no error
result.IsDefined()   // true if value was set
result.IsEmpty()     // true if no value was set

// Access methods
result.Value()             // returns T; panics if HasError
result.ValueOr(fallback)   // returns T or fallback if empty
result.AppError()          // returns *AppError or nil (named AppError to avoid confusion with Go's error)
result.Unwrap()            // bridges to (T, error) pattern
```

### `ResultSlice[T]` — Collection (Array)

For operations that return lists of items.

```go
// Construction
set := apperror.OkSlice(plugins)
set := apperror.FailSlice[Plugin](appErr)
set := apperror.FailSliceWrap[Plugin](err, "E5011", "query failed")

// Query methods
set.HasError()     // true if operation failed
set.IsSafe()       // true if no error (items may be empty)
set.HasItems()     // true if at least one item
set.IsEmpty()      // true if zero items
set.Count()        // number of items

// Access methods
set.Items()        // returns []T (nil if error)
set.First()        // Result[T] for first item
set.Last()         // Result[T] for last item
set.GetAt(index)   // Result[T] at index; empty if out of bounds
set.AppError()     // returns *AppError or nil

// Mutation methods
set.Append(items...)  // adds items; no-op if in error state
```

### `ResultMap[K, V]` — Associative Map

For operations that return key-value data.

```go
// Construction
m := apperror.OkMap(pluginsBySlug)
m := apperror.FailMap[string, Plugin](appErr)
m := apperror.FailMapWrap[string, Plugin](err, "E5012", "index failed")

// Query methods
m.HasError()     // true if operation failed
m.IsSafe()       // true if no error (map may be empty)
m.HasItems()     // true if at least one entry
m.IsEmpty()      // true if zero entries
m.Count()        // number of entries
m.Has(key)       // true if key exists

// Access methods
m.Items()        // returns map[K]V (nil if error)
m.Get(key)       // Result[V] for key; empty if not found
m.Keys()         // returns []K
m.Values()       // returns []V
m.AppError()     // returns *AppError or nil

// Mutation methods
m.Set(key, value)   // adds/updates; no-op if error state
m.Remove(key)       // deletes key; no-op if error state
```

### Service Usage Pattern

```go
// ✅ Same-type propagation — use bridge method (no unwrap+rewrap)
func (s *SiteService) ListAll(ctx context.Context) apperror.ResultSlice[Site] {
    set := dbutil.QueryMany[Site](ctx, s.db, query, scanSite)
    if set.HasError() {
        return set.ToAppResultSlice()
    }

    return apperror.OkSlice(set.Items())
}

// ✅ Single-row with post-processing — direct propagation via AppError()
func (s *PluginService) GetById(ctx context.Context, id int64) apperror.Result[Plugin] {
    dbResult := dbutil.QueryOne[Plugin](ctx, s.db, query, scanPlugin, id)
    if dbResult.HasError() {
        return apperror.Fail[Plugin](dbResult.AppError())
    }
    if dbResult.IsEmpty() {
        return apperror.FailNew[Plugin](
            ErrNotFound,
            "plugin not found",
        )
    }

    return apperror.Ok(dbResult.Value())
}

// ✅ Cross-type propagation — different T, Fail[NewT] is correct
func (s *GitService) Pull(ctx context.Context, pluginID int64) apperror.Result[PullResult] {
    pResult := s.pluginService.GetById(ctx, pluginID)
    if pResult.HasError() {
        return apperror.Fail[PullResult](pResult.AppError())
    }
    // ...
}

// ✅ Handler consuming Result[T]
func (h *Handler) GetPlugin(w http.ResponseWriter, r *http.Request) {
    result := h.plugins.GetById(r.Context(), pluginId)
    if result.HasError() {
        writeError(w, result.AppError())
        return
    }

    writeJSON(w, result.Value())
}
```

### Error Propagation Rules

| Scenario | Pattern | Example |
|----------|---------|---------|
| Same T, dbutil→apperror slice | Bridge method | `set.ToAppResultSlice()` |
| Same T, dbutil→apperror single | Bridge method | `result.ToAppResult()` |
| Different T (cross-type) | `Fail[NewT](src.AppError())` | `apperror.Fail[BuildResult](pluginResult.AppError())` |
| Same wrapper, same T | Direct return | `return existingResult` |

> **Anti-pattern:** Never unwrap an error just to re-wrap it into the same type parameter:
> ```go
> // ❌ FORBIDDEN: redundant unwrap+rewrap (same T)
> return apperror.FailSlice[Plugin](set.AppError())
>
> // ✅ REQUIRED: use bridge method
> return set.ToAppResultSlice()
> ```

---

## Database Naming Convention — PascalCase

> **Canonical source:** [Database Naming Convention](../01-cross-language/07-database-naming.md)

All custom SQLite table names, column names, and index names MUST use **PascalCase**. Go struct `db` tags must match column names. JSON tags follow the redundancy rule below — omit when the field name already matches.

```go
// ✅ PascalCase table and column names — no redundant json tags
const queryList = `SELECT Id, ProjectId, DisplayName, CreatedAt FROM Projects`

type Project struct {
    Id          int64  `db:"Id"`
    ProjectId   string `db:"ProjectId"`
    DisplayName string `db:"DisplayName"`
    CreatedAt   string `db:"CreatedAt"`
}
```

---

## Database Wrapper — `pkg/dbutil`

All database queries MUST use the generic `dbutil` package. Returns typed result envelopes with automatic `apperror` stack traces.

### Result Types

| Type | Purpose | Key Methods |
|------|---------|-------------|
| `Result[T]` | Single-row query | `IsDefined()`, `IsEmpty()`, `HasError()`, `IsSafe()`, `Value()`, `AppError()`, `StackTrace()` |
| `ResultSet[T]` | Multi-row query | `HasAny()`, `IsEmpty()`, `Count()`, `HasError()`, `IsSafe()`, `Items()`, `First()`, `AppError()`, `StackTrace()` |
| `ExecResult` | INSERT/UPDATE/DELETE | `IsEmpty()`, `HasError()`, `IsSafe()`, `AffectedRows`, `LastInsertId`, `AppError()`, `StackTrace()` |

> **Naming: `.AppError()` vs `.Error()`**
> Both `dbutil` result types and `apperror` result types use `.AppError()` (not `.Error()`) to return the underlying `*apperror.AppError`. This avoids collision with Go's built-in `error` interface method `.Error() string`. The `apperror.AppError` struct itself still implements the standard `error` interface via `.Error() string` (returns `"[code] message"`), but all result wrappers — whether in `dbutil` (`Result[T]`, `ResultSet[T]`, `ExecResult`) or `apperror` (`Result[T]`, `ResultSlice[T]`, `ResultMap[K,V]`) — expose `.AppError()` for the structured error accessor.

### Generic Query Functions

```go
// Single row — returns Result[T]
result := dbutil.QueryOne[Plugin](ctx, db, query, scanPlugin, pluginId)

// Multiple rows — returns ResultSet[T]
set := dbutil.QueryMany[Site](ctx, db, query, scanSite)

// Exec — returns ExecResult
res := dbutil.Exec(ctx, db, query, args...)
```

---

## Struct Design

### JSON Tags — Omit Redundant Tags

Go's `encoding/json` marshaler uses the **field name** by default. Since all our fields are PascalCase and JSON output is PascalCase, explicit `json:"FieldName"` tags are **redundant** and MUST be omitted. Only add a `json` tag when using `omitempty`:

```go
// ❌ WRONG — redundant json tags that repeat the field name
type PluginDetails struct {
    Id        int    `json:"Id"`
    Name      string `json:"Name"`
    Slug      string `json:"Slug"`
    Version   string `json:"Version"`
    IsActive  bool   `json:"IsActive"`
    UpdatedAt string `json:"UpdatedAt,omitempty"`
}

// ✅ CORRECT — no tags unless omitempty is needed
type PluginDetails struct {
    Id        int
    Name      string
    Slug      string
    Version   string
    IsActive  bool
    UpdatedAt string `json:",omitempty"`
}
```

**Rules:**
- **No tag:** Field marshals as its Go name (PascalCase) — this is the default
- **`json:",omitempty"`:** Only when zero-value fields should be excluded from output
- **`json:"-"`:** Only when a field must be excluded from JSON entirely
- **`db:"ColumnName"`:** Always required for database-mapped structs (db tags don't auto-derive)

### Function Parameters — Max 2-3

Functions should have **2-3 parameters maximum**. Use config/options structs for more:

```go
// ❌ Bad: Too many parameters
func StartSession(sessionType SessionType, pluginId, siteId int64, pluginName, siteName string) (string, error)

// ✅ Good: Use a struct
type StartSessionInput struct {
    Type       SessionType
    PluginId   int64
    SiteId     int64
    PluginName string
    SiteName   string
}
func StartSession(input StartSessionInput) apperror.Result[string]

// ✅ Acceptable: 2-3 essential parameters (context doesn't count)
func GetById(ctx context.Context, id int64) apperror.Result[Model]
```

---

## File Naming & Organization

### File Naming Rules

| Rule | Convention | Example |
|------|-----------|---------|
| File name | `snake_case.go` | `server_config.go`, `status_type.go` |
| Maps to primary type | File name derived from its exported type | `ServerConfig` → `server_config.go` |
| One exported type per file | Each struct/interface/enum gets its own file | Don't combine `Config` + `ServerConfig` |
| Related methods stay together | All methods on a type live in its file | `StatusType.IsValid()` stays in `status_type.go` |
| Suffix convention | Split large types using suffixes | `_crud.go`, `_helpers.go`, `_validation.go` |
| Package directory | `snake_case` for multi-word | `site_health/`, `search_mode/` |

### Splitting Convention (When Files Exceed 300 Lines)

| Suffix | Purpose | Example |
|--------|---------|---------|
| `{type}.go` | Struct + constructors | `config.go` |
| `{type}_crud.go` | Database CRUD operations | `plugin_crud.go` |
| `{type}_helpers.go` | Private utility functions | `config_helpers.go` |
| `{type}_validation.go` | Input/business rule validation | `upload_validation.go` |
| `{type}_json.go` | JSON marshal/unmarshal methods | `error_json.go` |

### Package Directory Naming

```
// ✅ Correct — enum packages end with 'type' suffix, no underscores
internal/enums/logleveltype/
internal/enums/snapshotmodetype/
internal/services/site_health/

// ❌ Wrong
internal/enums/logLevel/
internal/enums/log_level/
internal/enums/SnapshotMode/
internal/services/SiteHealth/
```

### File-to-Type Mapping Examples

```
// ✅ One type per file, name matches
config.go           → type Config struct
server_config.go    → type ServerConfig struct
watcher_config.go   → type WatcherConfig struct
status_type.go      → type StatusType byte + methods
error_json.go       → MarshalJSON/UnmarshalJSON on AppError

// ❌ Wrong: multiple unrelated types in one file
config.go           → Config + ServerConfig + WatcherConfig + BackupConfig
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Package names | Lowercase, single word | `wordpress`, `publish`, `apperror` |
| Package directories | `snake_case` for multi-word | `site_health`, `log_level` |
| File names | `snake_case.go`, maps to primary type | `server_config.go`, `status_type.go` |
| Exported functions | PascalCase, verb-led | `EnablePlugin`, `FetchStatus` |
| Unexported functions | camelCase, verb-led | `resolveNamespace`, `parseStackTrace` |
| Interfaces | PascalCase, `-er` suffix for single-method | `Publisher`, `PluginStore` |
| Constants | PascalCase | `MaxRetryAttempts`, `DefaultTimeout` |
| Error variables | `Err` prefix | `ErrPluginNotFound`, `ErrUploadFailed` |
| Boolean functions | Positive naming only | `IsValid()`, `HasPermission()` |

---

## No Raw Negations — Use Positive Guard Functions

> **Canonical source:** [No Raw Negations](../01-cross-language/12-no-negatives.md)

```go
// ❌ FORBIDDEN
if !fileExists(path) { ... }
if !strings.Contains(s, substr) { ... }

// ✅ REQUIRED
if IsFileMissing(path) { ... }
if IsMissingSubstring(s, substr) { ... }
```

---

## `IsDefined` and `IsDefinedAndValid` — Positive Nil/Existence Guards

### Rule: Never use negated nil checks — use `IsDefined()` instead

Raw `!= nil` combined with negation or nested validity checks creates cognitive overhead. Use positive guard methods that express intent clearly.

### `IsDefined()` — Value Existence Check

Returns `true` when the value has been set (is not nil/zero). This replaces `!= nil` checks and negated null patterns.

```go
// ❌ FORBIDDEN: Negated nil check
if config != nil {
    applyConfig(config)
}

// ❌ FORBIDDEN: Double negation
if !isNil(config) {
    applyConfig(config)
}

// ✅ REQUIRED: Positive existence check
if config.IsDefined() {
    applyConfig(config)
}
```

### `IsDefinedAndValid()` — Existence + Validity Combined

Returns `true` when the value exists AND passes its own validation rules. This replaces the common pattern of checking nil then checking validity in a nested or compound condition.

```go
// ❌ FORBIDDEN: Nested nil + validity check
if config != nil {
    if config.IsValid() {
        applyConfig(config)
    }
}

// ❌ FORBIDDEN: Compound with nil check (nested if ban applies too)
if config != nil && config.IsValid() {
    applyConfig(config)
}

// ✅ REQUIRED: Single positive guard
if config.IsDefinedAndValid() {
    applyConfig(config)
}
```

### Implementation Pattern

Every struct that can be nil or absent should implement both methods:

```go
// On pointer receiver types
func (c *Config) IsDefined() bool {
    return c != nil
}

func (c *Config) IsDefinedAndValid() bool {
    return c != nil && c.validate() == nil
}

// On Result[T] wrapper (already built-in)
result.IsDefined()  // true when value was set
result.IsSafe()     // true when value exists AND no error (equivalent to IsDefinedAndValid for results)
```

### Guard Function Table

| Guard Method | Replaces | Description |
|-------------|----------|-------------|
| `IsDefined()` | `!= nil`, `x != nil` | Value exists (not nil/zero) |
| `IsDefinedAndValid()` | `!= nil && IsValid()` | Value exists AND passes validation |
| `IsEmpty()` | `== nil`, `x == nil` | No value set (absent) |
| `IsInvalid()` | `!IsValid()` | Value fails validation |

### On `apperror.Result[T]` (Already Built-in)

| Method | Meaning |
|--------|---------|
| `IsDefined()` | Value was set (regardless of error state) |
| `IsSafe()` | Value exists AND no error — equivalent to `IsDefinedAndValid()` |
| `IsEmpty()` | No value was set |
| `HasError()` | Operation failed |

### Real-World Examples

```go
// Service layer — checking optional input
func (s *SiteService) Update(ctx context.Context, input UpdateSiteInput) apperror.Result[Site] {
    if input.Config.IsDefined() {
        if input.Config.IsDefinedAndValid() {
            applyConfig(input.Config)
        } else {
            return apperror.FailNew[Site](
                "E3010",
                "invalid site config",
            )
        }
    }
    // ...
}

// Handler layer — checking optional query parameter
func (h *Handler) ListPlugins(w http.ResponseWriter, r *http.Request) {
    filter := parseFilter(r)
    if filter.IsDefinedAndValid() {
        plugins = h.plugins.ListFiltered(r.Context(), filter)
    } else {
        plugins = h.plugins.ListAll(r.Context())
    }
}
```

---

## Typed Constants & Enums

> **Canonical source:** [Enum Specification](01-enum-specification/00-overview.md)

All enums MUST use `byte` as the underlying type with `iota`. String-backed types are **deprecated** and must be migrated.

### Byte-Based Enums (Required)

```go
type StatusType byte

const (
    Invalid   StatusType = iota
    Active
    Inactive
    Pending
)

// Required methods: String, Label, IsValid, Is{Value}, All, ByIndex, Parse
// Required: MarshalJSON, UnmarshalJSON
```

### Exception: Int-Based Enums

`HttpStatusType` is exempt from byte conversion — HTTP codes are inherently numeric. Must still implement all required methods.

### Zero Magic Strings/Numbers

- All HTTP status codes → typed constants
- All error codes → `apperror` code constants
- All config keys → typed const block
- All status/event strings → typed byte-based enum constants
- All HTTP methods in API clients → `httpmethodtype.Variant` enum (shared package)
- All API operation names → per-domain operation enum (e.g., `snapshotoperationtype.Variant`, `siteoperationtype.Variant`)

### HTTP Method Enum — Shared Package

HTTP method strings (`"GET"`, `"POST"`, etc.) are **prohibited** as inline literals. Use the shared `httpmethodtype.Variant` enum from `pkg/enums/httpmethodtype/`.

```go
// pkg/enums/httpmethodtype/variant.go
type Variant byte

const (
    Invalid Variant = iota
    Get
    Post
    Put
    Patch
    Delete
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Get:     "GET",
    Post:    "POST",
    Put:     "PUT",
    Patch:   "PATCH",
    Delete:  "DELETE",
}
```

### Per-Domain Operation Enums

Each API client domain defines its own operation enum. Operation strings (`"snapshot cleanup"`, `"site register"`) are **prohibited** as inline literals.

```go
// internal/enums/snapshottype/operation.go
type Operation byte

const (
    InvalidOp Operation = iota
    Create
    Cleanup
    Restore
    List
    Delete
)

var operationLabels = [...]string{
    InvalidOp: "Invalid",
    Create:    "Create",
    Cleanup:   "Cleanup",
    Restore:   "Restore",
    List:      "List",
    Delete:    "Delete",
}
```

### API Client — No Tuple Returns, No Magic Strings

API client helper functions (e.g., `apiCallTo`) MUST return `apperror.Result[T]`, not `(*T, error)`. All struct literal fields for method and operation MUST use enum constants.

```go
// ❌ FORBIDDEN: magic strings + tuple return
func (c *Client) CleanupSnapshots(opts SnapshotCleanupOptions) (*SnapshotCleanupResult, error) {
    callInput := apiCallInput{
        Method:    "POST",
        Endpoint:  snapshotEndpoint(ep.SnapshotsCleanup),
        Body:      opts,
        Operation: "snapshot cleanup",
    }

    return doAPICall[SnapshotCleanupResult](c, callInput)
}

// ✅ REQUIRED: enum constants + Result[T] return
func (c *Client) CleanupSnapshots(opts SnapshotCleanupOptions) apperror.Result[SnapshotCleanupResult] {
    callInput := apiCallInput{
        Method:    httpmethod.Post,
        Endpoint:  snapshotEndpoint(ep.SnapshotsCleanup),
        Body:      opts,
        Operation: snapshotoperationtype.Cleanup,
    }

    return apiCallTo[SnapshotCleanupResult](c, callInput)
}
```

### `apiCallTo` — Single Result Return

The generic API call helper MUST return `apperror.Result[T]`. Errors are wrapped into `AppError` internally — callers never see raw `error`.

```go
// ❌ FORBIDDEN: tuple return
func doAPICall[T any](c *Client, input apiCallInput) (*T, error) {
    data, err := c.doAPICallRaw(input)
    if err != nil {
        return nil, err
    }
    return decodeAPIResponse[T](data, input.Operation)
}

// ✅ REQUIRED: Result[T] return with AppError
func apiCallTo[T any](c *Client, input apiCallInput) apperror.Result[T] {
    data, err := c.apiCallToRaw(input)
    if err != nil {
        return apperror.FailWrap[T](
            err,
            "E4010",
            "API call failed: "+input.Operation.Label(),
        )
    }

    return decodeApiResponse[T](data, input.Operation)
}
```

### `apiCallInput` Struct — Typed Fields

```go
type apiCallInput struct {
    Method    httpmethod.Variant
    Endpoint  string
    Body      interface{}  // acceptable: framework boundary
    Operation snapshotoperationtype.Variant  // or siteoperationtype.Variant, pluginoperationtype.Variant, etc.
}
```

---

## DRY Enforcement

| Pattern | Solution |
|---------|----------|
| Repeated error handling | `apperror.Result[T]` or helper functions |
| Repeated JSON key access | Typed response structs |
| Repeated validation | `Validate()` method on input structs |
| Repeated DB patterns | `dbutil` generic wrappers |
| Repeated string constants | Typed const blocks with `Type` suffix |

---

## Concurrency Patterns

### `sync.Once` for Lazy Initialization

```go
var (
    openAPISpec     []byte
    openAPISpecOnce sync.Once
)

func GetOpenAPISpec() []byte {
    openAPISpecOnce.Do(func() {
        openAPISpec, _ = pathutil.ReadFile("api/openapi.json")
    })
    return openAPISpec
}
```

### Context Propagation

All long-running operations must accept `context.Context`:

```go
func (s *PublishService) Upload(ctx context.Context, req UploadRequest) error { ... }
```

---

## Forbidden Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `interface{}` / `any` in exported APIs | Untyped | Concrete types or generics |
| `fmt.Errorf` for service errors | No stack trace | `apperror.Wrap` |
| Raw `error` return from services | No stack trace, no code | `apperror.Result[T]` or `*apperror.AppError` |
| Panic in handlers | Crashes server | Return error |
| `init()` functions | Hidden side effects | Explicit initialization |
| Global mutable state | Race conditions | Dependency injection |
| `map[string]interface{}` in APIs | Untyped | Defined structs |
| Raw `(T, error)` from services | No semantic methods | `apperror.Result[T]` |
| Raw `(T, error)` from API call helpers | No semantic methods | `apperror.Result[T]` |
| `"POST"` / `"GET"` string literals | Magic string | `httpmethod.Post` / `httpmethod.Get` enum |
| `"snapshot cleanup"` operation strings | Magic string | Per-domain operation enum constant |
| `!fn()` raw negation | Easy to miss `!` | Positive guard function |
| `x != nil && x.IsValid()` | Compound nil+valid check | `x.IsDefinedAndValid()` |
| Nested `if` (any depth) | **Zero tolerance** | Flatten with early returns |
| Functions > 15 lines | Hard to read | Extract small helpers |
| Files > 400 lines | Hard to navigate | Split with suffix convention (target 300) |
| Magic strings/numbers | Brittle | Typed constants |
| Boolean flag parameters | Unclear intent | Separate named methods |
| `json:"FieldName"` matching field name | Redundant — Go marshals PascalCase by default | Omit tag; use `json:",omitempty"` only when needed |

---

## Import Organization — 3 Groups

```go
import (
    // stdlib
    "context"
    "fmt"

    // internal packages
    "project/pkg/apperror"
    "project/internal/domain"

    // third-party
    "github.com/lib/pq"
)
```

---

## Common Mistakes — Go

These are real violations found and fixed. Reference to avoid repeating.

### Mistake 1: snake_case in `variantLabels`

```go
// ❌ WRONG — snake_case labels
var variantLabels = [...]string{
    Invalid:  "invalid",
    PerTable: "per_table",
}

// ✅ CORRECT — PascalCase labels
var variantLabels = [...]string{
    Invalid:  "Invalid",
    PerTable: "PerTable",
}
```

### Mistake 2: `!v.IsValid()` Instead of `v.IsInvalid()`

```go
// ❌ WRONG — raw negation
func (v Variant) String() string {
    if !v.IsValid() {
        return variantLabels[Invalid]
    }
    return variantLabels[v]
}

// ✅ CORRECT — positive counterpart
func (v Variant) String() string {
    if v.IsInvalid() {
        return variantLabels[Invalid]
    }
    return variantLabels[v]
}
```

### Mistake 3: `!pathutil.IsDir()` Without Counterpart

```go
// ❌ WRONG — raw negation on utility
if !pathutil.IsDir(gitDir) {
    return apperror.FailNew[StatusResult](
        apperror.ErrGitNotRepo,
        "not a git repo",
    )
}

// ✅ CORRECT — use IsDirMissing()
if pathutil.IsDirMissing(gitDir) {
    return apperror.FailNew[StatusResult](
        apperror.ErrGitNotRepo,
        "not a git repo",
    )
}
```

### Mistake 4: `fmt.Errorf()` for Service Errors

```go
// ❌ WRONG — no stack trace, no error code
return fmt.Errorf("failed to upload: %w", err)

// ✅ CORRECT — apperror with automatic stack trace
return apperror.Wrap(
    err,
    apperror.ErrUploadFailed,
    "failed to upload plugin",
)
```

### Mistake 5: Raw `(T, error)` from Service Methods

```go
// ❌ WRONG — raw tuple, no semantic methods
func (s *PluginService) GetById(ctx context.Context, id int64) (*Plugin, error) { ... }

// ✅ CORRECT — typed result wrapper
func (s *PluginService) GetById(ctx context.Context, id int64) apperror.Result[Plugin] { ... }
```

### Mistake 5b: Raw `(T, error)` from API Call Helpers

```go
// ❌ WRONG — tuple return + magic strings
func doAPICall[T any](c *Client, input apiCallInput) (*T, error) {
    data, err := c.doAPICallRaw(input)
    if err != nil {
        return nil, err
    }
    return decodeAPIResponse[T](data, input.Operation)
}

// ✅ CORRECT — Result[T] return, blank line after closing brace
func apiCallTo[T any](c *Client, input apiCallInput) apperror.Result[T] {
    data, err := c.apiCallToRaw(input)
    if err != nil {
        return apperror.FailWrap[T](
            err,
            "E4010",
            "API call failed: "+input.Operation.Label(),
        )
    }

    return decodeApiResponse[T](data, input.Operation)
}
```

### Mistake 5c: Magic Strings for HTTP Method and Operation

```go
// ❌ WRONG — inline string literals
callInput := apiCallInput{
    Method:    "POST",
    Operation: "snapshot cleanup",
}

// ✅ CORRECT — enum constants
callInput := apiCallInput{
    Method:    httpmethod.Post,
    Operation: snapshotoperationtype.Cleanup,
}
```

### Mistake 6: `interface{}` / `any` in Business Logic

```go
// ❌ WRONG — type erasure
func ProcessData(data interface{}) interface{} { ... }

// ✅ CORRECT — concrete types
func ProcessData(data PluginDetails) apperror.Result[PluginSummary] { ... }
```

### Mistake 7: snake_case in SQL / Struct Tags After Migration

```go
// ❌ WRONG — old snake_case
const query = `SELECT plugin_slug FROM transactions`
type Tx struct {
    PluginSlug string `db:"plugin_slug"`
}

// ✅ CORRECT — PascalCase
const query = `SELECT PluginSlug FROM Transactions`
type Tx struct {
    PluginSlug string `db:"PluginSlug"`
}
```

### Mistake 8: Compound Negation Without Named Boolean

```go
// ❌ WRONG — inline negated compound
if !config.BuildEnabled || config.BuildCommand == "" {
    return apperror.FailNew[BuildResult](
        apperror.ErrBuildNotConfigured,
        "build not configured",
    )
}

// ✅ CORRECT — extract negation to positive counterpart, then compose
isBuildDisabled := !config.BuildEnabled
isBuildCommandEmpty := config.BuildCommand == ""
isBuildMissing := isBuildDisabled || isBuildCommandEmpty

if isBuildMissing {
    return apperror.FailNew[BuildResult](
        apperror.ErrBuildNotConfigured,
        "build not configured",
    )
}
```

---

## Cross-References

- [No Raw Negations](../01-cross-language/12-no-negatives.md) — Positive guard functions (all languages)
- [Cross-Language Code Style](../01-cross-language/04-code-style.md) — Braces, nesting & spacing rules
- [Function Naming](../01-cross-language/10-function-naming.md) — No boolean flag parameters
- [Strict Typing](../01-cross-language/13-strict-typing.md) — Type declarations & docblock rules
- [DRY Principles](../01-cross-language/08-dry-principles.md)
- [Boolean Standards](02-boolean-standards.md) — Go-specific positive logic rules and exemptions
- [apperror Package Spec](../../04-error-resolution/10-apperror-package/01-apperror-reference.md) — Full StackTrace, AppError, Result types specification
- [Enum Specification](01-enum-specification/00-overview.md) — Byte-based enum pattern, required methods, folder structure
- [Master Coding Guidelines](../01-cross-language/15-master-coding-guidelines.md) — Consolidated cross-language reference
- [Issues & Fixes Log](../01-cross-language/01-issues-and-fixes-log.md) — Full historical fixes

---

*Golang standards specification v3.5.0 — 2026-02-25*
