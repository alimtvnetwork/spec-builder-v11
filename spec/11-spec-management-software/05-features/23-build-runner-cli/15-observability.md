# Build Runner CLI - Observability Specification

**Version:** 3.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

This specification defines the observability infrastructure for the Build Runner CLI (`brun`), including Prometheus metrics, health check endpoints, structured logging, and OpenTelemetry distributed tracing.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Integration API](./09-integration-api.md)
- [gsearch Observability](../22-golang-search-cli/16-observability.md)

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
    stdctx "context"
    "time"
)

// ComponentStatus represents health of a system component with generic metadata
type ComponentStatus[T any] struct {
    Name      string
    Status    HealthStatus
    Message   string        `json:",omitempty"`
    Latency   time.Duration `json:"latency_ms"`   // EXEMPTED: API contract
    Metadata  *T            `json:",omitempty"`
    CheckedAt time.Time     `json:"checked_at"`    // EXEMPTED: API contract
}

// Typed metadata structs for each health checker
type DatabaseMetadata struct {
    OpenConnections int `json:"open_connections"` // EXEMPTED: API contract
    InUse           int `json:"in_use"`           // EXEMPTED: API contract
    Idle            int
}

type RuntimeMetadata struct {
    Version string
}

type PortMetadata struct {
    UnavailablePorts []int `json:"unavailable_ports"` // EXEMPTED: API contract
    TotalChecked     int   `json:"total_checked"`     // EXEMPTED: API contract
}

type DiskMetadata struct {
    Path      string
    FreeMb    int64 `json:"free_mb"`     // EXEMPTED: API contract
    MinReqMb  int64 `json:"min_req_mb"`  // EXEMPTED: API contract
}

type ApplicationMetadata struct {
    Unhealthy []string
    TotalApps int      `json:"total_apps"` // EXEMPTED: API contract
}

// HealthStatus enum — byte/iota for Go standards compliance
type HealthStatus byte

const (
    StatusHealthy   HealthStatus = iota
    StatusDegraded
    StatusUnhealthy
)

func (h HealthStatus) String() string {
    switch h {
    case StatusHealthy:
        return "healthy"

    case StatusDegraded:
        return "degraded"

    case StatusUnhealthy:
        return "unhealthy"

    default:
        return "unknown"
    }
}

// HealthResponse is the full health check response
type HealthResponse struct {
    Status     HealthStatus
    Version    string
    Uptime     time.Duration `json:"uptime_seconds"` // EXEMPTED: API contract
    Components []any         // ALLOWED: heterogeneous ComponentStatus[T] collection
    CheckedAt  time.Time     `json:"checked_at"`     // EXEMPTED: API contract
}

// HealthChecker is a type-erased interface; concrete checkers return ComponentStatus[T]
type HealthChecker interface {
    Name() string
    Check(context stdctx.Context) any // ALLOWED: returns ComponentStatus[T] — type-erased for heterogeneous collection
}
```

### Component Health Checkers

```go
// DatabaseHealthChecker validates SQLite connectivity
type DatabaseHealthChecker struct {
    db *gorm.DB
}

func (d *DatabaseHealthChecker) Name() string { return "database" }

func (d *DatabaseHealthChecker) Check(context stdctx.Context) ComponentStatus[DatabaseMetadata] {
    start := time.Now()

    return d.checkConnectivity(context, start)
}

func (d *DatabaseHealthChecker) checkConnectivity(context stdctx.Context, start time.Time) ComponentStatus[DatabaseMetadata] {
    sqlDb, err := d.db.DB()
    if err != nil {
        return d.unhealthyStatus(start, "failed to get db: "+err.Error())
    }

    if err := sqlDb.PingContext(context); err != nil {
        return d.unhealthyStatus(start, "ping failed: "+err.Error())
    }

    return d.buildHealthyStatus(sqlDb, start)
}

func (d *DatabaseHealthChecker) unhealthyStatus(start time.Time, message string) ComponentStatus[DatabaseMetadata] {
    return ComponentStatus[DatabaseMetadata]{
        Name:      d.Name(),
        Status:    StatusUnhealthy,
        Message:   message,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

func (d *DatabaseHealthChecker) buildHealthyStatus(sqlDb *sql.DB, start time.Time) ComponentStatus[DatabaseMetadata] {
    stats := sqlDb.Stats()

    return ComponentStatus[DatabaseMetadata]{
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

func (r *RuntimeHealthChecker) Check(context stdctx.Context) ComponentStatus[RuntimeMetadata] {
    start := time.Now()

    available, version, err := r.executor.CheckAvailability(context)
    if err != nil {
        return r.failedStatus(start, "check failed: "+err.Error())
    }

    isMissing := !available

    if isMissing {
        return r.failedStatus(start, "runtime not found in PATH")
    }

    return ComponentStatus[RuntimeMetadata]{
        Name:    r.Name(),
        Status:  StatusHealthy,
        Latency: time.Since(start),
        Metadata: &RuntimeMetadata{
            Version: version,
        },
        CheckedAt: time.Now(),
    }
}

func (r *RuntimeHealthChecker) failedStatus(start time.Time, message string) ComponentStatus[RuntimeMetadata] {
    return ComponentStatus[RuntimeMetadata]{
        Name:      r.Name(),
        Status:    StatusUnhealthy,
        Message:   message,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

// PortHealthChecker validates port availability
type PortHealthChecker struct {
    portManager *PortManager
    ports       []int
}

func (p *PortHealthChecker) Name() string { return "ports" }

func (p *PortHealthChecker) Check(context stdctx.Context) ComponentStatus[PortMetadata] {
    start := time.Now()

    unavailable := p.findUnavailablePorts()
    hasUnavailable := len(unavailable) > 0

    if hasUnavailable {
        return ComponentStatus[PortMetadata]{
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

    return ComponentStatus[PortMetadata]{
        Name:      p.Name(),
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

func (p *PortHealthChecker) findUnavailablePorts() []int {
    unavailable := []int{}

    for _, port := range p.ports {
        isUnavailable := p.portManager.IsUnavailable(port)

        if isUnavailable {
            unavailable = append(unavailable, port)
        }
    }

    return unavailable
}

// DiskHealthChecker validates disk space availability
type DiskHealthChecker struct {
    paths     []string
    minFreeMb int64
}

func (d *DiskHealthChecker) Name() string { return "disk" }

func (d *DiskHealthChecker) Check(context stdctx.Context) ComponentStatus[DiskMetadata] {
    start := time.Now()

    return d.checkAllPaths(start)
}

func (d *DiskHealthChecker) checkAllPaths(start time.Time) ComponentStatus[DiskMetadata] {
    for _, path := range d.paths {
        result := d.checkPath(path, start)
        isNotHealthy := result.Status != StatusHealthy

        if isNotHealthy {
            return result
        }
    }

    return ComponentStatus[DiskMetadata]{
        Name:      d.Name(),
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

func (d *DiskHealthChecker) checkPath(path string, start time.Time) ComponentStatus[DiskMetadata] {
    var stat syscall.Statfs_t
    if err := syscall.Statfs(path, &stat); err != nil {
        return ComponentStatus[DiskMetadata]{
            Name:      d.Name(),
            Status:    StatusUnhealthy,
            Message:   fmt.Sprintf("statfs failed for %s: %v", path, err),
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }

    freeMb := int64(stat.Bavail * uint64(stat.Bsize)) / 1024 / 1024
    isLowDiskSpace := freeMb < d.minFreeMb

    if isLowDiskSpace {
        return ComponentStatus[DiskMetadata]{
            Name:    d.Name(),
            Status:  StatusDegraded,
            Message: fmt.Sprintf("low disk space: %dMB free", freeMb),
            Latency: time.Since(start),
            Metadata: &DiskMetadata{
                Path:     path,
                FreeMb:   freeMb,
                MinReqMb: d.minFreeMb,
            },
            CheckedAt: time.Now(),
        }
    }

    return ComponentStatus[DiskMetadata]{
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

func (a *ApplicationHealthChecker) Check(context stdctx.Context) ComponentStatus[ApplicationMetadata] {
    start := time.Now()

    unhealthy := a.findUnhealthyApps(context)
    hasUnhealthy := len(unhealthy) > 0

    if hasUnhealthy {
        return ComponentStatus[ApplicationMetadata]{
            Name:    "applications",
            Status:  StatusDegraded,
            Message: fmt.Sprintf("unhealthy apps: %v", unhealthy),
            Latency: time.Since(start),
            Metadata: &ApplicationMetadata{
                Unhealthy: unhealthy,
                TotalApps: len(a.apps),
            },
            CheckedAt: time.Now(),
        }
    }

    return ComponentStatus[ApplicationMetadata]{
        Name:      "applications",
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

func (a *ApplicationHealthChecker) findUnhealthyApps(context stdctx.Context) []string {
    unhealthy := []string{}

    for _, app := range a.apps {
        isUnhealthy := a.healthChecker.IsUnhealthy(context, app)

        if isUnhealthy {
            unhealthy = append(unhealthy, app.Name)
        }
    }

    return unhealthy
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
  "uptime_seconds": 3600,
  "components": [
    {
      "name": "database",
      "status": "healthy",
      "latency_ms": 2,
      "metadata": {
        "open_connections": 5,
        "in_use": 1,
        "idle": 4
      },
      "checked_at": "2026-01-29T12:00:00Z"
    },
    {
      "name": "runtime_go",
      "status": "healthy",
      "latency_ms": 15,
      "metadata": {
        "version": "go1.21.0"
      },
      "checked_at": "2026-01-29T12:00:00Z"
    },
    {
      "name": "runtime_node",
      "status": "healthy",
      "latency_ms": 12,
      "metadata": {
        "version": "v20.10.0"
      },
      "checked_at": "2026-01-29T12:00:00Z"
    },
    {
      "name": "runtime_powershell",
      "status": "degraded",
      "message": "runtime not found in PATH",
      "latency_ms": 5,
      "checked_at": "2026-01-29T12:00:00Z"
    },
    {
      "name": "ports",
      "status": "healthy",
      "latency_ms": 1,
      "checked_at": "2026-01-29T12:00:00Z"
    },
    {
      "name": "disk",
      "status": "healthy",
      "latency_ms": 1,
      "checked_at": "2026-01-29T12:00:00Z"
    }
  ],
  "checked_at": "2026-01-29T12:00:00Z"
}
```

---

## OpenTelemetry Tracing

### Tracer Configuration

```go
package tracing

import (
    stdctx "context"
    
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
    IsEnabled     bool
    ServiceName   string
    Environment   string
    OtlpEndpoint  string
    SamplingRate  float64
    BatchTimeout  string
    ExportTimeout string
}

// InitTracer initializes OpenTelemetry tracing
func InitTracer(context stdctx.Context, cfg TracerConfig) apperror.Result[*sdktrace.TracerProvider] {
    isDisabled := !cfg.IsEnabled

    if isDisabled {
        return apperror.Ok[*sdktrace.TracerProvider](nil)
    }

    return initTracerProvider(context, cfg)
}

func initTracerProvider(context stdctx.Context, cfg TracerConfig) apperror.Result[*sdktrace.TracerProvider] {
    client := otlptracegrpc.NewClient(
        otlptracegrpc.WithEndpoint(cfg.OtlpEndpoint),
        otlptracegrpc.WithInsecure(),
    )

    exporter, err := otlptrace.New(context, client)
    if err != nil {
        return apperror.Fail[*sdktrace.TracerProvider](
            apperror.Wrap(err, "failed to create exporter").WithSkip(1),
        )
    }

    res, err := resource.New(context,
        resource.WithAttributes(
            semconv.ServiceName(cfg.ServiceName),
            semconv.ServiceVersion("1.0.0"),
            attribute.String("environment", cfg.Environment),
        ),
    )
    if err != nil {
        return apperror.Fail[*sdktrace.TracerProvider](
            apperror.Wrap(err, "failed to create resource").WithSkip(1),
        )
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

    return apperror.Ok(tp)
}
```

### Span Instrumentation

```go
package tracing

// BuildSpan creates a span for build operations
func BuildSpan(context stdctx.Context, profile, runtime string) (stdctx.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    context, span := tracer.Start(context, "build.execute",
        trace.WithAttributes(
            attribute.String("build.profile", profile),
            attribute.String("build.runtime", runtime),
        ),
    )

    return context, span
}

// ExecutorSpan creates a span for executor operations
func ExecutorSpan(context stdctx.Context, runtime, command string) (stdctx.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    context, span := tracer.Start(context, "executor.run",
        trace.WithAttributes(
            attribute.String("executor.runtime", runtime),
            attribute.String("executor.command", command),
        ),
    )

    return context, span
}

// PortCheckSpan creates a span for port operations
func PortCheckSpan(context stdctx.Context, port int) (stdctx.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    context, span := tracer.Start(context, "port.check",
        trace.WithAttributes(
            attribute.Int("port.number", port),
        ),
    )

    return context, span
}

// HealthCheckSpan creates a span for health check operations
func HealthCheckSpan(context stdctx.Context, app string) (stdctx.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    context, span := tracer.Start(context, "health.check",
        trace.WithAttributes(
            attribute.String("health.application", app),
        ),
    )

    return context, span
}

// AssetOperationSpan creates a span for asset operations
func AssetOperationSpan(context stdctx.Context, operation, mode string) (stdctx.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    context, span := tracer.Start(context, "asset.operation",
        trace.WithAttributes(
            attribute.String("asset.operation", operation),
            attribute.String("asset.mode", mode),
        ),
    )

    return context, span
}

// ErrorParsingSpan creates a span for error parsing
func ErrorParsingSpan(context stdctx.Context, runtime string) (stdctx.Context, trace.Span) {
    tracer := otel.Tracer("brun")
    context, span := tracer.Start(context, "parser.errors",
        trace.WithAttributes(
            attribute.String("parser.runtime", runtime),
        ),
    )

    return context, span
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

// InitLogger initializes the structured logger
func InitLogger(cfg LogConfig) apperror.Result[*zap.Logger] {
    level, err := zapcore.ParseLevel(cfg.Level)
    if err != nil {
        level = zapcore.InfoLevel
    }

    encoder := buildEncoder(cfg)
    output := resolveOutput(cfg)

    if output.Err != nil {
        return apperror.Fail[*zap.Logger](output.Err)
    }

    core := zapcore.NewCore(encoder, output.Value, level)
    logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))

    return apperror.Ok(logger)
}

func buildEncoder(cfg LogConfig) zapcore.Encoder {
    encoderConfig := zap.NewProductionEncoderConfig()
    encoderConfig.TimeKey = "timestamp"
    encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

    isConsoleFormat := cfg.Format == "console"

    if isConsoleFormat {
        return zapcore.NewConsoleEncoder(encoderConfig)
    }

    return zapcore.NewJsonEncoder(encoderConfig)
}

func resolveOutput(cfg LogConfig) apperror.Result[zapcore.WriteSyncer] {
    isStdout := cfg.OutputPath == "stdout"
    isStderr := cfg.OutputPath == "stderr"

    if isStdout {
        return apperror.Ok[zapcore.WriteSyncer](zapcore.AddSync(os.Stdout))
    }

    if isStderr {
        return apperror.Ok[zapcore.WriteSyncer](zapcore.AddSync(os.Stderr))
    }

    file, err := pathutil.OpenFile(cfg.OutputPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    if err != nil {
        return apperror.Fail[zapcore.WriteSyncer](
            apperror.Wrap(err, "failed to open log file").WithSkip(1),
        )
    }

    return apperror.Ok[zapcore.WriteSyncer](zapcore.AddSync(file))
}
```

### Logging Fields

```go
// Standard log fields for brun operations
// EXEMPTED: Structured log format — snake_case keys required by log aggregation
type BuildLogFields struct {
    RunId     string `json:"run_id"`
    Profile   string
    Runtime   string
    Command   string
    WorkDir   string `json:"workdir"`
    ExitCode  int    `json:"exit_code"`
    Duration  int64  `json:"duration_ms"`
    ErrorCode int    `json:"error_code,omitempty"`
}

// EXEMPTED: Structured log format — snake_case keys required by log aggregation
type PortLogFields struct {
    Port       int
    Status     string // available, in_use, error
    FallbackTo int    `json:"fallback_to,omitempty"`
}

// EXEMPTED: Structured log format — snake_case keys required by log aggregation
type HealthLogFields struct {
    Application string
    Endpoint    string
    StatusCode  int  `json:"status_code"`
    IsHealthy   bool `json:"is_healthy"`
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

// EXEMPTED: Structured log format — snake_case keys required by log aggregation
type ErrorLogFields struct {
    ErrorCode   int      `json:"error_code"`
    ErrorMsg    string   `json:"error_msg"`
    Runtime     string
    StackTrace  string   `json:"stack_trace,omitempty"`
    SourceFiles []string `json:"source_files,omitempty"`
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
  "run_id": "run-abc123",
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
  "run_id": "run-abc123",
  "profile": "backend-api",
  "runtime": "go",
  "exit_code": 0,
  "duration_ms": 30000
}

// Build error
{
  "level": "error",
  "timestamp": "2026-01-29T12:00:15.000Z",
  "caller": "runner/build.go:95",
  "msg": "build failed",
  "run_id": "run-abc123",
  "profile": "backend-api",
  "runtime": "go",
  "exit_code": 1,
  "error_code": 7401,
  "error_msg": "undefined: someFunction",
  "stack_trace": "main.go:25: undefined: someFunction",
  "source_files": ["main.go"]
}

// Port check
{
  "level": "info",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "caller": "port/manager.go:32",
  "msg": "port check completed",
  "port": 8080,
  "status": "in_use",
  "fallback_to": 8081
}

// Health check
{
  "level": "warn",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "caller": "health/checker.go:58",
  "msg": "health check failed",
  "application": "api-server",
  "endpoint": "http://localhost:8080/health",
  "status_code": 503,
  "is_healthy": false,
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
- [gsearch Observability](../22-golang-search-cli/16-observability.md)
