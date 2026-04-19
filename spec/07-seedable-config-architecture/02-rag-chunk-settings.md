# RAG Chunk Configuration Settings

**Version:** 2.0.0  
**Created:** 2026-02-02  
**Updated:** 2026-03-09  
**Status:** Active  
**Parent:** [00-overview.md](./00-overview.md)

---

## Overview

This document specifies the RAG (Retrieval-Augmented Generation) chunking configuration settings, including defaults, validation rules, and override mechanisms.

---

## Configuration Settings

### Chunk Settings

| Setting Key | Type | Default | Min | Max | Description |
|-------------|------|---------|-----|-----|-------------|
| `Rag.ChunkSize` | int | 2048 | 256 | 8192 | Tokens per chunk |
| `Rag.ChunkOverlap` | int | 100 | 0 | 512 | Overlap between chunks |
| `Rag.ContextTokenBudget` | int | 4096 | 512 | 16384 | Max tokens for RAG context |
| `Rag.EmbeddingModel` | string | `nomic-embed-text` | - | - | Embedding model |
| `Rag.SimilarityThreshold` | float | 0.7 | 0.0 | 1.0 | Min similarity for inclusion |
| `Rag.TopK` | int | 10 | 1 | 50 | Max chunks returned |

---

## Seed Configuration

### config.seed.json Structure

```json
{
  "$schema": "./config.schema.json",
  "version": "1.3.0",
  "changelog": "Added configurable RAG chunk settings",
  "categories": {
    "rag": {
      "displayName": "RAG Configuration",
      "description": "Retrieval-Augmented Generation settings",
      "version": "1.3.0",
      "addedIn": "1.3.0",
      "settings": {
        "chunkSize": {
          "type": "number",
          "label": "Chunk Size (tokens)",
          "description": "Number of tokens per chunk. Larger chunks provide more context but reduce granularity.",
          "default": 2048,
          "min": 256,
          "max": 8192
        },
        "chunkOverlap": {
          "type": "number",
          "label": "Chunk Overlap (tokens)",
          "description": "Token overlap between adjacent chunks to maintain context continuity.",
          "default": 100,
          "min": 0,
          "max": 512
        },
        "contextTokenBudget": {
          "type": "number",
          "label": "Context Token Budget",
          "description": "Maximum tokens for RAG context injection into prompts.",
          "default": 4096,
          "min": 512,
          "max": 16384
        },
        "embeddingModel": {
          "type": "select",
          "label": "Embedding Model",
          "description": "Model used for generating vector embeddings.",
          "default": "nomic-embed-text",
          "options": [
            "nomic-embed-text",
            "text-embedding-3-small",
            "text-embedding-3-large",
            "all-MiniLM-L6-v2"
          ]
        },
        "similarityThreshold": {
          "type": "number",
          "label": "Similarity Threshold",
          "description": "Minimum cosine similarity for chunk inclusion (0.0-1.0).",
          "default": 0.7,
          "min": 0.0,
          "max": 1.0
        },
        "topK": {
          "type": "number",
          "label": "Top-K Chunks",
          "description": "Maximum number of chunks to return from similarity search.",
          "default": 10,
          "min": 1,
          "max": 50
        }
      }
    }
  }
}
```

---

## Validation Rules

### ChunkSize Validation

```go
type ChunkSizeValidator struct{}

func (v ChunkSizeValidator) Validate(value int) error {
    if value < 256 {
        return apperror.New(
            ErrChunkSizeTooSmall,
            "ChunkSize must be >= 256",
        ).WithContext("value", value)
    }
    if value > 8192 {
        return apperror.New(
            ErrChunkSizeTooLarge,
            "ChunkSize must be <= 8192",
        ).WithContext("value", value)
    }
    // Must be power of 2 or multiple of 256
    if value%256 != 0 {
        return apperror.New(
            ErrChunkSizeAlignment,
            "ChunkSize must be multiple of 256",
        ).WithContext("value", value)
    }
    return nil
}
```

### ChunkOverlap Validation

```go
type ChunkOverlapValidator struct {
    ChunkSize int
}

func (v ChunkOverlapValidator) Validate(value int) error {
    if value < 0 {
        return apperror.New(
            ErrChunkOverlapNegative,
            "ChunkOverlap must be >= 0",
        ).WithContext("value", value)
    }
    if value > 512 {
        return apperror.New(
            ErrChunkOverlapTooLarge,
            "ChunkOverlap must be <= 512",
        ).WithContext("value", value)
    }
    // Overlap cannot exceed 25% of chunk size
    maxOverlap := v.ChunkSize / 4
    if value > maxOverlap {
        return apperror.New(
            ErrChunkOverlapExceedsRatio,
            "ChunkOverlap cannot exceed 25% of ChunkSize",
        ).WithContext("value", value).
            WithContext("maxOverlap", maxOverlap)
    }
    return nil
}
```

### Context Budget Validation

```go
type ContextBudgetValidator struct{}

func (v ContextBudgetValidator) Validate(value int) error {
    if value < 512 {
        return apperror.New(
            ErrContextBudgetTooSmall,
            "ContextTokenBudget must be >= 512",
        ).WithContext("value", value)
    }
    if value > 16384 {
        return apperror.New(
            ErrContextBudgetTooLarge,
            "ContextTokenBudget must be <= 16384",
        ).WithContext("value", value)
    }
    return nil
}
```

---

## Configuration Priority

Settings are resolved in the following priority order (highest first):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RAG CONFIGURATION PRIORITY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. App-Level Override (Highest Priority)                                   │
│      └─▶ data/{appName}/settings/config.db → Settings table                │
│                                                                              │
│   2. Root DB Setting                                                         │
│      └─▶ data/aibridge.db → Settings WHERE Key = 'Rag.ChunkSize'           │
│                                                                              │
│   3. Seed Default (Lowest Priority)                                          │
│      └─▶ config.seed.json → categories.rag.settings.chunkSize.default      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case Guidelines

### Recommended Settings by Content Type

| Content Type | ChunkSize | ChunkOverlap | Rationale |
|--------------|-----------|--------------|-----------|
| **Code** | 4096-8192 | 200-300 | Larger context for function boundaries |
| **Documentation** | 1024-2048 | 100-150 | Balanced for paragraphs |
| **Dense Technical** | 256-512 | 50-100 | Smaller for precise retrieval |
| **Long-form Articles** | 2048-4096 | 150-200 | Maintain narrative flow |
| **API References** | 512-1024 | 50-100 | Endpoint-level granularity |

---

## Database Schema

### Settings Table (Root DB)

```sql
-- In aibridge.db
INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
('Rag.ChunkSize', '2048', 'int', 'seed', 'Tokens per RAG chunk'),
('Rag.ChunkSizeMin', '256', 'int', 'seed', 'Minimum allowed chunk size'),
('Rag.ChunkSizeMax', '8192', 'int', 'seed', 'Maximum allowed chunk size'),
('Rag.ChunkOverlap', '100', 'int', 'seed', 'Token overlap between chunks'),
('Rag.ChunkOverlapMin', '0', 'int', 'seed', 'Minimum overlap'),
('Rag.ChunkOverlapMax', '512', 'int', 'seed', 'Maximum overlap'),
('Rag.ContextTokenBudget', '4096', 'int', 'seed', 'Max tokens for context injection'),
('Rag.EmbeddingModel', 'nomic-embed-text', 'string', 'seed', 'Vector embedding model'),
('Rag.SimilarityThreshold', '0.7', 'float', 'seed', 'Minimum similarity score'),
('Rag.TopK', '10', 'int', 'seed', 'Max chunks per search');
```

### App-Level Override Table

```sql
-- In data/{appName}/settings/config.db
CREATE TABLE IF NOT EXISTS Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    ValueType TEXT NOT NULL CHECK(ValueType IN ('string', 'int', 'float', 'bool', 'json')),
    Source TEXT NOT NULL DEFAULT 'user',
    Description TEXT,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example override for code-heavy application
INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
('Rag.ChunkSize', '4096', 'int', 'user', 'Larger chunks for code context');
```

---

## API Endpoints

### Get Current Settings

```
GET /api/v1/settings/rag

Response:
{
  "ChunkSize": 2048,
  "ChunkSizeMin": 256,
  "ChunkSizeMax": 8192,
  "ChunkOverlap": 100,
  "ContextTokenBudget": 4096,
  "EmbeddingModel": "nomic-embed-text",
  "SimilarityThreshold": 0.7,
  "TopK": 10,
  "Source": "seed"
}
```

### Update Settings

```
PUT /api/v1/settings/rag
{
  "ChunkSize": 4096,
  "ChunkOverlap": 200
}

Response:
{
  "Updated": ["ChunkSize", "ChunkOverlap"],
  "Validated": true,
  "Source": "user"
}
```

### Get App-Level Override

```
GET /api/v1/apps/:appName/settings/rag

Response:
{
  "ChunkSize": 4096,
  "ChunkOverlap": 200,
  "Source": "app",
  "InheritedFrom": {
    "ContextTokenBudget": "root",
    "EmbeddingModel": "seed"
  }
}
```

---

## Migration from Previous Defaults

If upgrading from older chunk defaults (512/50), the system will:

1. **Preserve existing chunks** - Do not re-chunk on setting change
2. **Apply new settings to new ingestions only**
3. **Offer re-indexing** via `POST /api/v1/rag/reindex`

```
POST /api/v1/rag/reindex
{
  "AppName": "myapp",
  "ApplyNewChunkSettings": true
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Seedable Config Overview | `./00-overview.md` |
| AI Bridge Database | `../22-ai-bridge-cli/01-backend/12-database-architecture.md` |
| RAG Reindexing | `../22-ai-bridge-cli/01-backend/11-rag-reindexing.md` |
| Error Codes | `../03-error-code-registry/01-registry.md` |
