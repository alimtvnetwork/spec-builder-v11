# Non-Vector RAG: AI Bridge Integration

**Version:** 1.1.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

This document specifies how the Non-Vector RAG (Tree-Structured Retrieval) system integrates with the existing AI Bridge CLI architecture. The tree-based retrieval operates as a **complementary retrieval strategy** alongside the existing vector-based RAG, with a **Retrieval Router** that selects the optimal strategy per query.

---

## Integration Architecture

```
┌────────────────────────────────────────────────────────┐
│                    AI BRIDGE CLI                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │ User Query   │                                       │
│  └──────┬───────┘                                       │
│         │                                               │
│         ▼                                               │
│  ┌──────────────────┐                                   │
│  │ RETRIEVAL ROUTER  │  ← Decides which strategy to use │
│  │                    │                                  │
│  │  Signals:          │                                  │
│  │  - Query type      │                                  │
│  │  - Index available? │                                 │
│  │  - User preference │                                  │
│  └──┬─────────┬──────┘                                  │
│     │         │                                          │
│     ▼         ▼                                          │
│  ┌────────┐ ┌────────────┐ ┌──────────────┐            │
│  │ Vector │ │ Tree-Based │ │   Hybrid     │            │
│  │  RAG   │ │    RAG     │ │ (both + merge│            │
│  │(spec51)│ │ (this spec)│ │  results)    │            │
│  └───┬────┘ └─────┬──────┘ └──────┬───────┘            │
│      │            │               │                     │
│      └────────────┼───────────────┘                     │
│                   ▼                                     │
│           ┌──────────────┐                              │
│           │   CONTEXT    │                              │
│           │  ASSEMBLER   │                              │
│           │  (unified)   │                              │
│           └──────┬───────┘                              │
│                  │                                      │
│                  ▼                                      │
│           ┌──────────────┐                              │
│           │  MAIN LLM    │                              │
│           │  (response)  │                              │
│           └──────────────┘                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Retrieval Router

> **Detailed specification:** See `12-retrieval-router.md` for full query classification, strategy resolution, fallback behavior, and adaptive latency guard logic.

The router decides which retrieval strategy to use based on available indexes and query characteristics.

```go
type RetrievalRouter interface {
    Route(ctx context.Context, query string, session *SessionContext) (RetrievalStrategy, error)
}

type RetrievalStrategy string
const (
    StrategyVectorOnly  RetrievalStrategy = "vector"
    StrategyTreeOnly    RetrievalStrategy = "tree"
    StrategyHybrid      RetrievalStrategy = "hybrid"
    StrategyFTS5Only    RetrievalStrategy = "fts5"
    StrategyNone        RetrievalStrategy = "none"
)
```

### Routing Logic

| Condition | Strategy | Rationale |
|-----------|----------|-----------|
| Tree index available, vector index not | Tree only | Only tree is available |
| Vector index available, tree index not | Vector only | Only vector is available |
| Both available, code-structure query | Tree only | Tree excels at structural queries |
| Both available, semantic/concept query | Vector only | Vector excels at similarity |
| Both available, broad/complex query | Hybrid | Merge results from both |
| User explicitly requests strategy | User choice | Override routing |
| Neither index available | None | Return error or empty context |

### Query Classification for Routing

```go
type QueryClassifier struct {
    // Classifies queries to determine best retrieval strategy
}

func (qc *QueryClassifier) Classify(query string) QueryClass {
    // Structural queries → Tree
    //   "Where is the auth middleware?"
    //   "Show me the database schema"
    //   "What functions call validateToken?"
    
    // Semantic queries → Vector
    //   "Code similar to this error handling pattern"
    //   "Examples of retry logic"
    
    // Broad queries → Hybrid
    //   "How does the authentication system work?"
    //   "Explain the data flow from API to database"
}

type QueryClass string
const (
    QueryStructural QueryClass = "structural"
    QuerySemantic   QueryClass = "semantic"
    QueryBroad      QueryClass = "broad"
)
```

---

## Session Integration

Tree RAG follows the same session lifecycle as vector RAG (spec 36):

| Session Event | Tree RAG Action |
|---------------|-----------------|
| Session Start | Load tree index for app (if exists) |
| Session Query | Route to appropriate retrieval strategy |
| File Changed | Incremental re-index changed file |
| Session Close (KeepAll) | Tree index persists |
| Session Close (KeepCore) | Tree index persists (it's Tier 1) |
| Session Close (ClearAll) | Tree index deleted |

The tree index is classified as **Tier 1 (Core Memory)** since it represents the base codebase structure and is expensive to rebuild.

---

## Unified Context Format

When both retrieval strategies return results, the Context Assembler merges them:

```
=== RETRIEVED CONTEXT ===

--- From Tree-Structured Retrieval ---
Traversal: authentication > jwt > ValidateToken
[Score: 0.95] internal/auth/jwt.go:45-89
func ValidateToken(...) { ... }

--- From Vector Similarity Retrieval ---
[Similarity: 0.87] internal/auth/middleware.go:12-34
func AuthMiddleware(...) { ... }

=== END CONTEXT ===
```

### Deduplication

When hybrid mode returns results from both strategies, deduplicate by file path + line range overlap:

```go
func deduplicateResults(treeNodes []RetrievedNode, vectorChunks []VectorChunk) []UnifiedResult {
    // 1. Map all results by filePath
    // 2. For overlapping line ranges (>50% overlap), keep higher-scored result
    // 3. Merge non-overlapping results
    // 4. Re-rank unified results
    // 5. Apply token budget
}
```

---

## CLI Commands

New subcommands added to AI Bridge CLI:

```bash
# Index a codebase
ai-bridge tree-rag index --app my-project --path ./src

# Query the tree index
ai-bridge tree-rag query --app my-project "How does auth work?"

# Show tree structure
ai-bridge tree-rag tree --app my-project --depth 3

# Show index status
ai-bridge tree-rag status --app my-project

# Re-index (incremental)
ai-bridge tree-rag reindex --app my-project --mode incremental

# Delete index
ai-bridge tree-rag delete --app my-project

# Set default retrieval strategy
ai-bridge config set retrieval.defaultStrategy hybrid
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Retrieval Engine | `./06-tree-retrieval-engine.md` |
| Retrieval Router | `./12-retrieval-router.md` |
| Vector DB Integration | `../22-ai-bridge-cli/01-backend/51-vector-database-integration.md` |
| Session-Scoped RAG | `../22-ai-bridge-cli/01-backend/36-session-scoped-rag-memory.md` |
| RAG Re-indexing | `../22-ai-bridge-cli/01-backend/11-rag-reindexing.md` |
| AI Bridge Architecture | `../22-ai-bridge-cli/01-backend/01-architecture.md` |

---

*AI Bridge integration specification created 2026-03-22.*
