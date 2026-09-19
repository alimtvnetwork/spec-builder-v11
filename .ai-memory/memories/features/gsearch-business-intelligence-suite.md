# Memory: features/gsearch-business-intelligence-suite
Updated: now
**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview

The GSearch Business Intelligence Suite is an 8-phase implementation providing advanced research, lead generation, and competitive intelligence capabilities. Error code range: 7700-7839. Built on Split DB architecture with category-specific TTL policies.

---

## Phase Summary

| Phase | Name | Error Codes | TTL Default |
|-------|------|-------------|-------------|
| 1 | Multi-Engine Search | 7700-7719 | 5 days |
| 2 | FAQ Discovery & AI Overview | 7720-7739 | 14 days |
| 3 | SERP Position Tracking | 7740-7759 | 1 day (SERP), 365 days (history) |
| 4 | Contact Extraction | 7760-7779 | 180 days |
| 5 | Google Maps Search | 7780-7794 | 90 days |
| 6 | Response Formatting & Caching | 7800-7819 | Configurable |
| 7 | Unified REST API | 7820-7839 | N/A |
| 8 | React Testing UI | N/A | N/A |

---

## Phase 1: Multi-Engine Search

**Spec:** `42-multi-engine-search.md`

- **Engines:** Google, Bing, DuckDuckGo
- **API Providers:** SerpAPI, Serper, Azure Bing (priority rotation)
- **Fallback:** go-rod stealth scraper with anti-detection
- **Aggregation:** Score-based or rank interleaving with deduplication
- **AI Overview:** SGE summary extraction with cited sources
- **CLI:** `gsearch search "query" --engines google,bing --method auto`

---

## Phase 2: FAQ Discovery & AI Overview

**Spec:** `43-faq-discovery-ai-overview.md` (1002 lines, complete)

- **PAA Extraction:** Google "People Also Ask" with recursive expansion (depth 1-5)
- **PAA Selectors:** `div.related-question-pair`, `div[jsname='N760b']`, `div.wWOJcd`
- **Schema Parsing:** FAQPage JSON-LD with semantic HTML fallbacks (details, dt/dd, FAQ sections)
- **AI Overview:** SGE summary capture with cited URLs, bullet points, follow-up queries
- **Question Types:** what, how, why, where, when, who, is, can, does
- **Answer Enrichment:** Multi-engine (Google, Bing) best answer selection with confidence scoring
- **Source Analysis:** URL analysis with authority scoring, content type, schema detection
- **Industry Context:** Supports industry and location parameters for targeted extraction
- **RAG Integration:** Converts FAQs to RAGChunk format for AI SEO generation
- **CLI:** `gsearch faq "query" --depth 3 --with-ai-overview --enrich-answers`

---

## Phase 3: SERP Position Tracking

**Spec:** `44-serp-position-tracking.md`

- **Position Discovery:** Multi-page parallel crawling (1-10 pages)
- **Scheduled Tracking:** gocron-based daily/weekly checks with SQLite persistence
- **History Analysis:** Best/worst/avg with linear regression trend detection
- **Competitor Discovery:** Top-ranking domain identification with authority scoring
- **Alert Engine:** 6 triggers (drop, gain, change, page_change, not_found, first_page)
- **CLI:** `gsearch serp track "query" --domain example.com --interval daily`

---

## Phase 4: Contact Extraction

**Spec:** `45-contact-extraction.md`

- **Implementation:** Pure Go with goquery (no Node.js)
- **Email Discovery:** mailto links, JSON-LD, text regex (max 5 per domain)
- **Email Classification:** General, Support, Sales, HR, Press, Personal
- **Phone Detection:** tel/WhatsApp links, E.164 normalization
- **Social Profiles:** 9 platforms (LinkedIn, Facebook, Twitter/X, Instagram, YouTube, TikTok, Pinterest, WhatsApp, Telegram)
- **Verification:** MX record lookup, HEAD request validation
- **CLI:** `gsearch contact extract "https://example.com" --verify`

---

## Phase 5: Google Maps Search

**Spec:** `46-google-maps-search.md`

- **Maps Scraper:** go-rod stealth with scroll-based pagination
- **Business Data:** PlaceId, coordinates, hours, categories, ratings
- **Job Scheduler:** 3-phase workflow (Searching → Enriching → Finishing)
- **Filters:** Min rating, min reviews, open now, price level
- **Integration:** Phase 4 contact extraction for website enrichment
- **Rate Limiting:** 30 results/batch, 2-minute intervals, randomized delays
- **CLI:** `gsearch maps job create "plumbers" --locations cities.txt --enrich`

---

## Phase 6: Response Formatting & Caching

**Spec:** `47-response-formatting-caching.md`

- **Response Envelope:** Success, Data, Meta, Pagination, Cache, Errors
- **Output Formats:** json, json-pretty, jsonl, csv, tsv, markdown, table, minimal
- **Field Selection:** JSON path syntax with aliasing
- **TTL Policies:** Category-specific with min/max clamping
- **Cache Control:** no-cache, force, no-store, stale-ok, custom TTL
- **Stale-While-Revalidate:** Background refresh for expired cache
- **CLI:** `gsearch search "query" --format csv --fields "Title,Url"`

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

**Spec:** `48-unified-rest-api.md`

- **Base URL:** `/api/v1/bi`
- **Authentication:** API key with 11 scopes
- **Rate Limiting:** Token bucket per API key
- **OpenAPI 3.1:** Auto-generated spec at `/swagger/`
- **Middleware:** Recovery, request ID, logging, CORS, gzip, auth

### Endpoint Groups

| Path | Description |
|------|-------------|
| `/search` | Multi-engine search |
| `/faq` | FAQ discovery, PAA expansion |
| `/serp` | Position tracking, history |
| `/contact` | Contact extraction (single/batch) |
| `/maps` | Google Maps search, jobs |
| `/extract` | URL content extraction |
| `/cache` | Cache management |
| `/webhook` | Webhook registration |

### API Scopes

search:read, search:write, serp:read, serp:write, contact:read, contact:write, maps:read, maps:write, cache:manage, webhook:manage, admin

### Webhook Events

serp.alert, serp.complete, contact.complete, contact.batch.complete, maps.progress, maps.complete, maps.error

---

## Phase 8: React Testing UI

**Spec:** `49-testing-ui.md`

- **Endpoint Explorer:** Grouped navigation with search/filter
- **Request Builder:** Path params, query, body, headers, auth tabs
- **Response Viewer:** Syntax-highlighted JSON, tabbed sections
- **OpenAPI Viewer:** Live documentation synchronized with spec
- **History Panel:** Collapsible with replay capability
- **Security:** API keys in sessionStorage only, no localStorage persistence

---

## Database Architecture

### Split DB Strategy

- **Setting DB:** Global configuration, TTL policies, API keys
- **Root DB:** Job registries per feature (search, SERP, Maps)
- **Session DBs:** Per-query/job result storage

### Key Tables

- SearchResults, FaqItems, PositionHistory, TrackerJobs
- ContactRecords, BusinessRecords, MapsJobs
- CacheEntries, ApiKeys, Webhooks, WebhookDeliveries

---

## Implementation Order

1. Phase 6 (Response Formatting) - Foundation for all responses
2. Phase 1 (Multi-Engine Search) - Core search functionality
3. Phase 2 (FAQ Discovery) - Builds on search results
4. Phase 4 (Contact Extraction) - Independent extraction
5. Phase 3 (SERP Tracking) - Uses search + scheduling
6. Phase 5 (Google Maps) - Uses scheduler + contact extraction
7. Phase 7 (REST API) - Exposes all features
8. Phase 8 (Testing UI) - Development/testing interface

---

## Specification Files

| File | Phase | Description |
|------|-------|-------------|
| 40-bi-suite-summary.md | All | Complete summary document |
| 42-multi-engine-search.md | 1 | Search implementation |
| 43-faq-discovery-ai-overview.md | 2 | FAQ/PAA extraction |
| 44-serp-position-tracking.md | 3 | Position tracking |
| 45-contact-extraction.md | 4 | Contact discovery |
| 46-google-maps-search.md | 5 | Maps automation |
| 47-response-formatting-caching.md | 6 | Formatting/caching |
| 48-unified-rest-api.md | 7 | REST API layer |
| 49-testing-ui.md | 8 | React testing UI |
| 50-bi-error-codes.md | All | Error code registry |

---

## Cross-References

- Split DB Architecture: `02-spec/06-split-db-architecture/`
- Settings Service: `21-settings-service.md`
- CLI Framework: `01-cli-framework.md`
- Error Codes Overview: `15-error-codes.md`
