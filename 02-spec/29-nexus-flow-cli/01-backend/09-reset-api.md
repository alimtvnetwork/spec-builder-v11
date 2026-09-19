# Nexus Flow CLI: Reset API Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

Nexus Flow CLI implements the standardized 2-step Reset API for safe deletion of workflows, execution history, and cached state data. This follows the project-wide Reset API Standard.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All workflows, executions, cache, settings |
| `workflows` | Workflow definitions only | Stored workflow templates and versions |
| `executions` | Execution history only | Completed/failed execution records |
| `cache` | Cache data only | Checkpoint states, temp data |
| `rbac` | RBAC data only | Role assignments, permissions cache |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "executions",
  "Filter": {
    "WorkflowIds": ["wf-123", "wf-456"],
    "Status": ["completed", "failed"],
    "OlderThan": "2026-01-01T00:00:00Z"
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_nf_abc123def456",
  "Scope": "executions",
  "ExpiresAt": "2026-02-04T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "WorkflowExecution",
        "Id": "exec-789",
        "WorkflowId": "wf-123",
        "Status": "completed",
        "CompletedAt": "2025-12-15T08:30:00Z"
      },
      {
        "Type": "WorkflowExecution",
        "Id": "exec-012",
        "WorkflowId": "wf-456",
        "Status": "failed",
        "CompletedAt": "2025-11-20T14:00:00Z"
      }
    ],
    "Summary": {
      "TotalExecutions": 2,
      "TotalCheckpoints": 15,
      "OldestItem": "2025-11-20T14:00:00Z"
    }
  },
  "Warnings": [
    "This will remove 2 workflow executions and 15 checkpoints permanently"
  ]
}
```

---

### Step 2: Confirm Reset

```
POST /api/v1/reset/confirm
```

**Request Body:**

```json
{
  "ResetId": "rst_nf_abc123def456"
}
```

**Response (200 OK):**

```json
{
  "Status": "completed",
  "DeletedItems": {
    "Executions": 2,
    "Checkpoints": 15,
    "CacheFiles": 0
  },
  "FreedSpace": "12.8 MB",
  "CompletedAt": "2026-02-04T10:01:30Z"
}
```

---

### Cancel Reset (Optional)

```
POST /api/v1/reset/cancel
```

**Request Body:**

```json
{
  "ResetId": "rst_nf_abc123def456"
}
```

**Response (200 OK):**

```json
{
  "Status": "cancelled",
  "ResetId": "rst_nf_abc123def456",
  "CancelledAt": "2026-02-04T10:02:00Z"
}
```

---

## Database Schema

### ResetRequests Table (Root DB: `data/nexusflow.db`)

| Column | Type | Description |
|--------|------|-------------|
| Id | TEXT | Primary key (UUID) |
| Scope | TEXT | Reset scope (all, workflows, executions, cache, rbac) |
| Filter | TEXT | JSON-encoded filter criteria |
| RequestedAt | DATETIME | Request timestamp |
| ExpiresAt | DATETIME | Confirmation deadline |
| Status | TEXT | pending, confirmed, cancelled, expired |
| AffectedItems | TEXT | JSON array of items to delete |
| CompletedAt | DATETIME | Completion timestamp (nullable) |
| DeletedCount | INTEGER | Number of items deleted |
| FreedBytes | INTEGER | Storage freed in bytes |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NF-8301 | 400 | Invalid reset scope |
| NF-8302 | 400 | Invalid filter criteria |
| NF-8303 | 404 | Reset request not found |
| NF-8304 | 410 | Reset request expired |
| NF-8305 | 409 | Reset already confirmed |
| NF-8306 | 409 | Reset already cancelled |
| NF-8307 | 500 | Reset execution failed |
| NF-8308 | 403 | Insufficient permissions for scope |

---

## Filter Options

### Workflow Filters

| Filter | Type | Description |
|--------|------|-------------|
| `WorkflowIds` | string[] | Specific workflow IDs |
| `Names` | string[] | Workflow names (glob patterns) |
| `OlderThan` | datetime | Created before date |
| `NewerThan` | datetime | Created after date |
| `Tags` | string[] | Workflow tags |
| `Versions` | int[] | Specific version numbers |

### Execution Filters

| Filter | Type | Description |
|--------|------|-------------|
| `ExecutionIds` | string[] | Specific execution IDs |
| `WorkflowIds` | string[] | Parent workflow IDs |
| `Status` | string[] | Execution statuses (completed, failed, cancelled, timeout) |
| `OlderThan` | datetime | Completed before date |
| `TriggeredBy` | string[] | User IDs who triggered |

### Cache Filters

| Filter | Type | Description |
|--------|------|-------------|
| `WorkflowIds` | string[] | Related workflow IDs |
| `OlderThan` | datetime | Cached before date |
| `CheckpointTypes` | string[] | Types (node_state, branch_state, full) |

### RBAC Filters

| Filter | Type | Description |
|--------|------|-------------|
| `UserIds` | string[] | Specific user IDs |
| `Roles` | string[] | Role names |
| `WorkflowIds` | string[] | Workflow-specific permissions |

---

## Configuration

### Seedable Settings (config.seed.json)

```json
{
  "Settings": [
    {
      "Key": "Reset.ConfirmationTtlMinutes",
      "Value": "5",
      "Category": "reset",
      "ValueType": "int"
    },
    {
      "Key": "Reset.RequireConfirmation",
      "Value": "true",
      "Category": "reset",
      "ValueType": "bool"
    },
    {
      "Key": "Reset.MaxAffectedItems",
      "Value": "500",
      "Category": "reset",
      "ValueType": "int"
    },
    {
      "Key": "Reset.RequireAdminForAll",
      "Value": "true",
      "Category": "reset",
      "ValueType": "bool"
    }
  ]
}
```

---

## Implementation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Nexus Flow Reset Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                 Nexus Flow API               Database   │
│    │                          │                          │      │
│    │  POST /reset/request     │                          │      │
│    │─────────────────────────>│                          │      │
│    │                          │  Validate scope          │      │
│    │                          │  Check RBAC permissions  │      │
│    │                          │  Calculate affected      │      │
│    │                          │  items (workflows,       │      │
│    │                          │  executions, cache)      │      │
│    │                          │                          │      │
│    │                          │  INSERT ResetRequest     │      │
│    │                          │─────────────────────────>│      │
│    │                          │                          │      │
│    │  200 OK (ResetId,        │                          │      │
│    │  Preview, ExpiresAt)     │                          │      │
│    │<─────────────────────────│                          │      │
│    │                          │                          │      │
│    │  POST /reset/confirm     │                          │      │
│    │  (ResetId)               │                          │      │
│    │─────────────────────────>│                          │      │
│    │                          │  Validate ResetId        │      │
│    │                          │  Check not expired       │      │
│    │                          │  Re-verify RBAC          │      │
│    │                          │                          │      │
│    │                          │  BEGIN TRANSACTION       │      │
│    │                          │─────────────────────────>│      │
│    │                          │  DELETE executions       │      │
│    │                          │  DELETE checkpoints      │      │
│    │                          │  DELETE cache files      │      │
│    │                          │  UPDATE ResetRequest     │      │
│    │                          │  COMMIT                  │      │
│    │                          │<─────────────────────────│      │
│    │                          │                          │      │
│    │  200 OK (completed,      │                          │      │
│    │  DeletedItems, Freed)    │                          │      │
│    │<─────────────────────────│                          │      │
│    │                          │                          │      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Authorization | `all` and `rbac` scopes require admin role |
| RBAC Integration | Reset permissions checked per workflow |
| Rate Limiting | Max 5 reset requests per minute |
| Audit Logging | All reset operations logged with user context |
| Confirmation | Required for all destructive operations |
| WebSocket Notify | Active clients notified of relevant deletions |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| Settings Service | `./08-settings-service.md` |
| Error Codes | `./04-error-codes.md` |
| Database Architecture | `./05-database-architecture.md` |
| Observability | `./07-observability.md` |
