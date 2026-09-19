# RAG Memory Systems: The Complete Technical Guide

**Version:** 1.0.0  

## Attention, Short-Term Memory, Long-Term Memory & Training

**Last Updated:** 2026-03-09
**Audience:** AI Engineers, ML Practitioners, Go Developers
**Purpose:** Comprehensive guide to building production RAG systems with proper memory management

---

# Table of Contents

## Part 1: Memory Architecture Fundamentals
1. [Understanding Memory Types in AI Systems](#1-memory-types)
2. [The Memory Hierarchy](#2-memory-hierarchy)
3. [How RAG Models Use Memory](#3-rag-memory-architecture)

## Part 2: Attention Mechanisms
4. [Transformer Attention (Context Window)](#4-attention-mechanisms)
5. [Multi-Head Attention](#5-multi-head-attention)
6. [Managing Context Length](#6-context-management)

## Part 3: Short-Term Memory
7. [Conversation Buffer Memory](#7-conversation-buffer)
8. [Buffer Window Memory](#8-buffer-window)
9. [Conversation Summary Memory](#9-summary-memory)
10. [Token Buffer Memory](#10-token-buffer)

## Part 4: Long-Term Memory
11. [Vector Store Memory](#11-vector-store-memory)
12. [Entity Memory](#12-entity-memory)
13. [Semantic Memory](#13-semantic-memory)
14. [Episodic Memory](#14-episodic-memory)

## Part 5: Go Framework Implementations
15. [langchaingo Memory System](#15-langchaingo-memory)
16. [LinGoose Memory Capabilities](#16-lingoose-memory)
17. [golc Memory Features](#17-golc-memory)

## Part 6: Training & Fine-Tuning
18. [Training RAG Models with Memory](#18-training-rag)
19. [Fine-Tuning for Long-Term Recall](#19-fine-tuning)
20. [Memory-Aware Prompt Engineering](#20-prompt-engineering)

## Part 7: Production Patterns
21. [Hybrid Memory Strategies](#21-hybrid-memory)
22. [Memory Compression Techniques](#22-memory-compression)
23. [Distributed Memory Systems](#23-distributed-memory)
24. [Real-World Architecture Examples](#24-production-examples)

---

# Part 1: Memory Architecture Fundamentals

---

## 1. Memory Types in AI Systems

### Human Memory vs AI Memory Analogy

```
Human Memory System              AI System Memory
═══════════════════════════════════════════════════════
Working Memory                   Attention/Context Window
  ↓                                ↓
- Immediate task focus          - Current prompt + recent tokens
- 7±2 items capacity            - Limited by model (4K-200K tokens)
- Temporary (seconds)           - Temporary (per request)

Short-Term Memory                Conversation Buffer
  ↓                                ↓
- Recent events                 - Recent message history
- Minutes to hours              - Session-based
- Can be refreshed              - Managed by application

Long-Term Memory                 Vector Database
  ↓                                ↓
- Facts, procedures             - Embeddings of documents
- Permanent storage             - Persistent storage
- Associative recall            - Semantic search
```

### The Three Memory Systems Explained

**1. Attention (Context Window) - "What I'm Thinking About Right Now"**

This is the LLM's "working memory" - the immediate text it can process in a single request.

```
┌─────────────────────────────────────────────────────┐
│  Current Context Window (e.g., 8K tokens)           │
├─────────────────────────────────────────────────────┤
│  [System Prompt: 200 tokens]                        │
│  ↓                                                   │
│  [Retrieved Context from Vector DB: 2000 tokens]    │
│  ↓                                                   │
│  [Conversation History: 1500 tokens]                │
│  ↓                                                   │
│  [Current User Question: 50 tokens]                 │
│  ↓                                                   │
│  [Available for Response: 4250 tokens]              │
└─────────────────────────────────────────────────────┘

Total: 8000 tokens used of 8192 available
```

**Key Characteristics:**
- **Fixed Size:** Models have a maximum context window (GPT-4: 8K-128K, Claude: 200K)
- **Temporary:** Lost after response generation
- **Expensive:** More tokens = higher API costs
- **No Persistence:** Cannot "remember" across sessions

**2. Short-Term Memory - "What We Just Talked About"**

Application-managed memory of recent conversation turns.

```
Session Storage (Redis/Memory/Database)
┌─────────────────────────────────────────────────┐
│  Session ID: user-123-session-456               │
├─────────────────────────────────────────────────┤
│  Turn 1:                                        │
│    User: "What's the weather?"                  │
│    AI: "I don't have real-time weather data"    │
│                                                  │
│  Turn 2:                                        │
│    User: "What about in NYC?"                   │
│    AI: "I still can't check live weather..."    │
│                                                  │
│  Turn 3:                                        │
│    User: "Ok, tell me about NYC history"        │
│    AI: "New York City was founded in 1624..."   │
└─────────────────────────────────────────────────┘

Lifetime: Session-based (30 minutes to days)
Storage: In-memory cache, Redis, SQL
```

**Key Characteristics:**
- **Session-Scoped:** Tied to a user session or conversation
- **Manageable Size:** Keep last N messages or within token budget
- **Application Managed:** Your code decides what to keep
- **Structured:** Stores message pairs (user + assistant)

**3. Long-Term Memory - "Knowledge Base"**

Persistent knowledge stored in vector databases for semantic retrieval.

```
Vector Database (Pinecone/Qdrant/chromem-go)
┌───────────────────────────────────────────────────┐
│  Company Documentation (10,000 documents)         │
│  ├─ Employee Handbook → [0.23, 0.45, ...]        │
│  ├─ API Documentation → [0.67, 0.12, ...]        │
│  ├─ Code Examples → [0.89, 0.34, ...]            │
│  └─ Historical Decisions → [0.45, 0.78, ...]     │
│                                                    │
│  User Preferences (per-user)                      │
│  ├─ User-123 likes Python → [0.12, 0.89, ...]    │
│  └─ User-456 prefers Go → [0.45, 0.23, ...]      │
└────────────────────────────────────────────────────┘

Query: "How do I authenticate users?"
  ↓
Vector Search: Finds "API Authentication Guide"
  ↓
Returns: Top 3 most relevant documents
```

**Key Characteristics:**
- **Persistent:** Survives across all sessions
- **Scalable:** Millions to billions of documents
- **Semantic:** Retrieves by meaning, not keywords
- **Shared:** Available to all users (or user-specific)

---

## 2. The Memory Hierarchy

### Complete Memory Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: LONG-TERM MEMORY (Vector Database)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Semantic Search                                         │ │
│  │ • Query: "How do I deploy?"                            │ │
│  │ • Results: Top 5 relevant docs from 100K documents     │ │
│  └────────────────────────────────────────────────────────┘ │
│  Time: ~50-200ms                                            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: SHORT-TERM MEMORY (Conversation History)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Last 10 Message Pairs                                  │ │
│  │ • Turn 8: User asked about deployment                  │ │
│  │ • Turn 9: AI explained basics                          │ │
│  │ • Turn 10: User wants more details                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  Time: ~1-5ms (cache/database lookup)                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: CONTEXT ASSEMBLY                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Build Final Prompt                                      │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ System: You are a helpful assistant...            │ │ │
│  │ │                                                     │ │ │
│  │ │ Retrieved Context: [5 docs from vector DB]        │ │ │
│  │ │                                                     │ │ │
│  │ │ Conversation History: [last 10 turns]             │ │ │
│  │ │                                                     │ │ │
│  │ │ Current Question: [user's question]               │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: ATTENTION (LLM Context Window)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Transformer processes all tokens                        │ │
│  │ • System prompt: 200 tokens                            │ │
│  │ • Retrieved docs: 2000 tokens                          │ │
│  │ • Conversation: 1500 tokens                            │ │
│  │ • Question: 50 tokens                                  │ │
│  │ • Generation budget: 4250 tokens                       │ │
│  │ ───────────────────────────────                        │ │
│  │ Total: 8000 / 8192 tokens                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  Time: ~1-10 seconds (LLM inference)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: POST-PROCESSING                                    │
│  • Save AI response to short-term memory                     │
│  • Extract entities for long-term memory                     │
│  • Update user preferences if detected                       │
└─────────────────────────────────────────────────────────────┘
```

### Memory Access Patterns

**Pattern 1: Question Answering (One-Shot)**

```
User: "What is our refund policy?"
  ↓
[1] Vector Search: Find "refund policy" docs → 200ms
  ↓
[2] No conversation history needed
  ↓
[3] LLM generates answer from retrieved context → 2s
  ↓
Answer: "Our refund policy allows returns within 30 days..."

Total Time: ~2.2 seconds
Memory Used: Long-term only
```

**Pattern 2: Conversational RAG (Multi-Turn)**

```
Turn 1:
User: "Tell me about your products"
  ↓
[Vector Search] → Product catalog
[No History]
  ↓
AI: "We offer 3 product lines: Enterprise, Pro, Starter..."

Turn 2:
User: "What's the difference between Pro and Enterprise?"
  ↓
[Vector Search] → Pricing comparison docs
[History] → Includes Turn 1 (user knows about product lines)
  ↓
AI: "Enterprise includes SSO, dedicated support..."

Turn 3:
User: "How much does it cost?"
  ↓
[Vector Search] → Pricing information
[History] → Knows user is asking about Enterprise (from Turn 2)
  ↓
AI: "Enterprise pricing starts at $999/month..."

Memory Used: Long-term + Short-term combined
```

**Pattern 3: Personalized RAG (User Memory)**

```
User: "Show me Python tutorials"
  ↓
[1] Vector Search: "Python tutorials"
[2] User Memory: This user prefers FastAPI, Flask, web dev
  ↓
[3] Re-rank results: Prioritize web framework tutorials
  ↓
AI: "Here are FastAPI tutorials tailored for you..."

Memory Used: Long-term (docs) + Long-term (user preferences)
```

---

## 3. RAG Memory Architecture

### Complete RAG System with Memory

```
┌───────────────────────────────────────────────────────────────┐
│                       RAG SYSTEM                               │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  KNOWLEDGE BASE (Long-Term Memory)                      │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Vector Database (chromem-go/Qdrant/Pinecone)   │  │  │
│  │  │  • Company documents: 50,000 docs                │  │  │
│  │  │  • Code examples: 10,000 snippets                │  │  │
│  │  │  • API docs: 5,000 endpoints                     │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Entity Store (PostgreSQL/MongoDB)               │  │  │
│  │  │  • User preferences                               │  │  │
│  │  │  • Product catalog                                │  │  │
│  │  │  • Historical interactions                        │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  SESSION MEMORY (Short-Term Memory)                     │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Redis/In-Memory Cache                           │  │  │
│  │  │  • Active conversations by session_id            │  │  │
│  │  │  • TTL: 30 minutes                               │  │  │
│  │  │  • Buffer: Last 20 messages                      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  RETRIEVAL PIPELINE                                     │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  1. Query Understanding                          │  │  │
│  │  │     • Extract entities                            │  │  │
│  │  │     • Detect intent                               │  │  │
│  │  │     • Rewrite with context                        │  │  │
│  │  │                                                    │  │  │
│  │  │  2. Hybrid Search                                 │  │  │
│  │  │     • Semantic (vector similarity)                │  │  │
│  │  │     • Keyword (BM25)                              │  │  │
│  │  │     • Entity matching                             │  │  │
│  │  │                                                    │  │  │
│  │  │  3. Re-ranking                                    │  │  │
│  │  │     • Relevance scoring                           │  │  │
│  │  │     • Recency weighting                           │  │  │
│  │  │     • User preference adjustment                  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  GENERATION ENGINE                                      │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Prompt Constructor                               │  │  │
│  │  │  • Assemble context from retrieved docs          │  │  │
│  │  │  • Include conversation history                   │  │  │
│  │  │  • Add user preferences                           │  │  │
│  │  │  • Inject current question                        │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  LLM (GPT-4/Claude/Ollama)                       │  │  │
│  │  │  • Process with attention mechanism               │  │  │
│  │  │  • Generate response                              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  MEMORY UPDATE                                          │  │
│  │  • Save new turn to short-term memory                   │  │
│  │  • Extract entities for long-term storage               │  │
│  │  • Update user preferences if detected                  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow Example

```
Step 1: User Query
─────────────────
User: "How do I deploy my Go app to production?"
Session: user-123-session-456

Step 2: Query Enhancement
──────────────────────────
[History Lookup]
  • Turn 1: User asked about Go project structure
  • Turn 2: User is building a REST API

[Query Rewriting]
  Original: "How do I deploy my Go app to production?"
  Enhanced: "How to deploy a Go REST API to production
             considering project structure and best practices"

Step 3: Retrieval
─────────────────
[Vector Search in Knowledge Base]
  Results:
  1. "Go Production Deployment Guide" (score: 0.89)
  2. "Docker for Go Applications" (score: 0.85)
  3. "CI/CD Pipelines for Go" (score: 0.82)
  4. "Environment Configuration" (score: 0.78)
  5. "Monitoring Go Apps in Production" (score: 0.75)

[Entity Matching]
  User previously favorited: "Docker", "GitHub Actions"
  → Boost result #2 and #3

Step 4: Context Assembly
─────────────────────────
[Final Prompt to LLM]

System: You are an expert Go developer helping with production deployments.

Context from Knowledge Base:
─────────────────────────
[Doc 1: Go Production Deployment Guide]
To deploy a Go application to production:
1. Build a static binary: go build -ldflags="-s -w"
2. Use multi-stage Docker builds...
[truncated]

[Doc 2: Docker for Go Applications]
FROM golang:1.21 as builder...
[truncated]

Conversation History:
────────────────────
User: "How should I structure my Go project?"
Assistant: "I recommend following the standard Go project layout..."

User: "I'm building a REST API"
Assistant: "Great! For REST APIs, consider using..."

Current Question:
────────────────
User: "How do I deploy my Go app to production?"

Step 5: LLM Generation
──────────────────────
[Attention Mechanism]
  • Processes all context (docs + history + question)
  • Generates response using transformer layers
  • Maintains coherence across all inputs

[Response]
Assistant: "Based on your REST API project, I recommend
           containerizing with Docker. Here's the approach:

           1. Create a multi-stage Dockerfile...
           2. Set up CI/CD with GitHub Actions...
           3. Deploy to your chosen platform...

           Since we discussed project structure earlier,
           make sure your main.go is in cmd/api/..."

Step 6: Memory Update
─────────────────────
[Short-Term Memory]
  • Save Turn 3 to session user-123-session-456
  • Keep last 20 turns
  • Set TTL: 30 minutes

[Long-Term Memory]
  • Extract: User is interested in "Docker", "production deployment"
  • Update user preference vector
  • Log interaction for future re-ranking
```

---

# Part 2: Attention Mechanisms

---

## 4. Attention Mechanisms Explained

### What is Attention?

Attention is the **core mechanism** that allows transformers to weigh the importance of different parts of the input when generating each token of output.

### Self-Attention Mechanism

```
Input Sequence: "The cat sat on the mat"

When processing the word "sat", attention helps the model understand:
  • WHO sat? → "cat" (high attention weight)
  • WHERE? → "on the mat" (medium attention weight)
  • Less relevant → "The" (low attention weight)

┌─────────────────────────────────────────────────────────┐
│  Attention Matrix (Simplified)                          │
├─────────────────────────────────────────────────────────┤
│         The    cat    sat    on     the    mat          │
│  The    1.0    0.2    0.1    0.1    0.8    0.1          │
│  cat    0.3    1.0    0.7    0.2    0.3    0.2          │
│  sat    0.1    0.9    1.0    0.6    0.2    0.5   ← Focus│
│  on     0.1    0.2    0.6    1.0    0.4    0.8          │
│  the    0.8    0.3    0.2    0.4    1.0    0.3          │
│  mat    0.1    0.2    0.5    0.8    0.3    1.0          │
└─────────────────────────────────────────────────────────┘

High values = strong relationship
```

### Attention Computation (Technical)

```
Step 1: Create Query (Q), Key (K), Value (V) vectors
─────────────────────────────────────────────────────
For each token embedding:
  Q = embedding × W_Q  (What am I looking for?)
  K = embedding × W_K  (What do I offer?)
  V = embedding × W_V  (What information do I carry?)

Step 2: Compute attention scores
─────────────────────────────────
scores = (Q × K^T) / √d_k
  where d_k = dimension of key vectors (e.g., 64)

Example:
  Token "sat" query: [0.5, 0.2, 0.8, ...]
  Token "cat" key:   [0.6, 0.3, 0.7, ...]

  similarity = dot_product([0.5,0.2,0.8], [0.6,0.3,0.7])
             = 0.5×0.6 + 0.2×0.3 + 0.8×0.7
             = 0.30 + 0.06 + 0.56 = 0.92

  scaled_score = 0.92 / √64 = 0.92 / 8 = 0.115

Step 3: Softmax normalization
──────────────────────────────
attention_weights = softmax(scores)
  • Converts scores to probabilities (sum to 1.0)
  • Amplifies large differences

Step 4: Weighted sum
────────────────────
output = Σ (attention_weight_i × value_i)
  • Combines information from all tokens
  • Weights determine contribution of each token
```

### Context Window Limitations

```
Model Context Windows (2024-2026):
┌─────────────────────────────────────────────────────┐
│  Model              Context        ~Words    ~Pages │
├─────────────────────────────────────────────────────┤
│  GPT-3.5 Turbo      4,096 tokens   ~3,000    ~6     │
│  GPT-4              8,192 tokens   ~6,000    ~12    │
│  GPT-4 Turbo        128K tokens    ~96,000   ~192   │
│  Claude 3           200K tokens    ~150,000  ~300   │
│  Gemini 1.5 Pro     1M tokens      ~750,000  ~1,500 │
│  Llama 3            8K-128K tokens Variable  ~12-192│
└─────────────────────────────────────────────────────┘

Problem: What happens when you exceed the limit?
────────────────────────────────────────────────
1. Truncation: Older messages get dropped
2. Summarization: Compress history into shorter form
3. Sliding Window: Keep only recent context
4. Retrieval: Store in vector DB, retrieve relevant parts
```

### Managing Context Windows in RAG

**Strategy 1: Token Budgeting**

```go
type TokenBudget struct {
    MaxTokens           int // Model's context window
    SystemPrompt        int // Reserved for instructions
    RetrievedContext    int // Budget for RAG documents
    ConversationHistory int // Budget for chat history
    UserQuery           int // Current question
    GenerationBudget    int // Tokens available for response
}

func calculateBudget(model string) TokenBudget {
    budget := TokenBudget{
        MaxTokens: 8192, // GPT-4
    }

    // Allocate budgets
    budget.SystemPrompt = 200
    budget.RetrievedContext = 3000  // ~3-5 documents
    budget.ConversationHistory = 2000 // ~10-20 turns
    budget.UserQuery = 100

    // Calculate remaining for generation
    used := budget.SystemPrompt + budget.RetrievedContext +
            budget.ConversationHistory + budget.UserQuery
    budget.GenerationBudget = budget.MaxTokens - used

    return budget
}
```

**Strategy 2: Adaptive Context**

```go
func buildAdaptiveContext(
    query string,
    history []Message,
    retrievedDocs []Document,
    maxTokens int,
) string {

    budget := maxTokens
    context := []string{}

    // 1. System prompt (always included)
    systemPrompt := "You are a helpful assistant..."
    budget -= countTokens(systemPrompt)
    context = append(context, systemPrompt)

    // 2. Most relevant retrieved docs (prioritize by score)
    sort.Slice(retrievedDocs, func(i, j int) bool {
        return retrievedDocs[i].Score > retrievedDocs[j].Score
    })

    for _, doc := range retrievedDocs {
        tokens := countTokens(doc.Content)
        if budget-tokens < 1000 { // Keep 1000 for response
            break
        }
        context = append(context, doc.Content)
        budget -= tokens
    }

    // 3. Recent conversation (newest first, up to budget)
    for i := len(history) - 1; i >= 0; i-- {
        msg := history[i]
        tokens := countTokens(msg.Content)
        if budget-tokens < 500 {
            break
        }
        context = append(context, msg.Format())
        budget -= tokens
    }

    // 4. Current query
    context = append(context, query)

    return strings.Join(context, "\n\n")
}
```

---

## 5. Multi-Head Attention

### Why Multiple Attention Heads?

Instead of one attention mechanism, transformers use **multiple parallel attention mechanisms** (heads) that focus on different aspects simultaneously.

```
Analogy: Reading a Technical Document
──────────────────────────────────────
Human approach:
  • Head 1: Focus on main concepts
  • Head 2: Track technical terms
  • Head 3: Follow code examples
  • Head 4: Remember cross-references

Transformer approach (8-96 heads):
  • Head 1: Subject-verb relationships
  • Head 2: Long-range dependencies
  • Head 3: Positional patterns
  • Head 4: Semantic similarity
  • Head 5-8: Various syntactic patterns
```

### Multi-Head Attention Architecture

```
Input: [The, cat, sat, on, the, mat]
  ↓
┌─────────────────────────────────────────────────────────┐
│  MULTI-HEAD ATTENTION (8 heads)                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Head 1 (Subject-Object)        Head 2 (Action-Location)│
│  ┌────────────────────┐        ┌────────────────────┐  │
│  │ cat → sat (0.9)    │        │ sat → mat (0.8)    │  │
│  │ cat → mat (0.3)    │        │ sat → on (0.7)     │  │
│  └────────────────────┘        └────────────────────┘  │
│                                                          │
│  Head 3 (Determiners)           Head 4 (Prepositions)   │
│  ┌────────────────────┐        ┌────────────────────┐  │
│  │ The → cat (0.9)    │        │ on → mat (0.9)     │  │
│  │ the → mat (0.9)    │        │ on → the (0.6)     │  │
│  └────────────────────┘        └────────────────────┘  │
│                                                          │
│  ... (Heads 5-8 focusing on other patterns)             │
└─────────────────────────────────────────────────────────┘
  ↓
Concatenate all head outputs
  ↓
Linear transformation
  ↓
Output: Enhanced representations incorporating all patterns
```

### Impact on Memory and RAG

**1. Better Context Understanding:**

```
Query: "What's the deployment process?"

Single Head might focus on:
  → "deployment process" (primary keywords)

Multi-Head focuses on:
  → Head 1: "deployment" + "process" (keywords)
  → Head 2: "What's" implies a question
  → Head 3: Relates to previous mention of "production"
  → Head 4: User's programming language (Go)
  → Head 5-8: Various semantic nuances

Result: Richer query understanding → Better retrieval
```

**2. Memory Integration:**

```
Multi-head attention helps integrate different memory sources:

  Head 1: Focus on retrieved documents (long-term memory)
  Head 2: Focus on recent conversation (short-term memory)
  Head 3: Focus on user's question
  Head 4: Focus on system instructions
  Heads 5-8: Cross-reference between these sources

This allows the model to:
  • Connect current question to previous context
  • Link retrieved docs to conversation flow
  • Maintain coherent responses across memory types
```

---

## 6. Context Length Management Strategies

### Strategy 1: Truncation (Simplest, Lossy)

```go
func truncateHistory(messages []Message, maxTokens int) []Message {
    tokenCount := 0
    result := []Message{}

    // Keep most recent messages that fit in budget
    for i := len(messages) - 1; i >= 0; i-- {
        tokens := countTokens(messages[i].Content)
        if tokenCount + tokens > maxTokens {
            break
        }
        result = append([]Message{messages[i]}, result...)
        tokenCount += tokens
    }

    return result
}
```

**Pros:** Simple, fast
**Cons:** Loses context abruptly, may forget important early details

### Strategy 2: Sliding Window (Recent Focus)

```go
func slidingWindow(messages []Message, windowSize int) []Message {
    if len(messages) <= windowSize {
        return messages
    }
    return messages[len(messages)-windowSize:]
}
```

**Pros:** Maintains recent context, predictable behavior
**Cons:** Loses all older context, fixed window size

### Strategy 3: Summarization (Compression)

```go
func summarizeHistory(
    messages []Message,
    llm LLM,
    maxSummaryTokens int,
) (string, []Message) {

    if countTokens(messages) < maxSummaryTokens {
        return "", messages // No summarization needed
    }

    // Split into "old" (to summarize) and "recent" (keep as-is)
    splitPoint := len(messages) - 10 // Keep last 10 turns verbatim
    oldMessages := messages[:splitPoint]
    recentMessages := messages[splitPoint:]

    // Generate summary of old messages
    summaryPrompt := fmt.Sprintf(`
        Summarize the following conversation concisely,
        capturing key points, decisions, and context:

        %s
    `, formatMessages(oldMessages))

    summary := llm.Generate(summaryPrompt)

    return summary, recentMessages
}

// Usage
summary, recentMsgs := summarizeHistory(allMessages, llm, 2000)
finalContext := fmt.Sprintf(`
    Conversation Summary: %s

    Recent Messages:
    %s

    Current Question: %s
`, summary, formatMessages(recentMsgs), currentQuestion)
```

**Pros:** Preserves important information, adaptive
**Cons:** Extra LLM call (cost + latency), potential information loss

### Strategy 4: Hierarchical Memory (Best for RAG)

```go
type HierarchicalMemory struct {
    // Immediate context (always included)
    CurrentTurn Message

    // Short-term (recent, uncompressed)
    RecentMessages []Message // Last 5 turns

    // Medium-term (summarized)
    SessionSummary string // Summary of older messages

    // Long-term (retrieved)
    RelevantDocuments []Document // From vector DB

    // User context (persistent)
    // ALLOWED: LangChain Go memory — user preferences are schemaless by design
    UserPreferences map[string]interface{}
}

func (hm *HierarchicalMemory) BuildPrompt() string {
    return fmt.Sprintf(`
System: You are a helpful assistant.

User Profile: %v

Knowledge Base Context:
%s

Session Summary (earlier conversation):
%s

Recent Conversation:
%s

Current Question:
%s
    `,
        hm.UserPreferences,
        formatDocuments(hm.RelevantDocuments),
        hm.SessionSummary,
        formatMessages(hm.RecentMessages),
        hm.CurrentTurn.Content,
    )
}
```

**Pros:** Best of all worlds, scalable, maintains different temporal contexts
**Cons:** More complex to implement

---

# Part 3: Short-Term Memory

---

## 7. Conversation Buffer Memory

### What is Conversation Buffer?

Stores the **complete conversation history** in memory, up to a limit.

### Implementation Pattern

```go
package memory

import (
    "fmt"
    "sync"
)

type Message struct {
    Role    string // "user" or "assistant"
    Content string
}

type ConversationBuffer struct {
    messages  []Message
    mu        sync.RWMutex
    maxSize   int // Maximum number of messages
}

func NewConversationBuffer(maxSize int) *ConversationBuffer {
    return &ConversationBuffer{
        messages: make([]Message, 0),
        maxSize:  maxSize,
    }
}

func (cb *ConversationBuffer) AddUserMessage(content string) {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    cb.messages = append(cb.messages, Message{
        Role:    "user",
        Content: content,
    })

    cb.trim()
}

func (cb *ConversationBuffer) AddAIMessage(content string) {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    cb.messages = append(cb.messages, Message{
        Role:    "assistant",
        Content: content,
    })

    cb.trim()
}

func (cb *ConversationBuffer) GetMessages() []Message {
    cb.mu.RLock()
    defer cb.mu.RUnlock()

    return cb.messages
}

func (cb *ConversationBuffer) GetHistory() string {
    cb.mu.RLock()
    defer cb.mu.RUnlock()

    var history string
    for _, msg := range cb.messages {
        history += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
    }
    return history
}

func (cb *ConversationBuffer) trim() {
    if len(cb.messages) > cb.maxSize {
        // Remove oldest messages
        cb.messages = cb.messages[len(cb.messages)-cb.maxSize:]
    }
}

func (cb *ConversationBuffer) Clear() {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    cb.messages = make([]Message, 0)
}
```

### Usage Example

```go
func main() {
    // Create buffer with max 20 messages (10 turns)
    buffer := memory.NewConversationBuffer(20)

    // Simulate conversation
    buffer.AddUserMessage("What is Go?")
    buffer.AddAIMessage("Go is a statically typed, compiled language...")

    buffer.AddUserMessage("Who created it?")
    buffer.AddAIMessage("Go was created at Google by Robert Griesemer...")

    buffer.AddUserMessage("What are its main features?")
    buffer.AddAIMessage("Go's main features include: goroutines...")

    // Get full history for context
    history := buffer.GetHistory()

    // Build prompt with history
    prompt := fmt.Sprintf(`
%s

User: Tell me more about goroutines
Assistant:`, history)

    // Send to LLM...
}
```

### langchaingo Implementation

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms/openai"
    "github.com/tmc/langchaingo/memory"
    "github.com/tmc/langchaingo/chains"
)

func main() {
    ctx := context.Background()

    // Create LLM
    llm, _ := openai.New()

    // Create conversation buffer memory
    conversationMemory := memory.NewConversationBuffer()

    // Create conversational chain
    chain := chains.NewConversation(llm, conversationMemory)

    // Conversation turns
    questions := []string{
        "What is the capital of France?",
        "What is its population?",  // "its" refers to Paris from previous turn
        "What are famous landmarks there?", // "there" refers to Paris
    }

    for _, question := range questions {
        // ALLOWED: LangChain Go API — chain.Call() requires map[string]interface{}
        response, _ := chain.Call(ctx, map[string]interface{}{
            "input": question,
        })

        fmt.Printf("Q: %s\n", question)
        fmt.Printf("A: %s\n\n", response["text"])
    }

    // Memory automatically maintains context
    // The model "remembers" Paris from turn 1 in turns 2 and 3
}
```

### Pros & Cons

✅ **Pros:**
- Simple to implement
- Complete conversation history preserved
- No information loss

❌ **Cons:**
- Unbounded growth (memory/token usage)
- Exceeds context window with long conversations
- Includes irrelevant old context

### When to Use

✅ Use for:
- Short conversations (<10 turns)
- When complete history is essential
- Development/debugging

❌ Don't use for:
- Long-running conversations
- Memory-constrained environments
- High-volume production systems

---

## 8. Buffer Window Memory

### What is Buffer Window Memory?

Keeps only the **last K messages**, creating a sliding window of recent context.

### Implementation

```go
package memory

import (
    "fmt"
    "sync"
)

type ConversationWindow struct {
    messages   []Message
    mu         sync.RWMutex
    windowSize int // Number of recent messages to keep
}

func NewConversationWindow(windowSize int) *ConversationWindow {
    return &ConversationWindow{
        messages:   make([]Message, 0),
        windowSize: windowSize,
    }
}

func (cw *ConversationWindow) AddMessage(role, content string) {
    cw.mu.Lock()
    defer cw.mu.Unlock()

    cw.messages = append(cw.messages, Message{
        Role:    role,
        Content: content,
    })

    // Keep only last windowSize messages
    if len(cw.messages) > cw.windowSize {
        cw.messages = cw.messages[len(cw.messages)-cw.windowSize:]
    }
}

func (cw *ConversationWindow) GetWindow() []Message {
    cw.mu.RLock()
    defer cw.mu.RUnlock()

    return cw.messages
}

func (cw *ConversationWindow) Format() string {
    cw.mu.RLock()
    defer cw.mu.RUnlock()

    var formatted string
    for _, msg := range cw.messages {
        formatted += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
    }
    return formatted
}
```

### Usage Example

```go
func main() {
    // Keep last 10 messages (5 conversation turns)
    window := memory.NewConversationWindow(10)

    // Turn 1
    window.AddMessage("user", "What is RAG?")
    window.AddMessage("assistant", "RAG stands for Retrieval-Augmented Generation...")

    // Turn 2
    window.AddMessage("user", "How does it work?")
    window.AddMessage("assistant", "RAG works by retrieving relevant documents...")

    // ... many more turns ...

    // Turn 10
    window.AddMessage("user", "What about long-term memory?")
    window.AddMessage("assistant", "Long-term memory in RAG uses vector databases...")

    // Turn 11 - oldest message (Turn 1 user) gets dropped
    window.AddMessage("user", "Can you give an example?")

    // Only last 10 messages are kept
    context := window.Format()
    // Context now contains Turns 2-11, Turn 1 is gone
}
```

### langchaingo Implementation

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms/openai"
    "github.com/tmc/langchaingo/memory"
    "github.com/tmc/langchaingo/chains"
)

func main() {
    ctx := context.Background()
    llm, _ := openai.New()

    // Window size of 8 messages (4 conversation turns)
    windowMemory := memory.NewConversationWindowBuffer(8)

    chain := chains.NewConversation(llm, windowMemory)

    // ALLOWED: LangChain Go API — chain.Call() requires map[string]interface{}
    // Turn 1
    chain.Call(ctx, map[string]interface{}{"input": "Hi, I'm working on a Go project"})
    // Turn 2
    chain.Call(ctx, map[string]interface{}{"input": "It's a REST API"})
    // Turn 3
    chain.Call(ctx, map[string]interface{}{"input": "I need to add authentication"})
    // Turn 4
    chain.Call(ctx, map[string]interface{}{"input": "What's the best approach?"})
    // Turn 5 (Turn 1 dropped)
    chain.Call(ctx, map[string]interface{}{"input": "Should I use JWT?"})

    // At this point, memory contains Turns 2-5
    // Turn 1 ("Go project") is forgotten
}
```

### Adaptive Window Sizing

```go
type AdaptiveWindow struct {
    messages      []Message
    minWindow     int
    maxWindow     int
    tokenBudget   int
    mu            sync.RWMutex
}

func NewAdaptiveWindow(minWindow, maxWindow, tokenBudget int) *AdaptiveWindow {
    return &AdaptiveWindow{
        messages:    make([]Message, 0),
        minWindow:   minWindow,
        maxWindow:   maxWindow,
        tokenBudget: tokenBudget,
    }
}

func (aw *AdaptiveWindow) AddMessage(role, content string) {
    aw.mu.Lock()
    defer aw.mu.Unlock()

    aw.messages = append(aw.messages, Message{
        Role:    role,
        Content: content,
    })

    // Trim to fit token budget
    aw.trimToTokenBudget()
}

func (aw *AdaptiveWindow) trimToTokenBudget() {
    totalTokens := 0
    keepCount := 0

    // Count from newest to oldest
    for i := len(aw.messages) - 1; i >= 0; i-- {
        tokens := countTokens(aw.messages[i].Content)
        if totalTokens+tokens > aw.tokenBudget && keepCount >= aw.minWindow {
            break
        }
        totalTokens += tokens
        keepCount++

        if keepCount >= aw.maxWindow {
            break
        }
    }

    // Keep only the messages that fit
    if keepCount < len(aw.messages) {
        aw.messages = aw.messages[len(aw.messages)-keepCount:]
    }
}
```

### Pros & Cons

✅ **Pros:**
- Fixed memory footprint
- Maintains recent context
- Predictable token usage
- Good for most chatbot scenarios

❌ **Cons:**
- Loses older context completely
- May forget important earlier information
- Fixed window may not suit all use cases

### When to Use

✅ Use for:
- Chatbots and conversational AI
- Long-running conversations
- When only recent context matters
- Production systems with token budgets

❌ Don't use when:
- Need to reference distant past
- Critical not to lose any information
- Need adaptive context management

---

*(Continuing in next section due to length...)*

Let me create the complete second part with remaining sections:
