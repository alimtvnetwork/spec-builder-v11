# 54 — Memory Retrieval Best Practices

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Status:** Active  
> **Related:** `41-memory-classification-flags.md`, `12-database-architecture.md`, `53-enum-architecture.md`, `36-session-scoped-rag-memory.md`

---

## 1. Overview

This specification defines the retrieval algorithm, tagging strategy, link creation heuristics, and performance targets for the AI Bridge RAG memory system. The goal is to find the most relevant RAG chunks in **<50ms** on 100k chunks using a combination of tag-based pre-filtering, memory tier boosting, link traversal, and vector similarity.

---

## 2. Retrieval Algorithm (6-Step Pipeline)

### 2.1 Complete Algorithm

```
Step 1: KEYWORD EXTRACTION
  └── Extract keywords/tokens from current user message
  └── Remove stopwords (the, is, a, an, etc.)
  └── Extract named entities and technical terms
  └── Normalize: lowercase, stem/lemmatize

Step 2: TAG-BASED PRE-FILTERING (Fast Path — <5ms)
  └── Query ChunkTags WHERE Tag IN (extracted_keywords)
  └── Group by ChunkId, SUM(Weight) as TagScore
  └── Return candidate ChunkIds (top 200 by TagScore)
  └── This step eliminates 95%+ of chunks from vector search

Step 3: MEMORY TIER SCORING (per candidate)
  └── Score = TagScore
            + (IsAttention * 4.0)
            + (IsCritical  * 3.0)
            + (IsShortTerm * 2.0 * DecayMultiplier)
            + (IsImportant * 2.0)
            + (IsPinned    * 1.5)

Step 4: VECTOR SIMILARITY (on candidates only — <30ms)
  └── Embed user query via Ollama (nomic-embed-text)
  └── Compute cosine similarity ONLY for candidate chunks (not all)
  └── VectorScore = CosineSimilarity * 1.0

Step 5: LINK TRAVERSAL (expand related nodes — <10ms)
  └── For top-20 scoring chunks:
      └── SELECT TargetChunkId, Strength FROM ChunkLinks
          WHERE SourceChunkId IN (top_20)
      └── Add linked chunks with score = ParentScore * Strength * 0.5
  └── Deduplicate (keep highest score per ChunkId)

Step 6: FINAL RANKING & TOKEN BUDGET
  └── FinalScore = TierScore + VectorScore + LinkBonus
  └── Sort descending by FinalScore
  └── Accumulate tokens until budget exhausted
  └── Return top-K chunks within budget
```

### 2.2 Go Implementation

```go
type RetrievalResult struct {
    ChunkId    int64
    Content    string
    FinalScore float64
    Source     string   // "tag", "vector", "link"
    TokenCount int
}

type RetrievalConfig struct {
    MaxCandidates    int     // Default: 200
    MaxLinkedDepth   int     // Default: 1 (single hop)
    MinTagScore      float64 // Default: 0.5
    MinVectorScore   float64 // Default: 0.3
    TokenBudget      int     // From settings: Rag.ContextTokenBudget
    TopK             int     // Default: 10
}

func (r *Retriever) Retrieve(
    query string,
    sessionId string,
    config RetrievalConfig,
) apperror.Result[[]RetrievalResult] {
    // Step 1: Extract keywords
    keywords := r.ExtractKeywords(query)

    // Step 2: Tag pre-filter
    candidatesResult := r.TagPreFilter(sessionId, keywords, config.MaxCandidates)
    if candidatesResult.IsErr() {
        return apperror.Fail[[]RetrievalResult](candidatesResult.Err())
    }

    candidates := candidatesResult.Value()

    // Step 3: Apply tier scores
    r.ApplyTierScores(candidates)

    // Step 4: Vector similarity (only on candidates)
    embedResult := r.Embed(query)
    if embedResult.IsErr() {
        return apperror.Fail[[]RetrievalResult](embedResult.Err())
    }

    r.ApplyVectorScores(candidates, embedResult.Value())

    // Step 5: Link traversal
    r.ExpandLinks(candidates, config.MaxLinkedDepth)

    // Step 6: Rank and budget
    return apperror.Ok(r.RankAndBudget(candidates, config.TokenBudget, config.TopK))
}
```

---

## 3. Tag Extraction Strategy

### 3.1 When to Extract Tags

Tags are extracted **during chunk ingestion** (not at query time):

```
Chunk Created
  └── Content tokenized
  └── Stopwords removed
  └── Named entities extracted (technical terms, identifiers)
  └── Tags inserted into ChunkTags with computed weights
```

### 3.2 Tag Weight Computation

| Tag Source | Weight | Example |
|-----------|--------|---------|
| Exact technical term | 2.0 | "chromem-go", "PascalCase", "DBOperation" |
| Named entity | 1.5 | "AI Bridge", "GSearch", "Ollama" |
| Code identifier | 1.5 | "RagChunk", "IsAttention", "SessionMeta" |
| Domain keyword | 1.0 | "retrieval", "embedding", "vector" |
| Common word (after stopword filter) | 0.5 | "create", "update", "system" |

### 3.3 Go Tag Extractor

```go
type TagExtractor struct {
    Stopwords    map[string]bool
    TechTerms    map[string]float64 // Known technical terms with weights
}

type ExtractedTag struct {
    Tag    string
    Weight float64
}

func (te *TagExtractor) Extract(content string) []ExtractedTag {
    words := tokenize(content)
    tags := make([]ExtractedTag, 0, len(words)/2)

    for _, word := range words {
        lower := strings.ToLower(word)

        // Skip stopwords
        if te.Stopwords[lower] {
            continue
        }

        // Check known technical terms
        if weight, ok := te.TechTerms[lower]; ok {
            tags = append(tags, ExtractedTag{Tag: lower, Weight: weight})
            continue
        }

        // Code identifiers (PascalCase, camelCase, snake_case)
        if isCodeIdentifier(word) {
            tags = append(tags, ExtractedTag{Tag: lower, Weight: 1.5})
            continue
        }

        // Regular keyword
        tags = append(tags, ExtractedTag{Tag: lower, Weight: 0.5})
    }

    return deduplicateTags(tags)
}
```

### 3.4 Auto-Tagging During Ingestion

```go
func (s *RagService) IngestChunk(chunk RagChunk) *apperror.AppError {
    // 1. Save chunk via ORM
    if err := s.db.Create(&chunk).Error; err != nil {
        return apperror.Wrap(
            err,
            ErrRagChunkIngestFailed,
            "failed to ingest chunk",
        )
    }

    // 2. Extract and save tags
    tags := s.tagExtractor.Extract(chunk.Content)
    for _, tag := range tags {
        chunkTag := ChunkTag{
            ChunkId: chunk.Id,
            Tag:     tag.Tag,
            Weight:  tag.Weight,
        }
        s.db.Create(&chunkTag)
    }

    // 3. Create links to recent chunks (if in conversation context)
    if s.currentSessionId != "" {
        recentChunks := s.GetRecentShortTermChunks(s.currentSessionId, 5)
        for _, recent := range recentChunks {
            link := ChunkLink{
                SourceChunkId: chunk.Id,
                TargetChunkId: recent.Id,
                LinkType:      link_type.Related,
                Strength:      0.5,
            }
            s.db.Create(&link)
        }
    }

    return nil
}
```

---

## 4. Link Creation Heuristics

### 4.1 When to Create Links

| Trigger | Link Type | Strength | Description |
|---------|-----------|----------|-------------|
| Chunks from same file | `Related` | 0.7 | Co-located code chunks |
| Chunks from same conversation turn | `Related` | 0.6 | Contextually related |
| Chunk references another chunk's entity | `DependsOn` | 0.8 | Dependency relationship |
| Chunk is a summary of another | `DerivedFrom` | 0.9 | Summarization link |
| Short-term chunks in sequence | `Related` | 0.5 | Temporal proximity |

### 4.2 Link Traversal Rules

- **Max depth:** 1 hop (configurable, default 1)
- **Max linked chunks per parent:** 5
- **Score inheritance:** `LinkedScore = ParentScore * LinkStrength * 0.5`
- **Bidirectional:** `Related` links are traversed both directions; `DependsOn` and `DerivedFrom` are directional

---

## 5. Attention vs Short-Term: When to Use Each

### 5.1 Decision Matrix

| Scenario | Flag | Rationale |
|----------|------|-----------|
| Chunk directly answers the current query | `IsAttention` | Immediately relevant, highest boost |
| Chunk was relevant in the last 3 turns | `IsShortTerm` | Recent context, may be referenced again |
| Chunk contains a core architecture pattern | `IsCritical` | Permanent, essential knowledge |
| Chunk was explicitly marked by user | `IsImportant` | User-curated priority |
| Chunk is from a previous session but semantically similar | Neither | Use vector similarity only |

### 5.2 Attention Memory Rules

1. **Maximum attention chunks:** Limited by `Rag.AttentionMaxChunks` (default: 10)
2. **Auto-selection:** Top 10 chunks by tag-match + vector similarity are auto-marked
3. **Auto-expiration:** All `IsAttention` flags cleared after response generation
4. **Promotion path:** After a turn, top attention chunks are promoted to `IsShortTerm`

### 5.3 Short-Term Memory Rules

1. **Maximum short-term chunks:** Limited by `Rag.ShortTermMaxChunks` (default: 50)
2. **Session-scoped:** Cleared when session ends
3. **Decay:** Time-decay multiplier applied based on turns since marked
4. **Link creation:** New short-term chunks auto-link to 3-5 most recent short-term chunks

---

## 6. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tag pre-filter | <5ms | 100k chunks, 10 keywords |
| Vector similarity (200 candidates) | <30ms | chromem-go cosine on 200 vectors |
| Link traversal (1 hop) | <5ms | SQLite indexed lookup |
| Total retrieval | <50ms | End-to-end including scoring |
| Memory overhead | <20MB | Tag index + link graph in memory |

### 6.1 Why Tag Pre-Filtering is Critical

Without pre-filtering:
```
100,000 chunks × vector similarity = ~40ms (chromem-go)
```

With tag pre-filtering:
```
100,000 chunks → 200 candidates via tag index = <5ms
200 candidates × vector similarity = <1ms
Total = <10ms (4x faster)
```

### 6.2 Index Strategy

```sql
-- Primary retrieval indexes
CREATE INDEX IdxChunkTagsTag ON ChunkTags(Tag);
CREATE INDEX IdxChunkTagsWeight ON ChunkTags(Tag, Weight DESC);
CREATE INDEX IdxChunkTagsChunk ON ChunkTags(ChunkId);

-- Memory tier indexes
CREATE INDEX IdxChunksAttention ON RagChunks(IsAttention) WHERE IsAttention = 1;
CREATE INDEX IdxChunksShortTerm ON RagChunks(IsShortTerm) WHERE IsShortTerm = 1;
CREATE INDEX IdxChunksCritical ON RagChunks(IsCritical) WHERE IsCritical = 1;

-- Link traversal indexes
CREATE INDEX IdxChunkLinksSource ON ChunkLinks(SourceChunkId);
CREATE INDEX IdxChunkLinksTarget ON ChunkLinks(TargetChunkId);
```

---

## 7. Token Budget Allocation

### 7.1 Default Allocation

```
Total Context Window: Model-dependent (e.g., 32,768 tokens)

Allocation:
  System Prompt:         10%  (~3,200 tokens)
  Retrieved RAG Context: 40%  (~13,000 tokens)  ← This is our budget
  Conversation History:  30%  (~9,800 tokens)
  Current Message:        5%  (~1,600 tokens)
  Generation Reserve:    15%  (~4,900 tokens)
```

### 7.2 RAG Context Sub-Allocation

Within the 40% RAG budget:

```
Attention chunks:    40% of RAG budget (highest priority, fed first)
Critical chunks:     25% of RAG budget
Short-term chunks:   20% of RAG budget
Important chunks:    10% of RAG budget
Regular chunks:       5% of RAG budget (only if budget remains)
```

---

## 8. Seedable Configuration

Add to `config.seed.json`:

```json
{
  "Rag": {
    "Retrieval": {
      "MaxCandidates": 200,
      "MaxLinkedDepth": 1,
      "MinTagScore": 0.5,
      "MinVectorScore": 0.3,
      "TopK": 10,
      "AttentionMaxChunks": 10,
      "ShortTermMaxChunks": 50,
      "TagDecayEnabled": true,
      "ShortTermDecayRate": 0.2,
      "ShortTermClearThreshold": 0.2,
      "LinkTraversalEnabled": true,
      "HybridSearchEnabled": true
    },
    "TokenBudget": {
      "SystemPromptPercent": 10,
      "RagContextPercent": 40,
      "ConversationHistoryPercent": 30,
      "CurrentMessagePercent": 5,
      "GenerationReservePercent": 15,
      "AttentionSubPercent": 40,
      "CriticalSubPercent": 25,
      "ShortTermSubPercent": 20,
      "ImportantSubPercent": 10,
      "RegularSubPercent": 5
    }
  }
}
```

---

## 9. Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9910 | `ErrRetrievalFailed` | Complete retrieval pipeline failed |
| 9911 | `ErrTagPrefilterFailed` | Tag pre-filtering step failed |
| 9912 | `ErrVectorSearchFailed` | Vector similarity computation failed |
| 9913 | `ErrLinkTraversalFailed` | Link graph traversal failed |
| 9914 | `ErrTokenBudgetExceeded` | Retrieved context exceeds token budget |
| 9915 | `ErrEmbeddingFailed` | Query embedding generation failed |
| 9916 | `ErrKeywordExtractionFailed` | Failed to extract keywords from query |

---

## 10. Cross-References

| Resource | Location |
|----------|----------|
| Memory Classification Flags | `41-memory-classification-flags.md` |
| Database Architecture (ChunkLinks, ChunkTags) | `12-database-architecture.md` |
| Enum Architecture (link_type, memory_tier) | `53-enum-architecture.md` |
| Session-Scoped RAG Memory | `36-session-scoped-rag-memory.md` |
| Vector DB Integration | `51-vector-database-integration.md` |
| Research: Memory Systems Guide | `02-spec/60-ai-research/04-rag-memory-systems-complete-guide.md` |
| Research: Go Implementation Guide | `02-spec/60-ai-research/05-rag-memory-training-and-go-implementation-guide.md` |

---

*AI Bridge CLI — Memory retrieval best practices following <50ms latency target on 100k chunks.*
