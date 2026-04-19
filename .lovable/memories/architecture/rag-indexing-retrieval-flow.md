 # Memory: architecture/rag-indexing-retrieval-flow


**Version:** 1.0.0  

 
 **Updated:** 2026-02-05  
 **Spec Location:** `spec/22-ai-bridge-cli/01-backend/`
 
 ---
 
 ## Overview
 
 Complete RAG (Retrieval-Augmented Generation) pipeline for AI Bridge codebase processing, from initial indexing to context-aware code generation.
 
 ---
 
 ## Complete Pipeline Visualization
 
 ```mermaid
 flowchart TB
     subgraph INPUT ["📁 INPUT PHASE"]
         A[User Provides Codebase] --> B[CLI: aibridge index --path ./src]
         B --> C{Index Mode?}
         C -->|full| D[Complete Rebuild]
         C -->|incremental| E[Hash Compare]
         C -->|diff| F[Git-Aware Delta]
     end
 
     subgraph SCAN ["🔍 SCANNING PHASE"]
         D & E & F --> G[Directory Walker]
         G --> H[Apply .gitignore + Custom Patterns]
         H --> I[Compute SHA256 File Hashes]
         I --> J{Hash Changed?}
         J -->|No| K[Skip File]
         J -->|Yes| L[Queue for Processing]
     end
 
     subgraph PARSE ["🧩 PARSING PHASE"]
         L --> M[Language Detection]
         M --> N{File Type}
         N -->|Go| O[go/parser AST]
         N -->|TypeScript| P[TypeScript Compiler API]
         N -->|JavaScript| Q[Babel Parser]
         N -->|Markdown| R[Goldmark Parser]
         O & P & Q & R --> S[Extract Semantic Units]
         S --> T[Functions, Types, Imports, Comments]
     end
 
     subgraph CHUNK ["✂️ CHUNKING PHASE"]
         T --> U[Semantic Boundary Splitter]
         U --> V[Apply Size Limits<br/>Default: 512 tokens]
         V --> W[Add Overlap<br/>Default: 64 tokens]
         W --> X[Preserve Metadata<br/>FilePath, LineStart, LineEnd]
     end
 
     subgraph EMBED ["🧠 EMBEDDING PHASE"]
         X --> Y[Batch Chunks<br/>Max: 100 per batch]
         Y --> Z[Generate Embeddings<br/>nomic-embed-text / OpenAI]
         Z --> AA[768-dim Vector per Chunk]
     end
 
     subgraph STORE ["💾 STORAGE PHASE"]
         AA --> AB[Split DB Architecture]
         AB --> AC[data/app/rag/code/company/task.db]
         AC --> AD[RagChunks Table]
         AD --> AE[Store: Content, Embedding BLOB,<br/>IsCritical, IsImportant Flags]
     end
 
     subgraph RETRIEVE ["🔎 RETRIEVAL PHASE"]
         AF[User Query: Implement X] --> AG[Query Embedding]
         AG --> AH[Vector Similarity Search<br/>Cosine Distance]
         AH --> AI[Top-K Chunks<br/>Default: 10]
         AI --> AJ{Check Flags}
         AJ --> AK[Prioritize IsCritical Chunks]
         AK --> AL[Include IsImportant Chunks]
     end
 
     subgraph INJECT ["💉 CONTEXT INJECTION"]
         AL --> AM[Assemble Context Window]
         AM --> AN[Add: Retrieved Chunks +<br/>Conversation History +<br/>System Prompts]
         AN --> AO[Token Budget Check<br/>Max: 128K tokens]
         AO --> AP[Inject into LLM Prompt]
     end
 
     subgraph GENERATE ["⚡ GENERATION PHASE"]
         AP --> AQ[Reasoning Step First]
         AQ --> AR{Ambiguities?}
         AR -->|Yes| AS[Generate Clarifying Questions<br/>with Sample Answers]
         AS --> AT[Wait for User Response]
         AT --> AQ
         AR -->|No| AU[Understanding Check<br/>Confirm Plan with User]
         AU --> AV[Generate Code<br/>Match Detected Patterns]
         AV --> AW[Output + Suggestions]
     end
 
     STORE --> RETRIEVE
 ```
 
 ---
 
 ## Database Schema (RagChunks Table)
 
 ```sql
 CREATE TABLE RagChunks (
     Id TEXT PRIMARY KEY,
     TaskId TEXT NOT NULL,
     FilePath TEXT NOT NULL,
     LineStart INTEGER,
     LineEnd INTEGER,
     Content TEXT NOT NULL,
     Embedding BLOB NOT NULL,        -- 768-dim float32 vector
     TokenCount INTEGER,
     IsCritical BOOLEAN DEFAULT 0,   -- Cannot skip during retrieval
     IsImportant BOOLEAN DEFAULT 0,  -- Prioritized in ranking
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 
 CREATE INDEX idx_chunks_task ON RagChunks(TaskId);
 CREATE INDEX idx_chunks_file ON RagChunks(FilePath);
 CREATE INDEX idx_chunks_critical ON RagChunks(IsCritical);
 ```
 
 ---
 
 ## Retrieval Ranking Formula
 
 ```
 FinalScore = (CosineSimilarity × 0.7) 
            + (IsCritical × 0.2) 
            + (IsImportant × 0.1)
            + (RecencyBoost × 0.05)
 ```
 
 ---
 
 ## Key Metrics
 
 | Metric | Target |
 |--------|--------|
 | Recall Accuracy | 92-97% |
 | Indexing Speed | 1000 files/min |
 | Query Latency | < 100ms |
 | Context Precision | > 85% relevance |