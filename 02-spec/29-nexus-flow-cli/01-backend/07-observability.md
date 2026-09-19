# Nexus Flow CLI - Observability Specification

> Version: 2.0.0  
> Status: Active  
> Updated: 2026-03-09

## 1. Overview

This specification defines the observability infrastructure for Nexus Flow CLI, including Prometheus metrics, health check endpoints, structured logging, and OpenTelemetry distributed tracing for workflow orchestration monitoring.

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
    // Workflow Execution Metrics
    WorkflowExecutionsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "workflow",
            Name:      "executions_total",
            Help:      "Total number of workflow executions by status",
        },
        []string{"workflow_id", "status"},
    )

    WorkflowDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "workflow",
            Name:      "duration_seconds",
            Help:      "Workflow execution duration in seconds",
            Buckets:   []float64{0.1, 0.5, 1, 5, 10, 30, 60, 120, 300, 600},
        },
        []string{"workflow_id"},
    )

    WorkflowsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "nexusflow",
            Subsystem: "workflow",
            Name:      "active_count",
            Help:      "Number of currently active workflows",
        },
    )

    WorkflowStepsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "workflow",
            Name:      "steps_total",
            Help:      "Total workflow steps executed by type and status",
        },
        []string{"workflow_id", "step_type", "status"},
    )

    // Node Execution Metrics
    NodeExecutionsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "node",
            Name:      "executions_total",
            Help:      "Total node executions by type and status",
        },
        []string{"node_type", "status"},
    )

    NodeDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "node",
            Name:      "duration_seconds",
            Help:      "Node execution duration in seconds",
            Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
        },
        []string{"node_type"},
    )

    NodeRetriesTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "node",
            Name:      "retries_total",
            Help:      "Total node retries by type",
        },
        []string{"node_type"},
    )

    // WebSocket Metrics
    WebSocketConnectionsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "nexusflow",
            Subsystem: "websocket",
            Name:      "connections_active",
            Help:      "Number of active WebSocket connections",
        },
    )

    WebSocketMessagesTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "websocket",
            Name:      "messages_total",
            Help:      "Total WebSocket messages by direction and type",
        },
        []string{"direction", "message_type"},
    )

    WebSocketLatencySeconds = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "websocket",
            Name:      "latency_seconds",
            Help:      "WebSocket message latency in seconds",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1},
        },
    )

    // Queue Metrics
    QueueDepth = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: "nexusflow",
            Subsystem: "queue",
            Name:      "depth",
            Help:      "Current queue depth by queue name",
        },
        []string{"queue"},
    )

    QueueProcessedTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "queue",
            Name:      "processed_total",
            Help:      "Total messages processed by queue",
        },
        []string{"queue", "status"},
    )

    QueueWaitSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "queue",
            Name:      "wait_seconds",
            Help:      "Time messages wait in queue before processing",
            Buckets:   []float64{0.1, 0.5, 1, 5, 10, 30, 60},
        },
        []string{"queue"},
    )

    // Trigger Metrics
    TriggersTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "trigger",
            Name:      "activations_total",
            Help:      "Total trigger activations by type",
        },
        []string{"trigger_type", "workflow_id"},
    )

    TriggerLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "trigger",
            Name:      "latency_seconds",
            Help:      "Time from trigger to workflow start",
            Buckets:   []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1},
        },
        []string{"trigger_type"},
    )

    // Integration Metrics
    IntegrationCallsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "integration",
            Name:      "calls_total",
            Help:      "Total external integration calls by target",
        },
        []string{"integration", "status"},
    )

    IntegrationLatencySeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "integration",
            Name:      "latency_seconds",
            Help:      "Integration call latency in seconds",
            Buckets:   []float64{0.1, 0.25, 0.5, 1, 2.5, 5, 10},
        },
        []string{"integration"},
    )

    // Database Metrics
    DbQueryDurationSeconds = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "database",
            Name:      "query_duration_seconds",
            Help:      "Database query duration in seconds",
            Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5},
        },
        []string{"operation", "table"},
    )

    DbConnectionsActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "nexusflow",
            Subsystem: "database",
            Name:      "connections_active",
            Help:      "Number of active database connections",
        },
    )

    // RBAC Metrics
    RBACCheckTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "nexusflow",
            Subsystem: "rbac",
            Name:      "checks_total",
            Help:      "Total RBAC permission checks by result",
        },
        []string{"resource", "action", "result"},
    )

    RBACCheckLatency = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Namespace: "nexusflow",
            Subsystem: "rbac",
            Name:      "check_latency_seconds",
            Help:      "RBAC permission check latency",
            Buckets:   []float64{0.0001, 0.0005, 0.001, 0.005, 0.01},
        },
    )

    // Process Metrics
    ProcessStartTime = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "nexusflow",
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
| `Metrics.Port` | int | `9092` | Metrics server port |
| `Metrics.BasicAuth.Enabled` | bool | `false` | Enable basic auth for metrics |

### 2.3 Metrics Collection Points

| Metric | Collection Point | Labels |
|--------|------------------|--------|
| `workflow_executions_total` | WorkflowEngine.Execute() | workflow_id, status |
| `workflow_duration_seconds` | WorkflowEngine.Execute() | workflow_id |
| `node_executions_total` | NodeExecutor.Execute() | node_type, status |
| `websocket_messages_total` | WSHandler.HandleMessage() | direction, message_type |
| `queue_depth` | QueueManager.Stats() | queue |
| `trigger_activations_total` | TriggerManager.Fire() | trigger_type, workflow_id |
| `rbac_checks_total` | CasbinEnforcer.Enforce() | resource, action, result |

---

## 3. Health Check Endpoints

### 3.1 Health Check Interface

```go
package health

import (
    stdctx "context"
    "time"
)

// ComponentMetadata holds typed health check metadata
type ComponentMetadata struct {
    ActiveCount      int     `json:",omitempty"`
    PendingCount     int     `json:",omitempty"`
    MaxConcurrent    int     `json:",omitempty"`
    CompletedLastHr  int     `json:",omitempty"`
    FailedLastHr     int     `json:",omitempty"`
    QueueCount       int     `json:",omitempty"`
    TotalDepth       int     `json:",omitempty"`
    MaxDepth         int     `json:",omitempty"`
    Connections      int     `json:",omitempty"`
    MaxConnections   int     `json:",omitempty"`
    MessagesPerSec   float64 `json:",omitempty"`
    PolicyCount      int     `json:",omitempty"`
    RoleCount        int     `json:",omitempty"`
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
    StatusHealthy   HealthStatus = "healthy"
    StatusDegraded  HealthStatus = "degraded"
    StatusUnhealthy HealthStatus = "unhealthy"
)

// HealthResponse is the full health check response
type HealthResponse struct {
    Status      HealthStatus
    Version     string
    Uptime      time.Duration
    Components  []ComponentStatus
    Workflows   WorkflowStats
    Queues      []QueueStatus
    CheckedAt   time.Time
}

// WorkflowStats represents workflow execution statistics
type WorkflowStats struct {
    Active     int
    Pending    int
    Completed  int
    Failed     int
}

// QueueStatus represents queue health
type QueueStatus struct {
    Name        string
    Depth       int
    Processing  int
    Status      HealthStatus
}
```

### 3.2 Component Health Checkers

```go
// WorkflowEngineHealthChecker validates workflow engine state
type WorkflowEngineHealthChecker struct {
    engine *WorkflowEngine
}

func (w *WorkflowEngineHealthChecker) Name() string { return "workflow_engine" }

func (w *WorkflowEngineHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    stats := w.engine.Stats()
    
    status := StatusHealthy
    if stats.Active > stats.MaxConcurrent*90/100 {
        status = StatusDegraded
    }
    if stats.FailedLastHour > stats.CompletedLastHour {
        status = StatusDegraded
    }
    
    return ComponentStatus{
        Name:    w.Name(),
        Status:  status,
        Latency: time.Since(start),
        Metadata: ComponentMetadata{
            ActiveCount:     stats.Active,
            PendingCount:    stats.Pending,
            MaxConcurrent:   stats.MaxConcurrent,
            CompletedLastHr: stats.CompletedLastHour,
            FailedLastHr:    stats.FailedLastHour,
        },
        CheckedAt: time.Now(),
    }
}

// QueueHealthChecker validates message queue state
type QueueHealthChecker struct {
    manager *QueueManager
}

func (q *QueueHealthChecker) Name() string { return "queue" }

func (q *QueueHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    stats := q.manager.AllStats()
    
    totalDepth := 0
    maxDepth := 0
    for _, s := range stats {
        totalDepth += s.Depth
        if s.Depth > maxDepth {
            maxDepth = s.Depth
        }
    }
    
    status := StatusHealthy
    if maxDepth > 1000 {
        status = StatusDegraded
    }
    
    return ComponentStatus{
        Name:    q.Name(),
        Status:  status,
        Latency: time.Since(start),
        Metadata: ComponentMetadata{
            QueueCount: len(stats),
            TotalDepth: totalDepth,
            MaxDepth:   maxDepth,
        },
        CheckedAt: time.Now(),
    }
}

// WebSocketHealthChecker validates WebSocket server state
type WebSocketHealthChecker struct {
    server *WSServer
}

func (ws *WebSocketHealthChecker) Name() string { return "websocket" }

func (ws *WebSocketHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    stats := ws.server.Stats()
    
    status := StatusHealthy
    if stats.Connections > stats.MaxConnections*90/100 {
        status = StatusDegraded
    }
    
    return ComponentStatus{
        Name:    ws.Name(),
        Status:  status,
        Latency: time.Since(start),
        Metadata: ComponentMetadata{
            Connections:    stats.Connections,
            MaxConnections: stats.MaxConnections,
            MessagesPerSec: stats.MessagesPerSecond,
        },
        CheckedAt: time.Now(),
    }
}

// CasbinHealthChecker validates RBAC enforcer state
type CasbinHealthChecker struct {
    enforcer *casbin.Enforcer
}

func (c *CasbinHealthChecker) Name() string { return "rbac" }

func (c *CasbinHealthChecker) Check(context stdctx.Context) ComponentStatus {
    start := time.Now()
    
    policies := c.enforcer.GetPolicy()
    roles := c.enforcer.GetAllRoles()
    
    return ComponentStatus{
        Name:    c.Name(),
        Status:  StatusHealthy,
        Latency: time.Since(start),
        Metadata: ComponentMetadata{
            PolicyCount: len(policies),
            RoleCount:   len(roles),
        },
        CheckedAt: time.Now(),
    }
}
```

### 3.3 Health Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/health` | GET | Basic liveness check | `200 OK` or `503 Service Unavailable` |
| `/health/ready` | GET | Readiness with all components | Full `HealthResponse` JSON |
| `/health/live` | GET | Kubernetes liveness probe | `200 OK` if process running |
| `/health/workflows` | GET | Workflow-specific health | `WorkflowStats` JSON |
| `/health/queues` | GET | Queue-specific health | Array of `QueueStatus` |

### 3.4 Health Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `Health.Enabled` | bool | `true` | Enable health endpoints |
| `Health.Port` | int | `8200` | Health server port (same as API) |
| `Health.Timeout` | duration | `5s` | Health check timeout |
| `Health.Queue.MaxDepthWarning` | int | `1000` | Queue depth warning threshold |

---

## 4. OpenTelemetry Tracing

### 4.1 Tracer Configuration

```go
package tracing

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
```

### 4.2 Span Definitions

| Span Name | Attributes | Parent |
|-----------|------------|--------|
| `workflow.execute` | workflow_id, trigger_type | - |
| `workflow.step` | step_id, node_type | workflow.execute |
| `node.execute` | node_id, node_type, inputs_hash | workflow.step |
| `node.retry` | attempt, max_attempts | node.execute |
| `trigger.fire` | trigger_id, trigger_type | - |
| `queue.enqueue` | queue, message_type | varies |
| `queue.process` | queue, message_id | - |
| `integration.call` | target, method | node.execute |
| `websocket.message` | direction, type | - |
| `rbac.check` | subject, resource, action | varies |
| `db.query` | operation, table | varies |

### 4.3 Trace Configuration

| Configuration Key | Type | Default | Description |
|-------------------|------|---------|-------------|
| `Tracing.Enabled` | bool | `false` | Enable distributed tracing |
| `Tracing.ServiceName` | string | `nexus-flow-cli` | Service name in traces |
| `Tracing.Environment` | string | `development` | Deployment environment |
| `Tracing.OTLPEndpoint` | string | `localhost:4317` | OTLP gRPC endpoint |
| `Tracing.SamplingRate` | float64 | `0.1` | Trace sampling rate (0.0-1.0) |

---

## 5. Structured Logging

### 5.1 Log Fields

| Field | Type | Description |
|-------|------|-------------|
| `Timestamp` | string | ISO8601 timestamp |
| `Level` | string | Log level (DEBUG, INFO, WARN, ERROR) |
| `Message` | string | Log message |
| `Caller` | string | Source file and line |
| `RequestId` | string | Request correlation ID |
| `WorkflowId` | string | Workflow identifier |
| `StepId` | string | Workflow step identifier |
| `NodeType` | string | Node type |
| `TriggerType` | string | Trigger type |
| `Queue` | string | Queue name |
| `DurationMs` | float64 | Operation duration |
| `Error` | string | Error message |
| `ErrorCode` | int | Error code (8000-8399) |

### 5.2 Log Examples

```json
{
    "Timestamp": "2026-02-04T14:30:00.000Z",
    "Level": "INFO",
    "Message": "Workflow execution started",
    "Caller": "engine/executor.go:142",
    "RequestId": "req_abc123",
    "WorkflowId": "wf_xyz789",
    "TriggerType": "http"
}
```

```json
{
    "Timestamp": "2026-02-04T14:30:05.000Z",
    "Level": "WARN",
    "Message": "Node execution retry",
    "Caller": "node/executor.go:89",
    "WorkflowId": "wf_xyz789",
    "StepId": "step_001",
    "NodeType": "http_request",
    "Attempt": 2,
    "MaxAttempts": 3,
    "Error": "connection timeout"
}
```

---

## 6. Alerting Rules

### 6.1 Prometheus Alerting Rules

```yaml
groups:
  - name: nexusflow_alerts
    interval: 30s
    rules:
      - alert: NexusFlowHighWorkflowFailureRate
        expr: rate(nexusflow_workflow_executions_total{status="failed"}[5m]) / rate(nexusflow_workflow_executions_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Nexus Flow workflow failure rate is high"
          description: "Workflow {{ $labels.workflow_id }} has failure rate above 10%."

      - alert: NexusFlowQueueBacklog
        expr: nexusflow_queue_depth > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Nexus Flow queue backlog detected"
          description: "Queue {{ $labels.queue }} has depth above 1000 for 10 minutes."

      - alert: NexusFlowWebSocketConnectionsHigh
        expr: nexusflow_websocket_connections_active > 900
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Nexus Flow WebSocket connections near limit"
          description: "Active WebSocket connections above 900 (limit 1000)."

      - alert: NexusFlowNodeHighLatency
        expr: histogram_quantile(0.95, rate(nexusflow_node_duration_seconds_bucket[5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Nexus Flow node execution is slow"
          description: "95th percentile latency for {{ $labels.node_type }} is above 10 seconds."

      - alert: NexusFlowRBACCheckFailures
        expr: rate(nexusflow_rbac_checks_total{result="denied"}[5m]) > 100
        for: 5m
        labels:
          severity: info
        annotations:
          summary: "High rate of RBAC denials"
          description: "Resource {{ $labels.resource }} seeing many denied access attempts."
```

---

## 7. Grafana Dashboard

### 7.1 Dashboard Panels

| Panel | Type | Query |
|-------|------|-------|
| Workflow Rate | Graph | `rate(nexusflow_workflow_executions_total[5m])` |
| Workflow Latency P95 | Graph | `histogram_quantile(0.95, rate(nexusflow_workflow_duration_seconds_bucket[5m]))` |
| Active Workflows | Stat | `nexusflow_workflow_active_count` |
| Queue Depth | Graph | `nexusflow_queue_depth` |
| WebSocket Connections | Stat | `nexusflow_websocket_connections_active` |
| Node Execution Rate | Graph | `rate(nexusflow_node_executions_total[5m])` |
| Integration Latency | Graph | `histogram_quantile(0.95, rate(nexusflow_integration_latency_seconds_bucket[5m]))` |
| Error Rate | Graph | `rate(nexusflow_workflow_executions_total{status="failed"}[5m])` |

---

## 8. Error Code Mapping

| Error Code | Metric Label | Description |
|------------|--------------|-------------|
| 8000-8009 | `startup` | Service startup errors |
| 8010-8019 | `workflow_parse` | Workflow definition parsing errors |
| 8020-8029 | `workflow_execute` | Workflow execution errors |
| 8100-8199 | `node_execute` | Node execution errors |
| 8200-8249 | `websocket` | WebSocket communication errors |
| 8250-8299 | `queue` | Queue operation errors |
| 8300-8349 | `trigger` | Trigger activation errors |
| 8350-8399 | `integration` | External integration errors |

---

## 9. Cross-References

| Reference | Location |
|-----------|----------|
| Error Codes | `./04-error-codes.md` |
| API Interface | `./03-openapi-spec.yaml` |
| Implementation Checklist | `./06-implementation-checklist.md` |
| Split DB Integration | `./05-database-architecture.md` |
| GSearch Observability | `../../25-gsearch-cli/01-backend/16-observability.md` |
