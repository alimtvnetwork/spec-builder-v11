# Cross-Language Boolean Principles

> **Version:** 2.4.0  
> **Updated:** 2026-03-09  
> **Applies to:** PHP, TypeScript, Go, C#, and any delegated language

---

## Overview

Boolean variables, parameters, return values, and method names are the most frequently read tokens in any codebase. Poorly named booleans silently degrade readability, cause logic bugs, and increase cognitive load during code review. This spec defines **six non-negotiable principles** that every programming language in this project must follow.

---

## Principle 1: Always Use `is` or `has` Prefixes

Every boolean identifier — variable, property, parameter, or method — **must** start with `is` or `has`.

```php
// ── PHP ──────────────────────────────────────────────────────

// ❌ FORBIDDEN
$active = true;
$loaded = false;
$blocked = true;

// ✅ REQUIRED
$isActive = true;
$isLoaded = false;
$isBlocked = true;
$hasPermission = true;
```

```typescript
// ── TypeScript ───────────────────────────────────────────────

// ❌ FORBIDDEN
const loading = true;
const valid = false;
const overdue = checkOverdue();

// ✅ REQUIRED
const isLoading = true;
const isValid = false;
const hasOverdue = checkOverdue();
```

```go
// ── Go ───────────────────────────────────────────────────────

// ❌ FORBIDDEN
blocked := true
connected := false

// ✅ REQUIRED
isBlocked := true
isConnected := false
hasItems := len(items) > 0
```

### Method Names Follow the Same Rule

```php
// ❌ FORBIDDEN
$order->overdue();
$user->admin();

// ✅ REQUIRED
$order->hasOverdue();
$user->isAdmin();
```

This mirrors industry best practices. For example, .NET's `char` type exposes `IsLetter`, `IsDigit`, `IsUpper`, `IsLower`, `IsNumber`, `IsPunctuation`, `IsSeparator`, `IsSymbol`, `IsControl`, `IsLetterOrDigit` — all boolean methods with the `Is` prefix.

---

## Principle 2: Never Use Negative Words in Boolean Names

The words **`not`**, **`no`**, and **`non`** are **absolutely banned** from boolean variable names, function names, and method names. These words create cognitive overhead — the reader must mentally invert the meaning. Instead, always use a **positive semantic synonym** that describes what the state actually **is**.

Double negatives (`!isNot...`, `!isNotBlocked`) are the worst form and must never appear.

### Naming Strategy: Describe What It IS, Not What It ISN'T

| ❌ Forbidden Name | ✅ Required Name | Semantic Meaning |
|---|---|---|
| `isNotReady` | `isPending` | The order is waiting |
| `isNotInList` | `isAbsentFromList` | The item is absent |
| `isNoRecentErrors` | `isErrorListClear` | The error list is clean |
| `isNotDirectory` | `isDirAbsent` | The directory doesn't exist |
| `isNotRegularFile` | `isIrregularPath` | The path is irregular |
| `isNotPHP` | `isSkippableEntry` | The entry should be skipped |
| `isNotBlocked` | `isActive` | The entity is active |
| `isClassNotLoaded` | `isClassUnregistered` | The class is unregistered |
| `hasNoPermission` | `isUnauthorized` | The user lacks access |

```typescript
// ❌ FORBIDDEN — "not" in the variable name
const isNotReady = order.status !== 'ready';
if (isNotReady) {
    throw new Error('Order is not ready');
}

// ✅ REQUIRED — Positive semantic synonym
const isPending = order.status !== 'ready';
if (isPending) {
    throw new Error('Order is not ready');
}
```

```php
// ❌ FORBIDDEN — "No" in the variable name
$isNoRecentErrors = empty($errors) || !$hasUnseen;

// ✅ REQUIRED — Describes the positive state
$isErrorListClear = empty($errors) || !$hasUnseen;
```

### Rule: Name booleans for the **positive semantic state**, then negate only once if needed

```typescript
// ❌ AVOID — Raw negation at call site
if (!isBlocked) {
    // active
}

// ✅ BEST — Extract to a positive boolean
const isActive = !isBlocked;

if (isActive) {
    // best to use like this
}
```

---

## Principle 3: Replace Raw Negation With Named Guards

Never use raw `!` on function calls or existence checks at call sites. Instead, wrap every negative check in a **positively named utility function**.

```php
// ❌ FORBIDDEN — Raw negation on function call
if (!$order->isValid()) {
    return;
}

// ✅ REQUIRED — Semantic inverse method on the object
if ($order->isInvalid()) {
    return;
}
```

```typescript
// ❌ FORBIDDEN
if (!isDefined(value)) {
    return;
}

// ✅ REQUIRED — Use a positive guard
if (isUndefined(value)) {
    return;
}
```

```go
// ❌ FORBIDDEN
if !IsFileExists(path) {
    return apperror.New(
        "E4010", "file not found",
    )
}

// ✅ REQUIRED
if IsFileMissing(path) {
    return apperror.New(
        "E4010", "file not found",
    )
}
```

For the full guard function inventory, see [no-negatives.md](./12-no-negatives.md).

---

## Principle 4: Extract Complex Boolean Expressions

When a boolean expression contains **2+ operators** (`&&`, `||`, `!`), it **must** be extracted into a named boolean variable or a dedicated method. The `if` statement should read as a single intent.

```csharp
// ❌ BAD CODE — Inline complex condition
public void ProcessData(int value)
{
    if (value > 0 && value % 2 == 0 || value < -10)
    {
        // ...
    }
}

// ✅ GOOD CODE — Extracted to a named method
public void ProcessData(int value)
{
    if (IsValueValid(value))
    {
        // ...
    }
}

private bool IsValueValid(int value)
{
    return (value > 0 && value % 2 == 0 || value < -10);
}
```

```php
// ❌ FORBIDDEN
if ($request !== null && $request->hasParam('file') && $request->getParam('file') !== '') {
    $this->process($request);
}

// ✅ REQUIRED
$hasFileParam = $request !== null
    && $request->hasParam('file')
    && $request->getParam('file') !== '';

if ($hasFileParam) {
    $this->process($request);
}
```

```go
// ❌ FORBIDDEN
if err != nil && resp != nil && resp.StatusCode >= 400 {
    handleUpstreamError(resp)
}

// ✅ REQUIRED
isUpstreamError := err != nil && resp != nil && resp.StatusCode >= 400

if isUpstreamError {
    handleUpstreamError(resp)
}
```

See also: [code-style.md — Rule 3](./04-code-style.md#rule-3-extract-complex-conditions--no-inline-multi-part-checks)

---

## Principle 5: Boolean Parameters Must Be Explicit

Never use bare `true`/`false` at call sites. If a function accepts a boolean parameter, either:
1. Use separate, explicitly named methods
2. Use an enum or options object

```typescript
// ❌ FORBIDDEN — What does `true` mean here?
fetchData(userId, true);

// ✅ REQUIRED — Option A: Named methods
fetchDataWithCache(userId);
fetchDataWithoutCache(userId);

// ✅ REQUIRED — Option B: Options object
fetchData(userId, { isUseCache: true });
```

```php
// ❌ FORBIDDEN
$this->log($message, true);

// ✅ REQUIRED — Separate methods
$this->logWithTrace($message);
$this->log($message);
```

See also: [function-naming.md](./10-function-naming.md)

---

## Principle 6: Never Mix Positive and Negative Booleans in a Single Condition

Combining a positive boolean with a negated boolean in the same `if` condition (e.g., `isX && !y`, `IsReady && !overwrite`, `cacheEnabled && !forceRefresh`) is a **code smell**. It forces the reader to mentally switch polarity mid-expression, creating cognitive load and hiding intent.

**The fix:** Extract the combined condition into a single, positively named boolean that captures the **actual intent**.

```go
// ❌ FORBIDDEN — Mixed polarity: positive + negative
if s.isCacheEnabled && !isForceRefresh {
    return cachedResult
}

// ✅ REQUIRED — Extract negation to positive counterpart, then compose
isNormalRefresh := !isForceRefresh
isCacheHit := s.isCacheEnabled && isNormalRefresh

if isCacheHit {
    return cachedResult
}
```

```go
// ❌ FORBIDDEN — Mixed polarity: positive + negative
if isProjectExists && !isOverwrite {
    return fmt.Errorf("conflict")
}

// ✅ REQUIRED — Extract negation to positive counterpart, then compose
isReadOnly := !isOverwrite
isConflict := isProjectExists && isReadOnly

if isConflict {
    return fmt.Errorf("conflict")
}
```

```php
// ❌ FORBIDDEN — Mixed polarity
if ($isAuthenticated && !$isAuthorized) {
    throw new ForbiddenException();
}

// ✅ REQUIRED — Extract negation to positive counterpart, then compose
$isUnauthorized = !$isAuthorized;
$isAccessDenied = $isAuthenticated && $isUnauthorized;

if ($isAccessDenied) {
    throw new ForbiddenException();
}
```

```typescript
// ❌ FORBIDDEN — Mixed polarity
if (isLoggedIn && !hasPermission) {
    redirect('/unauthorized');
}

// ✅ REQUIRED — Single intent
const isUnauthorized = isLoggedIn && !hasPermission;

if (isUnauthorized) {
    redirect('/unauthorized');
}
```

### Why This Matters

| Pattern | Problem | Fix |
|---|---|---|
| `isX && !y` | Reader must switch polarity mid-expression | Extract to `isConflict` / `isUnauthorized` / `isDenied` |
| `isCacheEnabled && !forceRefresh` | Mixed polarity + missing `is` prefix on `forceRefresh` | Use `isCacheHit` |
| `isReady && !isOverwrite` | `!isOverwrite` lacks semantic meaning | Use `isFreshImport` or extract full condition |
| `hasData && !isProcessed` | Two separate concerns crammed together | Extract to `isPendingProcessing` |

### Rule Summary

1. **Never combine `isX` with `!isY`** in the same `if` condition
2. **Always extract** the combined condition into a named boolean with a positive semantic name
3. The named boolean should express the **intent** (e.g., `isConflict`, `isAccessDenied`, `isPending`, `isCacheHit`) — not just restate the logic

---

## Principle 7: No Inline Statements in Conditions

Inline variable assignment inside `if`/`while` conditions is **prohibited** across all languages. This pattern hides computation inside control flow, couples unrelated operations, and makes debugging harder.

**Exception (Go only):** The idiomatic comma-ok pattern (`if v, ok := m[k]; ok {`) and type assertions are exempt.

```go
// ❌ FORBIDDEN — inline os.Stat inside if
if _, err := os.Stat(dir); err == nil {
    // exists
}

// ✅ REQUIRED — separate computation
isProjectExists := pathutil.IsDir(dir)
if isProjectExists {
    // exists
}
```

```php
// ❌ FORBIDDEN — inline assignment in condition
if (($result = $db->query($sql)) && $result->hasRows()) {
    process($result);
}

// ✅ REQUIRED — separate assignment
$result = $db->query($sql);
$hasRows = $result !== null && $result->hasRows();

if ($hasRows) {
    process($result);
}
```

```typescript
// ❌ FORBIDDEN — assignment expression in condition
let match;
if ((match = regex.exec(input)) !== null) {
    process(match);
}

// ✅ REQUIRED — separate assignment
const match = regex.exec(input);
const isMatchFound = match !== null;

if (isMatchFound) {
    process(match);
}
```

See [Go Boolean Standards P7](../03-golang/02-boolean-standards.md#25--no-inline-statements-in-if-conditions-rule-p7) for Go-specific details.

---

## Principle 8: No Raw Filesystem / System Calls in Application Code

Application code **must not** call raw filesystem functions (`os.Stat`, `file_exists`, `fs.existsSync`) directly. Instead, use wrapper utilities that:

1. Return the framework's structured error type (not raw errors)
2. Provide positive-named boolean helpers (`IsDir`, `IsDirMissing`, `isFileMissing`)
3. Handle edge cases consistently

```go
// ❌ FORBIDDEN — raw os.Stat
if _, err := os.Stat(projectDir); err == nil {
    // exists
}

// ✅ REQUIRED — pathutil wrapper
isProjectExists := pathutil.IsDir(projectDir)
```

```php
// ❌ FORBIDDEN — raw file_exists
if (file_exists($path)) {
    // exists
}

// ✅ REQUIRED — PathHelper wrapper
if (PathHelper::isFilePresent($path)) {
    // exists
}
```

```typescript
// ❌ FORBIDDEN — raw fs.existsSync
if (fs.existsSync(path)) {
    // exists
}

// ✅ REQUIRED — pathUtil wrapper
const isFilePresent = pathUtil.isFile(path);
if (isFilePresent) {
    // exists
}
```

### Comprehensive Example — All Rules Combined (P6 + P7 + P8)

This example demonstrates how P6, P7, and P8 violations compound, and the correct fix:

```go
// ❌ FORBIDDEN — 4 violations in 3 lines:
//   1. P8: raw os.Stat (must use pathutil)
//   2. P7: inline statement in if (semicolon)
//   3. P6: mixed polarity (err == nil && !isOverwrite)
//   4. Raw fmt.Errorf instead of apperror
isProjectConflict := err == nil && !isOverwrite
if _, err := os.Stat(projectDir); isProjectConflict {
    return fmt.Errorf("project exists, use isOverwrite=true to replace")
}

// ✅ REQUIRED — clean, readable, all rules applied:
//   1. P8: pathutil.IsDir() wraps os.Stat
//   2. P7: no inline statement; all variables computed before if
//   3. P6: mixed polarity extracted to single-intent boolean
//   4. apperror.FailNew returns structured *apperror.AppError
isProjectExists := pathutil.IsDir(projectDir)
isReadOnly := !isOverwrite
isProjectConflict := isProjectExists && isReadOnly

if isProjectConflict {
    return apperror.FailNew[ProjectResult](
        errors.ErrFsConflict,
        "project already exists; use isOverwrite=true to replace",
    )
}
```

---

## Quick Reference

| ❌ Forbidden | ✅ Required | Principle |
|-------------|------------|-----------|
| `$active` | `$isActive` | P1: `is`/`has` prefix |
| `$loaded` | `$isLoaded` | P1: `is`/`has` prefix |
| `!isNotBlocked` | `isBlocked` | P2: No negative words |
| `isNotBlocked` | `isActive` (synonym) | P2: No negative words |
| `isNotReady` | `isPending` (synonym) | P2: No negative words |
| `!$obj->isValid()` | `$obj->isInvalid()` | P3: Named guards |
| `if (a && b \|\| c)` | `if (isValid(x))` | P4: Extract expressions |
| `fn(true)` | `fnWithOption()` | P5: Explicit params |
| `isX && !isY` | `isConflict` (extracted) | P6: No mixed polarity |
| `if x := fn(); x > 0` | Separate assignment | P7: No inline statements |
| `os.Stat(path)` | `pathutil.IsDir(path)` | P8: No raw filesystem |

---

## Common Mistakes — Boolean Logic

### Mistake 1: Missing `is`/`has` Prefix (P1)

```php
// ❌ WRONG
$active = true;        // What is active? No semantic meaning.
$loaded = false;       // Ambiguous.

// ✅ CORRECT
$isActive = true;
$isLoaded = false;
```

### Mistake 2: Negative Word in Name (P2)

```go
// ❌ WRONG — "not" in the name
isNotReady := order.Status != "ready"
hasNoPermission := !user.HasPermission("admin")

// ✅ CORRECT — positive semantic synonym
isPending := order.Status != "ready"
isUnauthorized := !user.HasPermission("admin")
```

### Mistake 3: Raw `!` on Function Call (P3)

```php
// ❌ WRONG
if (!$order->isValid()) { return; }
if (!file_exists($path)) { return; }

// ✅ CORRECT
if ($order->isInvalid()) { return; }
if (PathHelper::isFileMissing($path)) { return; }
```

```go
// ❌ WRONG
if !v.IsValid() { return variantLabels[Invalid] }
if !pathutil.IsDir(gitDir) { return err }

// ✅ CORRECT
if v.IsInvalid() { return variantLabels[Invalid] }
if pathutil.IsDirMissing(gitDir) { return err }
```

### Mistake 4: Mixed Polarity in Condition (P6)

```typescript
// ❌ WRONG — positive + negative in same if
if (isLoggedIn && !hasPermission) {
    redirect('/unauthorized');
}

// ✅ CORRECT — extract to single-intent name
const isUnauthorized = isLoggedIn && !hasPermission;
if (isUnauthorized) {
    redirect('/unauthorized');
}
```

### Mistake 5: Inline Statement in `if` (P7)

```go
// ❌ WRONG — inline os.Stat hides computation
if _, err := os.Stat(dir); err == nil {
    fmt.Println("exists")
}

// ✅ CORRECT — separate computation from condition
isProjectExists := pathutil.IsDir(dir)
if isProjectExists {
    fmt.Println("exists")
}
```

### Mistake 6: Raw Filesystem Call (P8)

```go
// ❌ WRONG — raw os.MkdirAll with raw error
if err := os.MkdirAll(dir, 0755); err != nil {
    return fmt.Errorf("mkdir failed: %w", err)
}

// ✅ CORRECT — pathutil wrapper with apperror
if err := pathutil.EnsureDir(dir); err != nil {
    return apperror.Fail[ProjectResult](err)
}
```

### Mistake 7: All Rules Violated Together (P6 + P7 + P8)

```go
// ❌ WRONG — P6 (mixed polarity) + P7 (inline stmt) + P8 (raw os.Stat) + raw error
isProjectConflict := err == nil && !isOverwrite
if _, err := os.Stat(projectDir); isProjectConflict {
    return fmt.Errorf("project exists, use isOverwrite=true to replace")
}

// ✅ CORRECT — all rules applied
isProjectExists := pathutil.IsDir(projectDir)
isReadOnly := !isOverwrite
isProjectConflict := isProjectExists && isReadOnly

if isProjectConflict {
    return apperror.FailNew[ProjectResult](
        errors.ErrFsConflict,
        "project already exists; use isOverwrite=true to replace",
    )
}
```

### Go-Specific Exemptions

These patterns are **exempt** from the no-negation rule in Go:
- `if !ok` — idiomatic comma-ok pattern
- `if !requireService(w, svc, "name")` — handler guard returns
- `if err != nil` — idiomatic error check
- `if !strings.HasPrefix(...)` — stdlib calls (extract if repeated 3+ times)
- `if v, ok := m[k]; ok {` — inline comma-ok (exempt from P7)

---

## Static Factory Constructor Exemption

Methods like `DbResult::empty()`, `DbResultSet::empty()`, and `ResultSlice::empty()` are **static factory constructors** — they create a new empty instance, not query boolean state. These are **exempt** from the `is`/`has` prefix requirement (P1).

Boolean query methods on the **same classes** — such as `isEmpty()`, `isDefined()`, `hasError()`, `isSafe()`, `hasItems()` — **do** follow P1 correctly and must retain their prefixes.

| Method | Type | P1 Applies? |
|--------|------|-------------|
| `DbResult::empty()` | Static factory constructor | ❌ Exempt |
| `DbResultSet::empty()` | Static factory constructor | ❌ Exempt |
| `$result->isEmpty()` | Boolean query | ✅ Yes |
| `$result->hasError()` | Boolean query | ✅ Yes |
| `$result->isDefined()` | Boolean query | ✅ Yes |
| `result.IsSafe()` | Boolean query | ✅ Yes |

---

## Result Wrapper — Full Public API Reference

> **Cross-language invariant:** The `.AppError()` (Go) / `.error()` (PHP) method on every result wrapper returns the **framework's structured error type**, never a raw string or generic exception. In Go this is `*apperror.AppError` (carrying stack trace, error code, and contextual values) — named `.AppError()` (not `.Error()`) to avoid confusion with Go's native `error` interface. In PHP this is `Throwable` (typically a framework exception with trace). This guarantees that propagated errors always preserve diagnostic context — callers can safely pass `.AppError()` output to `Fail()`, `FailSlice()`, `FailMap()`, or log it with full traceability.

### Go — `apperror.Result[T]`

| Method | Returns | Description |
|--------|---------|-------------|
| `Ok[T](value)` | `Result[T]` | Static: successful result with value |
| `Fail[T](err)` | `Result[T]` | Static: failed result from `*AppError` |
| `FailWrap[T](cause, code, msg)` | `Result[T]` | Static: failed result wrapping raw error |
| `FailNew[T](code, msg)` | `Result[T]` | Static: failed result from new error |
| `HasError()` | `bool` | True when the operation failed |
| `IsSafe()` | `bool` | True when a value exists and no error |
| `IsDefined()` | `bool` | True when a value was set (regardless of error) |
| `IsEmpty()` | `bool` | True when no value was set (absent, not an error) |
| `Value()` | `T` | Returns value; **panics** if `HasError()` is true |
| `ValueOr(fallback)` | `T` | Returns value if defined, otherwise fallback |
| `AppError()` | `*AppError` | Returns underlying error, or nil. Named `AppError()` to avoid confusion with Go's `error` interface |
| `Unwrap()` | `(T, error)` | Bridges to standard Go `(T, error)` pattern |

### Go — `apperror.ResultSlice[T]`

| Method | Returns | Description |
|--------|---------|-------------|
| `OkSlice[T](items)` | `ResultSlice[T]` | Static: successful slice result |
| `FailSlice[T](err)` | `ResultSlice[T]` | Static: failed slice from `*AppError` |
| `FailSliceWrap[T](cause, code, msg)` | `ResultSlice[T]` | Static: failed slice wrapping raw error |
| `FailSliceNew[T](code, msg)` | `ResultSlice[T]` | Static: failed slice from new error |
| `HasError()` | `bool` | True when the operation failed |
| `IsSafe()` | `bool` | True when no error (items may be empty) |
| `HasItems()` | `bool` | True when slice has ≥1 item |
| `IsEmpty()` | `bool` | True when slice has zero items |
| `Count()` | `int` | Number of items |
| `Items()` | `[]T` | Returns underlying slice (nil if error) |
| `First()` | `Result[T]` | First item as `Result[T]`, or empty |
| `Last()` | `Result[T]` | Last item as `Result[T]`, or empty |
| `GetAt(index)` | `Result[T]` | Item at index as `Result[T]`, or empty |
| `Append(items...)` | — | Adds items; no-op if in error state |
| `AppError()` | `*AppError` | Returns underlying error, or nil |

### Go — `apperror.ResultMap[K, V]`

| Method | Returns | Description |
|--------|---------|-------------|
| `OkMap[K,V](items)` | `ResultMap[K,V]` | Static: successful map result |
| `FailMap[K,V](err)` | `ResultMap[K,V]` | Static: failed map from `*AppError` |
| `FailMapWrap[K,V](cause, code, msg)` | `ResultMap[K,V]` | Static: failed map wrapping raw error |
| `FailMapNew[K,V](code, msg)` | `ResultMap[K,V]` | Static: failed map from new error |
| `HasError()` | `bool` | True when the operation failed |
| `IsSafe()` | `bool` | True when no error (map may be empty) |
| `HasItems()` | `bool` | True when map has ≥1 entry |
| `IsEmpty()` | `bool` | True when map has zero entries |
| `Count()` | `int` | Number of entries |
| `Items()` | `map[K]V` | Returns underlying map (nil if error) |
| `Get(key)` | `Result[V]` | Value for key as `Result[V]`, or empty |
| `Has(key)` | `bool` | True if key exists |
| `Set(key, value)` | — | Adds/updates entry; no-op if error |
| `Remove(key)` | — | Deletes key; no-op if error |
| `Keys()` | `[]K` | All keys as slice |
| `Values()` | `[]V` | All values as slice |
| `AppError()` | `*AppError` | Returns underlying error, or nil |

### PHP — `DbResult<T>`

| Method | Returns | Description |
|--------|---------|-------------|
| `DbResult::of($value)` | `DbResult<T>` | Static: successful result with value |
| `DbResult::empty()` | `DbResult<T>` | Static: empty result (no row found) |
| `DbResult::error($e)` | `DbResult<T>` | Static: error result with stack trace |
| `isEmpty()` | `bool` | True when no row was found (not an error) |
| `isDefined()` | `bool` | True when a row was successfully mapped |
| `hasError()` | `bool` | True when the query failed |
| `isSafe()` | `bool` | True when value exists and no error |
| `value()` | `T\|null` | Returns mapped value (null if not defined) |
| `error()` | `Throwable\|null` | Returns underlying error, or null |
| `stackTrace()` | `string` | Captured stack trace if error occurred |

### PHP — `DbResultSet<T>`

| Method | Returns | Description |
|--------|---------|-------------|
| `DbResultSet::of($items)` | `DbResultSet<T>` | Static: successful result set |
| `DbResultSet::error($e)` | `DbResultSet<T>` | Static: error result with stack trace |
| `isEmpty()` | `bool` | True when zero items |
| `hasAny()` | `bool` | True when ≥1 item |
| `count()` | `int` | Number of items |
| `hasError()` | `bool` | True when the query failed |
| `isSafe()` | `bool` | True when no error (items may be empty) |
| `items()` | `array<T>` | Returns item array |
| `first()` | `DbResult<T>` | First item as `DbResult<T>`, or error/empty |
| `error()` | `Throwable\|null` | Returns underlying error, or null |
| `stackTrace()` | `string` | Captured stack trace if error occurred |

### PHP — `DbExecResult`

| Method | Returns | Description |
|--------|---------|-------------|
| `DbExecResult::of($rows, $id)` | `DbExecResult` | Static: successful exec result |
| `DbExecResult::error($e)` | `DbExecResult` | Static: error result with stack trace |
| `hasError()` | `bool` | True when the exec failed |
| `isSafe()` | `bool` | True when no error |
| `isEmpty()` | `bool` | True when zero rows affected |
| `affectedRows()` | `int` | Number of affected rows |
| `lastInsertId()` | `int` | Auto-increment ID from INSERT |
| `error()` | `Throwable\|null` | Returns underlying error, or null |
| `stackTrace()` | `string` | Captured stack trace if error occurred |

---

## Cross-References

- [No Raw Negations](./12-no-negatives.md) — Full guard function inventory
- [Code Style — Rule 3](./04-code-style.md) — Complex condition extraction
- [Function Naming](./10-function-naming.md) — No boolean flag parameters
- [PHP Boolean Guard Inventory](../04-php/07-php-standards-reference.md) — PHP-specific helpers
- [Go Boolean Standards](../03-golang/02-boolean-standards.md) — Go-specific rules and exemptions (P7, P8)
- [Master Coding Guidelines](./15-master-coding-guidelines.md) — Consolidated reference
- [Issues & Fixes Log](./01-issues-and-fixes-log.md) — Historical fixes
- [apperror Package — Result Guard Rule](../../04-error-resolution/10-apperror-package/01-apperror-reference.md#12-result-guard-rule--mandatory-error-check-before-value-access)

---

*Boolean principles specification v2.4.0 — 2026-02-26*
