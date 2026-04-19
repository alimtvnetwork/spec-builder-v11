# Memory: technical/rag-chunk-configuration

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Spec Location:** `spec/07-seedable-config-architecture/02-rag-chunk-settings.md`

---

## Overview

RAG chunk size and overlap are fully configurable via seedable config with flexible min/max bounds and validation rules.

---

## Default Configuration

| Setting | Default | Min | Max | Description |
|---------|---------|-----|-----|-------------|
| `Rag.ChunkSize` | 2048 | 256 | 8192 | Tokens per chunk |
| `Rag.ChunkOverlap` | 100 | 0 | 512 | Overlap between chunks |
| `Rag.ContextTokenBudget` | 4096 | 512 | 16384 | Max tokens for RAG context injection |
| `Rag.EmbeddingModel` | nomic-embed-text | - | - | Embedding model |
| `Rag.SimilarityThreshold` | 0.7 | 0.0 | 1.0 | Min similarity for inclusion |
| `Rag.TopK` | 10 | 1 | 50 | Max chunks returned |

---

## Validation Rules

- ChunkSize must be multiple of 256
- ChunkOverlap cannot exceed 25% of ChunkSize
- ContextTokenBudget must be between 512-16384

---

## Configuration Sources (Priority Order)

1. **App-level override**: `data/{app}/settings/config.db`
2. **Root DB setting**: `data/aibridge.db → Settings`
3. **Seed default**: `config.seed.json → rag.*`

---

## Use Case Guidelines

| Content Type | ChunkSize | ChunkOverlap |
|--------------|-----------|--------------|
| Code | 4096-8192 | 200-300 |
| Documentation | 1024-2048 | 100-150 |
| Dense Technical | 256-512 | 50-100 |
| API References | 512-1024 | 50-100 |
