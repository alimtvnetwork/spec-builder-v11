# AI Bridge CLI: Split DB Integration

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

AI Bridge CLI uses the **Split DB Architecture** for persistent storage of chat sessions, RAG memory, file modifications, and operational data. Data is organized hierarchically by **application name → type → entity**, with counters tracked in the root database.

---

## Database Hierarchy

### Structure (4-Layer)

```
data/
├── root.db                                    # Root registry + counters
└── {application-name}/                        # Source application (e.g., "gsearch", "brun")
    ├── ai/                                    # AI category
    │   ├── chat/                              # Chat sessions
    │   │   ├── 01-{session-id}.db
    │   │   ├── 02-{session-id}.db
    │   │   └── ...
    │   ├── prompts/                           # Prompt templates
    │   │   ├── 01-{template-id}.db
    │   │   └── ...
    │   └── embeddings/                        # RAG embeddings
    │       ├── 01-{source-id}.db
    │       └── ...
    ├── files/                                 # File operations category
    │   ├── history/                           # File modification history
    │   │   ├── 01-{file-slug}.db
    │   │   └── ...
    │   ├── snapshots/                         # File snapshots
    │   │   └── 01-{snapshot-id}.db
    │   └── pending/                           # Pending changes
    │       └── 01-{change-id}.db
    ├── rag/                                   # RAG memory category
    │   ├── documents/                         # Ingested documents
    │   │   ├── 01-{doc-id}.db
    │   │   └── ...
    │   └── indexes/                           # Search indexes
    │       └── 01-{index-id}.db
    └── settings/                              # Settings category
        └── config.db                          # Application-specific settings
```

---

## Root Database Schema

### Table: Applications

Tracks all registered source applications:

```sql
CREATE TABLE Applications (
    Id TEXT PRIMARY KEY,
    AppName TEXT UNIQUE NOT NULL,           -- "gsearch", "brun", "nexus-flow"
    DisplayName TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastAccessed DATETIME,
    Status TEXT DEFAULT 'Active'
);

CREATE INDEX IdxApplicationsName ON Applications(AppName);
```

### Table: Counters

Tracks sequential IDs for each type within an application:

```sql
CREATE TABLE Counters (
    Id TEXT PRIMARY KEY,
    ApplicationId TEXT NOT NULL,
    Category TEXT NOT NULL,                  -- "ai", "files", "rag"
    Type TEXT NOT NULL,                      -- "chat", "history", "documents"
    CurrentCount INTEGER DEFAULT 0,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    UNIQUE(ApplicationId, Category, Type)
);

CREATE INDEX IdxCountersApp ON Counters(ApplicationId);
CREATE INDEX IdxCountersType ON Counters(Category, Type);
```

### Table: DbRegistry

Tracks all child databases:

```sql
CREATE TABLE DbRegistry (
    Id TEXT PRIMARY KEY,
    ApplicationId TEXT NOT NULL,
    Category TEXT NOT NULL,
    Type TEXT NOT NULL,
    EntityId TEXT NOT NULL,
    SequenceNum INTEGER NOT NULL,           -- 01, 02, 03...
    Path TEXT NOT NULL,                      -- Relative path to .db file
    DisplayName TEXT,
    SizeBytes INTEGER DEFAULT 0,
    RecordCount INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastAccessed DATETIME,
    Status TEXT DEFAULT 'Active',
    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    UNIQUE(ApplicationId, Category, Type, EntityId)
);

CREATE INDEX IdxRegistryPath ON DbRegistry(Path);
CREATE INDEX IdxRegistrySequence ON DbRegistry(ApplicationId, Category, Type, SequenceNum);
```

---

## Chat Session Database Schema

Each chat session has its own database (`{app}/ai/chat/{seq}-{session-id}.db`):

```sql
-- Session metadata
CREATE TABLE SessionMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    SessionId TEXT UNIQUE NOT NULL,
    Title TEXT,
    ModelCategory TEXT NOT NULL,
    ModelUsed TEXT,
    BackendUsed TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    MessageCount INTEGER DEFAULT 0,
    TotalTokens INTEGER DEFAULT 0,
    Status TEXT DEFAULT 'Active'             -- Active, Archived, Deleted
);

-- Messages
CREATE TABLE Messages (
    Id TEXT PRIMARY KEY,
    SequenceNum INTEGER NOT NULL,           -- 1, 2, 3...
    Role TEXT NOT NULL,                      -- User, Assistant, System
    Content TEXT NOT NULL,
    Tokens INTEGER,
    Model TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Metadata TEXT                            -- JSON: tool calls, attachments, etc.
);

CREATE INDEX IdxMessagesSequence ON Messages(SequenceNum);

-- Attachments (files, images)
CREATE TABLE Attachments (
    Id TEXT PRIMARY KEY,
    MessageId TEXT NOT NULL,
    Type TEXT NOT NULL,                      -- File, Image, Audio, Video
    Name TEXT NOT NULL,
    Path TEXT,                               -- Local path
    MimeType TEXT,
    SizeBytes INTEGER,
    Content TEXT,                            -- For small text files
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MessageId) REFERENCES Messages(Id)
);

-- Tool calls (agentic mode)
CREATE TABLE ToolCalls (
    Id TEXT PRIMARY KEY,
    MessageId TEXT NOT NULL,
    ToolName TEXT NOT NULL,
    Arguments TEXT,                          -- JSON
    Result TEXT,                             -- JSON
    Status TEXT NOT NULL,                    -- Pending, Success, Error
    StartedAt DATETIME,
    CompletedAt DATETIME,
    FOREIGN KEY (MessageId) REFERENCES Messages(Id)
);
```

---

## RAG Memory Database Schema

Each document source has its own database (`{app}/rag/documents/{seq}-{doc-id}.db`):

```sql
-- Document metadata
CREATE TABLE DocumentMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    DocId TEXT UNIQUE NOT NULL,
    SourcePath TEXT,
    SourceType TEXT NOT NULL,               -- File, Url, Text
    Title TEXT,
    MimeType TEXT,
    SizeBytes INTEGER,
    ChunkCount INTEGER DEFAULT 0,
    EmbeddingModel TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT DEFAULT 'Active'
);

-- Document chunks with embeddings
CREATE TABLE Chunks (
    Id TEXT PRIMARY KEY,
    SequenceNum INTEGER NOT NULL,
    Content TEXT NOT NULL,
    Embedding BLOB,                          -- Vector embedding
    TokenCount INTEGER,
    Metadata TEXT,                           -- JSON: page, section, etc.
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxChunksSequence ON Chunks(SequenceNum);

-- Chunk relationships (for hierarchical docs)
CREATE TABLE ChunkRelations (
    Id TEXT PRIMARY KEY,
    ParentChunkId TEXT,
    ChildChunkId TEXT NOT NULL,
    RelationType TEXT NOT NULL,             -- Parent, Sibling, Reference
    FOREIGN KEY (ParentChunkId) REFERENCES Chunks(Id),
    FOREIGN KEY (ChildChunkId) REFERENCES Chunks(Id)
);
```

---

## File History Database Schema

Each file has its own history database (`{app}/files/history/{seq}-{file-slug}.db`):

```sql
-- File metadata
CREATE TABLE FileMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    FilePath TEXT UNIQUE NOT NULL,
    FileName TEXT NOT NULL,
    FileSlug TEXT NOT NULL,
    MimeType TEXT,
    CurrentVersion INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Version history
CREATE TABLE Versions (
    Id TEXT PRIMARY KEY,
    VersionNum INTEGER NOT NULL,
    Content TEXT NOT NULL,
    ContentHash TEXT NOT NULL,
    DiffFromPrevious TEXT,                 -- Unified diff
    SizeBytes INTEGER,
    ChangedBy TEXT,                         -- User, Ai, System
    ChangeReason TEXT,
    ModelUsed TEXT,                         -- If AI-generated
    PromptUsed TEXT,                        -- If AI-generated
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxVersionsNum ON Versions(VersionNum);

-- Snapshots (named checkpoints)
CREATE TABLE Snapshots (
    Id TEXT PRIMARY KEY,
    VersionId TEXT NOT NULL,
    Name TEXT NOT NULL,
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (VersionId) REFERENCES Versions(Id)
);
```

---

## Go Implementation

### DbManager for AI Bridge CLI

```go
package splitdb

import (
    "fmt"
    "log/slog"
    "time"
    
    "gorm.io/gorm"
)

type AiBridgeDbManager struct {
    *DbManager
    logger *slog.Logger
}

// NewAiBridgeDbManager creates a DB manager for AI Bridge CLI
func NewAiBridgeDbManager(dataDir string, logger *slog.Logger) appfault.Result[*AiBridgeDbManager] {
    baseResult := NewDbManager(dataDir)
    if baseResult.HasError() {
        return appfault.Fail[*AiBridgeDbManager](baseResult.Error())
    }
    
    return appfault.Ok(&AiBridgeDbManager{
        DbManager: baseResult.Value(),
        logger:    logger,
    })
}

// ChatSessionResult holds the result of creating/getting a chat session
type ChatSessionResult struct {
    DB     *gorm.DB
    Path   string
}

// GetOrCreateChatSession returns a chat session database
func (m *AiBridgeDbManager) GetOrCreateChatSession(
    appName string, 
    sessionId string,
) appfault.Result[ChatSessionResult] {
    m.logger.Info("getting chat session",
        slog.String("app", appName),
        slog.String("session", sessionId),
    )
    
    // Get next sequence number if new
    seq, isNew, err := m.getOrAllocateSequence(appName, "ai", "chat", sessionId)
    if err != nil {
        m.logger.Error("failed to allocate sequence",
            slog.String("error", err.Error()),
        )
        return appfault.FailWrap[ChatSessionResult](err, 9623, "sequence allocation failed")
    }
    
    // Build path: {app}/ai/chat/{seq}-{session-id}.db
    dbPath := fmt.Sprintf("%s/ai/chat/%02d-%s.db", appName, seq, sessionId)
    
    db, err := m.GetOrCreateDb(appName, "ai/chat", fmt.Sprintf("%02d-%s", seq, sessionId))
    if err != nil {
        return appfault.FailWrap[ChatSessionResult](err, 9621, "db creation failed")
    }
    
    if isNew {
        m.logger.Info("created new chat session",
            slog.String("path", dbPath),
            slog.Int("sequence", seq),
        )
        err = m.initChatSchema(db, sessionId)
        if err != nil {
            return appfault.FailWrap[ChatSessionResult](err, 9622, "schema init failed")
        }
    }
    
    return appfault.Ok(ChatSessionResult{Db: db, Path: dbPath})
}

// RagDocumentResult holds the result of creating/getting a RAG document
type RagDocumentResult struct {
    Db   *gorm.DB
    Path string
}

// GetOrCreateRagDocument returns a RAG document database
func (m *AiBridgeDbManager) GetOrCreateRagDocument(
    appName string,
    docId string,
) appfault.Result[RagDocumentResult] {
    m.logger.Info("getting RAG document",
        slog.String("app", appName),
        slog.String("doc", docId),
    )
    
    seq, isNew, err := m.getOrAllocateSequence(appName, "rag", "documents", docId)
    if err != nil {
        return appfault.FailWrap[RagDocumentResult](err, 9623, "sequence allocation failed")
    }
    
    dbPath := fmt.Sprintf("%s/rag/documents/%02d-%s.db", appName, seq, docId)
    
    db, err := m.GetOrCreateDb(appName, "rag/documents", fmt.Sprintf("%02d-%s", seq, docId))
    if err != nil {
        return appfault.FailWrap[RagDocumentResult](err, 9621, "db creation failed")
    }
    
    if isNew {
        m.logger.Info("created new RAG document",
            slog.String("path", dbPath),
            slog.Int("sequence", seq),
        )
        err = m.initRagSchema(db, docId)
        if err != nil {
            return appfault.FailWrap[RagDocumentResult](err, 9622, "schema init failed")
        }
    }
    
    return appfault.Ok(RagDocumentResult{Db: db, Path: dbPath})
}

// FileHistoryResult holds the result of creating/getting a file history
type FileHistoryResult struct {
    Db   *gorm.DB
    Path string
}

// GetOrCreateFileHistory returns a file history database
func (m *AiBridgeDbManager) GetOrCreateFileHistory(
    appName string,
    filePath string,
) appfault.Result[FileHistoryResult] {
    fileSlug := slugify(filePath)
    
    m.logger.Info("getting file history",
        slog.String("app", appName),
        slog.String("file", filePath),
        slog.String("slug", fileSlug),
    )
    
    seqResult := m.getOrAllocateSequence(appName, "files", "history", fileSlug)
    if seqResult.IsErr() {
        return appfault.Fail[FileHistoryResult](seqResult.Err())
    }

    seq := seqResult.Value()
    dbPath := fmt.Sprintf("%s/files/history/%02d-%s.db", appName, seq.SequenceNum, fileSlug)
    
    dbResult := m.GetOrCreateDb(appName, "files/history", fmt.Sprintf("%02d-%s", seq.SequenceNum, fileSlug))
    if dbResult.IsErr() {
        return appfault.Fail[FileHistoryResult](dbResult.Err())
    }

    db := dbResult.Value()
    
    if seq.IsNew {
        m.logger.Info("created new file history",
            slog.String("path", dbPath),
            slog.Int("sequence", seq.SequenceNum),
        )
        if schemaErr := m.initFileHistorySchema(db, filePath, fileSlug); schemaErr != nil {
            return appfault.Fail[FileHistoryResult](schemaErr)
        }
    }
    
    return appfault.Ok(FileHistoryResult{Db: db, Path: dbPath})
}

// SequenceAllocation holds the result of sequence allocation
type SequenceAllocation struct {
    SequenceNum int
    IsNew       bool
}

// getOrAllocateSequence gets existing sequence or allocates new one
func (m *AiBridgeDbManager) getOrAllocateSequence(
    appName, category, dbType string,
) appfault.Result[SequenceAllocation] {
    // Note: entityId removed — callers pass via category/dbType composite key
    // Check if entity already has a sequence via GORM
    var registry DbRegistryEntry
    result := m.rootDb.Where(
        "ApplicationId = (SELECT Id FROM Applications WHERE AppName = ?) AND Category = ? AND Type = ?",
        appName, category, dbType,
    ).First(&registry)
    
    if result.Error == nil {
        return appfault.Ok(SequenceAllocation{SequenceNum: registry.SequenceNum, IsNew: false})
    }
    
    // Allocate new sequence via GORM
    var counter Counter
    result = m.rootDb.Where(
        "ApplicationId = (SELECT Id FROM Applications WHERE AppName = ?) AND Category = ? AND Type = ?",
        appName, category, dbType,
    ).First(&counter)
    
    currentCount := 0
    if result.Error == nil {
        currentCount = counter.CurrentCount
    }
    
    newSeq := currentCount + 1
    
    // Upsert counter via GORM
    m.rootDb.Save(&Counter{
        Id:            generateId(),
        ApplicationId: appName,
        Category:      category,
        Type:          dbType,
        CurrentCount:  newSeq,
        UpdatedAt:     time.Now(),
    })
    
    return appfault.Ok(SequenceAllocation{SequenceNum: newSeq, IsNew: true})
}

// ChatSessionInfo holds metadata about a chat session
type ChatSessionInfo struct {
    SequenceNum  int
    SessionId    string
    DisplayName  string
    CreatedAt    time.Time
    MessageCount int
}

// ListChatSessions lists all chat sessions for an application
func (m *AiBridgeDbManager) ListChatSessions(appName string) ChatSessionInfoSlice {
    var registries []DbRegistryEntry
    result := m.rootDb.
        Joins("JOIN Applications ON DbRegistry.ApplicationId = Applications.Id").
        Where("Applications.AppName = ? AND DbRegistry.Category = ? AND DbRegistry.Type = ?", appName, "ai", "chat").
        Order("DbRegistry.SequenceNum DESC").
        Find(&registries)
    
    if result.Error != nil {
        return appfault.FailWrap[[]ChatSessionInfo](
            result.Error,
            ErrDbListSessionsFailed,
            "failed to list chat sessions",
        )
    }
    
    sessions := make([]ChatSessionInfo, len(registries))
    for i, r := range registries {
        sessions[i] = ChatSessionInfo{
            SequenceNum:  r.SequenceNum,
            SessionId:    r.EntityId,
            DisplayName:  r.DisplayName,
            CreatedAt:    r.CreatedAt,
            MessageCount: r.RecordCount,
        }
    }
    
    return appfault.OkSlice(sessions)
}

// DbRegistryEntry is the GORM model for the DbRegistry table
type DbRegistryEntry struct {
    Id            string    `gorm:"column:Id;primaryKey"`
    ApplicationId string    `gorm:"column:ApplicationId"`
    Category      string    `gorm:"column:Category"`
    Type          string    `gorm:"column:Type"`
    EntityId      string    `gorm:"column:EntityId"`
    SequenceNum   int       `gorm:"column:SequenceNum"`
    Path          string    `gorm:"column:Path"`
    DisplayName   string    `gorm:"column:DisplayName"`
    SizeBytes     int64     `gorm:"column:SizeBytes"`
    RecordCount   int       `gorm:"column:RecordCount"`
    CreatedAt     time.Time `gorm:"column:CreatedAt"`
    UpdatedAt     time.Time `gorm:"column:UpdatedAt"`
    LastAccessed  time.Time `gorm:"column:LastAccessed"`
    Status        string    `gorm:"column:Status"`
}

func (DbRegistryEntry) TableName() string { return "DbRegistry" }

// Counter is the GORM model for the Counters table
type Counter struct {
    Id            string    `gorm:"column:Id;primaryKey"`
    ApplicationId string    `gorm:"column:ApplicationId"`
    Category      string    `gorm:"column:Category"`
    Type          string    `gorm:"column:Type"`
    CurrentCount  int       `gorm:"column:CurrentCount"`
    UpdatedAt     time.Time `gorm:"column:UpdatedAt"`
}

func (Counter) TableName() string { return "Counters" }
```

---

## API Endpoints

### Chat Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/sessions` | Create new chat session |
| GET | `/api/v1/chat/sessions` | List chat sessions |
| GET | `/api/v1/chat/sessions/:id` | Get session details |
| POST | `/api/v1/chat/sessions/:id/messages` | Send message |
| GET | `/api/v1/chat/sessions/:id/messages` | Get messages |
| DELETE | `/api/v1/chat/sessions/:id` | Delete session |

### RAG Memory

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rag/documents` | Ingest document |
| GET | `/api/v1/rag/documents` | List documents |
| POST | `/api/v1/rag/search` | Search RAG memory |
| DELETE | `/api/v1/rag/documents/:id` | Remove document |

### File History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/files/:path/history` | Get file history |
| GET | `/api/v1/files/:path/versions/:num` | Get specific version |
| POST | `/api/v1/files/:path/revert/:num` | Revert to version |
| POST | `/api/v1/files/:path/snapshots` | Create snapshot |

---

## Import/Export

### Export Application Data

```bash
curl -X POST http://localhost:8089/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{"AppName": "gsearch", "Format": "zip"}' \
  --output gsearch-backup.zip
```

### Import Application Data

```bash
curl -X POST http://localhost:8089/api/v1/import \
  -F "file=@gsearch-backup.zip" \
  -F "AppName=gsearch"
```

---

## Logging

All database operations use structured JSON logging via Go's `slog`:

```go
m.logger.Info("database operation",
    slog.String("Op", "Create"),
    slog.String("App", appName),
    slog.String("Category", category),
    slog.String("Type", dbType),
    slog.String("Entity", entityId),
    slog.Int("Sequence", seq),
    slog.String("Path", dbPath),
    slog.Duration("Duration", time.Since(start)),
)
```

---

## See Also

- [Split DB Architecture](../../05-split-db-architecture/00-overview.md) — Core architecture
- [Model Management](./07-model-management.md) — Model configuration
- [API Interface](./04-api-interface.md) — Full API documentation
