# WP SEO Publish CLI: Backend Overview

**Version:** 2.1.0  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`seo`, `publish`, `cli`, `backend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

This folder contains all backend specifications for WordPress SEO Publish CLI.

---

## Files

| File | Description |
|------|-------------|
| 01-architecture.md | Core system design and component layout |
| 02-wordpress-connector.md | WordPress REST API integration with Application Password |
| 03-content-publisher.md | Publishing logic for categories, pages, posts, tags |
| 04-ai-bridge-client.md | AI Bridge CLI integration for SEO content |
| 05-variable-system.md | CSV, JSON, YAML variable import/processing |
| 06-split-db-schema.md | Database architecture for websites and publications |
| 07-api-endpoints.md | REST API specification (40+ endpoints) |
| 08-error-codes.md | Error code registry (12000-12599) |
| 09-import-export.md | Website and variable data portability |

---

## Core Concepts

### WordPress Connector
- Application Password authentication
- REST API v2 integration
- Rate limiting and retry logic
- Connection pooling for multi-site

### Content Publisher
- Category hierarchy management
- Post/Page creation with full metadata
- Tag assignment (AI-suggested or manual)
- Featured image handling
- Revision tracking

### AI Bridge Client
- HTTP client for AI Bridge CLI endpoints
- Request formatting (Markdown, HTML, JSON)
- Response parsing with category/tag extraction
- Variable injection before request
- Streaming support for long content

### Variable System
- File-based variable sources (CSV, JSON, YAML)
- Scope hierarchy: Global → Website → Content Type → Instance
- Template processing with format specifiers
- Validation and error reporting

---

## Naming Convention

All database columns, JSON fields, and API payloads use **PascalCase**:
- Database: `Id`, `WebsiteId`, `CreatedAt`
- JSON: `"Title"`, `"Keywords"`, `"ServiceAreas"`
- Go structs: Omit JSON tags when field name matches (use only for `omitempty`)

See: `.lovable/memories/style/naming-convention.md`

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `../00-overview.md` |
| Frontend | `../02-frontend/00-overview.md` |
| Deploy | `../03-deploy/01-powershell-scripts.md` |
| AI Bridge CLI | `../../22-ai-bridge-cli/00-overview.md` |
| AI Bridge Sitemap Indexing | `../../22-ai-bridge-cli/01-backend/21-sitemap-indexing.md` |
| Split DB Architecture | `../../06-split-db-architecture/00-overview.md` |
| Naming Convention | `.lovable/memories/style/naming-convention.md` |
| DBOperation Wrapper | `../../11-spec-management-software/13-shared-packages/08-pkg-database-operations.md` |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` |
| Database Pre-flight Checklist | `.lovable/memories/standards/database-preflight-checklist.md` |
