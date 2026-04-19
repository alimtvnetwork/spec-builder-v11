# AI SEO Generate: Implementation Checklist

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Parent:** [13-ai-seo-generate.md](./13-ai-seo-generate.md)

---

## Overview

Step-by-step implementation guide for the AI SEO Generate module with phases, dependencies, and acceptance criteria.

---

## Phase Summary

| Phase | Name | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Core Infrastructure | 3-4 days | Split DB, Seedable Config |
| 2 | Preset System | 2-3 days | Phase 1 |
| 3 | File Upload | 2-3 days | Phase 1, RAG System |
| 4 | Generation Engine | 3-4 days | Phase 2, Phase 3 |
| 5 | WebSocket Streaming | 2 days | Phase 4 |
| 6 | Import/Export | 1-2 days | Phase 2, Phase 3 |
| 7 | **Error Handling** | 1-2 days | All phases |
| 8 | Frontend Integration | 2-3 days | All phases |

---

## Phase 1: Core Infrastructure

### 1.1 Database Schema

- [ ] Create SEO database paths in Split DB structure
  ```
  data/{appName}/seo/
  ├── jobs/
  └── output/
  ```

- [ ] Add SEO settings to root DB (aibridge.db)
  ```sql
  INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
  ('Seo.DefaultModel', 'thinking', 'string', 'seed', 'Default model for SEO generation'),
  ('Seo.Parallelism', '3', 'int', 'seed', 'Max parallel page generations'),
  ('Seo.MaxPagesPerJob', '100', 'int', 'seed', 'Maximum pages per job');
  ```

- [ ] Create Job Session DB schema (see 13-ai-seo-generate.md)

### 1.2 Configuration

- [ ] Add SEO section to config.seed.json
  ```json
  {
    "Rag": {
      "ChunkSize": 2048,
      "ChunkSizeMin": 256,
      "ChunkSizeMax": 8192,
      "ChunkOverlap": 100
    },
    "Seo": {
      "DefaultModel": "thinking",
      "Parallelism": 3,
      "MaxPagesPerJob": 100
    }
  }
  ```

- [ ] Implement settings service for SEO config

### 1.3 Base API Routes

- [ ] Register SEO API group: `/api/v1/seo/*`
- [ ] Implement health check: `GET /api/v1/seo/health`
- [ ] Add authentication middleware (optional)

### Acceptance Criteria - Phase 1
- [ ] SEO database paths created on app initialization
- [ ] Settings readable from seedable config
- [ ] API routes registered and responding

---

## Phase 2: Preset System

### 2.1 Preset Storage

- [ ] Create preset folder structure
  ```
  data/{appName}/seo/presets/{industry}/
  ├── instructions/
  └── samples/
  ```

- [ ] Implement preset scanner (reads folder contents)
- [ ] Implement instruction file parser (.md, .txt)
- [ ] Implement template file parser (.html with {{variables}})

### 2.2 Preset API

- [ ] `GET /api/v1/seo/presets` - List all presets
- [ ] `GET /api/v1/seo/presets/:industry` - Get preset details
- [ ] `POST /api/v1/seo/presets/:industry` - Create from ZIP
- [ ] `PUT /api/v1/seo/presets/:industry` - Update from ZIP
- [ ] `DELETE /api/v1/seo/presets/:industry` - Delete (2-step)

### 2.3 Variable Extraction

- [ ] Parse `{{variable}}` syntax from templates
- [ ] Generate variable schema from templates
- [ ] Validate variables on generation request

### Acceptance Criteria - Phase 2
- [ ] Can list all available presets
- [ ] Can read instructions and samples from preset
- [ ] Can create new preset from uploaded ZIP
- [ ] Variables extracted correctly from templates

---

## Phase 3: File Upload System

### 3.1 Upload Infrastructure

- [ ] Create upload paths
  ```
  data/uploads/{appName}/{uploadId}/
  ├── extracted/
  └── metadata.json
  ```

- [ ] Implement ZIP extraction
- [ ] Create file manifest (metadata.json)

### 3.2 File Parsers

- [ ] Markdown parser → chunks
- [ ] Plain text parser → chunks
- [ ] HTML parser → template extraction
- [ ] CSV parser → variable data
- [ ] SQLite reader → RAG import

### 3.3 Dependency Resolution

- [ ] Implement dependency graph builder
- [ ] Add cycle detection (unlimited depth)
- [ ] Implement processing queue with pause/resume

```go
type FileProcessor struct {
    processed   map[string]bool
    processing  map[string]bool
    dependencies map[string][]string
}
```

### 3.4 Upload API

- [ ] `POST /api/v1/seo/upload` - Upload ZIP file
- [ ] `GET /api/v1/seo/upload/:id/status` - Get processing status
- [ ] `POST /api/v1/seo/upload/:id/ingest` - Ingest into RAG

### Acceptance Criteria - Phase 3
- [ ] ZIP files extracted correctly
- [ ] All file types parsed successfully
- [ ] Dependency resolution works with cycle detection
- [ ] Files ingested into RAG memory

---

## Phase 4: Generation Engine

### 4.1 Template Engine

- [ ] Implement `{{variable}}` substitution
- [ ] Implement `<!-- AI GENERATE: prompt -->` detection
- [ ] Create prompt assembly for AI sections

### 4.2 Job Management

- [ ] Create job session database on generation start
- [ ] Track page generation progress
- [ ] Handle parallel page generation (configurable)

### 4.3 RAG Context Injection

- [ ] Load preset instructions into context
- [ ] Load relevant RAG chunks (similarity search)
- [ ] Assemble system prompt with context

### 4.4 LLM Integration

- [ ] Call LLM for AI-generated sections
- [ ] Stream response into template
- [ ] Handle token limits and chunking

### 4.5 Generation API

- [ ] `POST /api/v1/seo/generate` - Start generation job
- [ ] `GET /api/v1/seo/jobs/:id` - Get job status
- [ ] `GET /api/v1/seo/output/:batchId` - List generated files
- [ ] `GET /api/v1/seo/output/:batchId/:file` - Get file content

### Acceptance Criteria - Phase 4
- [ ] Variables substituted in templates
- [ ] AI sections generated with context
- [ ] Multiple pages generated in parallel
- [ ] Output files saved correctly

---

## Phase 5: WebSocket Streaming

### 5.1 WebSocket Server

- [ ] Register WebSocket route: `ws://*/ws/seo/jobs/:jobId`
- [ ] Implement connection handling
- [ ] Add authentication for WebSocket

### 5.2 Progress Messages

- [ ] Send `progress` updates during generation
- [ ] Send `pageCompleted` for each finished page
- [ ] Send `completed` when job finishes
- [ ] Send `error` on failures

### 5.3 Upload Progress

- [ ] Send `fileProcessing` during upload
- [ ] Send `dependencyPaused` when pausing for dependency
- [ ] Stream extraction and ingestion progress

### Acceptance Criteria - Phase 5
- [ ] WebSocket connection established
- [ ] Real-time progress updates received
- [ ] Can track file processing live
- [ ] Connection handles reconnection

---

## Phase 7: Error Handling

### 7.1 Error Type Implementation

- [ ] Create `SEOError` struct with all required fields
  ```go
  type SEOError struct {
      Code       int
      Name       string
      Message    string
      Details    string
    Context    SEOErrorContext
    Retryable  bool
    HTTPStatus int
      Timestamp  time.Time
  }
  ```

- [ ] Implement error constructors for all error codes (9501-9540)
- [ ] Add `IsRetryable()` helper function
- [ ] Implement error wrapping with context

### 7.2 Retry Logic

- [ ] Create `RetryConfig` with exponential backoff settings
- [ ] Implement `RetryWithBackoff()` for retryable operations
- [ ] Add configurable retry limits per error type
- [ ] Log retry attempts with structured context

### 7.3 Error Broadcasting

- [ ] Implement `BroadcastError()` for WebSocket clients
- [ ] Create `ProgressError` message format
- [ ] Add error aggregation for batch failures
- [ ] Implement graceful degradation for non-critical errors

### 7.4 Validation Errors

- [ ] Template variable validation with detailed messages
- [ ] File format validation with supported formats list
- [ ] Dependency cycle detection with cycle path reporting
- [ ] Upload size validation with configurable limits

### 7.5 Recovery Strategies

| Error Code | Strategy | Implementation |
|------------|----------|----------------|
| 9504 | Retry | `RetryWithBackoff(3, 500ms)` |
| 9505 | Fallback | Generate without RAG, mark degraded |
| 9506 | Retry + Reduce | Retry with 75% token budget |
| 9520 | Partial | Process remaining files, report failed |

- [ ] Implement fallback for RAG context injection failure
- [ ] Implement token budget reduction on timeout
- [ ] Implement partial batch processing

### 7.6 Error Logging

- [ ] Structured logging with zerolog
- [ ] Include error code, name, message, context
- [ ] Add request correlation ID
- [ ] Implement error metrics for monitoring

### Acceptance Criteria - Phase 7
- [ ] All error codes (9501-9540) have constructors
- [ ] Retry logic working for retryable errors
- [ ] WebSocket broadcasts errors in real-time
- [ ] Recovery strategies implemented and tested
- [ ] Structured logging with full context

---

## Phase 8: Frontend Integration

### 8.1 Preset Management UI

- [ ] List presets page
- [ ] Create preset (ZIP upload)
- [ ] Edit preset (add/remove files)
- [ ] Delete preset confirmation

### 8.2 Generation UI

- [ ] Template selection dropdown
- [ ] Variable input form (dynamic from template)
- [ ] Bulk variable import (CSV)
- [ ] Generate button with progress

### 8.3 Progress Display

- [ ] WebSocket connection for live updates
- [ ] Progress bar with page count
- [ ] Current file indicator
- [ ] Error display with retry option

### 8.4 Output Browser

- [ ] List generated batches
- [ ] Preview generated files
- [ ] Download individual files
- [ ] Download batch as ZIP

### 8.5 Error Handling UI

- [ ] Toast notifications for errors
- [ ] Error details modal with context
- [ ] Retry button for retryable errors
- [ ] Batch error summary view

### Acceptance Criteria - Phase 8
- [ ] All preset operations work from UI
- [ ] Generation progress visible in real-time
- [ ] Error messages displayed with actions
- [ ] Generated content viewable and downloadable

---

## Testing Checklist

### Unit Tests

- [ ] Preset parser tests
- [ ] Template variable extraction tests
- [ ] File dependency resolution tests
- [ ] Cycle detection tests

### Integration Tests

- [ ] Full generation flow test
- [ ] Upload and ingest test
- [ ] Export/import round-trip test
- [ ] WebSocket streaming test

### Load Tests

- [ ] 100 page parallel generation
- [ ] Large ZIP upload (50MB)
- [ ] Multiple concurrent jobs

---

## Error Codes Reference (9500-9540)

### Preset & Template Errors (9501-9510)

| Code | Name | Retryable |
|------|------|-----------|
| 9501 | `SEO_PRESET_NOT_FOUND` | No |
| 9502 | `SEO_TEMPLATE_NOT_FOUND` | No |
| 9503 | `SEO_VARIABLE_MISSING` | No |
| 9504 | `SEO_GENERATION_FAILED` | Yes |
| 9505 | `SEO_CONTEXT_INJECTION_FAILED` | Yes |
| 9506 | `SEO_LLM_TIMEOUT` | Yes |
| 9507 | `SEO_TOKEN_LIMIT_EXCEEDED` | No |
| 9508 | `SEO_OUTPUT_WRITE_FAILED` | Yes |
| 9509 | `SEO_BATCH_LIMIT_EXCEEDED` | No |
| 9510 | `SEO_PRESET_INVALID` | No |

### File Upload Errors (9511-9520)

| Code | Name | Retryable |
|------|------|-----------|
| 9511 | `SEO_UPLOAD_FAILED` | Yes |
| 9512 | `SEO_UPLOAD_TOO_LARGE` | No |
| 9513 | `SEO_UNSUPPORTED_FORMAT` | No |
| 9514 | `SEO_CIRCULAR_DEPENDENCY` | No |
| 9515 | `SEO_PARSE_MARKDOWN_FAILED` | No |
| 9516 | `SEO_PARSE_HTML_FAILED` | No |
| 9517 | `SEO_PARSE_CSV_FAILED` | No |
| 9518 | `SEO_PARSE_SQLITE_FAILED` | No |
| 9519 | `SEO_EXTRACTION_FAILED` | Yes |
| 9520 | `SEO_INGEST_FAILED` | Yes |

### Job Management Errors (9521-9530)

| Code | Name | Retryable |
|------|------|-----------|
| 9521 | `SEO_JOB_NOT_FOUND` | No |
| 9522 | `SEO_JOB_ALREADY_RUNNING` | No |
| 9523 | `SEO_JOB_CANCELLED` | No |
| 9524 | `SEO_JOB_FAILED` | Yes |
| 9525 | `SEO_WEBSOCKET_FAILED` | Yes |
| 9526 | `SEO_PROGRESS_SEND_FAILED` | Yes |

### Import/Export Errors (9531-9540)

| Code | Name | Retryable |
|------|------|-----------|
| 9531 | `SEO_EXPORT_FAILED` | Yes |
| 9532 | `SEO_IMPORT_FAILED` | Yes |
| 9533 | `SEO_BUNDLE_INVALID` | No |
| 9534 | `SEO_BUNDLE_VERSION_MISMATCH` | No |
| 9535 | `SEO_BUNDLE_CORRUPT` | No |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Main Specification | `./13-ai-seo-generate.md` |
| Error Codes Specification | `./16-ai-seo-error-codes.md` |
| Database Architecture | `./12-database-architecture.md` |
| Reset API | `./14-reset-and-export-api.md` |
| RAG Reindexing | `./11-rag-reindexing.md` |
| Error Code Registry | `../../03-error-code-registry/01-registry.md` |
