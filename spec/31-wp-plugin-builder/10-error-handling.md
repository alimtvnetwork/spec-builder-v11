# Error Handling

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Comprehensive error handling with stack traces, structured logging, and integration with the shared error package.

**Cross-References:**
- [Error Code Registry](../03-error-code-registry/01-registry.md)
- [BRun Error Handling](../21-brun-cli/01-backend/06-error-handling.md)
- [Core Architecture](./01-core-architecture.md)

---

## Error Code Range

> ⚠️ **COMPRESSED (2026-02-28):** Previously used 10000-10999 with 100-unit sub-ranges. Compressed to 10000-10499 to avoid collision with AB Lovable Reasoning (originally at 10500-10519, now at 19000-19019). See `spec/61-how-app-issues-track/16-error-code-collision-remediation.md`.

WP Plugin Builder uses error codes **10000-10499**.

| Range | Category | Description |
|-------|----------|-------------|
| 10000-10099 | General/Startup | Initialization, config loading |
| 10100-10199 | Configuration | Config parsing, validation, seeding |
| 10200-10299 | Database | Connection, migration, query errors |
| 10300-10399 | Project Management | Create, clone, import, export |
| 10400-10419 | RAG/Vector | Embedding, indexing, search |
| 10420-10439 | Code Generation | AI calls, parsing, validation |
| 10440-10459 | Spec Processing | Parsing, import, validation |
| 10460-10479 | Server/API | HTTP server, endpoints |
| 10480-10489 | Settings | Settings service errors |
| 10490-10499 | Reset | Reset API errors |

---

## Error Code Table

| Code | Constant | Exit | HTTP | Description | Retryable |
|------|----------|------|------|-------------|-----------|
| **General (10000-10099)** |
| 10001 | `ErrWpbInitFailed` | 1 | 500 | Application initialization failed | No |
| 10002 | `ErrWpbAibridgeUnavailable` | 1 | 503 | AI Bridge connection failed | Yes |
| 10003 | `ErrWpbBinaryNotFound` | 127 | 500 | Required binary not in PATH | No |
| 10004 | `ErrWpbVersionMismatch` | 1 | 400 | Version incompatibility | No |
| **Configuration (10100-10199)** |
| 10101 | `ErrWpbConfigNotFound` | 2 | 404 | Config file not found | No |
| 10102 | `ErrWpbConfigParseError` | 2 | 400 | Invalid JSON in config | No |
| 10103 | `ErrWpbConfigSchemaInvalid` | 2 | 400 | Config schema validation failed | No |
| 10104 | `ErrWpbConfigSeedFailed` | 2 | 500 | Configuration seeding failed | No |
| 10105 | `ErrWpbConfigWriteFailed` | 2 | 500 | Config file write failed | No |
| **Database (10200-10299)** |
| 10201 | `ErrWpbDbConnection` | 3 | 500 | Database connection failed | Yes |
| 10202 | `ErrWpbDbMigration` | 3 | 500 | Database migration failed | No |
| 10203 | `ErrWpbDbQuery` | 3 | 500 | Database query failed | Yes |
| 10204 | `ErrWpbDbTransaction` | 3 | 500 | Transaction failed | Yes |
| 10205 | `ErrWpbDbNotFound` | 3 | 404 | Database file not found | No |
| **Project Management (10300-10399)** |
| 10301 | `ErrWpbProjectNameRequired` | 4 | 400 | Project name not provided | No |
| 10302 | `ErrWpbProjectExists` | 4 | 409 | Project already exists | No |
| 10303 | `ErrWpbProjectCreateFailed` | 4 | 500 | Project creation failed | No |
| 10304 | `ErrWpbProjectListFailed` | 4 | 500 | Project listing failed | No |
| 10305 | `ErrWpbProjectNotFound` | 4 | 404 | Project not found | No |
| 10306 | `ErrWpbProjectDbOpen` | 4 | 500 | Project database open failed | No |
| 10307 | `ErrWpbProjectDeleteCancelled` | 4 | 400 | Deletion cancelled by user | No |
| 10308 | `ErrWpbProjectDeleteFailed` | 4 | 500 | Database deletion failed | No |
| 10309 | `ErrWpbProjectCloneFailed` | 4 | 500 | Project cloning failed | No |
| 10310 | `ErrWpbProjectExportFailed` | 4 | 500 | Database export failed | No |
| 10311 | `ErrWpbProjectZipFailed` | 4 | 500 | Zip creation failed | No |
| 10312 | `ErrWpbProjectImportFailed` | 4 | 500 | Database import failed | No |
| 10313 | `ErrWpbProjectExtractFailed` | 4 | 500 | Zip extraction failed | No |
| **RAG/Vector (10400-10499)** |
| 10401 | `ErrWpbRagEmbedFailed` | 5 | 500 | Embedding generation failed | Yes |
| 10402 | `ErrWpbRagBatchEmbed` | 5 | 500 | Batch embedding failed | Yes |
| 10403 | `ErrWpbRagSearchFailed` | 5 | 500 | Vector search failed | Yes |
| 10404 | `ErrWpbRagInsertFailed` | 5 | 500 | Vector insertion failed | No |
| 10405 | `ErrWpbPresetReadFailed` | 5 | 404 | Preset file read failed | No |
| 10406 | `ErrWpbPresetExists` | 5 | 409 | Preset already exists | No |
| 10407 | `ErrWpbPresetIndexFailed` | 5 | 500 | Preset indexing failed | No |
| 10408 | `ErrWpbPresetCreateFailed` | 5 | 500 | Preset creation failed | No |
| 10409 | `ErrWpbPresetNotFound` | 5 | 404 | Preset not found | No |
| 10410 | `ErrWpbPresetVectorsFailed` | 5 | 500 | Preset vectors fetch failed | No |
| 10411 | `ErrWpbPresetCopyFailed` | 5 | 500 | Vector copy to project failed | No |
| **Code Generation (10420-10439)** |
| 10421 | `ErrWpbGenSpecParse` | 6 | 400 | Specification parsing failed | No |
| 10422 | `ErrWpbGenAiFailed` | 6 | 500 | AI generation request failed | Yes |
| 10423 | `ErrWpbGenSyntaxError` | 6 | 422 | Generated code has syntax errors | No |
| 10424 | `ErrWpbGenNoFiles` | 6 | 422 | No files extracted from response | No |
| 10425 | `ErrWpbGenBackupFailed` | 6 | 500 | File backup failed | No |
| 10426 | `ErrWpbGenDirFailed` | 6 | 500 | Directory creation failed | No |
| 10427 | `ErrWpbGenWriteFailed` | 6 | 500 | File write failed | No |
| 10428 | `ErrWpbGenPhpSyntax` | 6 | 422 | PHP syntax validation failed | No |
| **Spec Processing (10440-10459)** |
| 10441 | `ErrWpbSpecFormat` | 7 | 400 | Unsupported spec format | No |
| 10442 | `ErrWpbSpecStoreFailed` | 7 | 500 | Spec storage failed | No |
| 10443 | `ErrWpbSpecTempDir` | 7 | 500 | Temp directory creation failed | No |
| 10444 | `ErrWpbSpecZipExtract` | 7 | 400 | Zip extraction failed | No |
| 10445 | `ErrWpbSpecReadFailed` | 7 | 404 | Folder reading failed | No |
| **Server/API (10460-10479)** |
| 10461 | `ErrWpbServerStart` | 8 | 500 | Server start failed | No |
| 10462 | `ErrWpbServerPortInUse` | 8 | 409 | Port already in use | No |
| 10463 | `ErrWpbApiRateLimit` | 8 | 429 | Rate limit exceeded | Yes |
| 10464 | `ErrWpbApiInvalidRequest` | 8 | 400 | Invalid API request | No |

---

## Error Package

```go
package errors

import (
    "fmt"
    "runtime"
    "strings"
)

// ErrorFields holds structured context for errors
type ErrorFields struct {
    Chunk      int    `json:",omitempty"`
    PluginId   int64  `json:",omitempty"`
    Path       string `json:",omitempty"`
    SourceType string `json:",omitempty"`
}

type WPBError struct {
    Code       int
    Message    string
    StackTrace []StackFrame
    Fields     ErrorFields
    Wrapped    error
}

type StackFrame struct {
    Function string
    File     string
    Line     int
}

func New(code int, message string) *WPBError {
    return &WPBError{
        Code:    code,
        Message: message,
    }
}

func Wrap(err error, code int, message string) *WPBError {
    return &WPBError{
        Code:    code,
        Message: message,
        Wrapped: err,
    }
}

func (e *WPBError) WithStack() *WPBError {
    const depth = 32
    var pcs [depth]uintptr
    n := runtime.Callers(2, pcs[:])
    
    frames := runtime.CallersFrames(pcs[:n])
    for {
        frame, more := frames.Next()
        e.StackTrace = append(e.StackTrace, StackFrame{
            Function: frame.Function,
            File:     frame.File,
            Line:     frame.Line,
        })
        if !more || len(e.StackTrace) >= 10 {
            break
        }
    }
    
    return e
}

func (e *WPBError) WithField(fields ErrorFields) *WPBError {
    e.Fields = fields
    return e
}

func (e *WPBError) Error() string {
    var b strings.Builder
    b.WriteString(fmt.Sprintf("[WPB-%d] %s", e.Code, e.Message))
    
    if len(e.Fields) > 0 {
        b.WriteString(" (")
        first := true
        for k, v := range e.Fields {
            if !first {
                b.WriteString(", ")
            }
            b.WriteString(fmt.Sprintf("%s=%v", k, v))
            first = false
        }
        b.WriteString(")")
    }
    
    if e.Wrapped != nil {
        b.WriteString(": ")
        b.WriteString(e.Wrapped.Error())
    }
    
    return b.String()
}

func Code(err error) int {
    var wpbErr *WPBError
    if errors.As(err, &wpbErr) {
        return wpbErr.Code
    }
    return 0
}
```

---

## Logging

```go
// LogFields holds structured context for log entries
type LogFields struct {
    ErrorCode    int          `json:",omitempty"`
    ErrorMessage string       `json:",omitempty"`
    StackTrace   []StackFrame `json:",omitempty"`
}

type Logger struct {
    level   LogLevel
    format  string
    output  io.Writer
    fields  LogFields
}

type LogLevel int

const (
    LevelDebug LogLevel = iota
    LevelInfo
    LevelWarn
    LevelError
)

func (l *Logger) Error(msg string, err error, fields ...any) {
    entry := l.buildEntry(LevelError, msg, fields)
    
    var wpbErr *WPBError
    if errors.As(err, &wpbErr) {
        entry["ErrorCode"] = wpbErr.Code
        entry["ErrorMessage"] = wpbErr.Message
        
        if len(wpbErr.StackTrace) > 0 {
            entry["StackTrace"] = wpbErr.StackTrace
        }
        
        for k, v := range wpbErr.Fields {
            entry["Error"+k] = v
        }
    } else if err != nil {
        entry["Error"] = err.Error()
    }
    
    l.write(entry)
}

// LogEntry holds a single structured log entry
type LogEntry struct {
    Timestamp string
    Level     string
    Message   string
    LogFields
}

func (l *Logger) buildEntry(level LogLevel, msg string, fields []string) LogEntry {
    return LogEntry{
        Timestamp: time.Now().Format(time.RFC3339),
        Level:     level.String(),
        Message:   msg,
        LogFields: l.fields,
    }
}
```

---

## Error Response (API)

```go
// ErrorResponseDetails holds structured error details for API responses
type ErrorResponseDetails struct {
    StackTrace []StackFrame `json:",omitempty"`
    Fields     ErrorFields  `json:",omitempty"`
}

type ErrorResponse struct {
    Code    int
    Message string
    Details ErrorResponseDetails `json:",omitempty"`
}

func HandleError(w http.ResponseWriter, err error) {
    var resp ErrorResponse
    var statusCode int
    
    var wpbErr *WPBError
    if errors.As(err, &wpbErr) {
        resp = ErrorResponse{
            Code:    wpbErr.Code,
            Message: wpbErr.Message,
            Details: wpbErr.Fields,
        }
        statusCode = errorToHttpStatus(wpbErr.Code)
    } else {
        resp = ErrorResponse{
            Code:    10001,
            Message: err.Error(),
        }
        statusCode = http.StatusInternalServerError
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(resp)
}

func errorToHttpStatus(code int) int {
    switch {
    case code >= 10440 && code < 10460:
        return http.StatusBadRequest
    case code >= 10300 && code < 10400:
        if code == 10302 || code == 10305 {
            return http.StatusNotFound
        }
        return http.StatusInternalServerError
    default:
        return http.StatusInternalServerError
    }
}
```

---

## Log File Structure

```
~/.wpb/logs/
├── wpb_20260201.log           # Daily log file
├── wpb_20260201_error.log     # Error-only log
└── wpb.log                    # Current symlink
```

---

## See Also

- [Error Code Registry](../03-error-code-registry/01-registry.md)
- [Configuration](./03-configuration.md)
- [API Interface](./11-api-interface.md)
