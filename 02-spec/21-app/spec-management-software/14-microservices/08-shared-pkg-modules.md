# Shared Pkg Modules

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The `pkg/` directory contains shared Go packages that provide the architectural foundation for all microservices. These modules ensure consistent error handling, database operations, logging, configuration management, and type definitions across the entire system.

**Cross-References:**
- [Gateway Service](./01-gateway.md)
- [AI Bridge CLI](./12-ai-bridge-cli.md)
- [Voice CLI](./10-voice-cli.md)
- [Nexus-Flow](./09-nexus-flow-standalone-architecture.md)
- [Error Management](../06-error-management/00-overview.md)

---

## Module Overview

```
pkg/
├── errors/          # Structured error handling with stack traces
├── database/        # SQLite connection pooling and dynamic routing
├── logging/         # Structured logging with source attribution
├── config/          # Hierarchical configuration management
├── types/           # Shared DTOs and identifiers
├── middleware/      # Reusable HTTP middleware
├── validation/      # Input validation utilities
├── crypto/          # Encryption and hashing utilities
└── testutil/        # Testing helpers and mocks
```

---

## 1. pkg/errors

Structured error handling with mandatory stack trace capture.

### Core Types

```go
package errors

import (
    "fmt"
    "runtime"
    "strings"
    "time"
)

// StackFrame represents a single frame in the stack trace
type StackFrame struct {
    Function string
    File     string
    Line     int
}

// ErrorDetails holds structured key-value context for errors
type ErrorDetails struct {
    Entries []ErrorDetailEntry
}

// ErrorDetailEntry is a single typed detail
type ErrorDetailEntry struct {
    Key   string
    Value string
}

// NewErrorDetails creates an empty ErrorDetails
func NewErrorDetails() ErrorDetails {
    return ErrorDetails{Entries: make([]ErrorDetailEntry, 0)}
}

// Add appends a typed key-value detail
func (d *ErrorDetails) Add(key, value string) {
    d.Entries = append(d.Entries, ErrorDetailEntry{Key: key, Value: value})
}

// Get retrieves a detail value by key
func (d *ErrorDetails) Get(key string) (string, bool) {
    for _, e := range d.Entries {
        if e.Key == key {
            return e.Value, true
        }
    }
    return "", false
}

// AppError is the standard error type for all services
type AppError struct {
    Code        int
    Constant    string
    Message     string
    Details     ErrorDetails `json:",omitempty"`
    Retryable   bool
    Stack       []StackFrame `json:",omitempty"`
    Cause       error        `json:"-"` // EXEMPTED: AppError internal cause (I-2)
    CauseMsg    string       `json:"cause,omitempty"` // Field name differs from JSON key
    Timestamp   time.Time
    RequestId   string       `json:",omitempty"`
    ServiceName string       `json:"service,omitempty"` // Field name differs from JSON key
}

const (
    DefaultStackDepth = 40
    MaxStackDepth     = 100
)

// NewAppError creates a new AppError with stack trace
func NewAppError(code int, constant, message string) *AppError {
    err := &AppError{
        Code:      code,
        Constant:  constant,
        Message:   message,
        Details:   NewErrorDetails(),
        Timestamp: time.Now().UTC(),
        Stack:     captureStack(2, DefaultStackDepth),
    }
    return err
}

// NewAppErrorf creates a new AppError with formatted message
func NewAppErrorf(code int, constant, format string, args ...string) *AppError {
    return NewAppError(code, constant, fmt.Sprintf(format, toStringArgs(args)...))
}

// toStringArgs converts []string to []any for fmt.Sprintf compatibility (slog exception)
func toStringArgs(args []string) []any {
    result := make([]any, len(args))
    for i, a := range args {
        result[i] = a
    }
    return result
}

// captureStack captures the current stack trace
func captureStack(skip, depth int) []StackFrame {
    if depth > MaxStackDepth {
        depth = MaxStackDepth
    }
    
    frames := make([]StackFrame, 0, depth)
    pcs := make([]uintptr, depth)
    n := runtime.Callers(skip+1, pcs)
    
    callersFrames := runtime.CallersFrames(pcs[:n])
    for {
        frame, more := callersFrames.Next()
        
        // Skip runtime and reflect packages
        if strings.Contains(frame.Function, "runtime.") ||
           strings.Contains(frame.Function, "reflect.") {
            if !more {
                break
            }
            continue
        }
        
        frames = append(frames, StackFrame{
            Function: frame.Function,
            File:     frame.File,
            Line:     frame.Line,
        })
        
        if !more || len(frames) >= depth {
            break
        }
    }
    
    return frames
}

// Error implements the error interface
func (e *AppError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("[%s] %s: %v", e.Constant, e.Message, e.Cause)
    }
    return fmt.Sprintf("[%s] %s", e.Constant, e.Message)
}

// Unwrap returns the underlying cause
func (e *AppError) Unwrap() error {
    return e.Cause
}

// WithDetails adds multiple details to the error
func (e *AppError) WithDetails(details ErrorDetails) *AppError {
    e.Details.Entries = append(e.Details.Entries, details.Entries...)
    return e
}

// WithDetail adds a single typed detail
func (e *AppError) WithDetail(key, value string) *AppError {
    e.Details.Add(key, value)
    return e
}

// WithCause wraps another error
func (e *AppError) WithCause(cause error) *AppError {
    e.Cause = cause
    if cause != nil {
        e.CauseMsg = cause.Error()
    }
    return e
}

// SetRetryable sets the retryable flag
func (e *AppError) SetRetryable(retryable bool) *AppError {
    e.Retryable = retryable
    return e
}

// WithRequestId sets the request ID
func (e *AppError) WithRequestId(requestId string) *AppError {
    e.RequestId = requestId
    return e
}

// WithService sets the service name
func (e *AppError) WithService(service string) *AppError {
    e.ServiceName = service
    return e
}

// Is checks if the error matches a code
func (e *AppError) Is(code int) bool {
    return e.Code == code
}

// IsRetryable returns whether the error is retryable
func (e *AppError) IsRetryable() bool {
    return e.Retryable
}

// ErrorJson is the typed JSON representation of an AppError
type ErrorJson struct {
    Code      int
    Constant  string
    Message   string
    Retryable bool
    Timestamp string
    Details   []ErrorDetailEntry `json:",omitempty"`
    Cause     string             `json:",omitempty"`
    RequestId string             `json:",omitempty"`
    Stack     []string           `json:",omitempty"`
}

// ToJson returns a typed JSON-serializable struct
func (e *AppError) ToJson(includeStack bool) ErrorJson {
    result := ErrorJson{
        Code:      e.Code,
        Constant:  e.Constant,
        Message:   e.Message,
        Retryable: e.Retryable,
        Timestamp: e.Timestamp.Format(time.RFC3339),
        Cause:     e.CauseMsg,
        RequestId: e.RequestId,
    }
    
    if len(e.Details.Entries) > 0 {
        result.Details = e.Details.Entries
    }
    
    if includeStack && len(e.Stack) > 0 {
        stackStrings := make([]string, len(e.Stack))
        for i, frame := range e.Stack {
            stackStrings[i] = fmt.Sprintf("%s (%s:%d)", frame.Function, frame.File, frame.Line)
        }
        result.Stack = stackStrings
    }
    
    return result
}
```

### Error Wrapping Utilities

```go
package errors

import (
    "errors"
    "fmt"
)

// Wrap wraps an error with an AppError
func Wrap(err error, code int, constant, message string) *AppError {
    if err == nil {
        return nil
    }
    
    appErr := NewAppError(code, constant, message)
    appErr.Cause = err
    appErr.CauseMsg = err.Error()
    
    // If wrapping another AppError, inherit details
    var existingAppErr *AppError
    if errors.As(err, &existingAppErr) {
        for _, entry := range existingAppErr.Details.Entries {
            if _, exists := appErr.Details.Get(entry.Key); !exists {
                appErr.Details.Add(entry.Key, entry.Value)
            }
        }
    }
    
    return appErr
}

// Wrapf wraps an error with formatted message
func Wrapf(err error, code int, constant, format string, args ...string) *AppError {
    return Wrap(err, code, constant, fmt.Sprintf(format, toStringArgs(args)...))
}

// AsAppError extracts an AppError from an error chain
func AsAppError(err error) (*AppError, bool) {
    var appErr *AppError
    if errors.As(err, &appErr) {
        return appErr, true
    }
    return nil, false
}

// IsCode checks if error chain contains a specific code
func IsCode(err error, code int) bool {
    appErr, ok := AsAppError(err)
    return ok && appErr.Code == code
}

// GetCode returns the error code or 0
func GetCode(err error) int {
    if appErr, ok := AsAppError(err); ok {
        return appErr.Code
    }
    return 0
}
```

### Service-Specific Error Codes

```go
package errors

// Shared Error Codes (1xxx)
const (
    ERR_VALIDATION_REQUIRED = 1001
    ERR_VALIDATION_FORMAT   = 1002
    ERR_VALIDATION_RANGE    = 1003
    ERR_VALIDATION_LENGTH   = 1004
    ERR_VALIDATION_TYPE     = 1005
    ERR_VALIDATION_UNIQUE   = 1006
    ERR_VALIDATION_BATCH    = 1010
)

// Gateway Error Codes (2xxx)
const (
    ERR_GATEWAY_GENERAL           = 2000
    ERR_GATEWAY_PANIC             = 2001
    ERR_GATEWAY_TIMEOUT           = 2002
    ERR_GATEWAY_UNAUTHORIZED      = 2010
    ERR_GATEWAY_FORBIDDEN         = 2011
    ERR_GATEWAY_TOKEN_EXPIRED     = 2012
    ERR_GATEWAY_TOKEN_INVALID     = 2013
    ERR_GATEWAY_API_KEY_INVALID   = 2014
    ERR_GATEWAY_RATE_LIMITED      = 2020
    ERR_GATEWAY_SERVICE_NOT_FOUND = 2030
    ERR_GATEWAY_SERVICE_UNAVAIL   = 2031
    ERR_GATEWAY_CIRCUIT_OPEN      = 2032
    ERR_GATEWAY_PROXY_ERROR       = 2033
    ERR_GATEWAY_UPSTREAM_ERROR    = 2034
    ERR_GATEWAY_VALIDATION        = 2040
    ERR_GATEWAY_BAD_REQUEST       = 2041
)

// SpecManager Error Codes (3xxx)
const (
    ERR_SPEC_GENERAL        = 3000
    ERR_SPEC_NOT_FOUND      = 3001
    ERR_SPEC_ALREADY_EXISTS = 3002
    ERR_SPEC_INVALID        = 3003
    ERR_SPEC_LOCKED         = 3004
    ERR_PROJECT_NOT_FOUND   = 3010
    ERR_PROJECT_EXISTS      = 3011
    ERR_PROJECT_INVALID     = 3012
    ERR_FILE_NOT_FOUND      = 3020
    ERR_FILE_READ_ERROR     = 3021
    ERR_FILE_WRITE_ERROR    = 3022
    ERR_FILE_DELETE_ERROR   = 3023
    ERR_PATH_TRAVERSAL      = 3030
    ERR_PATH_INVALID        = 3031
)

// Chronicle Error Codes (4xxx)
const (
    ERR_CHRONICLE_GENERAL     = 4000
    ERR_COMMIT_NOT_FOUND      = 4001
    ERR_COMMIT_INVALID        = 4002
    ERR_DIFF_GENERATION       = 4010
    ERR_ROLLBACK_FAILED       = 4011
    ERR_GIT_OPERATION         = 4020
    ERR_GIT_NOT_INITIALIZED   = 4021
)

// Business Logic Error Codes (5xxx)
const (
    ERR_LOGIC_STATE    = 5001
    ERR_LOGIC_LIMIT    = 5002
    ERR_LOGIC_CONFLICT = 5003
    ERR_SPEC_CIRCULAR  = 5011
    ERR_SPEC_MISSING   = 5012
)

// AI-Bridge Error Codes (6xxx)
const (
    ERR_AI_GENERAL              = 6000
    ERR_AI_PROVIDER_UNAVAILABLE = 6001
    ERR_AI_MODEL_NOT_FOUND      = 6002
    ERR_AI_INFERENCE_FAILED     = 6003
    ERR_AI_CONTEXT_EXCEEDED     = 6004
    ERR_AI_RATE_LIMITED         = 6005
    ERR_AI_APP_NOT_FOUND        = 6010
    ERR_AI_APP_EXISTS           = 6011
    ERR_AI_PROJECT_NOT_FOUND    = 6012
    ERR_AI_CONV_NOT_FOUND       = 6013
    ERR_AI_MEMORY_ADD_FAILED    = 6020
    ERR_AI_MEMORY_SEARCH_FAILED = 6021
    ERR_AI_EMBEDDING_FAILED     = 6022
)

// Configuration Error Codes (7xxx)
const (
    ERR_CONFIG_GENERAL   = 7000
    ERR_CONFIG_NOT_FOUND = 7001
    ERR_CONFIG_INVALID   = 7002
    ERR_CONFIG_READONLY  = 7003
)

// Security Error Codes (8xxx)
const (
    ERR_SECURITY_GENERAL    = 8000
    ERR_SECURITY_SSRF       = 8001
    ERR_SECURITY_TRAVERSAL  = 8002
    ERR_SECURITY_PERMISSION = 8003
    ERR_SECURITY_ENCRYPTED  = 8004
)

// System Error Codes (9xxx)
const (
    ERR_SYSTEM_GENERAL    = 9000
    ERR_SYSTEM_DB         = 9001
    ERR_SYSTEM_DISK_FULL  = 9002
    ERR_SYSTEM_MEMORY     = 9003
    ERR_SYSTEM_NETWORK    = 9004
)

// Nexus-Flow Error Codes (10xxx)
const (
    ERR_FLOW_GENERAL         = 10000
    ERR_FLOW_NOT_FOUND       = 10001
    ERR_FLOW_INVALID         = 10002
    ERR_FLOW_EXECUTION       = 10020
    ERR_STAGE_NOT_FOUND      = 10010
    ERR_STAGE_EXECUTION      = 10011
    ERR_PIPELINE_NOT_FOUND   = 10030
    ERR_PIPELINE_RUNNING     = 10031
)

// Voice-CLI Error Codes (11xxx)
const (
    ERR_VOICE_GENERAL          = 11000
    ERR_VOICE_SESSION          = 11001
    ERR_VOICE_TRANSCRIPTION    = 11020
    ERR_VOICE_PROVIDER_UNAVAIL = 11021
    ERR_VOICE_AUDIO_INVALID    = 11022
    ERR_VOICE_COMMAND_UNKNOWN  = 11030
    ERR_VOICE_COMMAND_FAILED   = 11031
)
```

---

## 2. pkg/database

SQLite connection pooling and dynamic project database routing.

### Connection Manager

```go
package database

import (
    "context"
    // ALLOWED: database infrastructure layer — connection pooling and SQLite management
    "database/sql"
    "fmt"
    "path/filepath"
    "sync"
    "time"
    
    _ "github.com/mattn/go-sqlite3"
    
    "github.com/user/pkg/errors"
    "github.com/user/pkg/logging"
)

// ConnectionConfig holds database connection settings
type ConnectionConfig struct {
    MaxOpenConns    int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
    ConnMaxIdleTime time.Duration
    EnableWAL       bool
    BusyTimeout     int // milliseconds
    CacheSize       int // negative = KB, positive = pages
}

// DefaultConfig returns sensible defaults
func DefaultConfig() ConnectionConfig {
    return ConnectionConfig{
        MaxOpenConns:    10,
        MaxIdleConns:    5,
        ConnMaxLifetime: 30 * time.Minute,
        ConnMaxIdleTime: 5 * time.Minute,
        EnableWAL:       true,
        BusyTimeout:     5000,
        CacheSize:       -20000, // 20MB
    }
}

// ConnectionManager manages database connections
type ConnectionManager struct {
    rootPath    string
    config      ConnectionConfig
    connections TypedSyncMap[string, *sql.DB]
    logger      *logging.Logger
    mu          sync.RWMutex
}

// NewConnectionManager creates a new connection manager
func NewConnectionManager(rootPath string, config ConnectionConfig, logger *logging.Logger) *ConnectionManager {
    return &ConnectionManager{
        rootPath: rootPath,
        config:   config,
        logger:   logger,
    }
}

// GetConnection returns a connection to a database
func (cm *ConnectionManager) GetConnection(context stdctx.Context, dbPath string) appfault.Result[*sql.DB] {
    fullPath := cm.resolvePath(dbPath)
    
    // Check cache first
    if conn, ok := cm.connections.Load(fullPath); ok {
        db := conn.(*sql.DB)
        if err := db.PingContext(context); err == nil {
            return db, nil
        }
        // Connection is stale, remove it
        cm.connections.Delete(fullPath)
    }
    
    // Create new connection
    cm.mu.Lock()
    defer cm.mu.Unlock()
    
    // Double-check after acquiring lock
    if conn, ok := cm.connections.Load(fullPath); ok {
        return conn.(*sql.DB), nil
    }
    
    db, err := cm.openDatabase(context, fullPath)
    if err != nil {
        return nil, err
    }
    
    cm.connections.Store(fullPath, db)
    cm.logger.Debug(context, "Database connection opened",
        "path", fullPath,
    )
    
    return db, nil
}

// openDatabase opens a new database connection
func (cm *ConnectionManager) openDatabase(context stdctx.Context, fullPath string) appfault.Result[*sql.DB] {
    dsn := cm.buildDSN(fullPath)
    
    db, err := sql.Open("sqlite3", dsn)
    if err != nil {
        return nil, errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
            "Failed to open database")
    }
    
    // Configure connection pool
    db.SetMaxOpenConns(cm.config.MaxOpenConns)
    db.SetMaxIdleConns(cm.config.MaxIdleConns)
    db.SetConnMaxLifetime(cm.config.ConnMaxLifetime)
    db.SetConnMaxIdleTime(cm.config.ConnMaxIdleTime)
    
    // Enable WAL mode
    if cm.config.EnableWAL {
        if _, err := db.ExecContext(context, "PRAGMA journal_mode=WAL"); err != nil {
            db.Close()
            return nil, errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
                "Failed to enable WAL mode")
        }
    }
    
    // Set cache size
    if _, err := db.ExecContext(context, fmt.Sprintf("PRAGMA cache_size=%d", cm.config.CacheSize)); err != nil {
        cm.logger.Warn(context, "Failed to set cache size", "error", err)
    }
    
    // Verify connection
    if err := db.PingContext(context); err != nil {
        db.Close()
        return nil, errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
            "Failed to ping database")
    }
    
    return db, nil
}

// buildDSN constructs the SQLite DSN
func (cm *ConnectionManager) buildDSN(fullPath string) string {
    return fmt.Sprintf("file:%s?_busy_timeout=%d&_foreign_keys=on&_journal_mode=WAL",
        fullPath, cm.config.BusyTimeout)
}

// resolvePath resolves a database path relative to root
func (cm *ConnectionManager) resolvePath(dbPath string) string {
    if filepath.IsAbs(dbPath) {
        return dbPath
    }
    return filepath.Join(cm.rootPath, dbPath)
}

// Close closes all connections
func (cm *ConnectionManager) Close() error {
    var lastErr error
    cm.connections.Range(func(key, value string, db *sql.DB) bool {
        if err := db.Close(); err != nil {
            lastErr = err
        }
        cm.connections.Delete(key)
        return true
    })
    return lastErr
}

// NOTE: sync.Map callbacks use typed wrappers.
// The underlying sync.Map is wrapped with TypedSyncMap[string, *sql.DB]
// to enforce compile-time type safety. See TypedSyncMap below.

// TypedSyncMap is a generic wrapper around sync.Map for compile-time safety
type TypedSyncMap[K comparable, V any] struct {
    m sync.Map
}

// Store stores a typed key-value pair
func (t *TypedSyncMap[K, V]) Store(key K, value V) {
    t.m.Store(key, value)
}

// Load retrieves a typed value by key
func (t *TypedSyncMap[K, V]) Load(key K) (V, bool) {
    val, ok := t.m.Load(key)
    if !ok {
        var zero V
        return zero, false
    }
    return val.(V), true
}

// Delete removes a key from the map
func (t *TypedSyncMap[K, V]) Delete(key K) {
    t.m.Delete(key)
}

// Range iterates over the map with typed callback
func (t *TypedSyncMap[K, V]) Range(fn func(key K, value V) bool) {
    t.m.Range(func(k, v any) bool {
        return fn(k.(K), v.(V))
    })
}

// HealthCheck checks database health
func (cm *ConnectionManager) HealthCheck(context stdctx.Context, dbPath string) error {
    db, err := cm.GetConnection(context, dbPath)
    if err != nil {
        return err
    }
    
    var result int
    return db.QueryRowContext(context, "SELECT 1").Scan(&result)
}
```

### Transaction Helper

```go
package database

import (
    "context"
    // ALLOWED: database infrastructure layer — transaction helper wrapping sql.Tx
    "database/sql"
    
    "github.com/user/pkg/errors"
)

// TxFunc is a function that runs within a transaction
type TxFunc func(tx *sql.Tx) error

// WithTransaction executes a function within a transaction
func WithTransaction(context stdctx.Context, db *sql.DB, fn TxFunc) error {
    tx, err := db.BeginTx(context, nil)
    if err != nil {
        return errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
            "Failed to begin transaction")
    }
    
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()
    
    if err := fn(tx); err != nil {
        if rbErr := tx.Rollback(); rbErr != nil {
            return errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
                "Transaction failed and rollback error").WithDetail("rollbackError", rbErr.Error())
        }
        return err
    }
    
    if err := tx.Commit(); err != nil {
        return errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
            "Failed to commit transaction")
    }
    
    return nil
}

// WithTransactionResult executes a function within a transaction and returns a result
func WithTransactionResult[T any](context stdctx.Context, db *sql.DB, fn func(tx *sql.Tx) appfault.Result[T]) appfault.Result[T] {
    var result T
    
    tx, err := db.BeginTx(context, nil)
    if err != nil {
        return result, errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
            "Failed to begin transaction")
    }
    
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()
    
    result, err = fn(tx)
    if err != nil {
        tx.Rollback()
        return result, err
    }
    
    if err := tx.Commit(); err != nil {
        return result, errors.Wrap(err, errors.ERR_SYSTEM_DB, "ERR_SYSTEM_DB",
            "Failed to commit transaction")
    }
    
    return result, nil
}
```

### Dynamic Project Database Router

```go
package database

import (
    "context"
    // ALLOWED: database infrastructure layer — dynamic project database routing
    "database/sql"
    "path/filepath"
    "sync"
)

// ProjectDbRouter routes to project-specific databases
type ProjectDbRouter struct {
    connManager *ConnectionManager
    appPath     string
    projectDbs  TypedSyncMap[string, *sql.DB]
    logger      *logging.Logger
}

// NewProjectDbRouter creates a project database router
func NewProjectDbRouter(connManager *ConnectionManager, appPath string, logger *logging.Logger) *ProjectDbRouter {
    return &ProjectDbRouter{
        connManager: connManager,
        appPath:     appPath,
        logger:      logger,
    }
}

// GetProjectDb returns the database for a specific project
func (r *ProjectDbRouter) GetProjectDb(context stdctx.Context, projectId string) appfault.Result[*sql.DB] {
    // Check cache
    if db, ok := r.projectDbs.Load(projectId); ok {
        return db.(*sql.DB), nil
    }
    
    // Build path: {appPath}/projects/{projectId}.db
    dbPath := filepath.Join(r.appPath, "projects", projectId+".db")
    
    db, err := r.connManager.GetConnection(context, dbPath)
    if err != nil {
        return nil, err
    }
    
    r.projectDbs.Store(projectId, db)
    return db, nil
}

// GetAppDb returns the application-level database
func (r *ProjectDbRouter) GetAppDb(context stdctx.Context) appfault.Result[*sql.DB] {
    dbPath := filepath.Join(r.appPath, "app.db")
    return r.connManager.GetConnection(context, dbPath)
}

// ListProjectDbs returns all project database paths
func (r *ProjectDbRouter) ListProjectDbs() []string {
    var paths []string
    r.projectDbs.Range(func(key string, _ *sql.DB) bool {
        paths = append(paths, key)
        return true
    })
    return paths
}
```

---

## 3. pkg/logging

Structured logging with mandatory source attribution.

### Logger

```go
package logging

import (
    "context"
    "io"
    "log/slog"
    "os"
    "runtime"
    "strings"
    "time"
)

// Level represents log levels
type Level = slog.Level

const (
    LevelDebug = slog.LevelDebug
    LevelInfo  = slog.LevelInfo
    LevelWarn  = slog.LevelWarn
    LevelError = slog.LevelError
)

// LoggerConfig holds logger configuration
type LoggerConfig struct {
    Level       Level
    Format      string // "json" or "text"
    Output      io.Writer
    ServiceName string
    Version     string
    AddSource   bool
}

// DefaultConfig returns default logger configuration
func DefaultConfig(serviceName string) LoggerConfig {
    return LoggerConfig{
        Level:       LevelInfo,
        Format:      "json",
        Output:      os.Stdout,
        ServiceName: serviceName,
        AddSource:   true, // CRITICAL: Always include source
    }
}

// Logger wraps slog.Logger with additional functionality
type Logger struct {
    *slog.Logger
    config LoggerConfig
}

// NewLogger creates a new logger
func NewLogger(config LoggerConfig) *Logger {
    var handler slog.Handler
    
    opts := &slog.HandlerOptions{
        Level:     config.Level,
        AddSource: config.AddSource, // CRITICAL: Must be true
        ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
            // Customize source format
            if a.Key == slog.SourceKey {
                if src, ok := a.Value.Any().(*slog.Source); ok {
                    // Shorten file path
                    parts := strings.Split(src.File, "/")
                    if len(parts) > 3 {
                        parts = parts[len(parts)-3:]
                    }
                    src.File = strings.Join(parts, "/")
                }
            }
            return a
        },
    }
    
    output := config.Output
    if output == nil {
        output = os.Stdout
    }
    
    if config.Format == "json" {
        handler = slog.NewJsonHandler(output, opts)
    } else {
        handler = slog.NewTextHandler(output, opts)
    }
    
    // Add default attributes
    handler = handler.WithAttrs([]slog.Attr{
        slog.String("service", config.ServiceName),
        slog.String("version", config.Version),
    })
    
    return &Logger{
        Logger: slog.New(handler),
        config: config,
    }
}

// contextKey for request ID
type contextKey string

const (
    RequestIdKey contextKey = "requestId"
    TraceIdKey   contextKey = "traceId"
    UserIdKey    contextKey = "userId"
)

// Log key constants — no magic strings allowed
const (
    LogKeyRequestId      = "RequestId"
    LogKeyTraceId        = "TraceId"
    LogKeyUserId         = "UserId"
    LogKeyErrorCode      = "ErrorCode"
    LogKeyErrorConstant  = "ErrorConstant"
    LogKeyErrorMessage   = "ErrorMessage"
    LogKeyErrorRetryable = "ErrorRetryable"
    LogKeyStackPreview   = "StackPreview"
)

// WithContext extracts context values and adds them to log attributes
func (l *Logger) WithContext(context context.Context) *slog.Logger {
    attrs := []any{}
    
    requestId := context.Value(RequestIdKey)
    if isDefined(requestId) {
        attrs = append(attrs, LogKeyRequestId, requestId)
    }
    
    traceId := context.Value(TraceIdKey)
    if isDefined(traceId) {
        attrs = append(attrs, LogKeyTraceId, traceId)
    }
    
    userId := context.Value(UserIdKey)
    if isDefined(userId) {
        attrs = append(attrs, LogKeyUserId, userId)
    }
    
    return l.Logger.With(attrs...)
}

// Debug logs a debug message with context
func (l *Logger) Debug(context stdctx.Context, msg string, args ...any) {
    l.WithContext(context).Debug(msg, args...)
}

// Info logs an info message with context
func (l *Logger) Info(context stdctx.Context, msg string, args ...any) {
    l.WithContext(context).Info(msg, args...)
}

// Warn logs a warning message with context
func (l *Logger) Warn(context stdctx.Context, msg string, args ...any) {
    l.WithContext(context).Warn(msg, args...)
}

// Error logs an error message with context and error details
func (l *Logger) Error(context stdctx.Context, msg string, err error, args ...any) {
    logger := l.WithContext(context)
    
    // If it's an AppError, extract details
    var appErr *errors.AppError
    if errors.As(err, &appErr) {
        args = append(args,
            LogKeyErrorCode, appErr.Code,
            LogKeyErrorConstant, appErr.Constant,
            LogKeyErrorMessage, appErr.Message,
            LogKeyErrorRetryable, appErr.Retryable,
        )
        
        if len(appErr.Stack) > 0 {
            // Include first few stack frames
            stackPreview := make([]string, 0, 5)
            for i := 0; i < len(appErr.Stack) && i < 5; i++ {
                frame := appErr.Stack[i]
                stackPreview = append(stackPreview, 
                    fmt.Sprintf("%s (%s:%d)", frame.Function, frame.File, frame.Line))
            }
            args = append(args, LogKeyStackPreview, stackPreview)
        }
    } else if isDefined(err) {
        args = append(args, "error", err.Error())
    }
    
    logger.Error(msg, args...)
}

// LogField represents a single typed log field
type LogField struct {
    Key   string
    Value string
}

// WithFields returns a logger with additional typed fields
func (l *Logger) WithFields(fields []LogField) *Logger {
    args := make([]any, 0, len(fields)*2) // slog variadic exception
    for _, f := range fields {
        args = append(args, f.Key, f.Value)
    }
    
    return &Logger{
        Logger: l.Logger.With(args...),
        config: l.config,
    }
}

// GetCaller returns caller information
func GetCaller(skip int) (function, file string, line int) {
    pc, file, line, ok := runtime.Caller(skip + 1)
    if !ok {
        return "unknown", "unknown", 0
    }
    
    fn := runtime.FuncForPC(pc)
    if fn != nil {
        function = fn.Name()
    }
    
    return function, file, line
}
```

### Log Output Example

```json
{
    "time": "2026-01-30T12:34:56.789Z",
    "level": "ERROR",
    "source": {
        "function": "github.com/user/ai-bridge/internal/inference.(*Service).Complete",
        "file": "internal/inference/service.go",
        "line": 142
    },
    "msg": "Inference failed",
    "service": "ai-bridge",
    "version": "1.0.0",
    "requestId": "req_abc123",
    "traceId": "trace_xyz789",
    "error.code": 6003,
    "error.constant": "ERR_AI_INFERENCE_FAILED",
    "error.message": "Provider returned error",
    "error.retryable": true,
    "error.stack_preview": [
        "github.com/user/ai-bridge/internal/inference.(*Service).Complete (service.go:142)",
        "github.com/user/ai-bridge/internal/api.(*Handler).handleComplete (handler.go:89)",
        "net/http.HandlerFunc.ServeHTTP (server.go:2166)"
    ]
}
```

---

## 4. pkg/config

Hierarchical configuration management with validation.

### Configuration Manager

```go
package config

import (
    "context"
    "encoding/json"
    "fmt"
    "os"
    "path/filepath"
    "reflect"
    "strings"
    "sync"
    
    "github.com/user/pkg/errors"
)

// Source represents a configuration source
type Source int

const (
    SourceDefault Source = iota
    SourceFile
    SourceEnv
    SourceDatabase
    SourceOverride
)

// ConfigValueType enumerates supported config value types
type ConfigValueType byte

const (
    ConfigTypeString ConfigValueType = iota
    ConfigTypeInt
    ConfigTypeFloat
    ConfigTypeBool
    ConfigTypeDuration
)

// ConfigValue holds a configuration value with typed storage
type ConfigValue struct {
    Key          string
    StringValue  string          `json:",omitempty"`
    IntValue     int             `json:",omitempty"`
    FloatValue   float64         `json:",omitempty"`
    BoolValue    bool            `json:",omitempty"`
    ValueType    ConfigValueType
    Type         string
    Source       Source
    Description  string          `json:",omitempty"`
    IsSecret     bool
}

// Manager manages hierarchical configuration
type Manager struct {
    values    map[string]*ConfigValue
    mu        sync.RWMutex
    validator Validator
}

// NewManager creates a new configuration manager
func NewManager() *Manager {
    return &Manager{
        values:    make(map[string]*ConfigValue),
        validator: NewValidator(),
    }
}

// ConfigDefault represents a single typed default config entry
type ConfigDefault struct {
    Key         string
    StringValue string
    IntValue    int
    FloatValue  float64
    BoolValue   bool
    ValueType   ConfigValueType
}

// LoadDefaults loads default configuration values from typed entries
func (m *Manager) LoadDefaults(defaults []ConfigDefault) {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    for _, d := range defaults {
        m.values[d.Key] = &ConfigValue{
            Key:         d.Key,
            StringValue: d.StringValue,
            IntValue:    d.IntValue,
            FloatValue:  d.FloatValue,
            BoolValue:   d.BoolValue,
            ValueType:   d.ValueType,
            Source:      SourceDefault,
        }
    }
}

// JsonConfigNode represents a parsed JSON config node (typed alternative to map[string]interface{})
type JsonConfigNode struct {
    StringValue  string
    FloatValue   float64
    BoolValue    bool
    IsString     bool
    IsFloat      bool
    IsBool       bool
    Children     map[string]JsonConfigNode
}

// LoadFile loads configuration from a JSON file
func (m *Manager) LoadFile(path string) error {
    data, err := pathutil.ReadFile(path)
    if err != nil {
        if pathutil.IsNotExistError(err) {
            return nil // File not found is OK
        }
        return errors.Wrap(err, errors.ERR_CONFIG_INVALID, "ERR_CONFIG_INVALID",
            "Failed to read config file")
    }
    
    root, err := parseJsonConfig(data)
    if err != nil {
        return errors.Wrap(err, errors.ERR_CONFIG_INVALID, "ERR_CONFIG_INVALID",
            "Failed to parse config file")
    }
    
    m.mu.Lock()
    defer m.mu.Unlock()
    
    m.loadNested("", root.Children, SourceFile)
    return nil
}

// loadNested recursively loads nested configuration from typed nodes
func (m *Manager) loadNested(prefix string, data map[string]JsonConfigNode, source Source) {
    for key, node := range data {
        fullKey := key
        if prefix != "" {
            fullKey = prefix + "." + key
        }
        
        if len(node.Children) > 0 {
            m.loadNested(fullKey, node.Children, source)
        } else {
            cv := &ConfigValue{Key: fullKey, Source: source}
            switch {
            case node.IsString:
                cv.StringValue = node.StringValue
                cv.ValueType = ConfigTypeString
                cv.Type = "string"
            case node.IsBool:
                cv.BoolValue = node.BoolValue
                cv.ValueType = ConfigTypeBool
                cv.Type = "bool"
            case node.IsFloat:
                cv.FloatValue = node.FloatValue
                cv.ValueType = ConfigTypeFloat
                cv.Type = "float64"
            }
            m.values[fullKey] = cv
        }
    }
}

// LoadEnv loads configuration from environment variables
func (m *Manager) LoadEnv(prefix string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    prefix = strings.ToUpper(prefix) + "_"
    
    for _, env := range os.Environ() {
        parts := strings.SplitN(env, "=", 2)
        if len(parts) != 2 {
            continue
        }
        
        key, value := parts[0], parts[1]
        if stringutil.IsMissingPrefix(key, prefix) {
            continue
        }
        
        // Convert ENV_VAR_NAME to env.var.name
        configKey := strings.ToLower(strings.ReplaceAll(
            strings.TrimPrefix(key, prefix), "_", "."))
        
        m.values[configKey] = &ConfigValue{
            Key:    configKey,
            Value:  value,
            Type:   "string",
            Source: SourceEnv,
        }
    }
}

// GetValue retrieves a typed ConfigValue by key
func (m *Manager) GetValue(key string) (*ConfigValue, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    cv, ok := m.values[key]
    return cv, ok
}

// GetString retrieves a string configuration value
func (m *Manager) GetString(key string, defaultValue string) string {
    if cv, ok := m.GetValue(key); ok {
        if cv.ValueType == ConfigTypeString {
            return cv.StringValue
        }
        return fmt.Sprintf("%v", cv.FloatValue)
    }
    return defaultValue
}

// GetInt retrieves an integer configuration value
func (m *Manager) GetInt(key string, defaultValue int) int {
    if cv, ok := m.GetValue(key); ok {
        switch cv.ValueType {
        case ConfigTypeInt:
            return cv.IntValue
        case ConfigTypeFloat:
            return int(cv.FloatValue)
        case ConfigTypeString:
            if i, err := strconv.Atoi(cv.StringValue); err == nil {
                return i
            }
        }
    }
    return defaultValue
}

// GetBool retrieves a boolean configuration value
func (m *Manager) GetBool(key string, defaultValue bool) bool {
    if cv, ok := m.GetValue(key); ok {
        switch cv.ValueType {
        case ConfigTypeBool:
            return cv.BoolValue
        case ConfigTypeString:
            return strings.ToLower(cv.StringValue) == "true" || cv.StringValue == "1"
        case ConfigTypeInt:
            return cv.IntValue != 0
        }
    }
    return defaultValue
}

// GetDuration retrieves a duration configuration value
func (m *Manager) GetDuration(key string, defaultValue time.Duration) time.Duration {
    if cv, ok := m.GetValue(key); ok {
        switch cv.ValueType {
        case ConfigTypeString:
            if d, err := time.ParseDuration(cv.StringValue); err == nil {
                return d
            }
        case ConfigTypeInt:
            return time.Duration(cv.IntValue) * time.Second
        case ConfigTypeFloat:
            return time.Duration(cv.FloatValue * float64(time.Second))
        }
    }
    return defaultValue
}

// SetString sets a string configuration value
func (m *Manager) SetString(key, value string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    m.values[key] = &ConfigValue{
        Key:         key,
        StringValue: value,
        ValueType:   ConfigTypeString,
        Type:        "string",
        Source:      SourceOverride,
    }
}

// SetInt sets an integer configuration value
func (m *Manager) SetInt(key string, value int) {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    m.values[key] = &ConfigValue{
        Key:       key,
        IntValue:  value,
        ValueType: ConfigTypeInt,
        Type:      "int",
        Source:    SourceOverride,
    }
}

// SetBool sets a boolean configuration value
func (m *Manager) SetBool(key string, value bool) {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    m.values[key] = &ConfigValue{
        Key:       key,
        BoolValue: value,
        ValueType: ConfigTypeBool,
        Type:      "bool",
        Source:    SourceOverride,
    }
}

// Validate validates configuration against rules
func (m *Manager) Validate(rules []ValidationRule) error {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    return m.validator.Validate(m.values, rules)
}

// All returns all configuration values
func (m *Manager) All() map[string]*ConfigValue {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    result := make(map[string]*ConfigValue)
    for k, v := range m.values {
        if v.IsSecret {
            // Mask secret values
            masked := *v
            masked.Value = "********"
            result[k] = &masked
        } else {
            result[k] = v
        }
    }
    return result
}
```

### Validation Rules

```go
package config

import (
    "fmt"
    "regexp"
)

// ValidationRule defines a configuration validation rule
type ValidationRule struct {
    Key       string
    Required  bool
    Type      string
    MinValue  *float64
    MaxValue  *float64
    Pattern   *regexp.Regexp
    Validator func(value *ConfigValue) error
}

// Validator validates configuration values
type Validator struct{}

// NewValidator creates a new validator
func NewValidator() Validator {
    return Validator{}
}

// Validate validates configuration against rules
func (v Validator) Validate(values map[string]*ConfigValue, rules []ValidationRule) error {
    var errs []string
    
    for _, rule := range rules {
        cv, exists := values[rule.Key]
        
        if rule.Required && !exists {
            errs = append(errs, fmt.Sprintf("%s: required but not set", rule.Key))
            continue
        }
        
        if !exists {
            continue
        }
        
        // Type check
        if rule.Type != "" && cv.Type != rule.Type {
            errs = append(errs, fmt.Sprintf("%s: expected type %s, got %s",
                rule.Key, rule.Type, cv.Type))
        }
        
        // Range check for numbers
        if cv.ValueType == ConfigTypeFloat || cv.ValueType == ConfigTypeInt {
            num := cv.FloatValue
            if cv.ValueType == ConfigTypeInt {
                num = float64(cv.IntValue)
            }
            if rule.MinValue != nil && num < *rule.MinValue {
                errs = append(errs, fmt.Sprintf("%s: value %v is less than minimum %v",
                    rule.Key, num, *rule.MinValue))
            }
            if rule.MaxValue != nil && num > *rule.MaxValue {
                errs = append(errs, fmt.Sprintf("%s: value %v is greater than maximum %v",
                    rule.Key, num, *rule.MaxValue))
            }
        }
        
        // Pattern check for strings
        if cv.ValueType == ConfigTypeString && rule.Pattern != nil {
            if !rule.Pattern.MatchString(cv.StringValue) {
                errs = append(errs, fmt.Sprintf("%s: value does not match pattern %s",
                    rule.Key, rule.Pattern.String()))
            }
        }
        
        // Custom validator
        if rule.Validator != nil {
            if err := rule.Validator(cv); err != nil {
                errs = append(errs, fmt.Sprintf("%s: %v", rule.Key, err))
            }
        }
    }
    
    if len(errs) > 0 {
        details := errors.NewErrorDetails()
        for _, e := range errs {
            details.Add("validation", e)
        }
        return errors.NewAppError(errors.ERR_CONFIG_INVALID, "ERR_CONFIG_INVALID",
            "Configuration validation failed").WithDetails(details)
    }
    
    return nil
}
```

---

## 5. pkg/types

Shared DTOs and identifiers.

### ID Types

```go
package types

import (
    "crypto/rand"
    "encoding/base32"
    "fmt"
    "strings"
    "time"
)

// ID represents a prefixed unique identifier
type ID string

// IDPrefix defines valid ID prefixes
type IdPrefix string

const (
    PrefixApp          IdPrefix = "app_"
    PrefixProject      IdPrefix = "proj_"
    PrefixConversation IdPrefix = "conv_"
    PrefixMessage      IdPrefix = "msg_"
    PrefixMemory       IdPrefix = "mem_"
    PrefixModel        IdPrefix = "mod_"
    PrefixProvider     IdPrefix = "prov_"
    PrefixFlow         IdPrefix = "flow_"
    PrefixStage        IdPrefix = "stg_"
    PrefixTask         IdPrefix = "task_"
    PrefixSpec         IdPrefix = "spec_"
    PrefixCommit       IdPrefix = "cmt_"
    PrefixUser         IdPrefix = "usr_"
    PrefixSession      IdPrefix = "sess_"
    PrefixRequest      IdPrefix = "req_"
)

// NewId generates a new Id with the given prefix
func NewId(prefix IdPrefix) Id {
    timestamp := time.Now().UnixNano()
    randomBytes := make([]byte, 10)
    rand.Read(randomBytes)
    
    encoded := base32.StdEncoding.EncodeToString(randomBytes)
    encoded = strings.ToLower(strings.TrimRight(encoded, "="))
    
    return Id(fmt.Sprintf("%s%d%s", prefix, timestamp/1000000, encoded))
}

// Validate checks if the Id has a valid format
func (id Id) Validate(expectedPrefix IdPrefix) bool {
    return strings.HasPrefix(string(id), string(expectedPrefix)) && len(id) > len(expectedPrefix)+10
}

// String returns the string representation
func (id ID) String() string {
    return string(id)
}

// IsEmpty checks if the ID is empty
func (id ID) IsEmpty() bool {
    return id == ""
}
```

### Common DTOs

```go
package types

import "time"

// Pagination holds pagination information
type Pagination struct {
    Total   int
    Limit   int
    Offset  int
    HasMore bool
}

// NewPagination creates pagination from query params
func NewPagination(total, limit, offset int) Pagination {
    return Pagination{
        Total:   total,
        Limit:   limit,
        Offset:  offset,
        HasMore: offset+limit < total,
    }
}

// ApiResponse is the standard Api response envelope
type ApiResponse[T any] struct {
    Success    bool
    Data       T           `json:",omitempty"`
    Error      *ApiError   `json:",omitempty"`
    Pagination *Pagination `json:",omitempty"`
}

// ApiError is the standard error format
type ApiError struct {
    Code      int
    Constant  string
    Message   string
    Details   []errors.ErrorDetailEntry `json:",omitempty"`
    Retryable bool
    Stack     []string                 `json:",omitempty"`
}

// TimestampedModel contains common timestamp fields
type TimestampedModel struct {
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt *time.Time `json:",omitempty"`
}

// SoftDelete sets the deletion timestamp
func (t *TimestampedModel) SoftDelete() {
    now := time.Now()
    t.DeletedAt = &now
}

// Restore clears the deletion timestamp
func (t *TimestampedModel) Restore() {
    t.DeletedAt = nil
}

// IsDeleted checks if the model is soft deleted
func (t *TimestampedModel) IsDeleted() bool {
    return t.DeletedAt != nil
}

// SortDirection represents sort order
type SortDirection string

const (
    SortAsc  SortDirection = "asc"
    SortDesc SortDirection = "desc"
)

// SortOptions holds sorting configuration
type SortOptions struct {
    Field     string
    Direction SortDirection
}

// FilterOperator represents filter operations
type FilterOperator string

const (
    FilterEq       FilterOperator = "eq"
    FilterNe       FilterOperator = "ne"
    FilterGt       FilterOperator = "gt"
    FilterGte      FilterOperator = "gte"
    FilterLt       FilterOperator = "lt"
    FilterLte      FilterOperator = "lte"
    FilterContains FilterOperator = "contains"
    FilterIn       FilterOperator = "in"
)

// FilterValue represents a typed filter value
type FilterValue struct {
    StringValue string  `json:",omitempty"`
    IntValue    int     `json:",omitempty"`
    FloatValue  float64 `json:",omitempty"`
    BoolValue   bool    `json:",omitempty"`
    IsString    bool
}

// NewStringFilter creates a string-typed filter value
func NewStringFilter(v string) FilterValue {
    return FilterValue{StringValue: v, IsString: true}
}

// NewIntFilter creates an int-typed filter value
func NewIntFilter(v int) FilterValue {
    return FilterValue{IntValue: v}
}

// Filter represents a single filter condition
type Filter struct {
    Field    string
    Operator FilterOperator
    Value    FilterValue
}

// QueryOptions combines pagination, sorting, and filtering
type QueryOptions struct {
    Pagination PaginationRequest
    Sort       []SortOptions     `json:",omitempty"`
    Filters    []Filter          `json:",omitempty"`
}

// PaginationRequest holds pagination request parameters
type PaginationRequest struct {
    Limit  int
    Offset int
}

// Validate validates pagination parameters
func (p *PaginationRequest) Validate(maxLimit int) {
    if p.Limit <= 0 {
        p.Limit = 50
    }
    if p.Limit > maxLimit {
        p.Limit = maxLimit
    }
    if p.Offset < 0 {
        p.Offset = 0
    }
}
```

---

## 6. Usage Example

### Service Initialization

```go
package main

import (
    "context"
    "os"
    
    "github.com/user/pkg/config"
    "github.com/user/pkg/database"
    "github.com/user/pkg/errors"
    "github.com/user/pkg/logging"
)

func main() {
    // Initialize logger (MUST have AddSource: true)
    logConfig := logging.DefaultConfig("ai-bridge")
    logConfig.Version = "1.0.0"
    logger := logging.NewLogger(logConfig)
    
    // Initialize configuration
    cfg := config.NewManager()
    cfg.LoadDefaults([]config.ConfigDefault{
        {Key: "server.port", IntValue: 8090, ValueType: config.ConfigTypeInt},
        {Key: "server.host", StringValue: "0.0.0.0", ValueType: config.ConfigTypeString},
        {Key: "database.rootPath", StringValue: "./data", ValueType: config.ConfigTypeString},
    })
    cfg.LoadFile("config.json")
    cfg.LoadEnv("AI_BRIDGE")
    
    // Validate configuration
    if err := cfg.Validate([]config.ValidationRule{
        {Key: "server.port", Required: true, Type: "float64"},
    }); err != nil {
        logger.Error(context.Background(), "Configuration invalid", err)
        os.Exit(1)
    }
    
    // Initialize database
    dbConfig := database.DefaultConfig()
    connManager := database.NewConnectionManager(
        cfg.GetString("database.rootPath", "./data"),
        dbConfig,
        logger,
    )
    defer connManager.Close()
    
    // Create error with stack trace
    if err := someOperation(); err != nil {
        appErr := errors.Wrap(err, errors.ERR_AI_GENERAL, "ERR_AI_GENERAL",
            "Operation failed").
            WithDetail("operationType", "initialization").
            SetRetryable(false)
        
        logger.Error(context.Background(), "Startup failed", appErr)
        os.Exit(1)
    }
    
    logger.Info(context.Background(), "Service started",
        "port", cfg.GetInt("server.port", 8090),
    )
}
```

---

## Related Specifications

- [Gateway Service](./01-gateway.md)
- [AI Bridge CLI](./12-ai-bridge-cli.md)
- [Error Management](../06-error-management/00-overview.md)
- [Consistency Report](./99-consistency-report.md)
