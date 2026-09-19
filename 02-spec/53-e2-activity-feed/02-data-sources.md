# E2 Activity Feed — Data Sources & Aggregation

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

The activity feed aggregates events from five distinct data sources across Go backend and WordPress sites. This document specifies each source's schema, normalization rules, and the fan-out aggregation strategy.

---

## Data Sources

### 1. Publish Sessions (Go — Local SQLite)

**Table:** `publish_history`  
**Type:** `publish`  
**Actions:** `deploy`, `self-update`

| Field | Source Column | Mapping |
|-------|--------------|---------|
| `id` | `id` | Prefixed: `pub_{id}` |
| `timestamp` | `published_at` | UTC ISO-8601 |
| `siteId` | `site_id` | Direct |
| `siteName` | JOIN `sites.name` | Lookup |
| `title` | Derived | `"Published {pluginName} v{version}"` or `"Self-update {from} → {to}"` |
| `source` | — | `"go"` |

**Metadata fields:** `pluginId`, `pluginName`, `version`, `newVersion`, `filesUpdated`, `durationMs`, `sessionId`, `isSelfUpdate`

---

### 2. Snapshot Events (WordPress)

**WP Endpoint:** `POST /wp-json/riseup-asia-uploader/v1/snapshots/activity`  
**Type:** `snapshot`  
**Actions:** `create`, `restore`, `delete`, `export`, `import`, `cleanup`

**Request body:**
```json
{
  "limit": 50,
  "offset": 0,
  "from": "2026-01-01T00:00:00Z",
  "to": "2026-03-20T00:00:00Z"
}
```

**Metadata fields:** `snapshotId`, `snapshotType`, `tables`, `size`, `mode`  
**Source:** `"wordpress"`

---

### 3. Plugin Events (WordPress)

**WP Endpoint:** `POST /wp-json/riseup-asia-uploader/v1/activity-logs`  
**Type:** `plugin`  
**Actions:** `install`, `activate`, `deactivate`, `delete`, `upload`

**Source:** `"wordpress"`

---

### 4. Connection Events (Go — Local SQLite)

**Derived from:** `sites` table status changes + connection test logs  
**Type:** `connection`  
**Actions:** `test`, `connect`, `disconnect`

**Source:** `"go"`

---

### 5. Config Events (Go — Local SQLite)

**Derived from:** Settings change audit trail  
**Type:** `config`  
**Actions:** `update`

**Metadata fields:** `settingName`, `oldValue`, `newValue`  
**Source:** `"go"`

---

## Aggregation Strategy

### Fan-Out Flow

1. **Parallel fetch:** Query Go SQLite + fan-out HTTP calls to all connected WordPress sites concurrently
2. **Normalize timestamps:** All sources normalized to UTC ISO-8601
3. **Merge & sort:** Combine all source arrays, sort by `timestamp DESC`
4. **Paginate:** Apply `offset`/`limit` after merge
5. **Cache:** Short-lived cache (30s TTL) keyed by full query parameter hash

### Performance Constraints

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Max connected sites | ~20 | Typical deployment ceiling |
| WP call timeout | 5 seconds | Prevent single-site blocking |
| Cache TTL | 30 seconds | Balance freshness vs. WP fan-out cost |
| Max results per page | 100 | Bounded response size |

### Site Filter Optimization

When `siteId` query parameter is provided:
- Fan-out only to the specified site (skip all others)
- Go-local queries filtered by `site_id`
- Cache key includes `siteId` for isolation

---

## Timestamp Normalization

All sources must produce UTC ISO-8601 timestamps. Conversion rules:

| Source | Input Format | Conversion |
|--------|-------------|------------|
| Go SQLite | Unix epoch or RFC3339 | `time.Unix().UTC().Format(time.RFC3339)` |
| WordPress | MySQL datetime (`Y-m-d H:i:s`) | Parse as site timezone → convert to UTC |

---

## Cross-References

- [Endpoint Specification](./01-go-endpoint-spec.md)
- [Error Handling](./04-error-handling.md)
