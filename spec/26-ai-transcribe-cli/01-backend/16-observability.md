# AI Transcribe CLI: Observability Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [AI Transcribe CLI Overview](./00-overview.md)

---

## Overview

Defines the observability infrastructure for the AI Transcribe CLI, including Prometheus metrics, health check endpoints, structured logging, and OpenTelemetry tracing.

---

## Prometheus Metrics

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Transcription Metrics
    TranscriptionRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aitrans",
            Subsystem: "stt",
            Name:      "requests_total",
            Help:      "Total transcription requests by provider and status",
        },
        []string{"provider", "model", "status"},
    )

    TranscriptionLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aitrans",
            Subsystem: "stt",
            Name:      "latency_seconds",
            Help:      "Transcription latency in seconds",
            Buckets:   []float64{0.5, 1, 2, 5, 10, 30, 60, 120, 300},
        },
        []string{"provider", "model"},
    )

    TranscriptionAudioDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aitrans",
            Subsystem: "stt",
            Name:      "audio_duration_seconds",
            Help:      "Input audio duration in seconds",
            Buckets:   []float64{1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600},
        },
        []string{"provider"},
    )

    // TTS Metrics
    SynthesisRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aitrans",
            Subsystem: "tts",
            Name:      "requests_total",
            Help:      "Total synthesis requests by provider and status",
        },
        []string{"provider", "voice", "status"},
    )

    SynthesisLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aitrans",
            Subsystem: "tts",
            Name:      "latency_seconds",
            Help:      "Synthesis latency in seconds",
            Buckets:   []float64{0.1, 0.5, 1, 2, 5, 10, 30},
        },
        []string{"provider"},
    )

    // Voice Cloning Metrics
    VoiceCloningRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aitrans",
            Subsystem: "cloning",
            Name:      "requests_total",
            Help:      "Total voice cloning requests",
        },
        []string{"status"},
    )

    // Model Management Metrics
    ModelDownloadsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "aitrans",
            Subsystem: "model",
            Name:      "downloads_total",
            Help:      "Total model downloads by model and status",
        },
        []string{"model", "status"},
    )

    ModelStorageSizeBytes = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "aitrans",
            Subsystem: "model",
            Name:      "storage_size_bytes",
            Help:      "Total model storage size in bytes",
        },
    )

    // Realtime Conversation Metrics
    RealtimeSessionsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "aitrans",
            Subsystem: "realtime",
            Name:      "sessions_active",
            Help:      "Number of active realtime conversation sessions",
        },
    )

    RealtimeSessionDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aitrans",
            Subsystem: "realtime",
            Name:      "session_duration_seconds",
            Help:      "Realtime session duration in seconds",
            Buckets:   []float64{10, 30, 60, 120, 300, 600, 1800},
        },
        []string{"mode"},
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "aitrans",
            Subsystem: "database",
            Name:      "query_duration_seconds",
            Help:      "Database query duration",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5},
        },
        []string{"operation", "table"},
    )

    // Process Metrics
    ProcessMemoryBytes = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "aitrans",
            Subsystem: "process",
            Name:      "memory_bytes",
            Help:      "Current process memory usage",
        },
    )
)
```

---

## Health Check Endpoints

### GET /health/live

Liveness probe — returns 200 if process is running.

### GET /health/ready

Readiness probe — checks all components:

```go
type HealthResponse struct {
    Status     string            `json:",omitempty"`
    Version    string            `json:",omitempty"`
    Uptime     string            `json:",omitempty"`
    Components []ComponentStatus `json:",omitempty"`
    CheckedAt  time.Time         `json:",omitempty"`
}

type ComponentStatus struct {
    Name    string `json:",omitempty"`
    Status  string `json:",omitempty"` // healthy, degraded, unhealthy
    Message string `json:",omitempty"`
    Latency string `json:",omitempty"`
}
```

### Component Checkers

| Component | Check | Degraded If |
|-----------|-------|-------------|
| Database | SQLite ping | Latency > 100ms |
| STT Provider | Provider health endpoint | Provider unreachable |
| TTS Provider | Provider health endpoint | Provider unreachable |
| Model Storage | Disk space check | < 1GB free |
| Audio Pipeline | Pipeline test signal | Processing > 5s |

---

## Structured Logging

All logs use zerolog with mandatory fields:

| Field | Type | Description |
|-------|------|-------------|
| `Level` | string | debug, info, warn, error |
| `Timestamp` | datetime | ISO 8601 |
| `CorrelationId` | string | Request correlation ID |
| `Component` | string | stt, tts, cloning, model, realtime |
| `Provider` | string | whisper, azure, google (when applicable) |

---

## Metrics Endpoint Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `Metrics.Enabled` | true | Enable Prometheus metrics |
| `Metrics.Endpoint` | `/metrics` | Metrics HTTP endpoint |
| `Metrics.Port` | 9097 | Metrics server port |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Error Codes | `./10-error-codes.md` |
| Settings Service | `./15-settings-service.md` |
| Reset API | `./17-reset-api.md` |
