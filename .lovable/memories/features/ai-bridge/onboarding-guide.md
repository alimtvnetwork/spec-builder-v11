# Memory: features/ai-bridge/onboarding-guide

**Updated:** 2026-02-05  
**Version:** 1.0.0  
**Scope:** AI Bridge CLI

---

## Overview

AI Bridge follows a standardized 4-phase onboarding and task lifecycle:

1. **Index** - RAG indexing of codebase via `aibridge index`
2. **Detect** - AST-based pattern recognition of naming and architecture
3. **Plan** - Detailed task breakdown in `.lovable/plan.md`
4. **Execute** - TwoStage reasoning-first implementation logic

---

## Complete Workflow

```
PHASE 1: INDEX CODEBASE
├── Scan files (compute SHA256)
├── Parse AST (Go/TypeScript/JavaScript)
├── Chunk semantically (300-500 tokens)
├── Embed via nomic-embed-text
└── Store in Split DB

PHASE 2: DETECT PATTERNS
├── Naming conventions (PascalCase)
├── Error handling patterns
├── Architecture patterns (Service-Repository)
├── Database patterns (ORM usage)
└── Style patterns (test structure)

PHASE 3: CREATE PLAN
├── Query RAG for context
├── Load detected patterns
├── TwoStage reasoning (clarify → confirm)
├── Task breakdown with dependencies
└── Output to .lovable/plan.md

PHASE 4: EXECUTE WITH REASONING
├── Stage 1: Understand (ask clarifying questions)
├── Stage 2: Confirm (verify understanding)
├── Stage 3: Execute (generate code)
├── Create checkpoints
└── Report results
```

---

## CLI Commands

```bash
# Initialize project
aibridge init

# Index codebase
aibridge index --path ./ --lang go,ts,js

# Incremental re-index
aibridge index --incremental

# View detected patterns
aibridge patterns list

# Create plan
aibridge plan create "Add feature X"

# Execute plan
aibridge plan execute
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Full Specification | `spec/22-ai-bridge-cli/01-backend/47-onboarding-guide.md` |
| RAG Pipeline | `.lovable/memories/features/ai-bridge/rag-pipeline.md` |
| Plan Synchronization | `spec/22-ai-bridge-cli/01-backend/45-plan-synchronization.md` |
| Execution Monitoring | `spec/22-ai-bridge-cli/01-backend/48-plan-execution-monitoring.md` |
