# Memory: features/golang-search-cli

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Spec Location:** `spec/11-spec-management-software/05-features/22-golang-search-cli/`

---

## Overview

Golang-based search CLI (`gsearch`) for full-text search, semantic search, URL extraction, and site crawling.

---

## Core Capabilities

| Feature | Description |
|---------|-------------|
| Full-text Search | FTS5-based text search |
| Semantic Search | Vector similarity via sqlite-vss |
| Hybrid Scoring | Combined FTS5 + VSS results |
| Full Site Crawler | URL ingestion with SSRF protection |
| Indexing | Markdown chunking with stable IDs |
| **URL Extraction** | Multi-format content extraction (NEW) |
| **Style Analysis** | Writing metrics extraction (NEW) |

---

## URL Extraction (NEW)

### Output Formats
| Format | Description |
|--------|-------------|
| `text` | Plain text only |
| `markdown` | Clean markdown (headers, links, lists) |
| `html` | Cleaned HTML (no scripts/styles) |
| `json` | Structured: headings[], paragraphs[], links[], images[] |

### Commands
```bash
gsearch extract <url> --format markdown
gsearch extract <url> --format text,markdown,html
gsearch extract <url> --analyze-style
gsearch extract <url> --force  # Bypass cache
gsearch extract <url> --cache-days 7
gsearch extract <url> --include-images
```

### Caching
- Default TTL: 5 days
- Force refresh: `--force` bypasses cache
- Storage: `data/{appName}/rag/cache/extract/{url-hash}.db`

---

## Scoring & Analysis

| Component | Description |
|-----------|-------------|
| Authority Scores | Domain-based authority (Academic: 0.95, Tech: 0.88) |
| Source Weights | 50% authority + 30% recency + 20% citations |
| Credibility | Low/Medium/High classification (thresholds: 0.4, 0.7) |
| Confidence | Weighted formula with 30% contradiction penalty |
| Trend Analysis | Composite score (30% stars, 40% jobs, 20% SO, 10% downloads) |

---

## TrendAnalyzer Implementation

- **Collectors**: GitHub, StackOverflow, Jobs, NPM, PyPI
- **Settings Integration**: Full SettingsService with seedable config
- **Visualization**: Bar charts, line charts, heatmaps via go-chart
- **CLI Commands**: `gsearch trends analyze|history|compare`

---

## Integration

- Standalone CLI executable
- JSON output format
- Integrates with RAG system for context retrieval
- **Integrates with SEO modules for reference article extraction**

---

## Related Files

- URL Extraction Spec: `spec/22-ai-bridge-cli/01-backend/29-gsearch-url-extraction.md`
- Company Profile: `spec/22-ai-bridge-cli/01-backend/28-company-profile-management.md`
- Crawler Spec: `spec/20-gsearch-cli/01-backend/17-full-site-crawler.md`
- Caching Spec: `spec/20-gsearch-cli/01-backend/10-caching-system.md`
