# Memory: features/ai-seo-paragraph-generation

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/22-ai-bridge-cli/01-backend/25-ai-seo-paragraph-generation.md`

---

## Overview

The AI SEO Paragraph Generation module creates SEO-optimized paragraph content with intelligent word counting (display text only), context-aware generation, famous quotation injection, and FAQ blending capabilities.

---

## Key Features

### Display Word Counting
Word count excludes HTML markup:
- HTML tags (`<p>`, `<strong>`, `<a>`)
- Attribute names and values (`title`, `href`, `class`)
- Punctuation marks

### Context-Aware Generation
Each paragraph receives context for coherent multi-paragraph output:
- Position (`intro`, `body`, `conclusion`, `cta`)
- Previous paragraph summary
- Section header and outline awareness

### Famous Quotations
Quotation sources (priority order):
1. Request passthrough
2. Preset JSON (`data/presets/seo/quotes/`)
3. Seedable DB (runtime configurable)
4. GSearch live lookup (fallback)

### FAQ Blending Modes
| Mode | Description |
|------|-------------|
| `inline` | Weave answers naturally in paragraph flow |
| `block` | Add styled Q&A section after paragraph |
| `disabled` | No FAQ blending (default) |

---

## Database Architecture

### Two-Level Split DB

| Level | Path | Purpose |
|-------|------|---------|
| Company Root | `data/{appName}/rag/seo/{company-slug}.db` | Para registry, training data |
| Individual Paragraph | `data/{appName}/rag/seo/paragraph/{company}/{seq}-{slug}.db` | Full paragraph content |

### Company Root Tables
- `ParaRegistry` - Registry of all paragraphs
- `TrainingChunks` - RAG chunks from training
- `CompanyProfile` - Shared company metadata

### Individual Paragraph DB Tables
- `ParaMeta` - Paragraph metadata
- `ParaContent` - Generated content (HTML, Markdown, Text)
- `ParaQuotations` - Quotations used
- `ParaLinks` - Links embedded
- `Revisions` - Version history
- `RevisionFeedback` - User feedback

---

## API Endpoints (RESTful Company-Scoped)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/seo/{company}/para` | List all generated paragraphs |
| GET | `/api/v1/seo/{company}/para/{id}` | Get single paragraph content |
| POST | `/api/v1/seo/{company}/para` | Generate new paragraph(s) |
| PUT | `/api/v1/seo/{company}/para/{id}` | Update/regenerate paragraph |
| DELETE | `/api/v1/seo/{company}/para/{id}` | Delete paragraph content |
| POST | `/api/v1/seo/{company}/para/train` | Train paragraph model |

> **Note:** Company is in URL path, not request body.

---

## Default Constraints

| Constraint | Default | Configurable |
|------------|---------|--------------|
| Words per paragraph | 120-180 | Yes |
| Words per sentence | 10-18 | Yes |
| Transition word start | 100% required | Yes |
| No consecutive same start | True | Yes |
| No hyphens | True | Yes |
| Links per paragraph | 2-3 | Yes |
| Quotations per paragraph | 0-1 | Yes |

---

## Header Requirements

Section headers MUST contain:
- **Service/Keyword** - Primary service
- **Company Name** - Naturally integrated
- **Location** - When applicable

---

## Error Codes (9561-9575)

| Code | Name |
|------|------|
| 9561 | PARA_TRAINING_FAILED |
| 9564 | PARA_GENERATION_FAILED |
| 9565 | PARA_WORD_LIMIT_EXCEEDED |
| 9568 | PARA_TRANSITION_MISSING |
| 9569 | PARA_CONSECUTIVE_START |

---

## Path Functions

```go
// Company root DB
paths.SeoCompanyDB(appName, companySlug)
// → data/myapp/rag/seo/atto-property.db

// Individual paragraph DB
paths.ParagraphDB(appName, company, seq, paraSlug)
// → data/myapp/rag/seo/paragraph/atto-property/001-intro-section.db

// Paragraph directory
paths.ParagraphDir(appName, company)
// → data/myapp/rag/seo/paragraph/atto-property/
```

---

## Related Files

- Spec: `25-ai-seo-paragraph-generation.md`
- Blog Spec: `27-ai-seo-blog-generation.md`
- DB Paths: `26-database-paths-reference.md`
- Config: `data/presets/seo/para/config.seed.para.json`
- Quotes: `data/presets/seo/quotes/`
- Transition Words: `data/presets/seo/faq/transition-words.json`
