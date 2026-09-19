# AI Bridge CLI: RAG Re-indexing

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

This document specifies the RAG re-indexing endpoint (`POST /rag/reindex`) for codebase re-learning. When a codebase is updated, this endpoint triggers a full or incremental re-index of the RAG memory.

---

## API Endpoint

### POST /api/v1/rag/reindex

Trigger re-indexing of RAG documents for an application.

**Request:**

```json
{
  "appName": "my-project",
  "mode": "incremental",           // "full" | "incremental" | "diff"
  "sourcePath": "/path/to/codebase",
  "options": {
    "chunkSize": 512,
    "chunkOverlap": 50,
    "embeddingModel": "nomic-embed-text",
    "includePatterns": ["**/*.go", "**/*.ts", "**/*.md"],
    "excludePatterns": ["**/node_modules/**", "**/vendor/**", "**/.git/**"],
    "parseComments": true,
    "extractFunctions": true
  },
  "async": true                    // If true, returns job ID immediately
}
```

**Response (async=true):**

```json
{
  "jobId": "reindex_abc123",
  "status": "queued",
  "estimatedDurationMs": 45000,
  "createdAt": "2026-02-02T10:30:00Z"
}
```

**Response (async=false):**

```json
{
  "jobId": "reindex_abc123",
  "status": "completed",
  "stats": {
    "filesScanned": 234,
    "filesIndexed": 198,
    "filesSkipped": 36,
    "chunksCreated": 1523,
    "chunksUpdated": 45,
    "chunksDeleted": 12,
    "embeddingsGenerated": 1568,
    "totalTokens": 156000,
    "durationMs": 42350
  },
  "completedAt": "2026-02-02T10:30:42Z"
}
```

---

## Re-index Modes

### Full Mode

Complete re-index: deletes all existing chunks and re-processes everything.

```json
{ "mode": "full" }
```

**When to use:**
- Major codebase restructuring
- Changing embedding model
- Changing chunk size parameters
- Fixing corrupted index

### Incremental Mode

Only process new and modified files since last index.

```json
{ "mode": "incremental" }
```

**How it works:**
1. Compare file hashes with stored values
2. Skip unchanged files
3. Re-chunk only modified files
4. Update embeddings for changed chunks

### Diff Mode

Git-aware mode: only process files changed since a specific commit.

```json
{
  "mode": "diff",
  "diffOptions": {
    "since": "abc123def",         // Commit hash
    "branch": "main"              // Optional: compare to branch
  }
}
```

---

## Job Status Endpoint

### GET /api/v1/rag/reindex/:jobId

Check status of a re-indexing job.

**Response:**

```json
{
  "jobId": "reindex_abc123",
  "status": "running",            // queued, running, completed, failed, cancelled
  "progress": {
    "phase": "embedding",         // scanning, parsing, chunking, embedding, indexing
    "filesTotal": 234,
    "filesProcessed": 156,
    "chunksTotal": 1523,
    "chunksProcessed": 1012,
    "percentComplete": 66.4
  },
  "stats": {
    "filesScanned": 156,
    "chunksCreated": 1012,
    "embeddingsGenerated": 1012
  },
  "startedAt": "2026-02-02T10:30:00Z",
  "estimatedCompletion": "2026-02-02T10:30:42Z"
}
```

---

## WebSocket Progress Streaming

Subscribe to real-time progress updates:

```javascript
const ws = new WebSocket('ws://localhost:5040/api/v1/ws');

ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'reindex',
  jobId: 'reindex_abc123'
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'reindex.progress':
      // Update progress bar
      updateProgress(data.percentComplete);
      break;
      
    case 'reindex.file.started':
      // Show current file being processed
      showCurrentFile(data.filePath);
      break;
      
    case 'reindex.file.completed':
      // Update file count
      incrementFileCount();
      break;
      
    case 'reindex.completed':
      // Show completion stats
      showCompletionStats(data.stats);
      break;
      
    case 'reindex.failed':
      // Show error
      showError(data.error);
      break;
  }
};
```

### WebSocket Events

| Event | Description | Data |
|-------|-------------|------|
| `reindex.started` | Job started | `{ jobId, mode, totalFiles }` |
| `reindex.progress` | Progress update | `{ jobId, phase, percentComplete, filesProcessed }` |
| `reindex.file.started` | File processing started | `{ filePath, fileNum, totalFiles }` |
| `reindex.file.completed` | File processing done | `{ filePath, chunksCreated }` |
| `reindex.phase.changed` | Phase transition | `{ previousPhase, newPhase }` |
| `reindex.completed` | Job finished | `{ jobId, stats, durationMs }` |
| `reindex.failed` | Job failed | `{ jobId, error, failedAt }` |
| `reindex.cancelled` | Job cancelled | `{ jobId, reason }` |

---

## Cancel Re-index Job

### POST /api/v1/rag/reindex/:jobId/cancel

Cancel a running re-index job.

**Response:**

```json
{
  "jobId": "reindex_abc123",
  "status": "cancelled",
  "cancelledAt": "2026-02-02T10:31:00Z",
  "partialStats": {
    "filesProcessed": 156,
    "chunksCreated": 1012
  }
}
```

---

## Cache Invalidation

When re-indexing completes, the following caches are invalidated:

1. **Vector index cache** - Rebuild in-memory index
2. **Search result cache** - Clear all cached search results
3. **Chunk cache** - Clear any in-memory chunk data
4. **Query cache** - Clear cached query embeddings

```go
func (m *RAGManager) InvalidateCaches(appName string) *appfault.AppError {
    // 1. Clear vector index
    m.vectorIndex.Clear(appName)
    
    // 2. Clear search cache
    _, err := m.cacheDb.Exec(`
        DELETE FROM search_cache 
        WHERE app_name = ?
    `, appName)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrRagCacheInvalidationFailed,
            "failed to clear search cache for app %s",
            appName,
        )
    }
    
    // 3. Clear chunk cache
    m.chunkCache.Purge(appName)
    
    // 4. Clear query embedding cache
    m.queryCache.Purge(appName)
    
    m.logger.Info("caches invalidated", slog.String("app", appName))
    return nil
}
```

---

## CLI Command

```bash
# Full re-index
aibridge rag reindex --app my-project --source /path/to/code --mode full

# Incremental re-index
aibridge rag reindex --app my-project --source /path/to/code --mode incremental

# Git diff mode
aibridge rag reindex --app my-project --source /path/to/code --mode diff --since abc123

# With custom options
aibridge rag reindex --app my-project \
  --source /path/to/code \
  --mode full \
  --chunk-size 1024 \
  --include "**/*.go" \
  --exclude "**/test/**" \
  --output json
```

---

## Database Schema

### Jobs Table

```sql
-- Table: ReindexJobs (in root.db)
CREATE TABLE ReindexJobs (
    Id TEXT PRIMARY KEY,
    AppName TEXT NOT NULL,
    Mode TEXT NOT NULL,                  -- Full, Incremental, Diff
    SourcePath TEXT NOT NULL,
    Status TEXT NOT NULL,                -- Queued, Running, Completed, Failed, Cancelled
    Options TEXT,                        -- JSON
    Progress TEXT,                       -- JSON: Phase, PercentComplete, etc.
    Stats TEXT,                          -- JSON: FilesScanned, ChunksCreated, etc.
    ErrorMessage TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    StartedAt DATETIME,
    CompletedAt DATETIME,
    FOREIGN KEY (AppName) REFERENCES Applications(AppName)
);

CREATE INDEX IdxReindexJobsAppName ON ReindexJobs(AppName);
CREATE INDEX IdxReindexJobsStatus ON ReindexJobs(Status);
CREATE INDEX IdxReindexJobsCreatedAt ON ReindexJobs(CreatedAt);
```

### File Hash Tracking

```sql
-- Table: FileHashes (in {app}/rag/indexes/file-index.db)
CREATE TABLE FileHashes (
    Id TEXT PRIMARY KEY,
    FilePath TEXT UNIQUE NOT NULL,
    ContentHash TEXT NOT NULL,          -- SHA256 of file content
    LastIndexed DATETIME,
    ChunkCount INTEGER,
    TokenCount INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxFileHashesFilePath ON FileHashes(FilePath);
CREATE INDEX IdxFileHashesContentHash ON FileHashes(ContentHash);
```

---

## Re-indexing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RE-INDEXING PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. SCANNING PHASE                                                          │
│      └── Walk source directory                                               │
│      └── Apply include/exclude patterns                                      │
│      └── Compute file hashes                                                 │
│      └── Compare with stored hashes (if incremental)                        │
│                                                                              │
│   2. PARSING PHASE                                                           │
│      └── Detect file language (Go, TS, JS, Python, MD)                      │
│      └── Parse with language-specific AST                                    │
│      └── Extract: functions, types, comments, imports                       │
│                                                                              │
│   3. CHUNKING PHASE                                                          │
│      └── Split by semantic boundaries                                        │
│      └── Apply chunk size limits                                             │
│      └── Add overlap between chunks                                          │
│      └── Preserve metadata (file path, line numbers)                        │
│                                                                              │
│   4. EMBEDDING PHASE                                                         │
│      └── Batch chunks for embedding                                          │
│      └── Generate embeddings via backend (Ollama nomic-embed-text)          │
│      └── Store embeddings as BLOB                                            │
│                                                                              │
│   5. INDEXING PHASE                                                          │
│      └── Update SQLite databases                                             │
│      └── Rebuild vector index                                                │
│      └── Update file hash tracking                                           │
│      └── Invalidate caches                                                   │
│                                                                              │
│   6. COMPLETION                                                               │
│      └── Update job status                                                   │
│      └── Emit WebSocket event                                                │
│      └── Log statistics                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9920 | `ErrReindexSourceNotFound` | Source path does not exist |
| 9921 | `ErrReindexPermissionDenied` | Cannot read source files |
| 9922 | `ErrReindexEmbeddingFailed` | Embedding generation failed |
| 9923 | `ErrReindexDbError` | Database write error |
| 9924 | `ErrReindexCancelled` | Job was cancelled |
| 9925 | `ErrReindexTimeout` | Job exceeded timeout |
| 9926 | `ErrReindexOom` | Out of memory during embedding |
| 9927 | `ErrReindexInvalidOptions` | Invalid re-index options |

---

## Performance Considerations

### Batch Processing

```go
const (
    EmbeddingBatchSize = 32    // Chunks per embedding request
    FileBatchSize      = 10    // Files to process before DB commit
    ProgressInterval   = 100   // Emit progress every N chunks
)
```

### Memory Management

- Stream large files instead of loading fully
- Limit concurrent embeddings (default: 4)
- Periodic garbage collection during long runs
- Checkpoint progress for resumability

### Estimated Timings

| Codebase Size | Files | Chunks | Estimated Time |
|---------------|-------|--------|----------------|
| Small (<10K LOC) | ~50 | ~200 | 10-30s |
| Medium (10-50K LOC) | ~200 | ~1000 | 1-3 min |
| Large (50-200K LOC) | ~500 | ~5000 | 5-15 min |
| Very Large (200K+ LOC) | ~2000 | ~20000 | 30-60 min |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| RAG Memory Schema | `08-split-db-integration.md` |
| API Interface | `04-api-interface.md` |
| Error Codes | `05-error-codes.md` |
