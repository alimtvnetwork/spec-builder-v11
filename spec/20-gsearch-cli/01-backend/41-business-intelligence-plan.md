# GSearch Business Intelligence Suite - Implementation Plan

> **Status:** Planning  
> **Created:** 2026-02-04  
**Version:** 1.0.0  
> **Parent:** `spec/20-gsearch-cli/01-backend/`

---

## Overview

A comprehensive business intelligence module for GSearch CLI enabling FAQ discovery, multi-engine search, SERP position tracking, Google Maps scraping, and automated contact extraction with intelligent caching.

---

## Phase Breakdown

### Phase 1: Multi-Engine Search Foundation
**Spec:** `42-multi-engine-search.md`

| Component | Description |
|-----------|-------------|
| Engine Registry | Pluggable adapters for Google, Bing, DuckDuckGo |
| API Rotation | Round-robin with fallback across Search Console API, SerpApi, custom scrapers |
| Request Schema | Standardized request format with engine selection |
| Response Normalization | Unified result format across all engines |

**CLI Commands:**
```bash
gsearch search "keyword" --engines google,bing
gsearch search "keyword" --engines all
gsearch search "keyword" --engine google --method api
gsearch search "keyword" --engine bing --method scrape
```

**Request Options:**
- `--engines`: Comma-separated list or `all`
- `--method`: `api`, `scrape`, `auto` (default)
- `--merge`: Combine results vs separate per engine
- `--dedupe`: Remove duplicate URLs across engines

---

### Phase 2: FAQ Discovery & AI Overview
**Spec:** `43-faq-discovery-ai-overview.md`

| Component | Description |
|-----------|-------------|
| FAQ Pattern Detection | Extract "People Also Ask" and FAQ schema |
| AI Overview Extraction | Parse Google's AI-generated summaries (SGE) |
| Source URL Tracking | Identify URLs cited in AI Overview |
| Answer Retrieval | Fetch answers from multiple engines |

**CLI Commands:**
```bash
gsearch faq "plumbing services NYC" --with-ai-overview
gsearch faq "keyword" --engines google,bing --cache-days 7
gsearch faq "keyword" --analyze-sources
```

**Output Structure:**
```json
{
  "query": "plumbing services NYC",
  "ai_overview": {
    "available": true,
    "summary": "...",
    "cited_urls": ["url1", "url2"]
  },
  "faqs": [
    {
      "question": "How much does a plumber cost?",
      "answer": "...",
      "source_url": "...",
      "engine": "google"
    }
  ]
}
```

---

### Phase 3: SERP Position Tracking (Page Index)
**Spec:** `44-serp-position-tracking.md`

| Component | Description |
|-----------|-------------|
| Page-Based Search | Find results on specific SERP pages (1-10+) |
| Position Tracking | Track URL positions over time |
| Competitor Discovery | Find businesses ranking for target keywords |
| Split DB Storage | Root DB registry + session caches |

**CLI Commands:**
```bash
gsearch serp "keyword" --page 3
gsearch serp "keyword" --pages 3-5
gsearch serp "keyword" --find-position "example.com"
gsearch serp "keyword" --track --interval 24h
```

**Database Schema:**
```
Root DB (data/{appName}/rag/serp/registry.db):
├── SearchTerms (id, term, created_at, last_searched)
├── TrackedDomains (id, domain, keywords[])
└── SearchSchedule (id, term_id, interval, next_run)

Session DB (data/{appName}/rag/serp/results/{seq}-{term-hash}.db):
├── SerpResults (position, url, title, snippet, page, engine, captured_at)
└── PositionHistory (url, position, page, captured_at)
```

---

### Phase 4: Contact Information Extraction
**Spec:** `45-contact-extraction.md`

| Component | Description |
|-----------|-------------|
| HTML Parser | Node.js-based DOM traversal |
| Email Detection | Regex + mailto: link extraction |
| Phone Detection | International format parsing |
| Social Link Discovery | LinkedIn, Facebook, Twitter, Instagram, TikTok, YouTube |
| Contact Page Finder | Heuristic navigation to /contact, /about |

**CLI Commands:**
```bash
gsearch extract-contact "https://example.com"
gsearch extract-contact "https://example.com" --deep  # Follow contact page
gsearch extract-contact "https://example.com" --social-only
```

**Database Schema:**
```sql
CREATE TABLE Contacts (
  id INTEGER PRIMARY KEY,
  source_url TEXT NOT NULL,
  company_name TEXT,
  
  -- Up to 5 emails
  email_1 TEXT,
  email_2 TEXT,
  email_3 TEXT,
  email_4 TEXT,
  email_5 TEXT,
  
  -- Up to 5 phones
  phone_1 TEXT,
  phone_2 TEXT,
  phone_3 TEXT,
  phone_4 TEXT,
  phone_5 TEXT,
  
  -- Social profiles
  linkedin TEXT,
  facebook TEXT,
  twitter TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  whatsapp TEXT,
  
  -- Metadata
  extracted_at DATETIME,
  ttl_days INTEGER DEFAULT 365,
  raw_html_hash TEXT
);
```

**Extraction Logic (Node.js):**
```javascript
// Parse all <a> tags
// Match href containing: linkedin.com, facebook.com, twitter.com, etc.
// Match href with mailto:
// Match text containing @ symbol (email pattern)
// Match tel: links and phone patterns
```

---

### Phase 5: Google Maps Business Search
**Spec:** `46-google-maps-search.md`

| Component | Description |
|-----------|-------------|
| Industry Search | Search by business category + location |
| Scheduled Crawling | Cron-based batch processing |
| Rate Limiting | Configurable delay (default: 20-30 results per 1-2 min) |
| Business Enrichment | Website visit → contact extraction |

**CLI Commands:**
```bash
gsearch maps "plumbers" --location "New York, NY" --limit 500
gsearch maps "plumbers" --location "NYC" --schedule --batch-size 30 --interval 2m
gsearch maps status <job-id>
gsearch maps cancel <job-id>
```

**Extracted Fields:**
| Field | Source |
|-------|--------|
| Business Name | Google Maps |
| Address | Google Maps |
| Phone | Google Maps |
| Website | Google Maps |
| Rating | Google Maps |
| Reviews Count | Google Maps |
| Business Type | Google Maps |
| Hours | Google Maps |
| LinkedIn | Website (extracted) |
| YouTube | Website (extracted) |
| Other Socials | Website (extracted) |
| Emails | Website (extracted) |

**Database Schema:**
```sql
-- Root DB: data/{appName}/rag/maps/registry.db
CREATE TABLE MapJobs (
  id TEXT PRIMARY KEY,
  industry TEXT,
  location TEXT,
  target_count INTEGER,
  collected_count INTEGER DEFAULT 0,
  status TEXT, -- pending, running, paused, completed, failed
  batch_size INTEGER DEFAULT 30,
  interval_seconds INTEGER DEFAULT 120,
  created_at DATETIME,
  next_run_at DATETIME
);

-- Session DB: data/{appName}/rag/maps/results/{seq}-{job-id}.db
CREATE TABLE Businesses (
  id INTEGER PRIMARY KEY,
  place_id TEXT UNIQUE,
  name TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating REAL,
  reviews_count INTEGER,
  business_type TEXT,
  hours_json TEXT,
  lat REAL,
  lng REAL,
  contact_id INTEGER, -- FK to Contacts table
  extracted_at DATETIME
);
```

---

### Phase 6: Response Formatting & Caching
**Spec:** `47-response-formatting-caching.md`

| Component | Description |
|-----------|-------------|
| JSON Response Modes | Flat, nested, summary |
| Selective Fields | Include/exclude specific data |
| TTL Configuration | Per-entity TTL from seedable config |
| Cache Control | Force refresh, cache-only modes |

**Request Parameters:**
```bash
--format flat          # Top-level fields only
--format nested        # Include related entities (contacts, socials)
--format summary       # Minimal fields for listing

--include contacts,socials
--exclude raw_html,hours

--cache-days 365       # Business data TTL
--force                # Bypass cache
--cache-only           # Only return cached results
```

**TTL Configuration (config/gsearch.seed.yaml):**
```yaml
cache:
  ttl:
    search_results: 5        # days
    faq_answers: 7           # days
    serp_positions: 1        # days
    business_data: 365       # days (1 year)
    contact_info: 180        # days (6 months)
    maps_results: 90         # days (3 months)
```

**Nested Response Example:**
```json
{
  "businesses": [
    {
      "id": 1,
      "name": "ABC Plumbing",
      "website": "https://abcplumbing.com",
      "rating": 4.8,
      "contact": {
        "emails": ["info@abcplumbing.com", "support@abcplumbing.com"],
        "phones": ["+1-555-123-4567"],
        "socials": {
          "linkedin": "https://linkedin.com/company/abc-plumbing",
          "facebook": "https://facebook.com/abcplumbing",
          "youtube": null
        }
      }
    }
  ],
  "meta": {
    "total": 1,
    "cached": true,
    "cache_age_hours": 48,
    "format": "nested"
  }
}
```

---

### Phase 7: Unified API Endpoints
**Spec:** `48-business-intelligence-api.md`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/search` | POST | Multi-engine search |
| `/api/v1/search/faq` | POST | FAQ discovery with AI overview |
| `/api/v1/serp/track` | POST | SERP position tracking |
| `/api/v1/serp/positions` | GET | Get tracked positions |
| `/api/v1/extract/contact` | POST | Extract contact from URL |
| `/api/v1/maps/search` | POST | Start Google Maps search job |
| `/api/v1/maps/jobs/{id}` | GET | Get job status |
| `/api/v1/maps/jobs/{id}` | DELETE | Cancel job |
| `/api/v1/maps/results/{id}` | GET | Get job results |
| `/api/v1/business/{id}` | GET | Get business with contacts |

---

## Implementation Order

```
Phase 1 ──► Phase 2 ──► Phase 3
    │                      │
    │                      ▼
    │                  Phase 4 ◄── (shared contact extraction)
    │                      │
    ▼                      ▼
Phase 5 ──────────────► Phase 6 ──► Phase 7
```

**Dependencies:**
- Phase 2 depends on Phase 1 (multi-engine search)
- Phase 4 is used by Phase 3 and Phase 5
- Phase 5 depends on Phase 4 (contact extraction)
- Phase 6 is cross-cutting (applies to all phases)
- Phase 7 unifies all phases into REST API

---

## Error Code Allocation

| Range | Module |
|-------|--------|
| 7700-7719 | Multi-Engine Search |
| 7720-7739 | FAQ Discovery |
| 7740-7759 | SERP Position Tracking |
| 7760-7779 | Contact Extraction |
| 7780-7799 | Google Maps Search |

---

## Design Decisions

### 1. AI Overview Access
**Decision:** Browser-based scraping with stealth fallback

- Primary: Attempt headless browser with `go-rod` + stealth plugin
- Fallback: If blocked, return `ai_overview.available = false` gracefully
- Cache aggressively (7-day TTL) to minimize requests
- User can disable via `--skip-ai-overview` flag

### 2. Google Maps Scraping
**Decision:** Headless browser with aggressive rate limiting

- Use `go-rod` with stealth plugin for anti-detection
- Default: 20 results per batch, 2-minute intervals
- Configurable via seedable config
- Implement exponential backoff on rate limit detection
- Support Google Maps API as premium alternative (requires API key)

### 3. HTML Parsing Approach
**Decision:** Pure Go with `goquery` library

- No Node.js dependency—keeps CLI self-contained
- `goquery` provides jQuery-like DOM traversal
- Consistent with existing Go architecture
- Falls back to regex for edge cases (malformed HTML)

### 4. Social Profile Verification
**Decision:** Trust-first with optional verification

- Default: Accept URLs found on website without verification
- Optional `--verify-socials` flag triggers shallow visit
- Verification checks: page exists (200), company name appears
- Unverified links marked with `verified: false` in output

### 5. Scheduling Backend
**Decision:** Internal Go scheduler with SQLite persistence

- Use `go-co-op/gocron` for in-process scheduling
- Persist job state to SQLite (`MapJobs` table)
- Resume pending jobs on CLI restart
- Support `gsearch jobs list|pause|resume|cancel` commands
