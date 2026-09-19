# Non-Vector RAG: Performance Benchmarks

**Version:** 2.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

Performance targets and comparison benchmarks between tree-structured retrieval and vector-based RAG. These benchmarks guide implementation decisions and provide acceptance thresholds.

---

## Indexing Performance

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Go file parsing (1K LOC) | < 10ms | P95 over 100 files |
| TS/JS file parsing (1K LOC) | < 20ms | P95 over 100 files |
| Markdown parsing (500 lines) | < 5ms | P95 over 100 files |
| LLM enrichment (single node) | < 500ms | P95, llama3.1:8b |
| LLM enrichment (batch of 10) | < 2s | P95, llama3.1:8b |
| Full index (500 files) | < 5 min | End-to-end, 4 concurrent LLM |
| Full index (1000 files) | < 12 min | End-to-end, 4 concurrent LLM |
| Incremental index (10 changed files) | < 30s | Including LLM enrichment |

---

## Retrieval Performance

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Query analysis (LLM) | < 500ms | P95, llama3.1:8b |
| FTS5 pre-filter (10K nodes) | < 5ms | P95, SQLite WAL mode |
| Greedy traversal (depth 5) | < 200ms | P95, excluding LLM |
| Beam traversal (w=3, d=5) | < 500ms | P95, excluding LLM |
| Full retrieval (end-to-end) | < 2s | P95, including LLM calls |
| Context assembly | < 10ms | P95 |

---

## Comparison: Tree RAG vs Vector RAG

| Dimension | Tree RAG | Vector RAG (chromem-go) |
|-----------|----------|------------------------|
| **Indexing speed** | Slower (LLM enrichment) | Faster (embedding computation) |
| **Indexing cost** | Local LLM (free) | Local embedding (free) |
| **Retrieval latency** | 200ms-2s (LLM traversal) | <50ms (vector similarity) |
| **Retrieval accuracy** | Higher for structural queries | Higher for semantic similarity |
| **Explainability** | Full traversal path visible | Similarity score only |
| **Memory footprint** | SQLite on disk | In-memory vectors (~500MB/100K) |
| **Scaling** | Scales with SQLite (millions of nodes) | Memory-bound (~100K vectors) |
| **Context preservation** | Full hierarchy maintained | Context destroyed by chunking |
| **Query types** | Best: structural, navigational | Best: semantic, conceptual |
| **Cold start** | Instant (SQLite read) | Slow (load vectors into memory) |
| **Incremental update** | File-level granularity | Chunk-level granularity |

---

## Retrieval Accuracy Benchmarks

### Test Methodology

1. Create a benchmark codebase (500 Go files, known structure)
2. Define 50 test queries with expected results (manually curated)
3. Run each query through both retrieval systems
4. Compare retrieved content against expected results

### Expected Accuracy

| Query Type | Tree RAG | Vector RAG | Winner |
|------------|----------|------------|--------|
| "Where is X defined?" | 95% | 70% | Tree |
| "Show me the auth middleware" | 90% | 75% | Tree |
| "Code similar to this pattern" | 60% | 90% | Vector |
| "How does X work?" (broad) | 85% | 80% | Tree |
| "Find error handling for Y" | 88% | 82% | Tree |
| "Examples of retry logic" | 65% | 88% | Vector |
| **Overall** | **80%** | **81%** | **Tie** |
| **Structural queries only** | **92%** | **73%** | **Tree** |
| **Semantic queries only** | **62%** | **89%** | **Vector** |

### Hybrid Mode Accuracy

When using both strategies with result merging:

| Query Type | Hybrid Mode | Improvement over Best Single |
|------------|-------------|------------------------------|
| Structural | 93% | +1% |
| Semantic | 90% | +1% |
| Broad | 92% | +7% |
| **Overall** | **91%** | **+10%** |

---

## Resource Usage

### Storage

| Codebase Size | Tree Index Size | Vector Index Size |
|---------------|-----------------|-------------------|
| 100 files (50K LOC) | ~5MB | ~20MB |
| 500 files (250K LOC) | ~25MB | ~100MB |
| 1000 files (500K LOC) | ~50MB | ~200MB |
| 5000 files (2.5M LOC) | ~250MB | ~1GB+ |

### Memory (Runtime)

| Component | Memory Usage |
|-----------|-------------|
| Tree RAG service | ~50MB (SQLite connection + cache) |
| Vector RAG service | ~500MB (in-memory vectors for 100K docs) |
| Tree RAG + FTS5 | ~80MB (FTS5 index loaded) |

---

## Weight Tuning Benchmark Methodology

### Purpose

Empirically determine optimal intent-adaptive weight presets (see `06-tree-retrieval-engine.md`) by measuring retrieval quality against a labeled dataset. This replaces intuition-based weight selection with data-driven tuning.

---

### Step 1: Build the Labeled Query Dataset

Create a labeled dataset of **≥100 queries** across all five intents, each with human-curated expected results.

**Dataset schema:**

```json
{
  "queries": [
    {
      "id": "Q-001",
      "query": "Where is JWT token validation implemented?",
      "intent": "find",
      "expectedNodeIds": ["node-abc", "node-def"],
      "expectedFilePaths": ["internal/auth/jwt.go"],
      "relevanceGrade": {
        "node-abc": 3,
        "node-def": 2,
        "node-ghi": 1
      },
      "tags": ["authentication", "specific-function"]
    }
  ]
}
```

**Relevance grades (NDCG-compatible):**

| Grade | Meaning |
|-------|---------|
| 3 | **Perfect** — exactly what the user needs |
| 2 | **Good** — relevant, provides useful context |
| 1 | **Marginal** — tangentially related |
| 0 | **Irrelevant** — not useful |

**Minimum query distribution:**

| Intent | Min Queries | Coverage |
|--------|-------------|----------|
| `find` | 25 | Specific function/struct lookups, error code searches, config references |
| `explain` | 20 | Architecture questions, "how does X work", flow explanations |
| `modify` | 20 | "Change X to Y", refactoring requests, feature additions |
| `debug` | 20 | Error messages, stack trace matching, "why does X fail" |
| `create` | 15 | "Build a new endpoint like X", "add a handler similar to Y" |

**Codebase requirements:** Build the dataset against **two reference codebases** to avoid overfitting:

| Codebase | Size | Purpose |
|----------|------|---------|
| Primary (GSearch CLI) | ~500 files | Main tuning target |
| Validation (AI Bridge CLI) | ~300 files | Hold-out validation set |

---

### Step 2: Define Quality Metrics

**Primary metric: NDCG@K (Normalized Discounted Cumulative Gain)**

Measures ranking quality — are the best results ranked highest?

```
DCG@K = Σ(i=1 to K) [ relevanceGrade(i) / log₂(i + 1) ]
IDCG@K = DCG of ideal ranking
NDCG@K = DCG@K / IDCG@K
```

**K values:** Measure at K=3 (top results), K=5 (typical context window), K=10 (exhaustive).

**Secondary metrics:**

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Precision@K** | (relevant in top K) / K | Are top results relevant? |
| **Recall@K** | (relevant in top K) / (total relevant) | Are all relevant nodes found? |
| **MRR** | 1 / rank(first relevant) | How quickly is a relevant result found? |
| **Traversal efficiency** | (relevant visited) / (total visited) | How many wasted node visits? |
| **LLM call count** | Total LLM calls per query | Cost efficiency |
| **Latency P95** | 95th percentile end-to-end time | Speed |

**Minimum pass thresholds (per intent):**

| Metric | `find` | `explain` | `modify` | `debug` | `create` |
|--------|--------|-----------|----------|---------|----------|
| NDCG@5 | ≥ 0.85 | ≥ 0.75 | ≥ 0.78 | ≥ 0.80 | ≥ 0.70 |
| Precision@3 | ≥ 0.80 | ≥ 0.65 | ≥ 0.70 | ≥ 0.75 | ≥ 0.60 |
| MRR | ≥ 0.90 | ≥ 0.80 | ≥ 0.82 | ≥ 0.85 | ≥ 0.75 |

---

### Step 3: Grid Search Protocol

Systematically explore the weight space for each intent independently.

**Search bounds:**

| Signal | Min | Max | Step |
|--------|-----|-----|------|
| `KeywordOverlap` | 0.10 | 0.50 | 0.05 |
| `CategoryMatch` | 0.05 | 0.30 | 0.05 |
| `SubcategoryMatch` | 0.05 | 0.20 | 0.05 |
| `TitleRelevance` | 0.05 | 0.25 | 0.05 |
| `ImportanceWeight` | 0.05 | 0.30 | 0.05 |
| `DepthPenalty` | 0.02 | 0.20 | 0.02 |

**Constraint:** All weights MUST sum to exactly 1.00. Only evaluate combinations where `Σ(weights) = 1.00`.

**Procedure:**

```
for each intent in [find, explain, modify, debug, create]:
    1. Generate all valid weight combinations within bounds (sum = 1.0)
    2. For each combination:
       a. Configure scorer with these weights
       b. Run all queries for this intent against primary codebase
       c. Compute NDCG@5, Precision@3, MRR, traversal efficiency
       d. Record results
    3. Rank combinations by NDCG@5 (primary), break ties with MRR
    4. Select top-5 candidates
    5. Validate top-5 against validation codebase
    6. Select final weights = highest NDCG@5 on validation set
```

**Estimated search space:** ~500-1000 valid combinations per intent (after sum constraint). At ~50 queries per intent × 2s per query = ~25-50 hours total compute. Parallelize across intents.

---

### Step 4: Ablation Study

After grid search, validate that each signal contributes by measuring quality with each signal zeroed out:

```
for each intent:
    baseline = best weights from grid search
    for each signal in weights:
        ablated = baseline with signal set to 0, others re-normalized
        run all queries, compute NDCG@5
        delta = baseline_NDCG - ablated_NDCG
        record (signal, delta)
```

**Decision rules:**

| Delta (NDCG@5 drop) | Action |
|----------------------|--------|
| > 0.05 | Signal is critical — keep |
| 0.02–0.05 | Signal is useful — keep |
| < 0.02 | Signal is marginal — consider removing for simplicity |
| Negative (quality improves) | Signal is harmful — remove and re-run grid search |

---

### Step 5: Regression Test Suite

After finalizing weights, freeze the labeled dataset as a **regression test suite**:

```go
type WeightRegressionTest struct {
    DatasetPath     string  // Path to labeled query JSON
    MinNDCG5        float64 // Minimum acceptable NDCG@5 (per intent)
    MinPrecision3   float64
    MinMRR          float64
}

func TestWeightRegression(t *testing.T) {
    // 1. Load labeled dataset
    // 2. Run all queries with current weight presets
    // 3. Assert NDCG@5 >= threshold for each intent
    // 4. Assert no single query dropped more than 1 grade vs. baseline
    // 5. Log any regressions with query ID for investigation
}
```

**CI integration:** Run weight regression tests on every PR that modifies:
- `ScoreWeights` defaults
- `NodeScorer` logic
- `QueryAnalyzer` prompts
- FTS5 query construction

---

### Step 6: Continuous Tuning (Post-Launch)

**Telemetry signals for live weight adjustment:**

| Signal | Collection Method | Usage |
|--------|-------------------|-------|
| User clicked "wrong result" | UI feedback button | Negative label for that query |
| User refined query immediately | Session tracking | Indicates initial retrieval was poor |
| User used result successfully | Context was included in LLM response that user accepted | Positive label |
| Traversal dead-ends | Traversal reached leaves with score < 0.3 | Weight imbalance indicator |

**Re-tuning trigger:** When NDCG@5 on accumulated live feedback drops below thresholds for any intent, re-run grid search with the expanded dataset (original labeled + live feedback).

**Cadence:** Monthly review of live feedback metrics. Re-tune only when delta > 0.03 on any intent.

---

### Benchmark Execution Report Template

Each tuning run MUST produce a report following this structure:

```markdown
# Weight Tuning Report — {date}

## Dataset
- Queries: {count} ({per-intent breakdown})
- Primary codebase: {name} ({files} files, {nodes} nodes)
- Validation codebase: {name} ({files} files, {nodes} nodes)

## Results per Intent

### find
- Best NDCG@5: {score} (threshold: 0.85)
- Precision@3: {score}
- MRR: {score}
- Winning weights: KO={x} CM={x} SM={x} TR={x} IW={x} DP={x}
- Ablation: {signal with highest delta}

{repeat for each intent}

## Regression
- Queries regressed vs. previous: {count}/{total}
- Max single-query regression: {grade delta}

## Decision
- Weights updated: Yes/No
- Rationale: {reason}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Retrieval Engine | `./06-tree-retrieval-engine.md` |
| Retrieval Router | `./12-retrieval-router.md` |
| Vector DB Integration | `../27-ai-bridge-cli/01-backend/51-vector-database-integration.md` |
| Configuration | `./09-configuration.md` |

---

*Performance benchmarks specification updated 2026-03-22 — added weight tuning methodology.*
