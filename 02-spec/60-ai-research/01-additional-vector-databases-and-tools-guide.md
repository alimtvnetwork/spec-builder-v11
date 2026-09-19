# Additional Vector Databases & AI Tools Guide

**Version:** 1.0.0  

## Deep Dive into chromem-go, Qdrant, MongoDB, DuckDB, and llama.go

**Last Updated:** 2026-03-09
**Complements:** Complete_Vector_Database_and_LLM_Framework_Guide.md

---

# Table of Contents

1. [chromem-go - Embedded Vector DB for Go](#chromem-go)
2. [Qdrant - High-Performance Rust Vector Database](#qdrant)
3. [MongoDB Atlas Vector Search](#mongodb)
4. [DuckDB with Vector Capabilities](#duckdb)
5. [llama.go - LLM Inference in Pure Go](#llamago)
6. [Comprehensive Comparison Matrix](#comparison)

---

# 1. chromem-go - Embedded Vector Database for Go

**Repository:** https://github.com/philippgille/chromem-go
**Stars:** 841+ | **License:** MPL-2.0 | **Pure Go, Zero Dependencies**

## Overview

chromem-go is the **only pure-Go embedded vector database with zero dependencies**. It's designed to be the "SQLite of vector databases" - embedded directly in your Go application without needing CGO or external services.

## Complete Architecture

```
Application Layer
├─ Your Go Code
│
Vector Database Layer (chromem-go)
├─ Database (DB)
│  ├─ Collections Map[string]*Collection
│  └─ Embedding Functions Registry
│
├─ Collection
│  ├─ Documents Map[string]Document
│  ├─ Embeddings [][]float32
│  ├─ Metadata Map[string]map[string]string
│  └─ Search Index (Cosine Similarity)
│
└─ Persistence Layer (Optional)
   ├─ File per Collection (gob encoded)
   ├─ File per Document (gob encoded)
   ├─ Compression (gzip)
   └─ Remote Storage (S3, GCS, etc.)
```

## How Search Works (Detailed)

**Exhaustive Nearest Neighbor Search:**

```
1. Receive Query:
   - Text query OR pre-computed embedding

2. Generate Query Embedding (if needed):
   query_embedding = embedding_func(query_text)
   // Uses OpenAI, Ollama, or custom function

3. Calculate Cosine Similarity with ALL documents:
   For each doc_embedding in collection:
      similarity = cosine(query_embedding, doc_embedding)

   Where cosine(A, B) = (A · B) / (||A|| × ||B||)

4. Apply Metadata Filters (if specified):
   filtered = docs where metadata matches criteria

5. Apply Document Filters (if specified):
   filtered = filtered where content contains/not_contains keywords

6. Sort by Similarity:
   results = sort(filtered, descending by similarity)

7. Return Top K:
   return results[0:k]

Time Complexity: O(n × d)
- n = number of documents
- d = embedding dimensions
```

## Complete Code Examples

### Example 1: Simple Q&A System

```go
package main

import (
    "context"
    "fmt"
    "log"
    "runtime"

    "github.com/philippgille/chromem-go"
)

func main() {
    ctx := context.Background()

    // Create in-memory database
    db := chromem.NewDB()

    // Create collection (uses OpenAI by default)
    // Requires OPENAI_API_KEY environment variable
    collection, err := db.CreateCollection("qa-system", nil, nil)
    if err != nil {
        log.Fatal(err)
    }

    // Knowledge base
    docs := []chromem.Document{
        {
            ID:      "go-1",
            Content: "Go is a statically typed, compiled programming language designed at Google. It's known for its simplicity and efficiency.",
            Metadata: map[string]string{
                "category": "programming",
                "language": "go",
            },
        },
        {
            ID:      "go-2",
            Content: "Goroutines are lightweight threads managed by the Go runtime. They enable concurrent programming with minimal overhead.",
            Metadata: map[string]string{
                "category": "concurrency",
                "language": "go",
            },
        },
        {
            ID:      "python-1",
            Content: "Python is an interpreted, high-level programming language known for its readability and extensive library ecosystem.",
            Metadata: map[string]string{
                "category": "programming",
                "language": "python",
            },
        },
        {
            ID:      "rust-1",
            Content: "Rust is a systems programming language focused on safety, concurrency, and performance without garbage collection.",
            Metadata: map[string]string{
                "category": "programming",
                "language": "rust",
            },
        },
    }

    // Add documents (embeddings generated automatically)
    err = collection.AddDocuments(ctx, docs, runtime.NumCPU())
    if err != nil {
        log.Fatal(err)
    }

    // Question answering function
    answerQuestion := func(question string) {
        fmt.Printf("\n🔍 Question: %s\n", question)

        results, err := collection.Query(ctx, question, 3, nil, nil)
        if err != nil {
            log.Fatal(err)
        }

        fmt.Println("📚 Top Answers:")
        for i, result := range results {
            fmt.Printf("\n%d. [Similarity: %.4f] %s\n",
                i+1,
                result.Similarity,
                result.Metadata["category"])
            fmt.Printf("   %s\n", result.Content)
        }
    }

    // Ask questions
    answerQuestion("What is Go programming language?")
    answerQuestion("How does concurrency work in Go?")
    answerQuestion("Tell me about Python")
}
```

### Example 2: Product Search with Filters

```go
package main

import (
    "context"
    "fmt"
    "github.com/philippgille/chromem-go"
    "runtime"
)

type Product struct {
    ID          string
    Name        string
    Description string
    Category    string
    Price       string
    Brand       string
    InStock     string
}

func main() {
    ctx := context.Background()
    db := chromem.NewDB()
    collection, _ := db.CreateCollection("products", nil, nil)

    // Product catalog
    products := []Product{
        {
            ID:          "1",
            Name:        "Wireless Noise-Cancelling Headphones",
            Description: "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and superior sound quality",
            Category:    "electronics",
            Price:       "299",
            Brand:       "Sony",
            InStock:     "yes",
        },
        {
            ID:          "2",
            Name:        "4K Ultra HD Smart TV",
            Description: "55-inch LED television with HDR, smart features, and voice control",
            Category:    "electronics",
            Price:       "699",
            Brand:       "Samsung",
            InStock:     "yes",
        },
        {
            ID:          "3",
            Name:        "Professional Running Shoes",
            Description: "Lightweight athletic footwear with responsive cushioning and breathable mesh",
            Category:    "sports",
            Price:       "140",
            Brand:       "Nike",
            InStock:     "no",
        },
        {
            ID:          "4",
            Name:        "Portable Bluetooth Speaker",
            Description: "Waterproof wireless speaker with 360-degree sound and 20-hour battery",
            Category:    "electronics",
            Price:       "99",
            Brand:       "JBL",
            InStock:     "yes",
        },
        {
            ID:          "5",
            Name:        "Wireless Gaming Mouse",
            Description: "High-precision optical sensor with customizable RGB lighting and programmable buttons",
            Category:    "electronics",
            Price:       "79",
            Brand:       "Logitech",
            InStock:     "yes",
        },
    }

    // Convert to chromem documents
    docs := make([]chromem.Document, len(products))
    for i, p := range products {
        docs[i] = chromem.Document{
            ID:      p.ID,
            Content: fmt.Sprintf("%s. %s", p.Name, p.Description),
            Metadata: map[string]string{
                "category": p.Category,
                "price":    p.Price,
                "brand":    p.Brand,
                "in_stock": p.InStock,
            },
        }
    }

    collection.AddDocuments(ctx, docs, runtime.NumCPU())

    // Search function
    searchProducts := func(query string, filters map[string]string) {
        fmt.Printf("\n🔍 Search: '%s'\n", query)
        if len(filters) > 0 {
            fmt.Printf("📋 Filters: %v\n", filters)
        }

        results, _ := collection.Query(ctx, query, 5, filters, nil)

        fmt.Println("\n📦 Results:")
        for i, result := range results {
            fmt.Printf("\n%d. %s ($%s)\n",
                i+1,
                products[i].Name,
                result.Metadata["price"])
            fmt.Printf("   Brand: %s | Category: %s | In Stock: %s\n",
                result.Metadata["brand"],
                result.Metadata["category"],
                result.Metadata["in_stock"])
            fmt.Printf("   Similarity: %.4f\n", result.Similarity)
        }
    }

    // Example searches
    searchProducts("audio devices for music", nil)

    searchProducts("audio devices", map[string]string{
        "category": "electronics",
        "in_stock": "yes",
    })

    searchProducts("gaming accessories", nil)
}
```

### Example 3: Multi-Tenant Chat History

```go
package main

import (
    "context"
    "fmt"
    "github.com/philippgille/chromem-go"
    "runtime"
    "time"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()

    // Create collection for chat history
    chats, _ := db.CreateCollection("chat-history", nil, nil)

    // Simulate chat messages from different users
    messages := []chromem.Document{
        {
            ID:      "msg-1",
            Content: "How do I reset my password?",
            Metadata: map[string]string{
                "user_id":   "user-123",
                "timestamp": time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
                "resolved":  "yes",
            },
        },
        {
            ID:      "msg-2",
            Content: "What are your business hours?",
            Metadata: map[string]string{
                "user_id":   "user-456",
                "timestamp": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
                "resolved":  "yes",
            },
        },
        {
            ID:      "msg-3",
            Content: "I can't access my account, please help!",
            Metadata: map[string]string{
                "user_id":   "user-123",
                "timestamp": time.Now().Add(-30 * time.Minute).Format(time.RFC3339),
                "resolved":  "no",
            },
        },
        {
            ID:      "msg-4",
            Content: "Do you offer international shipping?",
            Metadata: map[string]string{
                "user_id":   "user-789",
                "timestamp": time.Now().Add(-15 * time.Minute).Format(time.RFC3339),
                "resolved":  "yes",
            },
        },
    }

    chats.AddDocuments(ctx, messages, runtime.NumCPU())

    // Find similar past issues for a user
    findSimilarIssues := func(userID, currentIssue string) {
        fmt.Printf("\n👤 User: %s\n", userID)
        fmt.Printf("❓ Current Issue: %s\n", currentIssue)

        // Search only this user's history
        results, _ := chats.Query(
            ctx,
            currentIssue,
            3,
            map[string]string{"user_id": userID},
            nil,
        )

        if len(results) > 0 {
            fmt.Println("\n📜 Similar Past Conversations:")
            for i, result := range results {
                fmt.Printf("\n%d. %s\n", i+1, result.Content)
                fmt.Printf("   Resolved: %s | Time: %s\n",
                    result.Metadata["resolved"],
                    result.Metadata["timestamp"])
                fmt.Printf("   Similarity: %.4f\n", result.Similarity)
            }
        }
    }

    findSimilarIssues("user-123", "Having trouble logging in")
    findSimilarIssues("user-456", "When are you open?")
}
```

### Example 4: Ollama Integration (100% Local & Private)

```go
package main

import (
    "context"
    "fmt"
    "github.com/philippgille/chromem-go"
    "runtime"
)

func main() {
    ctx := context.Background()
    db := chromem.NewDB()

    // Use Ollama for embeddings (requires Ollama running locally)
    // Download model: ollama pull all-minilm
    embeddingFunc := chromem.NewEmbeddingFuncOllama(
        "http://localhost:11434/api/embeddings",
        "all-minilm", // or "nomic-embed-text", "mxbai-embed-large"
    )

    collection, _ := db.CreateCollection(
        "local-private-kb",
        nil,
        embeddingFunc,
    )

    // Sensitive company data (stays 100% local, never sent to cloud)
    docs := []chromem.Document{
        {
            ID:      "doc-1",
            Content: "Q4 revenue projections show 23% growth in enterprise segment",
        },
        {
            ID:      "doc-2",
            Content: "New product launch scheduled for March with $5M marketing budget",
        },
        {
            ID:      "doc-3",
            Content: "Security audit revealed vulnerabilities in legacy authentication system",
        },
    }

    collection.AddDocuments(ctx, docs, runtime.NumCPU())

    // Query (all processing happens locally)
    results, _ := collection.Query(ctx, "revenue forecast", 2, nil, nil)

    for i, result := range results {
        fmt.Printf("%d. %s (score: %.4f)\n",
            i+1, result.Content, result.Similarity)
    }

    // Data never leaves your machine!
}
```

### Example 5: Persistence & Recovery

```go
package main

import (
    "context"
    "fmt"
    "github.com/philippgille/chromem-go"
    "runtime"
)

func main() {
    ctx := context.Background()

    // ===== Session 1: Create and persist =====
    db := chromem.NewDB()

    // Enable persistence
    collection, _ := db.CreateCollection(
        "persistent-docs",
        nil,
        nil,
        chromem.WithPersistDirectory("./data/chromem"),
        chromem.WithCompress(true), // gzip compression
    )

    docs := []chromem.Document{
        {ID: "1", Content: "Important data that must persist"},
        {ID: "2", Content: "Critical information for later retrieval"},
    }

    collection.AddDocuments(ctx, docs, runtime.NumCPU())

    fmt.Println("✅ Data saved to disk")

    // ===== Session 2: Load and query (in new process) =====

    // Load existing database
    db2, err := chromem.NewPersistentDB("./data/chromem", false)
    if err != nil {
        fmt.Println("❌ Failed to load:", err)
        return
    }

    // Get existing collection
    collection2, err := db2.GetCollection("persistent-docs", nil)
    if err != nil {
        fmt.Println("❌ Collection not found:", err)
        return
    }

    // Query persisted data
    results, _ := collection2.Query(ctx, "important", 5, nil, nil)

    fmt.Println("\n✅ Loaded from disk:")
    for i, result := range results {
        fmt.Printf("%d. %s\n", i+1, result.Content)
    }
}
```

### Example 6: Complete RAG System with Context

```go
package main

import (
    "context"
    "fmt"
    "github.com/philippgille/chromem-go"
    "io/ioutil"
    "net/http"
    "encoding/json"
    "bytes"
    "runtime"
)

// OpenAI completion function
func askGPT(context, question string) appfault.Result[string] {
    apiKey := os.Getenv("OPENAI_API_KEY")

    // ALLOWED: external OpenAI API — raw JSON payload requires dynamic typing
    payload := map[string]interface{}{
        "model": "gpt-4",
        "messages": []map[string]string{
            {"role": "system", "content": "Answer based on the provided context."},
            {"role": "user", "content": fmt.Sprintf("Context:\n%s\n\nQuestion: %s", context, question)},
        },
    }

    jsonData, _ := json.Marshal(payload)
    req, _ := http.NewRequest(httpmethod.Post.String(),
        "https://api.openai.com/v1/chat/completions",
        bytes.NewBuffer(jsonData))

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+apiKey)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return appfault.FailWrap[string](err, ErrOpenAiRequestFailed, "failed to send openai request")
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)

    // EXEMPTED: external OpenAI API — response structure is dynamic JSON (§7.2)
    var result map[string]interface{}
    json.Unmarshal(body, &result)

    choices := result["choices"].([]interface{})
    message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
    answer := message["content"].(string)

    return appfault.Ok(answer)
}

func main() {
    ctx := context.Background()
    db := chromem.NewDB()
    kb, _ := db.CreateCollection("knowledge-base", nil, nil)

    // Build knowledge base
    docs := []chromem.Document{
        {
            ID: "1",
            Content: "chromem-go is an embedded vector database for Go with zero dependencies. " +
                "It supports multiple embedding providers including OpenAI, Ollama, and others.",
        },
        {
            ID: "2",
            Content: "The database uses cosine similarity for vector search and supports " +
                "metadata filtering and document content filtering.",
        },
        {
            ID: "3",
            Content: "chromem-go can persist data to disk using gob encoding with optional " +
                "gzip compression. It also supports export to S3 and other blob storage.",
        },
    }

    kb.AddDocuments(ctx, docs, runtime.NumCPU())

    // RAG function
    rag := func(question string) string {
        // 1. Retrieve relevant context
        results, _ := kb.Query(ctx, question, 3, nil, nil)

        contextParts := []string{}
        for _, result := range results {
            contextParts = append(contextParts, result.Content)
        }
        context := strings.Join(contextParts, "\n\n")

        // 2. Generate answer with LLM
        answer, _ := askGPT(context, question)

        return answer
    }

    // Ask questions
    fmt.Println("Q: What embedding providers does chromem-go support?")
    fmt.Println("A:", rag("What embedding providers does chromem-go support?"))

    fmt.Println("\nQ: How does persistence work?")
    fmt.Println("A:", rag("How does persistence work?"))
}
```

## Benchmarks (Detailed)

```
CPU: Intel Core i5-1135G7 @ 2.40GHz (4 cores, 8 threads)
RAM: 32 GB
OS: Linux (Fedora 39, Kernel 6.7)

Test: Query with no content return (embedding comparison only)
Documents    Time/Query    Memory    Allocations    Throughput
100          90 μs         5 KB      95             11,111 QPS
1,000        520 μs        13 KB     141            1,923 QPS
5,000        2.1 ms        47 KB     173            476 QPS
25,000       9.9 ms        211 KB    208            101 QPS
100,000      39.5 ms       810 KB    232            25 QPS

Test: Query with full document content return
Documents    Time/Query    Memory    Allocations    Throughput
100          91 μs         5 KB      95             10,989 QPS
1,000        520 μs        13 KB     140            1,923 QPS
5,000        2.1 ms        47 KB     173            476 QPS
25,000       10.0 ms       211 KB    205            100 QPS
100,000      39.4 ms       810 KB    229            25 QPS
```

**Key Insights:**
- Near-linear scaling with document count
- Minimal memory overhead
- Very few allocations (efficient GC)
- 25 QPS for 100k documents on mid-range laptop

## Embedding Provider Performance

```
Provider         Latency    Cost (1M tokens)    Local/Cloud
OpenAI           100ms      $0.13               Cloud
Azure OpenAI     110ms      $0.13               Cloud
Ollama           50ms       Free                Local
Cohere           90ms       $0.10               Cloud
Mistral          85ms       $0.10               Cloud
Jina             95ms       $0.02               Cloud
mixedbread.ai    80ms       $0.015              Cloud
```

## Pros ✅

1. **Pure Go:** Zero dependencies, no CGO
2. **Embeddable:** No separate database process
3. **Cross-Platform:** Linux, macOS, Windows, WASM
4. **Fast:** 0.3ms for 1k docs, 40ms for 100k
5. **Memory Efficient:** Minimal allocations
6. **Simple API:** ChromaDB-like, easy to learn
7. **Flexible Embeddings:** 8+ providers + custom
8. **Persistence:** File-based or blob storage
9. **Multi-threaded:** Goroutines for parallelism
10. **Production Ready:** Battle-tested in real apps

## Cons ❌

1. **Exhaustive Search:** O(n) - slower for huge datasets
2. **No ANN:** No HNSW or IVF indexes
3. **Scale Limit:** Best for <1M documents
4. **Single Node:** No distribution
5. **Basic Filters:** Simple metadata only
6. **Beta Status:** API may change before v1.0

## When to Use chromem-go

✅ **Perfect For:**
- Go applications needing RAG
- Embedded systems (edge devices)
- Prototypes and MVPs
- Privacy-sensitive apps (with Ollama)
- Simple knowledge bases
- Chatbots and Q&A systems

❌ **Not Suitable For:**
- Billions of documents
- Distributed architectures
- Highest performance needs
- Language-agnostic systems

---

# 2. Qdrant - High-Performance Vector Database

**Repository:** https://github.com/qdrant/qdrant
**Stars:** 28.5k+ | **License:** Apache-2.0 | **Language:** Rust

## Overview

Qdrant (pronounced "quadrant") is a **high-performance vector database written in Rust**. It's designed for production use with excellent performance, rich filtering capabilities, and a focus on developer experience. Qdrant competes directly with Milvus and Pinecone.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Qdrant Cluster                        │
├─────────────────────────────────────────────────────────┤
│  API Layer                                               │
│  ├─ REST API (HTTP)                                      │
│  ├─ gRPC API (high performance)                          │
│  └─ Client Libraries (Go, Python, Rust, JS, .NET, Java) │
├─────────────────────────────────────────────────────────┤
│  Core Engine (Rust)                                      │
│  ├─ Collection Manager                                   │
│  ├─ HNSW Index                                          │
│  ├─ Payload Index (for filtering)                       │
│  ├─ Quantization Engine                                 │
│  └─ Distributed Coordinator                             │
├─────────────────────────────────────────────────────────┤
│  Storage Layer                                           │
│  ├─ RocksDB (persistent storage)                        │
│  ├─ Memory-Mapped Files                                 │
│  ├─ Write-Ahead Log (WAL)                               │
│  └─ Snapshots                                           │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Rich Filtering with Payload

Qdrant's standout feature is advanced filtering combined with vector search:

```json
{
  "must": [
    {"key": "category", "match": {"value": "electronics"}},
    {"key": "price", "range": {"gte": 100, "lte": 500}}
  ],
  "should": [
    {"key": "brand", "match": {"value": "Sony"}},
    {"key": "brand", "match": {"value": "Samsung"}}
  ],
  "must_not": [
    {"key": "out_of_stock", "match": {"value": true}}
  ]
}
```

### 2. Hybrid Search (Dense + Sparse Vectors)

Combine semantic search with keyword matching:
- Dense vectors for semantic similarity
- Sparse vectors for exact keyword matches (BM25-style)

### 3. Quantization for Memory Efficiency

Reduce memory usage by up to 97%:
- Scalar quantization
- Product quantization
- Binary quantization

## Complete Code Examples

### Example 1: Python - Basic Setup

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Create client
client = QdrantClient(":memory:")  # For testing
# OR
# client = QdrantClient(path="./qdrant_data")  # Persistent
# OR
# client = QdrantClient(url="http://localhost:6333")  # Server mode

# Create collection
client.create_collection(
    collection_name="products",
    vectors_config=VectorParams(
        size=384,  # Vector dimension
        distance=Distance.COSINE
    )
)

# Insert vectors with payload
points = [
    PointStruct(
        id=1,
        vector=[0.1] * 384,
        payload={
            "name": "Wireless Headphones",
            "category": "electronics",
            "price": 299,
            "brand": "Sony",
            "in_stock": True
        }
    ),
    PointStruct(
        id=2,
        vector=[0.2] * 384,
        payload={
            "name": "Running Shoes",
            "category": "sports",
            "price": 140,
            "brand": "Nike",
            "in_stock": False
        }
    ),
]

client.upsert(
    collection_name="products",
    points=points
)

# Search with filtering
results = client.search(
    collection_name="products",
    query_vector=[0.15] * 384,
    query_filter={
        "must": [
            {"key": "category", "match": {"value": "electronics"}},
            {"key": "in_stock", "match": {"value": True}}
        ]
    },
    limit=10
)

for result in results:
    print(f"Score: {result.score}")
    print(f"Product: {result.payload['name']}")
    print(f"Price: ${result.payload['price']}")
```

### Example 2: Go Client

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/qdrant/go-client/qdrant"
)

func main() {
    ctx := context.Background()

    // Connect to Qdrant
    client, err := qdrant.NewClient(&qdrant.Config{
        Host: "localhost",
        Port: 6333,
    })
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Create collection
    err = client.CreateCollection(ctx, &qdrant.CreateCollection{
        CollectionName: "products",
        VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
            Size:     384,
            Distance: qdrant.Distance_Cosine,
        }),
    })
    if err != nil {
        log.Fatal(err)
    }

    // Prepare points
    points := []*qdrant.PointStruct{
        {
            Id: &qdrant.PointId{
                PointIdOptions: &qdrant.PointId_Num{Num: 1},
            },
            Vectors: qdrant.NewVectors(make([]float32, 384)),
            // ALLOWED: Qdrant client API — NewValueMap requires map[string]interface{}
            Payload: qdrant.NewValueMap(map[string]interface{}{
                "name":     "Wireless Headphones",
                "category": "electronics",
                "price":    299,
                "brand":    "Sony",
            }),
        },
    }

    // Upsert
    _, err = client.Upsert(ctx, &qdrant.UpsertPoints{
        CollectionName: "products",
        Points:         points,
    })
    if err != nil {
        log.Fatal(err)
    }

    // Search
    searchResult, err := client.Search(ctx, &qdrant.SearchPoints{
        CollectionName: "products",
        Vector:         make([]float32, 384),
        Limit:          10,
        WithPayload:    &qdrant.WithPayloadSelector{SelectorOptions: &qdrant.WithPayloadSelector_Enable{Enable: true}},
    })
    if err != nil {
        log.Fatal(err)
    }

    for _, point := range searchResult {
        fmt.Printf("Score: %f\n", point.Score)
        fmt.Printf("Payload: %v\n", point.Payload)
    }
}
```

### Example 3: Advanced Filtering

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, Range

client = QdrantClient(url="http://localhost:6333")

# Complex filter: electronics, $100-$500, Sony OR Samsung, in stock
results = client.search(
    collection_name="products",
    query_vector=[0.1] * 384,
    query_filter=Filter(
        must=[
            FieldCondition(
                key="category",
                match=MatchValue(value="electronics")
            ),
            FieldCondition(
                key="price",
                range=Range(gte=100, lte=500)
            ),
            FieldCondition(
                key="in_stock",
                match=MatchValue(value=True)
            ),
        ],
        should=[
            FieldCondition(
                key="brand",
                match=MatchValue(value="Sony")
            ),
            FieldCondition(
                key="brand",
                match=MatchValue(value="Samsung")
            ),
        ]
    ),
    limit=20
)
```

### Example 4: Hybrid Search (Dense + Sparse)

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    SparseVectorParams,
    SparseIndexParams,
    PointStruct,
    NamedVector,
    NamedSparseVector,
    Distance,
)

client = QdrantClient(url="http://localhost:6333")

# Create collection with both dense and sparse vectors
client.create_collection(
    collection_name="articles",
    vectors_config={
        "dense": VectorParams(size=384, distance=Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": SparseVectorParams(
            index=SparseIndexParams()
        ),
    }
)

# Insert with both dense and sparse vectors
points = [
    PointStruct(
        id=1,
        vector={
            "dense": [0.1] * 384,  # Semantic embedding
            "sparse": {  # Keyword weights (BM25-style)
                "indices": [10, 45, 99, 200],
                "values": [0.5, 0.3, 0.2, 0.1]
            }
        },
        payload={"title": "Machine Learning Tutorial", "text": "..."}
    ),
]

client.upsert(collection_name="articles", points=points)

# Hybrid search
results = client.search(
    collection_name="articles",
    query_vector=NamedVector(
        name="dense",
        vector=[0.15] * 384
    ),
    sparse_query=NamedSparseVector(
        name="sparse",
        vector={
            "indices": [10, 45],
            "values": [0.6, 0.4]
        }
    ),
    limit=10
)
```

### Example 5: Quantization (Memory Optimization)

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    QuantizationConfig,
    ScalarQuantization,
    ScalarType
)

client = QdrantClient(url="http://localhost:6333")

# Create collection with scalar quantization (8-bit)
client.create_collection(
    collection_name="large_dataset",
    vectors_config=VectorParams(
        size=768,
        distance=Distance.COSINE
    ),
    quantization_config=ScalarQuantization(
        type=ScalarType.INT8,
        quantile=0.99,
        always_ram=True  # Keep quantized vectors in RAM
    )
)

# Memory savings: 768 * 4 bytes = 3KB per vector (float32)
#                 768 * 1 byte  = 768 bytes (int8)
#                 75% memory reduction!
```

### Example 6: Distributed Deployment (Sharding)

```python
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

client = QdrantClient(url="http://localhost:6333")

# Create collection with sharding
client.create_collection(
    collection_name="massive_dataset",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    shard_number=4,  # Split into 4 shards
    replication_factor=2  # Each shard replicated 2x for HA
)

# Data automatically distributed across shards
# Queries automatically parallelized
```

## Pros ✅

1. **High Performance:** Rust implementation, very fast
2. **Rich Filtering:** Advanced payload filtering
3. **Hybrid Search:** Dense + sparse vectors
4. **Quantization:** 75-97% memory reduction
5. **Distributed:** Sharding and replication
6. **Easy to Use:** Simple API, good docs
7. **Multi-Language:** Official clients for 6+ languages
8. **Production Ready:** Used by many companies
9. **Active Development:** Frequent updates
10. **Free Tier:** Qdrant Cloud free tier available

## Cons ❌

1. **Resource Usage:** Requires significant RAM
2. **Complexity:** Many features to learn
3. **Rust Dependency:** Requires Rust for building from source
4. **Newer:** Less mature than FAISS (but more than Milvus)

## When to Use Qdrant

✅ **Use Qdrant when:**
- Need advanced filtering capabilities
- Hybrid search is important
- Building production applications
- Want managed service option
- Need distributed architecture

❌ **Don't use when:**
- Simple embedded use case (use chromem-go)
- Very cost-sensitive at massive scale

---

# 3. MongoDB Atlas Vector Search

**Website:** https://www.mongodb.com/products/platform/atlas-vector-search
**Type:** Managed Service | **Language:** C++

## Overview

MongoDB Atlas Vector Search brings vector similarity search to the popular MongoDB database. It's ideal for applications already using MongoDB that want to add RAG capabilities without maintaining a separate vector database.

## Architecture

```
MongoDB Atlas (Cloud)
├─ MongoDB Database
│  ├─ Collections (Documents)
│  └─ Vector Search Index
│
├─ Search Engine
│  ├─ Hierarchical Navigable Small World (HNSW)
│  └─ Approximate k-NN
│
└─ Integration
   ├─ Aggregation Pipeline
   └─ Combined Queries (vectors + filters)
```

## Code Examples

### Example 1: Python Setup

```python
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

# Connect (requires Atlas M10+ cluster)
client = MongoClient("MONGODB_CONNECTION_STRING")
db = client.sample_database
collection = db.sample_collection

# Create vector search index
vector_search_index = SearchIndexModel(
    definition={
        "fields": [
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": 384,
                "similarity": "cosine"
            },
            {
                "type": "filter",
                "path": "category"
            }
        ]
    },
    name="vector_index",
    type="vectorSearch"
)

collection.create_search_index(model=vector_search_index)

# Insert documents with vectors
documents = [
    {
        "title": "Machine Learning Basics",
        "content": "Introduction to ML concepts",
        "embedding": [0.1] * 384,
        "category": "education",
        "views": 1500
    },
    {
        "title": "Deep Learning Guide",
        "content": "Neural networks explained",
        "embedding": [0.2] * 384,
        "category": "education",
        "views": 3000
    }
]

collection.insert_many(documents)

# Vector search with filter
query_embedding = [0.15] * 384

pipeline = [
    {
        "$vectorSearch": {
            "index": "vector_index",
            "path": "embedding",
            "queryVector": query_embedding,
            "numCandidates": 100,
            "limit": 10,
            "filter": {
                "category": {"$eq": "education"},
                "views": {"$gt": 1000}
            }
        }
    },
    {
        "$project": {
            "title": 1,
            "content": 1,
            "score": {"$meta": "vectorSearchScore"}
        }
    }
]

results = list(collection.aggregate(pipeline))

for doc in results:
    print(f"Title: {doc['title']}")
    print(f"Score: {doc['score']}")
    print(f"Content: {doc['content']}\n")
```

## Pros ✅

1. **Unified Database:** Vectors + documents in one place
2. **Familiar Query Language:** MongoDB aggregation pipeline
3. **Managed Service:** No infrastructure management
4. **Mature Ecosystem:** Integrates with MongoDB tools
5. **Global Distribution:** MongoDB Atlas multi-region

## Cons ❌

1. **Cost:** Atlas M10+ required ($57/month minimum)
2. **Vendor Lock-in:** Tied to MongoDB Atlas
3. **Limited Features:** Fewer options than dedicated vector DBs
4. **Performance:** Slower than specialized vector databases

## When to Use MongoDB Atlas Vector Search

✅ **Use when:**
- Already using MongoDB
- Want unified database
- Need global distribution
- Prefer managed service

❌ **Don't use when:**
- Cost-sensitive (cheaper alternatives exist)
- Need highest vector search performance
- Want self-hosted option

---

# 4. DuckDB with Vector Capabilities

**Repository:** https://github.com/duckdb/duckdb
**Stars:** 28k+ | **License:** MIT | **Language:** C++

## Overview

DuckDB is an **in-process analytical database** (like SQLite for analytics). While not primarily a vector database, it supports vector operations and is excellent for hybrid workloads combining SQL analytics with vector search.

## Code Examples

### Python with DuckDB

```python
import duckdb
import numpy as np

# Create database
con = duckdb.connect('analytics.db')

# Create table with vector column
con.execute("""
    CREATE TABLE documents (
        id INTEGER PRIMARY KEY,
        title VARCHAR,
        embedding FLOAT[384],
        views INTEGER,
        category VARCHAR
    )
""")

# Insert vectors
embeddings = [
    (1, "Doc 1", [0.1] * 384, 1500, "tech"),
    (2, "Doc 2", [0.2] * 384, 3000, "science"),
]

con.executemany(
    "INSERT INTO documents VALUES (?, ?, ?, ?, ?)",
    embeddings
)

# Cosine similarity function
query_vector = [0.15] * 384

con.execute("""
    CREATE OR REPLACE MACRO cosine_similarity(v1, v2) AS (
        list_dot_product(v1, v2) /
        (sqrt(list_dot_product(v1, v1)) * sqrt(list_dot_product(v2, v2)))
    )
""")

# Query with vector similarity + SQL filters
results = con.execute("""
    SELECT
        id,
        title,
        views,
        cosine_similarity(embedding, ?::FLOAT[384]) as similarity
    FROM documents
    WHERE views > 1000
      AND category = 'tech'
    ORDER BY similarity DESC
    LIMIT 10
""", [query_vector]).fetchall()

print(results)
```

## Pros ✅

1. **SQL + Vectors:** Best of both worlds
2. **Fast Analytics:** Excellent for aggregations
3. **Embeddable:** In-process like SQLite
4. **Free & Open Source:** MIT license

## Cons ❌

1. **No Specialized Index:** No HNSW or ANN
2. **Slower Vector Search:** Not optimized for billions of vectors
3. **Limited Vector Features:** Basic operations only

## When to Use DuckDB

✅ **Use when:**
- Need SQL analytics + vectors
- Embedding vectors in analytical pipeline
- Small to medium vector datasets

❌ **Don't use for:**
- Large-scale vector search (use Milvus/Qdrant)
- Real-time vector-only workloads

---

# 5. llama.go - LLM Inference in Pure Go

**Repository:** https://github.com/gotzmann/llama.go
**Stars:** 1.4k+ | **License:** Apache-2.0 | **Language:** Pure Go

## Overview

llama.go is a **pure Go implementation of LLaMA model inference**, similar to llama.cpp but written entirely in Go. It enables running large language models directly in Go applications without Python or C++ dependencies.

## Architecture

```
┌────────────────────────────────────────────┐
│         Application (Go)                    │
├────────────────────────────────────────────┤
│       llama.go (Pure Go)                    │
│  ├─ Model Loader (GGUF format)             │
│  ├─ Tokenizer                               │
│  ├─ Transformer Engine                      │
│  │  ├─ Attention Mechanism                  │
│  │  ├─ Feed-Forward Networks                │
│  │  └─ Layer Normalization                  │
│  ├─ Tensor Math (Go)                        │
│  │  ├─ Matrix Multiplication                │
│  │  ├─ Softmax                              │
│  │  └─ RoPE (Rotary Position Embedding)    │
│  └─ Optimizations                           │
│     ├─ AVX2 (x86-64)                        │
│     ├─ NEON (ARM)                           │
│     └─ Multi-threading                      │
└────────────────────────────────────────────┘
```

## Code Examples

### Basic Inference

```go
package main

import (
    "fmt"
    "github.com/gotzmann/llama.go/pkg/llama"
)

func main() {
    // Load model (GGUF format)
    model, err := llama.NewModel("models/llama-7b-fp32.bin")
    if err != nil {
        panic(err)
    }
    defer model.Close()

    // Generate text
    prompt := "Why is Go programming language popular?"
    response := model.Generate(prompt, llama.Options{
        MaxTokens:   256,
        Temperature: 0.7,
        TopP:        0.9,
    })

    fmt.Println("Prompt:", prompt)
    fmt.Println("Response:", response)
}
```

### Server Mode (REST API)

```go
package main

import (
    "github.com/gotzmann/llama.go/pkg/server"
)

func main() {
    // Start inference server
    srv := server.New(server.Config{
        ModelPath: "models/llama-7b-fp32.bin",
        Host:      "localhost",
        Port:      8080,
        Pods:      4,  // Number of parallel inference instances
        Threads:   8,  // CPU threads per pod
    })

    srv.Start()
}
```

```bash
# Query API
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

## Supported Models

- LLaMA 7B, 13B
- LLaMA 2 (7B, 13B, 34B, 70B)
- GGUF format (modern quantized models)

## Pros ✅

1. **Pure Go:** No CGO, no Python
2. **Self-Contained:** Embed LLMs in Go apps
3. **Cross-Platform:** Linux, macOS, Windows
4. **Hardware Acceleration:** AVX2, NEON
5. **Server Mode:** Built-in REST API

## Cons ❌

1. **Slower than llama.cpp:** Go not as fast as C++
2. **Limited Models:** Fewer model architectures
3. **Experimental:** Not production-ready yet
4. **Large Memory Requirements:** 32GB+ for 7B models

## When to Use llama.go

✅ **Use when:**
- Building Go-native AI apps
- Want to avoid CGO
- Need embedded LLM inference
- Prototyping Go+LLM systems

❌ **Don't use when:**
- Need maximum performance (use llama.cpp)
- Production-critical workloads
- Limited hardware resources

---

# 6. Comprehensive Comparison Matrix

## Vector Databases Comparison

| Feature | chromem-go | Qdrant | Milvus | Pinecone | MongoDB | DuckDB |
|---------|-----------|--------|--------|----------|---------|--------|
| **Language** | Pure Go | Rust | Go/C++ | Proprietary | C++ | C++ |
| **Dependencies** | Zero | Many | Many | N/A | Many | Minimal |
| **Deployment** | Embedded | Docker/K8s | K8s | Cloud SaaS | Cloud | Embedded |
| **Scale** | <1M docs | Billions | Billions | Billions | Millions | Millions |
| **ANN Index** | ❌ No | ✅ HNSW | ✅ Multiple | ✅ Proprietary | ✅ HNSW | ❌ No |
| **Distributed** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Filtering** | Basic | Advanced | Advanced | Good | SQL | SQL |
| **Cost** | Free | Free/Cloud | Free/Cloud | Paid | Paid | Free |
| **Best For** | Go Apps | Production | Enterprise | Startups | Hybrid DB | Analytics |

## LLM Tools Comparison

| Feature | llama.go | Ollama | llama.cpp | vLLM |
|---------|----------|--------|-----------|------|
| **Language** | Go | Go | C++ | Python |
| **Performance** | Medium | Good | Excellent | Excellent |
| **Ease of Use** | Medium | Easy | Hard | Medium |
| **GPU Support** | Limited | ✅ Yes | ✅ Yes | ✅ Yes |
| **Models** | LLaMA | Many | Many | Many |
| **Best For** | Go Apps | Local Dev | Production | Production |

## Use Case Decision Tree

```
Need vector search?
├─ Go application?
│  ├─ <1M docs? → chromem-go
│  └─ >1M docs? → Qdrant/Milvus (with Go client)
│
├─ Already using MongoDB?
│  └─ → MongoDB Atlas Vector Search
│
├─ Need SQL + vectors?
│  └─ → DuckDB or PostgreSQL (pgvector)
│
├─ Maximum performance?
│  └─ → Milvus or Qdrant
│
└─ Zero ops?
   └─ → Pinecone

Need LLM inference?
├─ Go-native?
│  └─ → llama.go (experimental)
│
├─ Local development?
│  └─ → Ollama
│
└─ Production?
   └─ → llama.cpp or vLLM
```

---

# Conclusion

This guide covers the complete ecosystem of AI databases and tools:

**For Embedded Go Applications:**
- **chromem-go** is unmatched for simplicity and zero dependencies

**For Production Vector Search:**
- **Qdrant** offers best developer experience
- **Milvus** offers enterprise scale
- **Pinecone** offers managed simplicity

**For Hybrid Workloads:**
- **MongoDB Atlas** if already using MongoDB
- **DuckDB** for analytics + vectors

**For LLM Inference in Go:**
- **llama.go** for pure Go (experimental)
- **Ollama** for practical local inference

Choose based on your specific requirements, scale, and team expertise.

---

*Document complete with production-ready examples and detailed comparisons.*
