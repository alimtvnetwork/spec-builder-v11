# HTML Blog Generation System

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

The HTML Blog Generation system extends AI Bridge's SEO capabilities with **category-based template presets**, reusable instructions, prompt tokenization intelligence, and GSearch-powered research integration. It enables generating structured HTML content (FAQ pages, service pages, landing pages, etc.) from configurable presets.

### Key Features

- **Category System:** Organize HTML blog types (FAQ HTML, Service Page, Landing Page, etc.)
- **Preset Templates:** One-to-many presets per category with HTML skeletons and default instructions
- **Reusable Instructions:** Stackable instructions per preset with override support
- **Prompt Tokenization:** Intelligent chunking of large prompts (up to 10,000 chars) into session-scoped RAG
- **GSearch Integration:** Optional research context injection via `--search` flag
- **Override & Layering:** Multi-layer prompt composition with strict instruction support

---

## Architecture

### Split DB Pattern

```
data/
└── {appName}/
    └── rag/
        └── seo/
            ├── {company-slug}.db                  # Company root DB
            │   ├── HtmlBlogCategories             # Category definitions
            │   ├── HtmlBlogPresets                 # Template presets
            │   └── HtmlBlogInstructions            # Reusable instructions
            │
            └── html-blog/
                └── {company}/
                    ├── 001-{slug}.db              # Individual HTML blog DB
                    ├── 002-{slug}.db
                    └── ...
```

### Generation Flow

```
User Request
  ├── Select Category + Preset (or use default)
  ├── Layer Instructions:
  │     CommonPrompt (preset)
  │   + DefaultInstruction (preset, overridable)
  │   + Selected HtmlBlogInstructions (from DB)
  │   + AdditionalInstruction (on-the-fly)
  │   + StrictInstruction (on-the-fly)
  │   + GSearch Context (if --search flag)
  │   + User Prompt (up to 10,000 chars)
  │
  ├── Tokenization Check:
  │     IF total tokens > model context window:
  │       → Chunk into session-scoped RAG
  │       → Retrieve relevant chunks per generation pass
  │
  ├── Generation:
  │     → Feed layered prompt to selected model
  │     → Generate HTML content
  │     → Validate HTML structure
  │
  └── Storage:
        → Save to individual HTML blog DB
        → Register in company root DB
```

---

## REST API Endpoints

All endpoints are company-scoped under `/api/v1/seo/{company}/html-blogs/`.

### Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/{company}/html-blogs/categories` | List HTML blog categories |
| POST | `/api/v1/seo/{company}/html-blogs/categories` | Create category |
| PUT | `/api/v1/seo/{company}/html-blogs/categories/{slug}` | Update category |
| DELETE | `/api/v1/seo/{company}/html-blogs/categories/{slug}` | Delete category |
| GET | `/api/v1/seo/{company}/html-blogs/presets` | List presets (filter by category) |
| POST | `/api/v1/seo/{company}/html-blogs/presets` | Create preset |
| PUT | `/api/v1/seo/{company}/html-blogs/presets/{slug}` | Update preset |
| DELETE | `/api/v1/seo/{company}/html-blogs/presets/{slug}` | Delete preset |
| GET | `/api/v1/seo/{company}/html-blogs/presets/{slug}/instructions` | List instructions for preset |
| POST | `/api/v1/seo/{company}/html-blogs/presets/{slug}/instructions` | Add instruction to preset |
| PUT | `/api/v1/seo/{company}/html-blogs/instructions/{id}` | Update instruction |
| DELETE | `/api/v1/seo/{company}/html-blogs/instructions/{id}` | Delete instruction |
| POST | `/api/v1/seo/{company}/html-blogs/generate` | Generate HTML blog |
| GET | `/api/v1/seo/{company}/html-blogs` | List generated HTML blogs |
| GET | `/api/v1/seo/{company}/html-blogs/{id}` | Get single HTML blog |
| DELETE | `/api/v1/seo/{company}/html-blogs/{id}` | Delete generated HTML blog |

---

### 1. List Categories

**GET** `/api/v1/seo/{company}/html-blogs/categories`

#### Response

```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1,
      "Slug": "faq-html",
      "Name": "FAQ HTML Blog",
      "Description": "Generate FAQ-style HTML pages",
      "SortOrder": 1,
      "PresetCount": 3,
      "CreatedAt": "2026-02-06T10:00:00Z"
    }
  ],
  "Pagination": {
    "TotalRecords": 5,
    "TotalPages": 1,
    "CurrentPage": 1,
    "PageSize": 20
  }
}
```

---

### 2. Create Category

**POST** `/api/v1/seo/{company}/html-blogs/categories`

#### Request Body

```json
{
  "Slug": "service-page",
  "Name": "Service Page",
  "Description": "Generate service-specific landing pages",
  "SortOrder": 2
}
```

---

### 3. List Presets

**GET** `/api/v1/seo/{company}/html-blogs/presets?category=faq-html`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | - | Filter by category slug |
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 20 | Results per page |

#### Response

```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1,
      "CategoryId": 1,
      "CategorySlug": "faq-html",
      "Name": "Default FAQ Template",
      "Slug": "default-faq-template",
      "MaxPromptLength": 10000,
      "ModelPreference": "llama3.1:8b",
      "IsDefault": 1,
      "InstructionCount": 2,
      "CreatedAt": "2026-02-06T10:00:00Z"
    }
  ]
}
```

---

### 4. Create Preset

**POST** `/api/v1/seo/{company}/html-blogs/presets`

#### Request Body

```json
{
  "CategoryId": 1,
  "Name": "Custom FAQ Template",
  "Slug": "custom-faq-template",
  "TemplateHtml": "<article class=\"faq-blog\">{{content}}</article>",
  "DefaultInstruction": "Generate an FAQ-style HTML blog using the provided template structure. Use semantic HTML5 tags. Include Schema.org FAQ markup.",
  "CommonPrompt": "Write in a professional yet approachable tone. Use transition words to start every sentence.",
  "MaxPromptLength": 10000,
  "ModelPreference": "llama3.1:8b",
  "IsDefault": 0
}
```

---

### 5. Add Instruction to Preset

**POST** `/api/v1/seo/{company}/html-blogs/presets/{slug}/instructions`

#### Request Body

```json
{
  "Name": "SEO Optimization Rules",
  "Content": "Include target keyword in H1, first paragraph, and at least 2 H2 headings. Meta description must be under 160 characters. Use alt attributes on all images.",
  "IsDefault": 1,
  "SortOrder": 1
}
```

---

### 6. Generate HTML Blog

**POST** `/api/v1/seo/{company}/html-blogs/generate`

#### Request Body

```json
{
  "PresetSlug": "default-faq-template",
  "Prompt": "Write an FAQ HTML blog about carpet cleaning services in Melbourne. Cover pricing, methods, frequency, and stain removal. Target keywords: carpet cleaning Melbourne, steam cleaning, professional carpet cleaners.",
  "AdditionalInstruction": "Include a comparison table of cleaning methods with pricing ranges.",
  "StrictInstruction": "Do NOT mention competitor brand names. All prices must be in AUD.",
  "OverrideInstruction": "Replace the default instruction with: Focus on eco-friendly cleaning methods only.",
  "Search": true,
  "SearchPlatforms": ["google", "youtube"],
  "Model": "llama3.1:8b",
  "Keywords": ["carpet cleaning Melbourne", "steam cleaning"],
  "Areas": ["Melbourne", "South Yarra", "Richmond"]
}
```

#### Generation Process

```
1. Load preset (default-faq-template) with its category
2. Load default instructions (IsDefault=1) from HtmlBlogInstructions
3. Build layered prompt:
   a. CommonPrompt from preset
   b. DefaultInstruction from preset (or OverrideInstruction if provided)
   c. Default HtmlBlogInstructions for this preset
   d. AdditionalInstruction (user-provided, on-the-fly)
   e. StrictInstruction (user-provided, on-the-fly)
   f. GSearch results (if Search=true)
   g. User Prompt
4. Check token budget:
   - Calculate: model_context_window - system_prompt_tokens - instruction_tokens
   - If user prompt exceeds budget:
     a. Chunk prompt into ~512 token segments
     b. Store in session-scoped RAG DB
     c. Use retrieval to inject relevant chunks per pass
5. Generate HTML content
6. Validate HTML structure
7. Store in individual HTML blog DB
8. Register in company root DB
```

#### Response

```json
{
  "Success": true,
  "Data": {
    "Id": "001",
    "Slug": "carpet-cleaning-faq-melbourne",
    "Title": "Carpet Cleaning FAQ - Melbourne",
    "CategorySlug": "faq-html",
    "PresetSlug": "default-faq-template",
    "Status": "published",
    "Content": {
      "Html": "<article class=\"faq-blog\">...</article>",
      "Text": "Carpet Cleaning FAQ...",
      "Markdown": "# Carpet Cleaning FAQ..."
    },
    "WordCount": 1200,
    "TokensUsed": 3450,
    "Model": "llama3.1:8b",
    "SearchResultsUsed": 8,
    "DbPath": "data/myapp/rag/seo/html-blog/my-company/001-carpet-cleaning-faq-melbourne.db",
    "CreatedAt": "2026-02-06T12:00:00Z"
  }
}
```

---

## CLI Commands

### Generate HTML Blog

```bash
aibridge seo html-blog generate \
  --company my-company \
  --preset default-faq-template \
  --prompt "Write an FAQ HTML blog about carpet cleaning..." \
  --instruction "Include comparison table" \
  --strict "No competitor names" \
  --search \
  --search-platforms google,youtube \
  --model llama3.1:8b \
  --keywords "carpet cleaning Melbourne,steam cleaning" \
  --areas "Melbourne,South Yarra"
```

### Category Management

```bash
# List categories
aibridge seo html-blog categories list --company my-company

# Create category
aibridge seo html-blog categories create \
  --company my-company \
  --slug faq-html \
  --name "FAQ HTML Blog" \
  --description "Generate FAQ-style HTML pages"

# Delete category
aibridge seo html-blog categories delete --company my-company --slug faq-html
```

### Preset Management

```bash
# List presets
aibridge seo html-blog presets list --company my-company --category faq-html

# Create preset
aibridge seo html-blog presets create \
  --company my-company \
  --category faq-html \
  --name "Default FAQ Template" \
  --slug default-faq-template \
  --template-file ./templates/faq.html \
  --instruction "Generate FAQ-style HTML with Schema.org markup" \
  --common-prompt "Write professionally. Use transition words." \
  --model llama3.1:8b \
  --default

# Update preset
aibridge seo html-blog presets update \
  --company my-company \
  --slug default-faq-template \
  --instruction "Updated default instruction"
```

### Instruction Management

```bash
# List instructions for a preset
aibridge seo html-blog instructions list \
  --company my-company \
  --preset default-faq-template

# Add instruction
aibridge seo html-blog instructions add \
  --company my-company \
  --preset default-faq-template \
  --name "SEO Rules" \
  --content "Include keyword in H1 and first paragraph" \
  --default

# Remove instruction
aibridge seo html-blog instructions delete \
  --company my-company \
  --id 5
```

### List & View Generated Blogs

```bash
# List all generated HTML blogs
aibridge seo html-blog list --company my-company --status published

# View single blog
aibridge seo html-blog get --company my-company --id 001

# Delete blog
aibridge seo html-blog delete --company my-company --id 001
```

---

## Prompt Tokenization Intelligence

### Problem

User prompts can be up to **10,000 characters** (~2,500 tokens). Combined with system instructions, preset prompts, and GSearch context, the total may exceed the model's context window.

### Solution: Session-Scoped RAG Chunking

```
Input: User prompt (10,000 chars) + Instructions + GSearch context

Step 1: Calculate token budget
  model_context_window = 8192 (example)
  system_prompt_tokens = 500
  instruction_tokens   = 800
  gsearch_tokens       = 1200
  available_budget     = 8192 - 500 - 800 - 1200 = 5692 tokens

Step 2: Estimate prompt tokens
  prompt_tokens = len(prompt) / 4  ≈ 2500 tokens
  
Step 3: If prompt_tokens > available_budget:
  a. Chunk prompt into ~512 token segments
  b. Store chunks in session-scoped RAG DB:
     data/{appName}/rag/seo/html-blog/{company}/session-{uuid}.db
  c. Tag chunks with extracted keywords
  d. For each generation pass:
     - Retrieve top-K relevant chunks within token budget
     - Generate section-by-section
     - Accumulate output

Step 4: If prompt_tokens <= available_budget:
  → Send entire prompt in single pass
```

### Token Budget Allocation (Seedable)

```json
{
  "Seo.HtmlBlog.TokenBudget.SystemPromptReserve": 500,
  "Seo.HtmlBlog.TokenBudget.InstructionReserve": 1000,
  "Seo.HtmlBlog.TokenBudget.SearchContextReserve": 1500,
  "Seo.HtmlBlog.TokenBudget.ChunkSize": 512,
  "Seo.HtmlBlog.TokenBudget.ChunkOverlap": 64
}
```

---

## Override & Layering Logic

### Prompt Composition Order

The final prompt sent to the model is assembled in this order:

```
┌─────────────────────────────────────────┐
│ 1. System Role (always first)           │
├─────────────────────────────────────────┤
│ 2. CommonPrompt (from preset)           │
├─────────────────────────────────────────┤
│ 3. DefaultInstruction (from preset)     │
│    OR OverrideInstruction (if provided) │
├─────────────────────────────────────────┤
│ 4. HtmlBlogInstructions (IsDefault=1)   │
│    (from DB, sorted by SortOrder)       │
├─────────────────────────────────────────┤
│ 5. AdditionalInstruction (on-the-fly)   │
├─────────────────────────────────────────┤
│ 6. StrictInstruction (on-the-fly)       │
│    (prefixed with "STRICT: ")           │
├─────────────────────────────────────────┤
│ 7. GSearch Context (if --search used)   │
│    (web results, YouTube data, etc.)    │
├─────────────────────────────────────────┤
│ 8. TemplateHtml (from preset)           │
│    (as reference structure)             │
├─────────────────────────────────────────┤
│ 9. User Prompt (up to 10,000 chars)     │
└─────────────────────────────────────────┘
```

### Override Behavior

| Scenario | Behavior |
|----------|----------|
| No override | CommonPrompt + DefaultInstruction + DB Instructions + User Prompt |
| OverrideInstruction provided | Replaces DefaultInstruction only; DB Instructions still apply |
| AdditionalInstruction provided | Appended after DB Instructions |
| StrictInstruction provided | Appended with `STRICT:` prefix — model treats as hard constraint |
| Search enabled | GSearch results injected between strict instructions and prompt |

---

## Go Structs

### Generate Request

```go
// HtmlBlogGenerateRequest represents an HTML blog generation request
type HtmlBlogGenerateRequest struct {
    PresetSlug           string   `json:",omitempty"` // Required: preset to use
    Prompt               string   `json:",omitempty"` // User prompt (up to 10,000 chars)
    AdditionalInstruction string  `json:",omitempty"` // Extra instruction (on-the-fly)
    StrictInstruction    string   `json:",omitempty"` // Hard constraint instruction
    OverrideInstruction  string   `json:",omitempty"` // Replaces preset's DefaultInstruction
    Search               bool     `json:",omitempty"` // Enable GSearch context
    SearchPlatforms      []string `json:",omitempty"` // ["google", "youtube", "reddit"]
    Model                string   `json:",omitempty"` // Override model preference
    Keywords             []string `json:",omitempty"` // Target SEO keywords
    Areas                []string `json:",omitempty"` // Target geographic areas
}
```

### Generate Response

```go
// HtmlBlogGenerateResponse represents the generation result
type HtmlBlogGenerateResponse struct {
    Success bool              `json:",omitempty"`
    Data    HtmlBlogGenerated `json:",omitempty"`
}

// HtmlBlogGenerated represents a generated HTML blog
type HtmlBlogGenerated struct {
    Id                string                  `json:",omitempty"` // Sequential ID "001"
    Slug              string                  `json:",omitempty"`
    Title             string                  `json:",omitempty"`
    CategorySlug      string                  `json:",omitempty"`
    PresetSlug        string                  `json:",omitempty"`
    Status            html_blog_status.Variant `json:",omitempty"` // Draft, Generating, Published, Archived
    Content           HtmlBlogContent         `json:",omitempty"`
    WordCount         int                     `json:",omitempty"`
    TokensUsed        int                     `json:",omitempty"`
    Model             string                  `json:",omitempty"`
    SearchResultsUsed int                     `json:",omitempty"`
    DbPath            string                  `json:",omitempty"`
    Keywords          []string                `json:",omitempty"`
    Areas             []string                `json:",omitempty"`
    CreatedAt         time.Time               `json:",omitempty"`
    UpdatedAt         time.Time               `json:",omitempty"`
}

// HtmlBlogContent holds the generated content in multiple formats
type HtmlBlogContent struct {
    Html     string `json:",omitempty"`
    Text     string `json:",omitempty"`
    Markdown string `json:",omitempty"`
}
```

### Registry Entry (in company root DB)

```go
// HtmlBlogRegistryEntry tracks generated HTML blogs
type HtmlBlogRegistryEntry struct {
    Id           int                      `gorm:"primaryKey;autoIncrement"`
    BlogId       string                   `gorm:"uniqueIndex;not null"`      // "001"
    Slug         string                   `gorm:"uniqueIndex;not null"`
    Title        string                   `gorm:"not null"`
    CategorySlug string                   `gorm:"index"`
    PresetSlug   string
    Status       html_blog_status.Variant `gorm:"default:0"`
    WordCount    int
    DbPath       string                   `gorm:"not null"`
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

---

## Seedable Settings

Added to `config.seed.json` for the HTML blog generation module:

```json
{
  "Seo.HtmlBlog.MaxPromptLength": 10000,
  "Seo.HtmlBlog.DefaultModel": "llama3.1:8b",
  "Seo.HtmlBlog.TokenBudget.SystemPromptReserve": 500,
  "Seo.HtmlBlog.TokenBudget.InstructionReserve": 1000,
  "Seo.HtmlBlog.TokenBudget.SearchContextReserve": 1500,
  "Seo.HtmlBlog.TokenBudget.ChunkSize": 512,
  "Seo.HtmlBlog.TokenBudget.ChunkOverlap": 64,
  "Seo.HtmlBlog.Search.Enabled": true,
  "Seo.HtmlBlog.Search.MaxResults": 10,
  "Seo.HtmlBlog.Search.Platforms": ["google", "youtube", "reddit"],
  "Seo.HtmlBlog.Search.IncludeTranscript": false,
  "Seo.HtmlBlog.Validation.MinWordCount": 300,
  "Seo.HtmlBlog.Validation.MaxWordCount": 5000,
  "Seo.HtmlBlog.Validation.RequireSchemaOrg": true
}
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 9720 | `ErrHtmlBlogCategoryNotFound` | HTML blog category not found |
| 9721 | `ErrHtmlBlogPresetNotFound` | HTML blog preset not found |
| 9722 | `ErrHtmlBlogInstructionNotFound` | HTML blog instruction not found |
| 9723 | `ErrHtmlBlogPromptTooLong` | Prompt exceeds MaxPromptLength |
| 9724 | `ErrHtmlBlogGenerationFailed` | HTML blog generation failed |
| 9725 | `ErrHtmlBlogTokenBudgetExceeded` | Total tokens exceed model context window |
| 9726 | `ErrHtmlBlogValidationFailed` | Generated HTML failed validation |
| 9727 | `ErrHtmlBlogDuplicateSlug` | Category or preset slug already exists |
| 9728 | `ErrHtmlBlogSearchFailed` | GSearch integration failed during generation |
| 9729 | `ErrHtmlBlogNotFound` | Generated HTML blog not found |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Blog Generation (standard) | `./27-ai-seo-blog-generation.md` |
| Paragraph Generation | `./25-ai-seo-paragraph-generation.md` |
| FAQ Generation | `./22-ai-seo-faq-generation.md` |
| GSearch Integration | `./40-gsearch-context-integration.md` |
| Memory Retrieval | `./54-memory-retrieval-best-practices.md` |
| Session-Scoped RAG | `./36-session-scoped-rag-memory.md` |
| Enum Architecture | `./53-enum-architecture.md` |
| Database Paths | `./26-database-paths-reference.md` |
| Error Codes | `./16-ai-seo-error-codes.md` |
| OpenAPI Spec | `./30-openapi-spec-seo.md` |

---

*AI Bridge CLI — HTML Blog Generation System v1.0.0*
