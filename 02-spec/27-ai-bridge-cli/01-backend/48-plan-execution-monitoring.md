 # 48 - Plan Execution Monitoring
 
 **Module:** AI Bridge CLI  
 **Version:** 5.0.0  
 **Domain:** Execution Tracking & Recovery  
 **Updated:** 2026-03-09  
 **Error Range:** 9930 - 9949
 
 ---
 
 ## 1. Overview
 
 Plan Execution Monitoring provides real-time progress tracking, automatic rollback on failure, checkpoint management, and comprehensive execution history. This ensures reliable plan execution with full observability and recovery capabilities.
 
 ---
 
 ## 2. Monitoring Architecture
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                      EXECUTION MONITORING ARCHITECTURE                          │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │     ┌───────────────────────────────────────────────────────────────────┐       │
 │     │                    EXECUTION ENGINE                               │       │
 │     │  ├── Task Scheduler (dependency-aware ordering)                   │       │
 │     │  ├── Checkpoint Manager (save/restore points)                     │       │
 │     │  ├── Progress Tracker (real-time metrics)                        │       │
 │     │  └── Rollback Controller (automatic/manual recovery)             │       │
 │     └───────────────────────────────────────────────────────────────────┘       │
 │                                    │                                            │
 │          ┌────────────────────────┼────────────────────────┐                   │
 │          ▼                        ▼                        ▼                   │
 │     ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
 │     │  WEBSOCKET  │        │  DATABASE   │        │  FILE       │             │
 │     │  STREAMING  │        │  HISTORY    │        │  SNAPSHOTS  │             │
 │     │             │        │             │        │             │             │
 │     │ • Progress  │        │ • Executions│        │ • Backups   │             │
 │     │ • Status    │        │ • Tasks     │        │ • Diffs     │             │
 │     │ • Errors    │        │ • Metrics   │        │ • Rollback  │             │
 │     └─────────────┘        └─────────────┘        └─────────────┘             │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Database Schema
 
 ### 3.1 Executions Table
 
 ```sql
CREATE TABLE Executions (
    Id TEXT PRIMARY KEY,
    PlanId TEXT NOT NULL,
    Status TEXT NOT NULL DEFAULT 'Pending',  -- Pending, Running, Paused, Completed, Failed, RolledBack
    StartedAt DATETIME,
    CompletedAt DATETIME,
    TotalTasks INTEGER NOT NULL DEFAULT 0,
    CompletedTasks INTEGER NOT NULL DEFAULT 0,
    FailedTasks INTEGER NOT NULL DEFAULT 0,
    SkippedTasks INTEGER NOT NULL DEFAULT 0,
    CurrentTaskId TEXT,
    ErrorMessage TEXT,
    RollbackStatus TEXT,                     -- None, InProgress, Completed, Failed
    RollbackReason TEXT,
    DurationMs INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlanId) REFERENCES Plans(Id)
);

CREATE INDEX IdxExecutionsPlan ON Executions(PlanId);
CREATE INDEX IdxExecutionsStatus ON Executions(Status);
CREATE INDEX IdxExecutionsStarted ON Executions(StartedAt);
 ```
 
 ### 3.2 TaskExecutions Table
 
 ```sql
CREATE TABLE TaskExecutions (
    Id TEXT PRIMARY KEY,
    ExecutionId TEXT NOT NULL,
    TaskId TEXT NOT NULL,
    TaskNumber INTEGER NOT NULL,
    Status TEXT NOT NULL DEFAULT 'Pending',  -- Pending, Running, Completed, Failed, Skipped, RolledBack
    StartedAt DATETIME,
    CompletedAt DATETIME,
    DurationMs INTEGER,
    LinesAdded INTEGER DEFAULT 0,
    LinesRemoved INTEGER DEFAULT 0,
    FilesCreated INTEGER DEFAULT 0,
    FilesModified INTEGER DEFAULT 0,
    FilesDeleted INTEGER DEFAULT 0,
    ErrorCode INTEGER,
    ErrorMessage TEXT,
    RetryCount INTEGER DEFAULT 0,
    OutputLog TEXT,                          -- Execution output/logs
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ExecutionId) REFERENCES Executions(Id),
    FOREIGN KEY (TaskId) REFERENCES PlanTasks(Id)
);

CREATE INDEX IdxTaskExecExecution ON TaskExecutions(ExecutionId);
CREATE INDEX IdxTaskExecStatus ON TaskExecutions(Status);
 ```
 
 ### 3.3 Checkpoints Table
 
 ```sql
CREATE TABLE Checkpoints (
    Id TEXT PRIMARY KEY,
    ExecutionId TEXT NOT NULL,
    TaskNumber INTEGER NOT NULL,             -- Checkpoint after this task
    Name TEXT,
    SnapshotPath TEXT NOT NULL,              -- Path to file backup
    FileManifest TEXT NOT NULL,              -- JSON: list of files and their hashes
    IsAutomatic INTEGER DEFAULT 1,           -- Auto-created or manual
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ExecutionId) REFERENCES Executions(Id)
);

CREATE INDEX IdxCheckpointsExecution ON Checkpoints(ExecutionId);
CREATE UNIQUE INDEX IdxCheckpointsExecTask ON Checkpoints(ExecutionId, TaskNumber);
 ```
 
 ### 3.4 RollbackOperations Table
 
 ```sql
CREATE TABLE RollbackOperations (
    Id TEXT PRIMARY KEY,
    ExecutionId TEXT NOT NULL,
    TargetCheckpointId TEXT NOT NULL,
    Status TEXT NOT NULL DEFAULT 'Pending',  -- Pending, InProgress, Completed, Failed
    Reason TEXT NOT NULL,                    -- TaskFailure, UserRequest, Timeout
    FilesRestored INTEGER DEFAULT 0,
    FilesDeleted INTEGER DEFAULT 0,
    StartedAt DATETIME,
    CompletedAt DATETIME,
    ErrorMessage TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ExecutionId) REFERENCES Executions(Id),
    FOREIGN KEY (TargetCheckpointId) REFERENCES Checkpoints(Id)
);

CREATE INDEX IdxRollbackExecution ON RollbackOperations(ExecutionId);
 ```
 
 ---
 
 ## 4. Real-Time Progress Tracking
 
 ### 4.1 Progress Data Structure
 
```go
type ExecutionProgress struct {
    ExecutionId       string
    PlanId            string
    Status            string
    CurrentTask       int
    TotalTasks        int
    CompletedTasks    int
    FailedTasks       int
    PercentComplete   float64
    ElapsedMs         int64
    EstimatedRemainMs int64
    CurrentTaskInfo   *TaskProgress `json:",omitempty"`
}

type TaskProgress struct {
    TaskNumber   int
    Title        string
    Status       string
    FilePath     string
    Action       string
    ProgressPct  float64
    LinesWritten int
    Message      string
}
```
 
 ### 4.2 WebSocket Events
 
 | Event | Direction | Payload | Description |
 |-------|-----------|---------|-------------|
 | `execution.started` | Server→Client | ExecutionProgress | Execution began |
 | `execution.progress` | Server→Client | ExecutionProgress | Progress update (every 500ms) |
 | `execution.paused` | Server→Client | ExecutionProgress | Execution paused |
 | `execution.resumed` | Server→Client | ExecutionProgress | Execution resumed |
 | `execution.completed` | Server→Client | ExecutionProgress | All tasks done |
 | `execution.failed` | Server→Client | ExecutionProgress + Error | Execution failed |
 | `task.started` | Server→Client | TaskProgress | Task began |
 | `task.progress` | Server→Client | TaskProgress | Task progress |
 | `task.completed` | Server→Client | TaskProgress | Task done |
 | `task.failed` | Server→Client | TaskProgress + Error | Task failed |
 | `checkpoint.created` | Server→Client | Checkpoint | Checkpoint saved |
 | `rollback.started` | Server→Client | RollbackInfo | Rollback began |
 | `rollback.progress` | Server→Client | RollbackInfo | Rollback progress |
 | `rollback.completed` | Server→Client | RollbackInfo | Rollback done |
 
 ---
 
 ## 5. Checkpoint System
 
 ### 5.1 Automatic Checkpoints
 
 Checkpoints are created automatically:
 - Before each task execution
 - After successful task completion (configurable)
 - Before any file deletion
 - At user-defined intervals
 
```go
type CheckpointConfig struct {
    AutoCreateBefore bool   // Before each task
    AutoCreateAfter  bool   // After each task
    BeforeDeletes    bool   // Before file deletions
    IntervalTasks    int    // Every N tasks
    MaxCheckpoints   int    // Keep last N (rolling)
    SnapshotDir      string // Default: .lovable/snapshots
}
```
 
 ### 5.2 Checkpoint Storage
 
 ```
 .lovable/
 └── snapshots/
     └── exec_abc123/
         ├── checkpoint_001/
         │   ├── manifest.json
         │   └── files/
         │       ├── internal/auth/config.go
         │       └── internal/auth/handler.go
         ├── checkpoint_002/
         │   ├── manifest.json
         │   └── files/
         │       └── internal/auth/session.go
         └── checkpoint_003/
             ├── manifest.json
             └── files/
                 └── internal/middleware/auth.go
 ```
 
 ### 5.3 Manifest Format
 
 ```json
 {
   "CheckpointId": "chk_001",
   "ExecutionId": "exec_abc123",
   "TaskNumber": 2,
   "CreatedAt": "2026-02-05T10:35:00Z",
   "Files": [
     {
       "Path": "internal/auth/config.go",
       "Hash": "sha256:abc123...",
       "Size": 1247,
       "Action": "backup_before_create"
     },
     {
       "Path": "internal/auth/handler.go",
       "Hash": "sha256:def456...",
       "Size": 3891,
       "Action": "backup_before_modify"
     }
   ]
 }
 ```
 
 ---
 
 ## 6. Rollback System
 
 ### 6.1 Rollback Triggers
 
 | Trigger | Behavior |
 |---------|----------|
 | **Task Failure** | Auto-rollback to last checkpoint (if enabled) |
 | **User Request** | Manual rollback to specific checkpoint |
 | **Timeout** | Rollback if task exceeds time limit |
 | **Dependency Failure** | Rollback dependent tasks when parent fails |
 
 ### 6.2 Rollback Flow
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │                    ROLLBACK EXECUTION FLOW                      │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │  TASK FAILED                                                    │
 │       │                                                          │
 │       ▼                                                          │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ 1. IDENTIFY TARGET CHECKPOINT                            │   │
 │  │    • Find last successful checkpoint before failure      │   │
 │  │    • Or use user-specified checkpoint                    │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │       │                                                          │
 │       ▼                                                          │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ 2. RESTORE FILES                                         │   │
 │  │    • Delete files created after checkpoint               │   │
 │  │    • Restore modified files from backup                  │   │
 │  │    • Verify file hashes match manifest                   │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │       │                                                          │
 │       ▼                                                          │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ 3. UPDATE EXECUTION STATE                                │   │
 │  │    • Mark rolled-back tasks as 'rolled_back'             │   │
 │  │    • Update execution status                             │   │
 │  │    • Record rollback in history                          │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │       │                                                          │
 │       ▼                                                          │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ 4. NOTIFY & RESUME OPTIONS                               │   │
 │  │    • Emit rollback.completed event                       │   │
 │  │    • Offer: Retry failed task / Skip / Abort             │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ### 6.3 Rollback Configuration
 
```go
type RollbackConfig struct {
    AutoRollbackOnFailure bool // Default: true
    PromptBeforeRollback  bool // Ask user first
    PreserveFailedFiles   bool // Keep for debugging
    MaxRetryAttempts      int  // Before rollback
    TaskTimeoutSec        int  // Timeout trigger
}
```
 
 ---
 
 ## 7. Execution History
 
 ### 7.1 History Query Structure
 
```go
type ExecutionHistoryQuery struct {
    PlanId       string    // Filter by plan
    Status       []string  // Filter by status
    StartAfter   time.Time // Date range
    StartBefore  time.Time
    Limit        int       // Pagination
    Offset       int
    IncludeTasks bool      // Include task details
}

type ExecutionHistoryItem struct {
    Execution   Execution
    Tasks       []TaskExecution  `json:",omitempty"`
    Checkpoints []Checkpoint     `json:",omitempty"`
    Rollbacks   []RollbackOp     `json:",omitempty"`
    Metrics     ExecutionMetrics
}

type ExecutionMetrics struct {
    TotalDurationMs   int64
    AvgTaskDurationMs int64
    TotalLinesAdded   int
    TotalLinesRemoved int
    FilesCreated      int
    FilesModified     int
    FilesDeleted      int
    SuccessRate       float64
}
```
 
 ---
 
 ## 8. CLI Commands
 
 ### 8.1 Execution Monitoring
 
 ```bash
 # View live execution progress
 aibridge exec watch
 # Real-time progress bar and task status
 
 # View execution status
 aibridge exec status
 # Shows current execution state
 
 # Pause execution
 aibridge exec pause
 
 # Resume execution
 aibridge exec resume
 
 # Cancel execution
 aibridge exec cancel
 ```
 
 ### 8.2 Checkpoint Management
 
 ```bash
 # List checkpoints for current execution
 aibridge checkpoint list
 
 # Create manual checkpoint
 aibridge checkpoint create --name "before-refactor"
 
 # View checkpoint details
 aibridge checkpoint show --id chk_001
 
 # Delete old checkpoints
 aibridge checkpoint prune --keep 5
 ```
 
 ### 8.3 Rollback Commands
 
 ```bash
 # Rollback to last checkpoint
 aibridge rollback
 
 # Rollback to specific checkpoint
 aibridge rollback --checkpoint chk_002
 
 # Rollback to before specific task
 aibridge rollback --before-task 3
 
 # Preview rollback (dry run)
 aibridge rollback --dry-run
 
 # Force rollback without confirmation
 aibridge rollback --force
 ```
 
 ### 8.4 History Commands
 
 ```bash
 # View execution history
 aibridge history list
 
 # View specific execution details
 aibridge history show --id exec_abc123
 
 # View history with task breakdown
 aibridge history show --id exec_abc123 --tasks
 
 # Export history to file
 aibridge history export --format json --output history.json
 
 # View statistics
 aibridge history stats
 # Shows: avg duration, success rate, common failures
 ```
 
 ---
 
 ## 9. API Endpoints
 
 ### 9.1 Execution Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/executions` | List all executions |
 | GET | `/api/v1/executions/{id}` | Get execution details |
 | GET | `/api/v1/executions/{id}/progress` | Get live progress |
 | POST | `/api/v1/executions/{id}/pause` | Pause execution |
 | POST | `/api/v1/executions/{id}/resume` | Resume execution |
 | POST | `/api/v1/executions/{id}/cancel` | Cancel execution |
 | GET | `/api/v1/executions/{id}/tasks` | List task executions |
 | GET | `/api/v1/executions/{id}/metrics` | Get execution metrics |
 
 ### 9.2 Checkpoint Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/executions/{id}/checkpoints` | List checkpoints |
 | POST | `/api/v1/executions/{id}/checkpoints` | Create checkpoint |
 | GET | `/api/v1/checkpoints/{id}` | Get checkpoint details |
 | DELETE | `/api/v1/checkpoints/{id}` | Delete checkpoint |
 | GET | `/api/v1/checkpoints/{id}/files` | List backed up files |
 
 ### 9.3 Rollback Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | POST | `/api/v1/executions/{id}/rollback` | Trigger rollback |
 | GET | `/api/v1/executions/{id}/rollback/preview` | Preview rollback |
 | GET | `/api/v1/rollbacks/{id}` | Get rollback status |
 
 ### 9.4 History Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/history` | Query execution history |
 | GET | `/api/v1/history/stats` | Get aggregate statistics |
 | DELETE | `/api/v1/history/{id}` | Delete history entry |
 
 ---
 
 ## 10. Error Codes
 
 | Code | Constant | Description |
 |------|----------|-------------|
 | 9930 | `ErrExecutionNotFound` | Execution ID not found |
 | 9931 | `ErrExecutionAlreadyRunning` | Another execution in progress |
 | 9932 | `ErrExecutionNotPaused` | Cannot resume, not paused |
 | 9933 | `ErrExecutionCannotPause` | Cannot pause in current state |
 | 9934 | `ErrTaskExecutionFailed` | Task execution error |
 | 9935 | `ErrTaskTimeout` | Task exceeded time limit |
 | 9936 | `ErrCheckpointNotFound` | Checkpoint ID not found |
 | 9937 | `ErrCheckpointCreateFailed` | Failed to create checkpoint |
 | 9938 | `ErrCheckpointRestoreFailed` | Failed to restore checkpoint |
 | 9939 | `ErrRollbackFailed` | Rollback operation failed |
 | 9940 | `ErrRollbackInProgress` | Rollback already running |
 | 9941 | `ErrNoCheckpointAvailable` | No checkpoint to rollback to |
 | 9942 | `ErrFileRestoreFailed` | Failed to restore file |
 | 9943 | `ErrManifestCorrupted` | Checkpoint manifest invalid |
 | 9944 | `ErrHistoryQueryFailed` | Failed to query history |
 | 9945 | `ErrMetricsCalculationFailed` | Failed to calculate metrics |
 
 ---
 
 ## 11. Configuration
 
 ### 11.1 Settings Keys
 
 ```go
 const (
     SettingExecAutoCheckpoint     = "Execution.AutoCheckpoint"       // bool, default: true
     SettingExecCheckpointInterval = "Execution.CheckpointInterval"   // int, default: 1 (every task)
     SettingExecMaxCheckpoints     = "Execution.MaxCheckpoints"       // int, default: 10
     SettingExecAutoRollback       = "Execution.AutoRollback"         // bool, default: true
     SettingExecTaskTimeout        = "Execution.TaskTimeoutSec"       // int, default: 300
     SettingExecMaxRetries         = "Execution.MaxRetries"           // int, default: 2
     SettingExecSnapshotDir        = "Execution.SnapshotDir"          // string, default: ".lovable/snapshots"
     SettingExecHistoryRetention   = "Execution.HistoryRetentionDays" // int, default: 30
 )
 ```
 
 ---
 
 ## 12. Related Specifications
 
 - [44-plan-generation.md](44-plan-generation.md) - Plan creation
 - [45-plan-synchronization.md](45-plan-synchronization.md) - Plan sync
 - [47-onboarding-guide.md](47-onboarding-guide.md) - Complete workflow guide
 
 ---
 
 *Full observability from start to rollback—never lose progress during execution.*