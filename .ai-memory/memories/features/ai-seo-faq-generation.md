# Memory: features/ai-seo-faq-generation

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/22-ai-seo-faq-generation.md`

---

## Overview

The AI SEO FAQ Generation module creates SEO-optimized FAQ content with JSON-LD schema markup. It uses company-specific RAG training stored in Split DB with session-based chat continuation.

---

## Specification Files

| File | Purpose |
|------|---------|
| `22-ai-seo-faq-generation.md` | Main endpoint specification |
| `23-ai-seo-faq-go-structs.md` | Go structs for request/response |
| `24-ai-seo-faq-implementation-checklist.md` | 8-phase implementation guide |
| `data/presets/seo/faq/faq-html-spec.md` | HTML output specification |
| `data/presets/seo/faq/faq-schema-spec.md` | JSON-LD schema specification |
| `data/presets/seo/faq/samples/` | Sample training data |

---

## Split DB Pattern

```
data/{appName}/rag/seo/{company-slug}.db      # Company root (training, profile)

data/{appName}/rag/seo/faq/{company}/         # FAQ content folder
├── 001-{faq-slug}.db                         # Individual FAQ DB
├── 002-{faq-slug}.db
└── ...
```

### Company Root Tables
- `FaqRegistry` - Registry of all FAQ content
- `TrainingChunks` - RAG chunks from training
- `CompanyProfile` - Shared company metadata

### Individual FAQ DB Tables
- `FaqMeta` - FAQ metadata
- `FaqQuestions` - Question/answer pairs
- `FaqSchema` - JSON-LD schema
- `Revisions` - Version history
- `RevisionFeedback` - User feedback

> **Note:** FAQ, Paragraph, and Blog share the same company database for cross-content RAG.

---

## Key Design Decisions

### Company Name Format
- **Request**: Title Case (e.g., `"Atto Property"`)
- **URL Path**: Slug (e.g., `atto-property`)
- **File System**: Same slug for DB name

### Programmatic Field Derivation
Do NOT include in requests (auto-generated):
- `CompanySlug` → from URL path
- `NameLowercase` → from `Name`
- `NamePlural` → from `Name`
- `UrlSlug` → from `Name`

### Service Fields - AI Learning
Only `Name` is required for services. AI learns from training:
- `Action`, `Methods`, `Equipment`, `Benefits`, `Result` are all **optional**

### Location Format
Cities map with areas array:
```json
{
  "Country": "Australia",
  "Region": "Victoria",
  "Cities": {
    "Melbourne CBD": ["Melton", "Caroline Springs"],
    "Geelong": ["Lara", "Corio"]
  }
}
```

---

## API Endpoints (RESTful Company-Scoped)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/seo/{company}/faq` | List all FAQ sessions/content |
| GET | `/api/v1/seo/{company}/faq/{id}` | Get single FAQ content |
| POST | `/api/v1/seo/{company}/faq` | Generate new FAQ |
| PUT | `/api/v1/seo/{company}/faq/{id}` | Update/regenerate FAQ |
| DELETE | `/api/v1/seo/{company}/faq/{id}` | Delete FAQ content |
| POST | `/api/v1/seo/{company}/faq/train` | Train FAQ model |

> **Note:** Company is in URL path, not request body.

---

## TrainingData Types

`TrainingData` is an **array** of sources:

| Type | Content Format |
|------|----------------|
| `text` | Plain string |
| `file` | Base64 encoded (requires FileType: txt/md/html/json) |
| `url` | Valid URL to fetch |

---

## Content Writing Rules

| Constraint | Requirement |
|------------|-------------|
| Sentence length | Maximum 18 words |
| Paragraph length | Maximum 180 words |
| Transition word density | Minimum 40% of sentences |
| Keyword appearances | Minimum 8 times |
| Area mentions | 3-4 times per answer |
| Hyphens | NEVER use (e.g., "budget friendly" not "budget-friendly") |
| Paragraphs per answer | Exactly 3 (for schema) |
| Answer first | Direct answer in first sentence |
| Company mention | In first 2 sentences |

---

## Implementation Phases

See `24-ai-seo-faq-implementation-checklist.md`:

| Phase | Name | Duration |
|-------|------|----------|
| 1 | Core Infrastructure | 2-3 days |
| 2 | Training System | 2-3 days |
| 3 | Generation Engine | 3-4 days |
| 4 | Session Management | 1-2 days |
| 5 | Route DB Exploration | 1 day |
| 6 | Output Formatting | 2 days |
| 7 | Error Handling | 1-2 days |
| 8 | Frontend Integration | 2-3 days |

---

## JSON Tag Convention

Go structs use simplified tags:
- Required fields: No tag (PascalCase auto-serialized)
- Optional fields: `json:",omitempty"` only
- Exception: JSON-LD schema fields use lowercase per spec

---

## Error Codes (9541-9553)

| Code | Name | Retryable |
|------|------|-----------|
| 9541 | FAQ_TRAINING_FAILED | Yes |
| 9542 | FAQ_COMPANY_NOT_FOUND | No |
| 9543 | FAQ_RAG_RETRIEVAL_FAILED | Yes |
| 9544 | FAQ_GENERATION_FAILED | Yes |
| 9545 | FAQ_SCHEMA_INVALID | No |
| 9546 | FAQ_OUTPUT_FORMAT_UNSUPPORTED | No |
| 9547 | FAQ_WORD_LIMIT_EXCEEDED | No |
| 9548 | FAQ_TRANSITION_DENSITY_LOW | No |
| 9549 | FAQ_GSEARCH_FAILED | Yes |
| 9550 | FAQ_YOUTUBE_SEARCH_FAILED | Yes |
| 9551 | FAQ_SESSION_NOT_FOUND | No |
| 9552 | FAQ_FILE_DECODE_FAILED | No |
| 9553 | FAQ_URL_FETCH_FAILED | Yes |

---

## Path Functions

```go
// Company root DB
paths.SeoCompanyDB(appName, companySlug)
// → data/myapp/rag/seo/atto-property.db

// Individual FAQ DB
paths.FaqDB(appName, company, seq, faqSlug)
// → data/myapp/rag/seo/faq/atto-property/001-cleaning-faq.db

// FAQ directory
paths.FaqDir(appName, company)
// → data/myapp/rag/seo/faq/atto-property/
```

---

## Go Structs Reference

See `23-ai-seo-faq-go-structs.md` for:
- `FaqTrainRequest` / `FaqTrainResponse` (with SessionId)
- `FaqGenerateRequest` / `FaqGenerateResponse`
- `FaqService` (only Name required, rest optional)
- `FaqLocation` (Cities map format)
- `FaqCta` for call-to-action templates
- `FaqCompanyRegistry` / `FaqSessionRegistry` for Route DB
- `FaqSession` with Title field for display
- `FaqKey` typed constants

---

## Sample Training Data

Located in `data/presets/seo/faq/samples/`:
- `carpet-cleaning-training.json` - Full training request example
- `carpet-cleaning-questions.json` - FAQ question patterns with variables
