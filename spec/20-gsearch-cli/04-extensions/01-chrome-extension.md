# GSearch Chrome Extension Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Error Range:** 7880-7899

---

## Overview

Chrome extension for GSearch CLI that enables browser-based scheduled searches, offline data persistence, and automatic sync with the GSearch server when available. Uses SQLite (via sql.js) for consistent data architecture with the CLI.

---

## Core Features

| Feature | Description |
|---------|-------------|
| Scheduled Search | Create and manage search schedules from browser |
| Offline Storage | SQLite database via sql.js for offline capability |
| Auto-Sync | Bidirectional sync with GSearch CLI server |
| Conflict Resolution | Merge with timestamps strategy |
| Quick Search | Browser action popup for instant searches |
| Context Menu | Right-click to search selected text |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Popup     │  │  Options    │  │  Background │     │
│  │    UI       │  │   Page      │  │   Worker    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │               │               │               │
│         └───────────────┼───────────────┘               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Extension Core                      │   │
│  │  • ScheduleManager (CRUD, execution)            │   │
│  │  • SyncManager (server communication)           │   │
│  │  • StorageManager (sql.js wrapper)              │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │           sql.js SQLite Database                 │   │
│  │  • Schedules, Executions, SyncQueue             │   │
│  │  • Stored in IndexedDB for persistence          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼ (when online)
┌─────────────────────────────────────────────────────────┐
│                   GSearch CLI Server                    │
│  • /api/v1/sync/push                                    │
│  • /api/v1/sync/pull                                    │
│  • /api/v1/sync/resolve                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Extension Manifest (manifest.json)

```json
{
  "manifest_version": 3,
  "name": "GSearch",
  "version": "1.0.0",
  "description": "Scheduled searches with offline support",
  "permissions": [
    "storage",
    "alarms",
    "contextMenus",
    "offscreen"
  ],
  "host_permissions": [
    "http://localhost:*/*",
    "https://*.gsearch.local/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## SQLite Schema (sql.js)

### ExtSchedules Table

```sql
CREATE TABLE ExtSchedules (
    Id TEXT PRIMARY KEY,
    ServerId TEXT,                   -- Corresponding server schedule ID
    Name TEXT NOT NULL,
    SearchType TEXT NOT NULL,
    Query TEXT NOT NULL,
    Parameters TEXT,                 -- JSON
    ScheduleType TEXT NOT NULL,
    CronExpression TEXT,
    IntervalValue INTEGER,
    IntervalUnit TEXT,
    RunAt TEXT,                      -- ISO 8601 for one-time
    Timezone TEXT DEFAULT 'UTC',
    NextRunAt TEXT,
    LastRunAt TEXT,
    IsEnabled INTEGER DEFAULT 1,
    IsSynced INTEGER DEFAULT 0,
    LocalUpdatedAt TEXT NOT NULL,
    ServerUpdatedAt TEXT,
    CreatedAt TEXT DEFAULT (datetime('now'))
);
```

### ExtExecutions Table

```sql
CREATE TABLE ExtExecutions (
    Id TEXT PRIMARY KEY,
    ScheduleId TEXT NOT NULL,
    StartedAt TEXT NOT NULL,
    CompletedAt TEXT,
    Status TEXT NOT NULL,
    ResultCount INTEGER,
    Results TEXT,                    -- JSON compressed
    ErrorMessage TEXT,
    DurationMs INTEGER,
    IsSynced INTEGER DEFAULT 0,
    FOREIGN KEY (ScheduleId) REFERENCES ExtSchedules(Id)
);
```

### SyncQueue Table

```sql
CREATE TABLE SyncQueue (
    Id TEXT PRIMARY KEY,
    EntityType TEXT NOT NULL,        -- "schedule", "execution"
    EntityId TEXT NOT NULL,
    Operation TEXT NOT NULL,         -- "create", "update", "delete"
    Payload TEXT,                    -- JSON
    Attempts INTEGER DEFAULT 0,
    LastAttemptAt TEXT,
    CreatedAt TEXT DEFAULT (datetime('now'))
);
```

### SyncState Table

```sql
CREATE TABLE SyncState (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    UpdatedAt TEXT DEFAULT (datetime('now'))
);
-- Keys: lastSyncAt, serverUrl, syncEnabled
```

---

## Sync Protocol

### Push Changes (Extension → Server)

```
POST /api/v1/sync/push
```

**Request:**

```typescript
interface SyncPushRequest {
  clientId: string;
  changes: SyncChange[];
  lastSyncAt: string; // ISO 8601
}

interface SyncChange {
  entityType: "schedule" | "execution";
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  localUpdatedAt: string;
}
```

**Response:**

```typescript
interface SyncPushResponse {
  accepted: string[];      // Entity IDs accepted
  conflicts: SyncConflict[];
  serverTime: string;
}

interface SyncConflict {
  entityId: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  serverUpdatedAt: string;
}
```

### Pull Changes (Server → Extension)

```
GET /api/v1/sync/pull?since={lastSyncAt}&clientId={clientId}
```

**Response:**

```typescript
interface SyncPullResponse {
  changes: ServerChange[];
  serverTime: string;
}

interface ServerChange {
  entityType: "schedule" | "execution";
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  serverUpdatedAt: string;
}
```

### Conflict Resolution (Merge with Timestamps)

```typescript
function resolveConflict(local: Entity, server: Entity): Entity {
  // Merge with timestamps - field-level resolution
  const merged: Entity = { ...server };
  
  for (const key of Object.keys(local)) {
    const localFieldTime = local[`${key}UpdatedAt`];
    const serverFieldTime = server[`${key}UpdatedAt`];
    
    if (localFieldTime && serverFieldTime) {
      if (new Date(localFieldTime) > new Date(serverFieldTime)) {
        merged[key] = local[key];
        merged[`${key}UpdatedAt`] = localFieldTime;
      }
    }
  }
  
  return merged;
}
```

---

## TypeScript Interfaces

```typescript
// Storage Manager
interface StorageManager {
  init(): Promise<void>;
  getDb(): Database;
  persist(): Promise<void>;
  
  // Schedules
  createSchedule(schedule: ExtSchedule): Promise<ExtSchedule>;
  getSchedule(id: string): Promise<ExtSchedule | null>;
  listSchedules(): Promise<ExtSchedule[]>;
  updateSchedule(id: string, updates: Partial<ExtSchedule>): Promise<ExtSchedule>;
  deleteSchedule(id: string): Promise<void>;
  
  // Executions
  createExecution(execution: ExtExecution): Promise<ExtExecution>;
  getExecutionHistory(scheduleId: string, limit?: number): Promise<ExtExecution[]>;
  
  // Sync Queue
  queueChange(change: SyncQueueItem): Promise<void>;
  getPendingChanges(): Promise<SyncQueueItem[]>;
  markSynced(ids: string[]): Promise<void>;
}

// Sync Manager
interface SyncManager {
  isOnline(): boolean;
  getServerUrl(): string | null;
  setServerUrl(url: string): Promise<void>;
  
  sync(): Promise<SyncResult>;
  pushChanges(): Promise<PushResult>;
  pullChanges(): Promise<PullResult>;
  resolveConflicts(conflicts: SyncConflict[]): Promise<void>;
  
  startAutoSync(intervalMs: number): void;
  stopAutoSync(): void;
}

// Schedule Manager
interface ScheduleManager {
  create(req: CreateScheduleRequest): Promise<ExtSchedule>;
  update(id: string, req: UpdateScheduleRequest): Promise<ExtSchedule>;
  delete(id: string): Promise<void>;
  runNow(id: string): Promise<ExtExecution>;
  
  // Alarm management
  registerAlarms(): Promise<void>;
  handleAlarm(alarmName: string): Promise<void>;
}
```

---

## Background Worker Tasks

```typescript
// background.ts

// 1. Schedule execution via Chrome Alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('schedule:')) {
    const scheduleId = alarm.name.replace('schedule:', '');
    await scheduleManager.runNow(scheduleId);
  }
  
  if (alarm.name === 'sync') {
    await syncManager.sync();
  }
});

// 2. Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  await storageManager.init();
  await scheduleManager.registerAlarms();
  
  // Auto-sync every 5 minutes when online
  chrome.alarms.create('sync', { periodInMinutes: 5 });
});

// 3. Context menu for quick search
chrome.contextMenus.create({
  id: 'gsearch-selection',
  title: 'Search with GSearch: "%s"',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'gsearch-selection' && info.selectionText) {
    // Open popup with search query
    chrome.action.openPopup();
    // Send message to popup with query
  }
});
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7880 | ErrExtensionInit | Extension initialization failed |
| 7881 | ErrSqlJsInit | sql.js database initialization failed |
| 7882 | ErrStoragePersist | Failed to persist database to IndexedDB |
| 7883 | ErrSyncServerUnreachable | GSearch server not reachable |
| 7884 | ErrSyncPushFailed | Failed to push changes to server |
| 7885 | ErrSyncPullFailed | Failed to pull changes from server |
| 7886 | ErrSyncConflict | Unresolved sync conflict |
| 7887 | ErrAlarmCreate | Failed to create Chrome alarm |
| 7888 | ErrScheduleExecution | Schedule execution failed in extension |
| 7889 | ErrOfflineQueueFull | Offline sync queue exceeded limit |

---

## Configuration

### Options Page Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| serverUrl | string | `http://localhost:5020` | GSearch CLI server URL |
| syncEnabled | boolean | true | Enable auto-sync |
| syncIntervalMinutes | number | 5 | Auto-sync interval |
| offlineQueueLimit | number | 1000 | Max pending sync items |
| executionRetentionDays | number | 7 | Local execution history retention |

---

## Directory Structure

```
gsearch-extension/
├── manifest.json
├── background.js
├── popup/
│   ├── popup.html
│   ├── popup.tsx
│   └── popup.css
├── options/
│   ├── options.html
│   ├── options.tsx
│   └── options.css
├── lib/
│   ├── storage-manager.ts
│   ├── sync-manager.ts
│   ├── schedule-manager.ts
│   └── sql-js-wrapper.ts
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── vendor/
    └── sql-wasm.js
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Scheduled Search | `spec/20-gsearch-cli/01-backend/57-scheduled-search.md` |
| Multi-Source Search | `spec/20-gsearch-cli/01-backend/56-multi-source-search.md` |
| Split DB Architecture | `spec/06-split-db-architecture/00-overview.md` |
