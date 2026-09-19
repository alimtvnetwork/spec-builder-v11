# Spec Reverse CLI: Reset API Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [Spec Reverse CLI Architecture](./01-architecture.md)

---

## Overview

Spec Reverse CLI implements the standardized 2-step Reset API for safe deletion of analysis results, generated specs, RAG data, and cached symbols.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All analyses, specs, RAG data, settings |
| `analysis` | Analysis results | Extracted symbols, issues, patterns |
| `specs` | Generated specs | Spec files and generation history |
| `rag` | RAG data only | Ingested chunks and vector embeddings |
| `cache` | Symbol cache | Cached AST and symbol data |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "analysis",
  "Filter": {
    "AnalysisIds": ["ana-abc123"],
    "OlderThan": "2026-01-01T00:00:00Z"
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_src_abc123",
  "Scope": "analysis",
  "ExpiresAt": "2026-02-07T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "AnalysisResult",
        "Id": "ana-abc123",
        "Language": "go",
        "FileCount": 245,
        "SymbolCount": 1850
      }
    ],
    "Summary": {
      "TotalAnalyses": 1,
      "TotalSymbols": 1850,
      "TotalIssues": 23
    }
  }
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
| 11600 | RESET_INVALID_SCOPE | Invalid reset scope |
| 11601 | RESET_INVALID_FILTER | Invalid filter criteria |
| 11602 | RESET_NOT_FOUND | Reset request not found |
| 11603 | RESET_EXPIRED | Reset request expired |
| 11604 | RESET_ALREADY_CONFIRMED | Already confirmed |
| 11605 | RESET_ALREADY_CANCELLED | Already cancelled |
| 11606 | RESET_EXECUTION_FAILED | Execution failed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| Settings Service | `./04-settings-service.md` |
| Architecture | `./01-architecture.md` |
