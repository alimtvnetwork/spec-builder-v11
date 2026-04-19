# WP Plugin Builder: Reset API Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [WP Plugin Builder Overview](./00-overview.md)

---

## Overview

WP Plugin Builder implements the standardized 2-step Reset API for safe deletion of projects, preset data, RAG vectors, and generation history.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All projects, presets, vectors, history, settings |
| `project` | Single project | Project DB, generated files, RAG vectors |
| `presets` | Preset data only | Global presets and preset vectors |
| `rag` | RAG vectors only | All vector embeddings (global + project) |
| `history` | Generation history | Generation logs and file generation records |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "project",
  "Filter": {
    "ProjectSlugs": ["exam-manager"],
    "IncludeGeneratedFiles": true
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_wpb_abc123",
  "Scope": "project",
  "ExpiresAt": "2026-02-07T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "Project",
        "Id": "exam-manager",
        "Name": "Exam Manager",
        "DatabaseSize": "2.4 MB",
        "GeneratedFiles": 45
      }
    ],
    "Summary": {
      "TotalProjects": 1,
      "TotalFiles": 45,
      "TotalVectors": 1200,
      "EstimatedSize": "8.5 MB"
    }
  },
  "Warnings": [
    "This will remove the project database and all 45 generated files"
  ]
}
```

### Step 2: Confirm / Cancel

```
POST /api/v1/reset/confirm
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

| Code | Name | Description |
|------|------|-------------|
| 10490 | RESET_INVALID_SCOPE | Invalid reset scope |
| 10491 | RESET_INVALID_FILTER | Invalid filter criteria |
| 10492 | RESET_NOT_FOUND | Reset request not found |
| 10493 | RESET_EXPIRED | Reset request expired |
| 10494 | RESET_ALREADY_CONFIRMED | Already confirmed |
| 10495 | RESET_ALREADY_CANCELLED | Already cancelled |
| 10496 | RESET_EXECUTION_FAILED | Execution failed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `spec/06-split-db-architecture/02-reset-api-standard.md` |
| Settings Service | `./16-settings-service.md` |
| Error Handling | `./10-error-handling.md` |
| Database Schema | `./04-database-schema.md` |
