# AI Transcribe CLI: Reset API Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [AI Transcribe CLI Overview](./00-overview.md)

---

## Overview

AI Transcribe CLI implements the standardized 2-step Reset API for safe deletion of transcription history, cached models, voice clones, and session data.

---

## Reset Scopes

| Scope | Description | Affected Data |
|-------|-------------|---------------|
| `all` | Full system reset | All history, models, voices, sessions, settings |
| `history` | Transcription history | STT/TTS execution logs |
| `models` | Downloaded models | Local model files and cache |
| `voices` | Cloned voices | Voice clone profiles and samples |
| `sessions` | Realtime sessions | Conversation session data |
| `cache` | Processing cache | Audio processing temp files |

---

## API Endpoints

### Step 1: Request Reset

```
POST /api/v1/reset/request
```

**Request Body:**

```json
{
  "Scope": "models",
  "Filter": {
    "ModelIds": ["whisper-base", "whisper-small"],
    "OlderThan": "2026-01-01T00:00:00Z"
  }
}
```

**Response (200 OK):**

```json
{
  "ResetId": "rst_at_abc123",
  "Scope": "models",
  "ExpiresAt": "2026-02-07T10:05:00Z",
  "Preview": {
    "AffectedItems": [
      {
        "Type": "Model",
        "Id": "whisper-base",
        "Name": "Whisper Base",
        "SizeBytes": 145728000
      }
    ],
    "Summary": {
      "TotalModels": 2,
      "TotalSize": "278.5 MB"
    }
  },
  "Warnings": [
    "Models will need to be re-downloaded before next use"
  ]
}
```

### Step 2: Confirm Reset

```
POST /api/v1/reset/confirm
```

```json
{
  "ResetId": "rst_at_abc123"
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
| 14350 | 400 | Invalid reset scope |
| 14351 | 400 | Invalid filter criteria |
| 14352 | 404 | Reset request not found |
| 14353 | 410 | Reset request expired |
| 14354 | 409 | Reset already confirmed |
| 14355 | 409 | Reset already cancelled |
| 14356 | 500 | Reset execution failed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| Settings Service | `./15-settings-service.md` |
| Error Codes | `./10-error-codes.md` |
