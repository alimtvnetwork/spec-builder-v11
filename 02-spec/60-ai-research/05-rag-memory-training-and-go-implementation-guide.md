# RAG Memory: Long-Term Memory, Go Frameworks & Training

**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Part 2: Advanced Memory Systems & Production Implementation

**Continues from:** RAG_Memory_Systems_Complete_Guide.md
**Focus:** Long-term memory, Go framework implementations, training strategies

---

# Table of Contents

## Part 4: Long-Term Memory Systems
1. [Vector Store Memory](#1-vector-store-memory)
2. [Entity Memory](#2-entity-memory)
3. [Semantic Memory Architecture](#3-semantic-memory)
4. [Episodic Memory](#4-episodic-memory)

## Part 5: Go Framework Deep Dive
5. [langchaingo Memory System](#5-langchaingo-complete-memory)
6. [LinGoose Memory Implementation](#6-lingoose-memory)
7. [golc Memory Features](#7-golc-memory)
8. [Comparison & Best Practices](#8-go-framework-comparison)

## Part 6: Training & Fine-Tuning
9. [Training RAG Models](#9-training-rag-models)
10. [Fine-Tuning for Memory](#10-fine-tuning-strategies)
11. [Memory-Aware Prompting](#11-prompt-engineering)
12. [Embedding Model Training](#12-embedding-training)

## Part 7: Production Systems
13. [Complete RAG Architecture](#13-production-architecture)
14. [Memory Persistence Strategies](#14-persistence)
15. [Scaling Memory Systems](#15-scaling)
16. [Monitoring & Debugging](#16-monitoring)

---

# Part 4: Long-Term Memory Systems

---

## 1. Vector Store Memory

### What is Vector Store Memory?

**Vector store memory** is persistent, semantic memory that stores information as embeddings in a vector database. This is the **most important** memory type for RAG systems.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│  VECTOR STORE MEMORY SYSTEM                                 │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  INPUT LAYER                                          │  │
│  │  • Documents (text, code, structured data)           │  │
│  │  • User interactions                                  │  │
│  │  • Conversation logs                                  │  │
│  │  • Entity extractions                                 │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   ↓                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CHUNKING & PREPROCESSING                             │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Text Splitter                                  │  │  │
│  │  │  • Chunk size: 512-1024 tokens                  │  │  │
│  │  │  • Overlap: 50-200 tokens                       │  │  │
│  │  │  • Preserve semantic boundaries                 │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   ↓                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  EMBEDDING GENERATION                                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Embedding Model (e.g., text-embedding-3-small)│  │  │
│  │  │  Input: "How to deploy Go applications"        │  │  │
│  │  │  Output: [0.023, -0.154, 0.678, ... ] (1536D) │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   ↓                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VECTOR DATABASE                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Indexed Vectors (HNSW/IVF)                    │  │  │
│  │  │  • ID: doc_123                                  │  │  │
│  │  │  • Vector: [0.023, -0.154, ...]                │  │  │
│  │  │  • Metadata: {                                  │  │  │
│  │  │      "text": "To deploy Go apps...",           │  │  │
│  │  │      "source": "deployment_guide.md",          │  │  │
│  │  │      "timestamp": "2026-02-06",                │  │  │
│  │  │      "author": "team",                          │  │  │
│  │  │      "tags": ["go", "deployment", "docker"]    │  │  │
│  │  │    }                                            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RETRIEVAL LAYER                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Query: "How do I containerize my Go app?"     │  │  │
│  │  │    ↓                                            │  │  │
│  │  │  Embed query: [0.028, -0.149, 0.672, ...]     │  │  │
│  │  │    ↓                                            │  │  │
│  │  │  Similarity search (cosine/dot product)        │  │  │
│  │  │    ↓                                            │  │  │
│  │  │  Top K results (k=5):                          │  │  │
│  │  │    1. "Docker for Go" (score: 0.89)            │  │  │
│  │  │    2. "Multi-stage builds" (score: 0.85)       │  │  │
│  │  │    3. "Deployment best practices" (score: 0.82)│  │  │
│  │  │    4. "Go production checklist" (score: 0.78)  │  │  │
│  │  │    5. "CI/CD for Go" (score: 0.75)             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Complete Implementation with chromem-go

```go
package main

import (
    "context"
    "fmt"
    "runtime"
    "github.com/philippgille/chromem-go"
)

type VectorMemory struct {
    db             *chromem.DB
    collection     *chromem.Collection
    embeddingFunc  chromem.EmbeddingFunc
}

func NewVectorMemory(collectionName string) appfault.Result[*VectorMemory] {
    ctx := context.Background()
    db := chromem.NewDB()

    // Use Ollama for local, private embeddings
    embeddingFunc := chromem.NewEmbeddingFuncOllama(
        "http://localhost:11434/api/embeddings",
        "all-minilm",
    )

    collection, err := db.CreateCollection(
        collectionName,
        nil,
        embeddingFunc,
    )
    if err != nil {
        return appfault.FailWrap[*VectorMemory](err, ErrCollectionCreateFailed, "failed to create collection")
    }

    return appfault.Ok(&VectorMemory{
        db:            db,
        collection:    collection,
        embeddingFunc: embeddingFunc,
    })
}

// Store document in long-term memory
func (vm *VectorMemory) Store(
    id, content string,
    metadata map[string]string,
) error {
    ctx := context.Background()

    doc := chromem.Document{
        ID:       id,
        Content:  content,
        Metadata: metadata,
    }

    return vm.collection.AddDocuments(
        ctx,
        []chromem.Document{doc},
        runtime.NumCPU(),
    )
}

// Retrieve relevant memories
func (vm *VectorMemory) Retrieve(
    query string,
    topK int,
    filters map[string]string,
) appfault.Result[[]chromem.Result] {
    ctx := context.Background()

    return vm.collection.Query(
        ctx,
        query,
        topK,
        filters,
        nil,
    )
}

// Store conversation turn in long-term memory
func (vm *VectorMemory) StoreConversationTurn(
    turnID string,
    userQuery, aiResponse string,
    userID, sessionID string,
) error {

    // Store the full exchange
    content := fmt.Sprintf(
        "User: %s\nAssistant: %s",
        userQuery,
        aiResponse,
    )

    metadata := map[string]string{
        "user_id":    userID,
        "session_id": sessionID,
        "type":       "conversation",
        "timestamp":  time.Now().Format(time.RFC3339),
    }

    return vm.Store(turnID, content, metadata)
}

// Retrieve similar past conversations
func (vm *VectorMemory) RetrieveSimilarConversations(
    query string,
    userID string,
    topK int,
) appfault.Result[[]chromem.Result] {

    filters := map[string]string{
        "user_id": userID,
        "type":    "conversation",
    }

    return vm.Retrieve(query, topK, filters)
}
```

### Usage Example: Personal Assistant

```go
func main() {
    ctx := context.Background()

    // Initialize vector memory
    memory, _ := NewVectorMemory("assistant-memory")

    // === Populate knowledge base ===

    // Store factual knowledge
    memory.Store(
        "fact-1",
        "Go was created at Google by Robert Griesemer, Rob Pike, and Ken Thompson",
        map[string]string{
            "category": "facts",
            "topic":    "go-history",
        },
    )

    memory.Store(
        "fact-2",
        "Goroutines are lightweight threads managed by the Go runtime",
        map[string]string{
            "category": "facts",
            "topic":    "go-concurrency",
        },
    )

    // Store user preferences
    memory.Store(
        "pref-user-123",
        "User prefers detailed technical explanations with code examples. Interested in microservices and cloud deployment",
        map[string]string{
            "category": "preferences",
            "user_id":  "user-123",
        },
    )

    // === Simulate conversations ===

    // Turn 1: User asks about Go
    userQuery1 := "Tell me about Go programming language"

    // Retrieve relevant knowledge
    results, _ := memory.Retrieve(userQuery1, 3, nil)

    // Build context from retrieved memories
    context := buildContext(results)

    // Generate response with LLM (pseudo-code)
    aiResponse1 := generateResponse(context, userQuery1)

    // Store this conversation for future reference
    memory.StoreConversationTurn(
        "conv-1",
        userQuery1,
        aiResponse1,
        "user-123",
        "session-456",
    )

    // Turn 2: Days later, similar question
    userQuery2 := "What are goroutines?"

    // Retrieve both factual knowledge AND past conversations
    factResults, _ := memory.Retrieve(userQuery2, 2, map[string]string{
        "category": "facts",
    })

    pastConvs, _ := memory.RetrieveSimilarConversations(
        userQuery2,
        "user-123",
        2,
    )

    // The system "remembers" discussing Go previously
    // and can reference that context
}

func buildContext(results []chromem.Result) string {
    var context string
    for _, result := range results {
        context += fmt.Sprintf(
            "Context (similarity: %.3f): %s\n\n",
            result.Similarity,
            result.Content,
        )
    }
    return context
}
```

### Advanced: Hybrid Search (Semantic + Keyword)

```go
type HybridVectorMemory struct {
    vectorDB    *VectorMemory
    keywordDB   *KeywordIndex // e.g., Elasticsearch, SQLite FTS
}

func (hvm *HybridVectorMemory) HybridSearch(
    query string,
    topK int,
) []Document {

    // 1. Semantic search (vector similarity)
    semanticResults, _ := hvm.vectorDB.Retrieve(query, topK*2, nil)

    // 2. Keyword search (BM25 or similar)
    keywordResults := hvm.keywordDB.Search(query, topK*2)

    // 3. Reciprocal Rank Fusion (combine rankings)
    combined := reciprocalRankFusion(
        semanticResults,
        keywordResults,
        topK,
    )

    return combined
}

// Reciprocal Rank Fusion scoring
func reciprocalRankFusion(
    semanticResults []chromem.Result,
    keywordResults []Document,
    topK int,
) []Document {

    scores := make(map[string]float64)
    const k = 60 // RRF constant

    // Score from semantic results
    for rank, result := range semanticResults {
        scores[result.ID] += 1.0 / float64(k+rank+1)
    }

    // Score from keyword results
    for rank, result := range keywordResults {
        scores[result.ID] += 1.0 / float64(k+rank+1)
    }

    // Sort by combined score
    // (implementation details omitted for brevity)

    return topKDocuments
}
```

### Pros & Cons

✅ **Pros:**
- **Persistent:** Survives across all sessions
- **Scalable:** Handle millions of documents
- **Semantic:** Finds conceptually similar content
- **Flexible:** Filter by metadata
- **Shared:** All users access same knowledge

❌ **Cons:**
- **Latency:** 50-200ms per query
- **Cost:** Embedding generation costs
- **Complexity:** Requires vector DB setup
- **Accuracy:** Depends on embedding quality

### When to Use

✅ **Use for:**
- Knowledge bases
- Document repositories
- Historical conversation logs
- User preference storage
- Product catalogs
- FAQ systems

❌ **Don't use for:**
- Immediate conversation context (use short-term)
- Rapid state changes
- Exact keyword matching (use hybrid)

---

## 2. Entity Memory

### What is Entity Memory?

**Entity memory** stores structured information about specific entities (people, places, products, etc.) extracted from conversations and documents.

### Architecture

```
┌────────────────────────────────────────────────────────┐
│  ENTITY MEMORY SYSTEM                                   │
├────────────────────────────────────────────────────────┤
│                                                          │
│  Conversation: "I'm working with John on the API       │
│                 project. We're using PostgreSQL."       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ENTITY EXTRACTION                                │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Extracted Entities:                       │  │  │
│  │  │  • PERSON: "John"                          │  │  │
│  │  │  • PROJECT: "API project"                  │  │  │
│  │  │  • TECHNOLOGY: "PostgreSQL"                │  │  │
│  │  │                                             │  │  │
│  │  │  Relationships:                            │  │  │
│  │  │  • User WORKS_WITH John                    │  │  │
│  │  │  • User WORKING_ON "API project"           │  │  │
│  │  │  • "API project" USES PostgreSQL           │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                   ↓                                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ENTITY STORE (Graph or SQL Database)            │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Nodes:                                     │  │  │
│  │  │  ┌──────────────────┐                      │  │  │
│  │  │  │ User             │                       │  │  │
│  │  │  │ • name: "Alice"  │                       │  │  │
│  │  │  │ • role: "Dev"    │                       │  │  │
│  │  │  └──────────────────┘                       │  │  │
│  │  │         ↓ WORKS_WITH                        │  │  │
│  │  │  ┌──────────────────┐                      │  │  │
│  │  │  │ Person: John     │                       │  │  │
│  │  │  │ • role: "Backend"│                       │  │  │
│  │  │  └──────────────────┘                       │  │  │
│  │  │         ↓ WORKING_ON                        │  │  │
│  │  │  ┌──────────────────┐                      │  │  │
│  │  │  │ Project: API     │                       │  │  │
│  │  │  │ • status: "dev"  │                       │  │  │
│  │  │  │ • tech: "Go"     │                       │  │  │
│  │  │  └──────────────────┘                       │  │  │
│  │  │         ↓ USES                              │  │  │
│  │  │  ┌──────────────────┐                      │  │  │
│  │  │  │ Tech: PostgreSQL │                       │  │  │
│  │  │  │ • version: "15"  │                       │  │  │
│  │  │  └──────────────────┘                       │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Implementation with SQL + Vector Store

```go
package main

import (
    "context"
    // ALLOWED: LangChain Go entity memory — raw SQL for dynamic entity/relationship graph queries
    "database/sql"
    "encoding/json"
    "time"
)

type EntityType string

const (
    EntityTypePerson     EntityType = "person"
    EntityTypeProject    EntityType = "project"
    EntityTypeTechnology EntityType = "technology"
    EntityTypeProduct    EntityType = "product"
)

// EXEMPTED: LangChain Go entity memory library pattern — field names match library's JSON contract
type Entity struct {
    ID         string                 `json:"id"`          // EXEMPTED: LangChain Go
    Type       EntityType             `json:"type"`        // EXEMPTED: LangChain Go
    Name       string                 `json:"name"`        // EXEMPTED: LangChain Go
    // ALLOWED: LangChain Go entity memory — entity attributes are schemaless by design
    Attributes map[string]interface{} `json:"attributes"`  // EXEMPTED: LangChain Go
    CreatedAt  time.Time              `json:"created_at"`  // EXEMPTED: LangChain Go
    UpdatedAt  time.Time              `json:"updated_at"`  // EXEMPTED: LangChain Go
}

// EXEMPTED: LangChain Go entity memory library pattern
type Relationship struct {
    ID         string    `json:"id"`          // EXEMPTED: LangChain Go
    FromEntity string    `json:"from_entity"` // EXEMPTED: LangChain Go
    ToEntity   string    `json:"to_entity"`   // EXEMPTED: LangChain Go
    Type       string    `json:"type"`        // EXEMPTED: LangChain Go — WORKS_WITH, USES, etc.
    CreatedAt  time.Time `json:"created_at"`  // EXEMPTED: LangChain Go
}

type EntityMemory struct {
    db        *sql.DB
    vectorMem *VectorMemory
    llm       LLM
}

func NewEntityMemory(db *sql.DB, vectorMem *VectorMemory, llm LLM) *EntityMemory {
    return &EntityMemory{
        db:        db,
        vectorMem: vectorMem,
        llm:       llm,
    }
}

// Extract entities from conversation using LLM
func (em *EntityMemory) ExtractEntities(
    userID, conversationText string,
) appfault.Result[ExtractedEntities] {

    // Use LLM to extract structured entities
    prompt := fmt.Sprintf(`
Extract entities and relationships from this conversation:

"%s"

Return JSON with entities and relationships.
Entities should have: type, name, attributes
Relationships should have: from, to, type

Example output:
{
  "entities": [
    {"type": "person", "name": "John", "attributes": {"role": "backend"}},
    {"type": "project", "name": "API", "attributes": {"status": "development"}}
  ],
  "relationships": [
    {"from": "user", "to": "John", "type": "WORKS_WITH"},
    {"from": "John", "to": "API", "type": "WORKING_ON"}
  ]
}
`, conversationText)

    response := em.llm.Generate(prompt)

    // EXEMPTED: LangChain Go — struct fields match LLM JSON output schema
    var result struct {
        Entities      []Entity       `json:"entities"`      // EXEMPTED: LangChain Go
        Relationships []Relationship `json:"relationships"` // EXEMPTED: LangChain Go
    }

    json.Unmarshal([]byte(response), &result)

    return result.Entities, result.Relationships, nil
}

// Store entity
func (em *EntityMemory) StoreEntity(entity Entity) error {
    attributesJSON, _ := json.Marshal(entity.Attributes)

    _, err := em.db.Exec(`
        INSERT INTO entities (id, type, name, attributes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
            attributes = $4,
            updated_at = $6
    `, entity.ID, entity.Type, entity.Name, attributesJSON,
        time.Now(), time.Now())

    if err != nil {
        return err
    }

    // Also store in vector memory for semantic search
    metadata := map[string]string{
        "entity_id":   entity.ID,
        "entity_type": string(entity.Type),
        "user_id":     "", // If user-specific
    }

    return em.vectorMem.Store(
        entity.ID,
        fmt.Sprintf("%s: %s %v", entity.Type, entity.Name, entity.Attributes),
        metadata,
    )
}

// Store relationship
func (em *EntityMemory) StoreRelationship(rel Relationship) error {
    _, err := em.db.Exec(`
        INSERT INTO relationships (id, from_entity, to_entity, type, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
    `, rel.ID, rel.FromEntity, rel.ToEntity, rel.Type, time.Now())

    return err
}

// Get entity with relationships
func (em *EntityMemory) GetEntityGraph(entityID string, depth int) appfault.Result[*EntityGraph] {
    // Recursive query to get entity and related entities
    query := `
        WITH RECURSIVE entity_graph AS (
            -- Base case: starting entity
            SELECT id, type, name, attributes, 0 as depth
            FROM entities
            WHERE id = $1

            UNION ALL

            -- Recursive case: related entities
            SELECT e.id, e.type, e.name, e.attributes, eg.depth + 1
            FROM entities e
            JOIN relationships r ON (r.to_entity = e.id OR r.from_entity = e.id)
            JOIN entity_graph eg ON (r.from_entity = eg.id OR r.to_entity = eg.id)
            WHERE eg.depth < $2
        )
        SELECT DISTINCT * FROM entity_graph
    `

    rows, err := em.db.Query(query, entityID, depth)
    if err != nil {
        return appfault.FailWrap[*EntityGraph](err, ErrDatabaseQueryFailed, "failed to query entity graph")
    }
    defer rows.Close()

    // Build entity graph (implementation details omitted)
    graph := &EntityGraph{}
    // ... parse rows into graph structure

    return appfault.Ok(graph)
}

// Semantic search for entities
func (em *EntityMemory) SearchEntities(
    query string,
    entityType EntityType,
    topK int,
) appfault.Result[[]Entity] {

    filters := map[string]string{}
    if entityType != "" {
        filters["entity_type"] = string(entityType)
    }

    results, err := em.vectorMem.Retrieve(query, topK, filters)
    if err != nil {
        return nil, err
    }

    // Fetch full entity details
    entities := []Entity{}
    for _, result := range results {
        var entity Entity
        err := em.db.QueryRow(
            "SELECT id, type, name, attributes FROM entities WHERE id = $1",
            result.ID,
        ).Scan(&entity.ID, &entity.Type, &entity.Name, &entity.Attributes)

        if err == nil {
            entities = append(entities, entity)
        }
    }

    return entities, nil
}
```

### Usage Example

```go
func main() {
    // Initialize
    db, _ := sql.Open("postgres", "...")
    vectorMem, _ := NewVectorMemory("entities")
    llm := NewLLM("gpt-4")
    entityMem := NewEntityMemory(db, vectorMem, llm)

    // User conversation
    conversation := `
        I'm working with Sarah on the payment microservice.
        We're using Go, PostgreSQL, and Redis for caching.
        The service handles Stripe integration.
    `

    // Extract entities automatically
    entities, relationships, _ := entityMem.ExtractEntities(
        "user-123",
        conversation,
    )

    // Store extracted entities
    for _, entity := range entities {
        entityMem.StoreEntity(entity)
    }

    for _, rel := range relationships {
        entityMem.StoreRelationship(rel)
    }

    // Later: Query "Who am I working with?"
    people, _ := entityMem.SearchEntities(
        "colleagues teammates",
        EntityTypePerson,
        5,
    )
    // Returns: Sarah

    // Query "What technologies am I using?"
    tech, _ := entityMem.SearchEntities(
        "tech stack tools",
        EntityTypeTechnology,
        10,
    )
    // Returns: Go, PostgreSQL, Redis, Stripe

    // Get full context for a project
    graph, _ := entityMem.GetEntityGraph("project-payment-service", 2)
    // Returns graph with: Project → [Sarah, User] → Technologies
}
```

### Pros & Cons

✅ **Pros:**
- **Structured:** Clean entity-relationship model
- **Queryable:** SQL queries for complex relationships
- **Maintainable:** Update entity attributes over time
- **Semantic:** Vector search for entity discovery

❌ **Cons:**
- **Complex:** Requires entity extraction
- **LLM-dependent:** Extraction quality varies
- **Storage:** Two databases (SQL + vector)

---

## 3. Semantic Memory

### What is Semantic Memory?

**Semantic memory** stores **general knowledge and facts** independent of specific episodes or conversations.

Think of it as the "Wikipedia" of your RAG system - factual knowledge that isn't tied to when or how it was learned.

### Types of Semantic Memory

```
1. Factual Knowledge
   • "Paris is the capital of France"
   • "Go was created at Google"
   • "HTTP status 404 means Not Found"

2. Procedural Knowledge
   • "To deploy: build → test → push → deploy"
   • "Git workflow: branch → commit → push → PR"

3. Conceptual Knowledge
   • "Microservices are distributed systems"
   • "REST APIs use HTTP methods"

4. Domain Models
   • Product schema
   • API specifications
   • Business rules
```

### Implementation

```go
type SemanticMemory struct {
    facts      *VectorMemory // Factual knowledge
    procedures *VectorMemory // How-to knowledge
    concepts   *VectorMemory // Conceptual understanding
}

func NewSemanticMemory() appfault.Result[*SemanticMemory] {
    facts, _ := NewVectorMemory("semantic-facts")
    procedures, _ := NewVectorMemory("semantic-procedures")
    concepts, _ := NewVectorMemory("semantic-concepts")

    return &SemanticMemory{
        facts:      facts,
        procedures: procedures,
        concepts:   concepts,
    }, nil
}

// Store fact
func (sm *SemanticMemory) StoreFact(
    id, fact string,
    domain string,
    confidence float64,
) error {

    metadata := map[string]string{
        "type":       "fact",
        "domain":     domain,
        "confidence": fmt.Sprintf("%.2f", confidence),
        "timestamp":  time.Now().Format(time.RFC3339),
    }

    return sm.facts.Store(id, fact, metadata)
}

// Store procedure (how-to)
func (sm *SemanticMemory) StoreProcedure(
    id, title, steps string,
    domain string,
) error {

    content := fmt.Sprintf("How to %s:\n%s", title, steps)

    metadata := map[string]string{
        "type":   "procedure",
        "domain": domain,
        "title":  title,
    }

    return sm.procedures.Store(id, content, metadata)
}

// Store concept
func (sm *SemanticMemory) StoreConcept(
    id, concept, definition string,
    relatedConcepts []string,
) error {

    content := fmt.Sprintf(
        "%s: %s\nRelated: %s",
        concept,
        definition,
        strings.Join(relatedConcepts, ", "),
    )

    metadata := map[string]string{
        "type":    "concept",
        "concept": concept,
    }

    return sm.concepts.Store(id, content, metadata)
}

// Query semantic memory (searches all types)
func (sm *SemanticMemory) Query(
    query string,
    memoryType string, // "fact", "procedure", "concept", or "all"
    topK int,
) appfault.Result[[]chromem.Result] {

    var allResults []chromem.Result

    if memoryType == "fact" || memoryType == "all" {
        results, _ := sm.facts.Retrieve(query, topK, nil)
        allResults = append(allResults, results...)
    }

    if memoryType == "procedure" || memoryType == "all" {
        results, _ := sm.procedures.Retrieve(query, topK, nil)
        allResults = append(allResults, results...)
    }

    if memoryType == "concept" || memoryType == "all" {
        results, _ := sm.concepts.Retrieve(query, topK, nil)
        allResults = append(allResults, results...)
    }

    // Sort by similarity
    sort.Slice(allResults, func(i, j int) bool {
        return allResults[i].Similarity > allResults[j].Similarity
    })

    // Return top K overall
    if len(allResults) > topK {
        allResults = allResults[:topK]
    }

    return allResults, nil
}
```

### Usage Example

```go
func main() {
    semantic, _ := NewSemanticMemory()

    // === Store facts ===
    semantic.StoreFact(
        "fact-go-creators",
        "Go was created at Google by Robert Griesemer, Rob Pike, and Ken Thompson in 2007",
        "programming-languages",
        1.0,
    )

    semantic.StoreFact(
        "fact-goroutines",
        "Goroutines are lightweight threads managed by the Go runtime, allowing concurrent execution",
        "go-concurrency",
        1.0,
    )

    // === Store procedures ===
    semantic.StoreProcedure(
        "proc-deploy-go",
        "deploy a Go application",
        `1. Build: go build -o app
2. Test: go test ./...
3. Containerize: docker build -t app:latest .
4. Push: docker push app:latest
5. Deploy: kubectl apply -f deployment.yaml`,
        "devops",
    )

    semantic.StoreProcedure(
        "proc-debug-go",
        "debug a Go application",
        `1. Add breakpoints with delve
2. Run: dlv debug
3. Use commands: break, continue, print
4. Inspect variables and stack traces`,
        "debugging",
    )

    // === Store concepts ===
    semantic.StoreConcept(
        "concept-microservices",
        "Microservices",
        "Architectural style where an application is composed of small, independent services that communicate over network protocols",
        []string{"distributed-systems", "API", "containerization"},
    )

    // === Query semantic memory ===

    // Question: "How do goroutines work?"
    results, _ := semantic.Query("goroutine concurrency", "all", 3)
    // Returns: fact-goroutines with high similarity

    // Question: "How do I deploy my app?"
    results, _ = semantic.Query("deploy application", "procedure", 5)
    // Returns: proc-deploy-go

    // Question: "Explain microservices"
    results, _ = semantic.Query("microservices architecture", "concept", 3)
    // Returns: concept-microservices
}
```

---

## 4. Episodic Memory

### What is Episodic Memory?

**Episodic memory** stores specific experiences or events, like "what happened in my conversation on Tuesday."

Unlike semantic memory (facts), episodic memory includes **temporal and contextual information** about specific instances.

### Architecture

```
Episodic Memory Structure:
┌──────────────────────────────────────────────────────┐
│  Episode ID: episode-123                              │
├──────────────────────────────────────────────────────┤
│  Timestamp: 2026-02-06 14:30:00                      │
│  Duration: 15 minutes                                 │
│  Participants: [user-123, assistant]                  │
│  Session ID: session-456                              │
│  Context: "Deployment troubleshooting"                │
│                                                        │
│  Events:                                               │
│  1. [14:30] User reported deployment failure          │
│  2. [14:32] Assistant asked for error logs            │
│  3. [14:35] User provided logs showing port conflict  │
│  4. [14:38] Assistant suggested changing port config  │
│  5. [14:42] User confirmed issue resolved             │
│                                                        │
│  Outcome: RESOLVED                                     │
│  Tags: [deployment, docker, port-conflict]            │
│  Satisfaction: HIGH                                    │
└──────────────────────────────────────────────────────┘
```

### Implementation

```go
type Episode struct {
    ID           string
    StartTime    time.Time
    EndTime      time.Time
    UserID       string
    SessionID    string
    Context      string
    Events       []Event
    Outcome      string
    Tags         []string
    Satisfaction string
}

type Event struct {
    Timestamp time.Time
    Actor     string // "user" or "assistant"
    Action    string
    Content   string
}

type EpisodicMemory struct {
    db        *sql.DB
    vectorMem *VectorMemory
}

func NewEpisodicMemory(db *sql.DB, vectorMem *VectorMemory) *EpisodicMemory {
    return &EpisodicMemory{
        db:        db,
        vectorMem: vectorMem,
    }
}

// Store episode
func (em *EpisodicMemory) StoreEpisode(episode Episode) error {
    // Store structured data in SQL
    eventsJSON, _ := json.Marshal(episode.Events)
    tagsJSON, _ := json.Marshal(episode.Tags)

    _, err := em.db.Exec(`
        INSERT INTO episodes (
            id, start_time, end_time, user_id, session_id,
            context, events, outcome, tags, satisfaction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
        episode.ID, episode.StartTime, episode.EndTime,
        episode.UserID, episode.SessionID, episode.Context,
        eventsJSON, episode.Outcome, tagsJSON, episode.Satisfaction,
    )

    if err != nil {
        return err
    }

    // Also store in vector memory for semantic search
    content := fmt.Sprintf(`
Episode: %s
Context: %s
Summary: %s
Outcome: %s
Tags: %s
    `,
        episode.ID,
        episode.Context,
        summarizeEvents(episode.Events),
        episode.Outcome,
        strings.Join(episode.Tags, ", "),
    )

    metadata := map[string]string{
        "user_id":      episode.UserID,
        "session_id":   episode.SessionID,
        "outcome":      episode.Outcome,
        "satisfaction": episode.Satisfaction,
        "date":         episode.StartTime.Format("2006-01-02"),
    }

    return em.vectorMem.Store(episode.ID, content, metadata)
}

// Retrieve similar past episodes
func (em *EpisodicMemory) RetrieveSimilarEpisodes(
    currentContext string,
    userID string,
    topK int,
) appfault.Result[[]Episode] {

    filters := map[string]string{
        "user_id": userID,
    }

    results, err := em.vectorMem.Retrieve(currentContext, topK, filters)
    if err != nil {
        return nil, err
    }

    // Fetch full episode details from SQL
    episodes := []Episode{}
    for _, result := range results {
        var episode Episode
        var eventsJSON, tagsJSON []byte

        err := em.db.QueryRow(`
            SELECT id, start_time, end_time, user_id, session_id,
                   context, events, outcome, tags, satisfaction
            FROM episodes WHERE id = $1
        `, result.ID).Scan(
            &episode.ID, &episode.StartTime, &episode.EndTime,
            &episode.UserID, &episode.SessionID, &episode.Context,
            &eventsJSON, &episode.Outcome, &tagsJSON, &episode.Satisfaction,
        )

        if err != nil {
            continue
        }

        json.Unmarshal(eventsJSON, &episode.Events)
        json.Unmarshal(tagsJSON, &episode.Tags)

        episodes = append(episodes, episode)
    }

    return episodes, nil
}

// Get episodes by time range
func (em *EpisodicMemory) GetEpisodesByTimeRange(
    userID string,
    startTime, endTime time.Time,
) appfault.Result[[]Episode] {

    rows, err := em.db.Query(`
        SELECT id, start_time, end_time, user_id, session_id,
               context, events, outcome, tags, satisfaction
        FROM episodes
        WHERE user_id = $1
          AND start_time >= $2
          AND start_time <= $3
        ORDER BY start_time DESC
    `, userID, startTime, endTime)

    if err != nil {
        return nil, err
    }
    defer rows.Close()

    episodes := []Episode{}
    // ... parse rows (implementation omitted for brevity)

    return episodes, nil
}

func summarizeEvents(events []Event) string {
    if len(events) == 0 {
        return ""
    }

    summary := fmt.Sprintf(
        "%s: %s ... %s: %s",
        events[0].Actor,
        truncate(events[0].Content, 50),
        events[len(events)-1].Actor,
        truncate(events[len(events)-1].Content, 50),
    )

    return summary
}
```

### Usage: Learning from Past Episodes

```go
func HandleUserRequest(
    userID, query string,
    episodicMem *EpisodicMemory,
) string {

    // Check if we've seen similar situations before
    similarEpisodes, _ := episodicMem.RetrieveSimilarEpisodes(
        query,
        userID,
        3,
    )

    if len(similarEpisodes) > 0 {
        // Build context from past experiences
        pastContext := "Similar situations in the past:\n\n"

        for i, ep := range similarEpisodes {
            pastContext += fmt.Sprintf(
                "%d. %s (Outcome: %s)\n   Actions taken: %s\n\n",
                i+1,
                ep.Context,
                ep.Outcome,
                summarizeActions(ep.Events),
            )
        }

        // Include past episodes in prompt
        prompt := fmt.Sprintf(`
%s

Current situation:
User: %s

Based on past experiences, what should we do?
        `, pastContext, query)

        // Generate response considering past episodes
        response := llm.Generate(prompt)

        return response
    }

    // No similar episodes, handle normally
    return handleNormally(query)
}
```

### Pros & Cons

✅ **Pros:**
- **Temporal context:** Know when things happened
- **Learning:** Reference past successes/failures
- **Debugging:** Trace conversation history
- **Personalization:** Remember user-specific experiences

❌ **Cons:**
- **Storage:** Grows indefinitely without pruning
- **Privacy:** Stores detailed interaction logs
- **Complexity:** Requires event tracking

---

# Part 5: Go Framework Deep Dive

---

## 5. langchaingo Complete Memory System

### Memory Types in langchaingo

```go
import "github.com/tmc/langchaingo/memory"

// 1. ConversationBuffer - stores all messages
buffer := memory.NewConversationBuffer()

// 2. ConversationWindowBuffer - last K messages
window := memory.NewConversationWindowBuffer(10) // Keep last 10

// 3. ConversationSummaryBuffer - summarizes old messages
summary := memory.NewConversationSummaryBuffer(llm, maxTokens)

// 4. ConversationTokenBuffer - token-based limit
tokenBuffer := memory.NewConversationTokenBuffer(llm, 2000) // Max 2000 tokens

// 5. VectorStoreBackedMemory - retrieval-based
vectorMem := memory.NewVectorStoreBackedMemory(vectorStore)
```

### Complete Example: Multi-Level Memory System

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms/openai"
    "github.com/tmc/langchaingo/memory"
    "github.com/tmc/langchaingo/chains"
    "github.com/tmc/langchaingo/vectorstores"
    "github.com/tmc/langchaingo/vectorstores/chroma"
)

type AdvancedMemorySystem struct {
    shortTerm  memory.ConversationMemory // Recent messages
    longTerm   memory.ConversationMemory // Vector-backed
    llm        *openai.LLM
}

func NewAdvancedMemorySystem() appfault.Result[*AdvancedMemorySystem] {
    ctx := context.Background()

    // Initialize LLM
    llm, err := openai.New()
    if err != nil {
        return appfault.FailWrap[*AdvancedMemorySystem](err, ErrLlmInitFailed, "failed to initialize llm")
    }

    // Short-term: Keep last 20 messages
    shortTerm := memory.NewConversationWindowBuffer(20)

    // Long-term: Vector store backed memory
    chromaStore, err := chroma.New(
        chroma.WithChromaURL("http://localhost:8000"),
        chroma.WithDistanceFunction("cosine"),
    )
    if err != nil {
        return appfault.FailWrap[*AdvancedMemorySystem](err, ErrChromaInitFailed, "failed to initialize chroma store")
    }

    longTerm := memory.NewVectorStoreRetrieverMemory(
        vectorstores.ToRetriever(chromaStore, 5), // Retrieve top 5
    )

    return appfault.Ok(&AdvancedMemorySystem{
        shortTerm: shortTerm,
        longTerm:  longTerm,
        llm:       llm,
    })
}

func (ams *AdvancedMemorySystem) ProcessQuery(context stdctx.Context, query string) appfault.Result[string] {
    // 1. Get short-term memory (recent conversation)
    recentHistory, _ := ams.shortTerm.LoadMemoryVariables(context, nil)

    // 2. Get long-term memory (relevant past conversations)
    // ALLOWED: LangChain Go API — LoadMemoryVariables requires map[string]any
    relevantHistory, _ := ams.longTerm.LoadMemoryVariables(context, map[string]any{
        "input": query,
    })

    // 3. Combine contexts
    prompt := fmt.Sprintf(`
Recent Conversation:
%s

Relevant Past Context:
%s

User Question:
%s