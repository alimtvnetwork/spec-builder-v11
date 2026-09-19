# Memory: technical/seo-openapi-specification

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/30-openapi-spec-seo.md`

---

## Overview

Complete OpenAPI 3.0 specification for the SEO suite covering all company, blog, FAQ, paragraph, and extraction endpoints.

---

## Endpoint Groups

| Tag | Base Path | Endpoints |
|-----|-----------|-----------|
| Companies | `/seo/companies`, `/seo/{company}` | CRUD, summary |
| CTAs | `/seo/{company}/ctas` | List, add, random, update, delete |
| Blogs | `/seo/{company}/blogs` | CRUD, train, outline |
| FAQ | `/seo/{company}/faq` | CRUD, train |
| Paragraphs | `/seo/{company}/para` | CRUD, train |
| Categories | `/seo/{company}/categories` | CRUD |
| Articles | `/seo/{company}/articles` | List, add, delete, style |
| Extraction | `/extract` | URL content extraction |

---

## Common Parameters

| Name | Location | Type | Description |
|------|----------|------|-------------|
| `company` | path | string | Company slug |
| `blogId` | path | string | Blog ID or slug (polymorphic) |
| `page` | query | int | Pagination page (default: 1) |
| `limit` | query | int | Results per page (default: 20, max: 100) |

---

## SDK Generation

```bash
# TypeScript
openapi-generator generate -i openapi-seo.yaml -g typescript-axios -o ./sdk/ts

# Go
openapi-generator generate -i openapi-seo.yaml -g go -o ./sdk/go

# Python
openapi-generator generate -i openapi-seo.yaml -g python -o ./sdk/python
```

---

## Related Files

- OpenAPI Spec: `30-openapi-spec-seo.md`
- Company API: `28-company-profile-management.md`
- Blog API: `27-ai-seo-blog-generation.md`
- FAQ API: `22-ai-seo-faq-generation.md`
- Para API: `25-ai-seo-paragraph-generation.md`
