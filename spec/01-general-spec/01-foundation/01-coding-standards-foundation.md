# 01. Coding Standards


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Applies To:** All languages (PHP, Go, TypeScript)  
> **Priority:** CRITICAL - Must be followed for all code  
> **Canonical Authority:** [Master Coding Guidelines](../../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md)

---

## 1. Naming Conventions

### 1.1 General Rules

| Element | Convention | Examples |
|---------|------------|----------|
| Variables | `camelCase` | `userId`, `examStatus`, `isActive` |
| Functions/Methods | `camelCase` | `getUserById()`, `calculateDeadline()` |
| Classes | `PascalCase` | `UserService`, `ExamRepository` |
| Interfaces | `PascalCase` (no prefix) | `UserService`, `Repository` |
| Constants (non-error) | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| Constants (error codes) | `PascalCase` with `Err` prefix | `ErrInvalidQuery`, `ErrHttpTimeout` |
| Enums | `PascalCase` | `ParticipantStatus`, `LogLevel` |
| Enum Values | `PascalCase` | `Active`, `SoftDeadlineReached` |
| Database Columns | `PascalCase` | `CreatedAt`, `UserId`, `ExamId` |
| Database Tables | `PascalCase` (singular) | `User`, `ExamParticipant` |
| ORM Properties | `camelCase` | `createdAt`, `userId`, `examId` |
| File Names | `PascalCase` for single-type files | `UserService.php`, `UserService.ts`, `SnapshotManager.go` |

### 1.2 Boolean Naming

> ⚠️ **CRITICAL:** All booleans MUST be prefixed with `is`, `has`, `can`, `should`, or `was`.

| ❌ INCORRECT | ✅ CORRECT |
|--------------|------------|
| `active` | `isActive` |
| `deleted` | `isDeleted` |
| `permissions` | `hasPermissions` |
| `editable` | `canEdit` |
| `notify` | `shouldNotify` |
| `processed` | `wasProcessed` |

### 1.3 Function Naming

| Action | Prefix | Example |
|--------|--------|---------|
| Retrieve single | `get` | `getUser()`, `getExamById()` |
| Retrieve multiple | `list`, `getAll` | `listUsers()`, `getAllExams()` |
| Check boolean | `is`, `has`, `can` | `isValid()`, `hasAccess()`, `canEdit()` |
| Create | `create` | `createUser()`, `createExam()` |
| Update | `update` | `updateUser()`, `updateStatus()` |
| Delete | `delete`, `remove` | `deleteUser()`, `removeParticipant()` |
| Validate | `validate` | `validateEmail()`, `validateInput()` |
| Transform | `to`, `from`, `parse` | `toJson()`, `fromArray()`, `parseDate()` |

### 1.4 Abbreviation Standard

> ⚠️ **MANDATORY:** Treat abbreviations as regular words — capitalize only the first letter.

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `ID` | `Id` |
| `URL` | `Url` |
| `JSON` | `Json` |
| `API` | `Api` |
| `HTTP` | `Http` |
| `HTML` | `Html` |
| `DB` | `Db` |
| `SQL` | `Sql` |

> **Go Standard Library Exemptions:** `MarshalJSON()`, `UnmarshalJSON()`, and framework struct fields (e.g., `r.URL.Path`) retain their original spelling. All custom identifiers follow the table above.

### 1.5 Blank Line After Closing Brace

> ⚠️ **MANDATORY:** A blank line is required after every closing brace `}` before the next statement — including function calls, assignments, `return`, and control flow.

```go
// ❌ FORBIDDEN — no blank line after }
if err != nil {
    return err
}
s.wsHub.BroadcastPublishLog(logEntry)

// ✅ REQUIRED — blank line after }
if err != nil {
    return err
}

s.wsHub.BroadcastPublishLog(logEntry)
```

**Exceptions:** None. This applies universally after any `}` that is followed by another statement within the same function.

---

## 2. Function Size Limits

### 2.1 The 15-Line Rule

> ⚠️ **MANDATORY:** No function may exceed 15 lines of logic (excluding blank lines, comments, and closing braces).

**Rationale:**
- Forces single responsibility
- Improves testability
- Enhances readability
- Reduces cognitive load

### 2.2 Examples

#### ❌ INCORRECT - Too Long

```php
// PHP - 25+ lines, multiple responsibilities
function processExamSubmission($examId, $userId, $answers) {
    $exam = $this->examRepo->find($examId);
    if ($exam === null) {
        throw new NotFoundException("Exam not found");
    }
    
    $participant = $this->participantRepo->findByExamAndUser($examId, $userId);
    if ($participant === null) {
        throw new NotFoundException("Participant not found");
    }
    
    if ($participant->status !== 'active') {
        throw new ValidationException("Participant is not active");
    }
    
    $score = 0;
    foreach ($answers as $answer) {
        $question = $this->questionRepo->find($answer['questionId']);
        if ($question->correctAnswer === $answer['value']) {
            $score++;
        }
    }
    
    $percentage = ($score / count($answers)) * 100;
    
    $participant->score = $percentage;
    $participant->status = 'completed';
    $participant->completedAt = new DateTime();
    
    $this->participantRepo->save($participant);
    $this->notificationService->sendCompletionEmail($participant);
    
    return $participant;
}
```

#### ✅ CORRECT - Split Into Focused Functions

```php
// PHP - Each function under 15 lines
function processExamSubmission(int $examId, int $userId, array $answers): Participant {
    $exam = $this->getExamOrFail($examId);
    $participant = $this->getActiveParticipantOrFail($examId, $userId);
    
    $score = $this->calculateScore($answers);
    
    return $this->completeParticipation($participant, $score);
}

private function getExamOrFail(int $examId): Exam {
    $exam = $this->examRepo->find($examId);
    return $exam ?? throw new NotFoundException("Exam not found");
}

private function getActiveParticipantOrFail(int $examId, int $userId): Participant {
    $participant = $this->participantRepo->findByExamAndUser($examId, $userId);
    
    if (isNull($participant)) {
        throw new NotFoundException("Participant not found");
    }
    
    if (hasMismatch($participant->status, ParticipantStatus::Active->value)) {
        throw new ValidationException("Participant is not active");
    }
    
    return $participant;
}

private function calculateScore(array $answers): float {
    $correct = 0;
    
    foreach ($answers as $answer) {
        $question = $this->questionRepo->find($answer['questionId']);
        $correct += $this->isCorrectAnswer($question, $answer) ? 1 : 0;
    }
    
    return ($correct / count($answers)) * 100;
}

private function completeParticipation(Participant $participant, float $score): Participant {
    $participant->score = $score;
    $participant->status = 'completed';
    $participant->completedAt = new DateTime();
    
    $this->participantRepo->save($participant);
    $this->notificationService->sendCompletionEmail($participant);
    
    return $participant;
}
```

---

## 3. Positive Boolean Logic (If-Avoidance)

### 3.1 The Problem With Negations

Negation operators (`!`, `not`) are a leading source of logic bugs:
- Double negatives confuse readers
- Easy to miss the `!` during code review
- Mental overhead to parse "not not valid"

### 3.2 Boolean Helper Functions

> ⚠️ **MANDATORY:** Never use `!` operator. Use positive helper functions instead.

#### PHP Implementation

```php
class BooleanHelpers {
    public static function isNull(mixed $value): bool {
        return $value === null;
    }
    
    public static function isDefined(mixed $value): bool {
        return $value !== null;
    }
    
    public static function isEmpty(mixed $value): bool {
        return empty($value);
    }
    
    public static function hasContent(mixed $value): bool {
        return !empty($value);
    }
    
    public static function isTrue(mixed $value): bool {
        return $value === true;
    }
    
    public static function isFalse(mixed $value): bool {
        return $value === false;
    }
    
    public static function isEqual(mixed $a, mixed $b): bool {
        return $a === $b;
    }
    
    public static function hasMismatch(mixed $a, mixed $b): bool {
        return $a !== $b;
    }
    
    public static function isZero(int|float $value): bool {
        return $value === 0 || $value === 0.0;
    }
    
    public static function isPositive(int|float $value): bool {
        return $value > 0;
    }
    
    public static function isNegative(int|float $value): bool {
        return $value < 0;
    }
    
    public static function hasKey(array $array, string|int $key): bool {
        return array_key_exists($key, $array);
    }
    
    public static function isMissingKey(array $array, string|int $key): bool {
        return !array_key_exists($key, $array);
    }
    
    public static function isInArray(mixed $needle, array $haystack): bool {
        return in_array($needle, $haystack, true);
    }
    
    public static function excludes(mixed $needle, array $haystack): bool {
        return !in_array($needle, $haystack, true);
    }
    
    // Function existence checks (PHP-specific)
    public static function isFunctionExists(string $name): bool {
        return function_exists($name);
    }
    
    public static function isClassExists(string $name): bool {
        return class_exists($name);
    }
}
```

#### TypeScript Implementation

```typescript
export const BooleanHelpers = {
  isNull: (value: unknown): value is null => value === null,
  isDefined: <T>(value: T | null): value is T => value !== null,
  
  isUndefined: (value: unknown): value is undefined => value === undefined,
  isPresent: <T>(value: T | undefined): value is T => value !== undefined,
  
  isNullish: (value: unknown): value is null | undefined => value == null,
  hasValue: <T>(value: T | null | undefined): value is T => value != null,
  
  isEmpty: (value: string | unknown[]): boolean => value.length === 0,
  hasContent: (value: string | unknown[]): boolean => value.length > 0,
  
  isTrue: (value: unknown): value is true => value === true,
  isFalse: (value: unknown): value is false => value === false,
  
  isEqual: <T>(a: T, b: T): boolean => a === b,
  hasMismatch: <T>(a: T, b: T): boolean => a !== b,
  
  isZero: (value: number): boolean => value === 0,
  isPositive: (value: number): boolean => value > 0,
  isNegative: (value: number): boolean => value < 0,
  
  hasKey: <T extends object>(obj: T, key: PropertyKey): boolean => key in obj,
  isMissingKey: <T extends object>(obj: T, key: PropertyKey): boolean => !(key in obj),
  
  isInArray: <T>(needle: T, haystack: T[]): boolean => haystack.includes(needle),
  excludes: <T>(needle: T, haystack: T[]): boolean => !haystack.includes(needle),
};
```

#### Python Implementation

```python
from typing import Any, TypeVar, Optional

T = TypeVar('T')

class BooleanHelpers:
    @staticmethod
    def is_none(value: Any) -> bool:
        return value is None
    
    @staticmethod
    def is_defined(value: Any) -> bool:
        return value is not None
    
    @staticmethod
    def is_empty(value: Any) -> bool:
        return len(value) == 0 if hasattr(value, '__len__') else not value
    
    @staticmethod
    def has_content(value: Any) -> bool:
        return not BooleanHelpers.is_empty(value)
    
    @staticmethod
    def is_true(value: Any) -> bool:
        return value is True
    
    @staticmethod
    def is_false(value: Any) -> bool:
        return value is False
    
    @staticmethod
    def is_equal(a: Any, b: Any) -> bool:
        return a == b
    
    @staticmethod
    def has_mismatch(a: Any, b: Any) -> bool:
        return a != b
    
    @staticmethod
    def is_zero(value: int | float) -> bool:
        return value == 0
    
    @staticmethod
    def is_positive(value: int | float) -> bool:
        return value > 0
    
    @staticmethod
    def is_negative(value: int | float) -> bool:
        return value < 0
    
    @staticmethod
    def has_key(dictionary: dict, key: Any) -> bool:
        return key in dictionary
    
    @staticmethod
    def is_missing_key(dictionary: dict, key: Any) -> bool:
        return key not in dictionary
    
    @staticmethod
    def is_in_list(needle: T, haystack: list[T]) -> bool:
        return needle in haystack
    
    @staticmethod
    def excludes(needle: T, haystack: list[T]) -> bool:
        return needle not in haystack
```

### 3.3 Usage Comparison

#### ❌ INCORRECT - Using Negations

```php
// PHP
if (!$user) { ... }
if (!is_null($value)) { ... }
if (!in_array($item, $list)) { ... }
if (!$participant->isActive) { ... }
```

```typescript
// TypeScript
if (!user) { ... }
if (value !== null) { ... }
if (!list.includes(item)) { ... }
if (!participant.isActive) { ... }
```

```python
# Python
if not user: ...
if value is not None: ...
if item not in list: ...
if not participant.is_active: ...
```

#### ✅ CORRECT - Using Positive Helpers

```php
// PHP
if (isNull($user)) { ... }
if (isDefined($value)) { ... }
if (excludes($item, $list)) { ... }
if (isFalse($participant->isActive)) { ... }
```

```typescript
// TypeScript
if (isNull(user)) { ... }
if (isDefined(value)) { ... }
if (excludes(item, list)) { ... }
if (isFalse(participant.isActive)) { ... }
```

```python
# Python
if is_none(user): ...
if is_defined(value): ...
if excludes(item, items): ...
if is_false(participant.is_active): ...
```

---

## 4. Early Returns

### 4.1 The Pattern

Always check failure conditions first and return/throw immediately. Avoid deep nesting.

### 4.2 Examples

#### ❌ INCORRECT - Deep Nesting

```php
function processUser($userId) {
    $user = $this->userRepo->find($userId);
    if ($user !== null) {
        if ($user->isActive) {
            if ($user->hasPermission('edit')) {
                // Actual logic buried 3 levels deep
                return $this->doSomething($user);
            } else {
                throw new ForbiddenException("No permission");
            }
        } else {
            throw new ValidationException("User inactive");
        }
    } else {
        throw new NotFoundException("User not found");
    }
}
```

#### ✅ CORRECT - Early Returns

```php
function processUser(int $userId): Result {
    $user = $this->userRepo->find($userId);
    
    if (isNull($user)) {
        throw new NotFoundException("User not found");
    }
    
    if (isFalse($user->isActive)) {
        throw new ValidationException("User inactive");
    }
    
    if (isFalse($user->hasPermission('edit'))) {
        throw new ForbiddenException("No permission");
    }
    
    // Happy path at the end, no nesting
    return $this->doSomething($user);
}
```

---

## 5. Single Responsibility

### 5.1 Functions

Each function should do ONE thing. If you can't describe what a function does without using "and", split it.

| ❌ INCORRECT | ✅ CORRECT |
|--------------|------------|
| `validateAndSaveUser()` | `validateUser()` + `saveUser()` |
| `fetchAndTransformData()` | `fetchData()` + `transformData()` |
| `parseAndLogError()` | `parseError()` + `logError()` |

### 5.2 Classes

Each class should have one reason to change. Follow the Service/Repository pattern:

| Layer | Responsibility |
|-------|---------------|
| Controller | HTTP request/response handling |
| Service | Business logic orchestration |
| Repository | Data access abstraction |
| Model/Entity | Data structure definition |
| Helper | Stateless utility functions |

---

## 6. Comments

### 6.1 When to Comment

| Situation | Action |
|-----------|--------|
| Complex algorithm | Add explanation comment |
| Non-obvious business rule | Document the "why" |
| Workaround for bug | Link to issue tracker |
| TODO items | Use `// TODO:` format |
| Public API | Add doc blocks |

### 6.2 When NOT to Comment

| Situation | Action |
|-----------|--------|
| What the code does | Let code speak for itself |
| Obvious operations | No comment needed |
| Outdated information | Delete the comment |

### 6.3 Comment Format

```php
/**
 * Calculates the effective deadline for a participant.
 * 
 * Priority chain: Admin Override > Extensions > Exam Default
 * 
 * @param Participant $participant The participant entity
 * @return DateTime The calculated deadline
 * @throws InvalidStateException If participant has no exam
 */
public function calculateEffectiveDeadline(Participant $participant): DateTime
```

---

## 7. Import Organization

### 7.1 Order

1. Built-in/Standard library
2. External packages (third-party)
3. Internal packages (your codebase)
4. Relative imports (same module)

### 7.2 Examples

```typescript
// TypeScript
// 1. Built-in
import { useState, useEffect } from 'react';

// 2. External packages
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Internal packages
import { UserService } from '@/services/UserService';
import { BooleanHelpers } from '@/utils/BooleanHelpers';

// 4. Relative
import { UserCard } from './UserCard';
import type { UserProps } from './types';
```

```python
# Python
# 1. Standard library
from datetime import datetime
from typing import Optional

# 2. Third-party
from pydantic import BaseModel
from fastapi import HTTPException

# 3. Internal
from app.services.user_service import UserService
from app.utils.boolean_helpers import is_none

# 4. Relative
from .models import User
from .schemas import UserCreate
```

---

## 8. Type Safety

### 8.1 Always Use Types

- **PHP:** Use strict types and type hints
- **TypeScript:** NEVER use `any` or `unknown` (except type guards). See [TypeScript Guidelines](../../11-spec-management-software/04-coding-guidelines/03-typescript-guidelines.md)
- **Python:** Use type hints throughout
- **Golang:** Use explicit types for all variables

### 8.2 TypeScript Strict Rules

> ⚠️ **MANDATORY:** The following rules apply to ALL TypeScript code:

| Rule | Requirement |
|------|-------------|
| No `any` | ❌ Never use `any` type |
| No `unknown` | ⚠️ Only in type guards |
| `const` by default | Use `const` unless reassignment needed |
| Enums for switches | All switch statements must use enum types |
| Explicit types | All object shapes must have interfaces |
| `readonly` | Use for immutable properties |
| Return types | Explicit return types on all functions |

### 8.3 Examples

```php
<?php
declare(strict_types=1);

function calculateTotal(float $price, int $quantity): float {
    return $price * $quantity;
}
```

```typescript
// ❌ INCORRECT - Using 'any'
function processData(data: any): any {
    return data.value;
}

// ❌ INCORRECT - String literals in switch
function handleAction(action: string) {
    switch (action) {
        case "create": return create();
    }
}

// ✅ CORRECT - Explicit interface, readonly, enum
interface DataPayload {
    readonly value: string;
    readonly timestamp: number;
}

enum TaskAction {
    Create = "create",
    Update = "update",
    Delete = "delete",
}

function processData(data: DataPayload): string {
    return data.value;
}

function handleAction(action: TaskAction): Result {
    switch (action) {
        case TaskAction.Create:
            return create();
        case TaskAction.Update:
            return update();
        case TaskAction.Delete:
            return deleteItem();
        default:
            const _exhaustive: never = action;
            throw new Error(`Unhandled: ${_exhaustive}`);
    }
}
```

```python
from typing import Optional

def get_user_name(user_id: int) -> Optional[str]:
    user = find_user(user_id)
    return user.name if user else None
```

---

## 9. Generics First — Universal Type Safety Rule

> 🔴 **CRITICAL:** Generics are the **highest-priority** mechanism for type safety. Always prefer generics over `interface{}`, `any`, `unknown`, `map[string]any`, or `map[string]interface{}`.

### 9.1 Principle

When writing custom code that handles varying types, **use generics**. Never fall back to untyped containers (`interface{}` in Go, `any` in TypeScript, `object` in PHP) unless interfacing with a 3rd-party API that requires it.

### 9.2 Language-Specific Rules

| Language | ❌ Forbidden | ✅ Required |
|----------|-------------|------------|
| **Go** | `interface{}`, `any` as value types, `map[string]interface{}`, `map[string]any` | Generic functions `[T any]`, typed structs, union structs (`SettingValue`) |
| **TypeScript** | `any`, `unknown` (except type guards), `Record<string, any>` | Generic functions `<T>`, typed interfaces, discriminated unions |
| **PHP** | `mixed` without narrowing, untyped arrays | Typed parameters, return types, PHPStan generics |

### 9.3 Decision Hierarchy

```
1. Can I use a concrete type?           → Use it
2. Can I use a generic <T>?             → Use it
3. Can I use a discriminated union?     → Use it
4. Is this a 3rd-party API boundary?    → ALLOWED with "// ALLOWED: <reason>" comment
5. None of the above?                   → REFACTOR until 1-3 applies
```

### 9.4 Examples

#### Go — Generic API Response
```go
// ✅ CORRECT — generic response wrapper
type APIResponse[T any] struct {
    Success bool   `json:"Success"`
    Data    T      `json:"Data,omitempty"`
    Error   string `json:"Error,omitempty"`
}

// ✅ CORRECT — generic settings accessor
func GetTyped[T SettingConstraint](svc *SettingsService, key string) apperror.Result[T]
```

#### TypeScript — Generic Hook
```typescript
// ✅ CORRECT — generic data fetching
function useQuery<T>(key: string, fetcher: () => Promise<T>): QueryResult<T>

// ✅ CORRECT — generic form state
function useForm<T extends FieldValues>(config: FormConfig<T>): FormReturn<T>
```

### 9.5 3rd-Party Exception Format

When a 3rd-party API requires untyped values, document it inline:

```go
// ALLOWED: LangChain Go chain.Call() requires map[string]any input
result, err := chain.Call(ctx, map[string]any{"input": query})
```

---

## 10. No Magic Strings for Log/Context Keys

> ⚠️ **MANDATORY:** All log context keys must be defined as named constants. Inline string literals ("magic strings") for log keys are prohibited.

### 10.1 Rules

1. **Constants over literals:** Define all log keys as `const` at package level (e.g., `LogKeyUserId = "UserId"`)
2. **PascalCase keys:** All log context keys must use PascalCase (e.g., `ErrorCode`, not `error_code` or `errorCode`). See [PascalCase Key Naming Standard](../../02-coding-guidelines/01-cross-language/11-key-naming-pascalcase.md)
3. **No inline assignment in conditions:** Extract function calls to a separate variable before checking the result — never combine assignment and condition in one `if` statement (see [P7 — No Inline Statements](../../02-coding-guidelines/03-golang/02-boolean-standards.md))

### 10.2 Example

```go
// ❌ FORBIDDEN — 3 violations: inline call, snake_case key, magic string
if userId := GetUserId(ctx); userId != "" {
    args = append(args, "user_id", userId)
}

// ✅ REQUIRED — separate variable, constant key, PascalCase, full param name
const (
    LogKeyUserId        = "UserId"
    LogKeyRequestId     = "RequestId"
    LogKeyErrorCode     = "ErrorCode"
    LogKeyErrorConstant = "ErrorConstant"
    LogKeyStackTrace    = "StackTrace"
)

userId := GetUserId(context)
if hasContent(userId) {
    args = append(args, LogKeyUserId, userId)
}
```

### 10.3 Exemptions

- `if err := fn(); err != nil` — idiomatic Go error propagation (variable only used within the error check)
- `if r := recover(); r != nil` — idiomatic Go panic recovery in deferred functions
- Comma-ok patterns: `if v, ok := m[k]; ok {`
- Type assertions: `if v, ok := x.(T); ok {`
- External/third-party API parameter keys retain their native casing (e.g., WordPress `permission_callback`)
- Single-word keys like `"error"`, `"func"`, `"file"`, `"line"` are acceptable as literals when universally understood

---

## 12. PascalCase for All PHP Array Keys and Enum Usage for Repeated Values

> ⚠️ **MANDATORY:** All PHP associative array keys in return values, API responses, internal data structures, and filter parameters must use PascalCase. Repeated string values representing known categories must use enum backing values.

### 12.1 Rules

1. **PascalCase array keys:** All associative array keys must be PascalCase (e.g., `'PostsMissing'`, `'TotalCount'`), never camelCase or snake_case
2. **Enum values for categories:** Strings like `'post'`, `'page'`, `'category'` that represent known WordPress types must use enum backing values (e.g., `WpPostType::Post->value`)
3. **Setting keys via enum:** Configuration/setting key strings like `'meta_description.max_length'` must use a settings key enum (e.g., `YoastSettingKey::MetaDescriptionMaxLength->value`)

### 12.2 Example

```php
// ❌ FORBIDDEN — 4 violations: camelCase keys, magic string values, magic setting key
public function getContentStats(): array
{
    return [
        'postsMissingKeyword' => count($this->findMissingFocusKeywords(['post_types' => ['post']])),
        'pagesMissingKeyword' => count($this->findMissingFocusKeywords(['post_types' => ['page']])),
        'oversizedDescriptions' => count($this->findOversizedMetaDescriptions(
            $this->settings->getSetting('meta_description.max_length')
        ))
    ];
}

// ✅ REQUIRED — PascalCase keys, enum values, enum setting key
public function getContentStats(): array
{
    return [
        'PostsMissingKeyword' => count($this->findMissingFocusKeywords(['PostTypes' => [WpPostType::Post->value]])),
        'PagesMissingKeyword' => count($this->findMissingFocusKeywords(['PostTypes' => [WpPostType::Page->value]])),
        'OversizedDescriptions' => count($this->findOversizedMetaDescriptions(
            $this->settings->getSetting(YoastSettingKey::MetaDescriptionMaxLength->value)
        ))
    ];
}
```

### 12.3 Exemptions

- WordPress core function parameters retain their native snake_case (e.g., `'post_status'` in `WP_Query` args)
- Third-party API fields maintain their original casing for compatibility

---

## 11. Anti-Patterns Summary

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| Negation operators (`!`, `not`) | Positive helper functions |
| Functions > 15 lines | Split into smaller functions |
| Deep nesting (3+ levels) | Early returns |
| Generic names (`data`, `temp`) | Descriptive names |
| Missing type hints | Always use types |
| Magic numbers | Named constants |
| Magic strings for log keys | Named `const` log key constants |
| Inline function calls in `if` | Separate variable + condition |
| snake_case log keys | PascalCase log keys |
| God classes | Single responsibility |
| Commented-out code | Delete it |
| `any` / `interface{}` / `map[string]any` | **Generics, typed structs, union types** |

---

## Mandatory Implementation Checklist

Before considering any implementation complete, verify:

- [ ] All functions are under 15 lines of logic
- [ ] No negation operators (`!`, `not`) - only positive helpers
- [ ] All variables use `camelCase`
- [ ] All classes use `PascalCase`
- [ ] All non-error constants use `SCREAMING_SNAKE_CASE`; error codes use `ErrPascalCase`
- [ ] All booleans prefixed with `is`, `has`, `can`, `should`, `was`
- [ ] All functions use early returns (no deep nesting)
- [ ] All types are explicit — **generics first**, no `any`/`interface{}`/`map[string]any`
- [ ] 3rd-party `interface{}` usage has `// ALLOWED:` comment
- [ ] **No magic strings for log/context keys — use named constants**
- [ ] **No inline function calls in `if` conditions — extract to variable first**
- [ ] **All log keys use PascalCase — no snake_case or camelCase**
- [ ] Imports are organized by category
- [ ] Doc comments on all public methods

---

*This document establishes foundational coding standards. See [02-error-management-foundation.md](./02-error-management-foundation.md) for exception handling patterns.*
