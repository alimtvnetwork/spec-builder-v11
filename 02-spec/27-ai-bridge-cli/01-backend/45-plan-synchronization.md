 # 45 - Plan Synchronization System
 
 **Module:** AI Bridge CLI  
 **Version:** 5.0.0  
 **Domain:** Plan File & Database Sync  
 **Updated:** 2026-03-09  
 **Error Range:** 9890 - 9909
 
 ---
 
 ## 1. Overview
 
 Plan Synchronization ensures bidirectional consistency between the database (Plans, PlanTasks tables) and the `.lovable/plan.md` file. Users can edit the Markdown file directly, and changes are synced back to the database with conflict resolution.
 
 ---
 
 ## 2. Synchronization Flow
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     PLAN SYNCHRONIZATION ARCHITECTURE                        │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │                                                                              │
 │     ┌───────────────────┐                      ┌───────────────────┐        │
 │     │   Database (DB)   │                      │  .lovable/plan.md │        │
 │     │                   │                      │                   │        │
 │     │  Plans            │  ◄─── SYNC ────►     │  Markdown File    │        │
 │     │  PlanTasks        │                      │  (Human Editable) │        │
 │     │  PlanRevisions    │                      │                   │        │
 │     └─────────┬─────────┘                      └─────────┬─────────┘        │
 │               │                                          │                  │
 │               ▼                                          ▼                  │
 │     ┌───────────────────────────────────────────────────────────────┐      │
 │     │                    SYNC ENGINE                                  │      │
 │     │  ├── Parse Markdown → Structured Data                          │      │
 │     │  ├── Compare DB ↔ File (hash-based)                            │      │
 │     │  ├── Detect Conflicts                                          │      │
 │     │  ├── Apply Resolution Strategy                                 │      │
 │     │  └── Update Both Sources + Record Revision                     │      │
 │     └───────────────────────────────────────────────────────────────┘      │
 │                                                                              │
 └─────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Sync States
 
 | State | Description |
 |-------|-------------|
 | `synced` | DB and file are identical |
 | `db_ahead` | DB has changes not in file |
 | `file_ahead` | File has changes not in DB |
 | `conflict` | Both have divergent changes |
 | `file_missing` | File doesn't exist, DB has plan |
 | `db_missing` | File exists, no matching DB record |
 
 ---
 
 ## 4. Database Schema Additions
 
 ### 4.1 PlanSync Table
 
 ```sql
CREATE TABLE PlanSync (
    Id TEXT PRIMARY KEY,
    PlanId TEXT NOT NULL UNIQUE,
    FilePath TEXT NOT NULL,
    FileHash TEXT NOT NULL,              -- SHA256 of file content
    DbHash TEXT NOT NULL,                -- SHA256 of serialized DB state
    LastSyncAt DATETIME NOT NULL,
    SyncStatus TEXT DEFAULT 'Synced',    -- Synced, DbAhead, FileAhead, Conflict
    ConflictData TEXT,                   -- JSON: details of conflict
    AutoSyncEnabled INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlanId) REFERENCES Plans(Id)
);

CREATE INDEX IdxPlanSyncStatus ON PlanSync(SyncStatus);
CREATE INDEX IdxPlanSyncPath ON PlanSync(FilePath);
```

### 4.2 SyncEvents Table

```sql
CREATE TABLE SyncEvents (
    Id TEXT PRIMARY KEY,
    PlanId TEXT NOT NULL,
    Direction TEXT NOT NULL,             -- DbToFile, FileToDb, Merge
    ChangeType TEXT NOT NULL,            -- FullSync, TaskUpdate, StatusChange, ConflictResolved
    FieldsChanged TEXT,                  -- JSON array of changed fields
    PreviousFileHash TEXT,
    NewFileHash TEXT,
    PreviousDbHash TEXT,
    NewDbHash TEXT,
    ResolutionStrategy TEXT,             -- Auto, DbWins, FileWins, ManualMerge
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlanId) REFERENCES Plans(Id)
);

CREATE INDEX IdxSyncEventsPlan ON SyncEvents(PlanId);
 ```
 
 ---
 
 ## 5. CLI Commands
 
 ### 5.1 Sync Commands
 
 ```bash
 # Check sync status
 aibridge plan sync status
 # Output:
 # Plan: "Implement OAuth Authentication"
 # Status: file_ahead
 # File modified: 2 tasks updated, 1 task added
 # Last sync: 2026-02-05T10:30:00Z
 
 # Sync file changes to database
 aibridge plan sync pull
 # Pulls changes from .lovable/plan.md into database
 
 # Sync database changes to file
 aibridge plan sync push
 # Pushes DB changes to .lovable/plan.md
 
 # Full bidirectional sync (auto-resolve if possible)
 aibridge plan sync
 # Detects direction, syncs, handles conflicts
 
 # Force sync direction (overwrite)
 aibridge plan sync --force-db       # DB overwrites file
 aibridge plan sync --force-file     # File overwrites DB
 
 # Enable/disable auto-sync (file watcher)
 aibridge plan sync auto --enable
 aibridge plan sync auto --disable
 
 # Show sync history
 aibridge plan sync history
 # Lists all sync events with timestamps
 
 # View specific conflict details
 aibridge plan sync conflict --show
 # Displays diff between DB and file versions
 
 # Resolve conflict with strategy
 aibridge plan sync resolve --strategy db-wins
 aibridge plan sync resolve --strategy file-wins
 aibridge plan sync resolve --strategy merge    # Interactive merge
 
 # Export sync state for debugging
 aibridge plan sync export --output sync-debug.json
 ```
 
 ### 5.2 Watch Mode
 
 ```bash
 # Start file watcher for automatic sync
 aibridge plan watch
 # Watches .lovable/plan.md for changes
 # Auto-syncs on save (debounced 500ms)
 
 # Watch with conflict notification (no auto-resolve)
 aibridge plan watch --notify-conflicts
 
 # Watch with specific resolution strategy
 aibridge plan watch --on-conflict file-wins
 ```
 
 ---
 
 ## 6. API Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/plans/{id}/sync/status` | Get sync status for plan |
 | POST | `/api/v1/plans/{id}/sync/pull` | Pull file changes to DB |
 | POST | `/api/v1/plans/{id}/sync/push` | Push DB changes to file |
 | POST | `/api/v1/plans/{id}/sync` | Bidirectional sync |
 | POST | `/api/v1/plans/{id}/sync/force` | Force sync with direction |
 | GET | `/api/v1/plans/{id}/sync/diff` | Get diff between DB and file |
 | GET | `/api/v1/plans/{id}/sync/conflict` | Get conflict details |
 | POST | `/api/v1/plans/{id}/sync/resolve` | Resolve conflict |
 | GET | `/api/v1/plans/{id}/sync/history` | Get sync event history |
 | PUT | `/api/v1/plans/{id}/sync/settings` | Update sync settings |
 
 ---
 
 ## 7. Request/Response Schemas
 
 ### 7.1 Sync Status Response
 
 ```json
 {
   "PlanId": "plan_abc123",
   "Status": "file_ahead",
   "FilePath": ".lovable/plan.md",
   "FileModifiedAt": "2026-02-05T11:00:00Z",
   "DbModifiedAt": "2026-02-05T10:30:00Z",
   "LastSyncAt": "2026-02-05T10:30:00Z",
   "Changes": {
     "TasksAdded": 1,
     "TasksModified": 2,
     "TasksRemoved": 0,
     "MetadataChanged": false
   },
   "ConflictExists": false
 }
 ```
 
 ### 7.2 Conflict Details Response
 
 ```json
 {
   "PlanId": "plan_abc123",
   "ConflictType": "divergent_changes",
   "DbVersion": {
     "Hash": "abc123...",
     "ModifiedAt": "2026-02-05T10:45:00Z",
     "Tasks": [
       {"TaskNumber": 2, "Status": "done", "Description": "DB version..."}
     ]
   },
   "FileVersion": {
     "Hash": "def456...",
     "ModifiedAt": "2026-02-05T10:50:00Z",
     "Tasks": [
       {"TaskNumber": 2, "Status": "todo", "Description": "File version..."}
     ]
   },
   "ConflictingFields": [
     {
       "TaskNumber": 2,
       "Field": "Status",
       "DbValue": "done",
       "FileValue": "todo"
     },
     {
       "TaskNumber": 2,
       "Field": "Description",
       "DbValue": "DB version...",
       "FileValue": "File version..."
     }
   ],
   "SuggestedResolution": "file_wins",
   "Reason": "File has more recent timestamp"
 }
 ```
 
 ### 7.3 Resolve Conflict Request
 
 ```json
 {
   "Strategy": "merge",
   "Decisions": [
     {
       "TaskNumber": 2,
       "Field": "Status",
       "UseSource": "db"
     },
     {
       "TaskNumber": 2,
       "Field": "Description", 
       "UseSource": "file"
     }
   ]
 }
 ```
 
 ---
 
 ## 8. Conflict Resolution Strategies
 
 ### 8.1 Available Strategies
 
 | Strategy | Description | Use Case |
 |----------|-------------|----------|
 | `auto` | Timestamp-based: newer wins | Default for auto-sync |
 | `db-wins` | Database always overwrites file | Programmatic changes priority |
 | `file-wins` | File always overwrites database | Manual edits priority |
 | `merge` | Field-by-field resolution | Complex conflicts |
 | `manual` | Pause and prompt user | Interactive sessions |
 
 ### 8.2 Auto-Resolution Rules
 
 ```
 ┌─────────────────────────────────────────────────────────────────────┐
 │              AUTO-RESOLUTION DECISION TREE                          │
 ├─────────────────────────────────────────────────────────────────────┤
 │                                                                      │
 │   Is there a conflict?                                              │
 │        │                                                             │
 │        ├── NO: Apply changes from ahead source                      │
 │        │                                                             │
 │        └── YES: Check conflict type                                 │
 │              │                                                       │
 │              ├── Status only → More progressed status wins          │
 │              │   (todo < in_progress < done)                        │
 │              │                                                       │
 │              ├── Description only → Newer timestamp wins            │
 │              │                                                       │
 │              ├── Task added in both → Merge (assign new numbers)    │
 │              │                                                       │
 │              ├── Task deleted in one → Keep deletion if DB          │
 │              │   (File deletion = user intent to remove)            │
 │              │                                                       │
 │              └── Multiple fields → Escalate to manual               │
 │                                                                      │
 └─────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 9. Markdown Parsing Rules
 
 ### 9.1 Task Extraction Pattern
 
 ```go
 // Task header pattern
 // ### 1. Task Title
 // - **Status:** `todo`
 // - **File:** `path/to/file.go`
 // - **Action:** create
 // - **Complexity:** medium
 // - **Dependencies:** [Task 1, Task 2]
 // - **Description:** Task description text
 // - **Patterns Applied:** Pattern1, Pattern2
 
type MarkdownTask struct {
    TaskNumber      int
    Title           string
    Status          string
    FilePath        string
    Action          string
    Complexity      string
    Dependencies    []int
    Description     string
    PatternsApplied []string
}
```

### 9.2 Metadata Extraction

```go
// Header pattern
// **Request:** Original user request
// **Created:** 2026-02-05T10:30:00Z
// **Status:** PendingApproval
// **Estimated Tasks:** 6

type MarkdownPlan struct {
    Request       string
    Created       time.Time
    Status        string
    EstimatedTasks int
    Summary       string
    Tasks         []MarkdownTask
    Notes         []string
    Approved      bool
}
 ```
 
 ---
 
 ## 10. File Watcher Implementation
 
 ```go
 type PlanWatcher struct {
     PlanId          string
     FilePath        string
     DebounceMs      int
     OnConflict      string  // strategy
     NotifyConflicts bool
 }
 
 func (w *PlanWatcher) Start() *apperror.AppError {
     watcher, err := fsnotify.NewWatcher()
     if err != nil {
         return apperror.Wrap(
             err,
             ErrPlanWatcherFailed,
             "failed to create file watcher",
         )
     }
     
     var debounceTimer *time.Timer
     
     for {
         select {
         case event := <-watcher.Events:
             if event.Op&fsnotify.Write == fsnotify.Write {
                 if debounceTimer != nil {
                     debounceTimer.Stop()
                 }
                 debounceTimer = time.AfterFunc(
                     time.Duration(w.DebounceMs)*time.Millisecond,
                     func() { w.handleFileChange() },
                 )
             }
         case err := <-watcher.Errors:
             log.Error().Err(err).Msg("Watch error")
         }
     }
 }
 ```
 
 ---
 
 ## 11. WebSocket Events
 
 | Event | Direction | Description |
 |-------|-----------|-------------|
 | `plan.sync.started` | Server→Client | Sync operation started |
 | `plan.sync.completed` | Server→Client | Sync completed successfully |
 | `plan.sync.conflict` | Server→Client | Conflict detected, needs resolution |
 | `plan.sync.resolved` | Server→Client | Conflict resolved |
 | `plan.sync.failed` | Server→Client | Sync operation failed |
 | `plan.file.changed` | Server→Client | File watcher detected change |
 | `plan.db.changed` | Server→Client | Database record updated |
 
 ---
 
 ## 12. Error Codes
 
 | Code | Constant | Description |
 |------|----------|-------------|
 | 9890 | `ErrSyncParseFailed` | Failed to parse Markdown file |
 | 9891 | `ErrSyncHashMismatch` | Hash validation failed |
 | 9892 | `ErrSyncConflict` | Unresolved sync conflict |
 | 9893 | `ErrSyncFileMissing` | Plan file not found |
 | 9894 | `ErrSyncDbMissing` | No DB record for file |
 | 9895 | `ErrSyncWriteFailed` | Failed to write sync result |
 | 9896 | `ErrSyncLocked` | Plan is locked during execution |
 | 9897 | `ErrSyncStrategyInvalid` | Unknown resolution strategy |
 | 9898 | `ErrSyncMergeConflict` | Cannot auto-merge conflicts |
 | 9899 | `ErrSyncTaskNumberConflict` | Task numbering mismatch |
 | 9900 | `ErrSyncWatcherFailed` | File watcher error |
 | 9901 | `ErrSyncDebounceTimeout` | Debounce timer expired |
 | 9902 | `ErrSyncInvalidMarkdown` | Markdown structure invalid |
 | 9903 | `ErrSyncRevisionFailed` | Failed to record sync revision |
 | 9904 | `ErrSyncWatcherInit` | Failed to initialize watcher |
 
 ---
 
 ## 13. Configuration
 
 ### 13.1 Settings Keys
 
 ```go
 const (
     SettingSyncAutoEnabled      = "Sync.AutoEnabled"       // bool, default: true
     SettingSyncDebounceMs       = "Sync.DebounceMs"        // int, default: 500
     SettingSyncDefaultStrategy  = "Sync.DefaultStrategy"   // string, default: "auto"
     SettingSyncNotifyConflicts  = "Sync.NotifyConflicts"   // bool, default: true
     SettingSyncWatchOnStartup   = "Sync.WatchOnStartup"    // bool, default: false
     SettingSyncMaxHistory       = "Sync.MaxHistory"        // int, default: 100
 )
 ```
 
 ### 13.2 Seed Configuration
 
 ```json
 {
   "Sync": {
     "AutoEnabled": true,
     "DebounceMs": 500,
     "DefaultStrategy": "auto",
     "NotifyConflicts": true,
     "WatchOnStartup": false,
     "MaxHistory": 100
   }
 }
 ```
 
 ---
 
 ## 14. Related Specifications
 
 - [44-plan-generation.md](44-plan-generation.md) - Core plan generation system
 - [46-plan-templates.md](46-plan-templates.md) - Custom plan templates
 - [42-lovable-reasoning-defaults.md](42-lovable-reasoning-defaults.md) - Reasoning integration
 
 ---
 
 *Plan sync ensures your `.lovable/plan.md` is always in harmony with the database.*