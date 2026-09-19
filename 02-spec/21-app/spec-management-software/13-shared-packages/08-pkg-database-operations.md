# PKG Database Operations Wrapper

> **Version:** 2.0.0  
> **Created:** 2026-03-09  
> **Status:** Specification  
> **Applies To:** All Go CLI tools (GSearch, BRun, AI Bridge, Nexus Flow, AI Transcribe)

---

## Overview

This specification defines a centralized `DBOperation` wrapper that ALL database operations MUST go through. The wrapper provides:

1. **Automatic Stack Traces** - Capture full caller chain on every error
2. **Affected Rows Tracking** - Compare expected vs actual rows affected
3. **Table Name Logging** - Every log entry includes the table name
4. **ORM Enforcement** - Operations go through GORM, not raw SQL

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      DBOperation Wrapper                            │
├────────────────────────────────────────────────────────────────────┤
│  INPUT                                                              │
│  ├── TableName       (required)                                    │
│  ├── OperationType   (Create/Read/Update/Delete)                   │
│  ├── ExpectedRows    (for write validation)                        │
│  └── Model/Entity    (GORM model reference)                        │
├────────────────────────────────────────────────────────────────────┤
│  PROCESS                                                            │
│  1. Capture caller stack trace immediately                         │
│  2. Start timer for duration tracking                              │
│  3. Execute ORM operation                                          │
│  4. Validate affected rows vs expected                             │
│  5. Log with full context (table, operation, duration, rows)       │
├────────────────────────────────────────────────────────────────────┤
│  OUTPUT                                                             │
│  ├── DBResult with AffectedRows                                    │
│  ├── Stack trace (always captured, logged on error)                │
│  └── Structured log entry with TableName                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### OperationType Enum

```go
type OperationType string

const (
    OpCreate OperationType = "Create"
    OpRead   OperationType = "Read"
    OpUpdate OperationType = "Update"
    OpDelete OperationType = "Delete"
)
```

### StackFrame Structure

```go
type StackFrame struct {
    File     string
    Function string
    Line     int
}
```

### DBOperation Structure

```go
type DBOperation struct {
    TableName     string
    OperationType OperationType
    ExpectedRows  int
    AffectedRows  int64
    StackTrace    []StackFrame
    StartTime     time.Time
    Logger        zerolog.Logger
}
```

### DBResult Structure

```go
type DBResult struct {
    Success      bool
    AffectedRows int64
    Error        *apperror.AppError `json:",omitempty"`
    StackTrace   []StackFrame  `json:",omitempty"`
    Duration     time.Duration
    TableName    string
}
```

---

## Core Methods

### NewDbOperation

Creates a new database operation wrapper with automatic stack trace capture.

```go
func NewDbOperation(tableName string, opType OperationType) *DBOperation {
    op := &DBOperation{
        TableName:     tableName,
        OperationType: opType,
        StartTime:     time.Now(),
        Logger:        log.With().Str("Table", tableName).Logger(),
    }
    op.StackTrace = op.captureStack()
    return op
}
```

### ExpectRows

Sets the expected number of affected rows for validation.

```go
func (op *DBOperation) ExpectRows(n int) *DBOperation {
    op.ExpectedRows = n
    return op
}
```

### Execute

Executes the database operation with full tracking.

```go
func (op *DBOperation) Execute(fn func() (int64, error)) DBResult { // EXEMPTED: callback parameter boundary
    affectedRows, err := fn()
    op.AffectedRows = affectedRows
    
    result := DBResult{
        Success:      err == nil,
        AffectedRows: affectedRows,
        Error:        err,
        Duration:     time.Since(op.StartTime),
        TableName:    op.TableName,
    }
    
    // Validate expected rows for write operations
    if op.ExpectedRows > 0 && int64(op.ExpectedRows) != affectedRows {
        result.Success = false
        if result.Error == nil {
            result.Error = apperror.New(
                ErrRowCountMismatch,
                "row count mismatch",
            ).
                WithContext("expected", op.ExpectedRows).
                WithContext("actual", affectedRows)
        }
    }
    
    // Include stack trace on error
    if !result.Success {
        result.StackTrace = op.StackTrace
    }
    
    op.logResult(result)
    return result
}
```

### captureStack

Captures the full caller stack trace.

```go
func (op *DBOperation) captureStack() []StackFrame {
    const maxDepth = 10
    frames := make([]StackFrame, 0, maxDepth)
    
    pcs := make([]uintptr, maxDepth)
    n := runtime.Callers(3, pcs) // Skip runtime.Callers, captureStack, NewDbOperation
    
    callersFrames := runtime.CallersFrames(pcs[:n])
    for {
        frame, more := callersFrames.Next()
        
        // Skip internal runtime frames
        if strings.Contains(frame.File, "runtime/") {
            if !more {
                break
            }
            continue
        }
        
        frames = append(frames, StackFrame{
            File:     filepath.Base(frame.File),
            Function: filepath.Base(frame.Function),
            Line:     frame.Line,
        })
        
        if !more {
            break
        }
    }
    
    return frames
}
```

### logResult

Logs the operation result with full context.

```go
func (op *DBOperation) logResult(result DBResult) {
    event := op.Logger.Info()
    
    if !result.Success {
        event = op.Logger.Error()
    }
    
    event.
        Str("Operation", string(op.OperationType)).
        Int64("AffectedRows", result.AffectedRows).
        Dur("Duration", result.Duration)
    
    if op.ExpectedRows > 0 {
        event.Int("ExpectedRows", op.ExpectedRows)
    }
    
    if result.Error != nil {
        event.Err(result.Error)
        event.Interface("Stack", formatStackTrace(result.StackTrace))
    }
    
    event.Msg("Database operation completed")
}
```

---

## Usage Patterns

### Create Operation

```go
// ✅ CORRECT: Using DBOperation wrapper
func (r *UserRepository) Create(user *User) error {
    op := database.NewDbOperation("User", database.OpCreate).
        ExpectRows(1)
    
    // EXEMPTED: op.Execute callback uses (int64, error) as internal framework boundary
    result := op.Execute(func() (int64, error) {
        tx := r.db.Create(user)
        return tx.RowsAffected, tx.Error
    })
    
    return result.Error
}
```

### Update Operation

```go
func (r *UserRepository) UpdateEmail(userId string, email string) error {
    op := database.NewDbOperation("User", database.OpUpdate).
        ExpectRows(1)
    
    // EXEMPTED: op.Execute callback uses (int64, error) as internal framework boundary
    result := op.Execute(func() (int64, error) {
        tx := r.db.Model(&User{}).
            Where("Id = ?", userId).
            Update("Email", email)
        return tx.RowsAffected, tx.Error
    })
    
    return result.Error
}
```

### Delete Operation

```go
func (r *UserRepository) Delete(userId string) error {
    op := database.NewDbOperation("User", database.OpDelete).
        ExpectRows(1)
    
    // EXEMPTED: op.Execute callback uses (int64, error) as internal framework boundary
    result := op.Execute(func() (int64, error) {
        tx := r.db.Where("Id = ?", userId).Delete(&User{})
        return tx.RowsAffected, tx.Error
    })
    
    return result.Error
}
```

### Read Operation (No Expected Rows)

```go
func (r *UserRepository) FindByEmail(email string) apperror.Result[User] {
    op := database.NewDbOperation("User", database.OpRead)
    
    var user User
    // EXEMPTED: op.Execute callback uses (int64, error) as internal framework boundary
    result := op.Execute(func() (int64, error) {
        tx := r.db.Where("Email = ?", email).First(&user)
        if tx.Error != nil {
            return 0, tx.Error
        }
        return 1, nil
    })
    
    if result.Error != nil {
        return nil, result.Error
    }
    return &user, nil
}
```

---

## Log Output Format

### Successful Operation

```json
{
  "Level": "info",
  "Table": "User",
  "Operation": "Create",
  "AffectedRows": 1,
  "ExpectedRows": 1,
  "Duration": "12.345ms",
  "Message": "Database operation completed"
}
```

### Failed Operation (with Stack Trace)

```json
{
  "Level": "error",
  "Table": "User",
  "Operation": "Create",
  "AffectedRows": 0,
  "ExpectedRows": 1,
  "Duration": "5.678ms",
  "Error": "UNIQUE constraint failed: User.Email",
  "Stack": [
    "user_repository.go:45 (CreateUser)",
    "auth_service.go:112 (RegisterUser)",
    "auth_handler.go:78 (HandleRegister)"
  ],
  "Message": "Database operation completed"
}
```

---

## Anti-Patterns

### ❌ WRONG: Direct GORM without wrapper

```go
// BAD: No stack trace, no affected rows validation, no table name in logs
result := r.db.Create(user)
if result.Error != nil {
    return result.Error
}
```

### ❌ WRONG: Raw SQL

```go
// BAD: Raw SQL bypasses ORM and wrapper
r.db.Exec("INSERT INTO User (Id, Email) VALUES (?, ?)", user.Id, user.Email)
```

### ❌ WRONG: Missing expected rows

```go
// BAD: Update without expected rows validation
op := database.NewDbOperation("User", database.OpUpdate)
// Should use: op.ExpectRows(1)
```

---

## Integration Checklist

- [ ] All repositories import `pkg/database`
- [ ] All Create operations use `ExpectRows(1)`
- [ ] All Update/Delete operations set expected rows
- [ ] No direct GORM calls outside wrapper
- [ ] No raw SQL (except FTS5/vector exceptions)
- [ ] Stack traces appear in error logs
- [ ] Table names appear in all database logs

---

## Cross-References

| Document | Path |
|----------|------|
| Go Debugging Guide | `02-spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |
| Database SQL Standards | `02-spec/11-spec-management-software/12-prompts/01-coding-guideline/02-database-sql.md` |
| ORM-Only Policy Memory | `.ai-memory/memories/standards/orm-only-policy.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |

---

*Centralized database operations ensure consistent error handling, debugging, and logging across all CLI tools.*
