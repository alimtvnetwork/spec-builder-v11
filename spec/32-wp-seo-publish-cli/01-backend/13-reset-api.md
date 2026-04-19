# WP SEO Publish CLI: Reset API Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [WP SEO Publish CLI Overview](./00-overview.md)

---

## Overview

WP SEO Publish CLI implements the standardized 2-step Reset API for safe deletion of publications, variable sources, automation configs, and cached data. This supplements the existing per-website reset in `09-import-export.md` with the ecosystem-standard flow.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All websites, publications, variables, settings |
| `website` | Single website | Publications, variables, cache for one website |
| `publications` | Publications only | Publication records and detail DBs |
| `variables` | Variable sources | Variable sources and imported data |
| `automations` | Automations only | Automation configs and run history |
| `cache` | Cache data only | Sitemap cache, category/tag sync cache |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "publications",
  "Filter": {
    "WebsiteId": "ws-abc123",
    "ContentTypes": ["post"],
    "OlderThan": "2026-01-01T00:00:00Z"
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_wsp_abc123",
  "Scope": "publications",
  "ExpiresAt": "2026-02-07T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "Publication",
        "Count": 45,
        "WebsiteSlug": "example-com"
      }
    ],
    "Summary": {
      "TotalPublications": 45,
      "TotalDatabases": 45,
      "EstimatedSize": "12.3 MB"
    }
  },
  "Warnings": [
    "This will remove 45 publication records and their detail databases"
  ]
}
```

### Step 2: Confirm Reset

```
POST /api/v1/reset/confirm
```

```json
{
  "ResetId": "rst_wsp_abc123"
}
```

### Cancel Reset

```
POST /api/v1/reset/cancel
```

---

## Database Schema

```go
type ResetRequest struct {
    Id            string     `gorm:"primaryKey;size:36"`
    Scope         string     `gorm:"not null;size:50"`
    Filter        string     // JSON-encoded
    RequestedAt   time.Time  `gorm:"autoCreateTime"`
    ExpiresAt     time.Time  `gorm:"not null"`
    Status        string     `gorm:"not null;default:'pending'"`
    AffectedItems string     // JSON
    CompletedAt   *time.Time
    DeletedCount  int
    FreedBytes    int64
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| 12550 | 400 | Invalid reset scope |
| 12551 | 400 | Invalid filter criteria |
| 12552 | 404 | Reset request not found |
| 12553 | 410 | Reset request expired |
| 12554 | 409 | Reset already confirmed |
| 12555 | 409 | Reset already cancelled |
| 12556 | 500 | Reset execution failed |

---

## Integration with Existing Reset

The existing `09-import-export.md` Reset operation (2-step phrase confirmation) remains for the UI-driven per-website reset. This Reset API provides the ecosystem-standard programmatic flow with preview, TTL, and cancellation support.

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `spec/06-split-db-architecture/02-reset-api-standard.md` |
| Import/Export Reset | `./09-import-export.md` |
| Settings Service | `./10-settings-service.md` |
| Error Codes | `./08-error-codes.md` |
