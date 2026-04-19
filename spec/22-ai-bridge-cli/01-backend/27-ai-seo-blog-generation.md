# AI SEO Blog Post Generation Endpoint

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

The Blog Post Generation module creates complete SEO-optimized blog posts by orchestrating outline generation, paragraph composition, FAQ integration, and quotation injection. It builds upon the Paragraph Generator as its core writing engine.

---

## Architecture

### Split DB Pattern

```
data/
├── aibridge.db                                    # Root DB (global settings)
└── {appName}/
    └── rag/
        └── seo/
            ├── {company-slug}.db                  # Company root DB (blog registry, company profile)
            │
            └── blog/
                └── {company}/
                    ├── 001-{blog-slug}.db         # Individual blog post DB
                    ├── 002-{blog-slug}.db         # Individual blog post DB
                    └── ...
```

> **Note:** See `spec/22-ai-bridge-cli/01-backend/26-database-paths-reference.md` for all DB path definitions.

### Database Hierarchy

| Database | Purpose | Content |
|----------|---------|---------|
| `{company-slug}.db` | Root company DB | Blog registry, company profile, category definitions, training data |
| `blog/{company}/{seq}-{slug}.db` | Individual blog DB | Full blog content, sections, generation history, metadata |

### Blog Registry (in company-slug.db)

```json
{
  "BlogId": "001",
  "Slug": "carpet-cleaning-guide-melton",
  "Title": "Complete Guide to Carpet Cleaning in Melton",
  "Category": "cleaning-tips",
  "Status": "published",
  "CreatedAt": "2026-02-02T10:00:00Z",
  "UpdatedAt": "2026-02-02T12:30:00Z",
  "DbPath": "data/myapp/rag/seo/blog/atto-property/001-carpet-cleaning-guide-melton.db"
}
```

### Orchestration Flow

```
Training Request → RAG Ingestion → Split DB Storage
                        ↓
Outline Request → GSearch (PAA + Competitors) → Outline Generation
                        ↓
Generate Request → For Each Section:
                     ├── Context Building
                     ├── Paragraph Generator (internal call)
                     ├── FAQ Blending
                     ├── Quotation Injection
                     └── Link Generation
                        ↓
                   Content Assembly → Validation → Output
```

---

## Blog Categories

Blogs require a category assignment for organization and SEO structure.

### Category Schema

```go
// BlogCategory represents a blog category
type BlogCategory struct {
    Slug        string    `json:",omitempty"` // "cleaning-tips"
    Name        string    `json:",omitempty"` // "Cleaning Tips"
    Description string    `json:",omitempty"` // "Expert cleaning advice and best practices"
    ParentSlug  string    `json:",omitempty"` // Optional parent for hierarchy
    SortOrder   int       `json:",omitempty"` // Display order
    CreatedAt   time.Time `json:",omitempty"`
    UpdatedAt   time.Time `json:",omitempty"`
}
```

### Category Storage

Categories are stored in the company root DB (`{company-slug}.db`):

```sql
CREATE TABLE BlogCategories (
    Slug        TEXT PRIMARY KEY,
    Name        TEXT NOT NULL,
    Description TEXT,
    ParentSlug  TEXT,
    SortOrder   INTEGER DEFAULT 0,
    CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Go Structs

### Blog Registry Entry

```go
// BlogRegistryEntry tracks blogs in the company root DB
type BlogRegistryEntry struct {
    BlogId     string    `json:",omitempty"` // "001"
    Slug       string    `json:",omitempty"` // "carpet-cleaning-guide-melton"
    Title      string    `json:",omitempty"` // "Complete Guide to Carpet Cleaning"
    Category   string    `json:",omitempty"` // "cleaning-tips" (category slug)
    Status     string    `json:",omitempty"` // "draft", "published", "archived"
    DbPath     string    `json:",omitempty"` // Path to individual blog DB
    CreatedAt  time.Time `json:",omitempty"`
    UpdatedAt  time.Time `json:",omitempty"`
}
```

### Blog Metadata

```go
// BlogMeta stores metadata in individual blog DB
type BlogMeta struct {
    BlogId          string   `json:",omitempty"` // "001"
    Title           string   `json:",omitempty"` // Full title
    Slug            string   `json:",omitempty"` // URL slug
    Category        string   `json:",omitempty"` // Category slug
    MetaDescription string   `json:",omitempty"` // SEO meta description
    Keywords        []string `json:",omitempty"` // Target keywords
    Areas           []string `json:",omitempty"` // Target areas/locations
    Status          string   `json:",omitempty"` // "draft", "published"
    Author          string   `json:",omitempty"` // Company name
    TargetWordCount int      `json:",omitempty"` // Target word count
    ActualWordCount int      `json:",omitempty"` // Actual word count
    ReadTime        string   `json:",omitempty"` // "7 min"
    CreatedAt       time.Time `json:",omitempty"`
    UpdatedAt       time.Time `json:",omitempty"`
    PublishedAt     time.Time `json:",omitempty"`
}
```

### Blog Section

```go
// BlogSection stores individual sections in blog DB
type BlogSection struct {
    Index            int      `json:",omitempty"` // Section order (1, 2, 3...)
    Type             string   `json:",omitempty"` // "introduction", "body", "conclusion"
    Header           string   `json:",omitempty"` // Section header (H2)
    Intent           string   `json:",omitempty"` // Section writing intent
    HtmlContent      string   `json:",omitempty"` // Generated HTML
    TextContent      string   `json:",omitempty"` // Plain text version
    MarkdownContent  string   `json:",omitempty"` // Markdown version
    WordCount        int      `json:",omitempty"` // Display word count
    ParagraphCount   int      `json:",omitempty"` // Number of paragraphs
    Keywords         []string `json:",omitempty"` // Section keywords
    IncludeQuotation bool     `json:",omitempty"` // Has quotation
    IncludeFaq       bool     `json:",omitempty"` // Has FAQ block
    QuotationUsed    string   `json:",omitempty"` // Quote text if used
    QuotationAuthor  string   `json:",omitempty"` // Quote author
    QuotationLink    string   `json:",omitempty"` // Quote external link
    FaqQuestion      string   `json:",omitempty"` // FAQ question if used
    FaqAnswer        string   `json:",omitempty"` // FAQ answer if used
    InternalLinks    []string `json:",omitempty"` // Links used
    ExternalLinks    []string `json:",omitempty"` // External links used
    CreatedAt        time.Time `json:",omitempty"`
    UpdatedAt        time.Time `json:",omitempty"`
}
```

### Blog Quotation

```go
// BlogQuotation tracks quotations used in a blog
type BlogQuotation struct {
    SectionIndex int    `json:",omitempty"` // Which section used this
    Quote        string `json:",omitempty"` // Quote text
    Author       string `json:",omitempty"` // Author name
    ExternalLink string `json:",omitempty"` // Link to source
    Topic        string `json:",omitempty"` // Quote topic/category
}
```

### Blog Generation History

```go
// BlogGenerationHistory tracks generation versions
type BlogGenerationHistory struct {
    Version     int       `json:",omitempty"` // Version number
    GeneratedAt time.Time `json:",omitempty"` // When generated
    SessionId   string    `json:",omitempty"` // Session ID used
    Config      string    `json:",omitempty"` // JSON of generation config
    WordCount   int       `json:",omitempty"` // Word count for this version
    Status      string    `json:",omitempty"` // "success", "failed"
    ErrorCode   int       `json:",omitempty"` // Error code if failed
}
```

---

## API Endpoints

All SEO endpoints follow RESTful company-scoped patterns.

### Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/blogs` | List all blogs (admin, cross-company) |
| GET | `/api/v1/seo/{company}` | Company summary (blogs, faq, para, chat info) |
| GET | `/api/v1/seo/{company}/blogs` | List company blogs with pagination |
| GET | `/api/v1/seo/{company}/blogs/{id}` | Get single blog (by ID or slug) |
| POST | `/api/v1/seo/{company}/blogs` | Generate new blog |
| PUT | `/api/v1/seo/{company}/blogs/{id}` | Update blog |
| DELETE | `/api/v1/seo/{company}/blogs/{id}` | Delete blog |
| POST | `/api/v1/seo/{company}/blogs/train` | Train blog generation |
| POST | `/api/v1/seo/{company}/blogs/outline` | Generate outline only |
| GET | `/api/v1/seo/{company}/categories` | List categories |
| POST | `/api/v1/seo/{company}/categories` | Create/update category |
| DELETE | `/api/v1/seo/{company}/categories/{slug}` | Delete category |

> **Note:** `{id}` accepts either sequential BlogId (e.g., `001`) or blog slug (e.g., `carpet-cleaning-guide-melton`). The system auto-detects which format was provided.

---

### 1. Global Blogs List (Admin)

**GET** `/api/v1/seo/blogs`

Lists all blogs across all companies with optional filters.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `company` | string | No | - | Filter by company slug |
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 20 | Results per page (max 100) |
| `status` | string | No | all | Filter: `draft`, `published`, `archived`, `all` |

#### Response

```json
{
  "Success": true,
  "Blogs": [
    {
      "BlogId": "001",
      "Slug": "carpet-cleaning-guide-melton",
      "Title": "Complete Guide to Carpet Cleaning in Melton",
      "Company": "atto-property",
      "CompanyName": "Atto Property",
      "Category": "cleaning-tips",
      "Status": "published",
      "WordCount": 1850,
      "CreatedAt": "2026-02-01T10:00:00Z"
    }
  ],
  "Pagination": {
    "Page": 1,
    "Limit": 20,
    "TotalItems": 150,
    "TotalPages": 8
  }
}
```

---

### 2. Company Summary

**GET** `/api/v1/seo/{company}`

Returns summary information for a company including blogs, FAQ, paragraphs, and chat sessions.

#### Response

```json
{
  "Success": true,
  "Company": {
    "Slug": "atto-property",
    "Name": "Atto Property",
    "Website": "https://attoproperty.com.au",
    "CreatedAt": "2026-01-15T08:00:00Z"
  },
  "Summary": {
    "Blogs": {
      "Total": 25,
      "Published": 20,
      "Draft": 5,
      "LastUpdated": "2026-02-02T12:30:00Z"
    },
    "Faq": {
      "TotalSessions": 8,
      "TotalFaqs": 120,
      "LastUpdated": "2026-02-01T14:00:00Z"
    },
    "Paragraphs": {
      "TotalGenerated": 450,
      "LastUpdated": "2026-02-02T10:00:00Z"
    },
    "Chat": {
      "TotalSessions": 15,
      "ActiveSessions": 3,
      "LastActivity": "2026-02-02T11:45:00Z"
    }
  },
  "Categories": [
    {"Slug": "cleaning-tips", "Name": "Cleaning Tips", "BlogCount": 12},
    {"Slug": "home-maintenance", "Name": "Home Maintenance", "BlogCount": 8}
  ]
}
```

#### Go Struct

```go
// CompanySummaryResponse represents company overview
type CompanySummaryResponse struct {
    Success    bool            `json:",omitempty"`
    Company    CompanyInfo     `json:",omitempty"`
    Summary    SeoSummary      `json:",omitempty"`
    Categories []CategoryBrief `json:",omitempty"`
}

type CompanyInfo struct {
    Slug      string    `json:",omitempty"`
    Name      string    `json:",omitempty"`
    Website   string    `json:",omitempty"`
    CreatedAt time.Time `json:",omitempty"`
}

type SeoSummary struct {
    Blogs      BlogSummary      `json:",omitempty"`
    Faq        FaqSummary       `json:",omitempty"`
    Paragraphs ParagraphSummary `json:",omitempty"`
    Chat       ChatSummary      `json:",omitempty"`
}

type BlogSummary struct {
    Total       int       `json:",omitempty"`
    Published   int       `json:",omitempty"`
    Draft       int       `json:",omitempty"`
    LastUpdated time.Time `json:",omitempty"`
}

type FaqSummary struct {
    TotalSessions int       `json:",omitempty"`
    TotalFaqs     int       `json:",omitempty"`
    LastUpdated   time.Time `json:",omitempty"`
}

type ParagraphSummary struct {
    TotalGenerated int       `json:",omitempty"`
    LastUpdated    time.Time `json:",omitempty"`
}

type ChatSummary struct {
    TotalSessions  int       `json:",omitempty"`
    ActiveSessions int       `json:",omitempty"`
    LastActivity   time.Time `json:",omitempty"`
}

type CategoryBrief struct {
    Slug      string `json:",omitempty"`
    Name      string `json:",omitempty"`
    BlogCount int    `json:",omitempty"`
}
```

---

### 3. Company Blogs List

**GET** `/api/v1/seo/{company}/blogs`

Retrieves all blogs for a specific company with pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | int | No | 1 | Page number (1-indexed) |
| `limit` | int | No | 20 | Results per page (max 100) |
| `status` | string | No | all | Filter: `draft`, `published`, `archived`, `all` |
| `category` | string | No | - | Filter by category slug |
| `sort` | string | No | `CreatedDesc` | Sort: `CreatedDesc`, `CreatedAsc`, `UpdatedDesc`, `TitleAsc` |
| `search` | string | No | - | Search in title and keywords |

#### Request Example

```
GET /api/v1/seo/atto-property/blogs?page=1&limit=10&status=published&category=cleaning-tips
```

#### Response

```json
{
  "Success": true,
  "Blogs": [
    {
      "BlogId": "001",
      "Slug": "carpet-cleaning-guide-melton",
      "Title": "Complete Guide to Carpet Cleaning in Melton",
      "Category": "cleaning-tips",
      "CategoryName": "Cleaning Tips",
      "Status": "published",
      "WordCount": 1850,
      "ReadTime": "7 min",
      "SectionCount": 6,
      "Keywords": ["carpet cleaning", "steam cleaning", "Melton"],
      "CreatedAt": "2026-02-01T10:00:00Z",
      "UpdatedAt": "2026-02-02T12:30:00Z",
      "PublishedAt": "2026-02-02T14:00:00Z"
    }
  ],
  "Pagination": {
    "Page": 1,
    "Limit": 10,
    "TotalItems": 25,
    "TotalPages": 3,
    "HasNextPage": true,
    "HasPrevPage": false
  },
  "Filters": {
    "Status": "published",
    "Category": "cleaning-tips",
    "Search": ""
  }
}
```

---

### 4. Get Single Blog

**GET** `/api/v1/seo/{company}/blogs/{id}`

Retrieves full blog content with all sections. The `{id}` parameter accepts either:
- Sequential ID: `001`, `002`, etc.
- Blog slug: `carpet-cleaning-guide-melton`

#### Request Examples

```
GET /api/v1/seo/atto-property/blogs/001
GET /api/v1/seo/atto-property/blogs/carpet-cleaning-guide-melton
```

#### Response

```json
{
  "Success": true,
  "Blog": {
    "BlogId": "001",
    "Slug": "carpet-cleaning-guide-melton",
    "Title": "Complete Guide to Carpet Cleaning in Melton",
    "MetaDescription": "Discover expert carpet cleaning tips from Atto Property...",
    "Category": "cleaning-tips",
    "CategoryName": "Cleaning Tips",
    "Status": "published",
    "Keywords": ["carpet cleaning", "steam cleaning", "Melton"],
    "Areas": ["Melton", "Caroline Springs"],
    "Author": "Atto Property",
    "WordCount": 1850,
    "ReadTime": "7 min",
    "CreatedAt": "2026-02-01T10:00:00Z",
    "UpdatedAt": "2026-02-02T12:30:00Z",
    "PublishedAt": "2026-02-02T14:00:00Z",
    "Content": {
      "Html": "<article>...</article>",
      "Markdown": "# Complete Guide...",
      "Text": "Complete Guide to Professional..."
    },
    "TableOfContents": [
      {"Index": 1, "Header": "Why Professional Carpet Cleaning Matters", "Anchor": "#section-1"}
    ],
    "Sections": [
      {
        "Index": 1,
        "Type": "introduction",
        "Header": "Why Professional Carpet Cleaning Matters for Melton Homes",
        "HtmlContent": "<section id='section-1'>...</section>",
        "WordCount": 165,
        "QuotationUsed": "Quality is not an act, it is a habit.",
        "QuotationAuthor": "Aristotle"
      }
    ],
    "Schema": {
      "@context": "https://schema.org",
      "@type": "BlogPosting"
    }
  }
}
```

---

### 5. Create/Generate Blog

**POST** `/api/v1/seo/{company}/blogs`

Generates a new blog post. Use `GenerateAll: true` to auto-generate outline, or provide an existing outline.

#### Request Body

```json
{
  "Topic": "Complete Guide to Professional Carpet Cleaning",
  "Keywords": ["carpet cleaning", "steam cleaning"],
  "Areas": ["Melton", "Caroline Springs"],
  "Category": "cleaning-tips",
  "GenerateAll": true,
  "OutlineConfig": {
    "SectionCount": {"Min": 5, "Max": 8},
    "EnableGSearch": true,
    "IncludePaaQuestions": true,
    "IncludeCompetitorHeadings": true,
    "TargetWordCount": 2000
  },
  "GenerateConfig": {
    "OutputFormat": "html",
    "IncludeTableOfContents": true,
    "IncludeSchema": true
  },
  "QuotationConfig": {
    "EnableQuotations": true,
    "Source": "auto"
  },
  "FaqConfig": {
    "EnableFaqBlending": true,
    "BlendMode": "inline"
  },
  "LinkConfig": {
    "EnableSitemapLinking": true,
    "EnableSlugGeneration": true,
    "SitemapUrl": "https://attoproperty.com.au/sitemap.xml"
  }
}
```

#### Response

```json
{
  "Success": true,
  "BlogId": "003",
  "Slug": "professional-carpet-cleaning-guide-melton",
  "Message": "Blog generated successfully",
  "Blog": {
    "Title": "Complete Guide to Professional Carpet Cleaning in Melton",
    "WordCount": 1850,
    "SectionCount": 6,
    "Status": "draft"
  }
}
```

---

### 6. Update Blog

**PUT** `/api/v1/seo/{company}/blogs/{id}`

Updates an existing blog. Can update metadata, status, or regenerate specific sections.

#### Request Body

```json
{
  "Status": "published",
  "Category": "carpet-care",
  "RegenerateSections": [2, 4],
  "UpdateMeta": {
    "MetaDescription": "Updated meta description...",
    "Keywords": ["carpet cleaning", "steam cleaning", "professional"]
  }
}
```

#### Response

```json
{
  "Success": true,
  "Message": "Blog updated successfully",
  "Blog": {
    "BlogId": "001",
    "Slug": "carpet-cleaning-guide-melton",
    "Status": "published",
    "UpdatedAt": "2026-02-02T15:00:00Z"
  }
}
```

---

### 7. Delete Blog

**DELETE** `/api/v1/seo/{company}/blogs/{id}`

Deletes a blog and its individual database file.

#### Response

```json
{
  "Success": true,
  "Message": "Blog deleted successfully",
  "DeletedBlog": {
    "BlogId": "001",
    "Slug": "carpet-cleaning-guide-melton",
    "Title": "Complete Guide to Carpet Cleaning in Melton"
  }
}
```

---

### 8. Training Endpoint

**POST** `/api/v1/seo/{company}/blogs/train`

Ingests training data for company-specific blog generation.

#### Request Body

```json
{
  "Website": "https://attoproperty.com.au",
  "TrainingData": [
    {
      "Type": "text",
      "Content": "Sample blog posts, writing style examples..."
    },
    {
      "Type": "file",
      "Content": "base64-encoded-md-file",
      "FileType": "md"
    },
    {
      "Type": "url",
      "Content": "https://attoproperty.com.au/blog/"
    }
  ],
  "Keywords": ["carpet cleaning", "steam cleaning", "eco-friendly cleaning"],
  "SampleHtml": "<article>...</article>",
  "WritingStyle": {
    "Tone": "professional",
    "Formality": "conversational",
    "Industry": "cleaning"
  },
  "CompanyProfile": {
    "Name": "Atto Property",
    "Tagline": "Melbourne's Trusted Cleaning Experts",
    "Description": "Full-service property cleaning company",
    "Url": "https://attoproperty.com.au",
    "YearsOfExperience": "5"
  },
  "Services": [
    {"Name": "Carpet Cleaning"},
    {"Name": "Tile Cleaning"}
  ],
  "Location": {
    "Country": "Australia",
    "Region": "Victoria",
    "Cities": {
      "Melbourne CBD": ["Melton", "Caroline Springs", "Sunbury"]
    }
  }
}
```

#### Response

```json
{
  "Success": true,
  "SessionId": "blog-sess-abc123",
  "Message": "Training data ingested successfully",
  "RagStats": {
    "ChunksCreated": 85,
    "TokensProcessed": 25000,
    "DbPath": "data/myapp/rag/seo/atto-property.db"
  }
}
```

---

### 9. Outline Generation Endpoint

**POST** `/api/v1/seo/{company}/blogs/outline`

Generates an outline for a blog post using GSearch research.

#### Request Body

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "SessionId": "blog-sess-abc123",
  "Topic": "Complete Guide to Professional Carpet Cleaning",
  "Keywords": ["carpet cleaning", "steam cleaning", "stain removal"],
  "Areas": ["Melton", "Caroline Springs"],
  "OutlineConfig": {
    "SectionCount": {"Min": 5, "Max": 8},
    "EnableGSearch": true,
    "IncludePaaQuestions": true,
    "IncludeCompetitorHeadings": true,
    "TargetWordCount": 2000
  }
}
```

#### GSearch Integration

When `EnableGSearch: true`:

1. **People Also Ask (PAA)** - Extract related questions from Google
2. **Competitor Headings** - Scrape H1-H3 from top-ranking pages
3. **Merge & Deduplicate** - Combine into coherent outline

```go
// GSearch queries for outline generation
queries := []string{
    fmt.Sprintf("%s %s", keywords[0], "guide"),
    fmt.Sprintf("how to %s", keywords[0]),
    fmt.Sprintf("%s tips", keywords[0]),
    fmt.Sprintf("%s FAQ", keywords[0]),
}
```

#### Response

```json
{
  "Success": true,
  "SessionId": "blog-sess-abc123",
  "Outline": {
    "Title": "Complete Guide to Professional Carpet Cleaning in Melton",
    "MetaDescription": "Discover expert carpet cleaning tips from Atto Property...",
    "Sections": [
      {
        "Index": 1,
        "Type": "introduction",
        "Header": "Why Professional Carpet Cleaning Matters for Melton Homes",
        "Intent": "Hook reader, establish expertise, preview content",
        "TargetWords": 150,
        "Keywords": ["carpet cleaning", "Melton"],
        "IncludeQuotation": true,
        "IncludeFaq": false
      },
      {
        "Index": 2,
        "Type": "body",
        "Header": "Health Benefits of Regular Steam Cleaning by Atto Property",
        "Intent": "Explain allergen removal, bacteria elimination",
        "TargetWords": 250,
        "Keywords": ["steam cleaning", "allergens", "health"],
        "IncludeQuotation": false,
        "IncludeFaq": true,
        "RelatedFaq": "How often should I clean my carpet?"
      },
      {
        "Index": 3,
        "Type": "body",
        "Header": "Professional vs DIY Carpet Cleaning: What Melton Families Need to Know",
        "Intent": "Compare approaches, establish value proposition",
        "TargetWords": 300,
        "Keywords": ["professional cleaning", "DIY"],
        "IncludeQuotation": true,
        "IncludeFaq": false
      },
      {
        "Index": 4,
        "Type": "body",
        "Header": "Atto Property's Eco-Friendly Cleaning Process",
        "Intent": "Describe methodology, highlight differentiators",
        "TargetWords": 250,
        "Keywords": ["eco-friendly", "process"],
        "IncludeQuotation": false,
        "IncludeFaq": true,
        "RelatedFaq": "Is steam cleaning safe for pets?"
      },
      {
        "Index": 5,
        "Type": "body",
        "Header": "Carpet Cleaning Costs in Caroline Springs and Melton",
        "Intent": "Pricing transparency, value justification",
        "TargetWords": 200,
        "Keywords": ["cost", "pricing", "Caroline Springs"],
        "IncludeQuotation": false,
        "IncludeFaq": true,
        "RelatedFaq": "How much does carpet cleaning cost?"
      },
      {
        "Index": 6,
        "Type": "conclusion",
        "Header": "Transform Your Home with Atto Property Carpet Cleaning",
        "Intent": "Summarize benefits, strong CTA",
        "TargetWords": 150,
        "Keywords": ["Atto Property", "carpet cleaning"],
        "IncludeQuotation": true,
        "IncludeFaq": false
      }
    ],
    "TotalTargetWords": 1300,
    "EstimatedReadTime": "6 min"
  },
  "Research": {
    "PaaQuestions": [
      "How often should carpets be professionally cleaned?",
      "Is steam cleaning better than shampooing?",
      "How long does carpet cleaning take to dry?"
    ],
    "CompetitorHeadings": [
      "Benefits of Professional Carpet Cleaning",
      "Steam Cleaning vs Dry Cleaning",
      "How to Choose a Carpet Cleaner"
    ],
    "SourceUrls": [
      "https://competitor1.com/carpet-cleaning-guide",
      "https://competitor2.com/steam-cleaning-tips"
    ]
  }
}
```

---

### 10. Category Endpoints

#### List Categories

**GET** `/api/v1/seo/{company}/categories`

Returns all blog categories for a company.

#### Response

```json
{
  "Success": true,
  "Categories": [
    {
      "Slug": "cleaning-tips",
      "Name": "Cleaning Tips",
      "Description": "Expert cleaning advice and best practices",
      "ParentSlug": "",
      "SortOrder": 1,
      "BlogCount": 12,
      "CreatedAt": "2026-01-15T08:00:00Z",
      "UpdatedAt": "2026-02-02T10:00:00Z"
    },
    {
      "Slug": "carpet-care",
      "Name": "Carpet Care",
      "Description": "Specialized carpet cleaning tips",
      "ParentSlug": "cleaning-tips",
      "SortOrder": 1,
      "BlogCount": 5
    }
  ]
}
```

#### Create/Update Category

**POST** `/api/v1/seo/{company}/categories`

Creates a new category or updates an existing one (upsert by slug).

#### Request Body

```json
{
  "Slug": "carpet-care",
  "Name": "Carpet Care",
  "Description": "Specialized carpet cleaning tips",
  "ParentSlug": "cleaning-tips",
  "SortOrder": 1
}
```

#### Response

```json
{
  "Success": true,
  "Message": "Category created successfully",
  "Category": {
    "Slug": "carpet-care",
    "Name": "Carpet Care",
    "Description": "Specialized carpet cleaning tips",
    "ParentSlug": "cleaning-tips",
    "SortOrder": 1,
    "CreatedAt": "2026-02-02T10:00:00Z",
    "UpdatedAt": "2026-02-02T10:00:00Z"
  }
}
```

#### Delete Category

**DELETE** `/api/v1/seo/{company}/categories/{slug}`

Deletes a category. Fails if blogs are assigned to it.

#### Response

```json
{
  "Success": true,
  "Message": "Category deleted successfully"
}
```

#### Error Response (Blogs Assigned)

```json
{
  "Success": false,
  "Error": {
    "Code": 9590,
    "Message": "Cannot delete category with assigned blogs",
    "Details": "Category 'cleaning-tips' has 12 blogs. Reassign them first."
  }
}
```

---

## Header Requirements

Every section header MUST contain these elements:

| Element | Required | Example |
|---------|----------|---------|
| Service/Keyword | ✅ Yes | "Carpet Cleaning" |
| Company Name | ✅ Yes | "Atto Property" |
| Location | When applicable | "Melton", "Melbourne" |

### Header Patterns

```
✅ "Professional Carpet Cleaning by Atto Property in Melton"
✅ "Why Melton Families Trust Atto Property for Steam Cleaning"
✅ "Atto Property's Eco-Friendly Tile and Grout Cleaning Process"

❌ "Benefits of Cleaning" (missing company, location)
❌ "Our Services" (generic, not SEO optimized)
❌ "Chapter 1: Introduction" (not descriptive)
```

---

## Coherence Requirements

### Cross-Section Coherence

Each section must:

1. **Reference previous content** - "As mentioned earlier...", "Building on this..."
2. **Foreshadow next content** - "In the next section...", "We'll explore..."
3. **Maintain consistent voice** - Same tone throughout
4. **Use consistent terminology** - Same terms for same concepts

### Paragraph-Level Coherence

Within sections:

1. **Transition words** - 100% sentences start with transitions
2. **Logical flow** - Each sentence builds on previous
3. **Topic sentences** - First sentence states paragraph's main idea
4. **Supporting details** - Following sentences provide evidence/examples

---

## GSearch Integration

### Query Types

| Type | Purpose | Example Query |
|------|---------|---------------|
| PAA | Find related questions | `carpet cleaning FAQ` |
| Headings | Competitor structure | `site:competitor.com carpet cleaning` |
| Quotes | Famous quotations | `"cleaning" famous quote` |
| Facts | Statistics | `carpet cleaning statistics 2024` |

### GSearch CLI Commands

```bash
# Find People Also Ask questions
gsearch paa "carpet cleaning melbourne"

# Scrape competitor headings
gsearch headings "https://competitor.com/carpet-cleaning"

# Find relevant quotes
gsearch quotes "cleaning" --limit 10

# Get industry statistics
gsearch facts "carpet cleaning market size"
```

---

## FAQ Integration

### From Existing FAQ Session

```json
{
  "FaqConfig": {
    "EnableFaqBlending": true,
    "BlendMode": "inline",
    "SourceSessionId": "faq-sess-xyz789",
    "MaxFaqsPerSection": 1,
    "RelevantTopics": ["pricing", "process", "safety"]
  }
}
```

### From GSearch Discovery

When no FAQ session exists, GSearch finds common questions:

```go
// GSearch finds PAA questions relevant to section
questions := gsearch.FindPaa(section.Keywords)

// AI generates answers inline using company training
for _, q := range questions {
    answer := paraGenerator.Generate(ParaRequest{
        Prompt: fmt.Sprintf("Answer this question: %s", q),
        Context: section.Context,
    })
}
```

---

## Error Codes (9576-9599)

| Code | Name | Description |
|------|------|-------------|
| 9576 | `ErrBlogTrainingFailed` | Training data ingestion failed |
| 9577 | `ErrBlogCompanyNotFound` | No training data for company |
| 9578 | `ErrBlogSessionNotFound` | Blog session not found |
| 9579 | `ErrBlogOutlineFailed` | Outline generation failed |
| 9580 | `ErrBlogGsearchFailed` | GSearch integration failed |
| 9581 | `ErrBlogPaaFailed` | PAA extraction failed |
| 9582 | `ErrBlogCompetitorScrapeFailed` | Competitor heading scrape failed |
| 9583 | `ErrBlogGenerationFailed` | Blog content generation failed |
| 9584 | `ErrBlogSectionFailed` | Individual section failed |
| 9585 | `ErrBlogParaCallFailed` | Internal paragraph generator call failed |
| 9586 | `ErrBlogFaqBlendFailed` | FAQ blending failed |
| 9587 | `ErrBlogQuoteInjectionFailed` | Quotation injection failed |
| 9588 | `ErrBlogCoherenceValidationFailed` | Coherence check failed |
| 9589 | `ErrBlogHeaderValidationFailed` | Header requirements not met |
| 9590 | `ErrBlogWordCountExceeded` | Blog exceeds word limit |
| 9591 | `ErrBlogWordCountBelow` | Blog below minimum words |
| 9592 | `ErrBlogSchemaGenerationFailed` | Schema markup failed |
| 9593 | `ErrBlogTocGenerationFailed` | Table of contents failed |
| 9594 | `ErrBlogOutputFormatUnsupported` | Requested format not supported |
| 9595 | `ErrBlogOutlineRequired` | Outline missing for generate |

---

## Configuration

### Seedable Settings

**File:** `config.seed.blog.json`

```json
{
  "Blog": {
    "DefaultSectionCountMin": 5,
    "DefaultSectionCountMax": 8,
    "DefaultTargetWordCount": 2000,
    "DefaultEnableGSearch": true,
    "DefaultIncludePaaQuestions": true,
    "DefaultIncludeCompetitorHeadings": true,
    "DefaultOutputFormat": "html",
    "DefaultIncludeTableOfContents": true,
    "DefaultIncludeSchema": true,
    "DefaultIncludeMetaTags": true,
    "DefaultEnableQuotations": true,
    "DefaultEnableFaqBlending": true,
    "DefaultBlendMode": "inline",
    "DefaultInternalLinksPerSection": 2,
    "DefaultExternalLinksPerSection": 1,
    "SectionTypeDefaults": {
      "introduction": {
        "WordsMin": 100,
        "WordsMax": 200,
        "IncludeQuotation": true,
        "IncludeFaq": false
      },
      "body": {
        "WordsMin": 200,
        "WordsMax": 350,
        "IncludeQuotation": false,
        "IncludeFaq": true
      },
      "conclusion": {
        "WordsMin": 100,
        "WordsMax": 200,
        "IncludeQuotation": true,
        "IncludeFaq": false
      }
    }
  }
}
```

---

## Output Formats

### HTML Output

```html
<article class="blog-post seo-optimized" itemscope itemtype="https://schema.org/BlogPosting">
  <header class="blog-header">
    <h1 itemprop="headline">Complete Guide to Professional Carpet Cleaning in Melton</h1>
    <meta itemprop="datePublished" content="2026-02-02">
    <meta itemprop="author" content="Atto Property">
  </header>
  
  <nav class="table-of-contents">
    <h2>Contents</h2>
    <ol>
      <li><a href="#section-1">Why Professional Carpet Cleaning Matters</a></li>
      <li><a href="#section-2">Health Benefits of Regular Steam Cleaning</a></li>
    </ol>
  </nav>
  
  <section id="section-1" class="blog-section introduction">
    <h2>Why Professional Carpet Cleaning Matters for Melton Homes</h2>
    <p>Furthermore, maintaining clean carpets extends beyond aesthetics...</p>
    <blockquote class="famous-quote">
      <p>"Quality is not an act, it is a habit."</p>
      <cite>— <a href="https://en.wikipedia.org/wiki/Aristotle">Aristotle</a></cite>
    </blockquote>
  </section>
  
  <section id="section-2" class="blog-section body">
    <h2>Health Benefits of Regular Steam Cleaning by Atto Property</h2>
    <p>Moreover, professional steam cleaning eliminates allergens...</p>
    <div class="faq-inline-block">
      <p class="faq-question"><strong>Q: How often should I clean my carpet?</strong></p>
      <p class="faq-answer">Experts recommend professional cleaning every 12-18 months...</p>
    </div>
  </section>
</article>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Complete Guide to Professional Carpet Cleaning in Melton",
  "author": {"@type": "Organization", "name": "Atto Property"},
  "publisher": {"@type": "Organization", "name": "Atto Property"}
}
</script>
```

---

## HTML Blog Generation System

The HTML Blog Generation system extends the blog architecture with category-based template presets, reusable instructions, and prompt tokenization intelligence.

> **Full specification:** See `./55-html-blog-generation.md` for complete API, CLI, and database details.

### Database Schema (in company root DB: `{company-slug}.db`)

#### HtmlBlogCategories

```go
// HtmlBlogCategory represents an HTML blog category type
type HtmlBlogCategory struct {
    Id          int       `gorm:"primaryKey;autoIncrement"`
    Slug        string    `gorm:"uniqueIndex;not null"`    // "faq-html", "service-page"
    Name        string    `gorm:"not null"`                // "FAQ HTML Blog"
    Description string    `json:",omitempty"`
    SortOrder   int       `gorm:"default:0"`
    CreatedAt   time.Time
    UpdatedAt   time.Time

    // ORM Relationships
    Presets []HtmlBlogPreset `gorm:"foreignKey:CategoryId"`
}
```

```sql
CREATE TABLE HtmlBlogCategories (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    Slug        TEXT UNIQUE NOT NULL,
    Name        TEXT NOT NULL,
    Description TEXT,
    SortOrder   INTEGER DEFAULT 0,
    CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### HtmlBlogPresets (many presets per category)

```go
// HtmlBlogPreset represents a reusable generation template
type HtmlBlogPreset struct {
    Id                 int       `gorm:"primaryKey;autoIncrement"`
    CategoryId         int       `gorm:"index;not null"`           // FK -> HtmlBlogCategories.Id
    Name               string    `gorm:"not null"`                 // "Default FAQ Template"
    Slug               string    `gorm:"uniqueIndex;not null"`
    TemplateHtml       string    `json:",omitempty"`               // HTML template/skeleton
    DefaultInstruction string    `json:",omitempty"`               // Default system instruction
    CommonPrompt       string    `json:",omitempty"`               // Common prompt always included
    MaxPromptLength    int       `gorm:"default:10000"`            // Max prompt chars
    ModelPreference    string    `json:",omitempty"`               // Preferred model for this preset
    IsDefault          int       `gorm:"default:0"`                // Default preset for category
    SortOrder          int       `gorm:"default:0"`
    CreatedAt          time.Time
    UpdatedAt          time.Time

    // ORM Relationships
    Category     HtmlBlogCategory      `gorm:"foreignKey:CategoryId"`
    Instructions []HtmlBlogInstruction `gorm:"foreignKey:PresetId"`
}
```

```sql
CREATE TABLE HtmlBlogPresets (
    Id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryId         INTEGER NOT NULL REFERENCES HtmlBlogCategories(Id),
    Name               TEXT NOT NULL,
    Slug               TEXT UNIQUE NOT NULL,
    TemplateHtml       TEXT,
    DefaultInstruction TEXT,
    CommonPrompt       TEXT,
    MaxPromptLength    INTEGER DEFAULT 10000,
    ModelPreference    TEXT,
    IsDefault          INTEGER DEFAULT 0,
    SortOrder          INTEGER DEFAULT 0,
    CreatedAt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt          DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IdxHtmlBlogPresetsCategory ON HtmlBlogPresets(CategoryId);
```

#### HtmlBlogInstructions (reusable instructions per preset)

```go
// HtmlBlogInstruction represents a reusable instruction for a preset
type HtmlBlogInstruction struct {
    Id        int       `gorm:"primaryKey;autoIncrement"`
    PresetId  int       `gorm:"index;not null"`         // FK -> HtmlBlogPresets.Id
    Name      string    `gorm:"not null"`
    Content   string    `gorm:"not null"`               // Instruction text
    IsDefault int       `gorm:"default:0"`              // Auto-include when using this preset
    SortOrder int       `gorm:"default:0"`
    CreatedAt time.Time

    // ORM Relationships
    Preset HtmlBlogPreset `gorm:"foreignKey:PresetId"`
}
```

```sql
CREATE TABLE HtmlBlogInstructions (
    Id        INTEGER PRIMARY KEY AUTOINCREMENT,
    PresetId  INTEGER NOT NULL REFERENCES HtmlBlogPresets(Id),
    Name      TEXT NOT NULL,
    Content   TEXT NOT NULL,
    IsDefault INTEGER DEFAULT 0,
    SortOrder INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IdxHtmlBlogInstructionsPreset ON HtmlBlogInstructions(PresetId);
```

### Relationships

```
HtmlBlogCategories 1:N HtmlBlogPresets 1:N HtmlBlogInstructions
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Paragraph Generation | `./25-ai-seo-paragraph-generation.md` |
| FAQ Generation | `./22-ai-seo-faq-generation.md` |
| Database Paths | `./26-database-paths-reference.md` |
| Error Codes | `./16-ai-seo-error-codes.md` |
| HTML Blog Generation | `./55-html-blog-generation.md` |
| Enum Architecture | `./53-enum-architecture.md` |
| GSearch CLI | `spec/11-spec-management-software/05-features/22-golang-search-cli/` |
| Transition Words | `data/presets/seo/faq/transition-words.json` |
| Quotes Preset | `data/presets/seo/quotes/` |
| Seedable Config | `data/presets/seo/blog/config.seed.blog.json` |
