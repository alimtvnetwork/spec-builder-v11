# Build Runner CLI - Observability Specification

**Version:** 4.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

This specification defines the observability infrastructure for the Build Runner CLI (`brun`), including Prometheus metrics, health check endpoints, structured logging, and OpenTelemetry distributed tracing.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Integration API](./09-integration-api.md)
- [gsearch Observability](../../25-gsearch-cli/01-backend/16-observability.md)

---

## Prometheus Metrics

### Metrics Registry

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Build Operation Metrics
    BuildRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "build",
            Name:      "requests_total",
            Help:      "Total number of build requests by runtime and profile",
        },
        []string{"runtime", "profile", "status"},
    )

    BuildLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "brun",
            Subsystem: "build",
            Name:      "latency_seconds",
            Help:      "Build execution latency in seconds",
            Buckets:   []float64{1, 5, 10, 30, 60, 120, 300, 600},
        },
        []string{"runtime", "profile"},
    )

    BuildErrorsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "build",
            Name:      "errors_total",
            Help:      "Total build errors by runtime and error code",
        },
        []string{"runtime", "error_code"},
    )

    BuildSuccessRate = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "build",
            Name:      "success_rate",
            Help:      "Build success rate (0-1) by profile",
        },
        []string{"profile"},
    )

    // Runtime Executor Metrics
    ExecutorInvocationsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "executor",
            Name:      "invocations_total",
            Help:      "Total executor invocations by runtime type",
        },
        []string{"runtime", "command"},
    )

    ExecutorDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "brun",
            Subsystem: "executor",
            Name:      "duration_seconds",
            Help:      "Executor command duration in seconds",
            Buckets:   []float64{0.1, 0.5, 1, 5, 10, 30, 60, 120},
        },
        []string{"runtime"},
    )

    ExecutorTimeoutsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "executor",
            Name:      "timeouts_total",
            Help:      "Total executor timeouts by runtime",
        },
        []string{"runtime"},
    )

    ExecutorActiveProcesses = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "executor",
            Name:      "active_processes",
            Help:      "Number of currently running executor processes",
        },
    )

    // Port Management Metrics
    PortChecksTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "port",
            Name:      "checks_total",
            Help:      "Total port availability checks",
        },
        []string{"status"}, // available, in_use, error
    )

    PortFallbacksTotal = promauto.NewCounter(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "port",
            Name:      "fallbacks_total",
            Help:      "Total times fallback port was used",
        },
    )

    PortFirewallOperationsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "port",
            Name:      "firewall_operations_total",
            Help:      "Total firewall rule operations",
        },
        []string{"operation", "status"}, // operation: add/remove, status: success/error
    )

    // Health Check Metrics
    HealthCheckDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "brun",
            Subsystem: "health",
            Name:      "check_duration_seconds",
            Help:      "Health check duration in seconds",
            Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5},
        },
        []string{"application"},
    )

    HealthCheckRetriesTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "health",
            Name:      "retries_total",
            Help:      "Total health check retry attempts",
        },
        []string{"application"},
    )

    HealthCheckFailuresTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "health",
            Name:      "failures_total",
            Help:      "Total health check failures",
        },
        []string{"application", "reason"},
    )

    ApplicationUptime = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "health",
            Name:      "application_uptime_seconds",
            Help:      "Application uptime in seconds",
        },
        []string{"application"},
    )

    // Asset Operations Metrics
    AssetOperationsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "asset",
            Name:      "operations_total",
            Help:      "Total asset operations by type and mode",
        },
        []string{"operation", "mode"}, // operation: copy/clear, mode: overwrite/skip
    )

    AssetBytesProcessed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "asset",
            Name:      "bytes_processed_total",
            Help:      "Total bytes processed in asset operations",
        },
        []string{"operation"},
    )

    AssetFilesProcessed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "asset",
            Name:      "files_processed_total",
            Help:      "Total files processed in asset operations",
        },
        []string{"operation"},
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "brun",
            Subsystem: "database",
            Name:      "query_duration_seconds",
            Help:      "Database query duration in seconds",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5},
        },
        []string{"operation", "table"},
    )

    DbConnectionsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "database",
            Name:      "connections_active",
            Help:      "Number of active database connections",
        },
    )

    DbSizeBytes = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "database",
            Name:      "size_bytes",
            Help:      "Database file size in bytes",
        },
    )

    RunHistoryCount = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "database",
            Name:      "run_history_count",
            Help:      "Total run history entries in database",
        },
    )

    // Error Parsing Metrics
    ErrorsDetectedTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "parser",
            Name:      "errors_detected_total",
            Help:      "Total errors detected by parser",
        },
        []string{"runtime", "severity"},
    )

    StackTraceCapturedTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "parser",
            Name:      "stack_traces_captured_total",
            Help:      "Total stack traces captured",
        },
        []string{"runtime"},
    )

    // AI Integration Metrics
    AIFixLoopIterations = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Namespace: "brun",
            Subsystem: "ai",
            Name:      "fix_loop_iterations",
            Help:      "Number of iterations in AI fix loop",
            Buckets:   []float64{1, 2, 3, 5, 10, 20},
        },
    )

    AIFixLoopSuccessRate = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "ai",
            Name:      "fix_loop_success_rate",
            Help:      "AI fix loop success rate (0-1)",
        },
    )

    AIConfigGenerationsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "brun",
            Subsystem: "ai",
            Name:      "config_generations_total",
            Help:      "Total AI config generations",
        },
        []string{"status"}, // success, error, validation_failed
    )

    // Process Metrics
    ProcessStartTime = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "process",
            Name:      "start_time_seconds",
            Help:      "Process start time in Unix seconds",
        },
    )

    ProcessMemoryBytes = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "process",
            Name:      "memory_bytes",
            Help:      "Current process memory usage in bytes",
        },
    )

    ProcessGoroutines = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "brun",
            Subsystem: "process",
            Name:      "goroutines",
            Help:      "Current number of goroutines",
        },
    )
)
```

### Metrics Endpoint Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `metrics.enabled` | bool | `true` | Enable Prometheus metrics |
| `metrics.endpoint` | string | `/metrics` | Metrics HTTP endpoint |
| `metrics.port` | int | `9091` | Metrics server port |
| `metrics.basicAuth.enabled` | bool | `false` | Enable basic auth for metrics |
| `metrics.basicAuth.username` | string | `""` | Basic auth username |
| `metrics.basicAuth.passwordHash` | string | `""` | Bcrypt hash of password |

### Metrics Collection Points

| Metric | Collection Point | Labels |
|--------|------------------|--------|
| `build_requests_total` | BuildRunner.Execute() | runtime, profile, status |
| `build_latency_seconds` | BuildRunner.Execute() | runtime, profile |
| `executor_invocations_total` | Executor.Run() | runtime, command |
| `port_checks_total` | PortManager.Check() | status |
| `health_check_duration_seconds` | HealthChecker.Check() | application |
| `asset_operations_total` | AssetCopier.Copy() | operation, mode |
| `db_query_duration_seconds` | GORM callbacks | operation, table |

---

## Health Check Endpoints

### Health Check Interface

```go
package health

import (
    "context"
    "time"
)

// ComponentStatus represents health of a system component with generic metadata
type ComponentStatus[T any] struct {
    Name      string       `json:",omitempty"`
    Status    HealthStatus `json:",omitempty"`
    Message   string       `json:",omitempty"`
    Latency   time.Duration `json:",omitempty"`
    Metadata  *T           `json:",omitempty"`
    CheckedAt time.Time    `json:",omitempty"`
}

// Typed metadata structs for each health checker
type DatabaseMetadata struct {
    OpenConnections int
    InUse           int
    Idle            int
}

type RuntimeMetadata struct {
    Version string
}

type PortMetadata struct {
    UnavailablePorts []int
    TotalChecked     int
}

type DiskMetadata struct {
    Path      string
    FreeMb    int64
    MinReqMb  int64
}

type ApplicationMetadata struct {
    Unhealthy []string
    TotalApps int
}

// Generic Enforce: named type aliases for all business-level instantiations
type DatabaseHealthStatus = ComponentStatus[DatabaseMetadata]
type RuntimeHealthStatus = ComponentStatus[RuntimeMetadata]
type PortHealthStatus = ComponentStatus[PortMetadata]
type DiskHealthStatus = ComponentStatus[DiskMetadata]
type ApplicationHealthStatus = ComponentStatus[ApplicationMetadata]

// HealthStatus enum
type HealthStatus string

const (
    StatusHealthy   HealthStatus = "healthy"
    StatusDegraded  HealthStatus = "degraded"
    StatusUnhealthy HealthStatus = "unhealthy"
)

// HealthResponse is the full health check response
type HealthResponse struct {
    Status     HealthStatus  `json:",omitempty"`
    Version    string        `json:",omitempty"`
    Uptime     time.Duration `json:",omitempty"`
    Components []any         `json:",omitempty"` // ALLOWED: heterogeneous ComponentStatus[T] collection
    CheckedAt  time.Time     `json:",omitempty"`
}

// HealthChecker is a type-erased interface; concrete checkers return ComponentStatus[T]
type HealthChecker interface {
    Name() string
    Check(checkContext context.Context) any // ALLOWED: returns ComponentStatus[T] — type-erased for heterogeneous collection
}
```

### Component Health Checkers

```go
// DatabaseHealthChecker validates SQLite connectivity
type DatabaseHealthChecker struct {
    db *gorm.DB
}

func (d *DatabaseHealthChecker) Name() string { return "database" }

func (d *DatabaseHealthChecker) Check(checkContext context.Context) DatabaseHealthStatus {
    start := time.Now()
    
    sqlDb, dbErr := d.db.DB()
    if dbErr != nil {
        return DatabaseHealthStatus{
            Name:      d.Name(),
            Status:    StatusDegraded,
            Message:   dbErr.Error(),
            CheckedAt: time.Now(),
        }
    }
    
    if pingErr := sqlDb.PingContext(checkContext); pingErr != nil {
        return DatabaseHealthStatus{
            Name:      d.Name(),
            Status:    StatusDown,
            Message:   pingErr.Error(),
            CheckedAt: time.Now(),
        }
    }
    
    stats := sqlDb.Stats()
    return DatabaseHealthStatus{
        Name:    d.Name(),
        Status:  StatusHealthy,
        Latency: time.Since(start),
        Metadata: &DatabaseMetadata{
            OpenConnections: stats.OpenConnections,
            InUse:           stats.InUse,
            Idle:            stats.Idle,
        },
        CheckedAt: time.Now(),
    }
}

// RuntimeHealthChecker validates runtime availability
type RuntimeHealthChecker struct {
    runtime  string
    executor Executor
}

func (r *RuntimeHealthChecker) Name() string { 
    return fmt.Sprintf("runtime_%s", r.runtime) 
}

func (r *RuntimeHealthChecker) Check(checkContext context.Context) RuntimeHealthStatus {
    start := time.Now()
    
    available, version, checkErr := r.executor.CheckAvailability(checkContext)
    if checkErr != nil {
        return RuntimeHealthStatus{
            Name:      r.Name(),
            Status:    StatusUnhealthy,
            Message:   fmt.Sprintf("check failed: %v", checkErr),
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }
    
    if !available {
        return RuntimeHealthStatus{
            Name:      r.Name(),
            Status:    StatusUnhealthy,
            Message:   "runtime not found in PATH",
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }
    
    return RuntimeHealthStatus{
        Name:    r.Name(),
        Status:  StatusHealthy,
        Latency: time.Since(start),
        Metadata: &RuntimeMetadata{
            Version: version,
        },
        CheckedAt: time.Now(),
    }
}

// PortHealthChecker validates port availability
type PortHealthChecker struct {
    portManager *PortManager
    ports       []int
}

func (p *PortHealthChecker) Name() string { return "ports" }

func (p *PortHealthChecker) Check(checkContext context.Context) PortHealthStatus {
    start := time.Now()
    
    unavailable := []int{}
    for _, port := range p.ports {
        if !p.portManager.IsAvailable(port) {
            unavailable = append(unavailable, port)
        }
    }
    
    if len(unavailable) > 0 {
        return PortHealthStatus{
            Name:    p.Name(),
            Status:  StatusDegraded,
            Message: fmt.Sprintf("ports in use: %v", unavailable),
            Latency: time.Since(start),
            Metadata: &PortMetadata{
                UnavailablePorts: unavailable,
                TotalChecked:     len(p.ports),
            },
            CheckedAt: time.Now(),
        }
    }
    
    return PortHealthStatus{
        Name:      p.Name(),
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

// DiskHealthChecker validates disk space availability
type DiskHealthChecker struct {
    paths     []string
    minFreeMB int64
}

func (d *DiskHealthChecker) Name() string { return "disk" }

func (d *DiskHealthChecker) Check(checkContext context.Context) DiskHealthStatus {
    start := time.Now()
    
    for _, path := range d.paths {
        var stat syscall.Statfs_t
        if statErr := syscall.Statfs(path, &stat); statErr != nil {
            return DiskHealthStatus{
                Name:      d.Name(),
                Status:    StatusUnhealthy,
                Message:   fmt.Sprintf("statfs failed for %s: %v", path, statErr),
                Latency:   time.Since(start),
                CheckedAt: time.Now(),
            }
        }
        
        freeMB := int64(stat.Bavail * uint64(stat.Bsize)) / 1024 / 1024
        if freeMB < d.minFreeMB {
            return DiskHealthStatus{
                Name:    d.Name(),
                Status:  StatusDegraded,
                Message: fmt.Sprintf("low disk space: %dMB free", freeMB),
                Latency: time.Since(start),
                Metadata: &DiskMetadata{
                    Path:      path,
                    FreeMB:    freeMB,
                    MinReqMB:  d.minFreeMB,
                },
                CheckedAt: time.Now(),
            }
        }
    }
    
    return DiskHealthStatus{
        Name:      d.Name(),
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

// ApplicationHealthChecker validates managed applications
type ApplicationHealthChecker struct {
    apps          []ApplicationConfig
    healthChecker *AppHealthChecker
}

func (a *ApplicationHealthChecker) Check(checkContext context.Context) ApplicationHealthStatus {
    start := time.Now()
    
    unhealthy := []string{}
    for _, app := range a.apps {
        if !a.healthChecker.IsHealthy(checkContext, app) {
            unhealthy = append(unhealthy, app.Name)
        }
    }
    
    if len(unhealthy) > 0 {
        return ApplicationHealthStatus{
            Name:    "applications",
            Status:  StatusDegraded,
            Message: fmt.Sprintf("unhealthy apps: %v", unhealthy),
            Latency: time.Since(start),
            Metadata: &ApplicationMetadata{
                Unhealthy:    unhealthy,
                TotalApps:   len(a.apps),
            },
            CheckedAt: time.Now(),
        }
    }
    
    return ApplicationHealthStatus{
        Name:      "applications",
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}
```

### Health Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/health` | GET | Basic liveness check | `200 OK` or `503 Service Unavailable` |
| `/health/ready` | GET | Readiness with components | Full `HealthResponse` JSON |
| `/health/live` | GET | Kubernetes liveness probe | `200 OK` if process running |

### Health Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `health.enabled` | bool | `true` | Enable health endpoints |
| `health.port` | int | `8081` | Health server port |
| `health.timeout` | duration | `5s` | Health check timeout |
| `health.disk.minFreeMB` | int64 | `100` | Minimum free disk space |
| `health.disk.paths` | []string | `["./logs", "./data"]` | Paths to check for disk space |
| `health.runtimes` | []string | `["go", "node", "powershell"]` | Runtimes to health check |

### Health Response Example

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptimeSeconds": 3600,
  "components": [
    {
      "name": "database",
      "status": "healthy",
      "latencyMs": 2,
      "metadata": {
        "openConnections": 5,
        "inUse": 1,
        "idle": 4
      },
      "checkedAt": "2026-01-29T12:00:00Z"
    },
    {
      "name": "runtime_go",
      "status": "healthy",
      "latencyMs": 15,
      "metadata": {
        "version": "go1.21.0"
      },
      "checkedAt": "2026-01-29T12:00:00Z"
    },
    {
      "name": "runtime_node",
      "status": "healthy",
      "latencyMs": 12,
      "metadata": {
        "version": "v20.10.0"
      },
      "checkedAt": "2026-01-29T12:00:00Z"
    },
    {
      "name": "runtime_powershell",
      "status": "degraded",
      "message": "runtime not found in PATH",
      "latencyMs": 5,
      "checkedAt": "2026-01-29T12:00:00Z"
    },
    {
      "name": "ports",
      "status": "healthy",
      "latencyMs": 1,
      "checkedAt": "2026-01-29T12:00:00Z"
    },
    {
      "name": "disk",
      "status": "healthy",
      "latencyMs": 1,
      "checkedAt": "2026-01-29T12:00:00Z"
    }
  ],
}
```

---

## OpenTelemetry Tracing

### Tracer Configuration

```go
package tracing

import (
    "context"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
    "go.opentelemetry.io/otel/trace"
)

// TracerConfig holds tracing configuration
type TracerConfig struct {
    Enabled       bool
    ServiceName   string
    Environment   string
    OtlpEndpoint  string
    SamplingRate  float64
    BatchTimeout  string
    ExportTimeout string
}

// InitTracerOutcome wraps the result of tracer initialization
type InitTracerOutcome struct {
    Provider *sdktrace.TracerProvider
    Err      *apperror.AppError
}

// InitTracer initializes OpenTelemetry tracing
func InitTracer(initContext context.Context, cfg TracerConfig) InitTracerOutcome {
    if !cfg.Enabled {
        return InitTracerOutcome{}
    }
    
    client := otlptracegrpc.NewClient(
        otlptracegrpc.WithEndpoint(cfg.OTLPEndpoint),
        otlptracegrpc.WithInsecure(),
    )
    
    exporter, exporterErr := otlptrace.New(initContext, client)
    if exporterErr != nil {
        return InitTracerOutcome{
            Err: apperror.Wrap(exporterErr, "failed to create exporter"),
        }
    }
    
    res, resourceErr := resource.New(initContext,
        resource.WithAttributes(
            semconv.ServiceName(cfg.ServiceName),
            semconv.ServiceVersion("1.0.0"),
            attribute.String("environment", cfg.Environment),
        ),
    )
    if resourceErr != nil {
        return InitTracerOutcome{
            Err: apperror.Wrap(resourceErr, "failed to create resource"),
        }
    }
    
    sampler := sdktrace.ParentBased(
        sdktrace.TraceIdRatioBased(cfg.SamplingRate),
    )
    
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sampler),
    )
    
    otel.SetTracerProvider(tp)
    
    return InitTracerOutcome{Provider: tp}
}
```

### Span Instrumentation

```go
package tracing

// BuildSpan creates a span for build operations
func BuildSpan(buildContext context.Context, profile, runtime string) (context.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    buildContext, span := tracer.Start(buildContext, "build.execute",
        trace.WithAttributes(
            attribute.String("build.profile", profile),
            attribute.String("build.runtime", runtime),
        ),
    )
    return buildContext, span
}

// ExecutorSpan creates a span for executor operations
func ExecutorSpan(executorContext context.Context, runtime, command string) (context.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    executorContext, span := tracer.Start(executorContext, "executor.run",
        trace.WithAttributes(
            attribute.String("executor.runtime", runtime),
            attribute.String("executor.command", command),
        ),
    )
    return executorContext, span
}

// PortCheckSpan creates a span for port operations
func PortCheckSpan(portContext context.Context, port int) (context.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    portContext, span := tracer.Start(portContext, "port.check",
        trace.WithAttributes(
            attribute.Int("port.number", port),
        ),
    )
    return portContext, span
}

// HealthCheckSpan creates a span for health check operations
func HealthCheckSpan(healthContext context.Context, app string) (context.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    healthContext, span := tracer.Start(healthContext, "health.check",
        trace.WithAttributes(
            attribute.String("health.application", app),
        ),
    )
    return healthContext, span
}

// AssetOperationSpan creates a span for asset operations
func AssetOperationSpan(assetContext context.Context, operation, mode string) (context.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    assetContext, span := tracer.Start(assetContext, "asset.operation",
        trace.WithAttributes(
            attribute.String("asset.operation", operation),
            attribute.String("asset.mode", mode),
        ),
    )
    return assetContext, span
}

// ErrorParsingSpan creates a span for error parsing
func ErrorParsingSpan(parserContext context.Context, runtime string) (context.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    parserContext, span := tracer.Start(parserContext, "parser.errors",
        trace.WithAttributes(
            attribute.String("parser.runtime", runtime),
        ),
    )
    return parserContext, span
}
```

### Tracing Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `tracing.enabled` | bool | `false` | Enable OpenTelemetry tracing |
| `tracing.serviceName` | string | `"brun"` | Service name for traces |
| `tracing.environment` | string | `"development"` | Environment tag |
| `tracing.otlpEndpoint` | string | `"localhost:4317"` | OTLP gRPC endpoint |
| `tracing.samplingRate` | float64 | `0.1` | Sampling rate (0-1) |
| `tracing.batchTimeout` | duration | `5s` | Batch export timeout |
| `tracing.exportTimeout` | duration | `30s` | Export timeout |

---

## Structured Logging

### Logger Configuration

```go
package logging

import (
    "os"
    
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

// LogConfig holds logging configuration
type LogConfig struct {
    Level      string // debug, info, warn, error
    Format     string // json, console
    OutputPath string // stdout, stderr, or file path
    ErrorPath  string // stderr or file path for errors
}

// InitLoggerOutcome wraps the result of logger initialization
type InitLoggerOutcome struct {
    Logger *zap.Logger
    Err    *apperror.AppError
}

// InitLogger initializes the structured logger
func InitLogger(cfg LogConfig) InitLoggerOutcome {
    level, levelErr := zapcore.ParseLevel(cfg.Level)
    if levelErr != nil {
        level = zapcore.InfoLevel
    }
    
    var encoder zapcore.Encoder
    encoderConfig := zap.NewProductionEncoderConfig()
    encoderConfig.TimeKey = "timestamp"
    encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
    
    if cfg.Format == "console" {
        encoder = zapcore.NewConsoleEncoder(encoderConfig)
    } else {
        encoder = zapcore.NewJsonEncoder(encoderConfig)
    }
    
    // Output destinations
    var output zapcore.WriteSyncer
    if cfg.OutputPath == "stdout" {
        output = zapcore.AddSync(os.Stdout)
    } else if cfg.OutputPath == "stderr" {
        output = zapcore.AddSync(os.Stderr)
    } else {
        file, fileErr := os.OpenFile(cfg.OutputPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
        if fileErr != nil {
            return InitLoggerOutcome{
                Err: apperror.Wrap(fileErr, "failed to open log file"),
            }
        }
        output = zapcore.AddSync(file)
    }
    
    core := zapcore.NewCore(encoder, output, level)
    logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
    
    return InitLoggerOutcome{Logger: logger}
}
```

### Logging Fields

```go
// Standard log fields for brun operations
type BuildLogFields struct {
    RunId     string
    Profile   string
    Runtime   string
    Command   string
    WorkDir   string
    ExitCode  int
    DurationMs int64
    ErrorCode int `json:",omitempty"`
}

type PortLogFields struct {
    Port       int
    Status     string // available, in_use, error
    FallbackTo int    `json:",omitempty"`
}

type HealthLogFields struct {
    Application string
    Endpoint    string
    StatusCode  int
    Healthy     bool
    Retries     int
}

type AssetLogFields struct {
    Operation string // copy, clear
    Mode      string // overwrite, skip
    Source    string
    Target    string
    Files     int
    Bytes     int64
}

type ErrorLogFields struct {
    ErrorCode   int
    ErrorMsg    string
    Runtime     string
    StackTrace  string   `json:",omitempty"`
    SourceFiles []string `json:",omitempty"`
}
```

### Log Examples

```json
// Build start
{
  "level": "info",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "caller": "runner/build.go:45",
  "msg": "build started",
  "runId": "run-abc123",
  "profile": "backend-api",
  "runtime": "go",
  "workdir": "/app/cmd/api"
}

// Build success
{
  "level": "info",
  "timestamp": "2026-01-29T12:00:30.000Z",
  "caller": "runner/build.go:120",
  "msg": "build completed",
  "runId": "run-abc123",
  "profile": "backend-api",
  "runtime": "go",
  "exitCode": 0,
  "durationMs": 30000
}

// Build error
{
  "level": "error",
  "timestamp": "2026-01-29T12:00:15.000Z",
  "caller": "runner/build.go:95",
  "msg": "build failed",
  "RunId": "run-abc123",
  "Profile": "backend-api",
  "Runtime": "go",
  "ExitCode": 1,
  "ErrorCode": 7401,
  "ErrorMsg": "undefined: someFunction",
  "StackTrace": "main.go:25: undefined: someFunction",
  "SourceFiles": ["main.go"]
}

// Port check
{
  "level": "info",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "caller": "port/manager.go:32",
  "msg": "port check completed",
  "port": 8080,
  "status": "in_use",
  "fallbackTo": 8081
}

// Health check
{
  "level": "warn",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "caller": "health/checker.go:58",
  "msg": "health check failed",
  "application": "api-server",
  "endpoint": "http://localhost:8080/health",
  "statusCode": 503,
  "healthy": false,
  "retries": 3
}
```

### Logging Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `logging.level` | string | `"info"` | Log level (debug, info, warn, error) |
| `logging.format` | string | `"json"` | Output format (json, console) |
| `logging.outputPath` | string | `"stdout"` | Log output destination |
| `logging.errorPath` | string | `"stderr"` | Error log destination |
| `logging.includeStackTrace` | bool | `true` | Include stack traces for errors |
| `logging.shellCommands` | bool | `true` | Log shell commands executed |

---

## Grafana Dashboard

### Dashboard JSON

```json
{
  "title": "brun CLI Metrics",
  "uid": "brun-metrics",
  "panels": [
    {
      "title": "Build Requests/sec",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(brun_build_requests_total[5m])",
          "legendFormat": "{{runtime}} - {{status}}"
        }
      ]
    },
    {
      "title": "Build Latency (p95)",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(brun_build_latency_seconds_bucket[5m]))",
          "legendFormat": "{{runtime}}"
        }
      ]
    },
    {
      "title": "Build Success Rate",
      "type": "gauge",
      "targets": [
        {
          "expr": "sum(rate(brun_build_requests_total{status=\"success\"}[5m])) / sum(rate(brun_build_requests_total[5m]))"
        }
      ]
    },
    {
      "title": "Active Executor Processes",
      "type": "stat",
      "targets": [
        {
          "expr": "brun_executor_active_processes"
        }
      ]
    },
    {
      "title": "Executor Timeouts",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(brun_executor_timeouts_total[5m])",
          "legendFormat": "{{runtime}}"
        }
      ]
    },
    {
      "title": "Port Fallbacks",
      "type": "stat",
      "targets": [
        {
          "expr": "increase(brun_port_fallbacks_total[1h])"
        }
      ]
    },
    {
      "title": "Health Check Failures",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(brun_health_failures_total[5m])",
          "legendFormat": "{{application}}"
        }
      ]
    },
    {
      "title": "Database Size",
      "type": "stat",
      "targets": [
        {
          "expr": "brun_database_size_bytes / 1024 / 1024",
          "legendFormat": "MB"
        }
      ]
    },
    {
      "title": "AI Fix Loop Iterations",
      "type": "histogram",
      "targets": [
        {
          "expr": "histogram_quantile(0.50, rate(brun_ai_fix_loop_iterations_bucket[5m]))"
        }
      ]
    },
    {
      "title": "Errors Detected by Runtime",
      "type": "piechart",
      "targets": [
        {
          "expr": "sum by(runtime) (increase(brun_parser_errors_detected_total[24h]))"
        }
      ]
    }
  ]
}
```

---

## Alerting Rules

### Prometheus Alerting Rules

```yaml
groups:
  - name: brun_alerts
    rules:
      - alert: HighBuildFailureRate
        expr: |
          (
            sum(rate(brun_build_requests_total{status="error"}[5m])) /
            sum(rate(brun_build_requests_total[5m]))
          ) > 0.3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High build failure rate detected"
          description: "Build failure rate is {{ $value | humanizePercentage }}"

      - alert: ExecutorTimeout
        expr: increase(brun_executor_timeouts_total[15m]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Multiple executor timeouts"
          description: "{{ $value }} executor timeouts in the last 15 minutes"

      - alert: AllRuntimesUnavailable
        expr: |
          count(brun_health_status{component=~"runtime_.*"} == 1) == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "No runtimes available"
          description: "All runtime health checks are failing"

      - alert: DiskSpaceLow
        expr: brun_health_disk_free_mb < 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Only {{ $value }}MB disk space remaining"

      - alert: DatabaseConnectionsExhausted
        expr: brun_database_connections_active >= 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Database connections nearly exhausted"
          description: "{{ $value }} active database connections"

      - alert: HighPortFallbackRate
        expr: increase(brun_port_fallbacks_total[1h]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Frequent port fallbacks"
          description: "{{ $value }} port fallbacks in the last hour"
```

---

## See Also

- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Integration API](./09-integration-api.md)
- [Testing Strategy](./13-testing-strategy.md)
- [gsearch Observability](../../25-gsearch-cli/01-backend/16-observability.md)
