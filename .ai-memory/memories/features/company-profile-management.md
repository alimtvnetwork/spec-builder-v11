# Memory: features/company-profile-management

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/28-company-profile-management.md`

---

## Overview

The Company Profile module provides comprehensive company management including creation, multi-CTA support, reference article processing, and writing style analysis for SEO content generation.

---

## Key Features

### Multi-CTA Support
- **Types**: `url`, `phone`, `email`, `whatsapp`, `form`, `booking`
- **Storage**: Normalized table (not JSON) for searchability
- **Auto-formatting**: Raw → Display → Link values generated automatically
- **Weighted Random**: `GET /ctas/random` selects CTA weighted by priority

### Reference Article Training
- URLs extracted via GSearch with multi-format output
- 5-day cache TTL with force refresh option
- Full writing style analysis on extraction

### Writing Style Analysis
Metrics extracted from reference articles:
- Sentence/paragraph length statistics
- Formality score (0.0-1.0)
- Readability score (Flesch-Kincaid)
- Transition word rate
- Voice/tense patterns
- Common phrases and sentence starters

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/seo/companies` | List all companies |
| POST | `/api/v1/seo/companies` | Create company (with AutoCrawl flag) |
| PUT | `/api/v1/seo/{company}` | Update company profile |
| DELETE | `/api/v1/seo/{company}` | Delete company and all data |
| GET | `/api/v1/seo/{company}/ctas` | List CTAs |
| POST | `/api/v1/seo/{company}/ctas` | Add CTA |
| GET | `/api/v1/seo/{company}/ctas/random` | Get random active CTA |
| POST | `/api/v1/seo/{company}/articles` | Add reference article |
| GET | `/api/v1/seo/{company}/style` | Get writing style metrics |

---

## Database Tables (Normalized)

All stored in `data/{appName}/rag/seo/{company-slug}.db`:

| Table | Purpose |
|-------|---------|
| `CompanyProfile` | Core company metadata |
| `CompanyCtas` | Multiple CTA entries |
| `CompanyServices` | Services offered |
| `CompanyLocations` | Service areas |
| `CompanyKeywords` | Target keywords |
| `CompanyReferenceArticles` | Style training sources |
| `CompanyWritingStyle` | Extracted style metrics |

---

## Error Codes (9596-9603)

| Code | Name |
|------|------|
| 9596 | COMPANY_NOT_FOUND |
| 9597 | COMPANY_ALREADY_EXISTS |
| 9599 | CTA_INVALID_TYPE |
| 9601 | ARTICLE_EXTRACTION_FAILED |
| 9602 | STYLE_ANALYSIS_FAILED |

---

## Related Files

- Spec: `28-company-profile-management.md`
- GSearch Extraction: `29-gsearch-url-extraction.md`
- OpenAPI: `30-openapi-spec-seo.md`
