# Feature: AI Bridge Non-Vector RAG (Tree-Structured Retrieval)

**Version:** 2.1.0  
**Status:** Draft  
**Created:** 2026-03-22  
**Last Updated:** 2026-03-30  
**AI Confidence:** Medium  
**Ambiguity:** Medium  
**Error Range:** 20000-20999 (prefix `AB-TR`)

---

## Keywords

`non-vector-rag` · `tree-structured` · `retrieval` · `ai-bridge` · `golang` · `hierarchical` · `spec-aware` · `context-retrieval`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Medium |
| Ambiguity | Medium |
| Health Score | 100/100 (A+) |

---

## Summary

A vectorless retrieval-augmented generation system for AI Bridge CLI that replaces traditional embedding-based (vector) retrieval with **tree-structured document indexing** and **LLM-guided tree traversal**. Instead of chunking documents into flat vectors and performing similarity search, this system parses codebases and documents into hierarchical tree structures stored in SQLite, then uses small/fast LLMs to traverse the tree and locate relevant content for context injection.

This approach preserves the structural relationships within documents and codebases, eliminates the need for embedding models and vector databases, and provides transparent, explainable retrieval paths.

---

## Motivation

### Problems with Vector-Based RAG

| Problem | Description |
|---------|-------------|
| **Context Destruction** | Fixed-size chunking breaks logical units (functions, classes, sections) |
| **Similarity ≠ Relevance** | Vector cosine similarity finds semantically similar text, not necessarily the most relevant answer |
| **Embedding Cost** | Requires embedding model inference for every chunk and every query |
| **Opaque Retrieval** | No explainability — cannot show *why* a chunk was retrieved |
| **Scaling Noise** | More chunks = more noise competing with signal at retrieval time |

### Why Tree-Structured Retrieval

| Advantage | Description |
|-----------|-------------|
| **Structure Preservation** | Parent-child relationships between sections/functions maintained |
| **Reasoning-Based** | LLM decides which branches to explore based on query understanding |
| **Zero Embedding Cost** | No vector DB, no embedding model required for retrieval |
| **Explainable** | Traversal path shows exactly how the system found the content |
| **Natural Hierarchy** | Code and documents already have inherent tree structure (headings, AST) |

---

## Folder Structure

```
23-ai-bridge-non-vector-rag/
├── 00-overview.md                          # This file
├── 01-architecture.md                      # Core system design and pipeline
├── 02-tree-index-schema.md                 # SQLite schema, TreeNode data model
├── 03-code-parser.md                       # Multi-language code parsing to tree nodes
├── 04-document-parser.md                   # Markdown/text heading-hierarchy parsing
├── 05-tree-indexing-engine.md              # LLM-powered tree construction with metadata
├── 06-tree-retrieval-engine.md             # LLM-guided traversal, intent-adaptive weights
├── 07-api-interface.md                     # REST API endpoints
├── 08-error-codes.md                       # Error code registry (20xxx)
├── 09-configuration.md                     # Config: weightPresets, benchmark, grid search
├── 10-ai-bridge-integration.md             # Integration with existing AI Bridge systems
├── 11-performance-benchmarks.md            # Perf targets, vector comparison, weight tuning
├── 12-retrieval-router.md                  # Strategy selection, query classification, fallback
├── 97-acceptance-criteria.md               # AC-IDX, AC-RET, AC-SCR, AC-BNK, AC-API, AC-INT, AC-STO, AC-RTR
└── 99-consistency-report.md                # File inventory and health
```

---

## User Stories

- As a developer, I want AI Bridge to index my codebase into a navigable tree so I can query code structure without embedding overhead
- As a developer, I want the retrieval system to explain *why* specific code sections were selected as context
- As a developer, I want to use small/fast models (e.g., `llama3.1:8b`) for tree construction so indexing is cheap and fast
- As a developer, I want tree-based retrieval to work alongside existing vector RAG so I can choose the best approach per use case
- As a developer, I want the tree index stored in SQLite so it integrates with the existing Split DB architecture
- As a developer, I want incremental tree updates when files change, not full re-indexing every time

---

## Core Workflow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Input Codebase  │ ──▶ │  Code/Doc Parser │ ──▶ │  Raw Parse Tree  │
│  (files on disk) │     │  (AST + Heading)  │     │  (structural)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  SQLite Storage  │ ◀── │  Enriched Tree   │ ◀── │  LLM Enrichment  │
│  (TreeNode table)│     │  (with metadata)  │     │  (small model)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │
         ▼  (at query time)
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  User Query      │ ──▶ │  Tree Traversal  │ ──▶ │  Retrieved Nodes │
│                  │     │  (LLM-guided)    │     │  (with content)  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────────┐
                                                  │  Context Window  │
                                                  │  (prompt assembly)│
                                                  └──────────────────┘
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage** | SQLite (Split DB) | Consistent with existing architecture, zero external dependencies |
| **Tree Construction Model** | Small/fast LLM (`llama3.1:8b`) | Low cost, fast indexing; only needs summarization capability |
| **Tree Traversal Model** | Small/fast LLM | Reasoning over structured metadata, not generation |
| **Node Metadata** | Title, Description, Keywords, Category, Subcategory | Enables multi-signal matching during traversal |
| **Scoring Weights** | Intent-adaptive presets (find/explain/modify/debug/create) | Different query types require different signal priorities |
| **Hybrid Mode** | Optional alongside vector RAG | Not a replacement; complementary retrieval strategy |
| **Incremental Updates** | File-hash-based diff detection | Only re-index changed files |
| **Weight Tuning** | Grid search + NDCG regression | Data-driven weight optimization with CI-gated quality gates |

---

## Relationship to Existing RAG System

This system is **complementary** to the existing vector-based RAG:

| Aspect | Vector RAG (spec 51) | Tree RAG (this spec) |
|--------|---------------------|---------------------|
| **Storage** | chromem-go (in-memory vectors) | SQLite TreeNode table |
| **Retrieval** | Cosine similarity (KNN) | LLM-guided tree traversal |
| **Indexing** | Embedding model required | Small LLM for metadata generation |
| **Best For** | Semantic similarity across large corpora | Structural navigation of codebases/documents |
| **Explainability** | Low (similarity score only) | High (traversal path visible) |
| **Session Integration** | Session-scoped (spec 36) | Session-scoped (same lifecycle) |

A **routing layer** in AI Bridge decides which retrieval strategy to use based on query type (see `10-ai-bridge-integration.md`).

---

## Error Code Range

Tree-structured RAG uses error codes **20000-20999** (prefix `AB-TR`).

> ⚠️ Reassigned from 12000-12999 to resolve overlap with WSP (WP SEO Publish, 12000-12599).

| Range | Category |
|-------|----------|
| 20000-20099 | General / Startup |
| 20100-20199 | Code Parsing |
| 20200-20299 | Document Parsing |
| 20300-20399 | Tree Construction (LLM) |
| 20400-20499 | Tree Storage (SQLite) |
| 20500-20599 | Tree Traversal / Retrieval |
| 20600-20699 | API Interface |
| 20700-20799 | Configuration |
| 20800-20899 | AI Bridge Integration |
| 20900-20999 | Reserved |

---

## Acceptance Criteria Index

| Group | Criteria | Source |
|-------|----------|--------|
| AC-IDX | 9 criteria | Indexing pipeline (03, 04, 05) |
| AC-RET | 6 criteria | Retrieval engine (06) |
| AC-SCR | 10 criteria | Intent-adaptive scoring weights (06) |
| AC-BNK | 15 criteria | Benchmarks, NDCG thresholds, regression tests (11) |
| AC-API | 6 criteria | REST API interface (07) |
| AC-INT | 4 criteria | AI Bridge integration (10) |
| AC-STO | 4 criteria | Storage and performance (02) |
| AC-RTR | 6 criteria | Retrieval Router decision logic (12) |

Full details: `97-acceptance-criteria.md`

---

## Cross-References

| Reference | Location |
|-----------|----------|
| AI Bridge CLI | `../22-ai-bridge-cli/00-overview.md` |
| Vector Database Integration | `../22-ai-bridge-cli/01-backend/51-vector-database-integration.md` |
| RAG Re-indexing | `../22-ai-bridge-cli/01-backend/11-rag-reindexing.md` |
| Session-Scoped RAG Memory | `../22-ai-bridge-cli/01-backend/36-session-scoped-rag-memory.md` |
| Split DB Architecture | `../06-split-db-architecture/00-overview.md` |
| Error Code Registry | `../03-error-code-registry/00-overview.md` |
| Shared CLI Frontend (Tree Visualization) | `../28-shared-cli-frontend/16-tree-visualization.md` |
| Coding Guidelines | `../02-coding-guidelines/01-cross-language/00-overview.md` |
| Golang Standards | `../02-coding-guidelines/03-golang/00-overview.md` |

---

## Success Probability

| Component | Probability | Notes |
|-----------|-------------|-------|
| Code Parsing (AST) | 90% | Multi-language AST complexity |
| Document Parsing | 95% | Markdown heading hierarchy is straightforward |
| LLM Tree Construction | 88% | Depends on small model quality for metadata |
| Tree Traversal Accuracy | 85% | LLM reasoning quality varies by query complexity |
| SQLite Integration | 98% | Proven Split DB patterns |
| AI Bridge Integration | 95% | Well-defined existing API surface |
| **Overall** | **90%** | Lower due to LLM reasoning dependency |

---

*Specification created 2026-03-22 for AI Bridge Non-Vector RAG system.*
