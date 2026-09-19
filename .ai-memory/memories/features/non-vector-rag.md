# Memory: features/non-vector-rag

**Updated:** 2026-03-22  
**Version:** 2.1.0  
**Spec Location:** `02-spec/23-ai-bridge-non-vector-rag/`

---

## Summary

Vectorless RAG system for AI Bridge that replaces embedding-based retrieval with tree-structured document indexing and LLM-guided tree traversal. Parses codebases into hierarchical trees (via AST for Go, regex for TS/JS/PHP/Python, heading hierarchy for Markdown), enriches each node with LLM-generated metadata (title, description, keywords, category, subcategory, importance score), stores in SQLite, and retrieves via greedy/beam/hybrid tree traversal strategies. A **Retrieval Router** classifies queries and selects the optimal strategy (vector, tree, hybrid, FTS5) at runtime. Scoring uses intent-adaptive weight presets tuned via grid search with NDCG regression gates.

---

## Key Points

- **No embeddings, no vector DB**: Uses SQLite + FTS5 instead of chromem-go
- **Tree construction**: Small LLM (llama3.1:8b) generates node metadata in batches
- **Retrieval strategies**: Greedy (single-path), Beam (multi-path), Hybrid (FTS5 + tree walk)
- **Retrieval Router** (`12-retrieval-router.md`): Heuristic + LLM query classifier (exact/structural/semantic/broad), strategy resolver matrix, adaptive latency guard (P95 < 3000ms), cascading fallback chain
- **Intent-adaptive scoring**: Five weight presets (find, explain, modify, debug, create) across six signals (KeywordOverlap, CategoryMatch, SubcategoryMatch, TitleRelevance, ImportanceWeight, DepthPenalty)
- **Weight tuning**: Grid search optimization with NDCG@5 thresholds per intent, ablation studies, CI-gated regression tests
- **Error codes**: 20000-20999 range (prefix AB-TR); router errors 20850-20854
- **15 spec files** covering architecture, schema, parsers, engines, API, config, benchmarks, retrieval router
- **60 acceptance criteria** across 8 groups: AC-IDX, AC-RET, AC-SCR, AC-BNK, AC-API, AC-INT, AC-STO, AC-RTR

---

## Spec Files

00-overview, 01-architecture, 02-tree-index-schema, 03-code-parser, 04-document-parser, 05-tree-indexing-engine, 06-tree-retrieval-engine, 07-api-interface, 08-error-codes, 09-configuration, 10-ai-bridge-integration, 11-performance-benchmarks, 97-acceptance-criteria, 99-consistency-report
