# AI Bridge CLI: Reset & Export API

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

This document specifies the **Reset** and **Import/Export** APIs for AI Bridge CLI, enabling data management, portability, and fresh starts.

---

## Reset API (2-Step Confirmation)

### Security Model

All reset operations require a **2-step confirmation** with a **5-minute TTL**:

1. **Request Reset**: Returns a confirmation ID
2. **Confirm Reset**: Executes the reset with the confirmation ID

This prevents accidental data loss and provides an audit trail.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2-STEP RESET CONFIRMATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User/UI                                  AI Bridge API                     │
│      │                                           │                           │
│      │  POST /api/v1/reset/request              │                           │
│      │  { "Scope": "app", "AppName": "my-app" } │                           │
│      │──────────────────────────────────────────▶│                           │
│      │                                           │                           │
│      │  {                                        │                           │
│      │    "ResetId": "rst_abc123",              │                           │
│      │    "Scope": "app",                        │                           │
│      │    "AppName": "my-app",                   │                           │
│      │    "ExpiresAt": "2026-02-02T10:35:00Z",  │  ◀── 5 minute window      │
│      │    "AffectedItems": {                     │                           │
│      │      "ChatSessions": 12,                  │                           │
│      │      "RagDocuments": 45,                  │                           │
│      │      "SearchCaches": 30                   │                           │
│      │    }                                      │                           │
│      │  }                                        │                           │
│      │◀──────────────────────────────────────────│                           │
│      │                                           │                           │
│      │  [User reviews and confirms]              │                           │
│      │                                           │                           │
│      │  POST /api/v1/reset/confirm              │                           │
│      │  { "ResetId": "rst_abc123" }             │                           │
│      │──────────────────────────────────────────▶│                           │
│      │                                           │                           │
│      │  {                                        │                           │
│      │    "Status": "completed",                 │                           │
│      │    "DeletedDatabases": 87,               │                           │
│      │    "FreedBytes": 524288000               │                           │
│      │  }                                        │                           │
│      │◀──────────────────────────────────────────│                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reset Scopes

| Scope | Description | Databases Affected |
|-------|-------------|--------------------|
| `all` | Full system reset | Everything in `data/` |
| `app` | Application reset | `data/{appName}/*` |
| `chat` | Chat sessions only | `data/{appName}/ai/chat/*.db` |
| `rag` | RAG memory only | `data/{appName}/rag/**/*.db` |
| `search` | Search cache only | `data/{appName}/rag/cache/search/*.db` |
| `seo` | SEO data only | `data/{appName}/seo/**/*` |

### API Endpoints

#### Request Reset

```
POST /api/v1/reset/request

Request Body:
{
  "Scope": "app",                    // Required: reset scope
  "AppName": "my-app"                // Required for app-level scopes
}

Response:
{
  "ResetId": "rst_abc123def456",
  "Scope": "app",
  "AppName": "my-app",
  "ExpiresAt": "2026-02-02T10:35:00Z",
  "AffectedItems": {
    "ChatSessions": 12,
    "RagDocuments": 45,
    "SearchCaches": 30,
    "SeoJobs": 5,
    "TotalDatabases": 92,
    "TotalBytes": 524288000
  },
  "Message": "Review affected items and confirm within 5 minutes"
}
```

#### Confirm Reset

```
POST /api/v1/reset/confirm

Request Body:
{
  "ResetId": "rst_abc123def456"
}

Response (Success):
{
  "Status": "completed",
  "Scope": "app",
  "AppName": "my-app",
  "DeletedDatabases": 92,
  "FreedBytes": 524288000,
  "Duration": "2.3s"
}

Response (Expired):
{
  "Status": "expired",
  "Error": "Reset confirmation expired. Please request again."
}

Response (Invalid):
{
  "Status": "invalid",
  "Error": "Invalid or already used reset ID"
}
```

#### Cancel Reset

```
POST /api/v1/reset/cancel

Request Body:
{
  "ResetId": "rst_abc123def456"
}

Response:
{
  "Status": "cancelled",
  "ResetId": "rst_abc123def456"
}
```

### Database Schema for Reset Requests

Located in `data/aibridge.db`:

```sql
CREATE TABLE ResetRequests (
    Id TEXT PRIMARY KEY,
    Scope TEXT NOT NULL,
    AppName TEXT,
    RequestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    AffectedItems TEXT,                            -- JSON
    ConfirmedAt DATETIME,
    CancelledAt DATETIME,
    CompletedAt DATETIME,
    Status TEXT DEFAULT 'pending',                 -- pending, confirmed, expired, cancelled, completed
    DeletedCount INTEGER,
    FreedBytes INTEGER,
    ErrorMessage TEXT
);

CREATE INDEX IdxResetStatus ON ResetRequests(Status, ExpiresAt);
CREATE INDEX IdxResetApp ON ResetRequests(AppName);
```

---

## Import/Export API

### Export Types

| Type | Description | Format |
|------|-------------|--------|
| `app` | Full application data | SQLite bundle |
| `rag` | RAG memory only | SQLite bundle |
| `chat` | Chat history only | SQLite bundle |
| `search` | Search cache only | SQLite bundle |
| `seo` | SEO presets + data | SQLite bundle |
| `settings` | Configuration only | SQLite bundle |

### Export API

```
POST /api/v1/export

Request Body:
{
  "Type": "app",                     // Export type
  "AppName": "my-app",               // Application name
  "IncludeSettings": true,           // Include app settings
  "Compress": true                   // GZIP compression
}

Response Headers:
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="my-app-export-2026-02-02.db"

Response Body:
[Binary SQLite file]
```

### Import API

```
POST /api/v1/import

Request: multipart/form-data
  - file: (binary .db file)
  - appName: "target-app"           // Target application
  - mode: "merge" | "replace"       // Import mode

Response:
{
  "Imported": true,
  "TargetApp": "target-app",
  "Mode": "merge",
  "Stats": {
    "ChatSessions": 12,
    "RagDocuments": 45,
    "SearchCaches": 0,              // Caches not imported (regenerated)
    "Settings": 8
  },
  "Warnings": [
    "3 duplicate documents skipped"
  ]
}
```

### Export Bundle Schema

The export creates a portable SQLite bundle:

```sql
-- Export metadata
CREATE TABLE ExportMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    ExportedAt DATETIME,
    SourceApp TEXT,
    SourceVersion TEXT,
    ExportType TEXT,
    IncludedComponents TEXT,                       -- JSON array
    TotalRecords INTEGER,
    Checksum TEXT
);

-- Chat sessions (denormalized for portability)
CREATE TABLE ExportedChatSessions (
    Id TEXT PRIMARY KEY,
    OriginalPath TEXT,
    SessionMeta TEXT,                              -- JSON: full SessionMeta
    Messages TEXT,                                 -- JSON: array of messages
    ToolCalls TEXT,                                -- JSON: array of tool calls
    CreatedAt DATETIME,
    MessageCount INTEGER
);

-- RAG documents (denormalized)
CREATE TABLE ExportedRagDocuments (
    Id TEXT PRIMARY KEY,
    OriginalPath TEXT,
    DocumentMeta TEXT,                             -- JSON: document metadata
    Chunks TEXT,                                   -- JSON: array of chunks
    Embeddings BLOB,                               -- Packed embeddings
    EmbeddingModel TEXT,
    ChunkCount INTEGER
);

-- Settings
CREATE TABLE ExportedSettings (
    Key TEXT PRIMARY KEY,
    Value TEXT,
    ValueType TEXT,
    Source TEXT
);
```

---

## CLI Commands

### Reset Commands

```bash
# Request reset for application
aibridge reset --app my-app

# Response shows confirmation ID and affected items
# User must run confirm command within 5 minutes

# Confirm reset
aibridge reset --confirm rst_abc123def456

# Cancel pending reset
aibridge reset --cancel rst_abc123def456

# Full system reset
aibridge reset --all

# Reset specific component
aibridge reset --app my-app --scope rag
aibridge reset --app my-app --scope chat
aibridge reset --app my-app --scope search
```

### Export Commands

```bash
# Export full application
aibridge export --app my-app --output ./my-app-backup.db

# Export RAG memory only
aibridge export --app my-app --type rag --output ./my-app-rag.db

# Export with compression
aibridge export --app my-app --compress --output ./my-app-backup.db.gz
```

### Import Commands

```bash
# Import into new application
aibridge import --file ./backup.db --app new-app

# Merge into existing application
aibridge import --file ./backup.db --app existing-app --mode merge

# Replace existing application
aibridge import --file ./backup.db --app existing-app --mode replace
```

---

## UI Representation

### Reset UI Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RESET APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Application: my-app                                                        │
│                                                                              │
│   ⚠️  This will delete the following data:                                  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │  📝 Chat Sessions          12 sessions                          │       │
│   │  📚 RAG Documents          45 documents (1,523 chunks)          │       │
│   │  🔍 Search Caches          30 cached searches                   │       │
│   │  📄 SEO Jobs               5 generation jobs                    │       │
│   │  ─────────────────────────────────────────────                  │       │
│   │  💾 Total Size             500 MB                               │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│   Type the application name to confirm: [______________]                    │
│                                                                              │
│   ⏱️  Confirmation expires in: 4:32                                         │
│                                                                              │
│   [ Cancel ]                                    [ Confirm Reset ]           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9401 | `ErrResetExpired` | Reset confirmation window expired |
| 9402 | `ErrResetInvalidId` | Invalid or unknown reset ID |
| 9403 | `ErrResetAlreadyConfirmed` | Reset already executed |
| 9404 | `ErrResetCancelled` | Reset was cancelled |
| 9410 | `ErrExportFailed` | Export operation failed |
| 9411 | `ErrExportAppNotFound` | Application not found |
| 9420 | `ErrImportInvalidFile` | Invalid import file format |
| 9421 | `ErrImportVersionMismatch` | Incompatible export version |
| 9422 | `ErrImportChecksumFailed` | File integrity check failed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Database Architecture | `./12-database-architecture.md` |
| API Interface | `./04-api-interface.md` |
| Error Codes | `./05-error-codes.md` |
| AI SEO Generate | `./13-ai-seo-generate.md` |
