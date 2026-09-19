# Nexus Flow CLI: Settings Service

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

Nexus Flow CLI implements a standardized Golang `SettingsService` interface for managing workflow engine configurations. Settings are stored in the Root DB and support runtime configurability through seedable configuration.

---

## Database Schema

### Settings Table (Root DB: `data/nexusflow.db`)

| Column | Type | Description |
|--------|------|-------------|
| Id | TEXT | Primary key (UUID) |
| Key | TEXT | Setting key (unique, indexed) |
| Value | TEXT | Setting value (JSON-encoded for complex types) |
| Category | TEXT | Grouping category |
| Version | INTEGER | Schema version for migrations |
| ValueType | TEXT | Type hint — `value_type.Variant` (see `10-enum-architecture.md` §18) |
| CreatedAt | DATETIME | Creation timestamp |
| UpdatedAt | DATETIME | Last modification timestamp |

---

## Service Interface

```go
type SettingsService interface {
    // Core accessors
    GetString(key string) appfault.Result[string]
    GetInt(key string) appfault.Result[int]
    GetBool(key string) appfault.Result[bool]
    GetDuration(key string) appfault.Result[time.Duration]
    GetJson(key string, target json.Unmarshaler) *appfault.AppError
    
    // Workflow-specific accessors
    GetWorkflowTimeout(workflowType string) time.Duration
    GetMaxConcurrentNodes() int
    GetRetryPolicy(nodeType string) RetryPolicy
    GetWebSocketConfig() WebSocketConfig
    
    // Setters
    Set(key string, value string) *appfault.AppError
    SetWithCategory(key, value, category string) *appfault.AppError
    
    // Bulk operations
    // Note: SettingSlice is defined in types.go (created from generic appfault.ResultSlice[Setting]):
    // type SettingSlice = appfault.ResultSlice[Setting]
    GetByCategory(category string) SettingSlice
    SeedFromConfig(configPath string) *appfault.AppError
    
    // Cache management
    InvalidateCache() *appfault.AppError
    RefreshCache() *appfault.AppError
}
```

---

## Setting Categories

| Category | Description |
|----------|-------------|
| `workflow` | Workflow execution settings |
| `websocket` | WebSocket connection settings |
| `node` | Node execution settings |
| `rbac` | Role-based access control |
| `observability` | Metrics and tracing settings |
| `reset` | Reset API configuration |

---

## Key Settings

### Workflow Category

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Workflow.DefaultTimeout` | duration | `30m` | Default workflow execution timeout |
| `Workflow.MaxConcurrentWorkflows` | int | `100` | Maximum concurrent workflow executions |
| `Workflow.CheckpointInterval` | duration | `5s` | State checkpoint frequency |
| `Workflow.RetryMaxAttempts` | int | `3` | Default retry attempts for failed nodes |

### WebSocket Category

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Websocket.PingInterval` | duration | `30s` | WebSocket ping interval |
| `Websocket.PongTimeout` | duration | `10s` | Pong response timeout |
| `Websocket.MaxMessageSize` | int | `1048576` | Maximum message size (1MB) |
| `Websocket.WriteBufferSize` | int | `4096` | Write buffer size |

### Node Category

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Node.ExecutionTimeout` | duration | `5m` | Individual node timeout |
| `Node.MaxParallelBranches` | int | `10` | Maximum parallel branch executions |
| `Node.RetryBackoffBase` | duration | `1s` | Retry backoff base duration |
| `Node.RetryBackoffMax` | duration | `1m` | Maximum retry backoff |

### RBAC Category

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Rbac.Enabled` | bool | `true` | Enable RBAC enforcement |
| `Rbac.CacheTimeout` | duration | `5m` | Permission cache TTL |
| `Rbac.DefaultRole` | string | `viewer` | Default role for new users |

### Observability Category

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Observability.MetricsEnabled` | bool | `true` | Enable Prometheus metrics |
| `Observability.TracingEnabled` | bool | `true` | Enable OpenTelemetry tracing |
| `Observability.LogLevel` | string | `info` | Log verbosity level |

### Reset Category

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Reset.ConfirmationTtlMinutes` | int | `5` | Reset confirmation window |
| `Reset.RequireConfirmation` | bool | `true` | Require two-step confirmation |

---

## Seed Configuration

### config.seed.json

```json
{
  "settings": [
    {
      "Key": "Workflow.DefaultTimeout",
      "Value": "30m",
      "Category": "Workflow",
      "ValueType": "duration"
    },
    {
      "Key": "Workflow.MaxConcurrentWorkflows",
      "Value": "100",
      "Category": "Workflow",
      "ValueType": "int"
    },
    {
      "Key": "Websocket.PingInterval",
      "Value": "30s",
      "Category": "Websocket",
      "ValueType": "duration"
    },
    {
      "Key": "Node.ExecutionTimeout",
      "Value": "5m",
      "Category": "Node",
      "ValueType": "duration"
    },
    {
      "Key": "Rbac.Enabled",
      "Value": "true",
      "Category": "Rbac",
      "ValueType": "bool"
    }
  ]
}
```

---

## Implementation Constants

```go
package settings

// Workflow settings
const (
    KeyWorkflowDefaultTimeout      = "Workflow.DefaultTimeout"
    KeyWorkflowMaxConcurrent       = "Workflow.MaxConcurrentWorkflows"
    KeyWorkflowCheckpointInterval  = "Workflow.CheckpointInterval"
    KeyWorkflowRetryMaxAttempts    = "Workflow.RetryMaxAttempts"
)

// WebSocket settings
const (
    KeyWebSocketPingInterval    = "Websocket.PingInterval"
    KeyWebSocketPongTimeout     = "Websocket.PongTimeout"
    KeyWebSocketMaxMessageSize  = "Websocket.MaxMessageSize"
    KeyWebSocketWriteBuffer     = "Websocket.WriteBufferSize"
)

// Node settings
const (
    KeyNodeExecutionTimeout    = "Node.ExecutionTimeout"
    KeyNodeMaxParallelBranches = "Node.MaxParallelBranches"
    KeyNodeRetryBackoffBase    = "Node.RetryBackoffBase"
    KeyNodeRetryBackoffMax     = "Node.RetryBackoffMax"
)

// RBAC settings
const (
    KeyRbacEnabled      = "Rbac.Enabled"
    KeyRbacCacheTimeout = "Rbac.CacheTimeout"
    KeyRbacDefaultRole  = "Rbac.DefaultRole"
)
```

---

## Caching Strategy

| Aspect | Implementation |
|--------|----------------|
| Cache Type | In-memory with sync.RWMutex |
| TTL | 5 minutes (configurable) |
| Invalidation | On write + manual refresh |
| Preload | All settings loaded on startup |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| Observability | `./07-observability.md` |
| Implementation Checklist | `./06-implementation-checklist.md` |
