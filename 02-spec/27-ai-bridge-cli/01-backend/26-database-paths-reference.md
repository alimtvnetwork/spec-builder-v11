# Database Paths Reference

> **Version:** 5.0.0  
> **Status:** Active  
> **Last Updated:** 2026-03-09

---

## Overview

This document provides a consolidated reference for all database paths used across the AI Bridge CLI system. All paths follow the Split DB architecture pattern with **company-scoped organization** for Code, Chat, and SEO content.

**CRITICAL:** All field names use **PascalCase** (no underscores) in database schemas and JSON transport.

---

## Path Structure

```
data/
├── aibridge.db                                    # Root DB (global settings, app registry)
│
└── {appName}/
    ├── search.db                                  # App-level search metadata
    │
    └── rag/
        ├── cache/
        │   └── search/
        │       └── {seq}-{slug}.db                # Search cache per query
        │
        ├── code/
        │   └── {company}/
        │       └── {seq}-{task-id}.db             # ⭐ Code task sessions
        │
        ├── chat/
        │   └── {company}/
        │       └── {seq}-{session-id}.db          # ⭐ Chat sessions
        │
        └── seo/
            ├── {company-slug}.db                  # ⭐ Company root DB (profile, training)
            │   ├── HtmlBlogCategories             # HTML blog category definitions
            │   ├── HtmlBlogPresets                 # HTML blog template presets
            │   └── HtmlBlogInstructions            # Reusable generation instructions
            │
            ├── blog/
            │   └── {company}/
            │       └── {seq}-{slug}.db            # ⭐ Individual blog posts
            │
            ├── faq/
            │   └── {company}/
            │       └── {seq}-{slug}.db            # ⭐ Individual FAQ content
            │
            ├── paragraph/
            │   └── {company}/
            │       └── {seq}-{slug}.db            # ⭐ Individual paragraph content
            │
            └── html-blog/
                └── {company}/
                    ├── {seq}-{slug}.db            # ⭐ Individual HTML blog content
                    └── session-{uuid}.db          # Temporary GSearch research session
```

---

## Key Design Decision: Company-Scoped Organization

All content types (Code, Chat, Blog, FAQ, Paragraph) are organized under **company folders** for:

1. **Clear Ownership**: Easy to identify which company owns which content
2. **Backup Simplicity**: Export all content for a company at once
3. **Access Control**: Company-level permissions and isolation
4. **Scalability**: Thousands of items per company without path conflicts

---

## Path Definitions

### Root Level

| Path | Purpose | Created When |
|------|---------|--------------|
| `data/aibridge.db` | Global settings, app registry, seeded config | Application startup |

### App Level

| Path | Purpose | Created When |
|------|---------|--------------|
| `data/{appName}/search.db` | App-level search metadata and indexing | App initialization |

### Code Sessions

| Path | Purpose | Created When |
|------|---------|--------------|
| `data/{appName}/rag/code/{company}/{seq}-{task-id}.db` | Code task storage (files, diffs, revisions) | Code task created |

**Variables:**
- `{company}`: Company slug (kebab-case)
- `{seq}`: Auto-incrementing sequence number (padded: `001`, `002`)
- `{task-id}`: UUID or short ID for the task

**Example:**
```
data/myapp/rag/code/atto-property/001-refactor-auth.db
```

### Chat Sessions

| Path | Purpose | Created When |
|------|---------|--------------|
| `data/{appName}/rag/chat/{company}/{seq}-{session-id}.db` | Individual chat message storage | New session created |

**Variables:**
- `{company}`: Company slug (kebab-case)
- `{seq}`: Auto-incrementing sequence number (padded: `001`, `002`)
- `{session-id}`: UUID or short ID for the session

**Example:**
```
data/myapp/rag/chat/atto-property/001-abc123.db
```

### SEO Storage

| Path | Purpose | Created When |
|------|---------|--------------|
| `data/{appName}/rag/seo/{company-slug}.db` | Company root DB (profile, training, registries, HTML blog categories/presets) | First SEO training |
| `data/{appName}/rag/seo/blog/{company}/{seq}-{slug}.db` | Individual blog post content | Blog generation |
| `data/{appName}/rag/seo/faq/{company}/{seq}-{slug}.db` | Individual FAQ content | FAQ generation |
| `data/{appName}/rag/seo/paragraph/{company}/{seq}-{slug}.db` | Individual paragraph content | Paragraph generation |
| `data/{appName}/rag/seo/html-blog/{company}/{seq}-{slug}.db` | Individual HTML blog content | HTML blog generation |
| `data/{appName}/rag/seo/html-blog/{company}/session-{uuid}.db` | GSearch research session (ephemeral) | HTML blog with --search |

**Examples:**
```
# Company root DB
data/myapp/rag/seo/atto-property.db

# Blog post
data/myapp/rag/seo/blog/atto-property/001-carpet-cleaning-guide-melton.db

# FAQ
data/myapp/rag/seo/faq/atto-property/001-carpet-cleaning-questions.db

# Paragraph
data/myapp/rag/seo/paragraph/atto-property/001-intro-section.db
```

---

## SEO Database Details

### Company Root DB: `data/{appName}/rag/seo/{company-slug}.db`

This database stores **ALL** company-level SEO data and registries:

#### Tables

| Table | Module | Purpose |
|-------|--------|---------|
| `CompanyProfile` | Shared | Company metadata and preferences |
| `CompanyCtas` | Shared | **Multiple CTA entries (phone, email, whatsapp, url, etc.)** |
| `CompanyServices` | Shared | Services offered by company |
| `CompanyLocations` | Shared | Service areas/locations |
| `CompanyKeywords` | Shared | Target keywords with priority |
| `CompanyReferenceArticles` | Shared | **Reference articles for style training** |
| `CompanyWritingStyle` | Shared | **Extracted writing style metrics** |
| `SitemapIndex` | Shared | Indexed sitemap URLs for linking |
| `BlogRegistry` | Blog | Registry of all blogs with DB paths |
| `BlogCategories` | Blog | Blog category definitions |
| `FaqRegistry` | FAQ | Registry of all FAQ content |
| `ParaRegistry` | Para | Registry of all paragraph content |
| `TrainingChunks` | Shared | RAG chunks from training |
| `HtmlBlogCategories` | HTML Blog | HTML blog category definitions |
| `HtmlBlogPresets` | HTML Blog | Template presets per category |
| `HtmlBlogInstructions` | HTML Blog | Reusable instructions per preset |

---

### Individual Blog DB: `data/{appName}/rag/seo/blog/{company}/{seq}-{slug}.db`

Each blog post gets its own database for complete content storage:

#### Tables

| Table | Purpose |
|-------|---------|
| `BlogMeta` | Blog metadata (title, slug, category, keywords, etc.) |
| `BlogOutline` | Generated or provided outline structure |
| `BlogSections` | Individual section content and metadata |
| `BlogQuotations` | Quotations used in the blog |
| `BlogLinks` | Internal and external links used |
| `BlogFaqs` | FAQs blended into the content |
| `GenerationHistory` | Version history of regenerations |
| `Revisions` | Content revision snapshots |
| `RevisionFeedback` | User feedback notes |

#### BlogMeta Schema

```go
type BlogMeta struct {
    BlogId          string
    Slug            string
    Title           string
    MetaDescription string
    Category        string
    Keywords        []string
    Areas           []string
    Company         string
    Website         string
    Status          string    // "generating", "complete", "error"
    TotalWordCount  int
    EstimatedReadTime string
    CreatedAt       time.Time
    UpdatedAt       time.Time
    PublishedAt     time.Time
}
```

---

### Individual FAQ DB: `data/{appName}/rag/seo/faq/{company}/{seq}-{slug}.db`

#### Tables

| Table | Purpose |
|-------|---------|
| `FaqMeta` | FAQ metadata (topic, keywords, etc.) |
| `FaqQuestions` | Individual question/answer pairs |
| `FaqSchema` | JSON-LD schema for SEO |
| `GenerationHistory` | Version history |
| `Revisions` | Content revision snapshots |
| `RevisionFeedback` | User feedback notes |

---

### Individual Paragraph DB: `data/{appName}/rag/seo/paragraph/{company}/{seq}-{slug}.db`

#### Tables

| Table | Purpose |
|-------|---------|
| `ParaMeta` | Paragraph metadata (context, intent, etc.) |
| `ParaContent` | Generated content (HTML, Markdown, Text) |
| `ParaQuotations` | Quotations used |
| `ParaLinks` | Links embedded |
| `GenerationHistory` | Version history |
| `Revisions` | Content revision snapshots |
| `RevisionFeedback` | User feedback notes |

---

## Path Generation Functions

### Go Implementation

```go
package paths

import (
    "fmt"
    "path/filepath"
    "strings"
)

const DataDir = "data"

// RootDb returns the path to the root database
func RootDb() string {
    return filepath.Join(DataDir, "aibridge.db")
}

// AppSearchDb returns the path to an app's search database
func AppSearchDb(appName string) string {
    return filepath.Join(DataDir, appName, "search.db")
}

// CodeTaskDb returns the path to a code task database
func CodeTaskDb(appName, company string, seq int, taskId string) string {
    return filepath.Join(
        DataDir, appName, "rag", "code", company,
        fmt.Sprintf("%03d-%s.db", seq, taskId),
    )
}

// ChatSessionDb returns the path to a chat session database
func ChatSessionDb(appName, company string, seq int, sessionId string) string {
    return filepath.Join(
        DataDir, appName, "rag", "chat", company,
        fmt.Sprintf("%03d-%s.db", seq, sessionId),
    )
}

// SearchCacheDb returns the path to a search cache database
func SearchCacheDb(appName string, seq int, slug string) string {
    return filepath.Join(
        DataDir, appName, "rag", "cache", "search",
        fmt.Sprintf("%03d-%s.db", seq, slug),
    )
}

// SeoCompanyDb returns the path to a company's SEO root database
func SeoCompanyDb(appName, companySlug string) string {
    return filepath.Join(DataDir, appName, "rag", "seo", companySlug+".db")
}

// BlogDb returns the path to an individual blog database
func BlogDb(appName, company string, seq int, blogSlug string) string {
    return filepath.Join(
        DataDir, appName, "rag", "seo", "blog", company,
        fmt.Sprintf("%03d-%s.db", seq, blogSlug),
    )
}

// FaqDb returns the path to an individual FAQ database
func FaqDb(appName, company string, seq int, faqSlug string) string {
    return filepath.Join(
        DataDir, appName, "rag", "seo", "faq", company,
        fmt.Sprintf("%03d-%s.db", seq, faqSlug),
    )
}

// ParagraphDb returns the path to an individual paragraph database
func ParagraphDb(appName, company string, seq int, paraSlug string) string {
    return filepath.Join(
        DataDir, appName, "rag", "seo", "paragraph", company,
        fmt.Sprintf("%03d-%s.db", seq, paraSlug),
    )
}

// BlogDir returns the directory containing all blog DBs for a company
func BlogDir(appName, company string) string {
    return filepath.Join(DataDir, appName, "rag", "seo", "blog", company)
}

// FaqDir returns the directory containing all FAQ DBs for a company
func FaqDir(appName, company string) string {
    return filepath.Join(DataDir, appName, "rag", "seo", "faq", company)
}

// ParagraphDir returns the directory containing all paragraph DBs for a company
func ParagraphDir(appName, company string) string {
    return filepath.Join(DataDir, appName, "rag", "seo", "paragraph", company)
}

// ToKebabCase converts a string to kebab-case for slugs
func ToKebabCase(s string) string {
    s = strings.ToLower(s)
    s = strings.ReplaceAll(s, " ", "-")
    return s
}
```

---

## Path Constants

```go
// PathKey constants for configuration
type PathKey string

const (
    PathKeyDataDir              PathKey = "DataDir"
    PathKeyRootDb               PathKey = "RootDb"
    PathKeyAppSearchDb          PathKey = "AppSearchDb"
    PathKeyCodeTaskDb           PathKey = "CodeTaskDb"
    PathKeyChatSessionDb        PathKey = "ChatSessionDb"
    PathKeySearchCacheDb        PathKey = "SearchCacheDb"
    PathKeySeoCompanyDb         PathKey = "SeoCompanyDb"
    PathKeyBlogDb               PathKey = "BlogDb"
    PathKeyFaqDb                PathKey = "FaqDb"
    PathKeyParagraphDb          PathKey = "ParagraphDb"
    PathKeySuggestionsRegistry  PathKey = "SuggestionsRegistry"
)

// SuggestionsRegistryDb returns the path to the global suggestions registry
func SuggestionsRegistryDb(appName string) string {
    return filepath.Join(DataDir, appName, "rag", "suggestions-registry.db")
}
```

---

## Usage Examples

### Code Task Creation

```go
appName := "myapp"
company := "atto-property"
seq := 1
taskId := "refactor-auth"
dbPath := paths.CodeTaskDb(appName, company, seq, taskId)
// Result: "data/myapp/rag/code/atto-property/001-refactor-auth.db"
```

### Chat Session Creation

```go
appName := "myapp"
company := "atto-property"
seq := 5
sessionId := "abc123"
dbPath := paths.ChatSessionDb(appName, company, seq, sessionId)
// Result: "data/myapp/rag/chat/atto-property/005-abc123.db"
```

### Blog Generation

```go
appName := "myapp"
company := "atto-property"
seq := 1
blogSlug := "carpet-cleaning-guide-melton"
dbPath := paths.BlogDb(appName, company, seq, blogSlug)
// Result: "data/myapp/rag/seo/blog/atto-property/001-carpet-cleaning-guide-melton.db"
```

### FAQ Generation

```go
appName := "myapp"
company := "melbourne-carpet-experts"
seq := 3
faqSlug := "cleaning-faq"
dbPath := paths.FaqDb(appName, company, seq, faqSlug)
// Result: "data/myapp/rag/seo/faq/melbourne-carpet-experts/003-cleaning-faq.db"
```

### Paragraph Generation

```go
appName := "myapp"
company := "atto-property"
seq := 2
paraSlug := "intro-section"
dbPath := paths.ParagraphDb(appName, company, seq, paraSlug)
// Result: "data/myapp/rag/seo/paragraph/atto-property/002-intro-section.db"
```

---

## Directory Creation

All path functions assume parent directories exist. Use `EnsureDir()` before creating databases:

```go
func EnsureDir(path string) *appfault.AppError {
    dir := filepath.Dir(path)
    return pathutil.MkdirAll(dir, 0755)
}

// Usage
dbPath := paths.BlogDb("myapp", "atto-property", 1, "my-blog")
if err := EnsureDir(dbPath); err != nil {
    return err
}
// Now safe to create/open database
```

---

## Migration from Old Paths

### DEPRECATED Paths (Do Not Use)

```
❌ data/{app}/ai/chat/{seq}-{id}.db
❌ data/{app}/ai/code/{seq}-{id}.db
❌ data/{app}/rag/seo/{company}/blog/{seq}-{slug}.db
❌ data/{app}/rag/seo/{company}/faq/{seq}-{slug}.db
❌ data/{app}/rag/seo/{company}/paragraph/{seq}-{slug}.db
```

### NEW Paths (Use These)

```
✅ data/{app}/rag/chat/{company}/{seq}-{id}.db
✅ data/{app}/rag/code/{company}/{seq}-{id}.db
✅ data/{app}/rag/seo/blog/{company}/{seq}-{slug}.db
✅ data/{app}/rag/seo/faq/{company}/{seq}-{slug}.db
✅ data/{app}/rag/seo/paragraph/{company}/{seq}-{slug}.db
```

---

## Related Specifications

| Spec | Description |
|------|-------------|
| `08-split-db-integration.md` | Split DB architecture details |
| `12-database-architecture.md` | Full database schema reference |
| `22-ai-seo-faq-generation.md` | FAQ module database usage |
| `25-ai-seo-paragraph-generation.md` | Paragraph module database usage |
| `27-ai-seo-blog-generation.md` | Blog generation with individual DBs |
| `34-suggestions-system.md` | Suggestions storage and registry |
| `35-unified-revisions-architecture.md` | Revision system for all content types |
| `36-session-scoped-rag-memory.md` | Session-scoped RAG memory lifecycle |
| `37-adaptive-reasoning-flow.md` | AI reasoning and clarification modes |
