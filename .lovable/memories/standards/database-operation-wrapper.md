# Memory: standards/database-operation-wrapper

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Overview

All database operations MUST go through the centralized `DBOperation` wrapper defined in `pkg/database`. This ensures consistent error handling, stack traces, and affected rows tracking.

---

## Quick Reference

| Requirement | Implementation |
|-------------|----------------|
| Stack Traces | Auto-captured via `runtime.Callers()` |
| Affected Rows | Validated via `ExpectRows(n)` |
| Table Name | Required in `NewDBOperation(tableName, opType)` |
| Logging | Automatic with zerolog structured output |

---

## Mandatory Pattern

```go
op := database.NewDBOperation("TableName", database.OpCreate).
    ExpectRows(1)

result := op.Execute(func() (int64, error) {
    tx := r.db.Create(entity)
    return tx.RowsAffected, tx.Error
})
```

---

## Stack Trace Format

```
[ERROR] Database operation completed
  Table: User
  Operation: Create
  ExpectedRows: 1
  AffectedRows: 0
  Error: UNIQUE constraint failed: User.Email
  Stack:
    -> user_repository.go:45 (CreateUser)
    -> auth_service.go:112 (RegisterUser)
    -> auth_handler.go:78 (HandleRegister)
```

---

## Error Log Fields (Required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Table` | string | Always | Table being operated on |
| `Operation` | string | Always | Create/Read/Update/Delete |
| `AffectedRows` | int64 | For writes | Actual rows changed |
| `ExpectedRows` | int | For writes | Expected rows (validation) |
| `Duration` | duration | Always | Operation time |
| `Stack` | []string | On error | Full caller chain |
| `Error` | string | On error | Error message |

---

## Rules

1. **No Direct GORM Calls** - All operations through wrapper
2. **Always Set ExpectedRows** - For Create/Update/Delete
3. **Always Include Table Name** - Via `NewDBOperation(tableName, ...)`
4. **Stack Traces Auto-Captured** - Logged on any error

---

## Cross-References

| Document | Path |
|----------|------|
| Full Specification | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| Go Debugging Guide | `spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` |

---

*Quick reference for database operation wrapper requirements.*
