# 17 — Session Management


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Active

---

## Overview

Session management provides isolated, auditable logging for every backend operation. Each operation (publish, sync, backup, connection test) is assigned a unique UUID session ID, and all technical logs are persisted to separate files for retrieval via REST API.

---

## Session Types

| Type | Description |
|------|-------------|
| `publish` | Plugin publishing to a single WordPress site |
| `sync` | File synchronization check between local and remote |
| `backup` | Backup creation or restore operation |
| `connect` | Connection testing to WordPress site |
| `bulk_publish` | Publishing to multiple sites in one operation |
| `remote_plugin_enable` | Enabling a plugin on a remote WordPress site |
| `remote_plugin_disable` | Disabling a plugin on a remote WordPress site |
| `remote_plugin_delete` | Deleting a plugin from a remote WordPress site |

---

## Session Lifecycle

```
┌─────────────────┐
│  StartSession   │──▶ UUID generated, log file created
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Log / LogStage │──▶ Entries written to session file
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   EndSession    │──▶ File closed, status recorded
└─────────────────┘
```

---

## Data Structures

### Session

```go
type Session struct {
    Id          string          `json:",omitempty"`
    Type        SessionType
    PluginId    int64           `json:",omitempty"`
    SiteId      int64           `json:",omitempty"`
    PluginName  string          `json:",omitempty"`
    SiteName    string          `json:",omitempty"`
    Status      string          // running, success, error
    StartedAt   time.Time
    EndedAt     *time.Time      `json:",omitempty"`
    ErrorMsg    string          `json:",omitempty"`
    Metadata    json.RawMessage `json:",omitempty"`
}
```

### LogEntry

```go
type LogEntry struct {
    Timestamp string
    Level     string          // debug, info, warn, error
    Step      string          // backup, package, upload, activate
    Message   string
    Details   json.RawMessage `json:",omitempty"`
}
```

### SessionSummary

```go
type SessionSummary struct {
    Id         string
    Type       SessionType
    PluginId   int64      `json:",omitempty"`
    SiteId     int64      `json:",omitempty"`
    PluginName string     `json:",omitempty"`
    SiteName   string     `json:",omitempty"`
    Status     string
    StartedAt  time.Time
    EndedAt    *time.Time `json:",omitempty"`
}
```

---

## Service API

### Core Methods

```go
// Create a new session
sessionId, err := sessionService.StartSession(
    sessionType SessionType,
    pluginId int64,
    siteId int64,
    pluginName string,
    siteName string,
) appfault.Result[string]

// Log a message to a session
sessionService.Log(
    sessionId string,
    level string,      // debug, info, warn, error
    step string,       // backup, package, upload, activate
    message string,
    details json.RawMessage,
)

// Log stage boundaries
sessionService.LogStageStart(sessionId, stageName string)
sessionService.LogStageEnd(sessionId, stageName, status string, durationMs int64)

// End a session
sessionService.EndSession(sessionId, status, errorMsg string)
```

### Query Methods

```go
// Get session details
session, err := sessionService.GetSession(sessionId string) appfault.Result[Session]

// Get full logs
logs, err := sessionService.GetSessionLogs(sessionId string) appfault.Result[string]

// List recent sessions
sessions, err := sessionService.ListSessions(limit int) SessionSummarySlice

// Delete a session
err := sessionService.DeleteSession(sessionId string) error

// Set metadata
sessionService.SetMetadata(sessionId, key string, value any)
```

---

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/sessions` | List recent sessions (default 100) |
| `GET` | `/api/v1/sessions/{id}` | Get session details |
| `GET` | `/api/v1/sessions/{id}/logs` | Get full session logs (text or JSON) |
| `GET` | `/api/v1/sessions/{id}/diagnostics` | Get structured diagnostics (request, response, stack traces) |
| `DELETE` | `/api/v1/sessions/{id}` | Delete a session |

### Query Parameters

**GET /api/v1/sessions**
- `limit` (int): Maximum number of sessions to return (default: 100)

**GET /api/v1/sessions/{id}/logs**
- `format` (string): Response format - `text` (default) or `json`

### Diagnostics Endpoint

`GET /api/v1/sessions/{id}/diagnostics` returns a `SessionDiagnostics` struct:

```json
{
  "Request": {
    "Url": "http://localhost:8080/api/v1/sites/1/remote-plugins/disable",
    "Method": "POST",
    "Body": { "SiteId": 1, "PluginSlug": "akismet/akismet.php", "Action": "disable" }
  },
  "Response": {
    "RequestUrl": "https://example.com/wp-json/riseup-asia-uploader/v1/plugins/disable",
    "ResponseUrl": "https://example.com",
    "StatusCode": 500,
    "Body": { "Status": { "IsFailed": true }, "Errors": { "BackendMessage": "..." } }
  },
  "StackTrace": {
    "Golang": [{ "Function": "DisableRemotePlugin", "File": "site_handlers.go", "Line": 350 }],
    "Php": [{ "Function": "handleDisable", "File": "PluginManager.php", "Line": 120, "Class": "PluginManager" }]
  },
  "PhpStackTraceLog": "Full stacktrace.txt content..."
}
```

### Session Folder Structure

Each session stores artifacts in `data/sessions/{uuid}/`:

| File | Purpose |
|------|---------|
| `session.log` | Human-readable execution log with stage headers |
| `request.json` | Inbound request from frontend (URL, method, body) |
| `response.json` | Outbound response from PHP (requestUrl, responseUrl, statusCode, body) |
| `error.log` | Go + PHP stack traces when errors occur |

---

## Log File Format

Session logs are stored in `backend/data/sessions/{session_id}.log`:

```
═══════════════════════════════════════════════════════════════════════════════
 SESSION: abc-123-def-456
 TYPE: publish
 STARTED: 2026-02-05 01:24:27 UTC
 PLUGIN: Category Generator (ID: 3)
 SITE: Atto Property Demo (ID: 1)
═══════════════════════════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────────────────────────
 STAGE: UPLOAD
───────────────────────────────────────────────────────────────────────────────
[2026-02-05 01:24:27] [INFO] [upload] Starting upload to https://example.com
    {
      "ZipPath": "/path/to/plugin.zip",
      "RemoteSlug": "category-generator"
    }

✓ STAGE UPLOAD completed (success) in 4200ms

───────────────────────────────────────────────────────────────────────────────
 STAGE: ACTIVATE
───────────────────────────────────────────────────────────────────────────────
[2026-02-05 01:24:32] [INFO] [activate] Activating plugin
    {
      "Url": "https://example.com/wp-json/plugins-onboard/v1/activate/category-generator",
      "HttpStatus": 200
    }

✓ STAGE ACTIVATE completed (success) in 850ms

═══════════════════════════════════════════════════════════════════════════════
 SESSION ENDED: 2026-02-05 01:24:41 UTC
 STATUS: success
 DURATION: 14.402s
═══════════════════════════════════════════════════════════════════════════════
```

---

## WebSocket Integration

All WebSocket messages include `sessionId` for correlation:

```json
{
  "Type": "publish_progress",
  "SessionId": "abc-123-def-456",
  "Data": {
    "PluginId": 3,
    "SiteId": 1,
    "Stage": "upload",
    "Status": "running",
    "Progress": 45,
    "Message": "Uploading plugin archive..."
  }
}
```

### Session-Related Events

| Event | Description |
|-------|-------------|
| `stage_log` | Detailed context log for a stage |
| `stage_complete` | Stage completed with timing |
| `publish_progress` | General progress update |
| `publish_complete` | Operation finished |

---

## Retention & Cleanup

- **Default retention**: 7 days (configurable)
- **Cleanup frequency**: Hourly background task
- **Storage location**: `backend/data/sessions/`
- **File naming**: `{session_id}.log`

---

## Error Handling

When errors occur:

1. Error is logged to session with full context
2. Session status set to `error`
3. Error message stored in `session.ErrorMsg`
4. Session file is closed and preserved
5. WebSocket broadcasts error event with `sessionId`

Frontend can fetch session logs via `/api/v1/sessions/{id}/logs` for debugging.

---

## Related Files

- `backend/internal/services/session/service.go` — Service implementation
- `backend/internal/services/session/types.go` — Interface definition
- `backend/internal/api/handlers/sessions.go` — HTTP handlers
- `backend/internal/ws/hub.go` — WebSocket session-aware broadcasts

---

## Next Document

See [02-frontend/27-quick-publish.md](../02-frontend/27-quick-publish.md) for quick publish UI.
