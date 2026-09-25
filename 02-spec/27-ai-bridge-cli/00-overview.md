# Feature: AI Bridge CLI

**Version:** 3.1.0  
**Status:** Complete  
**Updated:** 2026-03-30  
**AI Confidence:** Production-Ready  
**Ambiguity:** Low

---

## Keywords

`ai-bridge` · `golang` · `cli` · `llm` · `ollama` · `rag` · `agentic-mode` · `seo-generation` · `rubric-validation` · `model-management` · `websocket`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Summary

External AI adapter providing a unified interface for LLM communication, supporting multiple input formats (Markdown, JSON, YAML, CSV), dual execution modes (local binary + background service), and comprehensive model management with category-based selection for different AI tasks.

---

## Folder Structure

```
27-ai-bridge-cli/
├── 00-overview.md                          # This file
├── 01-backend/                             # Backend specifications (60+ files)
│   ├── voice/                              # Voice processing sub-module
│   ├── 00-overview.md                      # Backend overview & file index
│   ├── 01-architecture.md                  # Core system design
│   ├── 02-input-formats.md                 # Markdown, JSON, YAML, CSV handlers
│   ├── 03-startup-modes.md                 # Binary vs daemon execution
│   ├── 04-api-interface.md                 # REST + WebSocket API (63+ endpoints)
│   ├── 05-error-codes.md                   # Error code registry (9xxx)
│   ├── 06-configuration.md                 # Config schema and defaults
│   ├── 07-model-management.md              # Category-based model selection
│   ├── 08-split-db-integration.md          # Chat, RAG, file history persistence
│   ├── 09-agentic-mode.md                  # Long-chain events & tool delegation
│   ├── 10-openapi-spec.md                  # Swagger/OpenAPI specification (core)
│   ├── 11-rag-reindexing.md                # RAG re-indexing modes
│   ├── 12-database-architecture.md         # Complete Split DB implementation
│   ├── 13-ai-seo-generate.md               # SEO content generation module
│   ├── 14-reset-and-export-api.md          # 2-step reset and import/export APIs
│   ├── 15-ai-seo-implementation-checklist.md # SEO module implementation phases
│   ├── 16-ai-seo-error-codes.md            # SEO error handling patterns
│   ├── 17-ai-seo-core-guidelines.md        # 19 EEAT writing rules (preset)
│   ├── 18-ai-seo-content-types.md          # 6 content types + output formats
│   ├── 19-ai-seo-variable-system.md        # CSV/JSON/YAML variable injection
│   ├── 20-wordpress-integration-idea.md    # WordPress CLI integration (idea)
│   ├── 21-sitemap-indexing.md              # Sitemap RAG for internal linking
│   ├── 22-ai-seo-faq-generation.md         # FAQ generation endpoints
│   ├── 23-ai-seo-faq-go-structs.md         # FAQ Go struct definitions
│   ├── 24-ai-seo-faq-implementation-checklist.md # FAQ implementation phases
│   ├── 25-ai-seo-paragraph-generation.md   # Paragraph generation endpoints
│   ├── 26-database-paths-reference.md      # Central DB path reference (v3.0)
│   ├── 27-ai-seo-blog-generation.md        # Blog generation endpoints
│   ├── 28-company-profile-management.md    # Company CRUD & scoping
│   ├── 29-gsearch-url-extraction.md        # URL extraction via gSearch
│   ├── 30-openapi-spec-seo.md              # OpenAPI spec for SEO endpoints
│   ├── 31-revision-feedback-system.md      # Content revision workflows
│   ├── 32-tool-delegation.md               # Tool delegation to external CLIs
│   ├── 33-database-migration-guide.md      # DB migration guide (v3.0)
│   ├── 34-suggestions-system.md            # AI suggestion engine
│   ├── 35-unified-revisions-architecture.md # Cross-content revision architecture
│   ├── 36-session-scoped-rag-memory.md     # Per-session RAG memory
│   ├── 37-adaptive-reasoning-flow.md       # Adaptive reasoning pipeline
│   ├── 38-websocket-connection-manager.md  # WebSocket lifecycle management
│   ├── 39-adaptive-reasoning-api.md        # Reasoning API endpoints
│   ├── 40-gsearch-context-integration.md   # gSearch context for AI prompts
│   ├── 41-memory-classification-flags.md   # Memory tier classification
│   ├── 42-lovable-reasoning-defaults.md    # Default reasoning configurations
│   ├── 43-code-pattern-learning.md         # Code pattern recognition
│   ├── 44-plan-generation.md               # Plan generation from specs
│   ├── 45-plan-synchronization.md          # Plan sync across sessions
│   ├── 46-plan-templates.md                # Reusable plan templates
│   ├── 47-onboarding-guide.md              # Developer onboarding workflow
│   ├── 48-plan-execution-monitoring.md     # Execution monitoring & metrics
│   ├── 49-execution-retry-strategies.md    # Retry policies & budgets
│   ├── 50-long-chain-command-system.md     # Long-chain command orchestration
│   ├── 51-vector-database-integration.md   # Vector DB for RAG
│   ├── 52-research-mode.md                 # Research mode workflows
│   ├── 53-enum-architecture.md             # Type-safe enum definitions
│   ├── 54-memory-retrieval-best-practices.md # RAG retrieval algorithms
│   ├── 55-html-blog-generation.md          # HTML blog output format
│   ├── 56-observability.md                 # Prometheus, health checks, tracing
│   ├── 57-settings-service.md              # Settings service with seedable config
│   ├── 58-rubric-validation/               # AI response rubric validation system (13 files)
│   │   ├── 00-overview.md                  # System overview, profiles, config
│   │   ├── 01-factual-accuracy.md          # Factual correctness rubric
│   │   ├── 02-instruction-following.md     # Instruction compliance rubric
│   │   ├── 03-completeness.md              # Response completeness rubric
│   │   ├── 04-relevance-coherence.md       # Relevance & logical coherence rubric
│   │   ├── 05-safety-harmlessness.md       # Safety & harm prevention rubric
│   │   ├── 06-tone-style.md                # Tone & style matching rubric
│   │   ├── 07-code-quality.md              # Code quality & standards rubric
│   │   ├── 08-groundedness.md              # Source grounding & citation rubric
│   │   ├── 09-consistency.md               # Internal & contextual consistency rubric
│   │   ├── 10-conciseness.md               # Verbosity & conciseness rubric
│   │   ├── 11-context-utilization.md       # Context usage rubric
│   │   └── 12-self-validation-engine.md    # Orchestration engine & retry loop
│   └── 99-acceptance-criteria.md           # Acceptance criteria
├── 02-frontend/                            # Frontend specifications (6 files)
│   ├── 00-overview.md                      # Frontend overview
│   ├── 01-architecture.md                  # React UI for CLI management
│   ├── 02-implementation-checklist.md      # Frontend implementation phases
│   ├── 03-testing-ui-page.md               # Testing UI page spec
│   ├── 04-adaptive-reasoning-settings-ui.md # Reasoning settings UI
│   └── 05-dashboard-specification.md       # Dashboard page spec
├── 03-deploy/                              # Deployment specifications (2 files)
│   ├── 00-overview.md                      # Deploy overview
│   └── 01-powershell.md                    # PowerShell integration
├── 04-verification-report.md               # Feature verification & gaps
└── 99-consistency-report.md                # Consistency verification
```

---

## User Stories

- As a developer, I want to feed prompts via Markdown files with YAML frontmatter
- As a developer, I want to import structured data from JSON/CSV for batch AI processing
- As a developer, I want to run AI Bridge CLI as a CLI tool or background daemon
- As a developer, I want AI Bridge CLI to abstract different LLM backends (Ollama, llama.cpp, OpenAI-compatible)
- As a developer, I want to select different models for different tasks (coding, writing, reasoning, voice, image, video)
- As a developer, I want persistent chat history with RAG memory support
- As a developer, I want to configure and switch models via UI or API
- As a developer, I want agentic mode for long-chain command execution

---

## Model Categories

| Category | Purpose | Default Model |
|----------|---------|---------------|
| `thinking` | Reasoning, planning | qwen2.5-coder:32b |
| `writing` | Content generation | llama3.1:8b |
| `coding` | Code generation | deepseek-coder:6.7b |
| `voice` | Speech-to-text | whisper:large-v3 |
| `tts` | Text-to-speech | xtts-v2 |
| `image-gen` | Image generation | stable-diffusion-xl |
| `image-understand` | Image analysis | llava:13b |
| `video` | Video generation | stable-video-diffusion |
| `agentic` | Long-chain commands | qwen2.5-coder:32b |
| `custom` | User-defined | Configurable |

---

## Backend Support

| Backend | Type | Default Port |
|---------|------|--------------|
| Ollama | LLM | 11434 |
| llama.cpp | LLM | 8080 |
| llama-swap | Proxy | 8081 |
| Whisper | STT | 9000 |
| XTTS | TTS | 8020 |
| SD-API | Image | 7860 |
| SVD-API | Video | 7861 |

---

## Error Code Range

AI Bridge CLI uses error codes **9000-9999**.

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| Seedable Config Architecture | `../06-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../33-shared-cli-frontend/00-overview.md` |
| PowerShell Integration | `../11-powershell-integration/00-overview.md` |
| Error Resolution | `../03-error-manage/01-error-resolution/00-overview.md` |
| **DBOperation Wrapper** | `../04-database-conventions/01-sqlite-standards.md` |
| **ORM-Only Policy** | `../04-database-conventions/02-orm-standards.md` |
