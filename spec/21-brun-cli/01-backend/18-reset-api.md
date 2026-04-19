# BRun CLI: Reset API Specification

**Version:** 4.0.0  
**Updated:** 2026-03-09  

---

## Overview

BRun CLI implements the standardized 2-step Reset API for safe deletion of build profiles, cached configurations, and runtime data. This follows the project-wide Reset API Standard.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All profiles, cache, history, settings |
| `profiles` | Build profiles only | Saved build configurations |
| `cache` | Cache data only | Compiled assets, temp files |
| `history` | Build history only | Execution logs, statistics |
| `ports` | Port allocations | Reserved port mappings |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "profiles",
  "Filter": {
    "ProfileIds": ["profile-123", "profile-456"],
    "OlderThan": "2026-01-01T00:00:00Z"
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_abc123def456",
  "Scope": "profiles",
  "ExpiresAt": "2026-02-04T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "BuildProfile",
        "Id": "profile-123",
        "Name": "Production Build",
        "CreatedAt": "2025-12-15T08:30:00Z"
      },
      {
        "Type": "BuildProfile",
        "Id": "profile-456",
        "Name": "Development Build",
        "CreatedAt": "2025-11-20T14:00:00Z"
      }
    ],
    "Summary": {
      "TotalProfiles": 2,
      "TotalCacheSize": "45.2 MB",
      "OldestItem": "2025-11-20T14:00:00Z"
    }
  },
  "Warnings": [
    "This will remove 2 build profiles permanently"
  ]
}
```

### Step 2: Confirm Reset

```
POST /api/v1/reset/confirm
```

**Request Body:**

```json
{
  "ResetId": "rst_abc123def456"
}
```

**Response (200 OK):**

```json
{
  "Status": "completed",
  "DeletedItems": {
    "Profiles": 2,
    "CacheFiles": 0,
    "HistoryRecords": 0
  },
  "FreedSpace": "45.2 MB",
  "CompletedAt": "2026-02-04T10:01:30Z"
}
```

### Cancel Reset

```
POST /api/v1/reset/cancel
```

**Request Body:**

```json
{
  "ResetId": "rst_abc123def456"
}
```

**Response (200 OK):**

```json
{
  "Status": "cancelled",
  "ResetId": "rst_abc123def456",
  "CancelledAt": "2026-02-04T10:02:00Z"
}
```

---

## Database Schema

### ResetRequests Table (Root DB: `data/brun.db`)

| Column | Type | Description |
|--------|------|-------------|
| Id | TEXT | Primary key (UUID) |
| Scope | TEXT | Reset scope (all, profiles, cache, history, ports) |
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
| BR-7401 | 400 | Invalid reset scope |
| BR-7402 | 400 | Invalid filter criteria |
| BR-7403 | 404 | Reset request not found |
| BR-7404 | 410 | Reset request expired |
| BR-7405 | 409 | Reset already confirmed |
| BR-7406 | 409 | Reset already cancelled |
| BR-7407 | 500 | Reset execution failed |

---

## Filter Options

### Profile Filters

| Filter | Type | Description |
|--------|------|-------------|
| `profileIds` | string[] | Specific profile IDs |
| `names` | string[] | Profile names (glob patterns) |
| `olderThan` | datetime | Created before date |
| `newerThan` | datetime | Created after date |
| `tags` | string[] | Profile tags |

### Cache Filters

| Filter | Type | Description |
|--------|------|-------------|
| `projectPaths` | string[] | Specific project paths |
| `olderThan` | datetime | Cached before date |
| `minSize` | int | Minimum cache size (bytes) |
| `maxSize` | int | Maximum cache size (bytes) |

### History Filters

| Filter | Type | Description |
|--------|------|-------------|
| `buildIds` | string[] | Specific build IDs |
| `status` | string[] | Build statuses (success, failed, cancelled) |
| `olderThan` | datetime | Executed before date |
| `projectPaths` | string[] | Project paths |

---

## Configuration

### Seedable Settings (config.seed.json)

```json
{
  "settings": [
    {
      "key": "reset.confirmationTtlMinutes",
      "value": "5",
      "category": "reset",
      "valueType": "int"
    },
    {
      "key": "reset.requireConfirmation",
      "value": "true",
      "category": "reset",
      "valueType": "bool"
    },
    {
      "key": "reset.maxAffectedItems",
      "value": "1000",
      "category": "reset",
      "valueType": "int"
    }
  ]
}
```

---

## Implementation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Reset Flow Diagram                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                    BRun API                  Database   │
│    │                          │                          │      │
│    │  POST /reset/request     │                          │      │
│    │─────────────────────────>│                          │      │
│    │                          │  Validate scope          │      │
│    │                          │  Calculate affected      │      │
│    │                          │  items                   │      │
│    │                          │                          │      │
│    │                          │  INSERT ResetRequest     │      │
│    │                          │─────────────────────────>│      │
│    │                          │                          │      │
│    │  200 OK (resetId,        │                          │      │
│    │  preview, expiresAt)     │                          │      │
│    │<─────────────────────────│                          │      │
│    │                          │                          │      │
│    │  POST /reset/confirm     │                          │      │
│    │  (resetId)               │                          │      │
│    │─────────────────────────>│                          │      │
│    │                          │  Validate resetId        │      │
│    │                          │  Check not expired       │      │
│    │                          │                          │      │
│    │                          │  BEGIN TRANSACTION       │      │
│    │                          │─────────────────────────>│      │
│    │                          │  DELETE affected items   │      │
│    │                          │  UPDATE ResetRequest     │      │
│    │                          │  COMMIT                  │      │
│    │                          │<─────────────────────────│      │
│    │                          │                          │      │
│    │  200 OK (completed,      │                          │      │
│    │  deletedItems, freed)    │                          │      │
│    │<─────────────────────────│                          │      │
│    │                          │                          │      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Authorization | Requires admin role for `all` scope |
| Rate Limiting | Max 10 reset requests per minute |
| Audit Logging | All reset operations logged |
| Confirmation | Required for all destructive operations |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `spec/06-split-db-architecture/02-reset-api-standard.md` |
| Settings Service | `./17-settings-service.md` |
| Error Handling | `./06-error-handling.md` |
| OpenAPI Specification | `./openapi-brun.yaml` |
