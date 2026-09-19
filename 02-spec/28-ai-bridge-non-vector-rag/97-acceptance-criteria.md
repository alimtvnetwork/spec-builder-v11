# Non-Vector RAG: Acceptance Criteria

**Version:** 2.1.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

Testable acceptance criteria for the Non-Vector RAG (Tree-Structured Retrieval) system.

---

## Acceptance Criteria Index

| Group | Source Spec | Error Range |
|-------|-----------|-------------|
| AC-IDX: Indexing | `03-code-parser.md`, `04-document-parser.md`, `05-tree-indexing-engine.md` | 20000-20399 |
| AC-RET: Retrieval | `06-tree-retrieval-engine.md` | 20500-20507 |
| AC-SCR: Scoring & Weights | `06-tree-retrieval-engine.md` § Intent-Adaptive Weights | — |
| AC-BNK: Benchmarks & Regression | `11-performance-benchmarks.md` § Weight Tuning Methodology | — |
| AC-API: API Interface | `07-api-interface.md` | 20600-20604 |
| AC-INT: AI Bridge Integration | `10-ai-bridge-integration.md` | 20800-20802 |
| AC-STO: Storage & Performance | `02-tree-index-schema.md` | 20400-20404 |
| AC-RTR: Retrieval Router | `12-retrieval-router.md` | 20850-20854 |

---

## AC-IDX: Indexing

- [ ] **AC-IDX-01:** System shall parse Go source files using `go/parser` AST and produce tree nodes for packages, functions, methods, structs, and interfaces
- [ ] **AC-IDX-02:** System shall parse TypeScript/JavaScript files using regex+heuristic extraction and produce tree nodes for functions, classes, interfaces, and exports
- [ ] **AC-IDX-03:** System shall parse Markdown files by heading hierarchy and produce tree nodes at each heading depth level
- [ ] **AC-IDX-04:** System shall enrich each parsed node with LLM-generated metadata: title, description, keywords (3-10), category, subcategory, and importance score (0.0-1.0)
- [ ] **AC-IDX-05:** System shall batch-process nodes (configurable batch size, default 10) with parallel LLM calls (configurable concurrency, default 4)
- [ ] **AC-IDX-06:** System shall store enriched tree nodes in SQLite following the TreeNode schema with PascalCase column naming
- [ ] **AC-IDX-07:** System shall detect file changes via SHA-256 content hash and only re-index modified files during incremental mode
- [ ] **AC-IDX-08:** System shall complete full indexing of a 500-file codebase within 5 minutes
- [ ] **AC-IDX-09:** System shall skip import/require nodes from LLM enrichment and use deterministic metadata generation instead

---

## AC-RET: Retrieval

- [ ] **AC-RET-01:** System shall analyze user queries using a small LLM to extract intent (`find`, `explain`, `modify`, `debug`, `create`), keywords, categories, and depth preference
- [ ] **AC-RET-02:** System shall support three traversal strategies: greedy (single-path descent), beam (multi-path with configurable width), and hybrid (FTS5 pre-filter + tree walk)
- [ ] **AC-RET-03:** System shall automatically select the optimal traversal strategy based on query classification (structural → greedy, semantic → hybrid, broad → beam)
- [ ] **AC-RET-04:** System shall assemble retrieved content within a configurable token budget (default: 4000 tokens) and include traversal path for explainability
- [ ] **AC-RET-05:** System shall complete end-to-end retrieval (query analysis + traversal + assembly) within 2 seconds (P95)
- [ ] **AC-RET-06:** System shall return an empty result set (not an error) when no nodes score above the minimum threshold (error 20503 is informational, not a failure)

---

## AC-SCR: Scoring & Intent-Adaptive Weights

- [ ] **AC-SCR-01:** `MultiSignalScorer` shall select a weight preset based on the `QueryIntent` extracted during query analysis — no static/universal default shall be used
- [ ] **AC-SCR-02:** System shall ship five built-in weight presets (`find`, `explain`, `modify`, `debug`, `create`), each summing to exactly 1.00
- [ ] **AC-SCR-03:** Each preset shall distribute weights across exactly six signals: `KeywordOverlap`, `CategoryMatch`, `SubcategoryMatch`, `TitleRelevance`, `ImportanceWeight`, `DepthPenalty`
- [ ] **AC-SCR-04:** Weight presets shall be overridable via `config.seed.json` under `retrieval.weightPresets` without code changes
- [ ] **AC-SCR-05:** Custom intents registered at runtime shall be accepted by the scorer if their weights sum to 1.00 (±0.001 tolerance); reject otherwise with error 20506
- [ ] **AC-SCR-06:** The `find` preset shall allocate ≥0.35 to `KeywordOverlap` (highest among all presets) to prioritize exact term matching
- [ ] **AC-SCR-07:** The `debug` preset shall allocate ≥0.15 to `DepthPenalty` (highest among all presets) to surface implementation-level nodes
- [ ] **AC-SCR-08:** The `create` preset shall allocate ≥0.20 to `CategoryMatch` (highest among all presets) to enable category-driven discovery
- [ ] **AC-SCR-09:** The `explain` preset shall allocate ≥0.18 to `ImportanceWeight` to surface architecturally significant nodes
- [ ] **AC-SCR-10:** Final node score shall be clamped to the range [0.0, 1.0] regardless of input signal combination

---

## AC-BNK: Benchmarks & Regression Testing

### Labeled Dataset

- [ ] **AC-BNK-01:** A labeled query dataset of ≥100 queries shall be maintained, with a minimum of 15 queries per intent
- [ ] **AC-BNK-02:** Each labeled query shall include: natural language query, intent classification, expected node IDs, expected file paths, and per-node relevance grades (0–3 scale)
- [ ] **AC-BNK-03:** The dataset shall be validated against two independent codebases: a primary tuning set and a hold-out validation set

### NDCG Quality Thresholds

- [ ] **AC-BNK-04:** `find` queries shall achieve NDCG@5 ≥ 0.85 on the validation codebase
- [ ] **AC-BNK-05:** `explain` queries shall achieve NDCG@5 ≥ 0.75 on the validation codebase
- [ ] **AC-BNK-06:** `modify` queries shall achieve NDCG@5 ≥ 0.78 on the validation codebase
- [ ] **AC-BNK-07:** `debug` queries shall achieve NDCG@5 ≥ 0.80 on the validation codebase
- [ ] **AC-BNK-08:** `create` queries shall achieve NDCG@5 ≥ 0.70 on the validation codebase
- [ ] **AC-BNK-09:** Overall Precision@3 across all intents shall be ≥ 0.70

### Regression Testing

- [ ] **AC-BNK-10:** A weight regression test suite (`TestWeightRegression`) shall run on every PR that modifies `ScoreWeights`, `NodeScorer`, `QueryAnalyzer` prompts, or FTS5 query construction
- [ ] **AC-BNK-11:** The regression suite shall assert NDCG@5 ≥ per-intent threshold for all five intents; a single failure shall block merge
- [ ] **AC-BNK-12:** No single labeled query shall regress by more than 1 relevance grade compared to the frozen baseline; violations shall be logged with query ID

### Ablation & Tuning

- [ ] **AC-BNK-13:** Before finalizing any weight change, an ablation study shall zero out each signal independently and verify NDCG@5 delta > 0.02 (signal contributes meaningfully)
- [ ] **AC-BNK-14:** Signals with NDCG@5 delta < 0.02 when removed shall be flagged for review and documented in the tuning report
- [ ] **AC-BNK-15:** Each tuning run shall produce a structured report following the template in `11-performance-benchmarks.md`

---

## AC-API: API Interface

- [ ] **AC-API-01:** `POST /api/v1/tree-rag/index` shall accept appName, rootPath, mode (full/incremental/metadata-only), and return a job ID for async processing
- [ ] **AC-API-02:** `POST /api/v1/tree-rag/query` shall accept a natural language query and return ranked nodes with content, scores, and traversal path
- [ ] **AC-API-03:** `GET /api/v1/tree-rag/index/{appName}` shall return tree index status and statistics (node count, file count, categories)
- [ ] **AC-API-04:** `GET /api/v1/tree-rag/index/{appName}/tree` shall return the tree structure (without full content) for visualization
- [ ] **AC-API-05:** `DELETE /api/v1/tree-rag/index/{appName}` shall remove all tree data for the specified app
- [ ] **AC-API-06:** All API errors shall use the standard error envelope format with codes in the 20000-20999 range

---

## AC-INT: AI Bridge Integration

- [ ] **AC-INT-01:** Retrieval Router shall select between vector, tree, hybrid, or FTS5-only strategies based on query type and available indexes
- [ ] **AC-INT-02:** Tree index shall be classified as Tier 1 (Core Memory) and persist across session close events (except ClearAll)
- [ ] **AC-INT-03:** Hybrid mode shall deduplicate overlapping results from tree and vector retrieval by file path + line range overlap (>50%)
- [ ] **AC-INT-04:** CLI shall expose `tree-rag` subcommands: index, query, tree, status, reindex, delete

---

## AC-STO: Storage & Performance

- [ ] **AC-STO-01:** SQLite FTS5 virtual table shall be maintained via triggers for real-time full-text search capability
- [ ] **AC-STO-02:** FTS5 keyword search across 10,000 nodes shall complete within 5ms (P95)
- [ ] **AC-STO-03:** Tree index SQLite database shall not exceed 512MB (configurable limit)
- [ ] **AC-STO-04:** All database operations shall use GORM ORM (no direct `database/sql` imports)

---

## AC-RTR: Retrieval Router

- [ ] **AC-RTR-01:** Router shall classify queries into one of four classes (`exact`, `structural`, `semantic`, `broad`) using heuristic analysis with optional LLM fallback
- [ ] **AC-RTR-02:** Heuristic classifier shall bypass LLM when confidence ≥ 0.85 (configurable via `heuristicConfidenceBypass`)
- [ ] **AC-RTR-03:** Router shall select strategy based on the resolution matrix combining index availability and query class
- [ ] **AC-RTR-04:** Router shall execute fallback strategy when primary strategy returns zero results (max 1 retry)
- [ ] **AC-RTR-05:** Router shall track per-strategy P95 latency within a session and skip hybrid when P95 exceeds `maxHybridLatencyMs` (default: 3000ms)
- [ ] **AC-RTR-06:** User-specified strategy overrides shall take priority over all classification logic when `userOverrideEnabled` is true

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Retrieval Engine | `./06-tree-retrieval-engine.md` |
| Retrieval Router | `./12-retrieval-router.md` |
| Performance Benchmarks | `./11-performance-benchmarks.md` |
| API Interface | `./07-api-interface.md` |
| Error Codes | `./08-error-codes.md` |
| Configuration | `./09-configuration.md` |

---

*Acceptance criteria v2.0.0 — added AC-SCR (scoring/weights) and AC-BNK (benchmarks/regression) groups, indexed all criteria with IDs, added cross-reference index.*
