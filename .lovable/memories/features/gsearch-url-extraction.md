# Memory: features/gsearch-url-extraction

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/22-ai-bridge-cli/01-backend/29-gsearch-url-extraction.md`

---

## Overview

GSearch URL extraction provides comprehensive content extraction from URLs with six output formats, intelligent caching, writing style analysis, nested depth crawling, authority/traffic metrics via Ahrefs, and parallel processing architecture.

---

## Processing Architecture

Raw HTML chunking is **NOT recommended** due to tag boundary corruption risks. Instead, the pipeline uses:

1. **Sequential**: Fetch HTML → Save to temp file (`data/{app}/temp/extract/{uuid}.html`)
2. **Sequential**: Parse DOM (goquery, ~5ms for 1MB)
3. **Parallel**: Extract content types (headings, paragraphs, links, images, lists, quotes) via 6 workers
4. **Parallel**: Generate output formats (text, markdown, html, simple-html, yaml) via 5 workers
5. **Parallel**: Optional style analysis + authority fetch concurrently

---

## Key Features

### Multi-Format Output
| Format | Description |
|--------|-------------|
| `text` | Plain text, paragraphs separated by blank lines |
| `markdown` | Clean markdown with headers, links, lists |
| `html` | Cleaned HTML (scripts/styles removed, semantic tags preserved) |
| `simple-html` | **Minimal: only h1-h6 + p tags** — for programmatic parsing |
| `json` | Structured with headings[], headerSections[], paragraphs[], links[], images[] |
| `yaml` | Human-readable YAML format, equivalent to JSON |

### Caching System
- **Default TTL**: 5 days for content (configurable via global settings or `--cache-days`)
- **Authority TTL**: 30 days for Ahrefs metrics
- **Force Refresh**: `--force` flag **deletes** existing cache then fetches fresh
- **Storage**: `data/{appName}/rag/cache/extract/{url-hash}.db`

### Nested Depth Crawling
- `--depth N` follows internal links up to N levels (max 5)
- Returns `NestedLinks[]` with URL, title, snippet for each discovered page
- Useful for building comprehensive context around a topic

### Authority/Traffic Metrics (Multi-Source Fallback)

Authority data uses a cascading fallback chain when API keys are unavailable:

1. **Ahrefs API** (if `AHREFS_API_KEY` configured) — Full data, paid
2. **Open PageRank API** (free, 10K queries/month) — PageRank 0-10
3. **Moz Link Explorer** (free tier, 10 queries/month) — DA/PA scores
4. **Headless Browser Scraping** (rod/chromedp) — Ahrefs free tools, CAPTCHA risk
5. **CommonCrawl Index** (self-hosted) — Backlink counts only

**Ahrefs API v3 Endpoints:**
- `/domain-rating` → DR 0-100
- `/url-rating` → UR 0-100 (page-level)
- `/backlinks-stats` → Live backlinks + referring domains
- `/metrics` → Organic traffic + traffic value
- `/top-pages` → Top-ranking keywords

**Caching:** 30-day TTL for all authority data regardless of source

### Proxy Rotation

Supports proxy rotation for scraping (Google search, authority scraping):
- **Proxy Types:** HTTP, HTTPS, SOCKS5
- **Rotation Strategies:** round_robin, random, weighted, smart (route by target site)
- **Pools:** Multiple pools with target site routing (e.g., residential for Google, datacenter for Bing)
- **Auto-Recovery:** Failed proxies auto-disabled after N failures, re-enabled after configurable timeout
- **Health Checks:** Periodic health checks via configurable test URL

### Multi-Key Pooling for Free APIs

Free sources support multiple API keys with automatic rotation:
- **OpenPageRank:** Pool of keys, each with 10K/month quota
- **Moz:** Pool of keys, each with 10/month quota
- **Rotation Strategies:** round_robin, least_used
- **Quota Tracking:** Persistent usage tracking, automatic reset on quota reset day
- **Status UI:** Key pool dashboard shows usage per key, disabled keys, remaining quota

### Writing Style Analysis (EEAT-focused)
When `--analyze-style` is enabled:
- Sentence metrics (avg/min/max length, std dev)
- Paragraph metrics (avg length, sentences per para)
- Formality score (0.0 casual to 1.0 formal)
- Readability score (Flesch-Kincaid)
- Transition word rate and common transitions
- Voice pattern (active/passive ratio)
- Tense pattern (present/past ratio)
- Common phrases and sentence starters

---

## CLI Commands

```bash
# Basic extraction
gsearch extract https://example.com/article

# All formats at once
gsearch extract https://example.com --format text,markdown,html,simple-html,json,yaml

# With style analysis
gsearch extract https://example.com --format markdown --analyze-style

# Force refresh (delete cache, fetch fresh)
gsearch extract https://example.com --force

# Nested depth crawling (follow links 2 levels deep)
gsearch extract https://example.com --depth 2

# Include authority/traffic metrics (Ahrefs)
gsearch extract https://example.com --authority

# Include image URLs
gsearch extract https://example.com --include-images

# Output to file
gsearch extract https://example.com -o article.md

# Full extraction
gsearch extract https://example.com \
  --format text,markdown,simple-html,json \
  --analyze-style --authority --depth 2
```

---

## API Endpoint

**POST** `/api/v1/extract`

```json
{
  "Url": "https://example.com/article",
  "Formats": ["text", "markdown", "simple-html", "json", "yaml"],
  "ForceRefresh": false,
  "CacheDays": 5,
  "AnalyzeStyle": true,
  "IncludeImages": true,
  "Depth": 2,
  "IncludeAuthority": true
}
```

---

## Simple-HTML Format

Designed for programmatic header+content extraction:
- **Only** `<h1>` through `<h6>` and `<p>` tags
- No structural tags (html, body, div, section, article)
- No formatting tags (strong, em, a) — stripped to text
- Lists converted to paragraphs
- Perfect for jQuery-like DOM traversal to get header → description pairs

---

## Error Codes (9610-9641)

| Range | Category |
|-------|----------|
| 9610-9618 | Extraction errors |
| 9619-9623 | Ahrefs API errors |
| 9624-9626 | OpenPageRank errors |
| 9627-9629 | Moz errors |
| 9630-9633 | Scraping/CommonCrawl errors |
| 9634-9638 | Proxy errors |
| 9639-9641 | Key pool errors |

---

## Related Files

- Spec: `29-gsearch-url-extraction.md`
- Company Profile: `28-company-profile-management.md`
- GSearch Crawler: `spec/20-gsearch-cli/01-backend/17-full-site-crawler.md`
- Authority Scoring: `spec/20-gsearch-cli/01-backend/18-authority-credibility-scoring.md`
- Caching: `spec/20-gsearch-cli/01-backend/10-caching-system.md`
