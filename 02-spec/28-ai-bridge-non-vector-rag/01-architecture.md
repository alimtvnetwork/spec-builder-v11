# Non-Vector RAG: Core Architecture

**Version:** 1.1.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

This document defines the end-to-end architecture of the Tree-Structured Retrieval system. The system operates in two phases: **Indexing** (offline, at codebase scan time) and **Retrieval** (online, at query time). Both phases use small/fast LLMs for reasoning rather than embedding models for vector computation.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NON-VECTOR RAG ENGINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────┐ │
│  │ FILE WATCHER │──▶│ PARSE ROUTER │──▶│ LANGUAGE-SPECIFIC PARSER │ │
│  │ (fs events)  │   │ (by ext)     │   │ ┌─────┐ ┌────┐ ┌─────┐ │ │
│  └─────────────┘   └──────────────┘   │ │ Go  │ │ TS │ │ MD  │ │ │
│                                        │ └─────┘ └────┘ └─────┘ │ │
│                                        │ ┌─────┐ ┌────┐ ┌─────┐ │ │
│                                        │ │ PHP │ │ Py │ │ ... │ │ │
│                                        │ └─────┘ └────┘ └─────┘ │ │
│                                        └──────────┬───────────────┘ │
│                                                   │                 │
│                                                   ▼                 │
│                                        ┌──────────────────┐        │
│                                        │  RAW PARSE TREE  │        │
│                                        │  (structural AST) │        │
│                                        └────────┬─────────┘        │
│                                                 │                   │
│                                                 ▼                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    LLM ENRICHMENT PIPELINE                    │   │
│  │                                                               │   │
│  │  For each node in raw tree:                                   │   │
│  │  1. Generate Title (concise label)                            │   │
│  │  2. Generate Description (1-2 sentence summary)               │   │
│  │  3. Extract Keywords (3-10 relevant terms)                    │   │
│  │  4. Assign Category (e.g., "authentication", "database")     │   │
│  │  5. Assign Subcategory (e.g., "jwt-validation", "migration") │   │
│  │  6. Calculate Importance Score (0.0 - 1.0)                    │   │
│  │                                                               │   │
│  │  Model: llama3.1:8b (fast, local)                             │   │
│  │  Batch: Process nodes in parallel batches of 10-50            │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │                                           │
│                         ▼                                           │
│              ┌──────────────────┐                                   │
│              │  SQLITE STORAGE  │                                   │
│              │  (TreeNode table) │                                   │
│              │  (TreeEdge table) │                                   │
│              │  (FileRegistry)   │                                   │
│              └──────────────────┘                                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                     RETRIEVAL LAYER (Query Time)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐   ┌───────────────┐   ┌────────────────────────┐   │
│  │ USER QUERY │──▶│ QUERY ANALYZER│──▶│ TREE TRAVERSAL ENGINE  │   │
│  │            │   │ (extract intent│   │                        │   │
│  │            │   │  + keywords)   │   │  Strategy: greedy /    │   │
│  └────────────┘   └───────────────┘   │  beam / exhaustive     │   │
│                                        │                        │   │
│                                        │  1. Start at root      │   │
│                                        │  2. Score children     │   │
│                                        │  3. Descend best path  │   │
│                                        │  4. Collect leaf nodes │   │
│                                        └───────────┬────────────┘   │
│                                                    │                │
│                                                    ▼                │
│                                        ┌────────────────────────┐   │
│                                        │  CONTEXT ASSEMBLER     │   │
│                                        │  - Retrieved content   │   │
│                                        │  - Traversal path      │   │
│                                        │  - Relevance scores    │   │
│                                        │  - Token budget mgmt   │   │
│                                        └────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Indexing Pipeline

### 1.1 File Discovery

```go
type FileDiscovery struct {
    RootPath        string
    IncludePatterns []string   // e.g., ["**/*.go", "**/*.ts", "**/*.md"]
    ExcludePatterns []string   // e.g., ["**/vendor/**", "**/node_modules/**"]
    MaxFileSize     int64      // Skip files larger than this (bytes)
    MaxDepth        int        // Directory traversal depth limit
}
```

The file discovery stage walks the filesystem, filters by include/exclude patterns, and produces a list of files to parse. Each file is fingerprinted with SHA-256 for incremental update detection.

### 1.2 Parse Routing

Files are routed to language-specific parsers based on extension:

| Extension | Parser | Strategy |
|-----------|--------|----------|
| `.go` | Go AST parser | `go/parser` package → AST → tree nodes |
| `.ts`, `.tsx` | TypeScript parser | Regex + heuristic (no native AST in Go) |
| `.js`, `.jsx` | JavaScript parser | Regex + heuristic |
| `.py` | Python parser | Indentation-based + regex |
| `.php` | PHP parser | Regex + brace-matching |
| `.md` | Markdown parser | Heading hierarchy (`#`, `##`, `###`) |
| `.yaml`, `.yml` | YAML parser | Key hierarchy |
| `.json` | JSON parser | Object/array nesting |

Each parser produces a **Raw Parse Tree** — a structural tree that captures the hierarchy of the file without any semantic metadata.

### 1.3 LLM Enrichment

The raw parse tree is enriched by a small/fast LLM to add semantic metadata to each node. This is the key differentiator from pure AST parsing.

**Enrichment Prompt Template:**

```
Given this code/document node, generate structured metadata.

Node Type: {nodeType}
Node Name: {nodeName}
Content Preview: {first 500 chars of content}
Parent Context: {parent node title and category}
File Path: {filePath}

Respond in JSON:
{
  "title": "concise human-readable title",
  "description": "1-2 sentence summary of what this does",
  "keywords": ["keyword1", "keyword2", ...],
  "category": "main category (e.g., authentication, database, ui)",
  "subcategory": "specific subcategory (e.g., jwt-validation, migration)",
  "importance": 0.0-1.0
}
```

**Batching Strategy:**
- Process nodes in batches of 10-50 (configurable)
- Use parallel goroutines for batch processing (max 4 concurrent LLM calls)
- Cache enrichment results by content hash to avoid re-processing unchanged nodes

### 1.4 Storage

Enriched tree nodes are stored in SQLite using the Split DB architecture. See `02-tree-index-schema.md` for the complete schema.

---

## Phase 2: Retrieval Pipeline

### 2.1 Query Analysis

When a user query arrives, the system first analyzes it to extract intent and matching signals:

```go
type QueryAnalysis struct {
    OriginalQuery   string
    Intent          string     // "find", "explain", "modify", "debug"
    Keywords        []string   // Extracted search terms
    Categories      []string   // Inferred categories to search
    Subcategories   []string   // Inferred subcategories
    MaxResults      int        // How many nodes to return
    DepthPreference string     // "shallow" (high-level) or "deep" (implementation detail)
}
```

The query analyzer uses the same small/fast LLM to decompose the query:

```
Given this user query, extract search parameters.

Query: "{userQuery}"

Available categories in the tree: {list of all categories}
Available subcategories: {list of all subcategories}

Respond in JSON:
{
  "intent": "find|explain|modify|debug",
  "keywords": ["term1", "term2"],
  "categories": ["cat1", "cat2"],
  "subcategories": ["subcat1"],
  "depthPreference": "shallow|deep"
}
```

### 2.2 Tree Traversal

Three traversal strategies are available:

#### Greedy Traversal (Default)

1. Start at root nodes (top-level nodes in the tree)
2. Score each root node against the query using keyword overlap + category match
3. Descend into the highest-scoring node
4. At each level, score children and descend into the best match
5. Stop when reaching leaf nodes or when relevance score drops below threshold
6. Collect all visited leaf nodes as results

#### Beam Traversal (Higher Recall)

1. Start at root nodes
2. Keep top-K candidates at each level (beam width, default K=3)
3. Expand all K candidates, re-rank, keep top-K again
4. Continue until leaf nodes or depth limit
5. Return all collected leaf nodes, ranked by cumulative score

#### Exhaustive Traversal (Maximum Recall)

1. Pre-filter nodes using SQLite FTS5 keyword matching
2. For matching nodes, walk up to root to get full context path
3. Score full paths using LLM
4. Return top-N paths with their leaf content

### 2.3 Scoring Function

Node scoring combines multiple signals with **intent-adaptive weights** — the weight preset is selected dynamically based on `QueryIntent` (find, explain, modify, debug, create). See `06-tree-retrieval-engine.md` § "Intent-Adaptive Weight Presets" for the full preset table and rationale.

```go
type NodeScore struct {
    KeywordOverlap    float64  // Jaccard similarity of query keywords vs node keywords
    CategoryMatch     float64  // 1.0 if category matches, 0.5 for partial, 0.0 for none
    SubcategoryMatch  float64  // Same as category but for subcategory
    TitleRelevance    float64  // LLM-judged relevance of node title to query (0.0-1.0)
    ImportanceWeight  float64  // Node's pre-computed importance score
    DepthPenalty      float64  // Slight penalty for very deep nodes (configurable)
    CombinedScore     float64  // Weighted sum of all signals
}

// Weights are selected per-query from intent-adaptive presets.
// See 06-tree-retrieval-engine.md DefaultWeightPresets for values.
//
// Example (intent = "find"):
//   KeywordOverlap: 0.40, CategoryMatch: 0.10, SubcategoryMatch: 0.10,
//   TitleRelevance: 0.15, ImportanceWeight: 0.15, DepthPenalty: 0.10
//
// Presets are tuned via grid search with NDCG@5 regression gates
// (see 11-performance-benchmarks.md).
```

### 2.4 Context Assembly

Retrieved nodes are assembled into a context window for the main LLM:

```go
type RetrievalResult struct {
    Nodes          []RetrievedNode  // Matched tree nodes with content
    TraversalPath  []string         // Human-readable path: "auth → jwt → validate"
    TotalTokens    int              // Estimated token count of assembled context
    Strategy       string           // Which traversal strategy was used
    QueryAnalysis  QueryAnalysis    // The decomposed query
    TimeTakenMs    int64            // Retrieval latency
}

type RetrievedNode struct {
    NodeID         string
    Title          string
    Description    string
    Content        string    // Full content of the node
    FilePath       string    // Source file
    LineRange      [2]int    // Start and end line in source file
    Score          NodeScore
    Depth          int       // Depth in tree (0 = root)
    AncestorPath   string    // "root > parent > child" breadcrumb
}
```

---

## Incremental Update Strategy

### File Change Detection

```go
type FileChangeDetector struct {
    // Compare current file hash with stored hash in FileRegistry
    // Only re-parse and re-enrich changed files
    // Cascade updates: if a parent node changes, re-score children
}
```

| Change Type | Action |
|-------------|--------|
| File added | Parse → enrich → insert nodes |
| File modified | Re-parse → diff nodes → update changed → re-enrich changed |
| File deleted | Remove all nodes for that file |
| File renamed | Update FilePath on existing nodes (content unchanged) |

### Incremental vs Full Re-index

| Mode | When to Use | Cost |
|------|-------------|------|
| **Incremental** | Default for `watch` mode and manual triggers | Only changed files |
| **Full** | After major refactors, or when tree seems stale | All files re-parsed and re-enriched |
| **Metadata-only** | When updating LLM enrichment model | Re-enrich all nodes without re-parsing |

---

## Concurrency Model

```go
// Indexing concurrency
const (
    MaxParserWorkers    = 8   // Parallel file parsing
    MaxLLMWorkers       = 4   // Parallel LLM enrichment calls
    MaxStorageWorkers   = 2   // Parallel SQLite writes (WAL mode)
    BatchSize           = 20  // Nodes per LLM enrichment batch
)

// Retrieval concurrency
const (
    MaxTraversalWorkers = 2   // Parallel beam paths
    QueryTimeout        = 5 * time.Second
    MaxTraversalDepth   = 10  // Safety limit
)
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Tree Index Schema | `./02-tree-index-schema.md` |
| Code Parser | `./03-code-parser.md` |
| Document Parser | `./04-document-parser.md` |
| Tree Indexing Engine | `./05-tree-indexing-engine.md` |
| Tree Retrieval Engine | `./06-tree-retrieval-engine.md` |
| API Interface | `./07-api-interface.md` |
| Retrieval Router | `./12-retrieval-router.md` |
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| Vector DB Integration | `../27-ai-bridge-cli/01-backend/51-vector-database-integration.md` |

---

*Architecture specification created 2026-03-22.*
