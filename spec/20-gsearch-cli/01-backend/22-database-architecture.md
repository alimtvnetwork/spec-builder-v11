# GSearch CLI: Complete Database Architecture

**Version:** 3.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## CRITICAL: Naming Convention

**All field names use PascalCase. No underscores allowed.**

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `keyword_hash` | `KeywordHash` |
| `created_at` | `CreatedAt` |
| `result_count` | `ResultCount` |

See: `.lovable/memories/training/09-database-naming-conventions.md`

---

## Overview

This document defines the **complete database architecture** for GSearch CLI using the Split DB pattern:

- **Root DB**: Global settings, counters, database registry
- **Search DB**: Search metadata and history
- **Cache DBs**: Individual search result databases

---

## Database Hierarchy

```
data/
├── gsearch.db                                     # ROOT DB (Setting DB)
│
└── searches/                                      # Search data folder
    │
    ├── search.db                                  # Search history metadata (App DB)
    │
    └── cache/
        ├── 001-ai-tools-abc123.db                 # Cache DB: "AI tools 2026"
        ├── 002-golang-patterns-def456.db          # Cache DB: "golang patterns"
        └── 003-react-hooks-ghi789.db              # Cache DB: "react hooks"
```

---

## 1. Root Database: `data/gsearch.db`

The **Setting DB** contains global configuration and registry of all child databases.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: Settings (global configuration)
-- ============================================
CREATE TABLE Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    ValueType TEXT DEFAULT 'string',               -- string, int, float, bool, json
    Source TEXT DEFAULT 'seed',                    -- seed, user, runtime
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings (from config.seed.json)
INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
('Cache.TtlDays', '5', 'int', 'seed', 'Search cache TTL in days'),
('Cache.MaxEntries', '500', 'int', 'seed', 'Max cached entries'),
('Search.DefaultEngine', 'google', 'string', 'seed', 'Default search engine'),
('Search.MaxResults', '10', 'int', 'seed', 'Default max results'),
('Reset.ConfirmationTtlMinutes', '5', 'int', 'seed', 'Reset confirmation window');


-- ============================================
-- Table: Counters (sequence counters)
-- ============================================
CREATE TABLE Counters (
    Id TEXT PRIMARY KEY,
    Category TEXT NOT NULL,                        -- "cache", "export"
    CurrentCount INTEGER DEFAULT 0,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Category)
);

INSERT INTO Counters (Id, Category, CurrentCount) VALUES
('cnt_cache', 'cache', 0),
('cnt_export', 'export', 0);


-- ============================================
-- Table: DbRegistry (all child databases)
-- ============================================
CREATE TABLE DbRegistry (
    Id TEXT PRIMARY KEY,
    Category TEXT NOT NULL,                        -- "cache", "export"
    EntityId TEXT NOT NULL,                        -- search-slug
    SequenceNum INTEGER NOT NULL,                  -- 001, 002, 003...
    Path TEXT NOT NULL,                            -- Relative path to .db file
    DisplayName TEXT,
    SizeBytes INTEGER DEFAULT 0,
    RecordCount INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastAccessed DATETIME,
    ExpiresAt DATETIME,                            -- For cache entries with TTL
    Status TEXT DEFAULT 'active',
    UNIQUE(Category, EntityId)
);

CREATE INDEX IdxRegistryPath ON DbRegistry(Path);
CREATE INDEX IdxRegistryExpires ON DbRegistry(ExpiresAt) WHERE ExpiresAt IS NOT NULL;


-- ============================================
-- Table: ResetRequests (2-step confirmation)
-- ============================================
CREATE TABLE ResetRequests (
    Id TEXT PRIMARY KEY,
    Scope TEXT NOT NULL,                           -- "all", "cache", "history"
    RequestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,                   -- +5 minutes
    ConfirmedAt DATETIME,
    Status TEXT DEFAULT 'pending'                  -- pending, confirmed, expired, cancelled
);

CREATE INDEX IdxResetStatus ON ResetRequests(Status, ExpiresAt);
```

---

## 2. Search History Database: `data/searches/search.db`

The **App DB** tracks all search operations and their metadata.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: SearchLog (search history)
-- ============================================
CREATE TABLE SearchLog (
    Id TEXT PRIMARY KEY,
    Query TEXT NOT NULL,                           -- Original search query
    QueryHash TEXT NOT NULL,                       -- SHA256 for lookup
    SearchType TEXT NOT NULL,                      -- "web", "code", "local"
    Engine TEXT NOT NULL,                          -- "google", "bing", "duckduckgo"
    Method TEXT NOT NULL,                          -- "html", "api"
    
    -- Timing
    SearchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    DurationMs INTEGER,
    
    -- Results metadata
    ResultCount INTEGER DEFAULT 0,
    CacheHit BOOLEAN DEFAULT FALSE,
    
    -- Cache info
    CacheDbPath TEXT,                              -- Path to result cache
    CacheExpiresAt DATETIME,                       -- Calculated from TTL
    
    -- Status
    Status TEXT DEFAULT 'completed'                -- pending, completed, failed, expired
);

CREATE INDEX IdxSearchLogHash ON SearchLog(QueryHash);
CREATE INDEX IdxSearchLogTime ON SearchLog(SearchedAt DESC);
CREATE INDEX IdxSearchLogExpires ON SearchLog(CacheExpiresAt);


-- ============================================
-- Table: CacheSettings (per-search config override)
-- ============================================
CREATE TABLE CacheSettings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    InheritedFrom TEXT DEFAULT 'root',             -- "root" or "local"
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with root settings reference
INSERT INTO CacheSettings (Key, Value, InheritedFrom) VALUES
('TtlDays', '5', 'root'),
('MaxEntries', '500', 'root'),
('CleanupOnStartup', 'true', 'root');
```

---

## 3. Cache Database: `data/searches/cache/{seq}-{slug}.db`

Each search query has its **own Cache DB** containing full results.

### Naming Convention

```
Query: "Go concurrency patterns"
Hash:  abc123def456
Slug:  go-concurrency-patterns
Seq:   002

Path: data/searches/cache/002-go-concurrency-patterns-abc123.db
```

### Schema (PascalCase)

```sql
-- ============================================
-- Table: CacheMeta (cache metadata - singleton)
-- ============================================
CREATE TABLE CacheMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    Query TEXT NOT NULL,                           -- Original query
    QueryHash TEXT NOT NULL,                       -- SHA256
    SearchType TEXT NOT NULL,                      -- "web", "code"
    Engine TEXT NOT NULL,                          -- "google", "bing"
    
    -- Timing
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    LastAccessed DATETIME,
    AccessCount INTEGER DEFAULT 1,
    
    -- Results summary
    TotalResults INTEGER DEFAULT 0,
    SearchDurationMs INTEGER,
    
    -- Status
    Status TEXT DEFAULT 'active'                   -- active, expired, invalid
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
    Source TEXT,                                   -- "google", "github", etc.
    Score REAL,                                    -- Relevance score
    Metadata TEXT,                                 -- JSON: additional fields
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxResultsRank ON Results(Rank);


-- ============================================
-- Table: Embeddings (optional: for RAG export)
-- ============================================
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

---

## 4. Reset API (2-Step Confirmation)

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2-STEP RESET CONFIRMATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STEP 1: Request Reset                                                      │
│   ─────────────────────                                                      │
│   POST /api/v1/reset/request                                                │
│   Body: { "Scope": "cache" }                                                │
│                                                                              │
│   Response:                                                                  │
│   {                                                                          │
│     "ResetId": "rst_abc123",                                                │
│     "Scope": "cache",                                                        │
│     "ExpiresAt": "2026-02-02T10:35:00Z",                                    │
│     "Message": "Confirm within 5 minutes"                                   │
│   }                                                                          │
│                                                                              │
│   STEP 2: Confirm Reset                                                      │
│   ─────────────────────                                                      │
│   POST /api/v1/reset/confirm                                                │
│   Body: { "ResetId": "rst_abc123" }                                         │
│                                                                              │
│   Response:                                                                  │
│   {                                                                          │
│     "Status": "completed",                                                   │
│     "DeletedDatabases": 15,                                                 │
│     "FreedBytes": 52428800                                                  │
│   }                                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reset Scopes

| Scope | Description | Databases Affected |
|-------|-------------|--------------------|
| `all` | Full system reset | All in `data/` |
| `cache` | Cache only | `searches/cache/*.db` |
| `history` | Search history | `searches/search.db` |

### API Endpoints

```
POST /api/v1/reset/request
  Body: { "Scope": "cache" | "history" | "all" }
  Returns: { "ResetId", "Scope", "ExpiresAt" }

POST /api/v1/reset/confirm
  Body: { "ResetId": "rst_abc123" }
  Returns: { "Status", "DeletedDatabases", "FreedBytes" }

POST /api/v1/reset/cancel
  Body: { "ResetId": "rst_abc123" }
  Returns: { "Status": "cancelled" }
```

---

## 5. Import/Export API

### Export (SQLite Bundle)

```
POST /api/v1/export
  Body: { "Type": "cache" | "history" | "all" }
  Returns: Binary .db file download
```

### Import

```
POST /api/v1/import
  Body: multipart/form-data with .db file
  Returns: { "Imported": true, "RecordCount": 150 }
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `spec/06-split-db-architecture/00-overview.md` |
| CLI Examples | `spec/06-split-db-architecture/01-cli-examples.md` |
| Naming Conventions | `.lovable/memories/training/09-database-naming-conventions.md` |
| Original Schema | `./03-database-schema.md` |
