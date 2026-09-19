# AI Bridge CLI: Complete Database Architecture

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## CRITICAL: Naming Convention

**All field names use PascalCase. No underscores allowed.**

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `session_id` | `SessionId` |
| `created_at` | `CreatedAt` |
| `message_count` | `MessageCount` |

See: `.ai-memory/memories/training/09-database-naming-conventions.md`

---

## Overview

This document defines the **complete database architecture** for AI Bridge CLI, covering:
- Root database structure
- Application-scoped data
- Search caching with TTL
- Chat session persistence
- RAG document storage
- Conversation history as memory

---

## Database Hierarchy (Complete)

```
data/
├── aibridge.db                                     # ROOT DB - Global settings, app registry
│
└── {appName}/                                      # Per-application data
    │
    ├── search.db                                   # Search metadata (when/what searched)
    │
    ├── rag/
    │   ├── cache/
    │   │   └── search/
    │   │       ├── 001-{search-slug}.db            # Cached search results
    │   │       ├── 002-{search-slug}.db
    │   │       └── ...
    │   │
    │   ├── documents/
    │   │   ├── 001-{doc-id}.db                     # Ingested document chunks
    │   │   ├── 002-{doc-id}.db
    │   │   └── ...
    │   │
    │   └── indexes/
    │       └── 001-{index-id}.db                   # Vector search indexes
    │
    ├── ai/
    │   ├── chat/
    │   │   ├── 001-{session-id}.db                 # Chat session + messages
    │   │   ├── 002-{session-id}.db
    │   │   └── ...
    │   │
    │   └── prompts/
    │       └── 001-{template-id}.db                # Saved prompt templates
    │
    ├── files/
    │   └── history/
    │       └── 001-{file-slug}.db                  # File version history
    │
    └── settings/
        └── config.db                               # App-specific settings
```

---

## 1. Root Database: `data/aibridge.db`

The **root database** contains global configuration, application registry, and sequence counters.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: Settings (global configuration)
-- ============================================
CREATE TABLE Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    ValueType TEXT DEFAULT 'String',               -- ValueType variant: String, Int, Float, Bool, Json
    Source TEXT DEFAULT 'User',                    -- ConfigSource variant: Seed, User, Runtime
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings (from config.seed.json)
INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
('Search.Cache.TtlDays', '5', 'Int', 'Seed', 'Search cache TTL in days'),
('Search.Cache.MaxEntries', '1000', 'Int', 'Seed', 'Max cached search entries per app'),
('Rag.ChunkSize', '2048', 'Int', 'Seed', 'Default RAG chunk size in tokens'),
('Rag.ChunkSizeMin', '256', 'Int', 'Seed', 'Minimum allowed chunk size'),
('Rag.ChunkSizeMax', '8192', 'Int', 'Seed', 'Maximum allowed chunk size'),
('Rag.ChunkOverlap', '100', 'Int', 'Seed', 'RAG chunk overlap in tokens'),
('Rag.ChunkOverlapMin', '0', 'Int', 'Seed', 'Minimum chunk overlap'),
('Rag.ChunkOverlapMax', '512', 'Int', 'Seed', 'Maximum chunk overlap'),
('Rag.EmbeddingModel', 'nomic-embed-text', 'String', 'Seed', 'Default embedding model'),
('Rag.ContextTokenBudget', '4096', 'Int', 'Seed', 'Max tokens for RAG context injection'),
('Chat.ConversationLimit', '10', 'Int', 'Seed', 'Default messages per page in chat history'),
('Chat.DefaultPageSize', '10', 'Int', 'Seed', 'Default page size for paginated API responses'),
('Chat.MaxPageSize', '100', 'Int', 'Seed', 'Maximum allowed page size');


-- ============================================
-- Table: Applications (app registry)
-- ============================================
CREATE TABLE Applications (
    Id TEXT PRIMARY KEY,
    AppName TEXT UNIQUE NOT NULL,                  -- "gsearch", "brun", "my-project"
    DisplayName TEXT NOT NULL,
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastAccessed DATETIME,
    Status TEXT DEFAULT 'Active'                   -- AppStatus variant: Active, Archived, Deleted
);

CREATE INDEX IdxApplicationsName ON Applications(AppName);
CREATE INDEX IdxApplicationsStatus ON Applications(Status);


-- ============================================
-- Table: Counters (sequence counters per type)
-- ============================================
CREATE TABLE Counters (
    Id TEXT PRIMARY KEY,
    ApplicationId TEXT NOT NULL,
    Category TEXT NOT NULL,                        -- "rag", "ai", "files"
    SubCategory TEXT NOT NULL,                     -- "cache/search", "documents", "chat"
    CurrentCount INTEGER DEFAULT 0,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    UNIQUE(ApplicationId, Category, SubCategory)
);

CREATE INDEX IdxCountersApp ON Counters(ApplicationId);


-- ============================================
-- Table: DbRegistry (all child databases)
-- ============================================
CREATE TABLE DbRegistry (
    Id TEXT PRIMARY KEY,
    ApplicationId TEXT NOT NULL,
    Category TEXT NOT NULL,                        -- "rag", "ai", "files"
    SubCategory TEXT NOT NULL,                     -- "cache/search", "documents", "chat"
    EntityId TEXT NOT NULL,                        -- search-slug, session-id, doc-id
    SequenceNum INTEGER NOT NULL,                  -- 001, 002, 003...
    Path TEXT NOT NULL,                            -- Relative path to .db file
    DisplayName TEXT,
    SizeBytes INTEGER DEFAULT 0,
    RecordCount INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastAccessed DATETIME,
    ExpiresAt DATETIME,                            -- For cache entries with TTL
    Status TEXT DEFAULT 'Active',
    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    UNIQUE(ApplicationId, Category, SubCategory, EntityId)
);

CREATE INDEX IdxRegistryPath ON DbRegistry(Path);
CREATE INDEX IdxRegistryExpires ON DbRegistry(ExpiresAt) WHERE ExpiresAt IS NOT NULL;
CREATE INDEX IdxRegistryLookup ON DbRegistry(ApplicationId, Category, SubCategory, SequenceNum);
```

---

## 2. Search Metadata Database: `data/{appName}/search.db`

Tracks **what searches were performed and when** (not the results themselves).

### Purpose

- Record search history for analytics
- Track when caches were created/updated
- Determine TTL expiration (default: 5 days from seedable config)
- Support cache cleanup operations

### Schema

```sql
-- ============================================
-- Table: SearchLog (search history)
-- ============================================
CREATE TABLE SearchLog (
    Id TEXT PRIMARY KEY,
    Query TEXT NOT NULL,                           -- Original search query
    QueryHash TEXT NOT NULL,                      -- SHA256 for lookup
    SearchType TEXT NOT NULL,                     -- "Web", "Code", "Local"
    SourceTool TEXT NOT NULL,                     -- "GSearchCli", "Internal"
    
    -- Timing
    SearchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    DurationMs INTEGER,
    
    -- Results metadata (not the actual results)
    ResultCount INTEGER DEFAULT 0,
    CacheHit BOOLEAN DEFAULT FALSE,
    
    -- Cache info
    CacheDbPath TEXT,                            -- Path to result cache: rag/cache/search/001-slug.db
    CacheExpiresAt DATETIME,                     -- Calculated from TTL setting
    
    -- Status
    Status TEXT DEFAULT 'Completed'                -- Pending, Completed, Failed, Expired
);

CREATE INDEX IdxSearchLogHash ON SearchLog(QueryHash);
CREATE INDEX IdxSearchLogExpires ON SearchLog(CacheExpiresAt);
CREATE INDEX IdxSearchLogTime ON SearchLog(SearchedAt DESC);


-- ============================================
-- Table: CacheSettings (per-app cache config)
-- ============================================
-- Inherits from root aibridge.db settings, can be overridden per app
CREATE TABLE CacheSettings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    InheritedFrom TEXT DEFAULT 'Root',            -- "Root" or "Local"
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with root settings reference
INSERT INTO CacheSettings (Key, Value, InheritedFrom) VALUES
('TtlDays', '5', 'Root'),
('MaxEntries', '1000', 'Root'),
('CleanupOnStartup', 'true', 'Root');
```

### TTL Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEARCH CACHE TTL FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. CONFIGURATION SOURCE (Priority Order)                                   │
│      a. {app}/search.db → CacheSettings (if overridden)                     │
│      b. data/aibridge.db → Settings.Search.Cache.TtlDays                    │
│      c. config.seed.json → ToolDelegations.WebSearch.CacheTtl               │
│                                                                              │
│   2. DEFAULT VALUE                                                           │
│      └── 5 days (432000 seconds)                                            │
│                                                                              │
│   3. ON SEARCH EXECUTION                                                     │
│      └── CacheExpiresAt = NOW() + TtlDays                                   │
│                                                                              │
│   4. CLEANUP TRIGGERS                                                        │
│      └── On startup: DELETE WHERE CacheExpiresAt < NOW()                    │
│      └── Background: Every 6 hours check expiration                         │
│      └── Manual: POST /api/v1/cache/cleanup                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Search Result Cache: `data/{appName}/rag/cache/search/{seq}-{slug}.db`

Each search query has its **own database** containing full results.

### Schema

```sql
-- ============================================
-- Table: CacheMeta (cache metadata)
-- ============================================
CREATE TABLE CacheMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    Query TEXT NOT NULL,                           -- Original query
    QueryHash TEXT NOT NULL,                      -- SHA256
    SearchType TEXT NOT NULL,                     -- "Web", "Code"
    SourceCli TEXT NOT NULL,                      -- "GSearchCli"
    
    -- Timing
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    LastAccessed DATETIME,
    AccessCount INTEGER DEFAULT 1,
    
    -- Results summary
    TotalResults INTEGER DEFAULT 0,
    SearchDurationMs INTEGER,
    
    -- Status
    Status TEXT DEFAULT 'Active'                   -- Active, Expired, Invalid
);


-- ============================================
-- Table: Results (search results)
-- ============================================
CREATE TABLE Results (
    Id TEXT PRIMARY KEY,
    Rank INTEGER NOT NULL,                         -- 1, 2, 3...
    
    -- Content
    Title TEXT NOT NULL,
    Url TEXT NOT NULL,
    Snippet TEXT,
    
    -- For code search
    Repository TEXT,
    FilePath TEXT,
    Language TEXT,
    CodeSnippet TEXT,
    
    -- Metadata
    Source TEXT,                                   -- "Google", "Github", etc.
    Score REAL,                                    -- Relevance score if provided
    Metadata TEXT,                                 -- JSON: additional typed fields
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxResultsRank ON Results(Rank);


-- ============================================
-- Table: Embeddings (optional: for RAG integration)
-- ============================================
-- When CacheMode = "Rag", results are also embedded
CREATE TABLE Embeddings (
    Id TEXT PRIMARY KEY,
    ResultId TEXT NOT NULL,
    Content TEXT NOT NULL,                         -- Combined title + snippet
    Embedding BLOB,                                -- Vector embedding
    EmbeddingModel TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ResultId) REFERENCES Results(Id)
);

CREATE INDEX IdxEmbeddingsResult ON Embeddings(ResultId);
```

### Example Search Cache Path

```
Query: "Go concurrency patterns"
Hash:  abc123def456
Slug:  go-concurrency-patterns-abc123

Path: data/my-project/rag/cache/search/001-go-concurrency-patterns-abc123.db
```

---

## 4. Chat Session Database: `data/{appName}/ai/chat/{seq}-{session-id}.db`

Each chat session is a **complete conversation** stored in its own database.

**CONFIRMED:** `POST /api/v1/chat/sessions/:id/messages` writes to this database:
- Inserts into `Messages` table
- Inserts into `ToolCalls` table (if agentic mode)
- Updates `SessionMeta` counters

### Schema (PascalCase)

```sql
-- ============================================
-- Table: SessionMeta (session configuration)
-- ============================================
CREATE TABLE SessionMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    SessionId TEXT UNIQUE NOT NULL,                -- e.g., "chat-abc123"
    Title TEXT,                                    -- Human-readable title
    
    -- Model configuration
    ModelCategory TEXT NOT NULL,                   -- ModelCategory variant: Thinking, Coding, Writing
    ModelUsed TEXT,                                -- Actual model name
    BackendUsed TEXT,                              -- BackendType variant: Ollama, LlamaCpp
    
    -- RAG configuration
    RagEnabled BOOLEAN DEFAULT FALSE,
    RagSources TEXT,                               -- JSON: list of doc IDs
    
    -- Stats
    MessageCount INTEGER DEFAULT 0,
    TotalTokens INTEGER DEFAULT 0,
    TotalToolCalls INTEGER DEFAULT 0,
    
    -- Timestamps
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastMessageAt DATETIME,
    
    -- Status
    Status TEXT DEFAULT 'Active'                   -- AppStatus variant: Active, Archived, Deleted
);


-- ============================================
-- Table: Messages (conversation history)
-- ============================================
CREATE TABLE Messages (
    Id TEXT PRIMARY KEY,
    SequenceNum INTEGER NOT NULL,                  -- 1, 2, 3... (order of messages)
    
    -- Role & Content
    Role TEXT NOT NULL,                            -- MessageRole variant: System, User, Assistant
    Content TEXT NOT NULL,
    
    -- Token usage
    Tokens INTEGER,
    
    -- Model used for this specific message (can vary in session)
    Model TEXT,
    
    -- For RAG-enhanced responses
    RagContext TEXT,                               -- JSON: chunks used for this response
    RagChunkIds TEXT,                              -- JSON: list of chunk IDs used
    
    -- Metadata
    Metadata TEXT,                                 -- JSON: typed additional data
    
    -- Timestamps
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CompletedAt DATETIME                           -- For streaming: when finished
);

CREATE INDEX IdxMessagesSequence ON Messages(SequenceNum);
CREATE INDEX IdxMessagesRole ON Messages(Role);


-- ============================================
-- Table: Attachments (files attached to messages)
-- ============================================
CREATE TABLE Attachments (
    Id TEXT PRIMARY KEY,
    MessageId TEXT NOT NULL,
    
    -- Type & Content
    Type TEXT NOT NULL,                            -- "File", "Image", "Audio", "Url"
    Name TEXT NOT NULL,
    MimeType TEXT,
    
    -- Storage
    Path TEXT,                                     -- Local file path if stored
    Url TEXT,                                      -- URL if external
    Content TEXT,                                  -- Inline content for small text
    SizeBytes INTEGER,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MessageId) REFERENCES Messages(Id)
);

CREATE INDEX IdxAttachmentsMessage ON Attachments(MessageId);


-- ============================================
-- Table: ToolCalls (agentic mode tool invocations)
-- ============================================
CREATE TABLE ToolCalls (
    Id TEXT PRIMARY KEY,
    MessageId TEXT NOT NULL,                      -- Associated assistant message
    
    -- Tool info
    ToolName TEXT NOT NULL,                       -- "WebSearch", "FileRead", etc.
    Arguments TEXT,                                -- JSON: tool arguments
    
    -- Result
    Result TEXT,                                   -- JSON: tool response
    ResultType TEXT,                              -- "Success", "Error", "Timeout"
    
    -- Timing
    StartedAt DATETIME,
    CompletedAt DATETIME,
    DurationMs INTEGER,
    
    -- Status
    Status TEXT NOT NULL DEFAULT 'Pending',        -- Pending, Running, Success, Error
    ErrorMessage TEXT,
    
    FOREIGN KEY (MessageId) REFERENCES Messages(Id)
);

CREATE INDEX IdxToolCallsMessage ON ToolCalls(MessageId);
CREATE INDEX IdxToolCallsStatus ON ToolCalls(Status);
```

---

## 5. RAG Document Database: `data/{appName}/rag/documents/{seq}-{doc-id}.db`

Each ingested document (codebase, file, URL) stored with chunks and embeddings.

### Schema

```sql
-- ============================================
-- Table: DocumentMeta
-- ============================================
CREATE TABLE DocumentMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    DocId TEXT UNIQUE NOT NULL,
    
    -- Source
    SourcePath TEXT,                              -- Original file/dir path
    SourceType TEXT NOT NULL,                     -- "File", "Directory", "Url", "Text"
    SourceUrl TEXT,
    
    -- Metadata
    Title TEXT,
    Description TEXT,
    MimeType TEXT,
    SizeBytes INTEGER,
    
    -- Chunking info
    ChunkCount INTEGER DEFAULT 0,
    ChunkSizeUsed INTEGER,                       -- Actual chunk size used
    ChunkOverlapUsed INTEGER,
    
    -- Embedding info
    EmbeddingModel TEXT,
    EmbeddingDimensions INTEGER,                  -- 768 for nomic-embed-text
    
    -- For codebase sources
    Language TEXT,                                 -- Primary language
    FileCount INTEGER,
    LineCount INTEGER,
    
    -- Timestamps
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastIndexedAt DATETIME,
    
    -- Status
    Status TEXT DEFAULT 'Active',                  -- Active, Reindexing, Error
    IndexStatus TEXT                              -- JSON: progress info
);


-- ============================================
-- Table: Chunks (document chunks with embeddings)
-- ============================================
CREATE TABLE Chunks (
    Id TEXT PRIMARY KEY,
    SequenceNum INTEGER NOT NULL,                 -- Order within document
    
    -- Content
    Content TEXT NOT NULL,
    TokenCount INTEGER,
    
    -- Embedding
    Embedding BLOB,                                -- Binary vector (768 floats)
    
    -- Source location
    FilePath TEXT,                                -- For codebase: which file
    StartLine INTEGER,
    EndLine INTEGER,
    
    -- Metadata
    Metadata TEXT,                                 -- JSON: section, heading, etc.
    ChunkType TEXT,                               -- "Code", "Comment", "Doc", "Mixed"
    Language TEXT,                                 -- For code chunks
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxChunksSequence ON Chunks(SequenceNum);
CREATE INDEX IdxChunksFile ON Chunks(FilePath);


-- ============================================
-- Table: FileHashes (for incremental re-indexing)
-- ============================================
CREATE TABLE FileHashes (
    FilePath TEXT PRIMARY KEY,
    ContentHash TEXT NOT NULL,                    -- SHA256 of file content
    ChunkIds TEXT,                                -- JSON: list of chunk IDs from this file
    LastIndexedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Chat API Endpoints with Database Mapping

### Endpoint → Database Table Mapping

| Endpoint | Method | Database | Table(s) Affected |
|----------|--------|----------|-------------------|
| `/api/v1/chat/sessions` | POST | `{app}/ai/chat/{seq}-{id}.db` | Creates new DB + `SessionMeta` |
| `/api/v1/chat/sessions` | GET | `data/aibridge.db` | Reads `DbRegistry` |
| `/api/v1/chat/sessions?appName=X` | GET | `data/aibridge.db` | Reads `DbRegistry` filtered |
| `/api/v1/chat/sessions/:id` | GET | `{app}/ai/chat/{seq}-{id}.db` | Reads `SessionMeta` |
| `/api/v1/chat/sessions/:id/messages` | POST | `{app}/ai/chat/{seq}-{id}.db` | Inserts into `Messages`, `ToolCalls` |
| `/api/v1/chat/sessions/:id/messages` | GET | `{app}/ai/chat/{seq}-{id}.db` | Reads `Messages`, `Attachments` |

### Create Session Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CREATE CHAT SESSION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request: POST /api/v1/chat/sessions                                        │
│   Body: { "AppName": "my-project", "Title": "Architecture Discussion" }     │
│                                                                              │
│   1. LOOKUP APPLICATION                                                      │
│      └── SELECT * FROM Applications WHERE AppName = 'my-project'            │
│      └── If not exists: INSERT INTO Applications (...)                      │
│                                                                              │
│   2. ALLOCATE SEQUENCE NUMBER                                                │
│      └── SELECT CurrentCount FROM Counters                                  │
│          WHERE ApplicationId = X AND Category = 'ai'                        │
│          AND SubCategory = 'chat'                                           │
│      └── NewSeq = CurrentCount + 1                                          │
│      └── UPDATE Counters SET CurrentCount = NewSeq                          │
│                                                                              │
│   3. GENERATE SESSION ID                                                     │
│      └── SessionId = "chat_" + RandomId()                                    │
│      └── DbPath = "my-project/ai/chat/001-chat_abc123.db"                   │
│                                                                              │
│   4. CREATE SESSION DATABASE                                                 │
│      └── Create file: data/my-project/ai/chat/001-chat_abc123.db           │
│      └── Execute schema DDL                                                  │
│      └── INSERT INTO SessionMeta (...)                                      │
│                                                                              │
│   5. REGISTER IN ROOT DB                                                     │
│      └── INSERT INTO DbRegistry (                                           │
│            ApplicationId, Category='ai', SubCategory='chat',                │
│            EntityId='chat_abc123', SequenceNum=1,                           │
│            Path='my-project/ai/chat/001-chat_abc123.db'                     │
│          )                                                                   │
│                                                                              │
│   6. RETURN RESPONSE                                                         │
│      └── { "SessionId": "chat_abc123", "SequenceNum": 1, "Path": "..." }   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Send Message Flow with RAG + Tool Calls

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SEND MESSAGE FLOW (WITH RAG + TOOLS)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request: POST /api/v1/chat/sessions/chat_abc123/messages                  │
│   Body: { "Content": "How does the cache layer work?" }                     │
│                                                                              │
│   1. LOAD SESSION DATABASE                                                   │
│      └── Open: data/my-project/ai/chat/001-chat_abc123.db                  │
│      └── Read SessionMeta for model config                                  │
│                                                                              │
│   2. LOAD CONVERSATION HISTORY                                               │
│      └── SELECT * FROM Messages ORDER BY SequenceNum                        │
│      └── Convert to LLM message format:                                     │
│          [{ "Role": "User", "Content": "..." }, ...]                        │
│                                                                              │
│   3. RAG CONTEXT INJECTION (if RagEnabled)                                  │
│      └── Embed user query                                                    │
│      └── Search: data/my-project/rag/documents/*.db                        │
│          SELECT Content, Embedding FROM Chunks                              │
│          ORDER BY vector_similarity(Embedding, QueryEmbedding) DESC         │
│          LIMIT 5 WHERE Similarity > 0.7                                     │
│      └── Inject top chunks into system prompt                               │
│                                                                              │
│   4. INSERT USER MESSAGE                                                     │
│      └── INSERT INTO Messages (Role='User', Content='...', SequenceNum=N)  │
│                                                                              │
│   5. CALL LLM (with tools if agentic)                                       │
│      └── Model receives: system + history + RagContext + UserMessage        │
│      └── Stream response via WebSocket                                      │
│                                                                              │
│   6. HANDLE TOOL CALLS (if any)                                             │
│      └── LLM requests: { "Tool": "WebSearch", "Args": {...} }              │
│      └── INSERT INTO ToolCalls (Status='Pending')                           │
│      └── Execute: gsearch search --query "..." --output json               │
│      └── UPDATE ToolCalls SET Result='...', Status='Success'               │
│      └── Inject result into context                                         │
│      └── Continue LLM generation                                            │
│                                                                              │
│   7. INSERT ASSISTANT MESSAGE                                                │
│      └── INSERT INTO Messages (Role='Assistant', Content='...',            │
│            RagChunkIds='["chunk_1", "chunk_2"]')                            │
│                                                                              │
│   8. UPDATE SESSION STATS                                                    │
│      └── UPDATE SessionMeta SET MessageCount = MessageCount + 2,           │
│            TotalTokens = TotalTokens + N, LastMessageAt = NOW()            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Reading Conversation History into Memory

### Memory Loading Strategy

When a chat is resumed, the system loads history efficiently:

```go
type ConversationMemory struct {
    SessionId    string
    Messages     []Message        // Full conversation history
    RagContext   []RagChunk       // Relevant chunks from RAG
    SystemPrompt string           // Constructed system prompt
    TokenBudget  int              // Max tokens for context
}

func (m *MemoryManager) LoadConversation(sessionPath string, query string) appfault.Result[*ConversationMemory] {
    // 1. Open session database via GORM
    db, err := gorm.Open(sqlite.Open(sessionPath), &gorm.Config{})
    if err != nil {
        return appfault.FailWrap[*ConversationMemory](err, 9624, "session db open failed")
    }
    
    // 2. Load session config
    var meta SessionMeta
    db.First(&meta, "Id = ?", "singleton")
    
    // 3. Load message history (most recent first for token budget)
    var messages []Message
    db.Order("SequenceNum DESC").Find(&messages)
    
    var selected []Message
    totalTokens := 0
    for _, msg := range messages {
        if totalTokens+msg.Tokens > m.tokenBudget {
            break
        }
        totalTokens += msg.Tokens
        selected = append([]Message{msg}, selected...) // Prepend to maintain order
    }
    
    // 4. Load RAG context if enabled
    var ragChunks []RagChunk
    if meta.RagEnabled {
        ragChunks = m.searchRAG(meta.AppName, query, 5)
    }
    
    // 5. Construct system prompt with RAG
    systemPrompt := m.buildSystemPrompt(meta, ragChunks)
    
    return appfault.Ok(&ConversationMemory{
        SessionId:    meta.SessionId,
        Messages:     selected,
        RagContext:   ragChunks,
        SystemPrompt: systemPrompt,
        TokenBudget:  m.tokenBudget - totalTokens,
    })
}
```

### Token Budget Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TOKEN BUDGET ALLOCATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Total Context Window: 32,768 tokens (qwen2.5-coder:32b)                   │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┐              │
│   │ System Prompt                           │  ~500 tokens   │              │
│   ├──────────────────────────────────────────────────────────┤              │
│   │ RAG Context (top-K chunks)              │  ~2000 tokens  │              │
│   ├──────────────────────────────────────────────────────────┤              │
│   │ Conversation History                    │  ~20000 tokens │              │
│   │ (loaded from newest, oldest truncated)  │                │              │
│   ├──────────────────────────────────────────────────────────┤              │
│   │ Current User Message                    │  ~500 tokens   │              │
│   ├──────────────────────────────────────────────────────────┤              │
│   │ Reserved for Response                   │  ~8000 tokens  │              │
│   └──────────────────────────────────────────────────────────┘              │
│                                                                              │
│   Strategy: Load messages newest-first until budget exhausted               │
│   Truncation: Oldest messages dropped first, keeping recent context         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Search Cache Lifecycle

### Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SEARCH CACHE COMPLETE LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. SEARCH REQUEST                                                          │
│      └── Tool call: { "Tool": "WebSearch", "Query": "Go patterns" }         │
│                                                                              │
│   2. CHECK EXISTING CACHE                                                    │
│      └── Query: data/my-project/search.db                                   │
│          SELECT CacheDbPath FROM SearchLog                                  │
│          WHERE QueryHash = SHA256("Go patterns")                           │
│          AND CacheExpiresAt > NOW()                                        │
│                                                                              │
│   3a. CACHE HIT                                                              │
│      └── Open: data/my-project/rag/cache/search/001-go-patterns-abc.db     │
│      └── SELECT * FROM Results ORDER BY Rank                                │
│      └── Update: AccessCount++, LastAccessed = NOW()                        │
│      └── Return cached results                                              │
│                                                                              │
│   3b. CACHE MISS                                                             │
│      └── Execute: gsearch search --query "Go patterns" --output json        │
│      └── Allocate sequence: 002                                             │
│      └── Create: data/my-project/rag/cache/search/002-go-patterns-def.db   │
│      └── INSERT INTO Results (...)                                          │
│      └── INSERT INTO CacheMeta (ExpiresAt = NOW() + 5 days)                │
│      └── Log in search.db: INSERT INTO SearchLog (...)                     │
│      └── Register in aibridge.db: INSERT INTO DbRegistry (...)             │
│                                                                              │
│   4. CACHE CLEANUP (background)                                              │
│      └── Query: SELECT Path FROM DbRegistry WHERE ExpiresAt < NOW()        │
│      └── Delete expired .db files                                           │
│      └── DELETE FROM DbRegistry WHERE ExpiresAt < NOW()                    │
│      └── UPDATE SearchLog SET Status = 'Expired' WHERE ...                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Configuration Priority (Seedable Config)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION PRIORITY (HIGHEST → LOWEST)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. App-specific override                                                   │
│      └── data/{appName}/settings/config.db → Settings table                │
│      └── data/{appName}/search.db → CacheSettings table                    │
│                                                                              │
│   2. Root database                                                           │
│      └── data/aibridge.db → Settings table                                  │
│                                                                              │
│   3. Seed configuration file                                                 │
│      └── config.seed.json (embedded or external)                            │
│                                                                              │
│   4. Hardcoded defaults                                                      │
│      └── In Go source code                                                   │
│                                                                              │
│   Example: Search.Cache.TtlDays                                            │
│   ├── App override: 7 days (my-project specific)                            │
│   ├── Root setting: 5 days (global)                                         │
│   ├── Seed config: 5 days                                                    │
│   └── Hardcoded: 3 days                                                      │
│   Result: 7 days (app-specific wins)                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. RAG Memory Tiering Tables

### 10.1 Updated RagChunks Schema (Attention & Short-Term)

The `RagChunks` table (defined in `41-memory-classification-flags.md`) gains two new columns:

```sql
ALTER TABLE RagChunks ADD COLUMN IsAttention INTEGER DEFAULT 0;
ALTER TABLE RagChunks ADD COLUMN IsShortTerm INTEGER DEFAULT 0;

CREATE INDEX IdxChunksAttention ON RagChunks(IsAttention);
CREATE INDEX IdxChunksShortTerm ON RagChunks(IsShortTerm);
```

| Column | Type | Purpose |
|--------|------|---------|
| `IsAttention` | `INTEGER DEFAULT 0` | Marks chunks critical to the **current conversation turn**. Highest retrieval priority. Auto-expires after turn completes. |
| `IsShortTerm` | `INTEGER DEFAULT 0` | Marks chunks linked to **recent/related conversation nodes**. Session-scoped. Decays over time. |

### 10.2 ChunkLinks Table (Many-to-Many RAG Node Relationships)

```sql
-- ============================================
-- Table: ChunkLinks (graph edges between RAG nodes)
-- ============================================
CREATE TABLE ChunkLinks (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    SourceChunkId   INTEGER NOT NULL,
    TargetChunkId   INTEGER NOT NULL,
    LinkType        TEXT NOT NULL,                     -- LinkType variant: Related, DependsOn, DerivedFrom
    Strength        REAL DEFAULT 0.5,                  -- 0.0 to 1.0 relevance score
    CreatedAt       TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (SourceChunkId) REFERENCES RagChunks(Id) ON DELETE CASCADE,
    FOREIGN KEY (TargetChunkId) REFERENCES RagChunks(Id) ON DELETE CASCADE,
    UNIQUE(SourceChunkId, TargetChunkId, LinkType)
);

CREATE INDEX IdxChunkLinksSource ON ChunkLinks(SourceChunkId);
CREATE INDEX IdxChunkLinksTarget ON ChunkLinks(TargetChunkId);
CREATE INDEX IdxChunkLinksType ON ChunkLinks(LinkType);
```

### 10.3 ChunkTags Table (One-to-Many Keyword Tagging)

```sql
-- ============================================
-- Table: ChunkTags (keyword/token tags per chunk)
-- ============================================
CREATE TABLE ChunkTags (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ChunkId     INTEGER NOT NULL,
    Tag         TEXT NOT NULL,                         -- keyword/token
    Weight      REAL DEFAULT 1.0,                      -- relevance weight
    CreatedAt   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (ChunkId) REFERENCES RagChunks(Id) ON DELETE CASCADE
);

CREATE INDEX IdxChunkTagsTag ON ChunkTags(Tag);
CREATE INDEX IdxChunkTagsChunk ON ChunkTags(ChunkId);
CREATE INDEX IdxChunkTagsWeight ON ChunkTags(Tag, Weight DESC);
```

### 10.4 Go Structs

```go
type ChunkLink struct {
    Id            int64
    SourceChunkId int64
    TargetChunkId int64
    LinkType      link_type.Variant
    Strength      float64
    CreatedAt     time.Time

    // ORM Relationships
    SourceChunk   *RagChunk `gorm:"foreignKey:SourceChunkId"`
    TargetChunk   *RagChunk `gorm:"foreignKey:TargetChunkId"`
}

type ChunkTag struct {
    Id        int64
    ChunkId   int64
    Tag       string
    Weight    float64
    CreatedAt time.Time

    // ORM Relationship
    Chunk     *RagChunk `gorm:"foreignKey:ChunkId"`
}
```

### 10.5 Updated RagChunk Struct

```go
type RagChunk struct {
    Id             int64
    ChunkHash      string
    Content        string
    Embedding      []byte    `json:",omitempty"`
    SourceType     string
    SourcePath     string    `json:",omitempty"`
    Tier           string
    IsPinned       bool
    IsCritical     bool
    IsImportant    bool
    IsAttention    bool                              // Current-turn focus
    IsShortTerm    bool                              // Session-scoped recent memory
    TokenCount     int       `json:",omitempty"`
    CreatedAt      time.Time
    LastAccessedAt time.Time `json:",omitempty"`
    AccessCount    int
    Metadata       string    `json:",omitempty"`

    // ORM Relationships
    Tags           []ChunkTag  `gorm:"foreignKey:ChunkId"`
    OutgoingLinks  []ChunkLink `gorm:"foreignKey:SourceChunkId"`
    IncomingLinks  []ChunkLink `gorm:"foreignKey:TargetChunkId"`
}
```

---

## 11. Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 9620 | `ErrDbRootNotFound` | data/aibridge.db not found or corrupted |
| 9621 | `ErrDbCreateFailed` | Failed to create child database |
| 9622 | `ErrDbSchemaMismatch` | Schema version mismatch |
| 9623 | `ErrCounterAllocationFailed` | Failed to allocate sequence number |
| 9624 | `ErrSessionNotFound` | Chat session database not found |
| 9625 | `ErrMessageInsertFailed` | Failed to insert message |
| 9626 | `ErrRagSearchFailed` | RAG vector search failed |
| 9627 | `ErrCacheExpired` | Cache entry has expired |
| 9628 | `ErrCacheWriteFailed` | Failed to write to cache |
| 9629 | `ErrCacheCleanupFailed` | Background cleanup failed |
| 9630 | `ErrChunkLinkFailed` | Failed to create/update chunk link |
| 9631 | `ErrChunkTagFailed` | Failed to create/update chunk tag |
| 9632 | `ErrAttentionDecayFailed` | Failed to decay attention flags |
| 9633 | `ErrTagExtractionFailed` | Failed to extract tags from content |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Core | `08-split-db-integration.md` |
| Agentic Mode | `09-agentic-mode.md` |
| RAG Re-indexing | `11-rag-reindexing.md` |
| API Endpoints | `04-api-interface.md` |
| Configuration | `06-configuration.md` |
| Enum Architecture | `53-enum-architecture.md` |
| Memory Classification | `41-memory-classification-flags.md` |
| Memory Retrieval Best Practices | `54-memory-retrieval-best-practices.md` |
