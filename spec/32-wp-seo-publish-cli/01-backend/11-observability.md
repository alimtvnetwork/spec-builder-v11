# WP SEO Publish CLI: Observability Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [WP SEO Publish CLI Overview](./00-overview.md)

---

## Overview

Defines the observability infrastructure for WP SEO Publish CLI, including Prometheus metrics, health checks, and structured logging for WordPress publishing operations.

---

## Prometheus Metrics

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Publishing Metrics
    PublishRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpseo",
            Subsystem: "publish",
            Name:      "requests_total",
            Help:      "Total publish requests by content type and status",
        },
        []string{"content_type", "status"},
    )

    PublishLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpseo",
            Subsystem: "publish",
            Name:      "latency_seconds",
            Help:      "Publishing latency in seconds",
            Buckets:   []float64{1, 2, 5, 10, 30, 60, 120},
        },
        []string{"content_type"},
    )

    // WordPress API Metrics
    WpApiRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpseo",
            Subsystem: "wordpress",
            Name:      "api_requests_total",
            Help:      "Total WordPress REST API requests",
        },
        []string{"method", "endpoint", "status_code"},
    )

    WpApiLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpseo",
            Subsystem: "wordpress",
            Name:      "api_latency_seconds",
            Help:      "WordPress API call latency",
            Buckets:   []float64{0.1, 0.5, 1, 2, 5, 10},
        },
        []string{"method"},
    )

    // AI Bridge Integration Metrics
    AiBridgeRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpseo",
            Subsystem: "aibridge",
            Name:      "requests_total",
            Help:      "Total AI Bridge generation requests",
        },
        []string{"type", "status"},
    )

    AiBridgeLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpseo",
            Subsystem: "aibridge",
            Name:      "latency_seconds",
            Help:      "AI Bridge generation latency",
            Buckets:   []float64{1, 5, 10, 30, 60, 120, 300},
        },
        []string{"type"},
    )

    // Automation Metrics
    AutomationRunsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpseo",
            Subsystem: "automation",
            Name:      "runs_total",
            Help:      "Total automation runs",
        },
        []string{"status"},
    )

    AutomationItemsProcessed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpseo",
            Subsystem: "automation",
            Name:      "items_processed_total",
            Help:      "Total items processed in automations",
        },
        []string{"status"},
    )

    // Variable Processing Metrics
    VariableResolutionsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "wpseo",
            Subsystem: "variables",
            Name:      "resolutions_total",
            Help:      "Total variable resolution attempts",
        },
        []string{"scope", "status"},
    )

    // Connection Metrics
    ActiveConnectionsGauge = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "wpseo",
            Subsystem: "connections",
            Name:      "active",
            Help:      "Number of active WordPress connections",
        },
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "wpseo",
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

Checks all components:

| Component | Check | Degraded If |
|-----------|-------|-------------|
| Database | SQLite ping | Latency > 100ms |
| WordPress | REST API reachable | Any connection unreachable |
| AI Bridge | Health endpoint | Service unavailable |
| GSearch | Health endpoint | Service unavailable |

**Response:**

```json
{
    "Status": "healthy",
    "Version": "1.0.0",
    "Uptime": "2h15m30s",
    "Components": [
        {"Name": "database", "Status": "healthy", "Latency": "2ms"},
        {"Name": "wordpress_example-com", "Status": "healthy", "Latency": "150ms"},
        {"Name": "aibridge", "Status": "healthy", "Latency": "5ms"},
        {"Name": "gsearch", "Status": "degraded", "Message": "Connection refused"}
    ]
}
```

---

## Structured Logging

Zerolog with mandatory fields:

| Field | Type | Description |
|-------|------|-------------|
| `Level` | string | debug, info, warn, error |
| `Timestamp` | datetime | ISO 8601 |
| `CorrelationId` | string | Request correlation ID |
| `Component` | string | publish, wordpress, aibridge, automation, variables |
| `WebsiteId` | string | Target website (when applicable) |

---

## Metrics Endpoint Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `Metrics.Enabled` | true | Enable Prometheus metrics |
| `Metrics.Endpoint` | `/metrics` | Metrics HTTP endpoint |
| `Metrics.Port` | 9095 | Metrics server port |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Error Codes | `./08-error-codes.md` |
| Settings Service | `./10-settings-service.md` |
| Reset API | `./13-reset-api.md` |
