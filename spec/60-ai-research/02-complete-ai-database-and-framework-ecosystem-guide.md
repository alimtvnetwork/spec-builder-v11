# Complete AI Database & Framework Ecosystem Guide

**Version:** 1.0.0  

## The Ultimate Reference for Vector Databases, SQL Analytics, and LLM Tools

**Last Updated:** 2026-03-09
**Purpose:** Production-ready comprehensive guide for AI engineers

---

# Table of Contents

## Part 1: Embedded & Lightweight Solutions
1. [chromem-go](#1-chromem-go---embedded-vector-database-for-go)

## Part 2: High-Performance Vector Search Libraries
2. [USearch](#2-usearch---universal-search-engine)
3. [Annoy](#3-annoy---spotify-approximate-nearest-neighbors)
4. [Faiss](#4-faiss---facebook-ai-similarity-search)

## Part 3: Production Vector Databases
5. [Qdrant](#5-qdrant---high-performance-vector-database)
6. [Milvus](#6-milvus---cloud-native-vector-database)
7. [Pinecone](#7-pinecone---managed-vector-database)

## Part 4: Hybrid Databases (SQL + Vectors)
8. [MongoDB Atlas Vector Search](#8-mongodb-atlas-vector-search)
9. [DuckDB with Vector Extension](#9-duckdb-with-vector-capabilities)

## Part 5: Go LLM Frameworks
10. [langchaingo](#10-langchaingo---langchain-for-go)
11. [LinGoose](#11-lingoose---go-ai-framework)
12. [golc](#12-golc---building-go-apps-with-llms)

## Part 6: LLM Inference
13. [llama.go](#13-llamago---llm-inference-in-pure-go)

---

# Part 1: Embedded & Lightweight Solutions

---

## 1. chromem-go - Embedded Vector Database for Go

**Repository:** https://github.com/philippgille/chromem-go
**Stars:** 841+ | **License:** MPL-2.0 | **Language:** Pure Go (zero dependencies)

### Overview

chromem-go is the **only pure-Go embedded vector database** with zero third-party dependencies. It brings the ChromaDB-like interface to Go, allowing you to add RAG capabilities without running a separate database. Think SQLite for vector search.

### Key Innovations

**Zero Dependencies:**
- No CGO required
- No external C/C++ libraries
- Single `go get` to install
- Cross-platform: Linux, macOS, Windows, WASM

**Performance:**
```
Benchmark Results (Intel i5-1135G7 @ 2.40GHz):
1,000 documents:   0.3 ms per query
100,000 documents: 40 ms per query

Memory: Minimal allocations, efficient GC
```

### Architecture & How It Works

**1. In-Memory Storage with Optional Persistence:**

```
┌──────────────────────────────────────────┐
│           Application (Go)                │
├──────────────────────────────────────────┤
│         chromem-go (Embedded)             │
│  ┌────────────────────────────────────┐  │
│  │  Collections (In-Memory)            │  │
│  │  ├─ Documents + Metadata            │  │
│  │  ├─ Vector Embeddings ([]float32)   │  │
│  │  └─ Cosine Similarity Index         │  │
│  └────────────────────────────────────┘  │
│             ↕                             │
│  ┌────────────────────────────────────┐  │
│  │  Optional Persistence (gob/gzip)    │  │
│  │  ├─ File per collection             │  │
│  │  ├─ File per document               │  │
│  │  └─ S3/Blob storage support         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**2. Search Algorithm:**

chromem-go uses **exhaustive nearest neighbor search** with cosine similarity:

```
Query Process:
1. Receive query embedding ([]float32)
2. Calculate cosine similarity with ALL vectors
   cos(A,B) = (A·B) / (||A|| × ||B||)
3. Filter by metadata if specified
4. Filter by document content if specified
5. Sort by similarity score
6. Return top K results

Time Complexity: O(n×d) where n=documents, d=dimensions
```

**3. Multi-threaded Processing:**

```go
// Uses Go's goroutines for parallel processing
collection.AddDocuments(ctx, docs, runtime.NumCPU()) // Parallel add

// Search is also parallelized internally
results, _ := collection.Query(ctx, query, k, nil, nil)
```

### Code Examples

#### Example 1: Minimal RAG (Quickstart)

```go
package main

import (
    "context"
    "fmt"
    "runtime"

    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()

    // Create in-memory database
    db := chromem.NewDB()

    // Create collection
    // Passing nil uses OpenAI embeddings (needs OPENAI_API_KEY env var)
    collection, err := db.CreateCollection("knowledge-base", nil, nil)
    if err != nil {
        panic(err)
    }

    // Add documents (embeddings created automatically)
    err = collection.AddDocuments(ctx, []chromem.Document{
        {
            ID:      "1",
            Content: "The sky is blue because of Rayleigh scattering.",
        },
        {
            ID:      "2",
            Content: "Leaves are green because chlorophyll absorbs red and blue light.",
        },
    }, runtime.NumCPU()) // Use all CPU cores
    if err != nil {
        panic(err)
    }

    // Query
    results, err := collection.Query(ctx, "Why is the sky blue?", 1, nil, nil)
    if err != nil {
        panic(err)
    }

    fmt.Printf("ID: %v\n", results[0].ID)
    fmt.Printf("Similarity: %v\n", results[0].Similarity)
    fmt.Printf("Content: %v\n", results[0].Content)
}
```

**Output:**
```
ID: 1
Similarity: 0.6833369
Content: The sky is blue because of Rayleigh scattering.
```

#### Example 2: Using Ollama (Local, Private)

```go
package main

import (
    "context"
    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()

    // Use Ollama for embeddings (runs locally, no API keys needed)
    embeddingFunc := chromem.NewEmbeddingFuncOllama(
        "http://localhost:11434/api/embeddings", // Ollama endpoint
        "all-minilm", // Model name
    )

    collection, _ := db.CreateCollection(
        "local-knowledge",
        nil, // No metadata
        embeddingFunc,
    )

    // Add documents
    collection.AddDocuments(ctx, []chromem.Document{
        {ID: "1", Content: "Go is a statically typed, compiled programming language."},
        {ID: "2", Content: "Python is dynamically typed and interpreted."},
    }, runtime.NumCPU())

    // Query
    results, _ := collection.Query(ctx, "Tell me about Go", 1, nil, nil)
    fmt.Println(results[0].Content)
}
```

#### Example 3: Metadata Filtering

```go
package main

import (
    "context"
    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()
    collection, _ := db.CreateCollection("products", nil, nil)

    // Add documents with metadata
    collection.AddDocuments(ctx, []chromem.Document{
        {
            ID:      "1",
            Content: "Wireless headphones with noise cancellation",
            Metadata: map[string]string{
                "category": "electronics",
                "price":    "299",
                "brand":    "Sony",
            },
        },
        {
            ID:      "2",
            Content: "Running shoes with comfortable cushioning",
            Metadata: map[string]string{
                "category": "sports",
                "price":    "120",
                "brand":    "Nike",
            },
        },
        {
            ID:      "3",
            Content: "Bluetooth speaker with deep bass",
            Metadata: map[string]string{
                "category": "electronics",
                "price":    "89",
                "brand":    "JBL",
            },
        },
    }, runtime.NumCPU())

    // Query with metadata filter
    whereMetadata := map[string]string{
        "category": "electronics", // Only electronics
    }

    results, _ := collection.Query(
        ctx,
        "audio devices",
        5,
        whereMetadata,
        nil,
    )

    for _, result := range results {
        fmt.Printf("%s - %s ($%s)\n",
            result.Metadata["brand"],
            result.Content,
            result.Metadata["price"])
    }
}
```

#### Example 4: Document Content Filtering

```go
package main

import (
    "context"
    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()
    collection, _ := db.CreateCollection("articles", nil, nil)

    collection.AddDocuments(ctx, []chromem.Document{
        {ID: "1", Content: "Machine learning with Python and TensorFlow"},
        {ID: "2", Content: "Web development using JavaScript and React"},
        {ID: "3", Content: "Data science with Python and pandas"},
    }, runtime.NumCPU())

    // $contains filter
    whereDocument := map[string]string{
        "$contains": "Python", // Only docs containing "Python"
    }

    results, _ := collection.Query(ctx, "programming", 5, nil, whereDocument)

    for _, result := range results {
        fmt.Println(result.Content)
    }
    // Output:
    // Machine learning with Python and TensorFlow
    // Data science with Python and pandas
}
```

#### Example 5: Persistence (Save/Load)

```go
package main

import (
    "context"
    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()

    // Create DB with persistence
    db := chromem.NewDB()

    // Create collection with auto-persistence
    collection, _ := db.CreateCollection(
        "persistent-data",
        nil,
        nil,
        chromem.WithPersistDirectory("./chromem-data"), // Save to disk
    )

    // Add documents (automatically saved)
    collection.AddDocuments(ctx, []chromem.Document{
        {ID: "1", Content: "Important data"},
    }, runtime.NumCPU())

    // ===== Later, in a new process =====

    // Load existing database
    db2, _ := chromem.NewPersistentDB("./chromem-data", false)

    // Get collection
    collection2, _ := db2.GetCollection("persistent-data", nil)

    // Query (data persisted!)
    results, _ := collection2.Query(ctx, "data", 1, nil, nil)
    fmt.Println(results[0].Content) // "Important data"
}
```

#### Example 6: Backup to S3

```go
package main

import (
    "bytes"
    "context"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/service/s3/s3manager"
    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()

    // ... add collections and documents ...

    // Export to buffer
    var buf bytes.Buffer
    db.ExportToWriter(&buf, true, "") // gzip=true, no encryption

    // Upload to S3
    uploader := s3manager.NewUploader(session)
    _, err := uploader.Upload(&s3manager.UploadInput{
        Bucket: aws.String("my-bucket"),
        Key:    aws.String("backups/chromem-backup.gob.gz"),
        Body:   &buf,
    })

    // ===== Restore from S3 =====

    // Download from S3
    downloader := s3manager.NewDownloader(session)
    var downloadBuf aws.WriteAtBuffer
    downloader.Download(&downloadBuf, &s3.GetObjectInput{
        Bucket: aws.String("my-bucket"),
        Key:    aws.String("backups/chromem-backup.gob.gz"),
    })

    // Import
    db2 := chromem.NewDB()
    reader := bytes.NewReader(downloadBuf.Bytes())
    db2.ImportFromReader(reader, "")
}
```

#### Example 7: Custom Embedding Function

```go
package main

import (
    stdctx "context"
    "github.com/philippgille/chromem-go"
)

// Custom embedding function
// EXEMPTED: chromem.EmbeddingFunc interface compliance requires ([]float32, error) signature
func myEmbeddingFunc(context stdctx.Context, text string) ([]float32, error) {
    // Call your custom embedding service
    // This could be a local model, different API, etc.

    resp, err := http.Post(
        "https://my-embedding-service.com/embed",
        "application/json",
        bytes.NewBuffer([]byte(`{"text": "`+text+`"}`)),
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result struct {
        Embedding []float32 `json:"embedding"`
    }
    json.NewDecoder(resp.Body).Decode(&result)

    return result.Embedding, nil
}

func main() {
    ctx := context.Background()
    db := chromem.NewDB()

    // Use custom embedding function
    collection, _ := db.CreateCollection(
        "custom-embeddings",
        nil,
        myEmbeddingFunc,
    )

    collection.AddDocuments(ctx, []chromem.Document{
        {ID: "1", Content: "Custom embeddings example"},
    }, runtime.NumCPU())
}
```

#### Example 8: Bring Your Own Embeddings

```go
package main

import (
    "context"
    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()

    // Create collection without embedding function
    collection, _ := db.CreateCollection("precomputed", nil, nil)

    // Generate embeddings yourself (or load from file)
    doc1Embedding := []float32{0.1, 0.2, 0.3, ...} // 384 dimensions
    doc2Embedding := []float32{0.4, 0.5, 0.6, ...}

    // Add documents with pre-computed embeddings
    collection.AddDocuments(ctx, []chromem.Document{
        {
            ID:        "1",
            Content:   "Document with precomputed embedding",
            Embedding: doc1Embedding,
        },
        {
            ID:        "2",
            Content:   "Another document",
            Embedding: doc2Embedding,
        },
    }, runtime.NumCPU())

    // Query with pre-computed query embedding
    queryEmbedding := []float32{0.15, 0.25, 0.35, ...}
    results, _ := collection.QueryEmbedding(ctx, queryEmbedding, 5, nil, nil)
}
```

### Supported Embedding Providers

**1. OpenAI (Default):**
```go
// Requires OPENAI_API_KEY env var
collection, _ := db.CreateCollection("name", nil, nil)
```

**2. Azure OpenAI:**
```go
embeddingFunc := chromem.NewEmbeddingFuncAzureOpenAI(
    "YOUR_API_KEY",
    "https://YOUR_INSTANCE.openai.azure.com/",
    "YOUR_DEPLOYMENT_NAME",
)
```

**3. Ollama (Local):**
```go
embeddingFunc := chromem.NewEmbeddingFuncOllama(
    "http://localhost:11434/api/embeddings",
    "all-minilm",
)
```

**4. Cohere:**
```go
embeddingFunc := chromem.NewEmbeddingFuncCohere(
    "YOUR_API_KEY",
    "embed-english-v3.0",
)
```

**5. Mistral:**
```go
embeddingFunc := chromem.NewEmbeddingFuncMistral(
    "YOUR_API_KEY",
    "mistral-embed",
)
```

**6. Google Vertex AI:**
```go
embeddingFunc := chromem.NewEmbeddingFuncVertex(
    "PROJECT_ID",
    "LOCATION",
    "textembedding-gecko@003",
)
```

**7. Jina:**
```go
embeddingFunc := chromem.NewEmbeddingFuncJina(
    "YOUR_API_KEY",
    "jina-embeddings-v2-base-en",
)
```

**8. mixedbread.ai:**
```go
embeddingFunc := chromem.NewEmbeddingFuncMixedbread(
    "YOUR_API_KEY",
    "mxbai-embed-large-v1",
)
```

### Advanced Features

#### WebAssembly Support

chromem-go compiles to WASM, enabling vector search in browsers:

```bash
GOOS=js GOARCH=wasm go build -o chromem.wasm
```

Use in JavaScript:
```javascript
// Load Go WASM
const go = new Go();
WebAssembly.instantiateStreaming(fetch("chromem.wasm"), go.importObject)
  .then((result) => {
    go.run(result.instance);
  });

// Now use chromem-go functions exposed to JS
```

### Pros ✅

1. **Pure Go:** Zero dependencies, no CGO, works everywhere Go works
2. **Embeddable:** No separate database to run or maintain
3. **Fast:** 0.3ms for 1k docs, 40ms for 100k docs
4. **Memory Efficient:** Minimal allocations, efficient GC
5. **Simple API:** ChromaDB-like interface, easy to learn
6. **Multi-threaded:** Leverages Go's goroutines for parallelism
7. **Flexible Embeddings:** 8+ providers supported + custom functions
8. **Persistence:** Optional file-based or blob storage
9. **Portable:** Cross-platform including WASM
10. **Production Ready:** Used in real projects, battle-tested

### Cons ❌

1. **Exhaustive Search:** O(n) complexity, slower for very large datasets (>1M docs)
2. **No ANN Index:** No HNSW, IVF, or other approximate algorithms
3. **Limited Scale:** Best for <1M documents (vs billions for Milvus/Qdrant)
4. **Single Node:** No distributed architecture
5. **Basic Filters:** Simple metadata and content filters only
6. **No GPU:** CPU-only, no CUDA/OpenCL acceleration
7. **Young Project:** Beta status, API may change before v1.0

### Problems It Solves

1. **Dependency Hell:** Pure Go, no C/C++ libraries to link
2. **Operational Complexity:** No database to deploy and maintain
3. **Prototyping Speed:** Add RAG to your Go app in minutes
4. **Privacy:** Keep embeddings local with Ollama
5. **Portability:** Deploy anywhere Go runs (including edge devices)
6. **Cost:** Free, no managed service fees
7. **Simple Use Cases:** Perfect for knowledge bases, chatbots, search

### When to Use chromem-go

✅ **Use chromem-go when:**
- Building Go applications
- Need embedded vector search (like SQLite)
- Dataset < 1 million documents
- Want zero dependencies and simple deployment
- Prototyping or MVP phase
- Privacy-sensitive applications (with Ollama)
- Running on edge devices or constrained environments

❌ **Don't use chromem-go when:**
- Need to scale beyond 1M documents
- Require distributed architecture
- Need lowest possible latency for billions of vectors
- Want advanced features (ANN indexes, GPU acceleration)
- Building language-agnostic systems (use Qdrant/Milvus)

### Real-World Use Cases

1. **Documentation Search:** Semantic search in internal docs
2. **Chatbots:** RAG-powered customer support bots
3. **Code Search:** Find similar code snippets
4. **Content Recommendation:** Suggest related articles
5. **Q&A Systems:** Answer questions from knowledge base
6. **Duplicate Detection:** Find similar items
7. **Personal AI:** Local, private AI assistants

### Performance Characteristics

**Benchmarks (Intel i5-1135G7):**

```
Documents    Query Time    Memory      Allocations
100          90 μs         5 KB        95
1,000        520 μs        13 KB       141
5,000        2.1 ms        47 KB       173
25,000       9.9 ms        211 KB      208
100,000      39.5 ms       810 KB      232
```

**Key Insights:**
- Linear scaling with document count
- Minimal memory allocations (efficient GC)
- Predictable performance characteristics
- No index build time (exhaustive search)

### Comparison with Alternatives

| Feature | chromem-go | Milvus | Qdrant | Chroma |
|---------|-----------|--------|--------|--------|
| **Language** | Pure Go | Go/C++ | Rust | Python |
| **Dependencies** | Zero | Many | Many | Many |
| **Embeddable** | ✅ Yes | ❌ No | ❌ No | ✅ Yes (Python) |
| **CGO Required** | ❌ No | ✅ Yes | N/A | N/A |
| **Scale** | <1M docs | Billions | Billions | Millions |
| **Deployment** | `go get` | K8s Cluster | Docker/K8s | `pip install` |
| **Performance** | Good | Excellent | Excellent | Good |
| **Best For** | Go Apps | Enterprise | Production | Python Apps |

---

## 2. USearch - Universal Search Engine

**Repository:** https://github.com/unum-cloud/usearch
**Stars:** 11k+ | **License:** Apache-2.0 | **Language:** C++ (10+ language bindings)

### Overview

USearch is a **smaller, faster alternative to FAISS** with native bindings for 10+ programming languages. It's a single-file similarity search engine optimized for performance and multi-language deployment.

### Key Differentiators

**Performance vs FAISS:**
```
Indexing 100M vectors (96 dimensions):
- FAISS:  2.6 hours, 9 GB RAM
- USearch: 0.3 hours, 4 GB RAM (9.6x faster, 2.25x less memory)

Indexing 100M vectors (1536 dimensions):
- FAISS:  5.0 hours
- USearch: 2.1 hours (2.3x faster)
```

**Codebase Size:**
- FAISS: 84,000 lines of code
- USearch: 3,000 lines of code (28x smaller, easier to maintain)

### Architecture & How It Works

**HNSW Algorithm (Hierarchical Navigable Small World):**

```
Graph Structure:
┌─────────────────────────────────────────┐
│  Layer 3 (Top)                          │
│  [Node A] ←─────────→ [Node B]          │  Long-range
│                                          │  connections
└─────────────────────────────────────────┘
         ↓                  ↓
┌─────────────────────────────────────────┐
│  Layer 2                                 │
│  [A] ←→ [C] ←→ [D] ←→ [B]               │  Medium-range
│                                          │  connections
└─────────────────────────────────────────┘
         ↓       ↓       ↓       ↓
┌─────────────────────────────────────────┐
│  Layer 1                                 │
│  [A]←→[C]←→[E]←→[D]←→[F]←→[B]           │  Short-range
│   ↕    ↕    ↕    ↕    ↕    ↕            │  connections
│  [G]←→[H]←→[I]←→[J]←→[K]←→[L]           │  (all nodes)
└─────────────────────────────────────────┘

Search Process:
1. Enter at top layer
2. Greedy search to closest node in layer
3. Drop to next layer
4. Repeat until bottom layer
5. Return K nearest neighbors

Time Complexity: O(log n) average case
```

**Memory Optimization:**

USearch uses custom 5-byte integers (`uint40_t`) for node references instead of 8-byte:
- Saves 37.5% memory
- Can address up to 1 trillion entries
- Hardware-specific optimizations (SIMD, AVX2, NEON)

### Code Examples

#### Python - Basic Usage

```python
import numpy as np
from usearch.index import Index

# Create index
index = Index(
    ndim=256,      # Vector dimensions
    metric='cos',  # Cosine similarity
    dtype='f32',   # Float32 precision
    connectivity=16,  # HNSW M parameter
    expansion_add=128,  # ef_construction
    expansion_search=64  # ef_search
)

# Generate sample vectors
n = 100000
vectors = np.random.rand(n, 256).astype('float32')

# Normalize for cosine similarity
from sklearn.preprocessing import normalize
vectors = normalize(vectors, norm='l2', axis=1)

# Add vectors with keys
keys = np.arange(n, dtype=np.longlong)
index.add(keys, vectors)

# Search
query = np.random.rand(256).astype('float32')
query = normalize(query.reshape(1, -1), norm='l2')[0]

matches = index.search(query, count=10)

print(f"Keys: {matches.keys}")
print(f"Distances: {matches.distances}")

# Save and load
index.save('vectors.usearch')
index_loaded = Index.restore('vectors.usearch')
```

#### Go Example

```go
package main

import (
    "fmt"
    "github.com/unum-cloud/usearch/golang"
)

func main() {
    // Create index
    index, err := usearch.NewIndex(usearch.Config{
        Metric:       usearch.MetricCos,
        Dimensions:   256,
        Connectivity: 16,
        Expansion:    128,
    })
    if err != nil {
        panic(err)
    }
    defer index.Destroy()

    // Add 100k vectors
    for i := 0; i < 100000; i++ {
        key := uint64(i)
        vector := make([]float32, 256)

        // Generate random vector
        for j := range vector {
            vector[j] = rand.Float32()
        }

        // Normalize for cosine
        var norm float32
        for _, v := range vector {
            norm += v * v
        }
        norm = float32(math.Sqrt(float64(norm)))
        for j := range vector {
            vector[j] /= norm
        }

        index.Add(key, vector)
    }

    // Search
    query := make([]float32, 256)
    for i := range query {
        query[i] = rand.Float32()
    }

    keys, distances, count := index.Search(query, 10)

    fmt.Printf("Found %d matches\n", count)
    for i := 0; i < count; i++ {
        fmt.Printf("Key: %d, Distance: %f\n", keys[i], distances[i])
    }

    // Save
    index.Save("vectors.usearch")
}
```

#### JavaScript/Node.js Example

```javascript
const { Index } = require('usearch');

// Create index
const index = new Index({
  metric: 'cos',
  connectivity: 16,
  dimensions: 256
});

// Add 100k vectors
for (let i = 0; i < 100000; i++) {
  const vector = new Float32Array(256);

  // Generate and normalize
  let norm = 0;
  for (let j = 0; j < 256; j++) {
    vector[j] = Math.random();
    norm += vector[j] * vector[j];
  }
  norm = Math.sqrt(norm);
  for (let j = 0; j < 256; j++) {
    vector[j] /= norm;
  }

  index.add(i, vector);
}

// Search
const query = new Float32Array(256).map(() => Math.random());

// Normalize query
let norm = 0;
for (let i = 0; i < 256; i++) {
  norm += query[i] * query[i];
}
norm = Math.sqrt(norm);
for (let i = 0; i < 256; i++) {
  query[i] /= norm;
}

const results = index.search(query, 10);

console.log('Top 10 matches:', results.keys);
console.log('Distances:', results.distances);

// Save
index.save('vectors.usearch');
```

### Advanced Features

#### 1. Quantization & Precision Levels

```python
from usearch.index import Index

# Different precision levels for memory optimization

# Float64 (highest precision, 8 bytes per element)
index_f64 = Index(ndim=256, dtype='f64')

# Float32 (standard, 4 bytes) - RECOMMENDED
index_f32 = Index(ndim=256, dtype='f32')

# Float16 (half precision, 2 bytes)
index_f16 = Index(ndim=256, dtype='f16')

# Int8 (quantized, 1 byte) - For cosine only
index_i8 = Index(ndim=256, dtype='i8', metric='cos')

# Binary (1 bit, extreme compression)
index_b1 = Index(ndim=256, dtype='b1', metric='hamming')

# Memory usage example (1M vectors, 384 dimensions):
# f64: 3 GB
# f32: 1.5 GB (standard)
# f16: 750 MB (2x smaller)
# i8:  400 MB (4x smaller)
# b1:  50 MB (32x smaller!)
```

#### 2. Multi-Index Parallel Search

```python
from usearch.index import Indexes

# Create multiple sharded indexes
indexes = Indexes(
    paths=['shard1.usearch', 'shard2.usearch', 'shard3.usearch']
)

# Search all shards in parallel
query = np.random.rand(256).astype('float32')
matches = indexes.search(query, count=10)

# Combines results from all shards automatically
print(matches.keys)
print(matches.distances)
```

#### 3. Exact Search (Small Datasets)

```python
# For datasets <10k, exact search can be faster
# USearch's SIMD-optimized brute force is 20x faster than FAISS

index = Index(ndim=256, metric='cos', dtype='f32')
index.add(keys, vectors)

# Force exact search
matches = index.search(query, count=10, exact=True)
```

#### 4. User-Defined Distance Metrics

```python
from numba import cfunc, types, carray
import numpy as np
from usearch.index import Index

# Define custom Haversine distance for geospatial data
@cfunc(types.float32(
    types.CPointer(types.float32),
    types.CPointer(types.float32)
))
def haversine_distance(a_ptr, b_ptr):
    """Calculate distance between GPS coordinates."""
    a = carray(a_ptr, 2)
    b = carray(b_ptr, 2)

    R = 6371.0  # Earth radius in km

    lat1, lon1 = np.radians(a[0]), np.radians(a[1])
    lat2, lon2 = np.radians(b[0]), np.radians(b[1])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a_val = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a_val))

    return R * c

# Create index with custom metric
index = Index(
    ndim=2,  # [latitude, longitude]
    metric=haversine_distance.address,  # Use function address
    dtype='f32'
)

# Add GPS coordinates
locations = np.array([
    [40.7128, -74.0060],  # New York
    [51.5074, -0.1278],   # London
    [35.6762, 139.6503],  # Tokyo
], dtype=np.float32)

keys = np.array([0, 1, 2], dtype=np.longlong)
index.add(keys, locations)

# Find nearest cities to Paris
paris = np.array([48.8566, 2.3522], dtype=np.float32)
matches = index.search(paris, 2)
```

#### 5. SQLite Integration

USearch provides SQLite extension for SQL-based vector search:

```sql
-- Load extension
.load usearch

-- Create virtual table
CREATE VIRTUAL TABLE product_embeddings USING usearch(
    embedding FLOAT[256],
    metric 'cos'
);

-- Insert vectors
INSERT INTO product_embeddings (rowid, embedding) VALUES
    (1, '[0.1, 0.2, 0.3, ...]'),
    (2, '[0.4, 0.5, 0.6, ...]');

-- Vector similarity search
SELECT rowid, distance
FROM product_embeddings
WHERE embedding MATCH '[0.15, 0.25, 0.35, ...]'
ORDER BY distance
LIMIT 10;

-- Join with regular tables
SELECT p.name, p.price, e.distance
FROM products p
JOIN product_embeddings e ON p.id = e.rowid
WHERE e.embedding MATCH '[...]'
ORDER BY e.distance
LIMIT 10;
```

### Supported Metrics

**Spatial Distances:**
- Cosine similarity (`cos`)
- Euclidean distance (`l2sq`)
- Inner product (`ip`)

**Binary Distances:**
- Hamming distance (`hamming`)
- Tanimoto/Jaccard (`tanimoto`)
- Sorensen-Dice (`sorensen`)

**Statistical:**
- Pearson correlation
- Divergences (KL, JS)

**Custom:**
- User-defined via Numba (Python)
- User-defined via function pointers (C/C++, Go, etc.)

### Pros ✅

1. **Performance:** 2-10x faster than FAISS
2. **Memory Efficient:** 2-4x less RAM usage
3. **Multi-Language:** Native bindings for 10+ languages
4. **Small Codebase:** 3K lines vs 84K (FAISS)
5. **Single-File:** Easy deployment
6. **Zero Dependencies:** Minimal external requirements
7. **SIMD Optimized:** Hardware acceleration (AVX2, NEON)
8. **Custom Metrics:** Support user-defined distances
9. **Quantization:** Multiple precision levels
10. **Cross-Platform:** Linux, macOS, Windows, iOS, Android, WASM

### Cons ❌

1. **Newer Project:** Less mature than FAISS
2. **Smaller Community:** Fewer resources
3. **Limited Index Types:** Only HNSW (vs 30+ in FAISS)
4. **No GPU Support:** CPU-only
5. **Documentation:** Less comprehensive than FAISS
6. **Single Node:** Not distributed

### When to Use USearch

✅ **Use USearch when:**
- Need multi-language support
- Want faster performance than FAISS
- Memory is constrained
- Building mobile/edge applications
- Custom distance metrics required
- Simple deployment is priority

❌ **Don't use USearch when:**
- Need GPU acceleration
- Require distributed architecture
- Need multiple index types (IVF, PQ, etc.)
- Established FAISS ecosystem is important

---

*(Continued in next response due to length...)*

I'll continue creating the comprehensive document with all remaining sections.
