# 00 - AI Research Overview

**Module:** AI Research  
**Version:** 2.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** Low

---

## Keywords

`ai-research` · `vector-database` · `llm` · `rag` · `embeddings` · `ai-bridge` · `gsearch` · `research-notes`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | High |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Purpose

This folder contains research materials for improving the AI Bridge and GSearch CLI systems. The research covers vector databases, LLM frameworks, and RAG implementation strategies.

---

## Files

| File | Description |
|------|-------------|
| `01-additional-vector-databases-and-tools-guide.md` | Deep dive into chromem-go, Qdrant, MongoDB, DuckDB, llama.go |
| `02-complete-ai-database-and-framework-ecosystem-guide.md` | Comprehensive guide for vector DBs, SQL analytics, LLM tools |
| `03-rag-programming-language-analysis.md` | Go vs Rust vs Python comparison for RAG systems |
| `04-rag-memory-systems-complete-guide.md` | Memory hierarchy (attention/short-term/long-term), conversation buffer, entity memory, Go implementations |
| `05-rag-memory-training-and-go-implementation-guide.md` | Long-term vector store memory, Go framework deep dive (langchaingo, LinGoose, golc), training & fine-tuning, production patterns |

---

## Key Findings Summary

### Technology Recommendation

**Primary Choice: Go** with the following stack:

```
chromem-go        // Vector storage (Pure Go, zero deps)
+ ollama-go       // LLM via Ollama
+ langchaingo     // Orchestration (optional)
+ modernc.org/sqlite  // Metadata storage
```

### Performance Benchmarks

| Metric | Go (chromem-go) | Rust | Python |
|--------|-----------------|------|--------|
| Query Latency (100k docs) | 40ms | 180ms | 2100ms |
| Memory Usage | 8-12 MB | 15-25 MB | 25-40 MB |
| Throughput (QPS) | 150-250 | 200-300 | 50-100 |

### Vector Database Options

| Database | Best For | Pure Go? | Scale |
|----------|----------|----------|-------|
| chromem-go | Embedded, <1M docs | ✅ Yes | Medium |
| Qdrant | Production, billions | ❌ Rust | Large |
| Milvus | Enterprise | ❌ Go/C++ | Very Large |
| Pinecone | Managed cloud | N/A | Large |

### Embedding Providers

| Provider | Latency | Cost | Local? |
|----------|---------|------|--------|
| Ollama (nomic-embed-text) | 50ms | Free | ✅ Yes |
| OpenAI | 100ms | $0.13/1M | ❌ No |
| Cohere | 90ms | $0.10/1M | ❌ No |
| Jina | 95ms | $0.02/1M | ❌ No |

---

## Research Analysis: Attention & Short-Term Memory Best Practices

### Key Insights from Files 04 and 05

**1. Memory Hierarchy Maps Directly to AI Bridge Architecture:**

| Memory Type | Human Analogy | AI Bridge Implementation |
|-------------|--------------|--------------------------|
| Attention (Context Window) | Working memory | `IsAttention` flag on `RagChunks` — marks chunks critical to current conversation |
| Short-Term Memory | Recent events | `IsShortTerm` flag on `RagChunks` — session-scoped, linked to recent conversation nodes |
| Long-Term Memory | Knowledge base | Existing `IsCritical` + `IsImportant` flags — persistent RAG chunks |

**2. Attention Memory Best Practices:**
- Attention chunks are **ephemeral** — they last only for the current conversation turn or session
- Mark chunks as attention when they directly answer the current user query
- Attention score boost should be **highest** (4.0x) since these are immediately relevant
- Auto-expire attention flags after conversation turn completes (demote to short-term or clear)
- Maximum attention chunks should be limited by token budget (model context window)

**3. Short-Term Memory Best Practices:**
- Short-term memory survives across turns **within a session**
- Use `ChunkLinks` to create a graph of related short-term memories
- Short-term memories should be **auto-tagged** with conversation keywords
- Decay strategy: Short-term memories lose relevance over time; apply a time-decay multiplier
- Link creation: When a new chunk is marked short-term, auto-link to the 3-5 most recent short-term chunks in the same session

**4. Retrieval Algorithm Insights (from research):**
- **Hybrid Search** (semantic + keyword) outperforms pure vector search by 15-25%
- **Reciprocal Rank Fusion** (RRF) is the recommended method for combining rankings
- **Tag-based pre-filtering** before vector search reduces latency from 200ms to <50ms
- **Entity extraction** during ingestion enables structured memory graphs
- **Token budget allocation**: System prompt (10%) → Retrieved context (40%) → Conversation history (30%) → Generation (20%)

**5. Go Framework Comparison for Memory:**

| Framework | Memory Types | Best For |
|-----------|-------------|----------|
| langchaingo | Buffer, Window, Summary | General-purpose RAG |
| LinGoose | Custom memory interfaces | Flexible architectures |
| golc | Buffer, Summary, Token | Token-aware applications |

**6. Production Patterns:**
- Use **conversation summary** for sessions exceeding token budget (compress old turns into a summary)
- Implement **entity memory** to track named entities (people, projects, technologies) across sessions
- Store conversation turns in vector DB for **cross-session retrieval** of similar past discussions
- **Chunk size**: 512-1024 tokens with 50-200 token overlap for semantic boundary preservation

---

## Action Items

Based on this research, the following improvements are planned:

1. **Replace Quincoder** with internal long-chain reasoning
2. **Integrate chromem-go** for embedded vector search
3. **Use Ollama** for local embeddings (nomic-embed-text)
4. **Implement parallel processing** for URL fetching
5. **Decompose large models** in GSearch
6. **Add attention/short-term memory tiers** to RAG architecture (Phase 2)
7. **Implement tag-based pre-filtering** for <50ms retrieval (Phase 3)
8. **Build hybrid search** (semantic + keyword with RRF) for improved recall

See `.lovable/plan.md` for detailed implementation plan.

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Implementation Plan | `.lovable/plan.md` |
| AI Bridge Specs | `spec/22-ai-bridge-cli/` |
| GSearch Specs | `spec/20-gsearch-cli/` |
| RAG Pipeline | `spec/22-ai-bridge-cli/01-backend/47-onboarding-guide.md` |
| Memory Standard | `.lovable/memories/features/ai-bridge/memory-classification.md` |
| Memory Classification | `spec/22-ai-bridge-cli/01-backend/41-memory-classification-flags.md` |
