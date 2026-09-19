# Instruction History System

**Version:** 2.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-09

---

## 1. Overview

The Instruction History System tracks the relationship between voice/text instructions and the file changes they produce. This enables:

- **Traceability**: See which instruction caused each file change
- **Rollback**: Undo all changes from a specific instruction
- **Audit**: Complete history of AI-driven modifications
- **Learning**: Analyze instruction patterns for improvement

---

## 2. Data Model

### 2.1 Core Entities

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Instruction   │──1:N─│ InstructionTask  │──1:N─│  FileChange     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
    Voice/Text              Planned Task              Actual Change
    + AI Reasoning          (create/update)           (diff/snapshot)
```

### 2.2 FileChange Table

| Column | Type | Description |
|--------|------|-------------|
| `Id` | TEXT (UUID) | Primary key |
| `InstructionTaskId` | TEXT (UUID) | FK → InstructionTask |
| `FileId` | TEXT (UUID) | FK → File (nullable for created files) |
| `FilePath` | TEXT | Path at time of change |
| `ChangeType` | TEXT | `created`, `updated`, `deleted`, `renamed` |
| `BeforeHash` | TEXT | SHA-256 before change (null for create) |
| `AfterHash` | TEXT | SHA-256 after change (null for delete) |
| `DiffContent` | TEXT | Unified diff format (nullable) |
| `BeforeSnapshot` | TEXT | Full content before (for small files) |
| `AfterSnapshot` | TEXT | Full content after (for small files) |
| `BytesBefore` | INTEGER | File size before |
| `BytesAfter` | INTEGER | File size after |
| `CreatedAt` | TEXT | ISO8601 timestamp |

### 2.3 InstructionRollback Table

| Column | Type | Description |
|--------|------|-------------|
| `Id` | TEXT (UUID) | Primary key |
| `InstructionId` | TEXT (UUID) | FK → Instruction |
| `UserId` | TEXT (UUID) | FK → User who initiated |
| `Status` | TEXT | `pending`, `in_progress`, `completed`, `failed`, `partial` |
| `FilesReverted` | INTEGER | Count of successfully reverted files |
| `FilesSkipped` | INTEGER | Count of skipped (conflict) files |
| `Reason` | TEXT | User-provided reason (optional) |
| `ErrorDetails` | TEXT | JSON array of errors if partial/failed |
| `StartedAt` | TEXT | ISO8601 timestamp |
| `CompletedAt` | TEXT | ISO8601 timestamp |

---

## 3. Change Tracking Logic

### 3.1 Capture Strategy

```
When InstructionTask executes:
  1. Before modification:
     - Capture file hash (BeforeHash)
     - If file < 100KB, capture full content (BeforeSnapshot)
     
  2. After modification:
     - Capture file hash (AfterHash)
     - If file < 100KB, capture full content (AfterSnapshot)
     - Generate unified diff (DiffContent)
     
  3. Create FileChange record linking to InstructionTaskId
```

### 3.2 Snapshot Threshold

```go
const (
    SnapshotSizeThreshold = 100 * 1024  // 100KB
    DiffSizeThreshold     = 500 * 1024  // 500KB - skip diff for large files
)

type ChangeCapture struct {
    CaptureSnapshot bool  // Store full content
    CaptureDiff     bool  // Generate unified diff
}

func DetermineCaptureStrategy(fileSize int64) ChangeCapture {
    return ChangeCapture{
        CaptureSnapshot: fileSize < SnapshotSizeThreshold,
        CaptureDiff:     fileSize < DiffSizeThreshold,
    }
}
```

### 3.3 Change Type Detection

| Scenario | ChangeType |
|----------|------------|
| File didn't exist, now exists | `created` |
| File existed, content changed | `updated` |
| File existed, now doesn't exist | `deleted` |
| File path changed | `renamed` |

---

## 4. History Queries

### 4.1 Get Instruction Impact

```go
type InstructionImpact struct {
    InstructionId   string
    Transcription   string
    ExecutedAt      time.Time
    FilesCreated    int
    FilesUpdated    int
    FilesDeleted    int
    TotalBytesAdded int64
    TotalBytesRemoved int64
    Changes         []FileChange
}

type InstructionHistoryService interface {
    // Get impact summary for an instruction
    GetInstructionImpact(context stdctx.Context, instructionId string) appfault.Result[*InstructionImpact]
    
    // Get all changes for a specific file
    // Note: FileChangeSlice is defined in types.go (created from generic appfault.ResultSlice[FileChange]):
    // type FileChangeSlice = appfault.ResultSlice[FileChange]
    GetFileHistory(context stdctx.Context, fileId string, limit int) FileChangeSlice
    
    // Get changes within time range
    // Note: FileChangeSlice is defined in types.go (created from generic appfault.ResultSlice[FileChange]):
    // type FileChangeSlice = appfault.ResultSlice[FileChange]
    GetChangesByTimeRange(context stdctx.Context, projectId string, from, to time.Time) FileChangeSlice
    
    // Get instruction that last modified a file
    GetLastModifyingInstruction(context stdctx.Context, fileId string) appfault.Result[*Instruction]
}
```

### 4.2 Timeline View Data

```typescript
interface InstructionTimelineEntry {
  InstructionId: string;
  Transcription: string;         // Truncated to 100 chars
  Scope: InstructionScope;
  ExecutedAt: string;            // ISO8601
  Status: 'completed' | 'partial' | 'rolled_back';
  Impact: {
    FilesCreated: number;
    FilesUpdated: number;
    FilesDeleted: number;
    NetBytesChange: number;      // Positive = added, negative = removed
  };
  IsRollbackable: boolean;       // False if subsequent changes conflict
}
```

---

## 5. Rollback System

### 5.1 Rollback Process

```
User initiates rollback for Instruction X:

1. VALIDATION
   - Check instruction exists and has changes
   - For each FileChange:
     - If ChangeType = 'created': Check file still exists with same hash
     - If ChangeType = 'updated': Check current hash matches AfterHash
     - If ChangeType = 'deleted': Check file still doesn't exist
     - If ChangeType = 'renamed': Check both paths status

2. CONFLICT DETECTION
   - If current state doesn't match expected AfterHash:
     → File was modified by subsequent instruction or external edit
     → Mark as conflict, skip or force (user choice)

3. EXECUTION (per FileChange, reverse order)
   - created → Delete file
   - updated → Restore BeforeSnapshot (or apply reverse diff)
   - deleted → Restore BeforeSnapshot
   - renamed → Rename back to original path

4. RECORD
   - Create InstructionRollback record
   - Update Instruction.Status to 'rolled_back'
```

### 5.2 Rollback Modes

```go
type RollbackMode string

const (
    RollbackSafe  RollbackMode = "safe"   // Skip conflicts, partial rollback
    RollbackForce RollbackMode = "force"  // Overwrite conflicts
    RollbackDry   RollbackMode = "dry"    // Preview only, no changes
)

type RollbackRequest struct {
    InstructionId string
    Mode          RollbackMode
    Reason        string  // Optional user note
}

type RollbackResult struct {
    Success       bool
    FilesReverted []string
    FilesSkipped  []FileConflict
    Errors        []RollbackError
}

type FileConflict struct {
    FilePath       string
    ExpectedHash   string  // What we expected (AfterHash from instruction)
    CurrentHash    string  // What's actually there now
    ConflictReason string  // "modified_externally", "modified_by_instruction", etc.
}
```

### 5.3 Cascade Rollback

When rolling back instruction X, check if subsequent instructions depend on X's changes:

```go
type CascadeAnalysis struct {
    DirectChanges      []FileChange  // Changes from instruction X
    DependentChanges   []FileChange  // Changes from later instructions to same files
    RequiresCascade    bool          // True if dependent changes exist
    CascadeInstructions []string     // IDs of instructions that would also need rollback
}

func AnalyzeCascade(context stdctx.Context, instructionId string) appfault.Result[*CascadeAnalysis]
```

---

## 6. API Endpoints

### 6.1 History Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/instructions/{id}/impact` | Get instruction impact summary |
| GET | `/api/v1/instructions/{id}/changes` | Get all file changes from instruction |
| GET | `/api/v1/files/{id}/history` | Get change history for a file |
| GET | `/api/v1/projects/{id}/history/timeline` | Get instruction timeline for project |
| GET | `/api/v1/projects/{id}/history/stats` | Get aggregate change statistics |

### 6.2 Rollback Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/instructions/{id}/rollback/preview` | Dry-run rollback analysis |
| POST | `/api/v1/instructions/{id}/rollback` | Execute rollback |
| GET | `/api/v1/rollbacks/{id}` | Get rollback status |
| GET | `/api/v1/projects/{id}/rollbacks` | List rollbacks for project |

### 6.3 Request/Response Schemas

#### GET `/api/v1/instructions/{id}/impact`

**Response:**
```json
{
  "Success": true,
  "Data": {
    "InstructionId": "uuid",
    "Transcription": "Add a footer component to all frontend pages",
    "Scope": "frontend",
    "ExecutedAt": "2026-01-27T14:30:00Z",
    "Duration": 2.5,
    "Impact": {
      "FilesCreated": 1,
      "FilesUpdated": 3,
      "FilesDeleted": 0,
      "TotalLinesAdded": 45,
      "TotalLinesRemoved": 2,
      "BytesAdded": 1250,
      "BytesRemoved": 48
    },
    "Changes": [
      {
        "Id": "uuid",
        "FilePath": "02-frontend/components/Footer.md",
        "ChangeType": "created",
        "LinesAdded": 28,
        "LinesRemoved": 0
      }
    ],
    "IsRollbackable": true,
    "RollbackConflicts": []
  }
}
```

#### POST `/api/v1/instructions/{id}/rollback`

**Request:**
```json
{
  "Mode": "safe",
  "Reason": "Instruction produced incorrect output"
}
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "RollbackId": "uuid",
    "Status": "completed",
    "FilesReverted": 4,
    "FilesSkipped": 0,
    "RevertedPaths": [
      "02-frontend/components/Footer.md",
      "02-frontend/01-overview.md"
    ],
    "SkippedPaths": [],
    "CompletedAt": "2026-01-27T14:35:00Z"
  }
}
```

---

## 7. Diff Generation

### 7.1 Unified Diff Format

```go
import "github.com/sergi/go-diff/diffmatchpatch"

func GenerateUnifiedDiff(before, after, filePath string) string {
    dmp := diffmatchpatch.New()
    diffs := dmp.DiffMain(before, after, true)
    patches := dmp.PatchMake(before, diffs)
    return dmp.PatchToText(patches)
}
```

### 7.2 Diff Storage Rules

| File Size | Storage Strategy |
|-----------|------------------|
| < 100KB | Full before/after snapshots + diff |
| 100KB - 500KB | Diff only |
| > 500KB | Hashes only (no diff) |

### 7.3 Applying Reverse Diff

```go
func ApplyReverseDiff(currentContent, diff string) appfault.Result[string] {
    dmp := diffmatchpatch.New()
    patches, err := dmp.PatchFromText(diff)
    if err != nil {
        return appfault.FailWrap[string](
            err,
            "failed to parse diff patches",
        )
    }
    
    // Reverse the patches
    reversed := ReversePatch(patches)
    
    result, applied := dmp.PatchApply(reversed, currentContent)
    if !allTrue(applied) {
        return appfault.FailNew[string](
            appfault.ErrDiffApplyFailed,
            "failed to apply reverse diff",
        )
    }

    return appfault.Ok(result)
}
```

---

## 8. Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 5070 | `ErrInstructionNotFound` | Instruction ID doesn't exist |
| 5071 | `ErrNoChangesRecorded` | Instruction has no file changes |
| 5072 | `ErrRollbackConflict` | File modified since instruction |
| 5073 | `ErrRollbackInProgress` | Another rollback already running |
| 5074 | `ErrSnapshotMissing` | Required snapshot not stored (large file) |
| 5075 | `ErrCascadeRequired` | Rollback requires cascading to dependent instructions |
| 5076 | `ErrDiffApplyFailed` | Failed to apply reverse diff |
| 5077 | `ErrFileStateChanged` | File state doesn't match expected |

---

## 9. Retention & Cleanup

### 9.1 Retention Policy

```go
type HistoryRetentionConfig struct {
    MaxAgeInDays         int   // Default: 90 days
    MaxEntriesPerProject int   // Default: 1000
    KeepSnapshotsForDays int   // Default: 30 days (then only keep hashes)
    KeepDiffsForDays     int   // Default: 60 days
}
```

### 9.2 Cleanup Job

```go
// Runs daily via cron
func CleanupOldHistory(context stdctx.Context) error {
    config := GetRetentionConfig()
    
    // 1. Delete snapshots older than threshold
    DeleteOldSnapshots(context, config.KeepSnapshotsForDays)
    
    // 2. Delete diffs older than threshold  
    DeleteOldDiffs(context, config.KeepDiffsForDays)
    
    // 3. Delete change records older than max age
    DeleteOldChanges(context, config.MaxAgeInDays)
    
    // 4. If over max entries, delete oldest
    TrimExcessEntries(context, config.MaxEntriesPerProject)
    
    return nil
}
```

---

## 10. Frontend Integration

### 10.1 History Panel Component

See `02-frontend/06-history-ui.md` for full UI specification.

Key integration points:

```typescript
// Hook for instruction history
function useInstructionHistory(projectId: string) {
  return useQuery({
    queryKey: ['instruction-history', projectId],
    queryFn: () => api.get(`/projects/${projectId}/history/timeline`),
  });
}

// Hook for rollback preview
function useRollbackPreview(instructionId: string) {
  return useMutation({
    mutationFn: () => api.post(`/instructions/${instructionId}/rollback/preview`),
  });
}

// Hook for executing rollback
function useRollback() {
  return useMutation({
    mutationFn: (params: { instructionId: string; mode: RollbackMode; reason?: string }) =>
      api.post(`/instructions/${params.instructionId}/rollback`, params),
  });
}
```

### 10.2 Change Visualization

```typescript
interface FileChangeView {
  FilePath: string;
  ChangeType: 'created' | 'updated' | 'deleted' | 'renamed';
  LinesAdded: number;
  LinesRemoved: number;
  HasDiff: boolean;      // Can show inline diff
  HasSnapshot: boolean;  // Can show full before/after
}

// Diff viewer component receives:
interface DiffViewerProps {
  Before: string | null;
  After: string | null;
  Diff: string | null;
  FilePath: string;
  Language: string;  // For syntax highlighting
}
```

---

## 11. Cross-References

- **Database Schema:** [01-schema.md](../../07-database-design/01-schema.md)
- **Instruction System:** [03-instruction-system.md](./03-instruction-system.md)
- **History UI:** [03-history-ui.md](../07-history-system/03-history-ui.md)
- **AI Integration:** [01-ai-integration.md](./01-ai-integration.md)
