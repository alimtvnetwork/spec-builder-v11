# Non-Vector RAG: Configuration

**Version:** 2.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

Configuration schema for the Non-Vector RAG system. Follows the Seedable Config Architecture with changelog-driven defaults and per-project overrides.

---

## Configuration Schema

```yaml
# tree-rag-config.yaml
treeRag:
  # Indexing Configuration
  indexing:
    includePatterns:
      - "**/*.go"
      - "**/*.ts"
      - "**/*.tsx"
      - "**/*.js"
      - "**/*.jsx"
      - "**/*.py"
      - "**/*.php"
      - "**/*.md"
      - "**/*.yaml"
      - "**/*.yml"
      - "**/*.json"
    excludePatterns:
      - "**/vendor/**"
      - "**/node_modules/**"
      - "**/.git/**"
      - "**/dist/**"
      - "**/build/**"
      - "**/*.min.js"
      - "**/*.min.css"
    maxFileSize: 1048576          # 1MB per file
    maxDepth: 15                  # Directory traversal depth
    maxTotalFiles: 10000          # Safety limit

  # Parser Configuration
  parser:
    goParser:
      extractComments: true
      extractTests: false         # Skip _test.go files by default
    tsParser:
      extractJSX: true
      extractTests: false
    markdownParser:
      minBlockSize: 20            # Minimum chars to create a node
      splitLargeSections: true
      largeSectionThreshold: 500  # Lines before splitting

  # LLM Enrichment Configuration
  enrichment:
    model: "llama3.1:8b"
    fallbackModel: "gemma2:2b"
    batchSize: 10                 # Nodes per LLM call
    maxConcurrentCalls: 4         # Parallel LLM calls
    timeoutPerBatch: 30s
    retryAttempts: 2
    cacheEnabled: true
    importNodeShortcut: true      # Skip LLM for import nodes

  # Retrieval Configuration
  retrieval:
    defaultStrategy: "auto"       # auto, greedy, beam, hybrid
    beamWidth: 3
    maxDepth: 10
    maxResults: 10
    minScore: 0.3                 # Minimum node score threshold
    maxTokens: 4000               # Context window token budget
    reserveTokens: 1000           # Reserved for system prompt + query
    useFTS5PreFilter: true
    fts5MaxResults: 100

    # Retrieval Router Configuration (see 12-retrieval-router.md)
    router:
      defaultStrategy: "hybrid"
      confidenceThreshold: 0.6
      enableHybridMerge: true
      maxHybridLatencyMs: 3000
      userOverrideEnabled: true
      heuristicConfidenceBypass: 0.85
      llmClassifierModel: "llama3.1:8b"

    # Intent-Adaptive Weight Presets (AC-SCR-01 through AC-SCR-04)
    # Each preset must sum to exactly 1.00. Overrides merge with defaults.
    weightPresets:
      find:
        keywordOverlap: 0.40
        categoryMatch: 0.10
        subcategoryMatch: 0.10
        titleRelevance: 0.15
        importanceWeight: 0.15
        depthPenalty: 0.10
      explain:
        keywordOverlap: 0.25
        categoryMatch: 0.20
        subcategoryMatch: 0.10
        titleRelevance: 0.15
        importanceWeight: 0.20
        depthPenalty: 0.10
      modify:
        keywordOverlap: 0.30
        categoryMatch: 0.15
        subcategoryMatch: 0.10
        titleRelevance: 0.15
        importanceWeight: 0.20
        depthPenalty: 0.10
      debug:
        keywordOverlap: 0.35
        categoryMatch: 0.10
        subcategoryMatch: 0.10
        titleRelevance: 0.10
        importanceWeight: 0.15
        depthPenalty: 0.20
      create:
        keywordOverlap: 0.20
        categoryMatch: 0.25
        subcategoryMatch: 0.10
        titleRelevance: 0.15
        importanceWeight: 0.20
        depthPenalty: 0.10

  # Benchmark & Tuning Configuration (AC-BNK-01 through AC-BNK-15)
  benchmark:
    # Labeled dataset paths
    dataset:
      primaryPath: ""             # Path to labeled query JSON (primary tuning set)
      validationPath: ""          # Path to labeled query JSON (hold-out validation)
      minQueriesPerIntent: 15     # Minimum queries required per intent
      minTotalQueries: 100        # Minimum total labeled queries

    # NDCG@5 pass/fail thresholds per intent (AC-BNK-04 through AC-BNK-08)
    ndcgThresholds:
      find: 0.85
      explain: 0.75
      modify: 0.78
      debug: 0.80
      create: 0.70

    # Additional quality thresholds (AC-BNK-09)
    precisionAt3Min: 0.70         # Overall Precision@3 floor
    mrrThresholds:
      find: 0.90
      explain: 0.80
      modify: 0.82
      debug: 0.85
      create: 0.75

    # Regression test settings (AC-BNK-10 through AC-BNK-12)
    regression:
      enabled: true
      maxSingleQueryGradeDrop: 1  # Max relevance grade regression per query
      blockMergeOnFailure: true   # Fail CI if any threshold breached

    # Grid search bounds for weight tuning (AC-BNK-13 through AC-BNK-15)
    gridSearch:
      bounds:
        keywordOverlap:    { min: 0.10, max: 0.50, step: 0.05 }
        categoryMatch:     { min: 0.05, max: 0.30, step: 0.05 }
        subcategoryMatch:  { min: 0.05, max: 0.20, step: 0.05 }
        titleRelevance:    { min: 0.05, max: 0.25, step: 0.05 }
        importanceWeight:  { min: 0.05, max: 0.30, step: 0.05 }
        depthPenalty:      { min: 0.02, max: 0.20, step: 0.02 }
      sumTolerance: 0.001         # Acceptable deviation from 1.00
      topCandidates: 5            # Number of candidates to validate

    # Ablation study settings
    ablation:
      minDeltaToKeep: 0.02        # Minimum NDCG@5 drop to justify a signal
      reportTemplate: true        # Generate structured tuning report

  # Storage Configuration
  storage:
    databasePath: ""              # Default: Split DB project database
    walMode: true
    batchWriteSize: 100
    maxDatabaseSize: 536870912    # 512MB

  # Category Taxonomy (customizable per project)
  categories:
    - "authentication"
    - "database"
    - "api"
    - "business-logic"
    - "configuration"
    - "error-handling"
    - "ui-component"
    - "utility"
    - "testing"
    - "documentation"
    - "infrastructure"
    - "data-model"
    - "integration"
    - "performance"
    - "security"
    - "uncategorized"
```

---

## Environment Variable Overrides

| Variable | Config Path | Type |
|----------|-------------|------|
| `TREE_RAG_MODEL` | enrichment.model | string |
| `TREE_RAG_BATCH_SIZE` | enrichment.batchSize | int |
| `TREE_RAG_MAX_CONCURRENT` | enrichment.maxConcurrentCalls | int |
| `TREE_RAG_MAX_TOKENS` | retrieval.maxTokens | int |
| `TREE_RAG_STRATEGY` | retrieval.defaultStrategy | string |
| `TREE_RAG_DB_PATH` | storage.databasePath | string |
| `TREE_RAG_FTS5_ENABLED` | retrieval.useFTS5PreFilter | bool |
| `TREE_RAG_DATASET_PATH` | benchmark.dataset.primaryPath | string |
| `TREE_RAG_VALIDATION_PATH` | benchmark.dataset.validationPath | string |
| `TREE_RAG_REGRESSION_ENABLED` | benchmark.regression.enabled | bool |

---

## Go Config Struct

```go
type TreeRAGConfig struct {
    Indexing    IndexingConfig    `yaml:"indexing" json:"Indexing"`
    Parser      ParserConfig      `yaml:"parser" json:"Parser"`
    Enrichment  EnrichmentConfig  `yaml:"enrichment" json:"Enrichment"`
    Retrieval   RetrievalConfig   `yaml:"retrieval" json:"Retrieval"`
    Benchmark   BenchmarkConfig   `yaml:"benchmark" json:"Benchmark"`
    Storage     StorageConfig     `yaml:"storage" json:"Storage"`
    Categories  []string          `yaml:"categories" json:"Categories"`
}

type IndexingConfig struct {
    IncludePatterns []string `yaml:"includePatterns" json:"IncludePatterns"`
    ExcludePatterns []string `yaml:"excludePatterns" json:"ExcludePatterns"`
    MaxFileSize     int64    `yaml:"maxFileSize" json:"MaxFileSize"`
    MaxDepth        int      `yaml:"maxDepth" json:"MaxDepth"`
    MaxTotalFiles   int      `yaml:"maxTotalFiles" json:"MaxTotalFiles"`
}

type EnrichmentConfig struct {
    Model              string        `yaml:"model" json:"Model"`
    FallbackModel      string        `yaml:"fallbackModel" json:"FallbackModel"`
    BatchSize          int           `yaml:"batchSize" json:"BatchSize"`
    MaxConcurrentCalls int           `yaml:"maxConcurrentCalls" json:"MaxConcurrentCalls"`
    TimeoutPerBatch    time.Duration `yaml:"timeoutPerBatch" json:"TimeoutPerBatch"`
    RetryAttempts      int           `yaml:"retryAttempts" json:"RetryAttempts"`
    CacheEnabled       bool          `yaml:"cacheEnabled" json:"CacheEnabled"`
    ImportNodeShortcut bool          `yaml:"importNodeShortcut" json:"ImportNodeShortcut"`
}

type RetrievalConfig struct {
    DefaultStrategy   string                       `yaml:"defaultStrategy" json:"DefaultStrategy"`
    BeamWidth         int                          `yaml:"beamWidth" json:"BeamWidth"`
    MaxDepth          int                          `yaml:"maxDepth" json:"MaxDepth"`
    MaxResults        int                          `yaml:"maxResults" json:"MaxResults"`
    MinScore          float64                      `yaml:"minScore" json:"MinScore"`
    MaxTokens         int                          `yaml:"maxTokens" json:"MaxTokens"`
    ReserveTokens     int                          `yaml:"reserveTokens" json:"ReserveTokens"`
    UseFTS5PreFilter  bool                         `yaml:"useFTS5PreFilter" json:"UseFTS5PreFilter"`
    FTS5MaxResults    int                          `yaml:"fts5MaxResults" json:"FTS5MaxResults"`
    Router            RouterConfig                 `yaml:"router" json:"Router"`
    WeightPresets     map[string]ScoreWeightsConfig `yaml:"weightPresets" json:"WeightPresets"`
}

type RouterConfig struct {
    DefaultStrategy          string  `yaml:"defaultStrategy" json:"DefaultStrategy"`
    ConfidenceThreshold      float64 `yaml:"confidenceThreshold" json:"ConfidenceThreshold"`
    EnableHybridMerge        bool    `yaml:"enableHybridMerge" json:"EnableHybridMerge"`
    MaxHybridLatencyMs       int64   `yaml:"maxHybridLatencyMs" json:"MaxHybridLatencyMs"`
    UserOverrideEnabled      bool    `yaml:"userOverrideEnabled" json:"UserOverrideEnabled"`
    HeuristicConfidenceBypass float64 `yaml:"heuristicConfidenceBypass" json:"HeuristicConfidenceBypass"`
    LLMClassifierModel       string  `yaml:"llmClassifierModel" json:"LLMClassifierModel"`
}

type ScoreWeightsConfig struct {
    KeywordOverlap    float64 `yaml:"keywordOverlap" json:"KeywordOverlap"`
    CategoryMatch     float64 `yaml:"categoryMatch" json:"CategoryMatch"`
    SubcategoryMatch  float64 `yaml:"subcategoryMatch" json:"SubcategoryMatch"`
    TitleRelevance    float64 `yaml:"titleRelevance" json:"TitleRelevance"`
    ImportanceWeight  float64 `yaml:"importanceWeight" json:"ImportanceWeight"`
    DepthPenalty      float64 `yaml:"depthPenalty" json:"DepthPenalty"`
}

// Sum returns the total of all weights. Must equal 1.00 ± tolerance.
func (s ScoreWeightsConfig) Sum() float64 {
    return s.KeywordOverlap + s.CategoryMatch + s.SubcategoryMatch +
           s.TitleRelevance + s.ImportanceWeight + s.DepthPenalty
}

type BenchmarkConfig struct {
    Dataset    DatasetConfig    `yaml:"dataset" json:"Dataset"`
    NDCG       map[string]float64 `yaml:"ndcgThresholds" json:"NdcgThresholds"`
    Precision3 float64          `yaml:"precisionAt3Min" json:"PrecisionAt3Min"`
    MRR        map[string]float64 `yaml:"mrrThresholds" json:"MrrThresholds"`
    Regression RegressionConfig `yaml:"regression" json:"Regression"`
    GridSearch GridSearchConfig `yaml:"gridSearch" json:"GridSearch"`
    Ablation   AblationConfig   `yaml:"ablation" json:"Ablation"`
}

type DatasetConfig struct {
    PrimaryPath        string `yaml:"primaryPath" json:"PrimaryPath"`
    ValidationPath     string `yaml:"validationPath" json:"ValidationPath"`
    MinQueriesPerIntent int   `yaml:"minQueriesPerIntent" json:"MinQueriesPerIntent"`
    MinTotalQueries    int    `yaml:"minTotalQueries" json:"MinTotalQueries"`
}

type RegressionConfig struct {
    Enabled                 bool `yaml:"enabled" json:"Enabled"`
    MaxSingleQueryGradeDrop int  `yaml:"maxSingleQueryGradeDrop" json:"MaxSingleQueryGradeDrop"`
    BlockMergeOnFailure     bool `yaml:"blockMergeOnFailure" json:"BlockMergeOnFailure"`
}

type GridSearchConfig struct {
    Bounds        map[string]BoundConfig `yaml:"bounds" json:"Bounds"`
    SumTolerance  float64                `yaml:"sumTolerance" json:"SumTolerance"`
    TopCandidates int                    `yaml:"topCandidates" json:"TopCandidates"`
}

type BoundConfig struct {
    Min  float64 `yaml:"min" json:"Min"`
    Max  float64 `yaml:"max" json:"Max"`
    Step float64 `yaml:"step" json:"Step"`
}

type AblationConfig struct {
    MinDeltaToKeep float64 `yaml:"minDeltaToKeep" json:"MinDeltaToKeep"`
    ReportTemplate bool    `yaml:"reportTemplate" json:"ReportTemplate"`
}

type StorageConfig struct {
    DatabasePath    string `yaml:"databasePath" json:"DatabasePath"`
    WALMode         bool   `yaml:"walMode" json:"WALMode"`
    BatchWriteSize  int    `yaml:"batchWriteSize" json:"BatchWriteSize"`
    MaxDatabaseSize int64  `yaml:"maxDatabaseSize" json:"MaxDatabaseSize"`
}
```

---

## Validation Rules

| Rule | Config Path | Constraint |
|------|-------------|-----------|
| Weight sum | `retrieval.weightPresets.*` | Each preset must sum to 1.00 ± 0.001 |
| NDCG thresholds | `benchmark.ndcgThresholds.*` | Must be in range [0.0, 1.0] |
| MRR thresholds | `benchmark.mrrThresholds.*` | Must be in range [0.0, 1.0] |
| Grid bounds | `benchmark.gridSearch.bounds.*` | `min` < `max`, `step` > 0, `step` ≤ (`max` - `min`) |
| Ablation delta | `benchmark.ablation.minDeltaToKeep` | Must be > 0.0 |
| Grade drop cap | `benchmark.regression.maxSingleQueryGradeDrop` | Must be ≥ 1 |
| Dataset paths | `benchmark.dataset.*Path` | Must exist on disk when benchmark commands are invoked |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Retrieval Engine (Weight Presets) | `./06-tree-retrieval-engine.md` |
| Retrieval Router | `./12-retrieval-router.md` |
| Performance Benchmarks (Tuning Methodology) | `./11-performance-benchmarks.md` |
| Acceptance Criteria (AC-SCR, AC-BNK, AC-RTR) | `./97-acceptance-criteria.md` |
| Seedable Config Architecture | `../06-seedable-config-architecture/00-overview.md` |
| AI Bridge Configuration | `../27-ai-bridge-cli/01-backend/06-configuration.md` |

---

*Configuration v2.0.0 — added retrieval.weightPresets, benchmark section (dataset, NDCG/MRR thresholds, regression, grid search, ablation), validation rules, and Go structs.*
