# Memory: technical/stack-trace-capture

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** High

---

## Overview

All Go applications in the ecosystem MUST capture stack traces automatically for database errors and critical failures. This memory documents the `runtime.Callers()` pattern used in the `DBOperation` wrapper.

---

## Quick Reference

| Function | Purpose |
|----------|---------|
| `runtime.Callers(skip, pcs)` | Capture program counters of caller stack |
| `runtime.CallersFrames(pcs)` | Convert PCs to human-readable frames |
| `frame.File` | Source file path |
| `frame.Function` | Function name (fully qualified) |
| `frame.Line` | Line number in source file |

---

## Implementation Pattern

### StackFrame Structure

```go
type StackFrame struct {
    File     string `json:"File"`
    Function string `json:"Function"`
    Line     int    `json:"Line"`
}
```

### captureStack Function

```go
import (
    "path/filepath"
    "runtime"
    "strings"
)

func captureStack() []StackFrame {
    const maxDepth = 10
    frames := make([]StackFrame, 0, maxDepth)
    
    // Create slice for program counters
    pcs := make([]uintptr, maxDepth)
    
    // runtime.Callers(skip, pcs)
    // skip=0: runtime.Callers itself
    // skip=1: captureStack
    // skip=2: caller of captureStack
    // skip=3: caller's caller (where we want to start)
    n := runtime.Callers(3, pcs)
    
    // Convert program counters to frames
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
            File:     filepath.Base(frame.File),     // Just filename
            Function: filepath.Base(frame.Function), // Just function name
            Line:     frame.Line,
        })
        
        if !more {
            break
        }
    }
    
    return frames
}
```

---

## Skip Parameter Guide

| Skip Value | What Gets Skipped |
|------------|-------------------|
| 0 | Nothing (includes runtime.Callers) |
| 1 | runtime.Callers |
| 2 | runtime.Callers + current function |
| 3 | runtime.Callers + current + immediate caller |

### Usage in DBOperation

```go
func NewDBOperation(tableName string, opType OperationType) *DBOperation {
    op := &DBOperation{
        TableName:     tableName,
        OperationType: opType,
        StartTime:     time.Now(),
    }
    // Capture stack immediately at creation
    // Skip: runtime.Callers, captureStack, NewDBOperation
    op.StackTrace = op.captureStack()
    return op
}
```

---

## Formatting Stack Traces

### For Logs (zerolog)

```go
func formatStackTrace(frames []StackFrame) []string {
    result := make([]string, len(frames))
    for i, frame := range frames {
        result[i] = fmt.Sprintf("%s:%d (%s)", 
            frame.File, 
            frame.Line, 
            frame.Function,
        )
    }
    return result
}

// Usage in zerolog
logger.Error().
    Interface("Stack", formatStackTrace(frames)).
    Msg("Database operation failed")
```

### For Human-Readable Output

```go
func printStackTrace(frames []StackFrame) {
    fmt.Println("Stack Trace:")
    for _, frame := range frames {
        fmt.Printf("    -> %s:%d (%s)\n", 
            frame.File, 
            frame.Line, 
            frame.Function,
        )
    }
}
```

**Output:**
```
Stack Trace:
    -> user_repository.go:45 (CreateUser)
    -> auth_service.go:112 (RegisterUser)
    -> auth_handler.go:78 (HandleRegister)
```

---

## Integration with DBOperation

The stack trace is captured at operation creation time (not at error time) to ensure the full caller chain is preserved:

```go
op := database.NewDBOperation("User", database.OpCreate).
    ExpectRows(1)

// Stack is already captured at this point

result := op.Execute(func() (int64, error) {
    tx := r.db.Create(user)
    return tx.RowsAffected, tx.Error
})

// If error occurs, result.StackTrace contains the caller chain
```

---

## Performance Considerations

| Metric | Value |
|--------|-------|
| Typical overhead | < 1μs per capture |
| Max frames recommended | 10 (configurable) |
| When to capture | Operation creation only |
| When to log | On error only |

---

## Cross-References

| Document | Path |
|----------|------|
| DBOperation Wrapper Spec | `02-spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| Go Debugging Guide | `02-spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |
| Database Wrapper Memory | `.lovable/memories/standards/database-operation-wrapper.md` |

---

*Stack trace capture ensures full caller visibility for all database errors.*
