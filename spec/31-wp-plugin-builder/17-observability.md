# WP Plugin Builder: Observability Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [WP Plugin Builder Overview](./00-overview.md)

---

## Overview

Defines the observability infrastructure for WP Plugin Builder, including Prometheus metrics, health checks, and structured logging for plugin generation operations.

---

## Prometheus Metrics

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Project Generation Metrics
    GenerationRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpb",
            Subsystem: "generation",
            Name:      "requests_total",
            Help:      "Total code generation requests",
        },
        []string{"project", "status"},
    )

    GenerationLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpb",
            Subsystem: "generation",
            Name:      "latency_seconds",
            Help:      "Code generation latency",
            Buckets:   []float64{1, 5, 10, 30, 60, 120, 300},
        },
        []string{"project"},
    )

    FilesGeneratedTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpb",
            Subsystem: "generation",
            Name:      "files_total",
            Help:      "Total files generated",
        },
        []string{"file_type", "action"},
    )

    // RAG System Metrics
    RagIndexingRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpb",
            Subsystem: "rag",
            Name:      "indexing_requests_total",
            Help:      "Total RAG indexing requests",
        },
        []string{"source_type", "status"},
    )

    RagSearchLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpb",
            Subsystem: "rag",
            Name:      "search_latency_seconds",
            Help:      "RAG search latency",
            Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2},
        },
        []string{"search_type"},
    )

    RagVectorsTotal = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "wpb",
            Subsystem: "rag",
            Name:      "vectors_total",
            Help:      "Total vectors stored",
        },
    )

    // Preset Learning Metrics
    PresetIngestionsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpb",
            Subsystem: "preset",
            Name:      "ingestions_total",
            Help:      "Total preset ingestion operations",
        },
        []string{"category", "status"},
    )

    // AI Bridge Integration
    AiBridgeRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpb",
            Subsystem: "aibridge",
            Name:      "requests_total",
            Help:      "Total AI Bridge requests",
        },
        []string{"operation", "status"},
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpb",
            Subsystem: "database",
            Name:      "query_duration_seconds",
            Help:      "Database query duration",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25},
        },
        []string{"operation", "table"},
    )

    DbSizeBytes = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "wpb",
            Subsystem: "database",
            Name:      "size_bytes",
            Help:      "Database file size",
        },
        []string{"db_type"}, // root, project
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
| Database (Root) | SQLite ping | Latency > 100ms |
| Database (Project) | Active project DB ping | DB not found |
| RAG System | Vector store accessible | Index corrupted |
| AI Bridge | Health endpoint | Service unavailable |

---

## Structured Logging

Zerolog with fields:

| Field | Type | Description |
|-------|------|-------------|
| `Level` | string | debug, info, warn, error |
| `Timestamp` | datetime | ISO 8601 |
| `CorrelationId` | string | Request correlation ID |
| `Component` | string | generation, rag, preset, aibridge, project |
| `ProjectSlug` | string | Active project (when applicable) |

---

## Metrics Endpoint Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `Metrics.Enabled` | true | Enable Prometheus metrics |
| `Metrics.Endpoint` | `/metrics` | Metrics HTTP endpoint |
| `Metrics.Port` | 9096 | Metrics server port |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Core Architecture | `./01-core-architecture.md` |
| Error Handling | `./10-error-handling.md` |
| Settings Service | `./16-settings-service.md` |
| Reset API | `./18-reset-api.md` |
