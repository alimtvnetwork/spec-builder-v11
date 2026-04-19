# AI SEO FAQ Generation Endpoint

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

The FAQ Generation endpoint creates SEO-optimized FAQ content with JSON-LD schema markup. It uses company-specific RAG training stored in the unified SEO database and produces output in multiple formats (HTML, Markdown, Text, JSON).

---

## Architecture

### Split DB Pattern (v3.0)

```
data/
├── aibridge.db                                    # Root DB (global settings)
└── {appName}/
    └── rag/
        └── seo/
            ├── {company-slug}.db                  # Company SEO root (registry + training)
            │   ├── FaqTrainingChunks              # RAG chunks from training
            │   ├── FaqSessions                    # FAQ session registry
            │   └── CompanyProfile                 # Shared company metadata
            └── faq/
                └── {company}/
                    └── {seq}-{slug}.db            # Individual FAQ content
                        └── FaqGeneratedContent    # Generated FAQ history
```

> **Note:** See `26-database-paths-reference.md` for complete path definitions. Company root DB stores training data, individual content DBs store generated FAQs.

### Flow

```
Training Request → RAG Ingestion → Unified SEO DB → Session Created
                        ↓
Generate Request → Session Context → RAG Retrieval → AI Generation → Output Format
```

---

## API Endpoints

All FAQ endpoints follow the RESTful company-scoped pattern.

### Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/{company}/faq` | List all FAQ sessions/content |
| GET | `/api/v1/seo/{company}/faq/{id}` | Get single FAQ content |
| POST | `/api/v1/seo/{company}/faq` | Generate new FAQ |
| PUT | `/api/v1/seo/{company}/faq/{id}` | Update/regenerate FAQ |
| DELETE | `/api/v1/seo/{company}/faq/{id}` | Delete FAQ content |
| POST | `/api/v1/seo/{company}/faq/train` | Train FAQ model |

> **Note:** `{company}` is the company slug (e.g., `atto-property`). `{id}` accepts session ID or auto-generated FAQ ID.

---

### 1. List FAQs

**GET** `/api/v1/seo/{company}/faq`

Lists all FAQ sessions and generated content for a company.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Results per page (max 100) |
| `session` | string | - | Filter by session ID |
| `keyword` | string | - | Filter by keyword |

#### Response

```json
{
  "Success": true,
  "Faqs": [
    {
      "FaqId": "faq-001",
      "SessionId": "faq-sess-abc123",
      "Question": "How much does carpet cleaning cost in Melton?",
      "Keywords": ["carpet cleaning", "cost", "Melton"],
      "Format": "html",
      "WordCount": 156,
      "CreatedAt": "2026-02-02T10:00:00Z"
    }
  ],
  "Pagination": {
    "Page": 1,
    "Limit": 20,
    "TotalItems": 45,
    "TotalPages": 3
  }
}
```

---

### 2. Get Single FAQ

**GET** `/api/v1/seo/{company}/faq/{id}`

Retrieves full FAQ content by ID or session.

#### Response

```json
{
  "Success": true,
  "Faq": {
    "FaqId": "faq-001",
    "SessionId": "faq-sess-abc123",
    "Question": "How much does carpet cleaning cost in Melton?",
    "Answer": {
      "Html": "<div class=\"faq-answer\">...</div>",
      "Markdown": "## How much does carpet cleaning cost...",
      "Text": "Professional carpet cleaning in Melton..."
    },
    "Schema": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [...]
    },
    "Keywords": ["carpet cleaning", "cost", "Melton"],
    "WordCount": 156,
    "CreatedAt": "2026-02-02T10:00:00Z"
  }
}
```

---

### 3. Generate FAQ

**POST** `/api/v1/seo/{company}/faq`

Generates new FAQ content based on training and configuration.

#### Request Body

```json
{
  "SessionId": "faq-sess-abc123",
  "Keywords": ["budget carpet cleaning", "affordable steam cleaning"],
  "Prompt": "Focus on budget-conscious families in suburban areas",
  "Content": {
    "Question": "How much does professional carpet cleaning cost?",
    "Area": "Melton",
    "Service": "Carpet Cleaning"
  },
  "OutputConfig": {
    "Format": "html",
    "IncludeSchema": true,
    "MaxWords": 200
  }
}
```

> **Note:** Company is derived from URL path, not request body.

#### Response

```json
{
  "Success": true,
  "FaqId": "faq-002",
  "SessionId": "faq-sess-abc123",
  "GeneratedAt": "2026-02-02T10:30:00Z",
  "Content": {
    "Html": "<div class=\"faq-item\">...</div>",
    "Markdown": "## Question\n\nAnswer...",
    "Text": "Question: ... Answer: ..."
  },
  "Schema": {...},
  "Metadata": {
    "WordCount": 156,
    "SentenceCount": 9,
    "TransitionDensity": 100
  }
}
```

---

### 4. Update FAQ

**PUT** `/api/v1/seo/{company}/faq/{id}`

Updates or regenerates an existing FAQ.

#### Request Body

```json
{
  "Regenerate": true,
  "Prompt": "Make the answer more concise",
  "OutputConfig": {
    "Format": "html",
    "MaxWords": 150
  }
}
```

#### Response

```json
{
  "Success": true,
  "FaqId": "faq-001",
  "Message": "FAQ regenerated successfully",
  "UpdatedAt": "2026-02-02T11:00:00Z"
}
```

---

### 5. Delete FAQ

**DELETE** `/api/v1/seo/{company}/faq/{id}`

Deletes an FAQ entry.

#### Response

```json
{
  "Success": true,
  "Message": "FAQ deleted successfully",
  "DeletedFaq": {
    "FaqId": "faq-001",
    "Question": "How much does carpet cleaning cost?"
  }
}
```

---

### 6. Training Endpoint

**POST** `/api/v1/seo/{company}/faq/train`

Ingests training data for company-specific FAQ generation.

#### Request Body

```json
{
  "Website": "https://attoproperty.com.au",
  "TrainingData": [
    {
      "Type": "text",
      "Content": "Your training content here as plain text string"
    },
    {
      "Type": "url",
      "Content": "https://attoproperty.com.au/about-us/"
    }
  ],
  "Keywords": ["carpet cleaning", "steam cleaning", "professional cleaning"],
  "Prompt": "Focus on eco-friendly methods and budget-conscious families",
  "CompanyProfile": {
    "Name": "Atto Property",
    "Tagline": "Melbourne's Trusted Cleaning Experts",
    "AlternateTaglines": ["Your Local Cleaning Specialists", "Clean Homes, Happy Families"],
    "Description": "Full-service property cleaning company serving Melbourne metro area since 2023",
    "Url": "https://attoproperty.com.au",
    "FoundedYear": "2023",
    "YearsOfExperience": "5",
    "CombinedExperience": "15",
    "ProjectsCompleted": "5647",
    "ClientsServed": "3000",
    "Certifications": ["IICRC Certified", "EPA Approved"],
    "Specialties": ["Eco-friendly cleaning", "Same-day service"]
  },
  "Services": [
    {
      "Name": "Carpet Cleaning"
    },
    {
      "Name": "Tile Cleaning",
      "Methods": ["pressure washing", "grout sealing"],
      "Benefits": ["hygiene", "stain removal"]
    }
  ],
  "Location": {
    "Country": "Australia",
    "Region": "Victoria",
    "Cities": {
      "Melbourne CBD": ["Melton", "Caroline Springs", "Taylors Lakes", "Sunbury"],
      "Geelong": ["Lara", "Corio", "Belmont"]
    }
  },
  "Ctas": [
    {"Type": "phone", "Text": "Call us today for a free quote!", "Priority": 1},
    {"Type": "quote", "Text": "Get your instant estimate", "Url": "/quote", "Priority": 2}
  ],
  "Variables": {
    "PriceRange": "$99-$299",
    "ResponseTime": "within 24 hours"
  }
}
```

> **Note:** Company slug is derived from URL path. Company name is taken from `CompanyProfile.Name` in the request.

#### Response

```json
{
  "Success": true,
  "SessionId": "faq-sess-abc123",
  "Message": "Training data ingested successfully",
  "RagStats": {
    "ChunksCreated": 45,
    "TokensProcessed": 12500,
    "DbPath": "data/myapp/rag/seo/atto-property.db"
  }
}
```

---

### 2. Generate Endpoint

**POST** `/api/v1/seo/faq/generate`

Generates FAQ content based on training and questions.

#### Request Body

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "SessionId": "faq-sess-abc123",
  "Keywords": ["budget carpet cleaning", "affordable steam cleaning"],
  "Prompt": "Focus on budget-conscious families in suburban areas. Emphasize eco-friendly methods.",
  "Content": {
    "Type": "text",
    "Data": "Q: How to clean a carpet on a budget?\nA: Regular vacuuming helps...\n\nQ: Is steam cleaning safe?\nA: Yes, steam cleaning is safe..."
  },
  "Questions": [
    {
      "Question": "How to clean a carpet on a budget?",
      "Answer": "Optional existing answer to improve",
      "Links": [
        {
          "Url": "https://attoproperty.com.au/carpet-cleaning-in-melton/",
          "Text": "carpet cleaning",
          "Type": "internal"
        }
      ]
    }
  ],
  "OutputConfig": {
    "Format": "html",
    "IncludeSchema": true,
    "SchemaVariation": true,
    "EncodeHtmlInJson": true,
    "WordLimit": 180,
    "AnswersOnly": false,
    "SingleAnswer": false
  },
  "SeoConfig": {
    "ServiceAreas": ["Melton", "Caroline Springs", "Taylors Lakes"],
    "TransitionDensity": 40,
    "KeywordMentions": 8,
    "AreaMentions": 4,
    "MaxSentenceWords": 18,
    "MaxParagraphWords": 180
  },
  "IntegrationConfig": {
    "EnableGSearch": false,
    "EnableSitemapLinking": true,
    "EnableYouTubeEmbed": false,
    "SitemapUrl": "https://attoproperty.com.au/sitemap.xml"
  },
  "Ctas": [
    {"Type": "quote", "Text": "Get your free estimate today!"},
    {"Type": "phone", "Text": "Call now for same-day service!"}
  ],
  "AlternateTaglines": [
    "Melbourne's #1 Eco-Friendly Cleaners",
    "Clean Living, Green Solutions"
  ],
  "Variables": {
    "Discount": "20% off first booking",
    "PriceRange": "$99-$299"
  }
}
```

#### Content Field for Bulk Input

The `Content` field allows passing questions/answers as bulk text or file:

```json
{
  "Content": {
    "Type": "text",
    "Data": "Q: First question?\nA: First answer...\n\nQ: Second question?\nA: Second answer..."
  }
}
```

Or from file:

```json
{
  "Content": {
    "Type": "file",
    "Data": "base64-encoded-content-here",
    "FileType": "md"
  }
}
```

| Content.Type | Content.Data | Description |
|--------------|--------------|-------------|
| `text` | Plain string | Q&A pairs as text |
| `file` | Base64 | Encoded file content |
| `url` | URL string | Fetch from URL |

#### Response

```json
{
  "Success": true,
  "SessionId": "faq-sess-abc123",
  "GeneratedAt": "2026-02-02T10:30:00Z",
  "Company": "atto-property",
  "Faqs": [
    {
      "Question": "How to clean a carpet on a budget?",
      "Answer": {
        "Html": "&lt;p&gt;Budget friendly carpet cleaning...&lt;/p&gt;",
        "Markdown": "Budget friendly carpet cleaning...",
        "Text": "Budget friendly carpet cleaning..."
      },
      "Schema": {
        "@type": "Question",
        "name": "How to clean a carpet on a budget?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "<p>Budget friendly...</p>"
        }
      },
      "Metadata": {
        "WordCount": 165,
        "TransitionDensity": 42.5,
        "KeywordCount": 9,
        "AreaMentions": 4,
        "LinksUsed": 5
      }
    }
  ],
  "FullHtml": "...",
  "FullSchema": "..."
}
```

---

## Session Management

Each company has a root DB for training and individual content DBs:

```
data/{appName}/rag/seo/
├── {company-slug}.db                    # Company root (training + registry)
│   ├── FaqTrainingChunks                # Shared training data
│   ├── FaqSessions                      # Session registry
│   └── CompanyProfile                   # Company metadata
└── faq/
    └── {company}/
        ├── 001-first-faq.db             # Individual FAQ content
        ├── 002-second-faq.db
        └── {seq}-{slug}.db              # Pattern: sequence + slug
```

**Session Behavior:**
- `SessionId` in request continues existing conversation
- Omit `SessionId` to start new session (new ID returned)
- Sessions preserve context for follow-up refinements

---

## Route DB Registry

The Route DB (`data/aibridge.db`) maintains a registry of all trained FAQ companies for exploration:

### Exploration Endpoints

**GET** `/api/v1/seo/faq` - List all trained companies

```json
{
  "Success": true,
  "Companies": [
    {
      "CompanySlug": "atto-property",
      "CompanyName": "Atto Property",
      "Website": "https://attoproperty.com.au",
      "DbPath": "data/myapp/rag/faq/atto-property.db",
      "SessionCount": 3,
      "LastTrainedAt": "2026-02-02T10:00:00Z"
    }
  ]
}
```

**GET** `/api/v1/seo/faq/{companySlug}` - Get company details with all sessions

```json
{
  "Success": true,
  "Company": {
    "CompanySlug": "atto-property",
    "CompanyName": "Atto Property",
    "Website": "https://attoproperty.com.au",
    "DbPath": "data/myapp/rag/faq/atto-property.db"
  },
  "Training": {
    "ChunksCreated": 45,
    "TokensProcessed": 12500,
    "Services": ["Carpet Cleaning", "Tile Cleaning"],
    "Keywords": ["carpet cleaning", "steam cleaning"]
  },
  "Sessions": [
    {
      "SessionId": "faq-sess-abc123",
      "Title": "Eco-friendly carpet cleaning FAQs",
      "MessageCount": 5,
      "CreatedAt": "2026-02-01T10:00:00Z",
      "UpdatedAt": "2026-02-02T10:00:00Z"
    },
    {
      "SessionId": "faq-sess-def456",
      "Title": "Budget cleaning tips",
      "MessageCount": 3,
      "CreatedAt": "2026-02-02T08:00:00Z",
      "UpdatedAt": "2026-02-02T09:00:00Z"
    }
  ]
}
```

---

## Programmatic Field Derivation

The following fields are **auto-generated** (do NOT include in request):

| Derived Field | Generated From | Example |
|---------------|----------------|---------|
| `CompanySlug` | `Company` | "Atto Property" → "atto-property" |
| `NameLowercase` | `Name` | "Carpet Cleaning" → "carpet cleaning" |
| `NamePlural` | `Name` | "Carpet Cleaning" → "carpets" |
| `UrlSlug` | `Name` | "Carpet Cleaning" → "carpet-cleaning" |
| `AreaUrlSlug` | Area name | "Melton" → "melton" |
| `CityUrlSlug` | City name | "Melbourne CBD" → "melbourne-cbd" |

**URL Slug Generation Rules:**
1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters
4. Collapse multiple hyphens

---

## Output Formats

**HTML Output (`Format: "html"`):**

```html
<div class="paragraph-parent-block seo-parent-block seo-page-block center abstract-page-container abstract-page-faq-container">
  <div class="seo-faq-list seo-container-para contrast">
    <div class="faq-item">
      <details class="faq-detail-tab">
        <summary class="faq-summary-tab">
          <h3 title="Moreover, Budget Carpet Cleaning: affordable maintenance...">
            How to clean a carpet on a budget?
          </h3>
          <i class="faq-icon-wrapper"><i class="faq-icon"></i></i>
        </summary>
        <div class="faq-content">
          Budget friendly <strong title="..."><a href="..." title="...">Carpet Cleaning</a></strong> starts with regular vacuuming...
        </div>
      </details>
    </div>
  </div>
</div>

<div id="faq-schema-markup-section" class="faq-schema-markup">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [...]
  }
  </script>
</div>
```

**Markdown Output (`Format: "markdown"`):**

```markdown
## How to clean a carpet on a budget?

Budget friendly carpet cleaning starts with regular vacuuming and immediate spot treatment. Furthermore, using household items like baking soda helps maintain freshness. **Atto Property** offers affordable multi room packages.

Moreover, strategic deep cleaning of high traffic areas remains essential...
```

**Text Output (`Format: "text"`):**

```text
Q: How to clean a carpet on a budget?

A: Budget friendly carpet cleaning starts with regular vacuuming and immediate spot treatment. Furthermore, using household items like baking soda helps maintain freshness. Atto Property offers affordable multi room packages.

Moreover, strategic deep cleaning of high traffic areas remains essential...
```

**JSON Output (`Format: "json"`):**

```json
{
  "Success": true,
  "SessionId": "faq-sess-abc123",
  "GeneratedAt": "2026-02-02T10:30:00Z",
  "Company": "atto-property",
  "Faqs": [
    {
      "Question": "How to clean a carpet on a budget?",
      "Answer": {
        "Html": "&lt;p&gt;Budget friendly carpet cleaning...&lt;/p&gt;",
        "Markdown": "Budget friendly carpet cleaning...",
        "Text": "Budget friendly carpet cleaning..."
      },
      "Schema": {...},
      "Metadata": {...}
    }
  ],
  "FullHtml": "...",
  "FullSchema": "..."
}
```

---

## CW Config Integration

### Seedable Settings

**File:** `config.seed.json`

```json
{
  "Faq": {
    "DefaultOutputFormat": "html",
    "DefaultIncludeSchema": true,
    "DefaultSchemaVariation": false,
    "DefaultEncodeHtmlInJson": true,
    "DefaultWordLimit": 180,
    "DefaultTransitionDensity": 40,
    "DefaultKeywordMentions": 8,
    "DefaultAreaMentions": 4,
    "DefaultMaxSentenceWords": 18,
    "DefaultMaxParagraphWords": 180,
    "DefaultEnableGSearch": false,
    "DefaultEnableSitemapLinking": true,
    "DefaultEnableYouTubeEmbed": false,
    "SchemaTemplates": ["default", "minimal", "extended"],
    "HtmlTemplates": ["standard", "compact", "detailed"]
  }
}
```

### Typed Constants

```go
// FAQ Key Constants
type FaqKey string
const (
    FaqKeyDefaultOutputFormat       FaqKey = "DefaultOutputFormat"
    FaqKeyDefaultIncludeSchema      FaqKey = "DefaultIncludeSchema"
    FaqKeyDefaultSchemaVariation    FaqKey = "DefaultSchemaVariation"
    FaqKeyDefaultEncodeHtmlInJson   FaqKey = "DefaultEncodeHtmlInJson"
    FaqKeyDefaultWordLimit          FaqKey = "DefaultWordLimit"
    FaqKeyDefaultTransitionDensity  FaqKey = "DefaultTransitionDensity"
    FaqKeyDefaultKeywordMentions    FaqKey = "DefaultKeywordMentions"
    FaqKeyDefaultAreaMentions       FaqKey = "DefaultAreaMentions"
    FaqKeyDefaultMaxSentenceWords   FaqKey = "DefaultMaxSentenceWords"
    FaqKeyDefaultMaxParagraphWords  FaqKey = "DefaultMaxParagraphWords"
    FaqKeyDefaultEnableGSearch      FaqKey = "DefaultEnableGSearch"
    FaqKeyDefaultEnableSitemapLinking FaqKey = "DefaultEnableSitemapLinking"
    FaqKeyDefaultEnableYouTubeEmbed FaqKey = "DefaultEnableYouTubeEmbed"
    FaqKeySchemaTemplates           FaqKey = "SchemaTemplates"
    FaqKeyHtmlTemplates             FaqKey = "HtmlTemplates"
)
```

---

## Answer Writing Rules

### First Line Pattern

Every FAQ answer MUST:
1. Start with a direct answer to the question
2. Include company name and URL in first 2 sentences
3. Lead with company credibility

**Pattern:**
```
[Direct Answer]. {TransitionWord}, [supporting fact]. <strong><a href="{CompanyUrl}/">{CompanyName}</a></strong> [company benefit].
```

### Content Constraints

| Constraint | Requirement |
|------------|-------------|
| Sentence length | Maximum 18 words |
| Paragraph length | Maximum 180 words |
| Transition word density | Minimum 40% of sentences |
| Keyword appearances | Minimum 8 times |
| Area/location mentions | 3-4 times per answer |
| Sentence starts | No consecutive same-word starts |
| Hyphens | NEVER use hyphens |
| Paragraphs per answer | Exactly 3 (for schema) |

### Three-Paragraph Structure

**Paragraph 1 - Direct Answer + Company:**
- Answer question immediately
- Introduce company within first 2 sentences
- Include 2-3 internal links

**Paragraph 2 - Supporting Details:**
- Expand with specifics
- Compare alternatives (favor company approach)
- Include statistics and timeframes

**Paragraph 3 - Local Authority + CTA:**
- Reference local area/city
- Mention external authority sources
- End with implicit call-to-action

---

## HTML Structure

### FAQ Container (No `<p>` Tags Inside)

```html
<div class="paragraph-parent-block seo-parent-block seo-page-block center abstract-page-container abstract-page-faq-container">
  <div class="seo-faq-list seo-container-para contrast">
    <!-- Content flows directly - NO <p> tags -->
  </div>
</div>
```

### Individual FAQ Item

```html
<div class="faq-item">
  <details class="faq-detail-tab">
    <summary class="faq-summary-tab">
      <h3 title="[UNIQUE SEO TITLE ATTRIBUTE]">
        {Question}
      </h3>
      <i class="faq-icon-wrapper"><i class="faq-icon"></i></i>
    </summary>
    <div class="faq-content">
      <!-- Answer content with rich linking -->
    </div>
  </details>
</div>
```

### Link Patterns

**Company Link:**
```html
<strong title="[Company credential title]">
  <a href="{CompanyUrl}/" title="[Anchor title]">{CompanyName}</a>
</strong>
```

**Service Link:**
```html
<strong title="[Service benefit title]">
  <a href="{CompanyUrl}/{ServiceUrlSlug}-in-{AreaUrlSlug}/" title="[Anchor title]">{ServiceName}</a>
</strong>
```

**Location Link:**
```html
<em title="[Location benefit title]">
  <a href="{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/" title="[Anchor title]">{CityName}</a>
</em>
```

**External Link:**
```html
<a href="{ExternalUrl}" title="[Source title]" target="_blank" rel="nofollow">{SourceName}</a>
```

---

## Schema Structure

### JSON-LD Template

```html
<div id="faq-schema-markup-section" class="faq-schema-markup">
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[HTML-formatted answer with <p>, <a>, <strong> tags]"
      }
    }
  ]
}
  </script>
</div>
```

### Schema Rules

1. **Valid JSON** - Proper formatting, no trailing commas
2. **HTML in Text** - Use `<p>`, `<a>`, `<strong>` only
3. **Single Quotes** - Use `'` for HTML attributes inside JSON
4. **3 Paragraphs** - Each answer has exactly 3 `<p>` tags
5. **Company in `<strong>`** - Company name wrapped in paragraph 1

---

## GSearch Integration

When `EnableGSearch: true`:

1. **YouTube Video Search** - Find relevant FAQ videos
2. **Sitemap Indexing** - Index website for internal linking
3. **Semantic Matching** - Match keywords to existing URLs

### YouTube Embed Pattern

```html
<div class="faq-video-embed">
  <iframe 
    src="https://www.youtube.com/embed/{VideoId}" 
    title="{VideoTitle}"
    allowfullscreen>
  </iframe>
</div>
```

---

## Internal Linking Strategy

### URL Slug Patterns

| Link Type | URL Pattern |
|-----------|-------------|
| Service in Area | `{CompanyUrl}/{ServiceUrlSlug}-in-{AreaUrlSlug}/` |
| Service in City | `{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/` |
| Top Service | `{CompanyUrl}/top-{ServiceUrlSlug}-in-{AreaUrlSlug}/` |
| Cheapest Service | `{CompanyUrl}/{ServiceUrlSlug}-cheapest/` |
| Projects | `{CompanyUrl}/{ServiceUrlSlug}-projects-completed-{CityUrlSlug}` |

### Sitemap Linking

When `EnableSitemapLinking: true`:
1. Index sitemap to RAG
2. Match keywords to existing URLs
3. Generate 3-4 word slugs if no match found

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9541 | `ErrFaqTrainingFailed` | Training data ingestion failed |
| 9542 | `ErrFaqCompanyNotFound` | No training data for company |
| 9543 | `ErrFaqRagRetrievalFailed` | Failed to retrieve from RAG |
| 9544 | `ErrFaqGenerationFailed` | AI generation failed |
| 9545 | `ErrFaqSchemaInvalid` | Generated schema is invalid |
| 9546 | `ErrFaqOutputFormatUnsupported` | Requested format not supported |
| 9547 | `ErrFaqWordLimitExceeded` | Answer exceeds word limit |
| 9548 | `ErrFaqTransitionDensityLow` | Below minimum transition density |
| 9549 | `ErrFaqGsearchFailed` | GSearch integration failed |
| 9550 | `ErrFaqYoutubeSearchFailed` | YouTube search failed |
| 9551 | `ErrFaqSessionNotFound` | Session ID not found |
| 9552 | `ErrFaqFileDecodeFailed` | Base64 file decode failed |
| 9553 | `ErrFaqUrlFetchFailed` | Failed to fetch from URL |

---

## Complete Request Examples

### Minimal Training Request

```json
{
  "Company": "ACME Cleaning",
  "Website": "https://acme.com",
  "TrainingData": [
    {
      "Type": "text",
      "Content": "Company overview and FAQ training content here..."
    }
  ],
  "CompanyProfile": {
    "Name": "ACME Cleaning",
    "Url": "https://acme.com"
  },
  "Services": [
    {"Name": "House Cleaning"}
  ],
  "Location": {
    "Country": "Australia",
    "Cities": {
      "Sydney": ["Bondi", "Manly"]
    }
  }
}
```

### Full Training Request with File Upload

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "TrainingData": [
    {
      "Type": "file",
      "Content": "PGRpdiBjbGFzcz0iZmFxLXRyYWluaW5nIj4KICAgIDxoMj5Db21wYW55IE92ZXJ2aWV3PC9oMj4KICAgIDxwPkF0dG8gUHJvcGVydHkgaXMgYSBsZWFkaW5nLi4uPC9wPgo8L2Rpdj4=",
      "FileType": "html"
    },
    {
      "Type": "url",
      "Content": "https://attoproperty.com.au/about-us/"
    }
  ],
  "Keywords": ["carpet cleaning", "professional cleaning", "steam cleaning"],
  "Prompt": "Focus on eco-friendly methods and family safety",
  "CompanyProfile": {
    "Name": "Atto Property",
    "Tagline": "Melbourne's Trusted Cleaning Experts",
    "Description": "Full-service property maintenance and cleaning company",
    "Url": "https://attoproperty.com.au",
    "FoundedYear": "2023",
    "YearsOfExperience": "5",
    "CombinedExperience": "15",
    "ProjectsCompleted": "5647",
    "ClientsServed": "3000",
    "Certifications": ["IICRC Certified"],
    "Specialties": ["Eco-friendly", "Same-day service"]
  },
  "Services": [
    {"Name": "Carpet Cleaning"},
    {"Name": "Tile Cleaning"},
    {"Name": "Upholstery Cleaning"}
  ],
  "Location": {
    "Country": "Australia",
    "Region": "Victoria",
    "Cities": {
      "Melbourne CBD": ["Melton", "Caroline Springs", "Taylors Lakes"]
    }
  },
  "Ctas": [
    {"Type": "phone", "Text": "Call for a free quote!", "Priority": 1}
  ],
  "Variables": {
    "PriceRange": "$99-$299"
  }
}
```

### Generate with Prompt Modification

```json
{
  "Company": "atto-property",
  "Website": "https://attoproperty.com.au",
  "SessionId": "faq-sess-abc123",
  "Keywords": ["budget carpet cleaning", "affordable cleaning"],
  "Prompt": "Rewrite answers to focus on eco-friendly benefits. Mention our green certifications. Target young families concerned about chemical exposure.",
  "Content": {
    "Type": "text",
    "Data": "Q: How to clean a carpet on a budget?\nA: Use baking soda and vacuum regularly.\n\nQ: Is professional cleaning worth it?\nA: Yes, professionals have better equipment."
  },
  "OutputConfig": {
    "Format": "json",
    "IncludeSchema": true,
    "EncodeHtmlInJson": true
  }
}
```
