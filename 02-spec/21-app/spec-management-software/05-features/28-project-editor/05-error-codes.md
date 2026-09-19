# Error Codes: Project Editor Module

**Version:** 3.0.0  
**Status:** Active  
**Updated:** 2026-03-09
**Parent:** [Project Editor](./00-overview.md)  
**Error Range:** 17000-17999

> ⚠️ **REASSIGNED:** Previously used the 13xxx range, which collided with WP Plugin Publish (WPP, 13000-13999). Moved to 17000-17999 per collision resolution (2026-02-28).

---

## Overview

Error codes for the Project Editor module covering input state persistence, draft recovery, cross-device sync, and editor state management. All errors use the **17xxx** range following the project's centralized error management conventions.

---

## Error Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 17000-17099 | General | Module-level errors |
| 17100-17199 | Input Persistence | localStorage/IndexedDB errors |
| 17200-17299 | Draft Recovery | Recovery detection and restore errors |
| 17300-17399 | Sync API | Cross-device synchronization errors |
| 17400-17499 | Editor State | Cursor, scroll, undo/redo errors |
| 17500-17599 | Validation | Input validation errors |
| 17900-17999 | Internal | Internal/unexpected errors |

---

## Error Definitions

### General Errors (17000-17099)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17000 | `PROJECT_EDITOR_UNKNOWN` | 500 | Unknown project editor error | Check logs for details |
| 17001 | `PROJECT_EDITOR_INIT_FAILED` | 500 | Failed to initialize project editor | Reload the page |
| 17002 | `PROJECT_EDITOR_NOT_READY` | 503 | Project editor not initialized | Wait for initialization |
| 17003 | `PROJECT_EDITOR_DISABLED` | 403 | Project editor is disabled | Enable in settings |
| 17004 | `PROJECT_CONTEXT_MISSING` | 400 | Project context not found | Select a project first |
| 17005 | `PROJECT_EDITOR_TIMEOUT` | 504 | Operation timed out | Retry the operation |

---

### Input Persistence Errors (17100-17199)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17100 | `STORAGE_UNAVAILABLE` | 503 | Browser storage unavailable | Enable cookies/storage |
| 17101 | `LOCALSTORAGE_QUOTA_EXCEEDED` | 507 | localStorage quota exceeded | Clear old drafts |
| 17102 | `INDEXEDDB_OPEN_FAILED` | 500 | Failed to open IndexedDB | Check browser support |
| 17103 | `INDEXEDDB_TRANSACTION_FAILED` | 500 | IndexedDB transaction failed | Retry operation |
| 17104 | `INDEXEDDB_UPGRADE_FAILED` | 500 | IndexedDB upgrade failed | Clear database and retry |
| 17105 | `STORAGE_KEY_INVALID` | 400 | Invalid storage key format | Use valid key format |
| 17106 | `STORAGE_VALUE_TOO_LARGE` | 413 | Value exceeds maximum size (5MB) | Reduce content size |
| 17107 | `STORAGE_SERIALIZATION_FAILED` | 500 | Failed to serialize data | Check data format |
| 17108 | `STORAGE_DESERIALIZATION_FAILED` | 500 | Failed to deserialize data | Data may be corrupted |
| 17109 | `STORAGE_MIGRATION_FAILED` | 500 | Version migration failed | Clear old data |
| 17110 | `STORAGE_ENCRYPTION_FAILED` | 500 | Failed to encrypt data | Check encryption keys |
| 17111 | `STORAGE_DECRYPTION_FAILED` | 500 | Failed to decrypt data | Key may have changed |
| 17112 | `STORAGE_PERMISSION_DENIED` | 403 | Storage access denied | Grant storage permission |

---

### Draft Recovery Errors (17200-17299)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17200 | `DRAFT_NOT_FOUND` | 404 | Draft not found | Draft may have expired |
| 17201 | `DRAFT_EXPIRED` | 410 | Draft has expired | Create new content |
| 17202 | `DRAFT_CORRUPTED` | 500 | Draft data is corrupted | Discard and start fresh |
| 17203 | `DRAFT_RESTORE_FAILED` | 500 | Failed to restore draft | Try manual recovery |
| 17204 | `DRAFT_DISCARD_FAILED` | 500 | Failed to discard draft | Retry operation |
| 17205 | `DRAFT_CONFLICT` | 409 | Draft conflicts with current | Choose version to keep |
| 17206 | `DRAFT_VERSION_MISMATCH` | 409 | Draft version incompatible | Migrate or discard |
| 17207 | `DRAFT_PARSE_ERROR` | 400 | Failed to parse draft metadata | Check draft format |
| 17208 | `DRAFT_TOO_OLD` | 410 | Draft is too old to recover | Maximum age exceeded |
| 17209 | `DRAFT_RECOVERY_TIMEOUT` | 504 | Recovery operation timed out | Retry recovery |
| 17210 | `DRAFT_BATCH_LIMIT_EXCEEDED` | 400 | Too many drafts to recover | Recover in batches |
| 17211 | `DRAFT_TYPE_UNKNOWN` | 400 | Unknown draft type | Update to latest version |

---

### Sync API Errors (17300-17399)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17300 | `SYNC_DISABLED` | 403 | Sync is disabled for this account | Upgrade to premium |
| 17301 | `SYNC_QUOTA_EXCEEDED` | 429 | Sync quota exceeded | Wait or upgrade plan |
| 17302 | `SYNC_KEY_LIMIT_REACHED` | 400 | Maximum synced keys reached | Remove old keys |
| 17303 | `SYNC_VALUE_TOO_LARGE` | 413 | Sync value exceeds limit | Reduce content size |
| 17304 | `SYNC_RATE_LIMITED` | 429 | Too many sync requests | Wait before retrying |
| 17305 | `SYNC_CONFLICT_UNRESOLVED` | 409 | Sync conflict requires resolution | Choose version |
| 17306 | `SYNC_DEVICE_LIMIT_REACHED` | 400 | Maximum devices reached | Remove a device |
| 17307 | `SYNC_DEVICE_NOT_FOUND` | 404 | Device not found | Re-register device |
| 17308 | `SYNC_NETWORK_ERROR` | 503 | Network error during sync | Check connection |
| 17309 | `SYNC_SERVER_ERROR` | 500 | Sync server error | Retry later |
| 17310 | `SYNC_AUTH_REQUIRED` | 401 | Authentication required for sync | Log in again |
| 17311 | `SYNC_AUTH_EXPIRED` | 401 | Sync authentication expired | Refresh token |
| 17312 | `SYNC_BATCH_PARTIAL_FAILURE` | 207 | Some items failed to sync | Check individual errors |
| 17313 | `SYNC_VERSION_CONFLICT` | 409 | Version conflict detected | Resolve conflict |
| 17314 | `SYNC_OFFLINE_QUEUE_FULL` | 507 | Offline queue is full | Sync when online |
| 17315 | `SYNC_STATE_EXPIRED` | 410 | Synced state has expired | Re-sync from server |

---

### Editor State Errors (17400-17499)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17400 | `CURSOR_POSITION_INVALID` | 400 | Invalid cursor position | Reset cursor |
| 17401 | `CURSOR_OUT_OF_BOUNDS` | 400 | Cursor position out of bounds | Adjust position |
| 17402 | `SELECTION_INVALID` | 400 | Invalid selection range | Clear selection |
| 17403 | `SELECTION_COLLAPSED` | 400 | Selection has no range | Expand selection |
| 17404 | `SCROLL_POSITION_INVALID` | 400 | Invalid scroll position | Reset scroll |
| 17405 | `SCROLL_TARGET_NOT_FOUND` | 404 | Scroll target not found | Check element exists |
| 17406 | `UNDO_STACK_EMPTY` | 400 | Nothing to undo | No history available |
| 17407 | `REDO_STACK_EMPTY` | 400 | Nothing to redo | No forward history |
| 17408 | `UNDO_HISTORY_CORRUPTED` | 500 | Undo history corrupted | Clear history |
| 17409 | `UNDO_HISTORY_LIMIT_REACHED` | 400 | Undo history limit reached | Oldest entries removed |
| 17410 | `EDITOR_STATE_INVALID` | 500 | Editor state is invalid | Reload editor |
| 17411 | `EDITOR_REF_NOT_FOUND` | 404 | Editor reference not found | Re-mount component |
| 17412 | `EDITOR_CONTENT_MISMATCH` | 409 | Editor content mismatch | Sync content |
| 17413 | `EDITOR_LOCK_FAILED` | 423 | Failed to acquire editor lock | Wait for unlock |
| 17414 | `EDITOR_READONLY` | 403 | Editor is in read-only mode | Exit read-only |

---

### Validation Errors (17500-17599)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17500 | `INPUT_KEY_REQUIRED` | 400 | Input key is required | Provide a valid key |
| 17501 | `INPUT_KEY_TOO_LONG` | 400 | Input key exceeds 500 chars | Shorten the key |
| 17502 | `INPUT_KEY_INVALID_CHARS` | 400 | Input key contains invalid chars | Use alphanumeric/underscore |
| 17503 | `INPUT_VALUE_REQUIRED` | 400 | Input value is required | Provide a value |
| 17504 | `INPUT_VALUE_TOO_LONG` | 400 | Input value exceeds 5MB | Reduce content size |
| 17505 | `PROJECT_ID_REQUIRED` | 400 | Project ID is required | Select a project |
| 17506 | `PROJECT_ID_INVALID` | 400 | Invalid project ID format | Use valid UUID |
| 17507 | `CONTEXT_ID_REQUIRED` | 400 | Context ID is required | Provide context |
| 17508 | `CONTEXT_ID_INVALID` | 400 | Invalid context ID | Use valid context |
| 17509 | `FIELD_ID_REQUIRED` | 400 | Field ID is required | Provide field ID |
| 17510 | `DEVICE_ID_REQUIRED` | 400 | Device ID is required | Generate device ID |
| 17511 | `DEVICE_ID_INVALID` | 400 | Invalid device ID format | Use valid UUID |
| 17512 | `TIMESTAMP_INVALID` | 400 | Invalid timestamp format | Use Unix timestamp |
| 17513 | `VERSION_INVALID` | 400 | Invalid version number | Use positive integer |

---

### Internal Errors (17900-17999)

| Code | Name | HTTP | Message | Resolution |
|------|------|------|---------|------------|
| 17900 | `INTERNAL_ERROR` | 500 | Internal project editor error | Contact support |
| 17901 | `STATE_MANAGER_ERROR` | 500 | State manager internal error | Reload application |
| 17902 | `HOOK_INITIALIZATION_ERROR` | 500 | Hook initialization failed | Re-mount component |
| 17903 | `EVENT_DISPATCH_ERROR` | 500 | Failed to dispatch event | Check event handlers |
| 17904 | `CALLBACK_ERROR` | 500 | Callback execution failed | Check callback function |
| 17999 | `UNEXPECTED_ERROR` | 500 | Unexpected error occurred | Check logs |

---

## Error Type Definition

```typescript
// src/types/project-editor-errors.ts

export enum ProjectEditorErrorCode {
  // General (17000-17099)
  UNKNOWN = 17000,
  INIT_FAILED = 17001,
  NOT_READY = 17002,
  DISABLED = 17003,
  CONTEXT_MISSING = 17004,
  TIMEOUT = 17005,
  
  // Input Persistence (17100-17199)
  STORAGE_UNAVAILABLE = 17100,
  LOCALSTORAGE_QUOTA_EXCEEDED = 17101,
  INDEXEDDB_OPEN_FAILED = 17102,
  INDEXEDDB_TRANSACTION_FAILED = 17103,
  INDEXEDDB_UPGRADE_FAILED = 17104,
  STORAGE_KEY_INVALID = 17105,
  STORAGE_VALUE_TOO_LARGE = 17106,
  STORAGE_SERIALIZATION_FAILED = 17107,
  STORAGE_DESERIALIZATION_FAILED = 17108,
  STORAGE_MIGRATION_FAILED = 17109,
  STORAGE_ENCRYPTION_FAILED = 17110,
  STORAGE_DECRYPTION_FAILED = 17111,
  STORAGE_PERMISSION_DENIED = 17112,
  
  // Draft Recovery (17200-17299)
  DRAFT_NOT_FOUND = 17200,
  DRAFT_EXPIRED = 17201,
  DRAFT_CORRUPTED = 17202,
  DRAFT_RESTORE_FAILED = 17203,
  DRAFT_DISCARD_FAILED = 17204,
  DRAFT_CONFLICT = 17205,
  DRAFT_VERSION_MISMATCH = 17206,
  DRAFT_PARSE_ERROR = 17207,
  DRAFT_TOO_OLD = 17208,
  DRAFT_RECOVERY_TIMEOUT = 17209,
  DRAFT_BATCH_LIMIT_EXCEEDED = 17210,
  DRAFT_TYPE_UNKNOWN = 17211,
  
  // Sync API (17300-17399)
  SYNC_DISABLED = 17300,
  SYNC_QUOTA_EXCEEDED = 17301,
  SYNC_KEY_LIMIT_REACHED = 17302,
  SYNC_VALUE_TOO_LARGE = 17303,
  SYNC_RATE_LIMITED = 17304,
  SYNC_CONFLICT_UNRESOLVED = 17305,
  SYNC_DEVICE_LIMIT_REACHED = 17306,
  SYNC_DEVICE_NOT_FOUND = 17307,
  SYNC_NETWORK_ERROR = 17308,
  SYNC_SERVER_ERROR = 17309,
  SYNC_AUTH_REQUIRED = 17310,
  SYNC_AUTH_EXPIRED = 17311,
  SYNC_BATCH_PARTIAL_FAILURE = 17312,
  SYNC_VERSION_CONFLICT = 17313,
  SYNC_OFFLINE_QUEUE_FULL = 17314,
  SYNC_STATE_EXPIRED = 17315,
  
  // Editor State (17400-17499)
  CURSOR_POSITION_INVALID = 17400,
  CURSOR_OUT_OF_BOUNDS = 17401,
  SELECTION_INVALID = 17402,
  SELECTION_COLLAPSED = 17403,
  SCROLL_POSITION_INVALID = 17404,
  SCROLL_TARGET_NOT_FOUND = 17405,
  UNDO_STACK_EMPTY = 17406,
  REDO_STACK_EMPTY = 17407,
  UNDO_HISTORY_CORRUPTED = 17408,
  UNDO_HISTORY_LIMIT_REACHED = 17409,
  EDITOR_STATE_INVALID = 17410,
  EDITOR_REF_NOT_FOUND = 17411,
  EDITOR_CONTENT_MISMATCH = 17412,
  EDITOR_LOCK_FAILED = 17413,
  EDITOR_READONLY = 17414,
  
  // Validation (17500-17599)
  INPUT_KEY_REQUIRED = 17500,
  INPUT_KEY_TOO_LONG = 17501,
  INPUT_KEY_INVALID_CHARS = 17502,
  INPUT_VALUE_REQUIRED = 17503,
  INPUT_VALUE_TOO_LONG = 17504,
  PROJECT_ID_REQUIRED = 17505,
  PROJECT_ID_INVALID = 17506,
  CONTEXT_ID_REQUIRED = 17507,
  CONTEXT_ID_INVALID = 17508,
  FIELD_ID_REQUIRED = 17509,
  DEVICE_ID_REQUIRED = 17510,
  DEVICE_ID_INVALID = 17511,
  TIMESTAMP_INVALID = 17512,
  VERSION_INVALID = 17513,
  
  // Internal (17900-17999)
  INTERNAL_ERROR = 17900,
  STATE_MANAGER_ERROR = 17901,
  HOOK_INITIALIZATION_ERROR = 17902,
  EVENT_DISPATCH_ERROR = 17903,
  CALLBACK_ERROR = 17904,
  UNEXPECTED_ERROR = 17999,
}

export interface ProjectEditorError {
  readonly code: ProjectEditorErrorCode;
  readonly message: string;
  readonly details?: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly recoverable: boolean;
}

export function createProjectEditorError(
  code: ProjectEditorErrorCode,
  details?: string,
  context?: Record<string, unknown>
): ProjectEditorError {
  const errorInfo = ERROR_MESSAGES[code];
  
  return {
    code,
    message: errorInfo?.message ?? 'Unknown error',
    details,
    context,
    timestamp: new Date(),
    recoverable: errorInfo?.recoverable ?? false,
  };
}

const ERROR_MESSAGES: Record<ProjectEditorErrorCode, { message: string; recoverable: boolean }> = {
  [ProjectEditorErrorCode.UNKNOWN]: { message: 'Unknown project editor error', recoverable: false },
  [ProjectEditorErrorCode.STORAGE_UNAVAILABLE]: { message: 'Browser storage unavailable', recoverable: false },
  [ProjectEditorErrorCode.LOCALSTORAGE_QUOTA_EXCEEDED]: { message: 'Storage quota exceeded', recoverable: true },
  [ProjectEditorErrorCode.DRAFT_NOT_FOUND]: { message: 'Draft not found', recoverable: true },
  [ProjectEditorErrorCode.SYNC_RATE_LIMITED]: { message: 'Too many sync requests', recoverable: true },
  // ... additional mappings
} as Record<ProjectEditorErrorCode, { message: string; recoverable: boolean }>;
```

---

## Migration Notes

### 13xxx → 17xxx Mapping

| Old Code | New Code | Category |
|----------|----------|----------|
| 13000-13099 | 17000-17099 | General |
| 13100-13199 | 17100-17199 | Input Persistence |
| 13200-13299 | 17200-17299 | Draft Recovery |
| 13300-13399 | 17300-17399 | Sync API |
| 13400-13499 | 17400-17499 | Editor State |
| 13500-13599 | 17500-17599 | Validation |
| 13900-13999 | 17900-17999 | Internal |

**Reason:** The 13xxx range collided with WP Plugin Publish (WPP, 13000-13999). The Project Editor module was reassigned to 17000-17999 to eliminate the overlap.

---

## Usage Examples

### Throwing Errors

```typescript
import { createProjectEditorError, ProjectEditorErrorCode } from '@/types/project-editor-errors';

// Storage quota exceeded
if (isQuotaExceeded(error)) {
  throw createProjectEditorError(
    ProjectEditorErrorCode.LOCALSTORAGE_QUOTA_EXCEEDED,
    'Cannot save draft: storage is full',
    { attemptedSize: value.length, key }
  );
}

// Draft not found
if (!draft) {
  throw createProjectEditorError(
    ProjectEditorErrorCode.DRAFT_NOT_FOUND,
    `Draft with key ${key} not found`,
    { key, projectId }
  );
}

// Sync rate limited
if (response.status === 429) {
  throw createProjectEditorError(
    ProjectEditorErrorCode.SYNC_RATE_LIMITED,
    'Please wait before syncing again',
    { retryAfter: response.headers.get('Retry-After') }
  );
}
```

### Error Handling

```typescript
try {
  await inputStateManager.set(key, value);
} catch (error) {
  if (error instanceof ProjectEditorError) {
    switch (error.code) {
      case ProjectEditorErrorCode.LOCALSTORAGE_QUOTA_EXCEEDED:
        await cleanupOldDrafts();
        await inputStateManager.set(key, value); // Retry
        break;
      case ProjectEditorErrorCode.STORAGE_UNAVAILABLE:
        showToast('Storage unavailable. Changes won\'t be saved.');
        break;
      default:
        console.error('Project editor error:', error);
    }
  }
}
```

---

## Related Specs

- [Error Code Registry](../../06-error-management/01-error-code-registry.md) — Master error list (17xxx range)
- [Master Registry](../../../03-error-manage/03-error-code-registry/02-registry.md) — Cross-project registry
- [Input State Persistence](./06-input-state-persistence.md) — Storage implementation
- [Draft Recovery UI](./01-draft-recovery-ui.md) — Error display
- [Sync API](./02-sync-api.md) — Sync error handling
