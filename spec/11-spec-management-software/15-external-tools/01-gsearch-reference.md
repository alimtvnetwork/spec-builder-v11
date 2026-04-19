# GSearch CLI Reference


**Last Updated:** 2026-03-20  

> **External Spec:** `spec/20-gsearch-cli/`  
> **Version:** 3.0.0  
> **Error Range:** 5090-5341, 7000-7999

---

## Summary

Golang-based search CLI (`gsearch`) for multi-engine web searching, full-text and semantic search, trend analysis, URL content extraction with multiple output formats, authority/traffic analysis, RAG memory generation, and anti-bot evasion (CAPTCHA solving, stealth scraping, proxy management).

---

## Full Specification

📁 **Location:** [`spec/20-gsearch-cli/`](../../20-gsearch-cli/00-overview.md)

---

## Key Components

### Backend (`01-backend/`)

| File | Description |
|------|-------------|
| `01-cli-framework.md` | Command structure, Cobra integration |
| `02-configuration.md` | Config file management |
| `03-database-schema.md` | SQLite tables, GORM models |
| `04-html-parser.md` | Direct HTML scraping |
| `05-google-api.md` | Search Console API integration |
| `06-duckduckgo.md` | DDG search integration |
| `07-bing-search.md` | Bing API integration |
| `08-method-switching.md` | Intelligent fallback logic |
| `09-nested-search.md` | Recursive keyword extraction |
| `10-caching-system.md` | Cache management (5-day default TTL) |
| `11-rag-export.md` | Memory format generation |
| `17-full-site-crawler.md` | Sitemap parsing, vector DB |
| `18-authority-credibility-scoring.md` | Domain authority scoring |
| `19-trend-analysis-engine.md` | Composite trend scoring |
| `63-captcha-handling.md` | CAPTCHA detection, solver routing (2Captcha/CapSolver), token injection |
| `64-stealth-scraping.md` | Browser fingerprint evasion, uTLS/JA3 rotation, go-rod automation |
| `65-proxy-acquisition.md` | Provider integration (BrightData/Oxylabs/SmartProxy), auto-replenishment, cost tracking |

### AI-Bridge Integration

| File | Description |
|------|-------------|
| `29-gsearch-url-extraction.md` | URL content extraction with multi-format output |

### Frontend (`02-frontend/`)

| File | Description |
|------|-------------|
| `01-settings-ui-page.md` | Settings page UI |
| `02-frontend-architecture.md` | React frontend architecture |
| `03-implementation-checklist.md` | Implementation checklist |

### Deploy (`03-deploy/`)

| File | Description |
|------|-------------|
| `01-deployment-guide.md` | Production deployment |

---

## Core Features

### URL Extraction Command

```bash
# Extract with multiple output formats
gsearch extract https://example.com/article --format text,markdown,html,simple-html,json,yaml

# With style analysis (EEAT metrics)
gsearch extract https://example.com/article --analyze-style

# Force refresh (delete cache, fetch fresh)
gsearch extract https://example.com/article --force

# Nested depth crawling (follow internal links)
gsearch extract https://example.com/article --depth 2

# Include authority/traffic metrics (Ahrefs)
gsearch extract https://example.com/article --authority
```

### Output Formats

| Format | Description |
|--------|-------------|
| `text` | Plain text, no formatting |
| `markdown` | Clean markdown with headers, lists, links |
| `html` | Cleaned HTML with semantic tags |
| `simple-html` | **Minimal: only h1-h6 + p tags** |
| `json` | Structured JSON with all metadata |
| `yaml` | Human-readable YAML format |

### Search and Index

```bash
# Search and index
gsearch search "keyword1,keyword2" --save-db

# Export for RAG
gsearch rag --format json --output ./rag-memory.json

# Trend analysis
gsearch trends analyze --topic "react vs vue"
```

### Daemon API

```bash
# Start daemon
gsearch daemon start --port 8088

# Query via REST
curl http://localhost:8088/api/search?q=keyword
```

---

## Caching

| Content Type | Default TTL | Storage |
|--------------|-------------|---------|
| Search Results | 5 days | `rag/cache/search/` |
| URL Extractions | 5 days | `rag/cache/extract/{url-hash}.db` |
| Authority Data | 30 days | `rag/cache/authority/` |

TTL is configurable via seedable config or CLI flags.

---

## Database Integration

GSearch uses SQLite with:
- **FTS5** for full-text search
- **sqlite-vss** for vector similarity

Shared database path: `./search.db.sqlite`

---

## Error Codes

| Range | Category |
|-------|----------|
| 5090-5123 | CAPTCHA solving (detection, solver routing, token injection) |
| 5200-5224 | Stealth scraping (fingerprint evasion, TLS rotation, browser automation) |
| 5300-5341 | Proxy acquisition (provider API, pool management, budget enforcement) |
| 7000-7099 | General/Startup |
| 7100-7199 | Search engine errors |
| 7200-7299 | Parser errors |
| 7300-7399 | Database errors |
| 7400-7499 | Cache errors |
| 7500-7599 | Crawling errors |
| 7700-7839 | Business Intelligence suite |
| 9610-9620 | Extraction errors |

See: [`spec/20-gsearch-cli/01-backend/15-error-codes.md`](../../20-gsearch-cli/01-backend/15-error-codes.md)

---

*Reference for spec-management-software integration*
