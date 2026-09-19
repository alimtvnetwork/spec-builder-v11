# GSearch Business Intelligence Suite: Summary

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Error Code Range:** 7700–7839  

---

## Overview

The GSearch Business Intelligence Suite is a comprehensive 8-phase implementation providing advanced research, lead generation, and competitive intelligence capabilities. Built on the Split DB architecture, it delivers multi-engine search, FAQ discovery, SERP tracking, contact extraction, Google Maps automation, unified caching, REST API, and interactive testing UI.

---

## Phase Summary

| Phase | Name | Description | Error Codes | TTL |
|-------|------|-------------|-------------|-----|
| 1 | Multi-Engine Search | Google, Bing, DuckDuckGo with API rotation | 7700–7719 | 5 days |
| 2 | FAQ Discovery & AI Overview | PAA extraction, JSON-LD, SGE summaries | 7720–7739 | 14 days |
| 3 | SERP Position Tracking | Ranking history, competitor analysis, alerts | 7740–7759 | 1 day (SERP), 365 days (history) |
| 4 | Contact Extraction | Email, phone, social profile discovery | 7760–7779 | 180 days |
| 5 | Google Maps Search | Scheduled business discovery, batch processing | 7780–7794 | 90 days |
| 6 | Response Formatting & Caching | JSON envelope, TTL policies, cache control | 7800–7819 | Configurable |
| 7 | Unified REST API | Consolidated endpoints, auth, webhooks | 7820–7839 | N/A |
| 8 | Testing UI | React endpoint explorer, live documentation | N/A | N/A |

---

## Phase 1: Multi-Engine Search

**Specification:** `42-multi-engine-search.md`  
**Error Codes:** 7700–7719

### Key Features
- **Engine Support:** Google, Bing, DuckDuckGo
- **API Providers:** SerpApi, Serper, Azure Bing (priority-based rotation)
- **Fallback:** go-rod stealth scraper with anti-detection
- **Result Aggregation:** Score-based or rank interleaving with deduplication
- **AI Overview:** Extraction of SGE summaries and cited sources

### CLI Commands
```bash
gsearch search "query" --engines google,bing --method auto
gsearch search "query" --aggregate --count 20
```

### Data Structures
- `SearchResult`: Position, Title, Url, Snippet, Domain
- `AiOverviewData`: Summary, Sources, Citations
- `EngineResult`: Engine-specific result wrapper

---

## Phase 2: FAQ Discovery & AI Overview

**Specification:** `43-faq-discovery-ai-overview.md`  
**Error Codes:** 7720–7739

### Key Features
- **PAA Extraction:** Google "People Also Ask" boxes with recursive expansion
- **Schema Parsing:** FAQPage, QAPage JSON-LD from target URLs
- **AI Overview:** SGE summary capture with source attribution
- **Answer Enrichment:** Best answer selection via word count, formatting, authority

### CLI Commands
```bash
gsearch faq "query" --depth 3 --expand
gsearch faq "query" --include-ai-overview
```

### Data Structures
- `FaqItem`: Question, Answer, Source, Type
- `PaaQuestion`: Question, Answer, ChildQuestions
- `AiOverview`: Summary, Sources, Confidence

---

## Phase 3: SERP Position Tracking

**Specification:** `44-serp-position-tracking.md`  
**Error Codes:** 7740–7759

### Key Features
- **Position Discovery:** Multi-page parallel crawling (1-10 pages)
- **Scheduled Tracking:** gocron-based daily/weekly checks
- **History Analysis:** Best/worst/avg with linear regression trend
- **Competitor Discovery:** Top-ranking domain identification
- **Alert Engine:** 6 trigger types (drop, gain, change, page, not_found, first_page)

### CLI Commands
```bash
gsearch serp check "query" --domain example.com --pages 1-5
gsearch serp track "query" --domain example.com --interval daily
gsearch serp history "query" --domain example.com --days 90
```

### Data Structures
- `PositionRecord`: Query, Domain, Position, Page, Url, CheckedAt
- `PositionHistory`: Points[], Stats, Trend
- `TrackerJob`: Id, Query, Domains[], Interval, AlertConfig

---

## Phase 4: Contact Extraction

**Specification:** `45-contact-extraction.md`  
**Error Codes:** 7760–7779

### Key Features
- **Email Discovery:** mailto links, JSON-LD, text regex (up to 5 per domain)
- **Email Classification:** General, Support, Sales, HR, Press, Personal
- **Phone Detection:** tel/WhatsApp links, E.164 normalization
- **Social Profiles:** 9 platforms (LinkedIn, Facebook, Twitter/X, Instagram, YouTube, TikTok, Pinterest, WhatsApp, Telegram)
- **Verification:** MX record lookup, HEAD request validation

### CLI Commands
```bash
gsearch contact extract "https://example.com" --verify
gsearch contact batch urls.txt --follow-contact
```

### Data Structures
- `ContactInfo`: Emails[], Phones[], Socials[], Verified
- `EmailRecord`: Address, Type, Verified, Source
- `PhoneRecord`: Number, Type, Normalized, Source
- `SocialLink`: Platform, Url, Handle, Verified

---

## Phase 5: Google Maps Search

**Specification:** `46-google-maps-search.md`  
**Error Codes:** 7780–7794

### Key Features
- **Maps Scraper:** go-rod stealth with scroll-based pagination
- **Business Data:** PlaceId, coordinates, hours, categories, ratings
- **Job Scheduler:** 3-phase workflow (Searching → Enriching → Finishing)
- **Filters:** Min rating, min reviews, open now, price level
- **Integration:** Phase 4 contact extraction for website enrichment

### CLI Commands
```bash
gsearch maps search "restaurants" --location "New York" --max 30
gsearch maps job create "plumbers" --locations cities.txt --enrich
gsearch maps job status <job-id>
```

### Data Structures
- `BusinessRecord`: PlaceId, Name, Address, Contact, Metrics, Hours
- `MapsJob`: Id, Query, Locations[], Status, Phase, Progress
- `BusinessMetrics`: Rating, ReviewCount, PriceLevel, IsOpen

---

## Phase 6: Response Formatting & Caching

**Specification:** `47-response-formatting-caching.md`  
**Error Codes:** 7800–7819

### Key Features
- **Response Envelope:** Success, Data, Meta, Pagination, Cache, Errors
- **Output Formats:** json, json-pretty, jsonl, csv, tsv, markdown, table, minimal
- **Field Selection:** JSON path syntax with aliasing
- **TTL Policies:** Category-specific with min/max clamping
- **Cache Control:** no-cache, force, no-store, stale-ok, custom TTL
- **Stale-While-Revalidate:** Background refresh for expired cache

### CLI Flags
```bash
gsearch search "query" --format csv --fields "Title,Url,Position"
gsearch search "query" --no-cache --ttl 10
gsearch cache stats
gsearch cache clear search_results
```

### TTL Defaults
| Category | Default | Min | Max |
|----------|---------|-----|-----|
| search_results | 5 days | 1 hour | 30 days |
| serp_snapshot | 1 day | 1 hour | 7 days |
| position_history | 365 days | 90 days | Immutable |
| contact_data | 180 days | 30 days | 365 days |
| business_data | 90 days | 7 days | 180 days |
| authority_scores | 30 days | 7 days | 90 days |
| faq_content | 14 days | 1 day | 60 days |
| ai_overview | 7 days | 1 day | 30 days |

---

## Phase 7: Unified REST API

**Specification:** `48-unified-rest-api.md`  
**Error Codes:** 7820–7839

### Key Features
- **Base URL:** `/api/v1/bi`
- **Authentication:** API key with 11 scopes
- **Rate Limiting:** Token bucket per API key
- **OpenAPI 3.1:** Auto-generated spec at `/swagger/`
- **Webhooks:** 7 event types with HMAC-SHA256 signing
- **Middleware:** Recovery, request ID, logging, CORS, gzip, auth

### Endpoint Groups
| Path | Description |
|------|-------------|
| `/search` | Multi-engine search execution |
| `/faq` | FAQ discovery and PAA expansion |
| `/serp` | Position tracking and history |
| `/contact` | Contact extraction (single/batch) |
| `/maps` | Google Maps search and jobs |
| `/extract` | URL content extraction |
| `/cache` | Cache management |
| `/webhook` | Webhook registration |
| `/health` | Server health check |

### API Scopes
- `search:read`, `search:write`
- `serp:read`, `serp:write`
- `contact:read`, `contact:write`
- `maps:read`, `maps:write`
- `cache:manage`
- `webhook:manage`
- `admin`

### Webhook Events
- `serp.alert`, `serp.complete`
- `contact.complete`, `contact.batch.complete`
- `maps.progress`, `maps.complete`, `maps.error`

---

## Phase 8: Testing UI

**Specification:** `49-testing-ui.md`  
**Error Codes:** N/A (frontend only)

### Key Features
- **Endpoint Explorer:** Interactive API testing interface
- **Live Documentation:** Synchronized OpenAPI viewer
- **Request Builder:** Visual query/body construction
- **Response Viewer:** Formatted JSON with syntax highlighting
- **History Panel:** Recent requests with replay capability
- **Auth Manager:** API key storage and selection

---

## Database Architecture

### Split DB Strategy

```
┌─────────────────────────────────────────────────────────┐
│                     Setting DB                          │
│  (Global configuration, TTL policies, API keys)         │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Root DB       │ │   Root DB       │ │   Root DB       │
│   (Search)      │ │   (SERP)        │ │   (Maps)        │
│   Job registry  │ │   Tracker jobs  │ │   Scheduled jobs│
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Session DBs    │ │  Session DBs    │ │  Session DBs    │
│  (per query)    │ │  (per tracker)  │ │  (per job)      │
│  Results cache  │ │  Position hist  │ │  Business data  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Key Tables
- `SearchResults`: Cached search results
- `FaqItems`: Extracted FAQ content
- `PositionHistory`: SERP ranking history
- `TrackerJobs`: Active tracking configurations
- `ContactRecords`: Extracted contact information
- `BusinessRecords`: Maps business data
- `MapsJobs`: Scheduled crawl jobs
- `CacheEntries`: Unified cache storage
- `ApiKeys`: API authentication
- `Webhooks`: Registered webhooks
- `WebhookDeliveries`: Delivery log

---

## Error Code Registry

| Range | Phase | Category |
|-------|-------|----------|
| 7700–7719 | Phase 1 | Multi-Engine Search |
| 7720–7739 | Phase 2 | FAQ Discovery |
| 7740–7759 | Phase 3 | SERP Tracking |
| 7760–7779 | Phase 4 | Contact Extraction |
| 7780–7794 | Phase 5 | Google Maps |
| 7800–7819 | Phase 6 | Response/Cache |
| 7820–7839 | Phase 7 | REST API |

See `50-bi-error-codes.md` for complete error code reference.

---

## Implementation Order

1. **Phase 6** (Response Formatting) - Foundation for all responses
2. **Phase 1** (Multi-Engine Search) - Core search functionality
3. **Phase 2** (FAQ Discovery) - Builds on search results
4. **Phase 4** (Contact Extraction) - Independent extraction
5. **Phase 3** (SERP Tracking) - Uses search + scheduling
6. **Phase 5** (Google Maps) - Uses scheduler + contact extraction
7. **Phase 7** (REST API) - Exposes all features
8. **Phase 8** (Testing UI) - Development/testing interface

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Settings Service | `21-settings-service.md` |
| CLI Framework | `01-cli-framework.md` |
| Error Codes Overview | `15-error-codes.md` |
| BI Error Codes | `50-bi-error-codes.md` |
| Testing UI Spec | `49-testing-ui.md` |
