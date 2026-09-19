# Feature: Spec Reverse CLI

**Version:** 2.1.0  
**Status:** Draft  
**Updated:** 2026-03-30  
**AI Confidence:** Medium  
**Ambiguity:** Medium

---

## Keywords

`spec-reverse` · `golang` · `cli` · `reverse-engineering` · `codebase-analysis` · `ai-bridge` · `spec-generation` · `bidirectional`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Medium |
| Ambiguity | Medium |
| Health Score | 100/100 (A+) |

---

## Summary

A reverse-engineering CLI tool that analyzes existing codebases and generates structured specifications using AI Bridge. Outputs specifications in the same format as Spec Management Software, enabling bidirectional spec-to-code and code-to-spec workflows.

---

## Folder Structure

```
25-spec-reverse-cli/
├── 00-overview.md                          # This file
├── 01-backend/                             # Backend specifications
│   ├── 01-architecture.md                  # Core system design
│   ├── 02-code-analysis.md                 # Codebase scanning and parsing
│   ├── 03-ai-bridge-integration.md         # LLM-powered spec generation
│   ├── 04-output-formats.md                # Spec output templates
│   ├── 05-error-codes.md                   # Error code registry (11xxx)
│   └── 06-configuration.md                 # Config schema and defaults
├── 02-frontend/                            # Frontend specifications
│   └── 01-architecture.md                  # React UI for CLI management
├── 03-deploy/                              # Deployment specifications
│   └── 01-powershell.md                    # PowerShell integration
└── 99-consistency-report.md                # Consistency verification
```

---

## User Stories

- As a developer, I want to point Spec Reverse at an existing codebase and generate specs automatically
- As a developer, I want to choose between complex (SM-style) or simple (CLI-style) folder structures for output
- As a developer, I want AI Bridge to analyze code patterns and suggest appropriate spec categories
- As a developer, I want to feed generated specs to Spec Management Software for refinement
- As a developer, I want to incrementally update specs as codebase evolves

---

## Core Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Input Codebase │ ──▶ │   Code Parser   │ ──▶ │   AI Bridge     │
│  (any language) │     │   (AST + RAG)   │     │   (analysis)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Spec Management │ ◀── │  Spec Generator │ ◀── │  Spec Template  │
│    Software     │     │   (output)      │     │   Selector      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Output Folder Structure Options

### Option A: Complex (SM-Style)

For large software projects requiring comprehensive documentation.

```
output-specs/
├── 00-overview.md
├── 01-introduction/
│   ├── 00-overview.md
│   ├── 01-purpose.md
│   └── 02-scope.md
├── 02-architecture/
│   ├── 00-overview.md
│   ├── 01-system-design.md
│   ├── 02-data-models.md
│   └── 03-api-contracts.md
├── 03-features/
│   ├── 00-overview.md
│   ├── 01-feature-a/
│   │   ├── 00-overview.md
│   │   ├── 01-requirements.md
│   │   └── 02-implementation.md
│   └── ...
├── 04-error-codes/
│   └── 00-registry.md
└── 99-consistency-report.md
```

### Option B: Simple (CLI-Style)

For smaller tools, CLIs, and focused utilities.

```
output-specs/
├── 00-overview.md
├── 01-backend/
│   ├── 01-architecture.md
│   ├── 02-commands.md
│   └── 03-error-codes.md
├── 02-frontend/
│   └── 01-architecture.md
├── 03-deploy/
│   └── 01-powershell.md
└── 99-consistency-report.md
```

---

## Required Knowledge for Spec Reverse

The tool MUST have pre-loaded knowledge of:

| Knowledge Area | Location | Purpose |
|----------------|----------|---------|
| General Spec Patterns | `02-spec/01-general-spec/` | Foundation standards |
| Error Resolution | `02-spec/04-error-resolution/` | Debugging & verification patterns |
| Split DB Architecture | `02-spec/06-split-db-architecture/` | Database pattern |
| Seedable Config | `02-spec/07-seedable-config-architecture/` | Config pattern |
| Shared CLI Frontend | `02-spec/33-shared-cli-frontend/` | React UI patterns |
| PowerShell Integration | `02-spec/11-powershell-integration/` | Build scripts |
| Error Code Registry | `02-spec/03-error-code-registry/` | Error standards |
| RAG Memory Patterns | `02-spec/11-spec-management-software/05-features/09-knowledge-memory/` | RAG system |

---

## AI Bridge Integration

### Input to AI Bridge

```yaml
# spec-reverse-prompt.yaml
system: |
  You are a specification writer. Given code files, generate structured 
  specifications following the Spec Management Software format.
  
  Knowledge context:
  - Split DB: Hierarchical SQLite with project→workspace→base levels
  - Seedable Config: changelog.json + versioned defaults
  - Error Codes: Prefixed ranges (e.g., SR-11xxx for this tool)
  - RAG Memory: Vector embeddings + metadata for knowledge retrieval

prompt_template: |
  Analyze this codebase and generate specifications:
  
  ## Files
  {{#each files}}
  ### {{path}}
  ```{{language}}
  {{content}}
  ```
  {{/each}}
  
  ## Output Format
  {{structure_template}}

variables:
  structure_template: |
    Generate specs with:
    1. 00-overview.md (summary, user stories)
    2. 01-architecture.md (system design)
    3. 02-data-models.md (interfaces, types)
    4. 03-api-contracts.md (endpoints, responses)
    5. 04-error-codes.md (error registry)
```

### RAG Memory Formulation

When analyzing a chat history with mixed content (coding, voice, text):

1. **Chunking Strategy**
   - Code blocks → semantic code chunks
   - Voice transcripts → sentence-level chunks
   - Text messages → paragraph chunks

2. **Embedding Generation**
   - Each chunk → vector embedding via AI Bridge
   - Store in Split DB `RAGChunk` table

3. **Retrieval Flow**
   ```
   User Query → Embed → Vector Search → Top-K Chunks → Context Window → LLM
   ```

4. **Chat Formulation**
   ```typescript
   interface ChatContext {
     messages: Message[];      // Recent conversation
     ragChunks: RAGChunk[];   // Retrieved knowledge
     codeFiles: CodeFile[];   // Active file context
     voiceTranscripts?: string[]; // Voice input history
   }
   ```

---

## Retraining Steps

When retraining AI Bridge on new data/files:

### Step 1: Ingest Files
```bash
spec-reverse ingest ./path/to/codebase --recursive
```

### Step 2: Generate Embeddings
```bash
spec-reverse embed --model text-embedding-ada-002
```

### Step 3: Store in RAG Memory
```bash
spec-reverse index --db ./project.db
```

### Step 4: Verify Knowledge
```bash
spec-reverse query "How does authentication work?"
```

### Step 5: Generate Specs
```bash
spec-reverse generate --output ./specs --format complex
```

---

## Error Code Range

Spec Reverse CLI uses error codes **11000-11999**.

| Range | Category |
|-------|----------|
| 11000-11099 | General/Startup |
| 11100-11199 | Code Parsing |
| 11200-11299 | AI Bridge Communication |
| 11300-11399 | Spec Generation |
| 11400-11499 | Output/File Writing |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Error Resolution | `../03-error-manage/01-error-resolution/00-overview.md` |
| AI Bridge CLI | `../27-ai-bridge-cli/00-overview.md` |
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| Seedable Config Architecture | `../06-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../28-shared-cli-frontend/00-overview.md` |
| PowerShell Integration | `../11-powershell-integration/00-overview.md` |
| Error Code Registry | `../03-error-manage/03-error-code-registry/01-index.md` |
| Spec Management Software | `../21-app/spec-management-software/00-overview.md` |
| **DBOperation Wrapper** | `../21-app/spec-management-software/13-shared-packages/08-pkg-database-operations.md` |
| **ORM-Only Policy** | `.ai-memory/memories/standards/orm-only-policy.md` |

---

## Success Probability

| Component | Probability | Notes |
|-----------|-------------|-------|
| Code Parsing | 90% | Multi-language AST complexity |
| AI Analysis | 95% | Depends on AI Bridge stability |
| Spec Generation | 98% | Template-based output |
| SM Integration | 97% | Direct folder compatibility |
| **Overall** | **92%** | Lower due to reverse-engineering complexity |

---

*Specification created 2026-02-02 for Spec Reverse CLI tool.*
