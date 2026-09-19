# 13 — Error Management


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

Error management is a critical aspect of WP Plugin Publish. All errors must be:

1. **Structured** — Consistent format across the application
2. **Traceable** — Include file, line, function, and stack trace
3. **Categorized** — Use error codes for programmatic handling
4. **Logged** — Persisted to SQLite for UI display
5. **Copyable** — Frontend provides one-click copy for AI debugging

---

## AppError Type

### Definition

```go
// pkg/appfault/error.go
package appfault

import (
    "fmt"
    "runtime"
    "strings"
)

// AppError is the standard error type for the application
// ErrorContext holds structured context data for errors
type ErrorContext struct {
    PluginId   int64  `json:",omitempty"`
    SiteId     int64  `json:",omitempty"`
    Path       string `json:",omitempty"`
    Status     int    `json:",omitempty"`
    WpCode     string `json:",omitempty"`
    Body       string `json:",omitempty"`
}

// AppError is the standard error type for the application
type AppError struct {
    Code       string            // Error code (e.g., "E1001")
    Message    string            // Human-readable message
    Cause      error             // Underlying error (if any)
    Context    ErrorContext      // Additional context data
    File       string            // Source file where error occurred
    Line       int               // Line number
    Function   string            // Function name
    StackTrace string            // Full stack trace
    Level      string            // "error", "warn", "info"
}

// Error implements the error interface
func (e *AppError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
    }
    return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying error
func (e *AppError) Unwrap() error {
    return e.Cause
}

// New creates a new AppError with automatic location capture
func New(code string, message string) *AppError {
    return newWithSkip(code, message, nil, 2)
}

// Wrap wraps an existing error with additional context
func Wrap(err error, code string, message string) *AppError {
    return newWithSkip(code, message, err, 2)
}

// WithContext sets a structured context on the error
func (e *AppError) WithContext(ctx ErrorContext) *AppError {
    e.Context = ctx
    return e
}

// WithLevel sets the error level
func (e *AppError) WithLevel(level string) *AppError {
    e.Level = level
    return e
}

func newWithSkip(code, message string, cause error, skip int) *AppError {
    pc, file, line, ok := runtime.Caller(skip)
    funcName := "unknown"
    if ok {
        fn := runtime.FuncForPC(pc)
        if fn != nil {
            funcName = fn.Name()
            // Extract just the function name
            if idx := strings.LastIndex(funcName, "."); idx >= 0 {
                funcName = funcName[idx+1:]
            }
        }
        // Extract just the filename
        if idx := strings.LastIndex(file, "/"); idx >= 0 {
            file = file[idx+1:]
        }
    }
    
    return &AppError{
        Code:       code,
        Message:    message,
        Cause:      cause,
        Level:      "error",
        File:       file,
        Line:       line,
        Function:   funcName,
        StackTrace: captureStackTrace(skip + 1),
    }
}
```

---

## Stack Trace Capture

```go
// pkg/appfault/stack.go
package appfault

import (
    "fmt"
    "runtime"
    "strings"
)

const maxStackDepth = 32

func captureStackTrace(skip int) string {
    var sb strings.Builder
    pcs := make([]uintptr, maxStackDepth)
    n := runtime.Callers(skip+1, pcs)
    frames := runtime.CallersFrames(pcs[:n])
    
    for {
        frame, more := frames.Next()
        
        // Skip runtime internals
        if strings.Contains(frame.File, "runtime/") {
            if !more {
                break
            }
            continue
        }
        
        // Format: file:line function
        sb.WriteString(fmt.Sprintf("  at %s\n     %s:%d\n",
            frame.Function,
            frame.File,
            frame.Line,
        ))
        
        if !more {
            break
        }
    }
    
    return sb.String()
}
```

---

## Error Codes

Error codes are defined in [66-shared-constants.md](../66-shared-constants.md).

### Code Structure

```
E{category}{number}

Categories:
- E1xxx: Configuration errors
- E2xxx: Database errors
- E3xxx: WordPress API errors
- E4xxx: File system errors
- E5xxx: Sync/publish errors
- E6xxx: Validation errors
- E9xxx: Internal/unexpected errors
```

### Code Definitions

```go
// pkg/appfault/codes.go
package appfault

// Configuration errors (E1xxx)
const (
    ErrConfigLoad    = "E1001"  // Failed to load configuration file
    ErrConfigParse   = "E1002"  // Failed to parse configuration
    ErrConfigMissing = "E1003"  // Required configuration missing
    ErrConfigInvalid = "E1004"  // Configuration value invalid
)

// Database errors (E2xxx)
const (
    ErrDatabaseOpen   = "E2001"  // Failed to open database
    ErrDatabaseQuery  = "E2002"  // Query execution failed
    ErrDatabaseExec   = "E2003"  // Statement execution failed
    ErrDatabaseTx     = "E2004"  // Transaction error
    ErrNotFound       = "E2005"  // Record not found
    ErrDuplicate      = "E2006"  // Duplicate record
)

// WordPress API errors (E3xxx)
const (
    ErrWpConnect     = "E3001"  // Failed to connect to WordPress
    ErrWpAuth        = "E3002"  // Authentication failed
    ErrWpApi         = "E3003"  // API request failed
    ErrWpPlugin      = "E3004"  // Plugin operation failed
    ErrWpUpload      = "E3005"  // File upload failed
    ErrWpActivate    = "E3006"  // Plugin activation failed
    ErrWpDeactivate  = "E3007"  // Plugin deactivation failed
)

// File system errors (E4xxx)
const (
    ErrFileRead     = "E4001"  // Failed to read file
    ErrFileWrite    = "E4002"  // Failed to write file
    ErrFileDelete   = "E4003"  // Failed to delete file
    ErrDirCreate    = "E4004"  // Failed to create directory
    ErrDirRead      = "E4005"  // Failed to read directory
    ErrZipCreate    = "E4006"  // Failed to create zip archive
    ErrZipExtract   = "E4007"  // Failed to extract zip archive
    ErrPathInvalid  = "E4008"  // Invalid file path
    ErrPathNotExist = "E4009"  // Path does not exist
)

// Sync/publish errors (E5xxx)
const (
    ErrSyncCheck      = "E5001"  // Sync check failed
    ErrSyncConflict   = "E5002"  // Sync conflict detected
    ErrPublishFailed  = "E5003"  // Publish operation failed
    ErrBackupFailed   = "E5004"  // Backup creation failed
    ErrRestoreFailed  = "E5005"  // Restore operation failed
    ErrWatcherStart   = "E5006"  // File watcher failed to start
    ErrWatcherEvent   = "E5007"  // File watcher event error
)

// Validation errors (E6xxx)
const (
    ErrValidation      = "E6001"  // Generic validation error
    ErrValidationUrl   = "E6002"  // Invalid URL format
    ErrValidationPath  = "E6003"  // Invalid path format
    ErrValidationEmpty = "E6004"  // Required field is empty
)

// Internal errors (E9xxx)
const (
    ErrInternal    = "E9001"  // Unexpected internal error
    ErrPanic       = "E9002"  // Recovered from panic
    ErrNotImpl     = "E9003"  // Feature not implemented
)
```

---

## Error Logging to Database

```go
// internal/logger/db_writer.go
package logger

import (
    "encoding/json"
    
    "wp-plugin-publish/internal/models"
    "wp-plugin-publish/pkg/appfault"
    
    "gorm.io/gorm"
)

type DBWriter struct {
    db *gorm.DB
}

func NewDbWriter(db *gorm.DB) *DBWriter {
    return &DBWriter{db: db}
}

func (w *DBWriter) Write(err *appfault.AppError) error {
    contextJson, _ := json.Marshal(err.Context)
    
    errorLog := models.ErrorLog{
        Level:      err.Level,
        Code:       err.Code,
        Message:    err.Message,
        Context:    string(contextJson),
        StackTrace: err.StackTrace,
        File:       err.File,
        Line:       err.Line,
        Function:   err.Function,
    }
    
    return w.db.Create(&errorLog).Error
}
```

---

## Error Response Format

### HTTP API Response

```go
// internal/api/handlers/errors.go
type ErrorResponse struct {
    Success bool
    Error   Error
}

type Error struct {
    Code       string
    Message    string
    Details    string       `json:",omitempty"`
    Context    ErrorContext `json:",omitempty"`
    File       string       `json:",omitempty"`
    Line       int          `json:",omitempty"`
    Function   string       `json:",omitempty"`
    StackTrace string       `json:",omitempty"`
    Timestamp  string
}

func WriteError(w http.ResponseWriter, err error) {
    appErr, ok := err.(*appfault.AppError)
    if !ok {
        appErr = appfault.Wrap(
            err, appfault.ErrInternal, "unexpected error",
        )
    }
    
    status := getHttpStatus(appErr.Code)
    
    resp := ErrorResponse{
        Success: false,
        Error: Error{
            Code:       appErr.Code,
            Message:    appErr.Message,
            Details:    getErrorDetails(appErr),
            Context:    appErr.Context,
            File:       appErr.File,
            Line:       appErr.Line,
            Function:   appErr.Function,
            StackTrace: appErr.StackTrace,
            Timestamp:  time.Now().UTC().Format(time.RFC3339),
        },
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(resp)
}

func getHttpStatus(code string) int {
    switch {
    case strings.HasPrefix(code, "E2005"): // Not found
        return http.StatusNotFound
    case strings.HasPrefix(code, "E3002"): // Auth failed
        return http.StatusUnauthorized
    case strings.HasPrefix(code, "E6"):    // Validation
        return http.StatusBadRequest
    default:
        return http.StatusInternalServerError
    }
}
```

---

## Panic Recovery

```go
// internal/api/middleware/recovery.go
package middleware

import (
    "net/http"
    "runtime/debug"
    
    "wp-plugin-publish/internal/logger"
    "wp-plugin-publish/pkg/appfault"
)

func Recovery(log *logger.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            defer func() {
                if rec := recover(); rec != nil {
                    err := appfault.New(
                        appfault.ErrPanic, fmt.Sprintf("panic: %v", rec),
                    )
                    err.StackTrace = string(debug.Stack())
                    
                    log.Error("Panic recovered", 
                        "error", err,
                        "method", r.Method,
                        "path", r.URL.Path,
                    )
                    
                    WriteError(w, err)
                }
            }()
            next.ServeHTTP(w, r)
        })
    }
}
```

---

## Live Progress Streaming

All long-running operations stream progress via WebSocket to provide real-time feedback.

### WebSocket Events

| Event | Description | Data |
|-------|-------------|------|
| `connection_test_started` | Site connection test begins | `{siteId}` |
| `connection_test_progress` | Step-by-step progress | `{siteId, step, status, message, details}` |
| `connection_test_complete` | Test finished | `{siteId, success}` |
| `sync_started` | Sync check begins | `{pluginId, siteId}` |
| `sync_progress` | Scan/compare progress | `{pluginId, siteId, step, progress, message}` |
| `sync_complete` | Sync finished | `{pluginId, siteId, inSync}` |
| `publish_started` | Publish pipeline begins | `{pluginId, siteId}` |
| `publish_progress` | Stage progress | `{pluginId, siteId, step, progress, message}` |
| `publish_complete` | Publish finished | `{pluginId, siteId, success}` |

### Progress Event Structure

```json
{
  "Type": "connection_test_progress",
  "Data": {
    "SiteId": 1,
    "Step": "auth_check",
    "Status": "success",
    "Message": "Authenticated as admin (ID: 1)",
    "Details": {
      "UserId": 1,
      "Roles": ["administrator"]
    }
  },
  "Timestamp": "2026-02-04T01:00:00Z"
}
```

### Connection Test Steps

The WordPress connection test performs multiple validation steps:

1. **dns_check** — Can we reach the site URL?
2. **rest_api_check** — Is `/wp-json/` accessible?
3. **auth_check** — Valid username + application password?
4. **plugin_access_check** — Can user manage plugins?
5. **write_test** — Create/delete a draft post (non-destructive verification)

### Testing Command Equivalent

The backend test is equivalent to:

```bash
# Test authentication via POST (WordPress REST API)
curl -v \
  -u 'username:app_password' \
  -X POST 'https://site.com/wp-json/wp/v2/posts' \
  -H 'Content-Type: application/json' \
  -d '{"title":"WP Plugin Publish Test","content":"testing auth","status":"draft"}'
```

### Connection Result

```go
type ConnectionInfo struct {
    Connected        bool
    Username         string
    WpVersion        string   `json:",omitempty"`
    SiteName         string   `json:",omitempty"`
    SiteDescription  string   `json:",omitempty"`
    UserId           int      `json:",omitempty"`
    UserDisplayName  string   `json:",omitempty"`
    UserRoles        []string `json:",omitempty"`
    CanManagePlugins bool
    CanWritePosts    bool
}
```

---

## Frontend Error Display

The React frontend receives error responses and displays them in an Error Console modal. See [24-error-console.md](../02-frontend/24-error-console.md) for UI implementation.

### Error Store (`src/stores/errorStore.ts`)

The Zustand-based error store provides:

1. **`captureError(apiError, meta?)`** — Captures API errors with request context
2. **`captureException(error, context?)`** — Captures JS exceptions with stack trace
3. **`openErrorModal(error)`** — Opens the detailed error modal

### Usage Pattern

```typescript
import { useErrorStore } from "@/stores/errorStore";

const { captureError, captureException, openErrorModal } = useErrorStore();

// For API errors
if (response.error) {
  const captured = captureError(response.error, { 
    endpoint: "/sites", 
    method: HttpMethod.Post,
    requestBody: { ...data, password: "***" }
  });
  toast.error(response.error.message, {
    action: { label: "View Details", onClick: () => openErrorModal(captured) }
  });
}

// For exceptions
catch (error) {
  const captured = captureException(error, { context: "site creation" });
  toast.error("Operation failed", {
    action: { label: "Details", onClick: () => openErrorModal(captured) }
  });
}
```

### Copy-to-Clipboard Format

```
=== WP Plugin Publish Error ===
Timestamp: 2026-02-01T10:30:00Z
Code: E3002
Message: Authentication failed
Details: WordPress returned 401 Unauthorized

Context:
  site_url: https://example.com
  username: admin

Location: auth.go:45 in validateCredentials

Stack Trace:
  at validateCredentials
     internal/wordpress/auth.go:45
  at TestConnection
     internal/services/site/service.go:78
  at handleTestConnection
     internal/api/handlers/sites.go:112
```

---

## Error Handling Best Practices

### DO

```go
// ✅ Wrap errors with context
if err := db.Query(...); err != nil {
    return appfault.Wrap(
        err, appfault.ErrDatabaseQuery, "failed to fetch sites",
    ).
        WithContext("limit", limit).
        WithContext("offset", offset)
}

// ✅ Use specific error codes
if site == nil {
    return appfault.New(
        appfault.ErrNotFound, "site not found",
    ).
        WithContext("siteId", siteId)
}

// ✅ Validate early
if url == "" {
    return appfault.New(
        appfault.ErrValidationEmpty, "site URL is required",
    )
}

// ✅ Stream progress for long operations
s.broadcastProgress(pluginId, siteId, "packaging", 30, "Building package...")
```

### DON'T

```go
// ❌ Don't swallow errors
result, _ := doSomething()  // Never ignore errors

// ❌ Don't use generic messages
return appfault.New(ErrOperationFailed, "error occurred")  // Too vague

// ❌ Don't log and return
log.Error(err)
return err  // Double logging
```

---

## Next Document

See [14-logging-system.md](./14-logging-system.md) for detailed logging implementation.
