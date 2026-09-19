# Adaptive Reasoning Configuration API

**Version:** 5.0.0  
**Updated:** 2026-03-09  
**Status:** Draft

---

## Overview

This specification defines the REST API endpoints for managing Adaptive Reasoning configuration. The API follows the established company-scoped pattern and provides full CRUD operations for reasoning settings.

---

## Base Path

```
/api/v1/settings/reasoning
```

---

## Endpoints

### 1. Get Reasoning Configuration

Retrieve the current reasoning configuration.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/settings/reasoning` |
| **Auth** | Required |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "DefaultMode": "Conditional",
    "Modules": [
      {
        "Module": "Chat",
        "Enabled": true,
        "Mode": "Inherit",
        "Description": "Chat session conversations"
      },
      {
        "Module": "Blog",
        "Enabled": true,
        "Mode": "TwoStage",
        "Description": "Blog post generation"
      },
      {
        "Module": "Code",
        "Enabled": true,
        "Mode": "Inherit",
        "Description": "Code generation/editing"
      },
      {
        "Module": "Faq",
        "Enabled": false,
        "Mode": "Inherit",
        "Description": "FAQ content creation"
      },
      {
        "Module": "Paragraph",
        "Enabled": true,
        "Mode": "Inherit",
        "Description": "Paragraph/content writing"
      }
    ],
    "SkipSignals": [
      "just do it",
      "no questions",
      "skip reasoning",
      "proceed directly"
    ],
    "Connection": {
      "ReconnectBehavior": "AutoResume",
      "MaxQueueSize": 10,
      "ShowIndicator": true
    },
    "UpdatedAt": "2026-02-04T10:30:00Z"
  }
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 9820 | `ErrReasoningModeInvalid` | Configuration corrupted |

---

### 2. Update Reasoning Configuration

Update the reasoning configuration (partial or full).

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/settings/reasoning` |
| **Auth** | Required |

**Request Body:**

```json
{
  "DefaultMode": "TwoStage",
  "Modules": [
    {
      "Module": "Chat",
      "Enabled": true,
      "Mode": "Conditional"
    }
  ],
  "SkipSignals": ["just do it", "no questions"],
  "Connection": {
    "ReconnectBehavior": "UserConfirm",
    "MaxQueueSize": 20
  }
}
```

**Field Validation:**

| Field | Type | Validation |
|-------|------|------------|
| `DefaultMode` | `string` | One of: `TwoStage`, `SinglePrompt`, `Conditional` |
| `Modules[].Module` | `string` | One of: `Chat`, `Blog`, `Code`, `Faq`, `Paragraph` |
| `Modules[].Enabled` | `boolean` | Required |
| `Modules[].Mode` | `string` | One of: `TwoStage`, `SinglePrompt`, `Conditional`, `Inherit` |
| `SkipSignals` | `string[]` | Each: 2-100 chars, max 20 items |
| `Connection.ReconnectBehavior` | `string` | One of: `AutoResume`, `UserConfirm`, `FreshStart` |
| `Connection.MaxQueueSize` | `number` | Range: 1-100 |
| `Connection.ShowIndicator` | `boolean` | Optional |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "DefaultMode": "TwoStage",
    "Modules": [...],
    "SkipSignals": [...],
    "Connection": {...},
    "UpdatedAt": "2026-02-04T10:35:00Z"
  },
  "Message": "Reasoning configuration updated"
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 9820 | `ErrReasoningModeInvalid` | Invalid mode value |
| 9311 | `ErrRequestInvalid` | Validation failed |

---

### 3. Reset to Defaults

Reset reasoning configuration to factory defaults.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/settings/reasoning/reset` |
| **Auth** | Required |

**Request Body:** (optional)

```json
{
  "Scope": "All"
}
```

**Scope Options:**

| Scope | Description |
|-------|-------------|
| `All` | Reset everything to defaults |
| `Modules` | Reset only module settings |
| `Signals` | Reset only skip signals |
| `Connection` | Reset only connection settings |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "DefaultMode": "Conditional",
    "Modules": [...],
    "SkipSignals": ["just do it", "no questions", "skip reasoning", "proceed directly"],
    "Connection": {
      "ReconnectBehavior": "AutoResume",
      "MaxQueueSize": 10,
      "ShowIndicator": true
    },
    "UpdatedAt": "2026-02-04T10:40:00Z"
  },
  "Message": "Reasoning configuration reset to defaults"
}
```

---

### 4. Get Module Configuration

Retrieve configuration for a specific module.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/settings/reasoning/modules/{module}` |
| **Auth** | Required |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `module` | `string` | Module identifier: `Chat`, `Blog`, `Code`, `Faq`, `Paragraph` |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Module": "Blog",
    "Enabled": true,
    "Mode": "TwoStage",
    "EffectiveMode": "TwoStage",
    "Description": "Blog post generation",
    "Stats": {
      "TotalRequests": 142,
      "ReasoningTriggered": 98,
      "QuestionsAsked": 45,
      "SkipSignalsUsed": 12
    }
  }
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 9820 | `ErrReasoningModeInvalid` | Unknown module |

---

### 5. Update Module Configuration

Update configuration for a specific module.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/settings/reasoning/modules/{module}` |
| **Auth** | Required |

**Request Body:**

```json
{
  "Enabled": true,
  "Mode": "Conditional"
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Module": "Blog",
    "Enabled": true,
    "Mode": "Conditional",
    "EffectiveMode": "Conditional",
    "Description": "Blog post generation"
  },
  "Message": "Module configuration updated"
}
```

---

### 6. List Skip Signals

Get all configured skip signals.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/settings/reasoning/signals` |
| **Auth** | Required |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Signals": [
      { "Id": 1, "Signal": "just do it", "IsDefault": true, "UsageCount": 45 },
      { "Id": 2, "Signal": "no questions", "IsDefault": true, "UsageCount": 32 },
      { "Id": 3, "Signal": "skip reasoning", "IsDefault": true, "UsageCount": 18 },
      { "Id": 4, "Signal": "proceed directly", "IsDefault": true, "UsageCount": 8 },
      { "Id": 5, "Signal": "быстро", "IsDefault": false, "UsageCount": 5 }
    ],
    "Count": 5,
    "MaxAllowed": 20
  }
}
```

---

### 7. Add Skip Signal

Add a new skip signal.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/settings/reasoning/signals` |
| **Auth** | Required |

**Request Body:**

```json
{
  "Signal": "do it now"
}
```

**Validation:**

| Rule | Constraint |
|------|------------|
| Length | 2-100 characters |
| Uniqueness | No duplicates (case-insensitive) |
| Max count | 20 signals total |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 6,
    "Signal": "do it now",
    "IsDefault": false,
    "UsageCount": 0
  },
  "Message": "Skip signal added"
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 9311 | `ErrRequestInvalid` | Signal too short/long |
| 9824 | `ErrQuestionLimitExceeded` | Max 20 signals reached |

---

### 8. Delete Skip Signal

Remove a skip signal.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/settings/reasoning/signals/{id}` |
| **Auth** | Required |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Signal ID |

**Response:**

```json
{
  "Success": true,
  "Message": "Skip signal deleted"
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 9311 | `REQUEST_INVALID` | Cannot delete default signals |

---

### 9. Get Connection Settings

Get WebSocket connection configuration.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/settings/reasoning/connection` |
| **Auth** | Required |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "ReconnectBehavior": "AutoResume",
    "MaxQueueSize": 10,
    "ShowIndicator": true,
    "RetryConfig": {
      "BaseDelay": 1000,
      "MaxDelay": 30000,
      "MaxAttempts": 10,
      "JitterRange": 500
    },
    "HeartbeatConfig": {
      "PingInterval": 30000,
      "PongTimeout": 5000,
      "MissedThreshold": 2
    }
  }
}
```

---

### 10. Update Connection Settings

Update WebSocket connection configuration.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/settings/reasoning/connection` |
| **Auth** | Required |

**Request Body:**

```json
{
  "ReconnectBehavior": "UserConfirm",
  "MaxQueueSize": 25,
  "ShowIndicator": true
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "ReconnectBehavior": "UserConfirm",
    "MaxQueueSize": 25,
    "ShowIndicator": true,
    "RetryConfig": {...},
    "HeartbeatConfig": {...}
  },
  "Message": "Connection settings updated"
}
```

---

## Data Structures

### Go Structs

```go
type ReasoningConfig struct {
    DefaultMode  string
    Modules      []ModuleReasoningConfig
    SkipSignals  []string
    Connection   ConnectionConfig
    UpdatedAt    time.Time
}

type ModuleReasoningConfig struct {
    Module        string
    Enabled       bool
    Mode          string
    EffectiveMode string    `json:",omitempty"`
    Description   string    `json:",omitempty"`
}

type ConnectionConfig struct {
    ReconnectBehavior string
    MaxQueueSize      int
    ShowIndicator     bool
    RetryConfig       *RetryConfig    `json:",omitempty"`
    HeartbeatConfig   *HeartbeatConfig `json:",omitempty"`
}

type RetryConfig struct {
    BaseDelay   int
    MaxDelay    int
    MaxAttempts int
    JitterRange int
}

type HeartbeatConfig struct {
    PingInterval    int
    PongTimeout     int
    MissedThreshold int
}

type SkipSignal struct {
    Id         int
    Signal     string
    IsDefault  bool
    UsageCount int
}

type ModuleStats struct {
    TotalRequests      int
    ReasoningTriggered int
    QuestionsAsked     int
    SkipSignalsUsed    int
}
```

---

## Database Schema

### Settings Table (Root DB)

```sql
-- Stored in data/aibridge.db → Settings table
-- Key: "ReasoningConfig"
-- Value: JSON blob of ReasoningConfig
-- Type: "Json"

-- Skip signals with usage tracking
CREATE TABLE IF NOT EXISTS SkipSignals (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    Signal      TEXT NOT NULL UNIQUE,
    IsDefault   INTEGER DEFAULT 0,
    UsageCount  INTEGER DEFAULT 0,
    CreatedAt   TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Module-specific stats
CREATE TABLE IF NOT EXISTS ReasoningStats (
    Module              TEXT PRIMARY KEY,
    TotalRequests       INTEGER DEFAULT 0,
    ReasoningTriggered  INTEGER DEFAULT 0,
    QuestionsAsked      INTEGER DEFAULT 0,
    SkipSignalsUsed     INTEGER DEFAULT 0,
    UpdatedAt           TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## Default Values

```json
{
  "DefaultMode": "Conditional",
  "Modules": [
    { "Module": "Chat", "Enabled": true, "Mode": "Inherit" },
    { "Module": "Blog", "Enabled": true, "Mode": "Inherit" },
    { "Module": "Code", "Enabled": true, "Mode": "Inherit" },
    { "Module": "Faq", "Enabled": true, "Mode": "Inherit" },
    { "Module": "Paragraph", "Enabled": true, "Mode": "Inherit" }
  ],
  "SkipSignals": [
    "just do it",
    "no questions",
    "skip reasoning",
    "proceed directly"
  ],
  "Connection": {
    "ReconnectBehavior": "AutoResume",
    "MaxQueueSize": 10,
    "ShowIndicator": true
  }
}
```

---

## Seeding

Configuration is seeded from `config/reasoning.seed.yaml`:

```yaml
Reasoning:
  DefaultMode: Conditional
  Modules:
    Chat:
      Enabled: true
      Mode: Inherit
    Blog:
      Enabled: true
      Mode: TwoStage
    Code:
      Enabled: true
      Mode: Inherit
    Faq:
      Enabled: true
      Mode: Inherit
    Paragraph:
      Enabled: true
      Mode: Inherit
  SkipSignals:
    - "just do it"
    - "no questions"
    - "skip reasoning"
    - "proceed directly"
  Connection:
    ReconnectBehavior: AutoResume
    MaxQueueSize: 10
    ShowIndicator: true
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Adaptive Reasoning Flow | `37-adaptive-reasoning-flow.md` |
| WebSocket Manager | `38-websocket-connection-manager.md` |
| Settings UI | `../02-frontend/04-adaptive-reasoning-settings-ui.md` |
| Error Codes | `05-error-codes.md` (9820-9829) |
| API Interface | `04-api-interface.md` |
