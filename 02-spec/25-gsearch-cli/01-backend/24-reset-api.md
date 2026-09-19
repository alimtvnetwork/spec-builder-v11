# GSearch CLI: Reset API Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [GSearch CLI Overview](./00-overview.md)

---

## Overview

GSearch CLI implements the standardized 2-step Reset API for safe deletion of search history, cached results, RAG exports, and BI analytics data. This follows the project-wide Reset API Standard.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All caches, history, RAG exports, BI data, settings |
| `cache` | Search cache only | Cached search results, SERP data |
| `history` | Search history only | Query logs, execution records |
| `rag` | RAG exports only | Exported RAG chunks and embeddings |
| `bi` | BI analytics only | Trend data, position tracking, contact extraction |
| `crawler` | Crawler data only | Full-site crawl results, sitemap caches |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "cache",
  "Filter": {
    "Engines": ["google", "bing"],
    "OlderThan": "2026-01-01T00:00:00Z"
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_gs_abc123def456",
  "Scope": "cache",
  "ExpiresAt": "2026-02-07T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "CachedSearch",
        "Count": 1542,
        "SizeBytes": 15728640
      }
    ],
    "Summary": {
      "TotalRecords": 1542,
      "TotalCacheSize": "15.0 MB",
      "OldestItem": "2025-06-15T08:30:00Z"
    }
  },
  "Warnings": [
    "This will remove 1542 cached search results permanently"
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
  "ResetId": "rst_gs_abc123def456"
}
```

**Response (200 OK):**

```json
{
  "Status": "completed",
  "DeletedItems": {
    "CachedSearches": 1542,
    "RagExports": 0,
    "HistoryRecords": 0
  },
  "FreedSpace": "15.0 MB",
  "CompletedAt": "2026-02-07T10:01:30Z"
}
```

---

### Cancel Reset

```
POST /api/v1/reset/cancel
```

**Request Body:**

```json
{
  "ResetId": "rst_gs_abc123def456"
}
```

---

## Database Schema

### ResetRequests Table (Root DB: `data/gsearch.db`)

```go
type ResetRequest struct {
    Id            string     `gorm:"primaryKey;size:36"`
    Scope         string     `gorm:"not null;size:50"`
    Filter        string     // JSON-encoded filter criteria
    RequestedAt   time.Time  `gorm:"autoCreateTime"`
    ExpiresAt     time.Time  `gorm:"not null"`
    Status        string     `gorm:"not null;default:'pending'"` // pending, confirmed, cancelled, expired
    AffectedItems string     // JSON array
    CompletedAt   *time.Time
    DeletedCount  int
    FreedBytes    int64
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| GS-7080 | 400 | Invalid reset scope |
| GS-7081 | 400 | Invalid filter criteria |
| GS-7082 | 404 | Reset request not found |
| GS-7083 | 410 | Reset request expired |
| GS-7084 | 409 | Reset already confirmed |
| GS-7085 | 409 | Reset already cancelled |
| GS-7086 | 500 | Reset execution failed |

---

## Filter Options

### Cache Filters

| Filter | Type | Description |
|--------|------|-------------|
| `Engines` | string[] | Specific search engines |
| `OlderThan` | datetime | Cached before date |
| `Platforms` | string[] | Platform-specific caches |

### History Filters

| Filter | Type | Description |
|--------|------|-------------|
| `QueryPatterns` | string[] | Query text patterns (glob) |
| `OlderThan` | datetime | Executed before date |
| `Engines` | string[] | Engine filter |

### BI Filters

| Filter | Type | Description |
|--------|------|-------------|
| `Modules` | string[] | BI modules (trend, position, contact) |
| `OlderThan` | datetime | Data before date |

---

## Configuration

### Seedable Settings

```json
{
  "Key": "Reset.ConfirmationTtlMinutes",
  "Value": "5",
  "Category": "Reset",
  "ValueType": "int"
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| Settings Service | `./21-settings-service.md` |
| Error Codes | `./15-error-codes.md` |
| Observability | `./16-observability.md` |
