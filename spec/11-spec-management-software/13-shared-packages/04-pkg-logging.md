# pkg/logging Specification

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Priority:** P0 (Foundational)  

---

## Overview

The `pkg/logging` package provides structured logging using Go's `slog` package. It enforces consistent log formats, supports context propagation for request tracing, and provides HTTP middleware for automatic request logging.

**Cross-References:**
- [Backend Logging Patterns](../06-error-management/02-backend/01-error-codes.md)
- [pkg/types Specification](./03-pkg-types.md)

---

## File Structure

```
pkg/logging/
├── logger.go      # Logger factory & configuration
├── context.go     # Context-aware logging
├── middleware.go  # HTTP middleware
├── fields.go      # Standard field definitions
├── handler.go     # Custom slog handlers
└── logging_test.go
```

---

## Design Goals

1. **Zero allocation** for disabled log levels
2. **Structured output** (JSON in production, text in development)
3. **Context propagation** for distributed tracing
4. **Request scoping** with automatic field injection
5. **Performance** - minimal overhead on hot paths

---

## logger.go

```go
package logging

import (
    stdctx "context"
    "io"
    "log/slog"
    "os"
)

// Level is the logging level
type Level = slog.Level

// Standard levels
const (
    LevelDebug = slog.LevelDebug
    LevelInfo  = slog.LevelInfo
    LevelWarn  = slog.LevelWarn
    LevelError = slog.LevelError
)

// Logger is the main logging interface
type Logger interface {
    Debug(msg string, args ...any)
    Info(msg string, args ...any)
    Warn(msg string, args ...any)
    Error(msg string, args ...any)
    
    // Context-aware logging
    DebugContext(context stdctx.Context, msg string, args ...any)
    InfoContext(context stdctx.Context, msg string, args ...any)
    WarnContext(context stdctx.Context, msg string, args ...any)
    ErrorContext(context stdctx.Context, msg string, args ...any)
    
    // Create child logger with additional fields
    With(args ...any) Logger
    
    // WithGroup creates a named group for fields
    WithGroup(name string) Logger
    
    // Enabled checks if level would be logged
    Enabled(context stdctx.Context, level Level) bool
}

// Config holds logger configuration
type Config struct {
    Level       Level
    Format      Format
    Output      io.Writer
    AddSource   bool      // CRITICAL: Must be true - logs function name and file:line
    ServiceName string
    Version     string
}

// Format specifies output format
type Format string

const (
    FormatJson Format = "json"
    FormatText Format = "text"
)

// CRITICAL REQUIREMENT: AddSource MUST be enabled
// All logs MUST contain:
// - Function name (e.g., "SpecService.CreateSpec")
// - File path (e.g., "/app/internal/specmgr/service.go")
// - Line number (e.g., 142)
//
// Example output:
// {"time":"2026-01-30T10:00:00Z","level":"INFO","source":{"function":"specmgr.(*SpecService).CreateSpec","file":"/app/internal/specmgr/service.go","line":142},"msg":"spec created"}

// Option configures the logger
type Option func(*Config)

// WithLevel sets the minimum log level
func WithLevel(level Level) Option {
    return func(c *Config) {
        c.Level = level
    }
}

// WithFormat sets the output format
func WithFormat(format Format) Option {
    return func(c *Config) {
        c.Format = format
    }
}

// WithOutput sets the output destination
func WithOutput(w io.Writer) Option {
    return func(c *Config) {
        c.Output = w
    }
}

// WithSource enables source file/line logging
func WithSource(enabled bool) Option {
    return func(c *Config) {
        c.AddSource = enabled
    }
}

// WithService sets service metadata
func WithService(name, version string) Option {
    return func(c *Config) {
        c.ServiceName = name
        c.Version = version
    }
}

// DefaultConfig returns sensible defaults
// CRITICAL: AddSource is ALWAYS true - this is mandatory
func DefaultConfig() Config {
    return Config{
        Level:     LevelInfo,
        Format:    FormatJson,
        Output:    os.Stdout,
        AddSource: true, // MANDATORY: Always log function name, file, line number
    }
}

// slogLogger wraps slog.Logger to implement Logger
type slogLogger struct {
    *slog.Logger
}

// New creates a new Logger with the given options
func New(opts ...Option) Logger {
    cfg := DefaultConfig()
    for _, opt := range opts {
        opt(&cfg)
    }
    
    var handler slog.Handler
    
    handlerOpts := &slog.HandlerOptions{
        Level:     cfg.Level,
        AddSource: cfg.AddSource,
        ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
            // Customize time format
            if a.Key == slog.TimeKey {
                return slog.Attr{
                    Key:   "timestamp",
                    Value: a.Value,
                }
            }
            return a
        },
    }
    
    switch cfg.Format {
    case FormatJson:
        handler = slog.NewJsonHandler(cfg.Output, handlerOpts)
    case FormatText:
        handler = slog.NewTextHandler(cfg.Output, handlerOpts)
    default:
        handler = slog.NewJsonHandler(cfg.Output, handlerOpts)
    }
    
    // Wrap with context extractor
    handler = NewContextHandler(handler)
    
    logger := slog.New(handler)
    
    // Add service metadata if configured
    if cfg.ServiceName != "" {
        logger = logger.With(
            slog.String("service", cfg.ServiceName),
            slog.String("version", cfg.Version),
        )
    }
    
    return &slogLogger{Logger: logger}
}

// NewNoop creates a logger that discards all output
func NewNoop() Logger {
    return &slogLogger{
        Logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
    }
}

// Implementation methods
func (l *slogLogger) Debug(msg string, args ...any) { l.Logger.Debug(msg, args...) }
func (l *slogLogger) Info(msg string, args ...any)  { l.Logger.Info(msg, args...) }
func (l *slogLogger) Warn(msg string, args ...any)  { l.Logger.Warn(msg, args...) }
func (l *slogLogger) Error(msg string, args ...any) { l.Logger.Error(msg, args...) }

func (l *slogLogger) DebugContext(context stdctx.Context, msg string, args ...any) {
    l.Logger.DebugContext(context, msg, args...)
}
func (l *slogLogger) InfoContext(context stdctx.Context, msg string, args ...any) {
    l.Logger.InfoContext(context, msg, args...)
}
func (l *slogLogger) WarnContext(context stdctx.Context, msg string, args ...any) {
    l.Logger.WarnContext(context, msg, args...)
}
func (l *slogLogger) ErrorContext(context stdctx.Context, msg string, args ...any) {
    l.Logger.ErrorContext(context, msg, args...)
}

func (l *slogLogger) With(args ...any) Logger {
    return &slogLogger{Logger: l.Logger.With(args...)}
}

func (l *slogLogger) WithGroup(name string) Logger {
    return &slogLogger{Logger: l.Logger.WithGroup(name)}
}

func (l *slogLogger) Enabled(context stdctx.Context, level Level) bool {
    return l.Logger.Enabled(context, level)
}

// Default is the package-level default logger
var Default Logger = New()

// SetDefault replaces the default logger
func SetDefault(l Logger) {
    Default = l
}
```

---

## context.go

```go
package logging

import (
    stdctx "context"
    "log/slog"
)

// Context keys
type contextKey string

const (
    requestIdKey   contextKey = "request_id"
    userIdKey      contextKey = "user_id"
    correlationKey contextKey = "correlation_id"
    spanIdKey      contextKey = "span_id"
    traceIdKey     contextKey = "trace_id"
    logFieldsKey   contextKey = "log_fields"
)

// WithRequestId adds request Id to context
func WithRequestId(context stdctx.Context, requestId string) stdctx.Context {
    return stdctx.WithValue(context, requestIdKey, requestId)
}

// GetRequestId retrieves request Id from context
// EXEMPTED: typed context accessor internal — this IS the centralized cast location (§7.2)
func GetRequestId(context stdctx.Context) string {
    if v := context.Value(requestIdKey); v != nil {
        return v.(string)
    }
    return ""
}

// WithUserId adds user Id to context
func WithUserId(context stdctx.Context, userId string) stdctx.Context {
    return stdctx.WithValue(context, userIdKey, userId)
}

// GetUserId retrieves user Id from context
// EXEMPTED: typed context accessor internal (§7.2)
func GetUserId(context stdctx.Context) string {
    if v := context.Value(userIdKey); v != nil {
        return v.(string)
    }
    return ""
}

// WithCorrelationId adds correlation Id to context
func WithCorrelationId(context stdctx.Context, correlationId string) stdctx.Context {
    return stdctx.WithValue(context, correlationKey, correlationId)
}

// GetCorrelationId retrieves correlation Id from context
// EXEMPTED: typed context accessor internal (§7.2)
func GetCorrelationId(context stdctx.Context) string {
    if v := context.Value(correlationKey); v != nil {
        return v.(string)
    }
    return ""
}

// WithTraceContext adds trace and span Ids
func WithTraceContext(context stdctx.Context, traceId, spanId string) stdctx.Context {
    context = stdctx.WithValue(context, traceIdKey, traceId)
    context = stdctx.WithValue(context, spanIdKey, spanId)
    return context
}

// GetTraceId retrieves trace Id from context
// EXEMPTED: typed context accessor internal (§7.2)
func GetTraceId(context stdctx.Context) string {
    if v := context.Value(traceIdKey); v != nil {
        return v.(string)
    }
    return ""
}

// GetSpanId retrieves span Id from context
// EXEMPTED: typed context accessor internal (§7.2)
func GetSpanId(context stdctx.Context) string {
    if v := context.Value(spanIdKey); v != nil {
        return v.(string)
    }
    return ""
}

// WithFields adds arbitrary log fields to context
func WithFields(context stdctx.Context, fields ...any) stdctx.Context {
    existing := getFields(context)
    combined := make([]any, 0, len(existing)+len(fields))
    combined = append(combined, existing...)
    combined = append(combined, fields...)
    return stdctx.WithValue(context, logFieldsKey, combined)
}

// EXEMPTED: typed context accessor internal — centralized cast for log fields (§7.2)
func getFields(context stdctx.Context) []any {
    if v := context.Value(logFieldsKey); v != nil {
        return v.([]any)
    }
    return nil
}

// ContextHandler extracts context values and adds them to log records
type ContextHandler struct {
    handler slog.Handler
}

// NewContextHandler wraps a handler with context extraction
func NewContextHandler(h slog.Handler) *ContextHandler {
    return &ContextHandler{handler: h}
}

// Enabled delegates to the wrapped handler
func (h *ContextHandler) Enabled(context stdctx.Context, level slog.Level) bool {
    return h.handler.Enabled(context, level)
}

// Handle extracts context values and adds them to the record
func (h *ContextHandler) Handle(context stdctx.Context, r slog.Record) error {
    // Add request Id
    if requestId := GetRequestId(context); requestId != "" {
        r.AddAttrs(slog.String("request_id", requestId))
    }
    
    // Add user Id
    if userId := GetUserId(context); userId != "" {
        r.AddAttrs(slog.String("user_id", userId))
    }
    
    // Add correlation Id
    if correlationId := GetCorrelationId(context); correlationId != "" {
        r.AddAttrs(slog.String("correlation_id", correlationId))
    }
    
    // Add trace context — use typed accessors instead of raw ctx.Value casts
    if traceId := GetTraceId(context); traceId != "" {
        r.AddAttrs(slog.String("trace_id", traceId))
    }
    if spanId := GetSpanId(context); spanId != "" {
        r.AddAttrs(slog.String("span_id", spanId))
    }
    
    // Add custom fields
    if fields := getFields(context); len(fields) > 0 {
        attrs := argsToAttrs(fields)
        r.AddAttrs(attrs...)
    }
    
    return h.handler.Handle(context, r)
}

// WithAttrs returns a new handler with attrs
func (h *ContextHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
    return &ContextHandler{handler: h.handler.WithAttrs(attrs)}
}

// WithGroup returns a new handler with group
func (h *ContextHandler) WithGroup(name string) slog.Handler {
    return &ContextHandler{handler: h.handler.WithGroup(name)}
}

func argsToAttrs(args []any) []slog.Attr {
    var attrs []slog.Attr
    for i := 0; i < len(args); i += 2 {
        if i+1 < len(args) {
            if key, ok := args[i].(string); ok {
                attrs = append(attrs, slog.Any(key, args[i+1]))
            }
        }
    }
    return attrs
}

// Log key constants — no magic strings allowed
const (
    LogKeyRequestId     = "RequestId"
    LogKeyUserId        = "UserId"
    LogKeyErrorCode     = "ErrorCode"
    LogKeyErrorConstant = "ErrorConstant"
    LogKeyErrorMessage  = "ErrorMessage"
    LogKeyStackTrace    = "StackTrace"
)

// FromContext returns a logger with context fields
func FromContext(context context.Context, logger Logger) Logger {
    // Build args from context
    var args []any
    
    requestId := GetRequestId(context)
    if hasContent(requestId) {
        args = append(args, LogKeyRequestId, requestId)
    }
    
    userId := GetUserId(context)
    if hasContent(userId) {
        args = append(args, LogKeyUserId, userId)
    }
    
    fields := getFields(context)
    if len(fields) > 0 {
        args = append(args, fields...)
    }
    
    if len(args) > 0 {
        return logger.With(args...)
    }
    return logger
}
```

---

## middleware.go

```go
package logging

import (
    "net/http"
    "time"
    
    "github.com/google/uuid"
)

// Middleware returns HTTP middleware for request logging
func Middleware(logger Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // Generate or extract request ID
            requestId := r.Header.Get("X-Request-ID")
            if requestId == "" {
                requestId = uuid.New().String()
            }
            
            // Extract correlation ID
            correlationId := r.Header.Get("X-Correlation-ID")
            
            // Add to context
            ctx := WithRequestId(r.Context(), requestId)
            if correlationId != "" {
                ctx = WithCorrelationId(ctx, correlationId)
            }
            
            // Set response header
            w.Header().Set("X-Request-ID", requestId)
            
            // Wrap response writer to capture status
            wrapped := &responseWriter{ResponseWriter: w, status: 200}
            
            // Log request start
            logger.InfoContext(ctx, "request_started",
                "method", r.Method,
                "path", r.URL.Path,
                "remote_addr", r.RemoteAddr,
                "user_agent", r.UserAgent(),
            )
            
            // Call next handler
            next.ServeHTTP(wrapped, r.WithContext(ctx))
            
            // Log request completion
            duration := time.Since(start)
            logger.InfoContext(ctx, "request_completed",
                "method", r.Method,
                "path", r.URL.Path,
                "status", wrapped.status,
                "bytes", wrapped.bytes,
                "duration_ms", duration.Milliseconds(),
            )
        })
    }
}

// responseWriter wraps http.ResponseWriter to capture status
type responseWriter struct {
    http.ResponseWriter
    status int
    bytes  int
}

func (w *responseWriter) WriteHeader(status int) {
    w.status = status
    w.ResponseWriter.WriteHeader(status)
}

func (w *responseWriter) Write(b []byte) (int, error) { // EXEMPTED: http.ResponseWriter stdlib interface
    n, err := w.ResponseWriter.Write(b)
    w.bytes += n
    return n, err
}

// Flush implements http.Flusher
func (w *responseWriter) Flush() {
    if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
        flusher.Flush()
    }
}

// RecoveryMiddleware logs panics and returns 500
func RecoveryMiddleware(logger Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            defer func() {
                if err := recover(); err != nil {
                    logger.ErrorContext(r.Context(), "panic_recovered",
                        "error", err,
                        "method", r.Method,
                        "path", r.URL.Path,
                    )
                    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
                }
            }()
            next.ServeHTTP(w, r)
        })
    }
}

// DebugMiddleware logs detailed request/response info (dev only)
func DebugMiddleware(logger Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Log headers
            logger.DebugContext(r.Context(), "request_headers",
                "headers", r.Header,
            )
            
            next.ServeHTTP(w, r)
        })
    }
}
```

---

## fields.go

```go
package logging

import "log/slog"

// Standard field keys for consistent logging
const (
    // Request fields
    FieldRequestId     = "request_id"
    FieldCorrelationId = "correlation_id"
    FieldUserId        = "user_id"
    FieldMethod        = "method"
    FieldPath          = "path"
    FieldStatus        = "status"
    FieldDuration      = "duration_ms"
    FieldBytes         = "bytes"
    
    // Error fields
    FieldError      = "error"
    FieldErrorCode  = "error_code"
    FieldErrorType  = "error_type"
    FieldStackTrace = "stack_trace"
    
    // Entity fields
    FieldProjectId      = "project_id"
    FieldSpecId         = "spec_id"
    FieldConversationId = "conversation_id"
    FieldBlockId        = "block_id"
    FieldExecutionId    = "execution_id"
    
    // Operation fields
    FieldOperation = "operation"
    FieldComponent = "component"
    FieldAction    = "action"
    
    // Database fields
    FieldQuery    = "query"
    FieldTable    = "table"
    FieldRowCount = "row_count"
    
    // External service fields
    FieldService  = "service"
    FieldEndpoint = "endpoint"
    FieldTimeout  = "timeout"
)

// Err creates an error attribute
func Err(err error) slog.Attr {
    return slog.Any(FieldError, err)
}

// RequestId creates a request ID attribute
func RequestId(id string) slog.Attr {
    return slog.String(FieldRequestId, id)
}

// UserId creates a user ID attribute
func UserId(id string) slog.Attr {
    return slog.String(FieldUserId, id)
}

// ProjectId creates a project ID attribute
func ProjectId(id string) slog.Attr {
    return slog.String(FieldProjectId, id)
}

// Operation creates an operation attribute
func Operation(op string) slog.Attr {
    return slog.String(FieldOperation, op)
}

// Component creates a component attribute
func Component(comp string) slog.Attr {
    return slog.String(FieldComponent, comp)
}

// Duration creates a duration attribute in milliseconds
func Duration(ms int64) slog.Attr {
    return slog.Int64(FieldDuration, ms)
}

// Query creates a database query attribute (sanitized)
func Query(q string) slog.Attr {
    // Truncate long queries
    if len(q) > 500 {
        q = q[:500] + "..."
    }
    return slog.String(FieldQuery, q)
}

// Service creates an external service attribute
func Service(name string) slog.Attr {
    return slog.String(FieldService, name)
}
```

---

## Usage Examples

### Basic Usage

```go
// Create logger
logger := logging.New(
    logging.WithLevel(logging.LevelDebug),
    logging.WithFormat(logging.FormatJson),
    logging.WithService("specmanager", "1.0.0"),
)

// Simple logging
logger.Info("server started", "port", 8080)
logger.Error("database connection failed", logging.Err(err))

// With child logger
dbLogger := logger.With("component", "database")
dbLogger.Debug("query executed", "table", "specs", "rows", 42)
```

### Context-Aware Logging

```go
func HandleRequest(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // Context already has request_id from middleware
    logger.InfoContext(ctx, "processing request")
    
    // Add more context
    ctx = logging.WithUserId(ctx, user.Id)
    ctx = logging.WithFields(ctx, "project_id", projectId)
    
    // All logs will include these fields
    logger.InfoContext(ctx, "loading project")
}
```

### HTTP Server Setup

```go
func main() {
    logger := logging.New(
        logging.WithService("gateway", "1.0.0"),
    )
    
    mux := http.NewServeMux()
    mux.HandleFunc("/api/specs", handleSpecs)
    
    // Apply middleware
    handler := logging.Middleware(logger)(mux)
    handler = logging.RecoveryMiddleware(logger)(handler)
    
    http.ListenAndServe(":8080", handler)
}
```

### Output Format

**JSON Output (Production):**
```json
{
  "Timestamp": "2026-01-30T10:30:00Z",
  "Level": "INFO",
  "Msg": "request_completed",
  "Service": "gateway",
  "Version": "1.0.0",
  "RequestId": "abc-123",
  "Method": "GET",
  "Path": "/api/specs",
  "Status": 200,
  "DurationMs": 45
}
```

**Text Output (Development):**
```
2026-01-30T10:30:00Z INFO request_completed Service=gateway RequestId=abc-123 Method=GET Path=/api/specs Status=200 DurationMs=45
```
