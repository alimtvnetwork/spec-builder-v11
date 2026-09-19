# AI Bridge CLI: Backend Overview

> **Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

**Version:** 5.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`bridge`, `cli`, `backend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

This folder contains all backend specifications for AI Bridge CLI, including core infrastructure, SEO content generation, and API definitions.

---

## Quick Navigation

| Section                                                     | Description                            |
| ----------------------------------------------------------- | -------------------------------------- |
| [Database Architecture](#database-architecture)             | Split DB pattern and storage hierarchy |
| [API Endpoints](#api-endpoints)                             | Complete REST API reference            |
| [Go Structs](#go-structs)                                   | Key data structures                    |
| [Error Codes](#error-codes)                                 | Error code ranges by module            |
| [Consistency Recommendations](#consistency-recommendations) | Architectural patterns                 |

---

## Files

| File                                      | Description                                                |
| ----------------------------------------- | ---------------------------------------------------------- |
| 01-architecture.md                        | Core system design                                         |
| 02-input-formats.md                       | Markdown, JSON, YAML, CSV handlers                         |
| 03-startup-modes.md                       | Binary vs daemon execution                                 |
| 04-api-interface.md                       | REST + WebSocket API (38+ endpoints)                       |
| 05-error-codes.md                         | Error code registry (9xxx)                                 |
| 06-configuration.md                       | Config schema and defaults                                 |
| 07-model-management.md                    | Category-based model selection                             |
| 08-split-db-integration.md                | Chat, RAG, file history persistence                        |
| 09-agentic-mode.md                        | Agentic execution with tool calls                          |
| 10-openapi-spec.md                        | OpenAPI/Swagger specification (core)                       |
| 11-rag-reindexing.md                      | RAG re-indexing modes                                      |
| 12-database-architecture.md               | Complete Split DB implementation                           |
| 13-ai-seo-generate.md                     | SEO content generation module                              |
| 14-reset-and-export-api.md                | 2-step reset and import/export APIs                        |
| 15-ai-seo-implementation-checklist.md     | SEO module implementation phases                           |
| 16-ai-seo-error-codes.md                  | SEO error handling patterns                                |
| 17-ai-seo-core-guidelines.md              | 19 EEAT writing rules (preset)                             |
| 18-ai-seo-content-types.md                | 6 content types + output formats                           |
| 19-ai-seo-variable-system.md              | CSV/JSON/YAML variable injection                           |
| 20-wordpress-integration-idea.md          | WordPress CLI integration (idea)                           |
| 21-sitemap-indexing.md                    | Sitemap RAG for internal linking                           |
| 22-ai-seo-faq-generation.md               | FAQ generation endpoints                                   |
| 23-ai-seo-faq-go-structs.md               | FAQ Go struct definitions                                  |
| 24-ai-seo-faq-implementation-checklist.md | FAQ implementation phases                                  |
| 25-ai-seo-paragraph-generation.md         | Paragraph generation endpoints                             |
| 26-database-paths-reference.md            | Centralized path definitions                               |
| 27-ai-seo-blog-generation.md              | Blog generation endpoints                                  |
| **28-company-profile-management.md**      | Company profile, multi-CTA, style training                 |
| **29-gsearch-url-extraction.md**          | URL extraction with multi-format output                    |
| **30-openapi-spec-seo.md**                | Complete OpenAPI spec for SEO suite                        |
| 31-revision-feedback-system.md            | Revision and feedback management                           |
| 32-tool-delegation.md                     | External tool delegation                                   |
| 33-database-migration-guide.md            | Schema migration guide                                     |
| **34-suggestions-system.md**              | **Unified suggestions with hybrid storage**                |
| **35-unified-revisions-architecture.md**  | **Simplified cross-module revisions with per-type tables** |
| **36-session-scoped-rag-memory.md**       | **Session-scoped RAG memory lifecycle**                    |
| **37-adaptive-reasoning-flow.md**         | **AI reasoning modes and clarification system**            |
| **38-websocket-connection-manager.md**    | **WebSocket resilience with queue and retry logic**        |
| **39-adaptive-reasoning-api.md**          | **Reasoning configuration CRUD endpoints**                 |
| **40-gsearch-context-integration.md**     | **GSearch context fetching for adaptive reasoning**        |

---

## Database Architecture

### Hierarchical Split DB Pattern

```
data/
├── aibridge.db                                      # Root DB (global)
└── {appName}/
    ├── search.db                                    # Search metadata
    ├── ai/
    │   └── chat/
    │       └── {seq}-{session-id}.db                # Individual chat DBs
    └── rag/
        └── seo/
            ├── {company-slug}.db                    # Company Root DB
            └── {company-slug}/
                └── blog/
                    └── {seq}-{blog-slug}.db         # Individual Blog DBs
```

### Database Summary

| Database            | Path                                                    | Purpose                                 |
| ------------------- | ------------------------------------------------------- | --------------------------------------- |
| **Root DB**         | `data/aibridge.db`                                      | Global settings, app registry, counters |
| **Search DB**       | `data/{appName}/search.db`                              | Search cache and metadata               |
| **Chat Session DB** | `data/{appName}/ai/chat/{seq}-{id}.db`                  | Individual chat sessions                |
| **Company Root DB** | `data/{appName}/rag/seo/{company}.db`                   | SEO training, FAQ, Para, Blog registry  |
| **Blog DB**         | `data/{appName}/rag/seo/{company}/blog/{seq}-{slug}.db` | Individual blog content                 |

### Root DB Tables

| Table          | Purpose                                     |
| -------------- | ------------------------------------------- |
| `Settings`     | Global configuration (key-value with types) |
| `Applications` | App registry (gsearch, brun, etc.)          |
| `Counters`     | Sequence counters per category              |
| `DbRegistry`   | Registry of all child databases             |

### Company Root DB Tables (`{company-slug}.db`)

| Table                      | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `CompanyProfile`           | Company metadata and preferences            |
| `CompanyCtas`              | **Multiple CTA entries with type/priority** |
| `CompanyServices`          | Services offered                            |
| `CompanyLocations`         | Service areas/locations                     |
| `CompanyKeywords`          | Target keywords                             |
| `CompanyReferenceArticles` | **Reference articles for style training**   |
| `CompanyWritingStyle`      | **Extracted writing style metrics**         |
| `FaqTrainingChunks`        | RAG chunks from FAQ training                |
| `FaqSessions`              | FAQ generation session registry             |
| `FaqGeneratedContent`      | Generated FAQ history                       |
| `ParaTrainingChunks`       | RAG chunks from paragraph training          |
| `ParaSessions`             | Paragraph generation sessions               |
| `ParaGeneratedContent`     | Generated paragraph history                 |
| `SitemapIndex`             | Indexed sitemap URLs for linking            |
| `BlogRegistry`             | Registry of all blogs with DB paths         |
| `BlogCategories`           | Blog category definitions                   |

### Individual Blog DB Tables (`{seq}-{blog-slug}.db`)

| Table               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `BlogMeta`          | Title, slug, category, keywords, status |
| `BlogOutline`       | Outline structure                       |
| `BlogSections`      | Section content and metadata            |
| `BlogQuotations`    | Quotations used                         |
| `BlogLinks`         | Internal/external links                 |
| `BlogFaqs`          | Blended FAQ content                     |
| `GenerationHistory` | Version history                         |

---

## API Endpoints

### Endpoint Design Principles

All SEO endpoints follow **RESTful company-scoped patterns**:

```
/api/v1/seo/{company}/{resource}[/{id}]
```

- `{company}` = Company slug (e.g., `atto-property`)
- `{resource}` = Resource type (blogs, faq, para, categories)
- `{id}` = Resource identifier (accepts ID or slug)

### Complete API Reference

#### Core Generation APIs (Non-Scoped)

| Method | Endpoint                      | Description                 | Spec                |
| ------ | ----------------------------- | --------------------------- | ------------------- |
| POST   | `/generate`                   | Synchronous text generation | 04-api-interface.md |
| POST   | `/generate/stream`            | SSE streaming generation    | 04-api-interface.md |
| POST   | `/batch`                      | Batch parallel processing   | 04-api-interface.md |
| GET    | `/batch/:id`                  | Get batch status            | 04-api-interface.md |
| POST   | `/chat/sessions`              | Create chat session         | 04-api-interface.md |
| GET    | `/chat/sessions`              | List chat sessions          | 04-api-interface.md |
| POST   | `/chat/sessions/:id/messages` | Send chat message           | 04-api-interface.md |
| GET    | `/chat/sessions/:id/messages` | Get chat history            | 04-api-interface.md |

#### SEO Global APIs

| Method | Endpoint                | Description                           | Spec       |
| ------ | ----------------------- | ------------------------------------- | ---------- |
| GET    | `/api/v1/seo/companies` | List all companies                    | 28-company |
| POST   | `/api/v1/seo/companies` | Create new company                    | 28-company |
| GET    | `/api/v1/seo/blogs`     | List all blogs (admin, cross-company) | 27-blog    |

#### SEO Company-Scoped APIs

| Method | Endpoint                | Description                              | Spec       |
| ------ | ----------------------- | ---------------------------------------- | ---------- |
| GET    | `/api/v1/seo/{company}` | Company summary (blogs, faq, para, chat) | 27-blog    |
| PUT    | `/api/v1/seo/{company}` | Update company profile                   | 28-company |
| DELETE | `/api/v1/seo/{company}` | Delete company and all data              | 28-company |

#### CTA APIs (`/api/v1/seo/{company}/ctas`)

| Method | Endpoint                            | Description               | Spec       |
| ------ | ----------------------------------- | ------------------------- | ---------- |
| GET    | `/api/v1/seo/{company}/ctas`        | List all CTAs             | 28-company |
| POST   | `/api/v1/seo/{company}/ctas`        | Add CTA                   | 28-company |
| GET    | `/api/v1/seo/{company}/ctas/random` | Get random CTA (weighted) | 28-company |
| PUT    | `/api/v1/seo/{company}/ctas/{id}`   | Update CTA                | 28-company |
| DELETE | `/api/v1/seo/{company}/ctas/{id}`   | Delete CTA                | 28-company |

#### Reference Article APIs (`/api/v1/seo/{company}/articles`)

| Method | Endpoint                              | Description                                 | Spec       |
| ------ | ------------------------------------- | ------------------------------------------- | ---------- |
| GET    | `/api/v1/seo/{company}/articles`      | List reference articles                     | 28-company |
| POST   | `/api/v1/seo/{company}/articles`      | Add reference article (triggers extraction) | 28-company |
| DELETE | `/api/v1/seo/{company}/articles/{id}` | Delete reference article                    | 28-company |
| GET    | `/api/v1/seo/{company}/style`         | Get aggregated writing style                | 28-company |
| POST   | `/api/v1/seo/{company}/style/analyze` | Re-analyze all articles                     | 28-company |

#### Blog APIs (`/api/v1/seo/{company}/blogs`)

| Method | Endpoint                              | Description                     | Spec    |
| ------ | ------------------------------------- | ------------------------------- | ------- |
| GET    | `/api/v1/seo/{company}/blogs`         | List company blogs (paginated)  | 27-blog |
| GET    | `/api/v1/seo/{company}/blogs/{id}`    | Get single blog (by ID or slug) | 27-blog |
| POST   | `/api/v1/seo/{company}/blogs`         | Generate new blog               | 27-blog |
| PUT    | `/api/v1/seo/{company}/blogs/{id}`    | Update blog                     | 27-blog |
| DELETE | `/api/v1/seo/{company}/blogs/{id}`    | Delete blog                     | 27-blog |
| POST   | `/api/v1/seo/{company}/blogs/train`   | Train blog generation           | 27-blog |
| POST   | `/api/v1/seo/{company}/blogs/outline` | Generate outline only           | 27-blog |

#### Category APIs (`/api/v1/seo/{company}/categories`)

| Method | Endpoint                                  | Description            | Spec    |
| ------ | ----------------------------------------- | ---------------------- | ------- |
| GET    | `/api/v1/seo/{company}/categories`        | List categories        | 27-blog |
| POST   | `/api/v1/seo/{company}/categories`        | Create/update category | 27-blog |
| DELETE | `/api/v1/seo/{company}/categories/{slug}` | Delete category        | 27-blog |

#### FAQ APIs (`/api/v1/seo/{company}/faq`)

| Method | Endpoint                          | Description          | Spec   |
| ------ | --------------------------------- | -------------------- | ------ |
| GET    | `/api/v1/seo/{company}/faq`       | List FAQ sessions    | 22-faq |
| GET    | `/api/v1/seo/{company}/faq/{id}`  | Get FAQ content      | 22-faq |
| POST   | `/api/v1/seo/{company}/faq`       | Generate FAQ         | 22-faq |
| PUT    | `/api/v1/seo/{company}/faq/{id}`  | Update FAQ           | 22-faq |
| DELETE | `/api/v1/seo/{company}/faq/{id}`  | Delete FAQ           | 22-faq |
| POST   | `/api/v1/seo/{company}/faq/train` | Train FAQ generation | 22-faq |

#### Paragraph APIs (`/api/v1/seo/{company}/para`)

| Method | Endpoint                           | Description                 | Spec    |
| ------ | ---------------------------------- | --------------------------- | ------- |
| GET    | `/api/v1/seo/{company}/para`       | List generated paragraphs   | 25-para |
| GET    | `/api/v1/seo/{company}/para/{id}`  | Get paragraph content       | 25-para |
| POST   | `/api/v1/seo/{company}/para`       | Generate paragraph          | 25-para |
| PUT    | `/api/v1/seo/{company}/para/{id}`  | Update/regenerate paragraph | 25-para |
| DELETE | `/api/v1/seo/{company}/para/{id}`  | Delete paragraph            | 25-para |
| POST   | `/api/v1/seo/{company}/para/train` | Train paragraph generation  | 25-para |

#### Extraction APIs

| Method | Endpoint          | Description                        | Spec       |
| ------ | ----------------- | ---------------------------------- | ---------- |
| POST   | `/api/v1/extract` | Extract URL content (multi-format) | 29-extract |

---

## Go Structs

### Naming Convention

All structs follow **PascalCase** for fields. JSON tags use `json:",omitempty"` only.

### Core Structs

```go
// Company-level summary (GET /api/v1/seo/{company})
type CompanySummaryResponse struct {
    Success    bool
    Company    CompanyInfo
    Summary    SeoSummary
    Categories []CategoryBrief
}

type CompanyInfo struct {
    Slug      string
    Name      string
    Website   string
    CreatedAt time.Time
}

type SeoSummary struct {
    Blogs      BlogSummary
    Faq        FaqSummary
    Paragraphs ParagraphSummary
    Chat       ChatSummary
}
```

### Blog Structs

```go
type BlogRegistryEntry struct {
    BlogId    string
    Slug      string
    Title     string
    Category  string
    Status    string    // draft, published, archived
    DbPath    string
    CreatedAt time.Time
    UpdatedAt time.Time
}

type BlogMeta struct {
    BlogId          string
    Title           string
    Slug            string
    Category        string
    MetaDescription string
    Keywords        []string
    Areas           []string
    Status          string
    Author          string
    WordCount       int
    ReadTime        string
    CreatedAt       time.Time
    UpdatedAt       time.Time
    PublishedAt     time.Time
}

type BlogSection struct {
    Index           int
    Type            string   // introduction, body, conclusion
    Header          string
    HtmlContent     string
    WordCount       int
    Keywords        []string
    QuotationUsed   string
    QuotationAuthor string
    InternalLinks   []string
    CreatedAt       time.Time
}

type BlogCategory struct {
    Slug        string
    Name        string
    Description string
    ParentSlug  string
    SortOrder   int
    BlogCount   int
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### Pagination Structs

```go
type PaginationInfo struct {
    Page        int
    Limit       int
    TotalItems  int
    TotalPages  int
    HasNextPage bool
    HasPrevPage bool
}

type ListFilters struct {
    Status   string
    Category string
    Search   string
}
```

---

## Error Codes

### Error Code Ranges

| Range         | Module                          | Spec                     |
| ------------- | ------------------------------- | ------------------------ |
| 9000-9099     | General/Startup                 | 05-error-codes.md        |
| 9100-9199     | Input Parsing                   | 05-error-codes.md        |
| 9200-9299     | Backend Connection              | 05-error-codes.md        |
| 9300-9310     | RAG Configuration               | 05-error-codes.md        |
| 9311-9319     | Request Processing              | 05-error-codes.md        |
| 9320-9339     | Model & Generation              | 05-error-codes.md        |
| 9400-9499     | Response Handling               | 05-error-codes.md        |
| 9501-9540     | SEO General                     | 16-ai-seo-error-codes.md |
| 9541-9553     | FAQ Generation                  | 05-error-codes.md        |
| 9561-9575     | Paragraph Generation            | 05-error-codes.md        |
| 9576-9595     | Blog Generation                 | 05-error-codes.md        |
| **9700-9709** | **Revisions System**            | 05-error-codes.md        |
| **9710-9719** | **Suggestions System**          | 05-error-codes.md        |
| **9800-9809** | **RAG Session Memory**          | 05-error-codes.md        |
| **9820-9829** | **Adaptive Reasoning**          | 05-error-codes.md        |
| **9830-9839** | **WebSocket Connection**        | 05-error-codes.md        |
| **9840-9849** | **GSearch Context Integration** | 05-error-codes.md        |
| **9900-9905** | **Rubric Validation**           | 05-error-codes.md        |
| **9910-9916** | **Memory Retrieval**            | 05-error-codes.md        |
| **9920-9927** | **RAG Reindexing**              | 05-error-codes.md        |

### Key Error Codes

| Code | Name                   | Module      |
| ---- | ---------------------- | ----------- |
| 9576 | `ErrBlogTrainingFailed`   | Blog        |
| 9579 | `ErrBlogOutlineFailed`    | Blog        |
| 9583 | `ErrBlogGenerationFailed` | Blog        |
| 9590 | `ErrBlogWordCountExceeded`  | Blog        |
| 9541 | `ErrFaqTrainingFailed`    | FAQ         |
| 9544 | `ErrFaqGenerationFailed`  | FAQ         |
| 9561 | `ErrParaTrainingFailed`   | Para        |
| 9564 | `ErrParaGenerationFailed` | Para        |
| 9700 | `ErrRevisionNotFound`    | Revisions   |
| 9710 | `ErrSuggestionNotFound`  | Suggestions |
| 9800 | `ErrRagMemoryLoadFailed` | RAG Session |
| 9820 | `ErrReasoningModeInvalid` | Reasoning   |

---

## Consistency Recommendations

### ✅ Current Patterns (Keep)

1. **Company-Scoped REST APIs** (Blog module)
   - Pattern: `/api/v1/seo/{company}/{resource}/{id}`
   - Benefits: Clean URL structure, implicit company context, RESTful

2. **Split DB Hierarchy**
   - Root → App → Company → Individual records
   - Benefits: Isolation, scalability, clean backup/restore

3. **PascalCase Everywhere**
   - DB columns, JSON fields, Go structs
   - Benefits: Consistency, no mapping layer

4. **Dual ID Support**
   - Accept both sequential ID (`001`) and slug (`carpet-cleaning`)
   - Benefits: Flexibility for different use cases

### ⚠️ Inconsistencies to Fix

| Issue              | Current State                             | Recommended Fix                               |
| ------------------ | ----------------------------------------- | --------------------------------------------- |
| **FAQ Endpoints**  | `/api/v1/seo/faq/*` with company in body  | Migrate to `/api/v1/seo/{company}/faq/*`      |
| **Para Endpoints** | `/api/v1/seo/para/*` with company in body | Migrate to `/api/v1/seo/{company}/para/*`     |
| **FAQ Storage**    | `data/{appName}/rag/faq/{company}.db`     | Move to `data/{appName}/rag/seo/{company}.db` |
| **Missing CRUD**   | FAQ/Para lack GET/DELETE endpoints        | Add full CRUD for consistency                 |

### 📋 Recommended Migration

#### Phase 1: Unify Database Paths

```
BEFORE:
├── rag/faq/{company}.db     # FAQ training
├── rag/para/{company}.db    # Para training (if separate)
└── rag/seo/{company}.db     # Blog registry

AFTER:
└── rag/seo/{company}.db     # ALL SEO data (FAQ + Para + Blog registry)
```

#### Phase 2: Unify API Endpoints

```
# FAQ (migrate from /api/v1/seo/faq/*)
GET    /api/v1/seo/{company}/faq              # List FAQ sessions
GET    /api/v1/seo/{company}/faq/{id}         # Get FAQ content
POST   /api/v1/seo/{company}/faq              # Generate FAQ
POST   /api/v1/seo/{company}/faq/train        # Train FAQ model
DELETE /api/v1/seo/{company}/faq/{id}         # Delete FAQ

# Paragraph (migrate from /api/v1/seo/para/*)
GET    /api/v1/seo/{company}/para             # List generated paragraphs
GET    /api/v1/seo/{company}/para/{id}        # Get paragraph content
POST   /api/v1/seo/{company}/para             # Generate paragraph
POST   /api/v1/seo/{company}/para/train       # Train para model
DELETE /api/v1/seo/{company}/para/{id}        # Delete paragraph
```

#### Phase 3: Consistent Request/Response

All POST requests should **not** include company in body (it's in URL path):

```json
// ✅ CORRECT: Company in URL path
POST /api/v1/seo/atto-property/faq
{
  "Question": "How much does carpet cleaning cost?",
  "Keywords": ["carpet cleaning", "pricing"]
}

// ❌ WRONG: Company in body (redundant)
POST /api/v1/seo/faq/generate
{
  "Company": "Atto Property",
  "Question": "..."
}
```

### 🎯 Final Unified Pattern

```
/api/v1/seo                                    # Global SEO operations
/api/v1/seo/blogs                              # All blogs (admin)
/api/v1/seo/{company}                          # Company summary

/api/v1/seo/{company}/blogs                    # Blog CRUD
/api/v1/seo/{company}/blogs/{id}               # Single blog
/api/v1/seo/{company}/blogs/train              # Blog training
/api/v1/seo/{company}/blogs/outline            # Outline generation

/api/v1/seo/{company}/faq                      # FAQ CRUD
/api/v1/seo/{company}/faq/{id}                 # Single FAQ
/api/v1/seo/{company}/faq/train                # FAQ training

/api/v1/seo/{company}/para                     # Paragraph CRUD
/api/v1/seo/{company}/para/{id}                # Single paragraph
/api/v1/seo/{company}/para/train               # Para training

/api/v1/seo/{company}/categories               # Category CRUD
/api/v1/seo/{company}/categories/{slug}        # Single category
```

---

## Cross-References

| Reference              | Location                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| Overview               | `../00-overview.md`                                                  |
| Frontend               | `../02-frontend/`                                                    |
| Deploy                 | `../03-deploy/`                                                      |
| Split DB Architecture  | `../../05-split-db-architecture/00-overview.md`                      |
| Seedable Config        | `../../06-seedable-config-architecture/00-overview.md`               |
| RAG Validation Helpers | `../../06-seedable-config-architecture/03-rag-validation-helpers.md` |
| Path Reference         | `26-database-paths-reference.md`                                     |

---

## Changelog

| Version | Date       | Changes                                                     |
| ------- | ---------- | ----------------------------------------------------------- |
| 3.0.0   | 2026-02-02 | Added complete DB/API overview, consistency recommendations |
| 2.0.0   | 2026-02-01 | Added SEO module files                                      |
| 1.0.0   | 2026-01-15 | Initial release                                             |
