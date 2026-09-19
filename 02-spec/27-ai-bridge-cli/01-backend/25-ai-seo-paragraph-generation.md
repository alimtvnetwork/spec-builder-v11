# AI SEO Paragraph Generation Endpoint

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

The Paragraph Generation endpoint creates SEO-optimized paragraph content for websites. Unlike FAQ generation, this focuses on single or multiple paragraphs with configurable word counts and link density. Word counts are based on **display text only** (HTML tags and attributes are excluded).

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
            │   ├── ParaTrainingChunks             # RAG chunks from training
            │   ├── ParaSessions                   # Paragraph session registry
            │   └── CompanyProfile                 # Shared company metadata
            └── paragraph/
                └── {company}/
                    └── {seq}-{slug}.db            # Individual paragraph content
                        └── ParaGeneratedContent   # Generated paragraph history
```

> **Note:** See `26-database-paths-reference.md` for complete path definitions. Company root DB stores training data, individual content DBs store generated paragraphs.

### Flow

```
Training Request → RAG Ingestion → Unified SEO DB
                        ↓
Generate Request → RAG Retrieval → AI Generation → Word Count Validation → Output
```

---

## API Endpoints

All Paragraph endpoints follow the RESTful company-scoped pattern.

### Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/{company}/para` | List all generated paragraphs |
| GET | `/api/v1/seo/{company}/para/{id}` | Get single paragraph content |
| POST | `/api/v1/seo/{company}/para` | Generate new paragraph(s) |
| PUT | `/api/v1/seo/{company}/para/{id}` | Update/regenerate paragraph |
| DELETE | `/api/v1/seo/{company}/para/{id}` | Delete paragraph content |
| POST | `/api/v1/seo/{company}/para/train` | Train paragraph model |

> **Note:** `{company}` is the company slug (e.g., `atto-property`). `{id}` is the paragraph ID.

---

### 1. List Paragraphs

**GET** `/api/v1/seo/{company}/para`

Lists all generated paragraph content for a company.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Results per page (max 100) |
| `type` | string | - | Filter by content type |
| `keyword` | string | - | Filter by keyword |

#### Response

```json
{
  "Success": true,
  "Paragraphs": [
    {
      "ParaId": "para-001",
      "ContentType": "service-description",
      "Keywords": ["carpet cleaning", "steam cleaning"],
      "Areas": ["Melton"],
      "WordCount": 165,
      "ParagraphCount": 3,
      "CreatedAt": "2026-02-02T10:00:00Z"
    }
  ],
  "Pagination": {
    "Page": 1,
    "Limit": 20,
    "TotalItems": 120,
    "TotalPages": 6
  }
}
```

---

### 2. Get Single Paragraph

**GET** `/api/v1/seo/{company}/para/{id}`

Retrieves full paragraph content by ID.

#### Response

```json
{
  "Success": true,
  "Paragraph": {
    "ParaId": "para-001",
    "ContentType": "service-description",
    "Content": {
      "Html": "<p>Professional <strong>carpet cleaning</strong>...</p>",
      "Markdown": "Professional **carpet cleaning**...",
      "Text": "Professional carpet cleaning..."
    },
    "Keywords": ["carpet cleaning", "steam cleaning"],
    "Areas": ["Melton"],
    "Metadata": {
      "WordCount": 165,
      "ParagraphCount": 3,
      "TransitionDensity": 100,
      "LinksUsed": 4
    },
    "CreatedAt": "2026-02-02T10:00:00Z"
  }
}
```

---

### 3. Generate Paragraph

**POST** `/api/v1/seo/{company}/para`

Generates paragraph content based on training and configuration.

#### Request Body

```json
{
  "Keywords": ["carpet cleaning", "steam cleaning"],
  "Areas": ["Melton", "Caroline Springs"],
  "ContentType": "service-description",
  "Prompt": "Write about the benefits of professional steam cleaning for families with pets",
  "OutputConfig": {
    "Format": "html",
    "ParagraphCount": 3,
    "WordsPerParagraph": {
      "Min": 120,
      "Max": 180
    },
    "WordsPerSentence": {
      "Min": 10,
      "Max": 18
    },
    "TotalWordLimit": 500
  },
  "LinkConfig": {
    "LinksPerParagraph": {
      "Min": 2,
      "Max": 3
    },
    "EnableSitemapLinking": true,
    "EnableSlugGeneration": true,
    "SitemapUrl": "https://attoproperty.com.au/sitemap.xml",
    "SlugWordCount": 4
  },
  "ValidationConfig": {
    "TransitionWordRequired": true,
    "NoConsecutiveSameStart": true,
    "NoHyphens": true,
    "MinTransitionDensity": 100
  }
}
```

> **Note:** Company is derived from URL path, not request body.

#### Response

```json
{
  "Success": true,
  "ParaId": "para-002",
  "GeneratedAt": "2026-02-02T10:30:00Z",
  "Content": {
    "Html": "<p>Professional <strong><a href='...' title='...'>steam cleaning</a></strong> removes allergens...</p>",
    "Text": "Professional steam cleaning removes allergens...",
    "Markdown": "Professional **steam cleaning** removes allergens..."
  },
  "Paragraphs": [
    {
      "Index": 1,
      "Html": "<p>...</p>",
      "Text": "...",
      "Metadata": {
        "DisplayWordCount": 145,
        "SentenceCount": 8,
        "TransitionWordCount": 8,
        "TransitionDensity": 100,
        "LinksUsed": 3
      }
    }
  ],
  "Metadata": {
    "TotalDisplayWords": 435,
    "TotalSentences": 24,
    "TotalLinks": 9,
    "ValidationPassed": true
  }
}
```

---

### 4. Update Paragraph

**PUT** `/api/v1/seo/{company}/para/{id}`

Updates or regenerates an existing paragraph.

#### Request Body

```json
{
  "Regenerate": true,
  "Prompt": "Add more focus on eco-friendly methods",
  "OutputConfig": {
    "Format": "html",
    "ParagraphCount": 3
  }
}
```

#### Response

```json
{
  "Success": true,
  "ParaId": "para-001",
  "Message": "Paragraph regenerated successfully",
  "UpdatedAt": "2026-02-02T11:00:00Z"
}
```

---

### 5. Delete Paragraph

**DELETE** `/api/v1/seo/{company}/para/{id}`

Deletes a paragraph entry.

#### Response

```json
{
  "Success": true,
  "Message": "Paragraph deleted successfully",
  "DeletedPara": {
    "ParaId": "para-001",
    "ContentType": "service-description"
  }
}
```

---

### 6. Training Endpoint

**POST** `/api/v1/seo/{company}/para/train`

Ingests training data for company-specific paragraph generation.

#### Request Body

```json
{
  "Website": "https://attoproperty.com.au",
  "TrainingData": [
    {
      "Type": "text",
      "Content": "Sample paragraphs and writing style examples..."
    },
    {
      "Type": "file",
      "Content": "base64-encoded-md-file",
      "FileType": "md"
    }
  ],
  "Keywords": ["carpet cleaning", "professional cleaning"],
  "SampleHtml": "<p><strong><a href='...'>Carpet Cleaning</a></strong> in Melton...</p>",
  "WritingStyle": {
    "Tone": "professional",
    "Formality": "formal",
    "Industry": "cleaning"
  }
}
```

> **Note:** Company slug is derived from URL path.

#### Response

```json
{
  "Success": true,
  "SessionId": "para-sess-abc123",
  "Message": "Training data ingested successfully",
  "RagStats": {
    "ChunksCreated": 28,
    "TokensProcessed": 8500,
    "DbPath": "data/myapp/rag/seo/atto-property.db"
  }
}
```

---

### 2. Generate Endpoint

**POST** `/api/v1/seo/para/generate`

Generates paragraph content based on training and configuration.

#### Request Body

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "Keywords": ["carpet cleaning", "steam cleaning"],
  "Areas": ["Melton", "Caroline Springs"],
  "ContentType": "service-description",
  "Prompt": "Write about the benefits of professional steam cleaning for families with pets",
  "OutputConfig": {
    "Format": "html",
    "ParagraphCount": 3,
    "WordsPerParagraph": {
      "Min": 120,
      "Max": 180
    },
    "WordsPerSentence": {
      "Min": 10,
      "Max": 18
    },
    "TotalWordLimit": 500
  },
  "LinkConfig": {
    "LinksPerParagraph": {
      "Min": 2,
      "Max": 3
    },
    "EnableSitemapLinking": true,
    "EnableSlugGeneration": true,
    "SitemapUrl": "https://attoproperty.com.au/sitemap.xml",
    "SlugWordCount": 4
  },
  "ValidationConfig": {
    "TransitionWordRequired": true,
    "NoConsecutiveSameStart": true,
    "NoHyphens": true,
    "MinTransitionDensity": 100
  }
}
```

#### Content Types

| Type | Description | Typical Length |
|------|-------------|----------------|
| `service-description` | Main service page content | 3-5 paragraphs |
| `area-page` | Location-specific content | 2-4 paragraphs |
| `category-description` | Category overview | 2-3 paragraphs |
| `blog-intro` | Blog post introduction | 1-2 paragraphs |
| `about-section` | About page content | 3-4 paragraphs |
| `cta-block` | Call-to-action content | 1 paragraph |
| `custom` | Custom format | Configurable |

#### Response

```json
{
  "Success": true,
  "GeneratedAt": "2026-02-02T10:30:00Z",
  "Company": "Atto Property",
  "Content": {
    "Html": "<p>Professional <strong><a href='...' title='...'>steam cleaning</a></strong> removes allergens...</p>",
    "Text": "Professional steam cleaning removes allergens...",
    "Markdown": "Professional **steam cleaning** removes allergens..."
  },
  "Paragraphs": [
    {
      "Index": 1,
      "Html": "<p>...</p>",
      "Text": "...",
      "Metadata": {
        "DisplayWordCount": 145,
        "SentenceCount": 8,
        "TransitionWordCount": 8,
        "TransitionDensity": 100,
        "LinksUsed": 3,
        "KeywordCount": 4,
        "AreaMentions": 2
      }
    }
  ],
  "Metadata": {
    "TotalDisplayWords": 435,
    "TotalSentences": 24,
    "TotalLinks": 9,
    "AverageWordsPerParagraph": 145,
    "AverageWordsPerSentence": 18,
    "TransitionDensity": 100,
    "ValidationPassed": true
  }
}
```

---

## Configuration

### Seedable Settings

**File:** `config.seed.para.json`

```json
{
  "Para": {
    "DefaultOutputFormat": "html",
    "DefaultParagraphCount": 3,
    "DefaultWordsPerParagraphMin": 120,
    "DefaultWordsPerParagraphMax": 180,
    "DefaultWordsPerSentenceMin": 10,
    "DefaultWordsPerSentenceMax": 18,
    "DefaultLinksPerParagraphMin": 2,
    "DefaultLinksPerParagraphMax": 3,
    "DefaultEnableSitemapLinking": true,
    "DefaultEnableSlugGeneration": true,
    "DefaultSlugWordCount": 4,
    "DefaultTransitionWordRequired": true,
    "DefaultNoConsecutiveSameStart": true,
    "DefaultNoHyphens": true,
    "DefaultMinTransitionDensity": 100,
    "ContentTypeDefaults": {
      "service-description": {
        "ParagraphCount": 4,
        "WordsPerParagraph": {"Min": 150, "Max": 180}
      },
      "area-page": {
        "ParagraphCount": 3,
        "WordsPerParagraph": {"Min": 120, "Max": 160}
      },
      "cta-block": {
        "ParagraphCount": 1,
        "WordsPerParagraph": {"Min": 80, "Max": 120}
      }
    }
  }
}
```

### Typed Constants

```go
// Para Key Constants
type ParaKey string
const (
    ParaKeyDefaultOutputFormat           ParaKey = "DefaultOutputFormat"
    ParaKeyDefaultParagraphCount         ParaKey = "DefaultParagraphCount"
    ParaKeyDefaultWordsPerParagraphMin   ParaKey = "DefaultWordsPerParagraphMin"
    ParaKeyDefaultWordsPerParagraphMax   ParaKey = "DefaultWordsPerParagraphMax"
    ParaKeyDefaultWordsPerSentenceMin    ParaKey = "DefaultWordsPerSentenceMin"
    ParaKeyDefaultWordsPerSentenceMax    ParaKey = "DefaultWordsPerSentenceMax"
    ParaKeyDefaultLinksPerParagraphMin   ParaKey = "DefaultLinksPerParagraphMin"
    ParaKeyDefaultLinksPerParagraphMax   ParaKey = "DefaultLinksPerParagraphMax"
    ParaKeyDefaultEnableSitemapLinking   ParaKey = "DefaultEnableSitemapLinking"
    ParaKeyDefaultEnableSlugGeneration   ParaKey = "DefaultEnableSlugGeneration"
    ParaKeyDefaultSlugWordCount          ParaKey = "DefaultSlugWordCount"
    ParaKeyDefaultTransitionWordRequired ParaKey = "DefaultTransitionWordRequired"
    ParaKeyDefaultNoConsecutiveSameStart ParaKey = "DefaultNoConsecutiveSameStart"
    ParaKeyDefaultNoHyphens              ParaKey = "DefaultNoHyphens"
    ParaKeyDefaultMinTransitionDensity   ParaKey = "DefaultMinTransitionDensity"
)
```

---

## Writing Constraints

### Sentence Rules

| Constraint | Default | Configurable |
|------------|---------|--------------|
| Words per sentence | 10-18 | Yes |
| Transition word start | Required (100%) | Yes |
| No consecutive same start | True | Yes |
| No hyphens | True | Yes |

### Paragraph Rules

| Constraint | Default | Configurable |
|------------|---------|--------------|
| Words per paragraph | 120-180 | Yes |
| Links per paragraph | 2-3 | Yes |
| Keyword mentions | 2-3 | Yes |
| Area mentions | 1-2 | Yes |

### Link Rules

| Rule | Description |
|------|-------------|
| Sitemap linking | Match keywords to existing URLs via GSearch |
| Slug generation | Create 3-4 word slugs if no sitemap match |
| Link wrapping | Use `<strong>` for service links, `<em>` for locations |
| Title attributes | Unique SEO-rich titles on all links |

---

## Word Count Algorithm

```go
// CountDisplayWords returns word count excluding HTML markup
func CountDisplayWords(html string) int {
    // 1. Remove all HTML tags
    text := stripTags(html)
    
    // 2. Remove punctuation (periods, commas, etc.)
    text = removePunctuation(text)
    
    // 3. Normalize whitespace
    text = normalizeWhitespace(text)
    
    // 4. Split and count non-empty words
    words := strings.Fields(text)
    return len(words)
}

// stripTags removes HTML tags and their attributes
func stripTags(html string) string {
    // Regex to match <tag attributes>content</tag>
    // Returns only content between tags
}
```

### Examples

| HTML | Display Words | Count |
|------|---------------|-------|
| `<p>Hello world</p>` | "Hello world" | 2 |
| `<strong title="SEO text">Hello</strong>` | "Hello" | 1 |
| `<a href="url" title="long title">Click here</a>` | "Click here" | 2 |
| `<p>First sentence. Second sentence.</p>` | "First sentence Second sentence" | 4 |

---

## Transition Word Enforcement

Every sentence MUST start with a transition word:

```
✅ Furthermore, professional cleaning removes deep-seated dirt.
✅ Moreover, steam cleaning sanitizes without chemicals.
✅ Additionally, trained technicians ensure thorough coverage.

❌ Professional cleaning removes deep-seated dirt.
❌ Steam cleaning sanitizes without chemicals.
```

### Validation

```go
// ValidateTransitionStart checks if sentence starts with transition word
func ValidateTransitionStart(sentence string, transitions []string) bool {
    firstWord := extractFirstWord(sentence)
    for _, t := range transitions {
        if strings.EqualFold(firstWord, t) {
            return true
        }
    }
    return false
}
```

---

## Link Generation

### Sitemap Linking (via GSearch)

When `EnableSitemapLinking: true`:

1. Index sitemap to RAG
2. Match keywords to existing URLs
3. Use existing page if match found

```json
{
  "Keyword": "carpet cleaning",
  "MatchedUrl": "https://example.com/carpet-cleaning-melbourne/",
  "Confidence": 0.92
}
```

### Slug Generation

When no sitemap match or `EnableSlugGeneration: true`:

```go
// GenerateSlug creates a 3-4 word URL slug
func GenerateSlug(keywords []string, area string, slugWordCount int) string {
    // Examples:
    // "carpet-cleaning-in-melton"
    // "professional-steam-cleaning-melbourne"
    // "affordable-tile-cleaning-service"
}
```

### Link Patterns

| Pattern | Example |
|---------|---------|
| Service in Area | `{CompanyUrl}/{service}-in-{area}/` |
| Service in City | `{CompanyUrl}/{service}-in-{city}/` |
| Top Service | `{CompanyUrl}/top-{service}-in-{area}/` |
| Service Details | `{CompanyUrl}/{service}-service-{area}/` |

---

## Error Codes (9561-9575)

| Code | Name | Description |
|------|------|-------------|
| 9561 | `ErrParaTrainingFailed` | Training data ingestion failed |
| 9562 | `ErrParaCompanyNotFound` | No training data for company |
| 9563 | `ErrParaRagRetrievalFailed` | Failed to retrieve from RAG |
| 9564 | `ErrParaGenerationFailed` | AI generation failed |
| 9565 | `ErrParaWordLimitExceeded` | Paragraph exceeds word limit |
| 9566 | `ErrParaWordLimitBelow` | Paragraph below minimum words |
| 9567 | `ErrParaSentenceTooLong` | Sentence exceeds word limit |
| 9568 | `ErrParaTransitionMissing` | Sentence missing transition word |
| 9569 | `ErrParaConsecutiveStart` | Consecutive sentences same start |
| 9570 | `ErrParaHyphenDetected` | Hyphen found in content |
| 9571 | `ErrParaLinkCountLow` | Below minimum links per paragraph |
| 9572 | `ErrParaSitemapFailed` | Sitemap fetch/parse failed |
| 9573 | `ErrParaSlugGenerationFailed` | Slug generation failed |
| 9574 | `ErrParaOutputFormatUnsupported` | Requested format not supported |
| 9575 | `ErrParaContentTypeUnknown` | Unknown content type |

---

## Request Examples

### Minimal Request

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "Keywords": ["carpet cleaning"],
  "Areas": ["Melton"],
  "ContentType": "service-description",
  "Prompt": "Write about carpet cleaning benefits"
}
```

### Full Request with Overrides

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "Keywords": ["steam cleaning", "carpet sanitization", "allergen removal"],
  "Areas": ["Melton", "Caroline Springs", "Taylors Lakes"],
  "ContentType": "service-description",
  "Prompt": "Write compelling content about eco-friendly steam cleaning for families with young children and pets. Emphasize safety and effectiveness.",
  "OutputConfig": {
    "Format": "html",
    "ParagraphCount": 4,
    "WordsPerParagraph": {"Min": 150, "Max": 180},
    "WordsPerSentence": {"Min": 12, "Max": 16},
    "TotalWordLimit": 700
  },
  "LinkConfig": {
    "LinksPerParagraph": {"Min": 3, "Max": 4},
    "EnableSitemapLinking": true,
    "EnableSlugGeneration": true,
    "SitemapUrl": "https://attoproperty.com.au/sitemap.xml",
    "SlugWordCount": 4
  },
  "ValidationConfig": {
    "TransitionWordRequired": true,
    "NoConsecutiveSameStart": true,
    "NoHyphens": true,
    "MinTransitionDensity": 100
  }
}
```

---

## Output Formats

### HTML Output

```html
<p>
  Furthermore, professional 
  <strong title="Melbourne steam cleaning experts">
    <a href="https://attoproperty.com.au/steam-cleaning-in-melton/" 
       title="Melton steam cleaning services">
      steam cleaning
    </a>
  </strong> 
  removes embedded allergens that regular vacuuming cannot reach. 
  Moreover, high temperature extraction eliminates bacteria and dust mites completely. 
  Additionally, 
  <em title="Local Melton cleaning specialists">
    <a href="https://attoproperty.com.au/carpet-cleaning-melton/">
      Melton families
    </a>
  </em> 
  appreciate chemical free methods safe for children and pets.
</p>
```

### Text Output

```
Furthermore, professional steam cleaning removes embedded allergens that regular vacuuming cannot reach. Moreover, high temperature extraction eliminates bacteria and dust mites completely. Additionally, Melton families appreciate chemical free methods safe for children and pets.
```

### Markdown Output

```markdown
Furthermore, professional **[steam cleaning](https://attoproperty.com.au/steam-cleaning-in-melton/)** removes embedded allergens that regular vacuuming cannot reach. Moreover, high temperature extraction eliminates bacteria and dust mites completely. Additionally, *[Melton families](https://attoproperty.com.au/carpet-cleaning-melton/)* appreciate chemical free methods safe for children and pets.
```

---

## Context-Aware Generation

### Paragraph Context

Each paragraph request can include context for coherent multi-paragraph generation:

```json
{
  "Context": {
    "Position": "body",
    "PreviousParagraph": "Summary of what was written before...",
    "NextIntent": "Will discuss pricing next",
    "SectionHeader": "Why Choose Professional Steam Cleaning",
    "Outline": ["Introduction", "Benefits", "Process", "Pricing", "CTA"],
    "CurrentSection": 2
  }
}
```

| Field | Description |
|-------|-------------|
| `Position` | `intro`, `body`, `conclusion`, `cta` - affects tone and structure |
| `PreviousParagraph` | Summary for coherence with prior content |
| `NextIntent` | What follows - for smooth transitions |
| `SectionHeader` | Current section heading (include service + keyword + company) |
| `Outline` | Full outline array for context awareness |
| `CurrentSection` | Index of current section being written |

---

## Famous Quotations

### Quotation Sources (Priority Order)

1. **Request Passthrough** - Quotes passed directly in request
2. **Preset JSON** - Industry-specific quotes from `data/presets/seo/quotes/{industry}.json`
3. **Seedable DB** - Curated quotes seeded via config and updatable at runtime
4. **GSearch Live** - Real-time lookup for relevant quotes (fallback)

### Quotation Configuration

```json
{
  "QuotationConfig": {
    "EnableQuotations": true,
    "QuotesPerParagraph": 1,
    "RequireExternalLink": true,
    "Source": "auto",
    "FallbackToGSearch": true,
    "PassedQuotes": [
      {
        "Text": "Quality is not an act, it is a habit.",
        "Author": "Aristotle",
        "ExternalUrl": "https://en.wikipedia.org/wiki/Aristotle",
        "RelevantTopics": ["quality", "service", "professionalism"]
      }
    ]
  }
}
```

### Quotation Format in Output

```html
<p>
  Furthermore, maintaining clean carpets requires consistent effort. 
  <em class="quote-block">
    <span class="quote-text">"Quality is not an act, it is a habit."</span>
    <span class="quote-attribution">
      — <a href="https://en.wikipedia.org/wiki/Aristotle" 
           target="_blank" 
           rel="noopener noreferrer"
           title="Learn more about Aristotle">Aristotle</a>
    </span>
  </em>
  Moreover, professional carpet cleaning embodies this philosophy through systematic maintenance.
</p>
```

### Seedable Quotes Config

**File:** `config.seed.quotes.json`

```json
{
  "Quotes": {
    "General": [
      {
        "Text": "Quality is not an act, it is a habit.",
        "Author": "Aristotle",
        "ExternalUrl": "https://en.wikipedia.org/wiki/Aristotle",
        "RelevantTopics": ["quality", "service", "professionalism"]
      },
      {
        "Text": "The bitterness of poor quality remains long after the sweetness of low price is forgotten.",
        "Author": "Benjamin Franklin",
        "ExternalUrl": "https://en.wikipedia.org/wiki/Benjamin_Franklin",
        "RelevantTopics": ["quality", "value", "pricing"]
      }
    ],
    "Cleaning": [
      {
        "Text": "Cleanliness is next to godliness.",
        "Author": "John Wesley",
        "ExternalUrl": "https://en.wikipedia.org/wiki/John_Wesley",
        "RelevantTopics": ["cleanliness", "hygiene", "maintenance"]
      }
    ],
    "Home": [
      {
        "Text": "Home is where the heart is.",
        "Author": "Pliny the Elder",
        "ExternalUrl": "https://en.wikipedia.org/wiki/Pliny_the_Elder",
        "RelevantTopics": ["home", "family", "comfort"]
      }
    ]
  }
}
```

---

## FAQ Blending

### Blending Modes

| Mode | Description |
|------|-------------|
| `inline` | Weave FAQ answers naturally within paragraph flow |
| `block` | Add styled Q&A block after main paragraph |
| `disabled` | No FAQ blending (default) |

### FAQ Blending Configuration

```json
{
  "FaqBlendConfig": {
    "Mode": "inline",
    "MaxFaqsPerParagraph": 1,
    "SourceSessionId": "faq-sess-abc123",
    "RelevantQuestions": ["How often should I clean my carpet?"],
    "BlendStyle": "natural"
  }
}
```

### Inline Blending Example

```html
<p>
  Furthermore, professional steam cleaning removes deep-seated allergens. 
  Many homeowners wonder how often they should clean their carpets. 
  <span class="faq-inline">
    Experts recommend professional cleaning every 12-18 months for optimal hygiene.
  </span>
  Moreover, families with pets benefit from more frequent maintenance schedules.
</p>
```

### Block Blending Example

```html
<p>
  Furthermore, professional steam cleaning removes deep-seated allergens...
</p>
<div class="faq-inline-block">
  <p class="faq-question">
    <strong>Q: How often should I clean my carpet?</strong>
  </p>
  <p class="faq-answer">
    Experts recommend professional cleaning every 12-18 months for optimal hygiene.
  </p>
</div>
```

---

## Header Requirements

When generating content with section headers, each header MUST contain:

1. **Service/Keyword** - Primary service being discussed
2. **Company Name** - Company name naturally integrated
3. **Location** (when applicable) - Service area reference

### Header Examples

```
✅ "Professional Steam Cleaning by Atto Property in Melton"
✅ "Why Melton Families Choose Atto Property for Carpet Care"
✅ "Atto Property's Eco-Friendly Tile Cleaning Process"

❌ "Steam Cleaning" (missing company, location)
❌ "Our Services" (generic, missing keywords)
❌ "About Us" (not SEO optimized)
```

### Header Configuration

```json
{
  "HeaderConfig": {
    "IncludeService": true,
    "IncludeCompany": true,
    "IncludeLocation": true,
    "HeaderLevel": 2,
    "MaxHeaderWords": 12
  }
}
```

---

## Extended Request Schema

### Full Request with All Features

```json
{
  "Company": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "Keywords": ["steam cleaning", "carpet sanitization"],
  "Areas": ["Melton", "Caroline Springs"],
  "ContentType": "service-description",
  "Prompt": "Write about eco-friendly steam cleaning benefits",
  
  "Context": {
    "Position": "body",
    "PreviousParagraph": "Introduction covered why cleaning matters...",
    "SectionHeader": "Benefits of Professional Steam Cleaning",
    "Outline": ["Intro", "Benefits", "Process", "Pricing", "CTA"],
    "CurrentSection": 2
  },
  
  "OutputConfig": {
    "Format": "html",
    "ParagraphCount": 3,
    "WordsPerParagraph": {"Min": 120, "Max": 180},
    "WordsPerSentence": {"Min": 10, "Max": 18}
  },
  
  "LinkConfig": {
    "LinksPerParagraph": {"Min": 2, "Max": 3},
    "EnableSitemapLinking": true,
    "EnableSlugGeneration": true,
    "SitemapUrl": "https://attoproperty.com.au/sitemap.xml"
  },
  
  "QuotationConfig": {
    "EnableQuotations": true,
    "QuotesPerParagraph": 1,
    "RequireExternalLink": true,
    "Source": "auto",
    "PassedQuotes": []
  },
  
  "FaqBlendConfig": {
    "Mode": "inline",
    "MaxFaqsPerParagraph": 1,
    "SourceSessionId": "faq-sess-abc123"
  },
  
  "HeaderConfig": {
    "IncludeService": true,
    "IncludeCompany": true,
    "IncludeLocation": true
  },
  
  "ValidationConfig": {
    "TransitionWordRequired": true,
    "NoConsecutiveSameStart": true,
    "NoHyphens": true
  }
}
```

---

## Extended Response Schema

```json
{
  "Success": true,
  "GeneratedAt": "2026-02-02T10:30:00Z",
  "Company": "Atto Property",
  "Content": {
    "Html": "<h2>...</h2><p>...</p>",
    "Text": "...",
    "Markdown": "..."
  },
  "Paragraphs": [
    {
      "Index": 1,
      "Header": "Benefits of Professional Steam Cleaning by Atto Property",
      "Html": "<p>...</p>",
      "Metadata": {
        "DisplayWordCount": 145,
        "SentenceCount": 8,
        "TransitionDensity": 100,
        "LinksUsed": 3,
        "QuotationsUsed": 1,
        "FaqsBlended": 1
      }
    }
  ],
  "Quotations": [
    {
      "Text": "Quality is not an act, it is a habit.",
      "Author": "Aristotle",
      "ExternalUrl": "https://en.wikipedia.org/wiki/Aristotle",
      "ParagraphIndex": 1
    }
  ],
  "BlendedFaqs": [
    {
      "Question": "How often should I clean my carpet?",
      "ParagraphIndex": 2,
      "BlendMode": "inline"
    }
  ],
  "Metadata": {
    "TotalDisplayWords": 435,
    "ValidationPassed": true
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| FAQ Generation | `./22-ai-seo-faq-generation.md` |
| Blog Post Generation | `./27-ai-seo-blog-generation.md` |
| Database Paths | `./26-database-paths-reference.md` |
| Error Codes | `./16-ai-seo-error-codes.md` |
| Transition Words | `data/presets/seo/faq/transition-words.json` |
| Quotes Preset | `data/presets/seo/quotes/` |
| Seedable Config | `data/presets/seo/para/config.seed.para.json` |
