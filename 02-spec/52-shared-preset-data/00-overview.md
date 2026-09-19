# Shared Preset Data Specification

**Version:** 3.1.0  
**Status:** Active  
**Updated:** 2026-03-30  
**AI Confidence:** Production-Ready  
**Ambiguity:** None

---

## Keywords

`preset-data` · `mock-data` · `testing` · `gsearch` · `ai-bridge` · `rag-chunks` · `company-profiles` · `proxy-pools`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | None |
| Health Score | 100/100 (A+) |

---

## Purpose

Define comprehensive preset/mock data for rapid testing of gSearch CLI and AI Bridge CLI features. This data enables end-to-end pipeline testing without live API calls, covering search results, content extraction, company profiles, RAG chunks, proxy pools, and API key quotas.

---

## Document Inventory

| # | File | Description |
|---|------|-------------|
| 01 | `01-search-presets.md` | Mock search results and nested search data |
| 02 | `02-extract-presets.md` | Extracted articles, authority data, and style profiles |
| 03 | `03-company-presets.md` | Demo company profiles, training articles, and generated content samples |
| 04 | `04-infrastructure-presets.md` | Proxy pools, API key quotas, and RAG chunk data |
| 05 | `05-usage-guide.md` | Go and TypeScript loading patterns, test integration |
| 06 | `97-acceptance-criteria.md` | Testable criteria for preset data integrity |
| 07 | `98-changelog.md` | Version history |

---

## Directory Structure

```
data/presets/
├── search/           # Mock search results (gSearch)
├── extract/          # Extracted articles, authority, style profiles
│   ├── articles/
│   ├── authority/
│   └── style/
├── companies/        # Demo company profiles with generated samples
│   ├── demo-cleaning/
│   ├── demo-hvac/
│   └── demo-plumbing/
├── rag/              # Pre-chunked RAG data and cached embeddings
├── proxy/            # Mock proxy pool configuration
└── api-keys/         # Mock API response fixtures and quota status
```

---

## Cross-References

| Spec | Relationship |
|------|-------------|
| `02-spec/25-gsearch-cli/02-frontend/04-testing-ui-page.md` | gSearch testing UI consumes search presets |
| `02-spec/27-ai-bridge-cli/02-frontend/03-testing-ui-page.md` | AI Bridge testing UI consumes company presets |
| `02-spec/27-ai-bridge-cli/01-backend/28-company-profile-management.md` | Company profile schema |
| `02-spec/27-ai-bridge-cli/01-backend/29-gsearch-url-extraction.md` | URL extraction schema |
