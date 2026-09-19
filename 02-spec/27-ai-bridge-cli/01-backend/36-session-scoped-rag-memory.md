# Session-Scoped RAG Memory Architecture

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Status:** Draft  
> **Related:** `11-rag-reindexing.md`, `26-database-paths-reference.md`, `08-split-db-integration.md`

---

## 1. Overview

RAG (Retrieval-Augmented Generation) memory operates at the **session scope**, not globally. Each codebase, chat session, or content generation context maintains its own isolated RAG memory that exists for the duration of the session.

---

## 2. Core Principles

### 2.1 Session Isolation

| Principle | Description |
|-----------|-------------|
| **Scoped Storage** | RAG chunks stored per-session, not shared globally |
| **Session Lifecycle** | Memory created on session start, optionally cleared on close |
| **Codebase = Session** | Each codebase context is a session boundary |
| **Minimal Persistence** | Core project context persists; session-specific expansions are ephemeral |

### 2.2 Memory Tiers

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Core Memory (Persistent)                            │
│ - Project configuration                                     │
│ - Base codebase index (initial scan)                        │
│ - Training data (company profile, styles)                   │
│ - User preferences and settings                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Session Memory (Ephemeral)                          │
│ - Conversation context chunks                               │
│ - Dynamic code expansions                                   │
│ - Real-time RAG enhancements                                │
│ - Feedback-driven refinements                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Session Lifecycle

### 3.1 Session Start

When a session begins (codebase opened, chat started, content generation initiated):

```go
type SessionStartConfig struct {
    AppName     string
    Company     string
    Module      string   // 'Code', 'Chat', 'Blog', 'Faq', 'Paragraph'
    SessionId   string
    LoadRag     bool     // Whether to load RAG on start
}

func StartSession(config SessionStartConfig) appfault.Result[Session] {
    session := &Session{
        Id:        config.SessionId,
        Module:    config.Module,
        StartedAt: time.Now(),
        RagLoaded: false,
    }
    
    if config.LoadRag {
        // CRITICAL: Load RAG memories FIRST before AI interaction
        loadErr := session.LoadCoreMemory(config.AppName, config.Company)
        if loadErr != nil {
            return appfault.FailWrap[Session](
                loadErr,
                ErrRagMemoryLoadFailed,
                "failed to load RAG for session %s", config.SessionId,
            )
        }

        session.RagLoaded = true
    }
    
    return appfault.Ok(*session)
}
```

### 3.2 RAG Loading Order

**IMPORTANT:** Model MUST read RAG memories first before processing any prompts.

```
1. Load Core Memory (Tier 1)
   ├── Project config from Root DB
   ├── Company profile from SEO Company DB
   ├── Training chunks if available
   └── Base codebase index (for Code sessions)

2. Load Session Memory (Tier 2) if continuing
   ├── Previous conversation chunks
   ├── Any persisted expansions
   └── Pending feedback context

3. Ready for AI Interaction
```

### 3.3 Session Close

When session ends:

```go
// Package sessioncloseactiontype defines the SessionCloseActionType enum.
// Location: internal/enum/sessioncloseactiontype/sessioncloseactiontype.go
package sessioncloseactiontype

type Type byte

const (
    KeepAll  Type = iota // Persist everything
    KeepCore             // Keep Tier 1, clear Tier 2
    ClearAll             // Clear all session RAG
)

var variantLabels = map[Type]string{
    KeepAll:  "KeepAll",
    KeepCore: "KeepCore",
    ClearAll: "ClearAll",
}

func (t Type) String() string {
    if label, ok := variantLabels[t]; ok {
        return label
    }
    return "Unknown"
}

func (t Type) Label() string {
    return t.String()
}

func Values() []Type {
    vals := make([]Type, 0, len(variantLabels))
    for v := range variantLabels {
        vals = append(vals, v)
    }
    return vals
}

func Parse(s string) appfault.Result[Type] {
    for k, v := range variantLabels {
        if strings.EqualFold(v, s) {
            return appfault.Ok(k)
        }
    }
    return appfault.FailNew[Type](
        ErrEnumInvalidVariant,
        "invalid SessionCloseActionType: %q",
        s,
    )
}

// EXEMPTED: MarshalJSON implements json.Marshaler stdlib interface — must return ([]byte, error)
func (t Type) MarshalJSON() ([]byte, error) {
    return json.Marshal(t.String())
}

// EXEMPTED: UnmarshalJSON implements json.Unmarshaler stdlib interface — must return error
func (t *Type) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return fmt.Errorf("SessionCloseActionType unmarshal: %w", err)
    }
    parseResult := Parse(s)
    if parseResult.IsErr() {
        return parseResult.Err()
    }
    *t = parseResult.Value()
    return nil
}
```

Usage in session close:

```go
func CloseSession(sessionId string, action sessioncloseactiontype.Type) *appfault.AppError {
    sessionResult := GetSession(sessionId)
    if sessionResult.HasError() {
        return sessionResult.Error()
    }

    session := sessionResult.Value()
    
    switch action {
    case sessioncloseactiontype.KeepAll:
        // Just mark session as closed, keep all RAG
        return session.MarkClosed()
        
    case sessioncloseactiontype.KeepCore:
        // Clear Tier 2 (ephemeral) chunks
        clearErr := session.ClearEphemeralChunks()
        if clearErr != nil {
            return clearErr
        }

        return session.MarkClosed()
        
    case sessioncloseactiontype.ClearAll:
        // WARNING: This removes all session-specific RAG
        clearErr := session.ClearAllChunks()
        if clearErr != nil {
            return clearErr
        }

        return session.MarkClosed()
    }
    
    return nil
}
```

---

## 4. Memory Threshold Management

### 4.1 Size Monitoring

```go
type MemoryThreshold struct {
    WarningSizeBytes   int64   // Default: 50MB
    CriticalSizeBytes  int64   // Default: 100MB
    MaxChunksPerSession int    // Default: 10000
}

type MemoryStatus struct {
    CurrentSizeBytes  int64
    ChunkCount        int
    Status            string  // 'Normal', 'Warning', 'Critical'
    RecommendedAction string
}

func CheckMemoryStatus(sessionId string, thresholds MemoryThreshold) MemoryStatus {
    stats := GetSessionStats(sessionId)
    
    status := MemoryStatus{
        CurrentSizeBytes: stats.TotalSizeBytes,
        ChunkCount:       stats.ChunkCount,
    }
    
    if stats.TotalSizeBytes >= thresholds.CriticalSizeBytes {
        status.Status = "Critical"
        status.RecommendedAction = "Archive or start new session"
    } else if stats.TotalSizeBytes >= thresholds.WarningSizeBytes {
        status.Status = "Warning"
        status.RecommendedAction = "Consider archiving old chunks"
    } else if stats.ChunkCount >= thresholds.MaxChunksPerSession {
        status.Status = "Warning"
        status.RecommendedAction = "Too many chunks, consolidate context"
    } else {
        status.Status = "Normal"
        status.RecommendedAction = ""
    }
    
    return status
}
```

### 4.2 Threshold Warning Response

When threshold exceeded, provide user options:

```json
{
  "MemoryWarning": {
    "Status": "Warning",
    "CurrentSize": "52.3 MB",
    "Threshold": "50 MB",
    "ChunkCount": 8547,
    "Options": [
      {
        "Action": "Archive",
        "Description": "Archive old chunks to cold storage, keep recent context"
      },
      {
        "Action": "NewSession",
        "Description": "Start fresh session with only core memory"
      },
      {
        "Action": "Consolidate",
        "Description": "Merge similar chunks to reduce count"
      },
      {
        "Action": "Continue",
        "Description": "Continue without changes (may impact performance)"
      }
    ]
  }
}
```

### 4.3 Archive Strategy

```go
func ArchiveOldChunks(sessionId string, retainDays int) *appfault.AppError {
    cutoffTime := time.Now().AddDate(0, 0, -retainDays)
    
    // Move old chunks to archive table
    _, err := db.Exec(`
        INSERT INTO ArchivedChunks 
        SELECT *, datetime('now') as ArchivedAt 
        FROM RagChunks 
        WHERE CreatedAt < ? AND IsPinned = 0
    `, cutoffTime)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrRagArchiveFailed,
            "failed to insert archived chunks",
        )
    }
    
    // Delete archived chunks from active table
    _, err = db.Exec(`
        DELETE FROM RagChunks 
        WHERE CreatedAt < ? AND IsPinned = 0
    `, cutoffTime)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrRagArchiveFailed,
            "failed to delete archived chunks from active table",
        )
    }
    
    return nil
}
```

---

## 5. New Session with Minimal Memory

When starting fresh after memory overflow:

```go
type MinimalMemoryConfig struct {
    IncludeProjectConfig    bool  // Always true
    IncludeCompanyProfile   bool  // Recommended true
    IncludeTrainingData     bool  // Optional, can be large
    IncludeBaseCodeIndex    bool  // For Code sessions
    MaxCoreChunks           int   // Limit core memory size
}

func StartFreshSession(config SessionStartConfig, minimal MinimalMemoryConfig) appfault.Result[Session] {
    session := &Session{
        Id:        uuid.New().String(), // New session ID
        Module:    config.Module,
        StartedAt: time.Now(),
        IsFresh:   true,
    }
    
    // Load ONLY minimal core memory
    if minimal.IncludeProjectConfig {
        session.LoadProjectConfig()
    }
    
    if minimal.IncludeCompanyProfile {
        session.LoadCompanyProfile(config.Company)
    }
    
    if minimal.IncludeTrainingData {
        session.LoadTrainingChunks(config.Company, minimal.MaxCoreChunks)
    }
    
    if minimal.IncludeBaseCodeIndex && config.Module == "Code" {
        session.LoadBaseCodeIndex()
    }
    
    return appfault.Ok(*session)
}
```

---

## 6. RAG Chunk Tables

### 6.1 Active Chunks

```sql
CREATE TABLE IF NOT EXISTS RagChunks (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ChunkHash       TEXT UNIQUE NOT NULL,
    Content         TEXT NOT NULL,
    Embedding       BLOB,                   -- Vector embedding
    SourceType      TEXT NOT NULL,          -- 'Code', 'Conversation', 'Training', 'Feedback'
    SourcePath      TEXT,                   -- File path if from code
    Tier            TEXT DEFAULT 'Session', -- 'Core' or 'Session'
    IsPinned        INTEGER DEFAULT 0,      -- Protected from auto-archive
    TokenCount      INTEGER,
    CreatedAt       TEXT DEFAULT (datetime('now')),
    LastAccessedAt  TEXT,
    AccessCount     INTEGER DEFAULT 0,
    Metadata        TEXT                    -- JSON for additional context
);

CREATE INDEX IdxChunksTier ON RagChunks(Tier);
CREATE INDEX IdxChunksSource ON RagChunks(SourceType);
CREATE INDEX IdxChunksCreated ON RagChunks(CreatedAt);
```

### 6.2 Archived Chunks

```sql
CREATE TABLE IF NOT EXISTS ArchivedChunks (
    Id              INTEGER PRIMARY KEY,
    ChunkHash       TEXT NOT NULL,
    Content         TEXT NOT NULL,
    Embedding       BLOB,
    SourceType      TEXT NOT NULL,
    SourcePath      TEXT,
    Tier            TEXT,
    TokenCount      INTEGER,
    OriginalCreatedAt TEXT,
    ArchivedAt      TEXT DEFAULT (datetime('now')),
    ArchiveReason   TEXT                    -- 'Threshold', 'SessionClose', 'Manual'
);

CREATE INDEX IdxArchivedDate ON ArchivedChunks(ArchivedAt);
```

---

## 7. Configuration (Seedable)

Add to `config.seed.json`:

```json
{
  "RagMemory": {
    "ThresholdWarningMb": 50,
    "ThresholdCriticalMb": 100,
    "MaxChunksPerSession": 10000,
    "ArchiveRetainDays": 7,
    "AutoArchiveOnWarning": false,
    "LoadRagOnSessionStart": true,
    "MinimalMemoryDefaults": {
      "IncludeProjectConfig": true,
      "IncludeCompanyProfile": true,
      "IncludeTrainingData": false,
      "IncludeBaseCodeIndex": true,
      "MaxCoreChunks": 500
    },
    "ChunkSettings": {
      "MaxTokensPerChunk": 512,
      "OverlapTokens": 50,
      "EmbeddingModel": "nomic-embed-text"
    }
  }
}
```

---

## 8. Session Close Settings (Per Module)

Each module can have different close behaviors:

```json
{
  "SessionCloseDefaults": {
    "Chat": "KeepCore",
    "Code": "KeepAll",
    "Blog": "KeepCore",
    "Faq": "KeepCore",
    "Paragraph": "ClearAll"
  }
}
```

---

## 9. Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9800 | `ErrRagMemoryLoadFailed` | Failed to load RAG memory on session start |
| 9801 | `ErrRagMemoryThresholdExceeded` | Memory size exceeds critical threshold |
| 9802 | `ErrRagArchiveFailed` | Failed to archive old chunks |
| 9803 | `ErrRagSessionNotFound` | Session ID does not exist |
| 9804 | `ErrRagChunkLimitExceeded` | Too many chunks in session |
| 9805 | `ErrRagFreshSessionFailed` | Failed to start fresh session |

---

## 10. UI Considerations

### 10.1 Memory Status Indicator

Display current memory status in session UI:

```
┌─────────────────────────────────────────┐
│ Memory: 34.2 MB / 50 MB  [████████░░]   │
│ Chunks: 5,847 / 10,000                  │
└─────────────────────────────────────────┘
```

### 10.2 Warning Modal

When threshold exceeded, show modal with options:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Memory Threshold Warning                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session memory has reached 52.3 MB (threshold: 50 MB).     │
│  This may impact AI response quality and performance.        │
│                                                              │
│  What would you like to do?                                  │
│                                                              │
│  ○ Archive old context (recommended)                         │
│  ○ Start fresh session with core memory only                 │
│  ○ Consolidate similar chunks                                │
│  ○ Continue without changes                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Apply]               │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Related Specifications

| Spec | Relationship |
|------|--------------|
| `11-rag-reindexing.md` | Reindexing modes for codebase |
| `26-database-paths-reference.md` | Session DB paths |
| `08-split-db-integration.md` | Split DB architecture |
| `35-unified-revisions-architecture.md` | Revisions update RAG |
| `34-suggestions-system.md` | Suggestions from RAG context |
