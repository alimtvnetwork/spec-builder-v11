# Spec Reverse CLI: Observability Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [Spec Reverse CLI Architecture](./01-architecture.md)

---

## Overview

Defines the observability infrastructure for Spec Reverse CLI, including Prometheus metrics, health checks, and structured logging for code analysis and spec generation.

---

## Prometheus Metrics

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Analysis Metrics
    AnalysisRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "src",
            Subsystem: "analysis",
            Name:      "requests_total",
            Help:      "Total analysis requests by language and status",
        },
        []string{"language", "status"},
    )

    AnalysisLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "src",
            Subsystem: "analysis",
            Name:      "latency_seconds",
            Help:      "Analysis latency in seconds",
            Buckets:   []float64{1, 5, 10, 30, 60, 120, 300},
        },
        []string{"language"},
    )

    FilesAnalyzedTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "src",
            Subsystem: "analysis",
            Name:      "files_total",
            Help:      "Total files analyzed",
        },
        []string{"language", "file_type"},
    )

    SymbolsExtractedTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "src",
            Subsystem: "analysis",
            Name:      "symbols_total",
            Help:      "Total symbols extracted",
        },
        []string{"symbol_type"},
    )

    // Spec Generation Metrics
    GenerationRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "src",
            Subsystem: "generation",
            Name:      "requests_total",
            Help:      "Total spec generation requests",
        },
        []string{"format", "status"},
    )

    GenerationLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "src",
            Subsystem: "generation",
            Name:      "latency_seconds",
            Help:      "Spec generation latency",
            Buckets:   []float64{5, 10, 30, 60, 120, 300, 600},
        },
        []string{"format"},
    )

    // AI Bridge Metrics
    AiBridgeRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "src",
            Subsystem: "aibridge",
            Name:      "requests_total",
            Help:      "Total AI Bridge requests",
        },
        []string{"operation", "status"},
    )

    AiBridgeTokensUsed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "src",
            Subsystem: "aibridge",
            Name:      "tokens_total",
            Help:      "Total tokens used",
        },
        []string{"direction"}, // input, output
    )

    // RAG Metrics
    RagSearchLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "src",
            Subsystem: "rag",
            Name:      "search_latency_seconds",
            Help:      "RAG search latency",
            Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1},
        },
        []string{"search_type"},
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "src",
            Subsystem: "database",
            Name:      "query_duration_seconds",
            Help:      "Database query duration",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25},
        },
        []string{"operation", "table"},
    )
)
```

---

## Health Check Endpoints

### GET /health/live

Returns 200 if process is running.

### GET /health/ready

| Component | Check | Degraded If |
|-----------|-------|-------------|
| Database | SQLite ping | Latency > 100ms |
| AI Bridge | Health endpoint | Service unavailable |
| File System | Analysis path accessible | Path not readable |

---

## Structured Logging

Zerolog with fields:

| Field | Type | Description |
|-------|------|-------------|
| `Level` | string | debug, info, warn, error |
| `Timestamp` | datetime | ISO 8601 |
| `CorrelationId` | string | Request correlation ID |
| `Component` | string | analysis, generation, aibridge, rag |
| `AnalysisId` | string | Active analysis ID (when applicable) |

---

## Metrics Endpoint Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `Metrics.Enabled` | true | Enable Prometheus metrics |
| `Metrics.Endpoint` | `/metrics` | Metrics HTTP endpoint |
| `Metrics.Port` | 9098 | Metrics server port |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Settings Service | `./04-settings-service.md` |
| Reset API | `./06-reset-api.md` |
