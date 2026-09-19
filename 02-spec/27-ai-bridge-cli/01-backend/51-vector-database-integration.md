# Vector Database Integration Specification

**Version:** 5.0.0  
**Updated:** 2026-03-09  
**Status:** Draft  
**Error Range:** 9990-9999

---

## Overview

This specification defines the vector database integration layer for AI Bridge CLI, utilizing `chromem-go` for zero-dependency in-memory vector storage and Ollama for local embedding generation. The system targets <50ms query latency on 100k documents with 92-97% recall accuracy.

---

## Architecture Decision

### Why chromem-go?

| Criteria | chromem-go | Alternatives |
|----------|------------|--------------|
| **Dependencies** | Zero external | Weaviate/Pinecone require servers |
| **Portability** | Single binary | External services needed |
| **Latency** | <50ms | 100-500ms network overhead |
| **Cost** | Free | Paid tiers for scale |
| **Persistence** | SQLite-compatible | Proprietary formats |
| **Go Native** | Yes | SDK wrappers |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Latency | <50ms | P99 on 100k documents |
| Indexing Speed | 1000 chunks/min | Batch processing |
| Recall Accuracy | 92-97% | Benchmark suite |
| Memory Footprint | <500MB | 100k 768-dim vectors |

---

## Go Interfaces

### VectorStore Interface

```go
// VectorStore defines the core vector storage operations
type VectorStore interface {
    // Collection management
    CreateCollection(context stdctx.Context, name string, config CollectionConfig) *appfault.AppError
    DeleteCollection(context stdctx.Context, name string) *appfault.AppError
    ListCollections(context stdctx.Context) appfault.Result[[]CollectionInfo]
    
    // Document operations
    AddDocuments(context stdctx.Context, collection string, docs []Document) *appfault.AppError
    UpdateDocuments(context stdctx.Context, collection string, docs []Document) *appfault.AppError
    DeleteDocuments(context stdctx.Context, collection string, ids []string) *appfault.AppError
    
    // Search operations
    Query(context stdctx.Context, collection string, query QueryRequest) appfault.Result[QueryResult]
    QueryMultiple(context stdctx.Context, queries []MultiQueryRequest) appfault.Result[[]QueryResult]
    
    // Persistence
    Persist(context stdctx.Context) *appfault.AppError
    Load(context stdctx.Context, path string) *appfault.AppError
}

// CollectionConfig defines collection settings
type CollectionConfig struct {
    Dimension       int            `json:",omitempty"`  // Vector dimension (default: 768)
    DistanceMetric  distancemetrictype.Type `json:",omitempty"`  // Cosine, Euclidean, DotProduct
    EmbeddingModel  string         `json:",omitempty"`  // Model identifier
    PersistPath     string         `json:",omitempty"`  // SQLite storage path
}

// Package distancemetrictype defines the DistanceMetricType enum.
// Location: internal/enum/distancemetrictype/distancemetrictype.go
package distancemetrictype

type Type byte

const (
    Cosine     Type = iota // Cosine similarity
    Euclidean              // Euclidean distance
    DotProduct             // Dot product similarity
)

var variantLabels = map[Type]string{
    Cosine:     "Cosine",
    Euclidean:  "Euclidean",
    DotProduct: "DotProduct",
}

func (t Type) String() string {
    if label, ok := variantLabels[t]; ok {
        return label
    }
    return "Unknown"
}

func (t Type) Label() string {
    return t.String()
}

func Values() []Type {
    vals := make([]Type, 0, len(variantLabels))
    for v := range variantLabels {
        vals = append(vals, v)
    }
    return vals
}

func Parse(s string) appfault.Result[Type] {
    for k, v := range variantLabels {
        if strings.EqualFold(v, s) {
            return appfault.Ok(k)
        }
    }
    return appfault.FailNew[Type](
        ErrEnumInvalidVariant,
        "invalid DistanceMetricType: %q",
        s,
    )
}

// EXEMPTED: MarshalJSON implements json.Marshaler stdlib interface — must return ([]byte, error)
// EXEMPTED: MarshalJSON implements json.Marshaler stdlib interface — must return ([]byte, error)
func (t Type) MarshalJSON() ([]byte, error) {
    return json.Marshal(t.String())
}

// EXEMPTED: UnmarshalJSON implements json.Unmarshaler stdlib interface — must return error
func (t *Type) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return fmt.Errorf("DistanceMetricType unmarshal: %w", err)
    }
    parseResult := Parse(s)
    if parseResult.IsErr() {
        return parseResult.Err()
    }
    *t = parseResult.Value()
    return nil
}

// Document represents a vector document
type Document struct {
    Id         string            // Unique identifier
    Content    string            // Raw text content
    Embedding  []float32         // Pre-computed embedding (optional)
    Metadata   DocumentMetadata  // Structured metadata
    IsCritical bool              // Cannot skip during retrieval
    IsImportant bool             // Prioritized in ranking
}

// QueryRequest for vector search
type QueryRequest struct {
    Text       string            // Query text (will be embedded)
    Embedding  []float32         // Pre-computed query embedding (optional)
    TopK       int               // Number of results (default: 10)
    MinScore   float32           // Minimum similarity threshold
    Filters    []MetadataFilter  // Metadata filters
    IncludeCritical bool         // Always include IsCritical docs
}

// QueryResult contains search results
type QueryResult struct {
    Documents  []ScoredDocument
    QueryTime  time.Duration
    TotalDocs  int
}

// ScoredDocument with similarity score
type ScoredDocument struct {
    Document
    Score float32  // Similarity score (0-1)
}

// DocumentMetadata provides structured metadata for vector documents
type DocumentMetadata struct {
    FilePath   string    `json:",omitempty"`
    Language   string    `json:",omitempty"`
    Category   string    `json:",omitempty"`
    Tags       []string  `json:",omitempty"`
    UpdatedAt  time.Time `json:",omitempty"`
}

// MetadataFilter for filtering documents by metadata fields
type MetadataFilter struct {
    Field    string
    Operator string // Eq, Ne, Contains, Gt, Lt
    Value    string
}
```

### EmbeddingProvider Interface

```go
// EmbeddingProvider generates vector embeddings
type EmbeddingProvider interface {
    // Generate embedding for single text
    Embed(context stdctx.Context, text string) appfault.Result[[]float32]
    
    // Batch embedding generation
    EmbedBatch(context stdctx.Context, texts []string) appfault.Result[[][]float32]
    
    // Get embedding dimension
    Dimension() int
    
    // Get model identifier
    ModelId() string
    
    // Health check
    Ping(context stdctx.Context) *appfault.AppError
}

// OllamaEmbedder implements EmbeddingProvider for Ollama
type OllamaEmbedder struct {
    BaseUrl    string
    Model      string
    Dimension  int
    BatchSize  int
    Timeout    time.Duration
    httpClient *http.Client
}

// OpenAIEmbedder implements EmbeddingProvider for OpenAI API
type OpenAIEmbedder struct {
    ApiKey     string
    Model      string  // text-embedding-3-small, text-embedding-3-large
    Dimension  int
    BatchSize  int
    httpClient *http.Client
}
```

### ChromemStore Implementation

```go
// ChromemStore wraps chromem-go for VectorStore interface
type ChromemStore struct {
    db            *chromem.DB
    embedder      EmbeddingProvider
    persistPath   string
    collections   map[string]*chromem.Collection
    mu            sync.RWMutex
    logger        zerolog.Logger
    metrics       *VectorMetrics
}

// NewChromemStore creates a new vector store
func NewChromemStore(config ChromemConfig) appfault.Result[ChromemStore] {
    db := chromem.NewDb()
    
    embedderResult := createEmbedder(config.Embedding)
    if embedderResult.HasError() {
        return appfault.FailWrap[ChromemStore](
            embedderResult.Error(),
            ErrEmbedderInit,
            "failed to create embedder",
        )
    }
    
    store := &ChromemStore{
        db:          db,
        embedder:    embedderResult.Value(),
        persistPath: config.PersistPath,
        collections: make(map[string]*chromem.Collection),
        logger:      log.With().Str("Component", "VectorStore").Logger(),
        metrics:     NewVectorMetrics(),
    }
    
    // Load existing data if path exists
    if config.PersistPath != "" {
        loadErr := store.Load(stdctx.Background(), config.PersistPath)
        if loadErr != nil {
            store.logger.Warn().Err(loadErr).Msg("No existing data to load")
        }
    }
    
    return appfault.Ok(*store)
}

// ChromemConfig for store initialization
type ChromemConfig struct {
    PersistPath  string           // SQLite persistence path
    Embedding    EmbeddingConfig  // Embedding provider config
    DefaultTopK  int              // Default search results (10)
    CacheSize    int              // LRU cache size for embeddings
}

// EmbeddingConfig for provider selection
type EmbeddingConfig struct {
    Provider   string  // "ollama", "openai"
    Model      string  // Model name
    Dimension  int     // Vector dimension
    BaseUrl    string  // API base URL (Ollama)
    ApiKey     string  // API key (OpenAI)
    BatchSize  int     // Batch size for embedding
    Timeout    time.Duration
}
```

---

## Ollama Integration

### Configuration

```go
// OllamaConfig for local embedding server
type OllamaConfig struct {
    BaseUrl     string        // Default: http://localhost:11434
    Model       string        // Default: nomic-embed-text
    Dimension   int           // Default: 768
    BatchSize   int           // Default: 100
    Timeout     time.Duration // Default: 30s
    KeepAlive   string        // Model keep-alive duration
    NumParallel int           // Parallel requests
}

// Default Ollama configuration
var DefaultOllamaConfig = OllamaConfig{
    BaseUrl:     "http://localhost:11434",
    Model:       "nomic-embed-text",
    Dimension:   768,
    BatchSize:   100,
    Timeout:     30 * time.Second,
    KeepAlive:   "5m",
    NumParallel: 4,
}
```

### Embedding Request/Response

```go
// OllamaEmbedRequest for /api/embeddings endpoint
type OllamaEmbedRequest struct {
    Model   string
    Prompt  string
    Options OllamaEmbedOptions `json:",omitempty"`
}

// OllamaEmbedResponse from Ollama
type OllamaEmbedResponse struct {
    Embedding []float32
}

// OllamaEmbedOptions for Ollama embedding parameters
type OllamaEmbedOptions struct {
    NumCtx      int     `json:",omitempty"` // Context window size
    Temperature float32 `json:",omitempty"` // Sampling temperature
}

// Embed generates embedding via Ollama
func (o *OllamaEmbedder) Embed(context stdctx.Context, text string) appfault.Result[[]float32] {
    start := time.Now()
    
    req := OllamaEmbedRequest{
        Model:  o.Model,
        Prompt: text,
    }
    
    body, err := json.Marshal(req)
    if err != nil {
        return appfault.FailWrap[[]float32](
            err,
            ErrEmbedMarshal,
            "failed to marshal embed request",
        )
    }
    
    httpReq, err := http.NewRequestWithContext(
        context,
        http.MethodPost,
        o.BaseUrl+"/api/embeddings",
        bytes.NewReader(body),
    )
    if err != nil {
        return appfault.FailWrap[[]float32](
            err,
            ErrEmbedRequest,
            "failed to create HTTP request",
        )
    }
    
    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, err := o.httpClient.Do(httpReq)
    if err != nil {
        return appfault.FailWrap[[]float32](
            err,
            ErrOllamaConnection,
            "Ollama connection failed",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return appfault.FailNew[[]float32](
            ErrOllamaResponse,
            "unexpected status: %d", resp.StatusCode,
        )
    }
    
    var result OllamaEmbedResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return appfault.FailWrap[[]float32](
            err,
            ErrEmbedDecode,
            "failed to decode embed response",
        )
    }
    
    vectorEmbedDuration.Observe(time.Since(start).Seconds())
    vectorEmbedTotal.Inc()
    
    return appfault.Ok(result.Embedding)
}
```

### Batch Embedding with Parallelism

```go
// EmbedBatch generates embeddings in parallel
func (o *OllamaEmbedder) EmbedBatch(context stdctx.Context, texts []string) appfault.Result[[][]float32] {
    if len(texts) == 0 {
        return appfault.Ok[[][]float32](nil)
    }
    
    results := make([][]float32, len(texts))
    batchErrors := make([]*appfault.AppError, len(texts))
    
    sem := make(chan struct{}, o.NumParallel)
    var wg sync.WaitGroup
    
    for i, text := range texts {
        wg.Add(1)
        go func(idx int, t string) {
            defer wg.Done()
            
            sem <- struct{}{}
            defer func() { <-sem }()
            
            embedResult := o.Embed(context, t)
            if embedResult.HasError() {
                batchErrors[idx] = embedResult.Error()
                return
            }

            results[idx] = embedResult.Value()
        }(i, text)
    }
    
    wg.Wait()
    
    // Check for errors
    for i, appErr := range batchErrors {
        if appErr != nil {
            return appfault.FailWrap[[][]float32](
                appErr,
                ErrBatchEmbed,
                "failed at index %d", i,
            )
        }
    }
    
    return appfault.Ok(results)
}
```

---

## Database Schema

### VectorCollections Table (Root DB)

```sql
-- Registry of all vector collections
CREATE TABLE VectorCollections (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL UNIQUE,
    Dimension INTEGER NOT NULL DEFAULT 768,
    DistanceMetric TEXT NOT NULL DEFAULT 'cosine',
    EmbeddingModel TEXT NOT NULL,
    DocumentCount INTEGER DEFAULT 0,
    PersistPath TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxCollectionsName ON VectorCollections(Name);
```

### VectorDocuments Table (Per-Collection DB)

```sql
-- Vector documents within a collection
CREATE TABLE VectorDocuments (
    Id TEXT PRIMARY KEY,
    CollectionId TEXT NOT NULL,
    Content TEXT NOT NULL,
    Embedding BLOB NOT NULL,           -- float32 array serialized
    Metadata TEXT,                      -- JSON metadata
    IsCritical BOOLEAN DEFAULT 0,
    IsImportant BOOLEAN DEFAULT 0,
    TokenCount INTEGER,
    FilePath TEXT,
    LineStart INTEGER,
    LineEnd INTEGER,
    ContentHash TEXT,                   -- SHA256 for deduplication
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CollectionId) REFERENCES VectorCollections(Id)
);

CREATE INDEX IdxDocsCollection ON VectorDocuments(CollectionId);
CREATE INDEX IdxDocsCritical ON VectorDocuments(IsCritical);
CREATE INDEX IdxDocsImportant ON VectorDocuments(IsImportant);
CREATE INDEX IdxDocsFilepath ON VectorDocuments(FilePath);
CREATE INDEX IdxDocsHash ON VectorDocuments(ContentHash);
```

### EmbeddingCache Table (Root DB)

```sql
-- LRU cache for computed embeddings
CREATE TABLE EmbeddingCache (
    ContentHash TEXT PRIMARY KEY,
    Embedding BLOB NOT NULL,
    Model TEXT NOT NULL,
    TokenCount INTEGER,
    LastAccessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxCacheAccessed ON EmbeddingCache(LastAccessedAt);
```

---

## Seedable Configuration

### config.seed.json

```json
{
  "SeedVersion": 1,
  "Categories": {
    "Vector": {
      "Provider": "Ollama",
      "OllamaBaseUrl": "http://localhost:11434",
      "OllamaModel": "nomic-embed-text",
      "OpenaiModel": "text-embedding-3-small",
      "Dimension": 768,
      "BatchSize": 100,
      "DefaultTopK": 10,
      "MinSimilarityScore": 0.7,
      "CacheEnabled": true,
      "CacheSizeMb": 100,
      "CacheTtlHours": 168,
      "PersistEnabled": true
    },
    "Retrieval": {
      "CriticalWeight": 0.2,
      "ImportantWeight": 0.1,
      "SimilarityWeight": 0.7,
      "RecencyBoost": 0.05,
      "MaxContextTokens": 128000,
      "ChunkOverlapTokens": 64,
      "MaxChunkTokens": 512
    }
  }
}
```

### Typed Constants

```go
const (
    // Vector configuration keys
    KeyVectorProvider        = "Vector.Provider"
    KeyVectorOllamaBaseUrl   = "Vector.OllamaBaseUrl"
    KeyVectorOllamaModel     = "Vector.OllamaModel"
    KeyVectorOpenaiModel     = "Vector.OpenaiModel"
    KeyVectorDimension       = "Vector.Dimension"
    KeyVectorBatchSize       = "Vector.BatchSize"
    KeyVectorDefaultTopK     = "Vector.DefaultTopK"
    KeyVectorMinScore        = "Vector.MinSimilarityScore"
    KeyVectorCacheEnabled    = "Vector.CacheEnabled"
    KeyVectorCacheSizeMb     = "Vector.CacheSizeMb"
    KeyVectorCacheTtlHours   = "Vector.CacheTtlHours"
    KeyVectorPersistEnabled  = "Vector.PersistEnabled"
    
    // Retrieval configuration keys
    KeyRetrievalCriticalWeight   = "Retrieval.CriticalWeight"
    KeyRetrievalImportantWeight  = "Retrieval.ImportantWeight"
    KeyRetrievalSimilarityWeight = "Retrieval.SimilarityWeight"
    KeyRetrievalRecencyBoost     = "Retrieval.RecencyBoost"
    KeyRetrievalMaxContextTokens = "Retrieval.MaxContextTokens"
    KeyRetrievalChunkOverlap     = "Retrieval.ChunkOverlapTokens"
    KeyRetrievalMaxChunkTokens   = "Retrieval.MaxChunkTokens"
)
```

---

## Retrieval Scoring

### Weighted Ranking Formula

```go
// ScoreDocument calculates final relevance score
func (s *ChromemStore) ScoreDocument(doc ScoredDocument, config ScoringConfig) float32 {
    baseScore := doc.Score * config.SimilarityWeight
    
    if doc.IsCritical {
        baseScore += config.CriticalWeight
    }
    
    if doc.IsImportant {
        baseScore += config.ImportantWeight
    }
    
    // Recency boost (documents updated recently score higher)
    if config.RecencyBoost > 0 && doc.Metadata["UpdatedAt"] != nil {
        updatedAt, ok := doc.Metadata["UpdatedAt"].(time.Time)
        if ok {
            age := time.Since(updatedAt)
            if age < 24*time.Hour {
                baseScore += config.RecencyBoost
            } else if age < 7*24*time.Hour {
                baseScore += config.RecencyBoost * 0.5
            }
        }
    }
    
    return baseScore
}

// ScoringConfig for retrieval ranking
type ScoringConfig struct {
    SimilarityWeight float32 // Default: 0.7
    CriticalWeight   float32 // Default: 0.2
    ImportantWeight  float32 // Default: 0.1
    RecencyBoost     float32 // Default: 0.05
}
```

---

## API Endpoints

### Collection Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vector/collections` | Create collection |
| GET | `/api/v1/vector/collections` | List collections |
| GET | `/api/v1/vector/collections/{name}` | Get collection info |
| DELETE | `/api/v1/vector/collections/{name}` | Delete collection |

### Document Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vector/collections/{name}/documents` | Add documents |
| PUT | `/api/v1/vector/collections/{name}/documents` | Update documents |
| DELETE | `/api/v1/vector/collections/{name}/documents` | Delete documents |
| GET | `/api/v1/vector/collections/{name}/documents/{id}` | Get document |

### Search Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vector/search` | Vector similarity search |
| POST | `/api/v1/vector/search/batch` | Batch search queries |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vector/health` | Vector store health |
| GET | `/api/v1/vector/metrics` | Performance metrics |

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9990 | ErrVectorStoreInit | Vector store initialization failed |
| 9991 | ErrCollectionCreate | Collection creation failed |
| 9992 | ErrCollectionNotFound | Collection does not exist |
| 9993 | ErrDocumentAdd | Document addition failed |
| 9994 | ErrDocumentNotFound | Document does not exist |
| 9995 | ErrEmbedderInit | Embedding provider initialization failed |
| 9996 | ErrOllamaConnection | Cannot connect to Ollama |
| 9997 | ErrEmbedGeneration | Embedding generation failed |
| 9998 | ErrVectorSearch | Search operation failed |
| 9999 | ErrVectorPersist | Persistence operation failed |

### Error Implementation

```go
type VectorErrorCode int

const (
    ErrVectorStoreInit   VectorErrorCode = 9990
    ErrCollectionCreate  VectorErrorCode = 9991
    ErrCollectionNotFound VectorErrorCode = 9992
    ErrDocumentAdd       VectorErrorCode = 9993
    ErrDocumentNotFound  VectorErrorCode = 9994
    ErrEmbedderInit      VectorErrorCode = 9995
    ErrOllamaConnection  VectorErrorCode = 9996
    ErrEmbedGeneration   VectorErrorCode = 9997
    ErrVectorSearch      VectorErrorCode = 9998
    ErrVectorPersist     VectorErrorCode = 9999
)

// NewVectorError creates an *appfault.AppError with the given vector error code
func NewVectorError(code VectorErrorCode, cause error) *appfault.AppError {
    return appfault.Wrap(
        cause,
        int(code),
        vectorErrorMessages[code],
    ).
        WithSkip(1)
}
```

---

## Observability

### Prometheus Metrics

```go
var (
    vectorQueryDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "aibridge_vector_query_duration_seconds",
            Help:    "Vector search query duration",
            Buckets: []float64{0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0},
        },
        []string{"collection"},
    )
    
    vectorEmbedDuration = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Name:    "aibridge_vector_embed_duration_seconds",
            Help:    "Embedding generation duration",
            Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0},
        },
    )
    
    vectorDocumentCount = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "aibridge_vector_document_count",
            Help: "Number of documents per collection",
        },
        []string{"collection"},
    )
    
    vectorCacheHits = promauto.NewCounter(
        prometheus.CounterOpts{
            Name: "aibridge_vector_cache_hits_total",
            Help: "Embedding cache hits",
        },
    )
    
    vectorCacheMisses = promauto.NewCounter(
        prometheus.CounterOpts{
            Name: "aibridge_vector_cache_misses_total",
            Help: "Embedding cache misses",
        },
    )
)
```

---

## CLI Commands

```bash
# Collection management
aibridge vector collection create --name code --dimension 768
aibridge vector collection list
aibridge vector collection delete --name code

# Document operations
aibridge vector add --collection code --file ./src
aibridge vector add --collection code --text "inline content"
aibridge vector delete --collection code --id doc_123

# Search
aibridge vector search --collection code --query "error handling"
aibridge vector search --collection code --query "auth" --top-k 20

# Health and stats
aibridge vector health
aibridge vector stats --collection code

# Cache management
aibridge vector cache clear
aibridge vector cache stats
```

---

## Implementation Checklist

### Phase 2.1: Core Vector Store
- [ ] Implement `VectorStore` interface with chromem-go
- [ ] Create `ChromemStore` wrapper
- [ ] Add SQLite persistence layer
- [ ] Implement collection CRUD operations

### Phase 2.2: Ollama Integration
- [ ] Implement `OllamaEmbedder`
- [ ] Add batch embedding with parallelism
- [ ] Implement connection pooling
- [ ] Add health check endpoint

### Phase 2.3: Retrieval System
- [ ] Implement weighted scoring
- [ ] Add IsCritical/IsImportant filtering
- [ ] Implement recency boost
- [ ] Add metadata filtering

### Phase 2.4: Caching Layer
- [ ] Implement embedding cache table
- [ ] Add LRU eviction policy
- [ ] Implement cache TTL
- [ ] Add cache metrics

### Phase 2.5: API & CLI
- [ ] Implement REST endpoints
- [ ] Add CLI commands
- [ ] Add OpenAPI documentation
- [ ] Implement health endpoints

---

## Acceptance Criteria

| Requirement | Target | Validation |
|-------------|--------|------------|
| Query latency | <50ms P99 | Load test with 100k docs |
| Indexing speed | 1000 chunks/min | Benchmark suite |
| Recall accuracy | 92-97% | Test with known corpus |
| Memory usage | <500MB | Profile at 100k vectors |
| Cache hit rate | >80% | Monitor after warm-up |
| Ollama timeout | <30s | Integration tests |
| Zero dependencies | Yes | Go build verification |

---

## Cross-References

| Document | Path |
|----------|------|
| Long-Chain Command System | `02-spec/27-ai-bridge-cli/01-backend/50-long-chain-command-system.md` |
| RAG Architecture | `.ai-memory/memories/technical/rag-chunk-configuration.md` |
| Database Architecture | `02-spec/27-ai-bridge-cli/01-backend/12-database-architecture.md` |
| Settings Service | `02-spec/27-ai-bridge-cli/01-backend/57-settings-service.md` |
| Observability | `02-spec/27-ai-bridge-cli/01-backend/56-observability.md` |

---

*Specification follows AI Bridge CLI standards and PascalCase naming conventions.*
