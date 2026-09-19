# Memory: technical/ai-bridge-database-layout

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/26-database-paths-reference.md`

---

## Overview

AI Bridge implements a Split DB pattern for its ecosystem with company-scoped organization for all content types. All schemas and JSON transport follow **PascalCase** naming.

---

## Database Path Structure (v3.0)

```
data/
├── aibridge.db                                    # Root DB (settings, app registry)
│
└── {appName}/
    ├── search.db                                  # Search metadata
    │
    └── rag/
        ├── cache/search/
        │   └── {seq}-{slug}.db                    # Search cache
        │
        ├── code/
        │   └── {company}/
        │       └── {seq}-{task-id}.db             # Code task sessions
        │
        ├── chat/
        │   └── {company}/
        │       └── {seq}-{session-id}.db          # Chat sessions
        │
        └── seo/
            ├── {company-slug}.db                  # Company root (profile, training)
            │
            ├── blog/
            │   └── {company}/
            │       └── {seq}-{slug}.db            # Individual blog posts
            │
            ├── faq/
            │   └── {company}/
            │       └── {seq}-{slug}.db            # Individual FAQ content
            │
            └── paragraph/
                └── {company}/
                    └── {seq}-{slug}.db            # Individual paragraph content
```

---

## Path Summary Table

| Content Type | Path Pattern |
|--------------|--------------|
| Root DB | `data/aibridge.db` |
| App Search | `data/{app}/search.db` |
| Code Tasks | `data/{app}/rag/code/{company}/{seq}-{task-id}.db` |
| Chat Sessions | `data/{app}/rag/chat/{company}/{seq}-{session-id}.db` |
| Company SEO Root | `data/{app}/rag/seo/{company-slug}.db` |
| Blog Posts | `data/{app}/rag/seo/blog/{company}/{seq}-{slug}.db` |
| FAQ Content | `data/{app}/rag/seo/faq/{company}/{seq}-{slug}.db` |
| Paragraphs | `data/{app}/rag/seo/paragraph/{company}/{seq}-{slug}.db` |

---

## Company Root DB Tables

The company SEO database (`{company-slug}.db`) contains:

- `CompanyProfile` - Company metadata
- `CompanyCtas` - CTAs (phone, email, whatsapp, url)
- `CompanyServices` - Services offered
- `CompanyLocations` - Service areas
- `CompanyKeywords` - Target keywords
- `CompanyReferenceArticles` - Style training references
- `CompanyWritingStyle` - Writing style metrics
- `SitemapIndex` - Indexed sitemap URLs
- `BlogRegistry` - Blog content registry
- `FaqRegistry` - FAQ content registry
- `ParaRegistry` - Paragraph content registry
- `TrainingChunks` - Shared RAG chunks

---

## Go Path Functions

```go
// Code task DB
paths.CodeTaskDB(appName, company, seq, taskId)
// → data/myapp/rag/code/atto-property/001-refactor-auth.db

// Chat session DB
paths.ChatSessionDB(appName, company, seq, sessionId)
// → data/myapp/rag/chat/atto-property/001-abc123.db

// Company SEO root DB
paths.SeoCompanyDB(appName, companySlug)
// → data/myapp/rag/seo/atto-property.db

// Blog DB
paths.BlogDB(appName, company, seq, blogSlug)
// → data/myapp/rag/seo/blog/atto-property/001-cleaning-guide.db

// FAQ DB
paths.FaqDB(appName, company, seq, faqSlug)
// → data/myapp/rag/seo/faq/atto-property/001-cleaning-faq.db

// Paragraph DB
paths.ParagraphDB(appName, company, seq, paraSlug)
// → data/myapp/rag/seo/paragraph/atto-property/001-intro-section.db
```

---

## Key Design Decisions

1. **Company-Scoped**: All content organized under company folders
2. **Content-Type First**: SEO paths use `seo/blog/`, `seo/faq/`, `seo/paragraph/`
3. **Shared Training**: Company root DB stores training data used by all content types
4. **PascalCase Everywhere**: Database columns, JSON transport, API payloads

---

## Related Files

- Spec: `26-database-paths-reference.md`
- Architecture: `01-split-db-architecture.md`
- Naming: `training/09-database-naming-conventions.md`
