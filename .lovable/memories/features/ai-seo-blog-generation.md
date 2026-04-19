# Memory: features/ai-seo-blog-generation

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/22-ai-bridge-cli/01-backend/27-ai-seo-blog-generation.md`

---

## Overview

The Blog Post Generation module orchestrates complete SEO-optimized blog creation by combining outline generation, paragraph composition, FAQ integration, and famous quotation injection. It uses the Paragraph Generator as its core writing engine.

---

## Database Architecture

### Two-Level Split DB

| Level | Path | Purpose |
|-------|------|---------|
| Company Root | `data/{appName}/rag/seo/{company-slug}.db` | Blog registry, categories, training data |
| Individual Blog | `data/{appName}/rag/seo/blog/{company}/{seq}-{blog-slug}.db` | Full blog content, sections, metadata |

### Company Root DB Tables

- `BlogRegistry` - Registry of all blogs with paths to individual DBs
- `BlogCategories` - Category definitions (slug, name, parent, description)
- `CompanyProfile` - Company metadata
- Plus FAQ/Paragraph training tables

### Individual Blog DB Tables

- `BlogMeta` - Title, slug, category, keywords, status
- `BlogOutline` - Outline structure
- `BlogSections` - Section content and metadata
- `BlogQuotations` - Quotations used
- `BlogLinks` - Internal/external links
- `GenerationHistory` - Version history
- `Revisions` - Content revision snapshots
- `RevisionFeedback` - User feedback notes

---

## Go Structs

### BlogCategory

```go
type BlogCategory struct {
    Slug        string    // "cleaning-tips"
    Name        string    // "Cleaning Tips"
    Description string    // "Expert cleaning advice"
    ParentSlug  string    // Optional hierarchy
    SortOrder   int
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### BlogRegistryEntry

```go
type BlogRegistryEntry struct {
    BlogId     string    // "001"
    Slug       string    // "carpet-cleaning-guide-melton"
    Title      string    // "Complete Guide to..."
    Category   string    // "cleaning-tips"
    Status     string    // "draft", "published"
    DbPath     string    // Path to individual blog DB
    CreatedAt  time.Time
    UpdatedAt  time.Time
}
```

### BlogMeta

```go
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
    TargetWordCount int
    ActualWordCount int
    ReadTime        string
    CreatedAt       time.Time
    UpdatedAt       time.Time
    PublishedAt     time.Time
}
```

### BlogSection

```go
type BlogSection struct {
    Index            int
    Type             string   // "introduction", "body", "conclusion"
    Header           string
    Intent           string
    HtmlContent      string
    TextContent      string
    MarkdownContent  string
    WordCount        int
    ParagraphCount   int
    Keywords         []string
    IncludeQuotation bool
    IncludeFaq       bool
    QuotationUsed    string
    QuotationAuthor  string
    QuotationLink    string
    FaqQuestion      string
    FaqAnswer        string
    InternalLinks    []string
    ExternalLinks    []string
    CreatedAt        time.Time
    UpdatedAt        time.Time
}
```

---

## API Endpoints (RESTful)

All SEO endpoints follow company-scoped RESTful patterns.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/seo/blogs` | List all blogs (admin, cross-company) |
| GET | `/api/v1/seo/{company}` | Company summary (blogs, faq, para, chat) |
| GET | `/api/v1/seo/{company}/blogs` | List company blogs |
| GET | `/api/v1/seo/{company}/blogs/{id}` | Get single blog (ID or slug) |
| POST | `/api/v1/seo/{company}/blogs` | Generate new blog |
| PUT | `/api/v1/seo/{company}/blogs/{id}` | Update blog |
| DELETE | `/api/v1/seo/{company}/blogs/{id}` | Delete blog |
| POST | `/api/v1/seo/{company}/blogs/train` | Train blog generation |
| POST | `/api/v1/seo/{company}/blogs/outline` | Generate outline only |
| GET | `/api/v1/seo/{company}/categories` | List categories |
| POST | `/api/v1/seo/{company}/categories` | Create/update category |
| DELETE | `/api/v1/seo/{company}/categories/{slug}` | Delete category |

> **Note:** `{id}` accepts either BlogId (`001`) or blog slug (`carpet-cleaning-guide-melton`).

---

## Company Summary Endpoint

`GET /api/v1/seo/{company}` returns:
- Company info (name, website)
- Blog summary (total, published, draft)
- FAQ summary (sessions, total FAQs)
- Paragraph summary (total generated)
- Chat summary (sessions, active)

---

## Outline Generation

Uses GSearch CLI to research:
- **PAA Questions**: Extract "People Also Ask" from Google
- **Competitor Headings**: Scrape H1-H3 from top-ranking pages
- **Merge & Deduplicate**: Combine into coherent outline

---

## Header Requirements

Every section header MUST contain:

| Element | Required | Example |
|---------|----------|---------|
| Service/Keyword | ✅ Yes | "Carpet Cleaning" |
| Company Name | ✅ Yes | "Atto Property" |
| Location | When applicable | "Melton" |

---

## Quotation System

**Priority Order:**
1. Request passthrough (quotes in request)
2. Preset JSON files (`data/presets/seo/quotes/`)
3. Seedable DB (runtime configurable)
4. GSearch live lookup (fallback)

---

## FAQ Blending Modes

| Mode | Description |
|------|-------------|
| `inline` | Weave FAQ answers within paragraph flow |
| `block` | Add styled Q&A section after paragraph |
| `disabled` | No FAQ blending |

---

## Error Codes (9576-9595)

| Code | Name |
|------|------|
| 9576 | BLOG_TRAINING_FAILED |
| 9579 | BLOG_OUTLINE_FAILED |
| 9580 | BLOG_GSEARCH_FAILED |
| 9583 | BLOG_GENERATION_FAILED |
| 9585 | BLOG_PARA_CALL_FAILED |
| 9586 | BLOG_FAQ_BLEND_FAILED |
| 9587 | BLOG_QUOTE_INJECTION_FAILED |
| 9588 | BLOG_COHERENCE_VALIDATION_FAILED |
| 9589 | BLOG_HEADER_VALIDATION_FAILED |
| 9590 | BLOG_CATEGORY_INVALID |
| 9591 | BLOG_REGISTRY_FAILED |

---

## Path Functions

```go
// Company root DB (blog registry + training)
paths.SeoCompanyDB(appName, companySlug)
// → data/myapp/rag/seo/atto-property.db

// Individual blog DB
paths.BlogDB(appName, company, seq, blogSlug)
// → data/myapp/rag/seo/blog/atto-property/001-carpet-cleaning-guide-melton.db

// Blog directory
paths.BlogDir(appName, company)
// → data/myapp/rag/seo/blog/atto-property/
```

---

## Related Files

- Spec: `27-ai-seo-blog-generation.md`
- Path Reference: `26-database-paths-reference.md`
- Paragraph Spec: `25-ai-seo-paragraph-generation.md`
- Config: `data/presets/seo/blog/config.seed.blog.json`
- Quotes: `data/presets/seo/quotes/`
