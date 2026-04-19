# Memory: standards/strong-typing-mandate

**Updated:** 2026-02-08  
**Version:** 1.0.0  
**Scope:** All Languages (Go, TypeScript, PHP)  
**Priority:** Critical

---

## Overview

The project **strictly prohibits** weakly-typed or type-erased constructs across all languages. All data structures, function parameters, return values, and struct fields must use concrete types, explicit interfaces, or generics. This is a non-negotiable architectural constraint.

---

## Go

### Prohibited

| Pattern | Replacement |
|---------|-------------|
| `interface{}` | Concrete struct or `[T any]` generic constraint |
| `map[string]interface{}` | Named struct with typed fields |
| `map[string]any` | Named struct with typed fields |
| `any` as value type | Concrete type or generic `[T any]` |
| `*string` in struct fields | `string` with `json:",omitempty"` |
| `*int`, `*bool`, `*float64` | Zero-value type with `omitempty` or `gorm:"default:null"` |
| `*time.Time` in struct fields | `time.Time` with `gorm:"default:null"` |

### Allowed Exceptions

| Pattern | Reason |
|---------|--------|
| `[T any]` generic constraint | Type parameter boundary (compile-time safe) |
| `...any` in slog Logger methods | Go standard library `log/slog` interface requirement |
| `db.Raw()` for FTS5/CTE/vector search | No ORM equivalent available |

### Examples

```go
// ❌ WRONG
func ProcessData(data map[string]any) any { ... }
func LoadConfig(overrides map[string]interface{}) (*Config, error) { ... }

// ✅ CORRECT
type ProcessInput struct {
    Name    string
    Value   int
    Options ProcessOptions
}
func ProcessData(input ProcessInput) ProcessResult { ... }

// ✅ CORRECT - Generic constraint (allowed)
type APIResponse[T any] struct {
    Success bool
    Data    T
    Error   string `json:",omitempty"`
}
```

---

## TypeScript

### Prohibited

| Pattern | Replacement |
|---------|-------------|
| `any` as type annotation | Concrete type or generic `<T>` |
| `as any` type assertion | Proper type narrowing or generic cast |
| `unknown` as stored value | Concrete type with runtime validation |
| `Record<string, any>` | Named interface with typed fields |

### Allowed Exceptions

| Pattern | Reason |
|---------|--------|
| `unknown` in catch blocks | `catch (error: unknown)` — TypeScript standard for error handling |
| `unknown` in type guard input | `function isX(value: unknown): value is X` — narrowing boundary |
| `unknown` in generic logger params | `logger.error(msg: string, error?: unknown)` — must validate before use |

### Examples

```typescript
// ❌ WRONG
const data: any = await fetch('/api');
const value = someSelect.onValueChange((v) => setState(v as any));
interface FlexibleData {
  metadata: Record<string, unknown>;
}

// ✅ CORRECT
interface ApiResponse {
  Id: string;
  Status: string;
  Data: UserProfile;
}
const data: ApiResponse = await fetchTyped<ApiResponse>('/api');

// ✅ CORRECT - Type guard boundary (allowed)
function parseResponse(data: unknown): ApiResponse {
  if (!isApiResponse(data)) throw new Error('Invalid response');
  return data;
}

// ✅ CORRECT - Generic component
interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
}
```

---

## PHP

### Prohibited

| Pattern | Replacement |
|---------|-------------|
| `mixed` as parameter/return type | Concrete type or union type |
| Untyped arrays for structured data | Typed DTOs / Value Objects |
| `@param mixed` | Specific type in PHPDoc |

### Allowed Exceptions

| Pattern | Reason |
|---------|--------|
| WordPress hook callbacks | WP core signatures require `mixed` in some hooks |
| `json_decode()` return | Must validate and cast immediately after decode |

### Examples

```php
// ❌ WRONG
function processData(mixed $data): mixed { ... }
function getConfig(): array { ... } // untyped array

// ✅ CORRECT
function processData(UserInput $data): ProcessResult { ... }

/** @return array{Name: string, Value: int, Enabled: bool} */
function getConfig(): array { ... }

// ✅ CORRECT - Value Object
class PublishConfig {
    public function __construct(
        public readonly string $Title,
        public readonly string $ContentType,
        public readonly int $WordCount,
    ) {}
}
```

---

## Enforcement

1. **Spec Review:** All new specification code samples must use concrete types
2. **Implementation:** Code generation must reject `interface{}`/`any`/`unknown`/`mixed` in output
3. **Audit:** Grep-based verification before marking any silo as compliant
4. **AI Bridge Pattern Learning:** Detects and flags untyped patterns as violations

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Go Coding Standards | `.lovable/memories/style/go-coding-standards.md` |
| PHP Coding Standards | `.lovable/memories/style/php-coding-standards.md` |
| TypeScript Debugging | `spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md` |
| Findings Dashboard | `.lovable/audits/00-findings-dashboard.md` |

---

*Strong typing everywhere. Generics over type erasure. No exceptions beyond documented boundaries.*
