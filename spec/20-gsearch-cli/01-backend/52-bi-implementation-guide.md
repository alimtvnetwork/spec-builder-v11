# GSearch Business Intelligence Suite: Implementation Guide

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Status:** Ready for Implementation

---

## Overview

This guide provides step-by-step implementation instructions for the GSearch Business Intelligence Suite. Follow the recommended implementation order to ensure dependencies are satisfied and features build upon each other correctly.

---

## Implementation Order

```
Phase 6 → Phase 1 → Phase 2 → Phase 4 → Phase 3 → Phase 5 → Phase 7 → Phase 8
   ↓         ↓         ↓         ↓         ↓         ↓         ↓         ↓
Response  Search    FAQ      Contact   SERP      Maps     REST     Testing
Formatting Engine  Discovery Extract   Track    Search    API       UI
```

**Rationale:**
1. **Phase 6 first:** ResponseEnvelope and caching are foundational for all responses
2. **Phase 1 next:** Multi-engine search is the core capability
3. **Phase 2:** FAQ discovery builds on search results
4. **Phase 4:** Contact extraction is independent but reused by Phases 3 & 5
5. **Phase 3:** SERP tracking uses search + scheduler
6. **Phase 5:** Maps uses scheduler + contact extraction
7. **Phase 7:** REST API exposes all features
8. **Phase 8:** Testing UI is development tooling

---

## Phase 6: Response Formatting & Caching

**Spec:** `47-response-formatting-caching.md`  
**Error Codes:** 7800–7819  
**Estimated Time:** 2-3 days

### Prerequisites
- Split DB architecture implemented
- Settings service available

### Implementation Steps

#### Step 1: Create Core Types
```
internal/bi/response/
├── envelope.go          # ResponseEnvelope, ResponseMeta, CacheMeta
├── errors.go            # ResponseError struct
├── pagination.go        # PaginationMeta struct
└── types.go             # OutputFormat enum
```

**Key Structures:**
- `ResponseEnvelope` with Success, Data, Meta, Pagination, Cache, Errors
- `ResponseMeta` with RequestId, Timestamp, Duration, Version
- `CacheMeta` with Hit, Key, CreatedAt, ExpiresAt, TtlDays

#### Step 2: Implement TTL Policy Manager
```
internal/bi/cache/
├── policy.go            # TtlPolicy struct, DefaultTtlPolicies map
├── manager.go           # TtlPolicyManager with GetTtl, SetPolicy
└── config.go            # TTL configuration from settings
```

**Default TTL Values:**
| Category | Default | Min | Max |
|----------|---------|-----|-----|
| search_results | 5 days | 1 hour | 30 days |
| faq_content | 14 days | 1 day | 60 days |
| ai_overview | 7 days | 1 day | 30 days |
| contact_data | 180 days | 30 days | 365 days |
| business_data | 90 days | 7 days | 180 days |
| position_history | 365 days | 90 days | immutable |

#### Step 3: Implement Cache Manager
```
internal/bi/cache/
├── cache.go             # CacheManager struct
├── entry.go             # CacheEntry struct
├── key.go               # CacheKeyGenerator
└── storage.go           # Session DB operations
```

**Key Methods:**
- `Get(category, key string) apperror.Result[CacheEntry]`
- `Set(category, key string, data []byte, ttl time.Duration) *apperror.AppError`
- `Invalidate(category, key string) *apperror.AppError`
- `GetStats() apperror.Result[CacheStats]`

#### Step 4: Implement Formatter Engine
```
internal/bi/format/
├── formatter.go         # FormatterEngine struct
├── json.go              # JSON/JSONL output
├── csv.go               # CSV/TSV output
├── markdown.go          # Markdown output
├── table.go             # CLI table output
└── fields.go            # FieldSelector, ParseFieldSpec
```

**Supported Formats:**
- json, json-pretty, jsonl
- csv, tsv
- markdown, table, minimal

#### Step 5: Register Error Codes
Add error codes 7800-7819 to the error registry.

### Validation Checklist
- [ ] ResponseEnvelope wraps all responses
- [ ] TTL policies configurable via settings
- [ ] Cache hit/miss tracking works
- [ ] All 8 output formats implemented
- [ ] Field selection with JSON path syntax works
- [ ] Error codes 7800-7819 registered

---

## Phase 1: Multi-Engine Search

**Spec:** `42-multi-engine-search.md`  
**Error Codes:** 7700–7719  
**Estimated Time:** 3-4 days

### Prerequisites
- Phase 6 complete (Response formatting)
- API keys configured in settings

### Implementation Steps

#### Step 1: Create Engine Interface
```
internal/bi/search/
├── engine.go            # SearchEngine interface
├── request.go           # SearchRequest struct
├── response.go          # SearchResponse, SearchResult structs
└── types.go             # MethodType enum
```

**Interface:**
```go
type SearchEngine interface {
    Name() string
    Search(context stdctx.Context, req SearchRequest) apperror.Result[SearchResponse]
    IsAvailable() bool
    RateLimit() RateLimitConfig
}
```

#### Step 2: Implement API Pool
```
internal/bi/search/api/
├── pool.go              # ApiPool manager
├── provider.go          # ApiProvider struct
├── usage.go             # UsageStats tracking
└── rotation.go          # Provider rotation logic
```

**Provider Priority:**
1. SerpApi (Google, Bing)
2. Serper (Google)
3. Azure Bing API
4. Stealth scraper (fallback)

#### Step 3: Implement Engine Adapters
```
internal/bi/search/engines/
├── google.go            # GoogleAdapter
├── bing.go              # BingAdapter
├── duckduckgo.go        # DuckDuckGoAdapter
└── common.go            # Shared utilities
```

#### Step 4: Implement Stealth Scraper
```
internal/bi/search/scraper/
├── scraper.go           # StealthScraper struct
├── stealth.go           # Anti-detection measures
├── parser.go            # HTML parsing
└── proxy.go             # Proxy pool (optional)
```

**Anti-Detection:**
- go-rod stealth plugin
- Random viewport/user-agent
- Human-like delays (2-5s)
- CAPTCHA detection

#### Step 5: Implement Result Aggregator
```
internal/bi/search/
├── aggregator.go        # Merge strategies
├── dedupe.go            # Deduplication
└── score.go             # Relevance scoring
```

**Merge Strategies:**
- Interleave (round-robin)
- Rank-based (by position)
- Score-based (computed relevance)

#### Step 6: Add CLI Commands
```bash
gsearch search "query" --engines google,bing --method auto
gsearch search "query" --aggregate --count 20
```

### Validation Checklist
- [ ] All 3 engines implemented (Google, Bing, DDG)
- [ ] API rotation with fallback works
- [ ] Stealth scraper functional
- [ ] Result aggregation/deduplication works
- [ ] Cache integration with Phase 6
- [ ] Error codes 7700-7719 registered

---

## Phase 2: FAQ Discovery & AI Overview

**Spec:** `43-faq-discovery-ai-overview.md`  
**Error Codes:** 7720–7739  
**Estimated Time:** 3-4 days

### Prerequisites
- Phase 1 complete (Multi-engine search)
- Stealth scraper available

### Implementation Steps

#### Step 1: Create Core Types
```
internal/bi/faq/
├── types.go             # FaqItem, FaqAnswer, AiOverview structs
├── request.go           # FaqDiscoveryRequest
├── response.go          # FaqDiscoveryResponse
└── origin.go            # FaqOrigin enum (paa, schema, ai_overview)
```

#### Step 2: Implement AI Overview Extractor
```
internal/bi/faq/aiov/
├── extractor.go         # AiOverviewExtractor
├── selectors.go         # 2026 SGE container selectors
├── parser.go            # Content parsing
└── confidence.go        # Extraction confidence scoring
```

**2026 SGE Selectors (priority order):**
```go
var sgeSelectors = []string{
    // Primary 2026 containers
    "div[data-sgrd='true']",
    "div[jsname='Cpkphb']",
    "div[data-attrid='SGEAnswer']",
    "div.kc-header-container",
    
    // Secondary containers
    "div[data-attrid='wa:/description']",
    "div.kp-blk.c2xzTb",
    "div[data-md]",
    "div.ULSxyf",
    
    // Fallback (heuristic detection)
    "div[data-hveid] > div > div > span",
}
```

#### Step 3: Implement PAA Extractor
```
internal/bi/faq/paa/
├── extractor.go         # PaaExtractor
├── expand.go            # Recursive expansion
├── selectors.go         # PAA container selectors
└── classify.go          # Question classification
```

**2026 PAA Selectors:**
```go
var paaSelectors = []string{
    "div[jsname='Cpkphb'] div.related-question-pair",
    "div[data-initq] div.wWOJcd",
    "div.related-question-pair",
    "div[jsname='N760b']",
    "div[data-sgrd] div[role='button']",
}
```

#### Step 4: Implement Schema Extractor
```
internal/bi/faq/schema/
├── extractor.go         # FAQSchemaExtractor
├── jsonld.go            # JSON-LD parsing (FAQPage, QAPage)
├── semantic.go          # Semantic HTML patterns
└── validate.go          # Schema validation
```

**Supported Schemas:**
- FAQPage
- QAPage
- HowTo (for step-based answers)

#### Step 5: Implement Answer Enrichment
```
internal/bi/faq/enrich/
├── enricher.go          # Multi-engine answer fetching
├── selector.go          # Best answer selection
└── scoring.go           # Answer quality scoring
```

**Scoring Factors:**
- Word count (100-300 optimal)
- Has list/steps format
- Source authority
- Readability score

#### Step 6: Add CLI Commands
```bash
gsearch faq "query" --depth 3 --expand
gsearch faq "query" --with-ai-overview --analyze-sources
```

### Validation Checklist
- [ ] AI Overview extraction with 2026 selectors
- [ ] PAA extraction with recursive expansion
- [ ] JSON-LD schema parsing works
- [ ] Answer enrichment from multiple engines
- [ ] Question type classification works
- [ ] Error codes 7720-7739 registered

---

## Phase 4: Contact Extraction

**Spec:** `45-contact-extraction.md`  
**Error Codes:** 7760–7779  
**Estimated Time:** 2-3 days

### Prerequisites
- HTTP client available
- Stealth scraper (optional for JS pages)

### Implementation Steps

#### Step 1: Create Core Types
```
internal/bi/contact/
├── types.go             # ContactInfo, EmailRecord, PhoneRecord, SocialLink
├── request.go           # ContactExtractionRequest
├── response.go          # ContactExtractionResponse
└── enums.go             # EmailType, PhoneType, SocialPlatform
```

#### Step 2: Implement Contact Page Finder
```
internal/bi/contact/
├── finder.go            # ContactPageFinder
├── patterns.go          # URL and link patterns
└── resolver.go          # URL resolution
```

**Contact Page Patterns:**
- /contact, /contact-us, /get-in-touch
- /about, /about-us, /team
- /support, /help

#### Step 3: Implement Email Extractor
```
internal/bi/contact/email/
├── extractor.go         # Email extraction
├── classifier.go        # Email type classification
├── validate.go          # Email validation
└── verify.go            # MX record verification
```

**Email Types:**
- general (info@, contact@)
- support (support@, help@)
- sales (sales@, inquiry@)
- hr (hr@, jobs@, careers@)
- press (press@, media@)
- personal (firstname.lastname@)

#### Step 4: Implement Phone Extractor
```
internal/bi/contact/phone/
├── extractor.go         # Phone extraction
├── normalize.go         # E.164 normalization
└── classify.go          # Phone type classification
```

#### Step 5: Implement Social Extractor
```
internal/bi/contact/social/
├── extractor.go         # Social profile extraction
├── platforms.go         # Platform detection
└── verify.go            # Profile verification
```

**Supported Platforms:**
LinkedIn, Facebook, Twitter/X, Instagram, YouTube, TikTok, Pinterest, WhatsApp, Telegram

#### Step 6: Add CLI Commands
```bash
gsearch contact "https://example.com" --deep --verify
gsearch contact batch --input urls.txt --follow-contact
```

### Validation Checklist
- [ ] Contact page discovery works
- [ ] Email extraction and classification
- [ ] Phone extraction with E.164 normalization
- [ ] All 9 social platforms supported
- [ ] MX record verification works
- [ ] Error codes 7760-7779 registered

---

## Phase 3: SERP Position Tracking

**Spec:** `44-serp-position-tracking.md`  
**Error Codes:** 7740–7759  
**Estimated Time:** 3-4 days

### Prerequisites
- Phase 1 complete (Multi-engine search)
- gocron for scheduling

### Implementation Steps

#### Step 1: Create Core Types
```
internal/bi/serp/
├── types.go             # PositionRecord, PositionHistory, TrackerJob
├── request.go           # SerpRequest
├── response.go          # SerpResponse, SerpPage
└── enums.go             # ResultType, TrendDirection
```

#### Step 2: Implement Page Indexer
```
internal/bi/serp/
├── indexer.go           # PageIndexer (multi-page crawling)
├── finder.go            # PositionFinder
└── parser.go            # SERP result parsing
```

#### Step 3: Implement Tracker System
```
internal/bi/serp/tracker/
├── job.go               # TrackerJob management
├── scheduler.go         # gocron integration
├── history.go           # PositionHistory storage
└── analysis.go          # Trend analysis (linear regression)
```

#### Step 4: Implement Alert Engine
```
internal/bi/serp/alert/
├── engine.go            # Alert processing
├── triggers.go          # Alert trigger types
└── delivery.go          # Webhook delivery
```

**Alert Triggers:**
- position_drop (drops by N positions)
- position_gain (gains by N positions)
- page_change (moves to different page)
- not_found (lost from SERP)
- first_page (reaches page 1)
- position_change (any change)

#### Step 5: Implement Competitor Analysis
```
internal/bi/serp/competitor/
├── discovery.go         # Top-ranking domain identification
├── analysis.go          # Competitive analysis
└── overlap.go           # Domain overlap detection
```

#### Step 6: Add CLI Commands
```bash
gsearch serp check "query" --domain example.com --pages 1-5
gsearch serp track "query" --domain example.com --interval daily
gsearch serp history "query" --domain example.com --days 90
```

### Validation Checklist
- [ ] Multi-page parallel crawling works
- [ ] Domain position discovery accurate
- [ ] Scheduled tracking with gocron
- [ ] History with trend analysis
- [ ] All 6 alert triggers implemented
- [ ] Error codes 7740-7759 registered

---

## Phase 5: Google Maps Search

**Spec:** `46-google-maps-search.md`  
**Error Codes:** 7780–7794  
**Estimated Time:** 3-4 days

### Prerequisites
- Phase 4 complete (Contact extraction)
- Stealth scraper
- gocron for scheduling

### Implementation Steps

#### Step 1: Create Core Types
```
internal/bi/maps/
├── types.go             # Business, BusinessHours, MapsJob
├── request.go           # MapsSearchRequest
├── response.go          # MapsSearchResponse
└── enums.go             # JobStatus, JobPhase
```

#### Step 2: Implement Maps Scraper
```
internal/bi/maps/scraper/
├── scraper.go           # MapsScraper (go-rod)
├── stealth.go           # Anti-detection
├── parser.go            # Business card parsing
└── scroll.go            # Scroll-based pagination
```

#### Step 3: Implement Job Scheduler
```
internal/bi/maps/jobs/
├── manager.go           # Job lifecycle management
├── scheduler.go         # gocron integration
├── queue.go             # Job queue
└── logs.go              # JobLog entries
```

**Job Phases:**
1. Searching (collecting businesses)
2. Enriching (contact extraction)
3. Finishing (cleanup)

#### Step 4: Implement Business Enrichment
```
internal/bi/maps/enrich/
├── enricher.go          # Integration with Phase 4
├── website.go           # Website contact extraction
└── merge.go             # Data merging
```

#### Step 5: Implement Filters
```
internal/bi/maps/filter/
├── rating.go            # Min rating filter
├── reviews.go           # Min reviews filter
├── hours.go             # Open now filter
└── price.go             # Price level filter
```

#### Step 6: Add CLI Commands
```bash
gsearch maps "plumbers" --location "New York" --max 30
gsearch maps job create "dentists" --locations cities.txt --enrich
gsearch maps jobs list --status running
```

### Validation Checklist
- [ ] Maps scraper with scroll pagination
- [ ] Business data extraction complete
- [ ] Job scheduler with 3-phase workflow
- [ ] Contact enrichment integration
- [ ] All filters functional
- [ ] Error codes 7780-7794 registered

---

## Phase 7: Unified REST API

**Spec:** `48-unified-rest-api.md`  
**Error Codes:** 7820–7839  
**Estimated Time:** 3-4 days

### Prerequisites
- All previous phases complete
- Gin framework

### Implementation Steps

#### Step 1: Setup API Server
```
internal/bi/api/
├── server.go            # Server setup
├── config.go            # ApiConfig
├── router.go            # Route registration
└── middleware.go        # Middleware chain
```

**Middleware Stack:**
1. Recovery
2. RequestId
3. Logging
4. CORS
5. Gzip
6. RateLimit
7. Auth

#### Step 2: Implement Authentication
```
internal/bi/api/auth/
├── apikey.go            # API key validation
├── scopes.go            # Scope checking
└── storage.go           # Key storage
```

**Scopes:**
- search:read, search:write
- serp:read, serp:write
- contact:read, contact:write
- maps:read, maps:write
- cache:manage, webhook:manage, admin

#### Step 3: Implement Rate Limiting
```
internal/bi/api/ratelimit/
├── limiter.go           # Token bucket implementation
├── bucket.go            # Rate bucket per key
└── headers.go           # X-RateLimit-* headers
```

#### Step 4: Implement Endpoint Handlers
```
internal/bi/api/handlers/
├── search.go            # /search endpoints
├── faq.go               # /faq endpoints
├── serp.go              # /serp endpoints
├── contact.go           # /contact endpoints
├── maps.go              # /maps endpoints
├── extract.go           # /extract endpoints
├── cache.go             # /cache endpoints
├── webhook.go           # /webhook endpoints
└── health.go            # /health endpoint
```

#### Step 5: Implement Webhooks
```
internal/bi/api/webhook/
├── registry.go          # Webhook registration
├── delivery.go          # HMAC-signed delivery
└── retry.go             # Exponential backoff retry
```

**Webhook Events:**
- serp.alert, serp.complete
- contact.complete, contact.batch.complete
- maps.progress, maps.complete, maps.error

#### Step 6: Generate OpenAPI Spec
```
internal/bi/api/docs/
├── openapi.go           # OpenAPI 3.1 generation
├── schemas.go           # Schema definitions
└── examples.go          # Request/response examples
```

### Validation Checklist
- [ ] All endpoint groups implemented
- [ ] API key authentication works
- [ ] Rate limiting with headers
- [ ] All 11 scopes enforced
- [ ] Webhook delivery with HMAC signing
- [ ] OpenAPI 3.1 spec generated
- [ ] Error codes 7820-7839 registered

---

## Phase 8: Testing UI

**Spec:** `49-testing-ui.md`  
**Error Codes:** N/A (frontend)  
**Estimated Time:** 2-3 days

### Prerequisites
- Phase 7 complete (REST API)
- React + shadcn/ui

### Implementation Steps

#### Step 1: Create Layout Components
```
src/components/bi-testing/
├── BiTestingLayout.tsx
├── EndpointSidebar.tsx
├── RequestBuilder.tsx
└── ResponseViewer.tsx
```

#### Step 2: Create Supporting Components
```
src/components/bi-testing/components/
├── EndpointCard.tsx
├── ParamInput.tsx
├── JsonEditor.tsx
├── ResponseTabs.tsx
├── StatusBadge.tsx
├── MethodBadge.tsx
├── CopyButton.tsx
└── CodeBlock.tsx
```

#### Step 3: Create Hooks
```
src/hooks/bi-testing/
├── useApiRequest.ts
├── useRequestHistory.ts
├── useOpenApiSpec.ts
├── useAuthStorage.ts
└── useEndpointSchema.ts
```

#### Step 4: Create Support Files
```
src/lib/bi-testing/
├── endpoint-registry.ts
├── request-builder.ts
└── response-parser.ts

src/types/
└── bi-testing.ts
```

#### Step 5: Create Page
```
src/pages/
└── BiTestingUI.tsx
```

### Validation Checklist
- [ ] Resizable 3-panel layout works
- [ ] All endpoint groups in sidebar
- [ ] Request builder with tabs (params, query, body, headers, auth)
- [ ] Response viewer with syntax highlighting
- [ ] Request history with replay
- [ ] API key management
- [ ] OpenAPI documentation integration

---

## Testing Strategy

### Unit Tests
- Test each extractor independently
- Mock HTTP responses
- Verify error code mapping

### Integration Tests
- Test full pipeline (search → enrich → format)
- Verify cache behavior
- Test API endpoints

### E2E Tests
- Use real search engines (rate-limited)
- Verify data quality
- Test UI workflows

---

## Deployment Checklist

1. **Environment Variables**
   - SERPAPI_KEY, SERPER_KEY, SEARCHAPI_KEY
   - AZURE_SEARCH_KEY
   - API_SECRET (for API key hashing)

2. **Database Migrations**
   - Run Split DB migrations
   - Seed TTL policies

3. **Rate Limit Configuration**
   - Configure per-key limits
   - Set global fallback limits

4. **Monitoring**
   - API response time metrics
   - Cache hit rate
   - Error rate by code

---

## Cross-References

| Reference | Location |
|-----------|----------|
| BI Suite Summary | `40-bi-suite-summary.md` |
| Error Codes | `50-bi-error-codes.md` |
| Validation Checklist | `51-bi-validation-checklist.md` |
| Split DB Architecture | `spec/06-split-db-architecture/` |
