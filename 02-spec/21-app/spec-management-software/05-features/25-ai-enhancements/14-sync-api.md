# Sync API

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09
**Parent:** [Offline-First Storage](./10-offline-first-storage.md)

---

## Overview

Backend API endpoints for handling sync operations from the frontend queue. Includes batch sync endpoint for efficiency and individual entity endpoints for granular control.

---

## API Endpoints

### POST /api/v1/sync/batch

Batch sync multiple operations in a single request for efficiency.

#### Request

```typescript
interface BatchSyncRequest {
  operations: SyncOperation[];
}

interface SyncOperation {
  id: string;                     // Client-generated operation ID
  operation: 'create' | 'update' | 'delete';
  entityType: string;             // message, audio, file, plan, memory, settings
  entityId: string;               // Entity identifier
  payload?: unknown;              // Data (not required for delete)
  clientTimestamp: number;        // When client made the change
}
```

#### Response

```typescript
interface BatchSyncResponse {
  results: SyncOperationResult[];
  serverTimestamp: number;
}

interface SyncOperationResult {
  id: string;                     // Matches request operation ID
  success: boolean;
  entityId?: string;              // Server-assigned ID for creates
  error?: string;
  errorCode?: string;
  retryable?: boolean;
}
```

#### Example

```json
// Request
POST /api/v1/sync/batch
{
  "Operations": [
    {
      "Id": "op_abc123",
      "Operation": "create",
      "EntityType": "message",
      "EntityId": "msg_temp_1",
      "Payload": {
        "SessionId": "sess_xyz",
        "Content": "Hello world",
        "Role": "user"
      },
      "ClientTimestamp": 1706540400000
    },
    {
      "Id": "op_def456",
      "Operation": "update",
      "EntityType": "settings",
      "EntityId": "user_prefs",
      "Payload": {
        "Theme": "dark"
      },
      "ClientTimestamp": 1706540401000
    }
  ]
}

// Response
{
  "Results": [
    {
      "Id": "op_abc123",
      "Success": true,
      "EntityId": "msg_server_789"
    },
    {
      "Id": "op_def456",
      "Success": true
    }
  ],
  "ServerTimestamp": 1706540402000
}
```

---

## Go Backend Implementation

### Handler

```go
// internal/api/handlers/sync.go

package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	
	"specmgmt/internal/sync"
)

type SyncHandler struct {
	service *sync.Service
}

func NewSyncHandler(s *sync.Service) *SyncHandler {
	return &SyncHandler{service: s}
}

type BatchSyncRequest struct {
	Operations []SyncOperation
}

// SyncPayload represents the typed payload for sync operations.
type SyncPayload struct {
    SessionId string `json:",omitempty"`
    Content   string `json:",omitempty"`
    Role      string `json:",omitempty"`
}

type SyncOperation struct {
    Id              string
    Operation       string
    EntityType      string
    EntityId        string
    Payload         SyncPayload `json:",omitempty"`
    ClientTimestamp int64
}

type BatchSyncResponse struct {
	Results         []SyncResult
	ServerTimestamp int64
}

type SyncResult struct {
	Id        string
	Success   bool
	EntityId  *string `json:",omitempty"`
	Error     *string `json:",omitempty"`
	ErrorCode *string `json:",omitempty"`
	Retryable *bool   `json:",omitempty"`
}

func (h *SyncHandler) BatchSync(w http.ResponseWriter, r *http.Request) {
	var req BatchSyncRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Get user from context (typed accessor — no raw cast)
	userId := ctxutil.GetUserId(r.Context())
	
	results := make([]SyncResult, len(req.Operations))
	
	for i, op := range req.Operations {
		result := h.processOperation(r.Context(), userId, op)
		results[i] = result
	}
	
	response := BatchSyncResponse{
		Results:         results,
		ServerTimestamp: time.Now().UnixMilli(),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *SyncHandler) processOperation(context stdctx.Context, userId string, op SyncOperation) SyncResult {
	var result SyncResult
	result.Id = op.Id
	
	switch op.EntityType {
	case "message":
		return h.processMessage(context, userId, op)
	case "audio":
		return h.processAudio(context, userId, op)
	case "file":
		return h.processFile(context, userId, op)
	case "plan":
		return h.processPlan(context, userId, op)
	case "memory":
		return h.processMemory(context, userId, op)
	case "settings":
		return h.processSettings(context, userId, op)
	default:
		errMsg := "Unknown entity type"
		errCode := "UNKNOWN_ENTITY"
		retryable := false
		return SyncResult{
			Id:        op.Id,
			Success:   false,
			Error:     &errMsg,
			ErrorCode: &errCode,
			Retryable: &retryable,
		}
	}
}

func (h *SyncHandler) processMessage(context stdctx.Context, userId string, op SyncOperation) SyncResult {
	switch op.Operation {
	case "create":
		msg, err := h.service.CreateMessage(context, userId, op.Payload)
		if err != nil {
			errMsg := err.Error()
			retryable := isRetryable(err)
			return SyncResult{Id: op.Id, Success: false, Error: &errMsg, Retryable: &retryable}
		}
		
		return SyncResult{Id: op.Id, Success: true, EntityId: &msg.Id}
		
	case "update":
		err := h.service.UpdateMessage(context, userId, op.EntityId, op.Payload)
		if err != nil {
			errMsg := err.Error()
			retryable := isRetryable(err)
			return SyncResult{Id: op.Id, Success: false, Error: &errMsg, Retryable: &retryable}
		}
		
		return SyncResult{Id: op.Id, Success: true}
		
	case "delete":
		err := h.service.DeleteMessage(context, userId, op.EntityId)
		if err != nil {
			errMsg := err.Error()
			retryable := isRetryable(err)
			return SyncResult{Id: op.Id, Success: false, Error: &errMsg, Retryable: &retryable}
		}
		
		return SyncResult{Id: op.Id, Success: true}
	}
	
	errMsg := "Unknown operation"
	return SyncResult{Id: op.Id, Success: false, Error: &errMsg}
}

// Similar implementations for processAudio, processFile, etc.
```

### Service Layer

```go
// internal/sync/service.go

package sync

import (
	stdctx "context"
	"errors"
	
	"specmgmt/internal/db"
)

var (
	ErrNotFound     = errors.New("entity not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrConflict     = errors.New("conflict detected")
)

type Service struct {
	db *db.DB
}

func NewService(db *db.DB) *Service {
	return &Service{db: db}
}

type Message struct {
	Id        string
	SessionId string
	Content   string
	Role      string
	CreatedAt int64
}

func (s *Service) CreateMessage(context stdctx.Context, userId string, payload SyncPayload) appfault.Result[Message] {
	// Validate session belongs to user
	if !s.userOwnsSession(context, userId, payload.SessionId) {
		return appfault.FailNew[Message](
			"E9600",
			"unauthorized",
		)
	}
	
	msg := Message{
		Id:        generateId(),
		SessionId: payload.SessionId,
		Content:   payload.Content,
		Role:      payload.Role,
		CreatedAt: time.Now().UnixMilli(),
	}
	
	_, err := s.db.ExecContext(context, `
		INSERT INTO messages (id, session_id, content, role, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, msg.Id, msg.SessionId, msg.Content, msg.Role, msg.CreatedAt)
	
	if err != nil {
		return appfault.FailWrap[Message](
			err,
			"E9601",
			"failed to create message",
		)
	}
	
	return appfault.Ok(msg)
}

func (s *Service) UpdateMessage(context stdctx.Context, userId, msgId string, payload SyncPayload) error {
	// Validate ownership
	if !s.userOwnsMessage(context, userId, msgId) {
		return ErrUnauthorized
	}
	
	content := payload.Content
	
	result, err := s.db.ExecContext(context, `
		UPDATE messages SET content = ?, updated_at = ? WHERE id = ?
	`, content, time.Now().UnixMilli(), msgId)
	
	if err != nil {
		return err
	}
	
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	
	return nil
}

func (s *Service) DeleteMessage(context stdctx.Context, userId, msgId string) error {
	// Validate ownership
	if !s.userOwnsMessage(context, userId, msgId) {
		return ErrUnauthorized
	}
	
	result, err := s.db.ExecContext(context, `
		DELETE FROM messages WHERE id = ?
	`, msgId)
	
	if err != nil {
		return err
	}
	
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	
	return nil
}

func isRetryable(err error) bool {
	// Network errors, timeouts, and 5xx are retryable
	// Authorization and validation errors are not
	return errors.IsNot(err, ErrUnauthorized) && errors.IsNot(err, ErrNotFound)
}
```

---

## Conflict Resolution

### Last-Write-Wins (Default)

```go
func (s *Service) UpdateWithConflictCheck(
	context stdctx.Context,
	entityId string,
	payload SyncPayload,
	clientTimestamp int64,
) error {
	// Get current server timestamp
	var serverTimestamp int64
	err := s.db.QueryRowContext(context, `
		SELECT updated_at FROM entities WHERE id = ?
	`, entityId).Scan(&serverTimestamp)
	
	if err != nil {
		return err
	}
	
	// If server version is newer, reject update (or merge)
	if serverTimestamp > clientTimestamp {
		// Option 1: Reject
		return ErrConflict
		
		// Option 2: Last-write-wins (client wins)
		// Continue with update
		
		// Option 3: Store conflict for user resolution
		// return s.storeConflict(context, entityId, payload, clientTimestamp)
	}
	
	// Apply update
	return s.applyUpdate(context, entityId, payload)
}
```

### Conflict Storage (For User Resolution)

```sql
CREATE TABLE sync_conflicts (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  client_version TEXT NOT NULL,   -- JSON
  server_version TEXT NOT NULL,   -- JSON
  client_timestamp INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  resolved_at INTEGER,
  resolution TEXT,                -- 'client', 'server', 'merge'
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);
```

---

## Error Codes

| Code | HTTP Status | Retryable | Description |
|------|-------------|-----------|-------------|
| `UNKNOWN_ENTITY` | 400 | No | Unknown entity type |
| `INVALID_PAYLOAD` | 400 | No | Malformed request data |
| `NOT_FOUND` | 404 | No | Entity doesn't exist |
| `UNAUTHORIZED` | 403 | No | User doesn't own entity |
| `CONFLICT` | 409 | No | Version conflict detected |
| `RATE_LIMITED` | 429 | Yes | Too many requests |
| `INTERNAL_ERROR` | 500 | Yes | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Yes | Temporary outage |

---

## Rate Limiting

```go
// Middleware for rate limiting sync requests
func RateLimitMiddleware(next http.Handler) http.Handler {
	limiter := rate.NewLimiter(rate.Every(100*time.Millisecond), 10) // 10 req/sec burst
	
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !limiter.Allow() {
			w.Header().Set("Retry-After", "1")
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

---

## Database Schema

```sql
-- Sync metadata for tracking last sync state
CREATE TABLE sync_state (
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  last_sync_at INTEGER NOT NULL,
  last_server_timestamp INTEGER NOT NULL,
  PRIMARY KEY (user_id, entity_type)
);

-- Audit log for sync operations
CREATE TABLE sync_audit (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  client_timestamp INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IdxSyncAuditUser ON sync_audit(user_id);
CREATE INDEX IdxSyncAuditEntity ON sync_audit(entity_type, entity_id);
```

---

## Testing Checklist

| Test | Description | Priority |
|------|-------------|----------|
| Batch create | Multiple creates succeed | Critical |
| Batch mixed | Create, update, delete in one request | Critical |
| Partial failure | Some ops succeed, some fail | Critical |
| Authorization | User can only sync own entities | Critical |
| Not found | Update/delete non-existent returns 404 | High |
| Conflict detection | Stale update detected | High |
| Rate limiting | 429 returned when exceeded | Medium |
| Large batch | 100+ operations handled | Medium |

---

## Related Specs

- [Offline-First Storage](./10-offline-first-storage.md)
- [Sync Queue](./12-sync-queue.md)
- [API Client](../15-api-client/00-overview.md)
