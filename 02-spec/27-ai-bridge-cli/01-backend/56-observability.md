# AI Bridge CLI - Observability Specification

> **Version:** 5.0.0  
> **Status:** Active  
> **Updated:** 2026-03-09

## 1. Overview

This specification defines the observability infrastructure for AI Bridge CLI, including Prometheus metrics, health check endpoints, structured logging, and OpenTelemetry distributed tracing for LLM communication monitoring.

---

## 2. Prometheus Metrics

### 2.1 Metrics Registry

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // LLM Request Metrics
    LLMRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "llm",
            Name:      "requests_total",
            Help:      "Total number of LLM requests by backend and category",
        },
        []string{"backend", "category", "status"},
    )

    LLMLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "llm",
            Name:      "latency_seconds",
            Help:      "LLM request latency in seconds",
            Buckets:   []float64{0.5, 1, 2.5, 5, 10, 30, 60, 120, 300},
        },
        []string{"backend", "category"},
    )

    LLMTokensProcessed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "llm",
            Name:      "tokens_processed_total",
            Help:      "Total tokens processed (input + output)",
        },
        []string{"backend", "category", "direction"},
    )

    LLMStreamingChunks = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "llm",
            Name:      "streaming_chunks",
            Help:      "Number of streaming chunks per response",
            Buckets:   []float64{10, 50, 100, 250, 500, 1000, 2500},
        },
        []string{"backend"},
    )

    // Model Management Metrics
    ModelLoadTimeSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "model",
            Name:      "load_time_seconds",
            Help:      "Model load time in seconds",
            Buckets:   []float64{1, 5, 10, 30, 60, 120, 300},
        },
        []string{"model", "backend"},
    )

    ModelMemoryBytes = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "aibridge",
            Subsystem: "model",
            Name:      "memory_bytes",
            Help:      "Memory usage per loaded model",
        },
        []string{"model", "backend"},
    )

    ModelsLoaded = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "aibridge",
            Subsystem: "model",
            Name:      "loaded_count",
            Help:      "Number of models currently loaded",
        },
        []string{"backend"},
    )

    // Backend Health Metrics
    BackendHealthStatus = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "aibridge",
            Subsystem: "backend",
            Name:      "health_status",
            Help:      "Backend health status (1=healthy, 0=unhealthy, -1=unavailable)",
        },
        []string{"backend", "port"},
    )

    BackendConnectionErrors = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "backend",
            Name:      "connection_errors_total",
            Help:      "Total connection errors by backend",
        },
        []string{"backend", "error_type"},
    )

    // Chat Session Metrics
    ChatSessionsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "aibridge",
            Subsystem: "chat",
            Name:      "sessions_active",
            Help:      "Number of active chat sessions",
        },
    )

    ChatMessagesTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "chat",
            Name:      "messages_total",
            Help:      "Total chat messages by role",
        },
        []string{"session_id", "role"},
    )

    // RAG Metrics
    RAGEmbeddingsGenerated = promauto.NewCounter(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "rag",
            Name:      "embeddings_generated_total",
            Help:      "Total embeddings generated",
        },
    )

    RAGVectorSearchLatency = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "rag",
            Name:      "vector_search_latency_seconds",
            Help:      "Vector search latency in seconds",
            Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1},
        },
    )

    RAGContextChunksRetrieved = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "rag",
            Name:      "context_chunks_retrieved",
            Help:      "Number of context chunks retrieved per query",
            Buckets:   []float64{1, 5, 10, 20, 50},
        },
    )

    // Input Format Metrics
    InputParseTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "input",
            Name:      "parse_total",
            Help:      "Total input parsing operations by format",
        },
        []string{"format", "status"},
    )

    InputParseLatency = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "input",
            Name:      "parse_latency_seconds",
            Help:      "Input parsing latency by format",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.05, 0.1},
        },
        []string{"format"},
    )

    // Agentic Mode Metrics
    AgenticChainsTotal = promauto.NewCounter(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "agentic",
            Name:      "chains_total",
            Help:      "Total agentic chains executed",
        },
    )

    AgenticChainSteps = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "agentic",
            Name:      "chain_steps",
            Help:      "Number of steps per agentic chain",
            Buckets:   []float64{1, 3, 5, 10, 20, 50},
        },
    )

    AgenticToolCalls = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aibridge",
            Subsystem: "agentic",
            Name:      "tool_calls_total",
            Help:      "Total tool calls by tool type",
        },
        []string{"tool"},
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aibridge",
            Subsystem: "database",
            Name:      "query_duration_seconds",
            Help:      "Database query duration in seconds",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5},
        },
        []string{"operation", "table"},
    )

    DbConnectionsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "aibridge",
            Subsystem: "database",
            Name:      "connections_active",
            Help:      "Number of active database connections",
        },
    )

    // Process Metrics
    ProcessStartTime = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "aibridge",
            Subsystem: "process",
            Name:      "start_time_seconds",
            Help:      "Process start time in Unix seconds",
        },
    )
)
```

### 2.2 Metrics Endpoint Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `Metrics.Enabled` | bool | `true` | Enable Prometheus metrics |
| `Metrics.Endpoint` | string | `/metrics` | Metrics HTTP endpoint |
| `Metrics.Port` | int | `9091` | Metrics server port |
| `Metrics.BasicAuth.Enabled` | bool | `false` | Enable basic auth for metrics |
| `Metrics.BasicAuth.Username` | string | `""` | Basic auth username |
| `Metrics.BasicAuth.PasswordHash` | string | `""` | Bcrypt hash of password |

### 2.3 Metrics Collection Points

| Metric | Collection Point | Labels |
|--------|------------------|--------|
| `llm_requests_total` | LLMClient.Generate() | backend, category, status |
| `llm_latency_seconds` | LLMClient.Generate() | backend, category |
| `llm_tokens_processed_total` | TokenCounter.Count() | backend, category, direction |
| `model_load_time_seconds` | ModelManager.Load() | model, backend |
| `backend_health_status` | HealthChecker.Check() | backend, port |
| `chat_messages_total` | ChatSession.AddMessage() | session_id, role |
| `rag_vector_search_latency_seconds` | RAGStore.Search() | - |
| `agentic_tool_calls_total` | AgentExecutor.CallTool() | tool |

---

## 3. Health Check Endpoints

### 3.1 Health Check Types

**CRITICAL: No `interface{}` or `map[string]interface{}` usage. All metadata uses strongly-typed structs.**

```go
package health

import (
    "context"
    "time"
)

// ComponentMetadata holds typed metadata for component health checks
type ComponentMetadata struct {
    ModelsAvailable int      `json:",omitempty"`
    ModelNames      []string `json:",omitempty"`
    VectorsCount    int64    `json:",omitempty"`
    Dimensions      int      `json:",omitempty"`
    IndexSizeMb     float64  `json:",omitempty"`
}

// ComponentStatus represents health of a system component
type ComponentStatus struct {
    Name      string
    Status    HealthStatus
    Message   string            `json:",omitempty"`
    Latency   time.Duration
    Metadata  ComponentMetadata `json:",omitempty"`
    CheckedAt time.Time
}

// HealthStatus enum
type HealthStatus string

const (
    StatusHealthy   HealthStatus = "Healthy"
    StatusDegraded  HealthStatus = "Degraded"
    StatusUnhealthy HealthStatus = "Unhealthy"
)

// HealthResponse is the full health check response
type HealthResponse struct {
    Status     HealthStatus
    Version    string
    Uptime     time.Duration
    Components []ComponentStatus
    Backends   []BackendStatus
    CheckedAt  time.Time
}

// BackendStatus represents an LLM backend status
type BackendStatus struct {
    Name      string
    Type      string
    Port      int
    Status    HealthStatus
    Models    []string     `json:",omitempty"`
    Message   string       `json:",omitempty"`
}
```

### 3.2 Component Health Checkers

```go
// OllamaHealthChecker validates Ollama backend connectivity
type OllamaHealthChecker struct {
    endpoint string
    client   *http.Client
}

func (o *OllamaHealthChecker) Name() string { return "ollama" }

// OllamaTagsResponse is the strongly-typed response from Ollama /api/tags
type OllamaTagsResponse struct {
    Models []OllamaModel
}

// OllamaModel represents a single model entry from Ollama
type OllamaModel struct {
    Name string
}

func (o *OllamaHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    req, _ := http.NewRequestWithContext(context, httpmethod.Get.String(), o.endpoint+"/api/tags", nil)
    resp, err := o.client.Do(req)
    if err != nil {
        return ComponentStatus{
            Name:      o.Name(),
            Status:    StatusUnhealthy,
            Message:   fmt.Sprintf("connection failed: %v", err),
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return ComponentStatus{
            Name:      o.Name(),
            Status:    StatusDegraded,
            Message:   fmt.Sprintf("unexpected status: %d", resp.StatusCode),
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }
    
    var result OllamaTagsResponse
    json.NewDecoder(resp.Body).Decode(&result)
    
    modelNames := make([]string, len(result.Models))
    for i, m := range result.Models {
        modelNames[i] = m.Name
    }
    
    return ComponentStatus{
        Name:    o.Name(),
        Status:  StatusHealthy,
        Latency: time.Since(start),
        Metadata: ComponentMetadata{
            ModelsAvailable: len(result.Models),
            ModelNames:      modelNames,
        },
        CheckedAt: time.Now(),
    }
}

// LlamaCppHealthChecker validates llama.cpp server connectivity
type LlamaCppHealthChecker struct {
    endpoint string
    client   *http.Client
}

func (l *LlamaCppHealthChecker) Name() string { return "LlamaCpp" }

func (l *LlamaCppHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    req, _ := http.NewRequestWithContext(context, httpmethod.Get.String(), l.endpoint+"/health", nil)
    resp, err := l.client.Do(req)
    if err != nil {
        return ComponentStatus{
            Name:      l.Name(),
            Status:    StatusUnhealthy,
            Message:   fmt.Sprintf("connection failed: %v", err),
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }
    defer resp.Body.Close()
    
    return ComponentStatus{
        Name:      l.Name(),
        Status:    StatusHealthy,
        Latency:   time.Since(start),
        CheckedAt: time.Now(),
    }
}

// RAGStoreStats holds strongly-typed RAG store statistics
type RAGStoreStats struct {
    VectorCount    int64
    Dimensions     int
    IndexSizeBytes int64
}

// RAGStoreHealthChecker validates RAG vector store
type RAGStoreHealthChecker struct {
    store *RAGStore
}

func (r *RAGStoreHealthChecker) Name() string { return "RagStore" }

func (r *RAGStoreHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    stats, err := r.store.Stats()
    if err != nil {
        return ComponentStatus{
            Name:      r.Name(),
            Status:    StatusUnhealthy,
            Message:   fmt.Sprintf("stats failed: %v", err),
            Latency:   time.Since(start),
            CheckedAt: time.Now(),
        }
    }
    
    return ComponentStatus{
        Name:    r.Name(),
        Status:  StatusHealthy,
        Latency: time.Since(start),
        Metadata: ComponentMetadata{
            VectorsCount: stats.VectorCount,
            Dimensions:   stats.Dimensions,
            IndexSizeMb:  float64(stats.IndexSizeBytes) / 1024 / 1024,
        },
        CheckedAt: time.Now(),
    }
}
```

### 3.3 Health Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/health` | GET | Basic liveness check | `200 OK` or `503 Service Unavailable` |
| `/health/ready` | GET | Readiness with all backends | Full `HealthResponse` JSON |
| `/health/live` | GET | Kubernetes liveness probe | `200 OK` if process running |
| `/health/backends` | GET | Backend-specific health | Array of `BackendStatus` |

### 3.4 Health Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `Health.Enabled` | bool | `true` | Enable health endpoints |
| `Health.Port` | int | `5040` | Health server port (same as API) |
| `Health.Timeout` | duration | `10s` | Health check timeout |
| `Health.Backends.Ollama.Endpoint` | string | `http://localhost:11434` | Ollama endpoint |
| `Health.Backends.LlamaCpp.Endpoint` | string | `http://localhost:8080` | llama.cpp endpoint |
| `Health.Backends.Whisper.Endpoint` | string | `http://localhost:9000` | Whisper endpoint |

---

## 4. OpenTelemetry Tracing

### 4.1 Tracer Configuration

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
    Enabled       bool
    ServiceName   string
    Environment   string
    OtlpEndpoint  string
    SamplingRate  float64
    BatchTimeout  string
    ExportTimeout string
}

// InitTracer initializes OpenTelemetry tracer
func InitTracer(cfg TracerConfig) apperror.Result[*sdktrace.TracerProvider] {
    if !cfg.Enabled {
        return apperror.Ok[*sdktrace.TracerProvider](nil)
    }

    context := stdctx.Background()

    exporter, err := otlptrace.New(
        context,
        otlptracegrpc.NewClient(
            otlptracegrpc.WithEndpoint(cfg.OtlpEndpoint),
            otlptracegrpc.WithInsecure(),
        ),
    )
    if err != nil {
        return apperror.FailWrap[*sdktrace.TracerProvider](
            err,
            ErrObservabilityTracerInit,
            "failed to create exporter",
        )
    }

    res, err := resource.New(context,
        resource.WithAttributes(
            semconv.ServiceName(cfg.ServiceName),
            semconv.DeploymentEnvironment(cfg.Environment),
            attribute.String("cli.name", "ai-bridge"),
            attribute.String("cli.version", Version),
        ),
    )
    if err != nil {
        return apperror.FailWrap[*sdktrace.TracerProvider](
            err,
            ErrObservabilityResourceInit,
            "failed to create resource",
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

### 4.2 Span Definitions

| Span Name | Attributes | Parent |
|-----------|------------|--------|
| `llm.generate` | backend, model, category, prompt_tokens | request |
| `llm.stream` | backend, chunk_count | llm.generate |
| `model.load` | model, backend, duration | - |
| `rag.search` | query_hash, top_k | llm.generate |
| `rag.embed` | text_length, model | rag.search |
| `chat.add_message` | session_id, role | request |
| `input.parse` | format, size_bytes | request |
| `agentic.chain` | chain_id, step_count | request |
| `agentic.tool_call` | tool, arguments_hash | agentic.chain |
| `db.query` | operation, table | varies |

### 4.3 Trace Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `Tracing.Enabled` | bool | `false` | Enable distributed tracing |
| `Tracing.ServiceName` | string | `ai-bridge-cli` | Service name in traces |
| `Tracing.Environment` | string | `development` | Deployment environment |
| `Tracing.OtlpEndpoint` | string | `localhost:4317` | OTLP gRPC endpoint |
| `Tracing.SamplingRate` | float64 | `0.1` | Trace sampling rate (0.0-1.0) |

---

## 5. Structured Logging

### 5.1 Log Format

```go
package logging

import (
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

// LogConfig holds logging configuration
type LogConfig struct {
    Level      string
    Format     string
    Output     string
    MaxSizeMb  int
    MaxBackups int
    MaxAgeDays int
    Compress   bool
}

// InitLogger initializes structured logger
func InitLogger(cfg LogConfig) apperror.Result[*zap.Logger] {
    level, err := zapcore.ParseLevel(cfg.Level)
    if err != nil {
        level = zapcore.InfoLevel
    }

    var encoderConfig zapcore.EncoderConfig
    if cfg.Format == "json" {
        encoderConfig = zap.NewProductionEncoderConfig()
    } else {
        encoderConfig = zap.NewDevelopmentEncoderConfig()
    }
    
    encoderConfig.TimeKey = "Timestamp"
    encoderConfig.LevelKey = "Level"
    encoderConfig.MessageKey = "Message"
    encoderConfig.CallerKey = "Caller"
    encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
    encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

    zapConfig := zap.Config{
        Level:            zap.NewAtomicLevelAt(level),
        Encoding:         cfg.Format,
        EncoderConfig:    encoderConfig,
        OutputPaths:      []string{cfg.Output},
        ErrorOutputPaths: []string{"stderr"},
    }

    logger, err := zapConfig.Build()
    if err != nil {
        return apperror.FailWrap[*zap.Logger](
            err,
            ErrObservabilityLoggerInit,
            "failed to build logger",
        )
    }

    return apperror.Ok(logger)
}
```

### 5.2 Log Fields

| Field | Type | Description |
|-------|------|-------------|
| `Timestamp` | string | ISO8601 timestamp |
| `Level` | string | Log level (DEBUG, INFO, WARN, ERROR) |
| `Message` | string | Log message |
| `Caller` | string | Source file and line |
| `RequestId` | string | Request correlation ID |
| `Backend` | string | LLM backend name |
| `Category` | string | Model category |
| `Model` | string | Model name |
| `SessionId` | string | Chat session ID |
| `DurationMs` | float64 | Operation duration |
| `TokensIn` | int | Input token count |
| `TokensOut` | int | Output token count |
| `Error` | string | Error message |
| `ErrorCode` | int | Error code (9000-9499) |

### 5.3 Log Examples

```json
{
    "Timestamp": "2026-02-04T14:30:00.000Z",
    "Level": "INFO",
    "Message": "LLM request completed",
    "Caller": "llm/client.go:142",
    "RequestId": "req_abc123",
    "Backend": "ollama",
    "Category": "coding",
    "Model": "deepseek-coder:6.7b",
    "DurationMs": 2340.5,
    "TokensIn": 150,
    "TokensOut": 320
}
```

```json
{
    "Timestamp": "2026-02-04T14:30:05.000Z",
    "Level": "ERROR",
    "Message": "Backend connection failed",
    "Caller": "health/checker.go:89",
    "RequestId": "req_def456",
    "Backend": "LlamaCpp",
    "Error": "connection refused",
    "ErrorCode": 9010
}
```

---

## 6. Alerting Rules

### 6.1 Prometheus Alerting Rules

```yaml
groups:
  - name: aibridge_alerts
    interval: 30s
    rules:
      - alert: AIBridgeBackendDown
        expr: aibridge_backend_health_status == -1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "AI Bridge backend {{ $labels.backend }} is unavailable"
          description: "Backend {{ $labels.backend }} on port {{ $labels.port }} has been unavailable for more than 2 minutes."

      - alert: AIBridgeHighLatency
        expr: histogram_quantile(0.95, rate(aibridge_llm_latency_seconds_bucket[5m])) > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI Bridge LLM latency is high"
          description: "95th percentile latency for {{ $labels.backend }} is above 60 seconds."

      - alert: AIBridgeHighErrorRate
        expr: rate(aibridge_llm_requests_total{status="error"}[5m]) / rate(aibridge_llm_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI Bridge error rate is high"
          description: "Error rate for {{ $labels.backend }} is above 10%."

      - alert: AIBridgeNoModelsLoaded
        expr: aibridge_model_loaded_count == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "No models loaded in AI Bridge"
          description: "Backend {{ $labels.backend }} has no models loaded."

      - alert: AIBridgeRAGSearchSlow
        expr: histogram_quantile(0.95, rate(aibridge_rag_vector_search_latency_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RAG vector search is slow"
          description: "95th percentile RAG search latency is above 1 second."
```

---

## 7. Grafana Dashboard

### 7.1 Dashboard Panels

| Panel | Type | Query |
|-------|------|-------|
| Request Rate | Graph | `rate(aibridge_llm_requests_total[5m])` |
| Latency P95 | Graph | `histogram_quantile(0.95, rate(aibridge_llm_latency_seconds_bucket[5m]))` |
| Backend Health | Stat | `aibridge_backend_health_status` |
| Token Throughput | Graph | `rate(aibridge_llm_tokens_processed_total[5m])` |
| Active Sessions | Stat | `aibridge_chat_sessions_active` |
| Model Memory | Graph | `aibridge_model_memory_bytes` |
| RAG Search Latency | Graph | `histogram_quantile(0.95, rate(aibridge_rag_vector_search_latency_seconds_bucket[5m]))` |
| Error Rate | Graph | `rate(aibridge_llm_requests_total{status="error"}[5m])` |

---

## 8. Error Code Mapping

| Error Code | Metric Label | Description |
|------------|--------------|-------------|
| 9000-9009 | `startup` | Service startup errors |
| 9010-9019 | `backend_connection` | Backend connection failures |
| 9020-9029 | `model_load` | Model loading errors |
| 9100-9199 | `llm_request` | LLM request errors |
| 9200-9299 | `input_parse` | Input format parsing errors |
| 9300-9399 | `chat_session` | Chat session errors |
| 9400-9499 | `database` | Database operation errors |

---

## 9. Cross-References

| Reference | Location |
|-----------|----------|
| Error Codes | `./05-error-codes.md` |
| API Interface | `./04-api-interface.md` |
| Split DB Integration | `./08-split-db-integration.md` |
| GSearch Observability | `../../25-gsearch-cli/01-backend/16-observability.md` |
