# Memory: standards/database-preflight-checklist

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Overview

Pre-flight checklist for ALL database operations in Go CLI tools. Complete this checklist before implementing any repository or database code.

---

## ✅ Pre-Flight Checklist

### 1. DBOperation Wrapper (MANDATORY)

| Check | Requirement |
|-------|-------------|
| ☐ | Import `pkg/database` in repository file |
| ☐ | Use `NewDBOperation(tableName, opType)` for every DB call |
| ☐ | Call `ExpectRows(n)` for Create/Update/Delete operations |
| ☐ | Never use direct GORM calls (`db.Create()`, `db.Update()`) |

**Pattern:**
```go
op := database.NewDBOperation("User", database.OpCreate).
    ExpectRows(1)

result := op.Execute(func() (int64, error) {
    tx := r.db.Create(user)
    return tx.RowsAffected, tx.Error
})
```

---

### 2. ORM-Only Policy (MANDATORY)

| Check | Requirement |
|-------|-------------|
| ☐ | NO raw SQL (`db.Exec()`, `db.Raw()`) |
| ☐ | Use GORM query builder for all operations |
| ☐ | Use Relationship-First pattern for related data |
| ☐ | Exception: FTS5 virtual tables ONLY |

**Relationship-First Pattern:**
```go
// ✅ CORRECT: Find parent, append to relationship
var project Project
r.db.First(&project, projectId)
project.Files = append(project.Files, newFile)
r.db.Save(&project)

// ❌ WRONG: Raw SQL insert
r.db.Exec("INSERT INTO File (ProjectId, Name) VALUES (?, ?)", projectId, name)
```

---

### 3. Stack Trace Capture (AUTOMATIC)

| Check | Requirement |
|-------|-------------|
| ☐ | Stack traces auto-captured via `runtime.Callers()` |
| ☐ | No manual stack trace code needed |
| ☐ | Verify errors include file:line:function in logs |

**Log Output on Error:**
```json
{
  "level": "error",
  "Table": "User",
  "Operation": "Create",
  "AffectedRows": 0,
  "ExpectedRows": 1,
  "error": "UNIQUE constraint failed",
  "Stack": [
    "user_repository.go:45 (CreateUser)",
    "auth_service.go:112 (RegisterUser)"
  ]
}
```

---

### 4. Mandatory Log Fields

| Field | Required | When |
|-------|----------|------|
| `Table` | Always | Every DB operation |
| `Operation` | Always | Create/Read/Update/Delete |
| `ExpectedRows` | Write ops | Create, Update, Delete |
| `AffectedRows` | Write ops | Create, Update, Delete |
| `Duration` | Always | Every operation |
| `Stack` | On error | Any failure |
| `Error` | On error | Error message |

---

### 5. PascalCase Naming

| Check | Requirement |
|-------|-------------|
| ☐ | Table names: `User`, `Project`, `Session` |
| ☐ | Column names: `Id`, `CreatedAt`, `ProjectId` |
| ☐ | JSON fields: `"UserId"`, `"CreatedAt"` |
| ☐ | NO snake_case in database layer |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE OPERATION CHECKLIST                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ✅ Use DBOperation wrapper for EVERY operation          │
│  2. ✅ Set ExpectRows() for Create/Update/Delete            │
│  3. ✅ Never use raw SQL (except FTS5)                      │
│  4. ✅ Use Relationship-First pattern                        │
│  5. ✅ PascalCase for all table/column names                │
│  6. ✅ Stack traces auto-captured (no manual code)          │
│                                                              │
│  IMPORT:  import "pkg/database"                             │
│                                                              │
│  PATTERN: op := database.NewDBOperation("Table", OpCreate)  │
│               .ExpectRows(1)                                 │
│           result := op.Execute(func() (int64, error) {...}) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Before PR

Before submitting any database-related code:

1. **Search for raw SQL**: `grep -r "db.Exec\|db.Raw" ./`
2. **Search for direct GORM**: `grep -r "r.db.Create\|r.db.Update\|r.db.Delete" ./`
3. **Verify wrapper usage**: All operations go through `DBOperation`
4. **Check logs**: Table name appears in every entry

---

## Cross-References

| Document | Path |
|----------|------|
| DBOperation Wrapper Spec | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` |
| Stack Trace Capture | `.lovable/memories/technical/stack-trace-capture.md` |
| Database Wrapper Memory | `.lovable/memories/standards/database-operation-wrapper.md` |
| Go Debugging Guide | `spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |

---

*Complete this checklist for every database-related implementation task.*
