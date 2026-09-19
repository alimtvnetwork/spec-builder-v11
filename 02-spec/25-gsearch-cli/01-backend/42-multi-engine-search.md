# GSearch Multi-Engine Search Specification

> **Phase:** 1 of 7  
> **Status:** Draft  
> **Created:** 2026-02-04  
**Version:** 1.0.0  
> **Parent:** `41-business-intelligence-plan.md`

---

## 1. Overview

A pluggable multi-engine search system supporting Google, Bing, and DuckDuckGo with automatic API rotation, fallback strategies, and unified response normalization.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Search Orchestrator                       │
├─────────────────────────────────────────────────────────────┤
│  Request Parser → Engine Router → Result Aggregator → Cache │
└───────────┬─────────────┬─────────────┬─────────────────────┘
            │             │             │
     ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
     │   Google    │ │  Bing   │ │ DuckDuckGo  │
     │   Adapter   │ │ Adapter │ │   Adapter   │
     └──────┬──────┘ └────┬────┘ └──────┬──────┘
            │             │             │
     ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
     │ API Pool    │ │ API Pool│ │ Scraper     │
     │ - SerpApi   │ │ - Azure │ │ - HTML Parse│
     │ - SearchApi │ │ - Bing  │ │             │
     │ - Scraper   │ │ - Scrape│ │             │
     └─────────────┘ └─────────┘ └─────────────┘
```

---

## 3. CLI Interface

### 3.1 Basic Commands

```bash
# Single engine (default: Google)
gsearch search "plumber NYC"

# Specify engine
gsearch search "plumber NYC" --engine google
gsearch search "plumber NYC" --engine bing
gsearch search "plumber NYC" --engine duckduckgo

# Multiple engines
gsearch search "plumber NYC" --engines google,bing
gsearch search "plumber NYC" --engines all

# Method selection
gsearch search "plumber NYC" --method api      # Prefer API
gsearch search "plumber NYC" --method scrape   # Force scraping
gsearch search "plumber NYC" --method auto     # Smart selection (default)
```

### 3.2 Advanced Options

```bash
# Result handling
gsearch search "keyword" --engines google,bing --merge        # Dedupe & merge
gsearch search "keyword" --engines google,bing --separate     # Keep separate
gsearch search "keyword" --limit 50                           # Results per engine
gsearch search "keyword" --pages 1-3                          # SERP pages

# Caching
gsearch search "keyword" --cache-days 5                       # Custom TTL
gsearch search "keyword" --force                              # Bypass cache
gsearch search "keyword" --cache-only                         # Only cached

# Output
gsearch search "keyword" --output json                        # JSON (default)
gsearch search "keyword" --output table                       # CLI table
gsearch search "keyword" --output csv                         # CSV export

# Filtering
gsearch search "keyword" --site example.com                   # Site-specific
gsearch search "keyword" --exclude pinterest.com,facebook.com
gsearch search "keyword" --date-range 7d                      # Last 7 days
gsearch search "keyword" --region us                          # Geographic
gsearch search "keyword" --language en                        # Language
```

---

## 4. Engine Adapters

### 4.1 Adapter Interface

```go
type SearchEngine interface {
    Name() string
    Search(context stdctx.Context, req SearchRequest) apperror.Result[SearchResponse]
    IsAvailable() bool
    RateLimit() RateLimitConfig
}

type SearchRequest struct {
    Query       string
    Limit       int
    Page        int
    Site        string
    ExcludeSites []string
    DateRange   string      // "24h", "7d", "30d", "1y"
    Region      string      // ISO country code
    Language    string      // ISO language code
    Method      MethodType  // api, scrape, auto
}

type SearchResponse struct {
    Engine      string
    Results     []SearchResult
    TotalFound  int64
    SearchTime  time.Duration
    FromCache   bool
    Method      string  // Which method was actually used
}

type SearchResult struct {
    Position    int
    Url         string
    Title       string
    Snippet     string
    DisplayUrl  string
    Favicon     string
    SiteLinks   []SiteLink  // Optional nested links
    RichData    *RichData   // FAQs, ratings, etc.
    CapturedAt  time.Time
}
```

### 4.2 Google Adapter

```go
type GoogleAdapter struct {
    apiPool     *ApiPool
    scraper     *StealthScraper
    rateLimiter *RateLimiter
}

// API providers in priority order
var googleApis = []ApiProvider{
    {Name: "serpapi", BaseUrl: "https://serpapi.com/search", KeyEnv: "SERPAPI_KEY"},
    {Name: "serper", BaseUrl: "https://google.serper.dev/search", KeyEnv: "SERPER_KEY"},
    {Name: "searchapi", BaseUrl: "https://searchapi.io/api/v1/search", KeyEnv: "SEARCHAPI_KEY"},
    {Name: "valueserp", BaseUrl: "https://api.valueserp.com/search", KeyEnv: "VALUESERP_KEY"},
}
```

### 4.3 Bing Adapter

```go
type BingAdapter struct {
    apiPool     *ApiPool
    scraper     *StealthScraper
    rateLimiter *RateLimiter
}

var bingApis = []ApiProvider{
    {Name: "azure", BaseUrl: "https://api.bing.microsoft.com/v7.0/search", KeyEnv: "AZURE_SEARCH_KEY"},
    {Name: "serpapi", BaseUrl: "https://serpapi.com/search?engine=bing", KeyEnv: "SERPAPI_KEY"},
}
```

### 4.4 DuckDuckGo Adapter

```go
type DuckDuckGoAdapter struct {
    scraper *StealthScraper  // No official API
}

// DuckDuckGo only supports scraping
// Use instant answer API for quick facts: https://api.duckduckgo.com/
```

---

## 5. API Pool & Rotation

### 5.1 Pool Manager

```go
type ApiPool struct {
    providers   []ApiProvider
    usage       map[string]*UsageStats
    mu          sync.RWMutex
}

type ApiProvider struct {
    Name        string
    BaseUrl     string
    KeyEnv      string
    Priority    int         // Lower = higher priority
    DailyLimit  int         // 0 = unlimited
    MonthlyLimit int
    RatePerMin  int
}

type UsageStats struct {
    DailyCount    int
    MonthlyCount  int
    LastUsed      time.Time
    LastError     time.Time
    ErrorCount    int
    Healthy       bool
}

// Selection algorithm
func (p *ApiPool) SelectProvider() apperror.Result[*ApiProvider] {
    p.mu.RLock()
    defer p.mu.RUnlock()
    
    // Sort by: healthy > under-limit > priority > least-recently-used
    candidates := p.getHealthyCandidates()
    if len(candidates) == 0 {
        return apperror.Fail[*ApiProvider](
            apperror.New(
                "E5010",
                "no available providers",
            ),
        )
    }
    
    // Weighted random selection among healthy providers
    return apperror.Ok(p.weightedSelect(candidates))
}
```

### 5.2 Fallback Strategy

```go
type FallbackStrategy int

const (
    FallbackNone     FallbackStrategy = iota  // Fail if selected fails
    FallbackNext                              // Try next in priority
    FallbackScrape                            // Fallback to scraping
    FallbackAll                               // Try all until success
)

// Default: FallbackScrape
func (a *GoogleAdapter) Search(context stdctx.Context, req SearchRequest) apperror.Result[SearchResponse] {
    // 1. Try API pool
    if req.Method != MethodScrape {
        resp := a.tryApiPool(context, req)
        if resp.IsSuccess() {
            return resp
        }

        log.Warn("API pool exhausted, falling back to scraper", "error", resp.Error())
    }
    
    // 2. Fallback to scraping
    if req.Method != MethodApi {
        return a.scraper.Search(context, req)
    }
    
    return apperror.Fail[SearchResponse](
        apperror.New(
            "E5011",
            "search failed: all methods exhausted",
        ),
    )
}
```

---

## 6. Stealth Scraper

### 6.1 Configuration

```go
type StealthScraper struct {
    browser     *rod.Browser
    stealth     *stealth.Plugin
    proxyPool   *ProxyPool
    userAgents  []string
    rateLimit   *RateLimiter
}

type ScraperConfig struct {
    Headless        bool          // Default: true
    ProxyEnabled    bool          // Default: false
    RotateUserAgent bool          // Default: true
    MinDelay        time.Duration // Default: 2s
    MaxDelay        time.Duration // Default: 5s
    MaxRetries      int           // Default: 3
    Timeout         time.Duration // Default: 30s
}
```

### 6.2 Anti-Detection Measures

```go
func (s *StealthScraper) Search(context stdctx.Context, req SearchRequest) apperror.Result[SearchResponse] {
    page := s.browser.MustPage()
    defer page.Close()
    
    // 1. Apply stealth patches
    s.stealth.MustApply(page)
    
    // 2. Randomize viewport
    page.MustSetViewport(randomViewport())
    
    // 3. Set random user agent
    page.MustSetUserAgent(s.randomUserAgent())
    
    // 4. Add human-like delays
    time.Sleep(randomDelay(s.config.MinDelay, s.config.MaxDelay))
    
    // 5. Navigate and parse
    searchUrl := s.buildSearchUrl(req)
    page.MustNavigate(searchUrl).MustWaitLoad()
    
    // 6. Check for CAPTCHA
    if s.detectCaptcha(page) {
        return apperror.Fail[SearchResponse](
            apperror.New(
                "E5001",
                "CAPTCHA detected during stealth scraping",
            ),
        )
    }
    
    return s.parseResults(page)
}
```

---

## 7. Result Aggregation

### 7.1 Merge Strategy

```go
type MergeStrategy int

const (
    MergeInterleave  MergeStrategy = iota  // Round-robin from each engine
    MergeRankBased                         // By position across engines
    MergeScoreBased                        // By computed relevance score
)

type Aggregator struct {
    strategy    MergeStrategy
    dedupeField string  // "url" or "domain"
}

func (a *Aggregator) Merge(responses []*SearchResponse) *AggregatedResponse {
    seen := make(map[string]bool)
    merged := []AggregatedResult{}
    
    for _, r := range a.interleave(responses) {
        key := a.dedupeKey(r)
        if seen[key] {
            continue
        }
        seen[key] = true
        
        merged = append(merged, AggregatedResult{
            SearchResult: r,
            Engines:      a.findEngines(r.Url, responses),
            AggScore:     a.computeScore(r, responses),
        })
    }
    
    return &AggregatedResponse{
        Results:     merged,
        EngineStats: a.computeStats(responses),
    }
}
```

### 7.2 Aggregated Response

```go
type AggregatedResponse struct {
    Query       string
    Results     []AggregatedResult
    EngineStats map[string]EngineStats
    TotalTime   time.Duration
    FromCache   bool
}

type AggregatedResult struct {
    SearchResult
    Engines     []string    // Which engines returned this
    AggScore    float64     // Aggregated relevance score
    Consensus   int         // Number of engines agreeing
}

type EngineStats struct {
    Engine      string
    ResultCount int
    SearchTime  time.Duration
    Method      string
    FromCache   bool
    Error       string
}
```

---

## 8. Caching

### 8.1 Cache Schema

```sql
-- Root DB: data/{appName}/rag/search/registry.db
CREATE TABLE SearchQueries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT UNIQUE NOT NULL,        -- SHA256 of normalized query
    query_raw TEXT NOT NULL,
    engines TEXT NOT NULL,                  -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME,
    access_count INTEGER DEFAULT 0
);

-- Session DB: data/{appName}/rag/search/cache/{query-hash}.db
CREATE TABLE Results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine TEXT NOT NULL,
    position INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    snippet TEXT,
    display_url TEXT,
    favicon TEXT,
    rich_data TEXT,                         -- JSON
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ttl_expires DATETIME NOT NULL
);

CREATE INDEX IdxResultsEngine ON Results(engine);
CREATE INDEX IdxResultsUrl ON Results(url);
CREATE INDEX IdxResultsTtl ON Results(ttl_expires);
```

### 8.2 Cache Logic

```go
type SearchCache struct {
    rootDb    *sql.DB
    cacheDir  string
    defaultTTL time.Duration
}

func (c *SearchCache) Get(req SearchRequest) apperror.Result[CachedResponse] {
    hash := c.computeHash(req)
    
    // Check if cache exists and is valid
    sessionDb := c.openSessionDb(hash)
    if sessionDb == nil {
        return apperror.Fail[CachedResponse](
            apperror.New(
                "E8001",
                "cache miss",
            ),
        )
    }
    
    // Check TTL
    resultsResult := c.loadResults(sessionDb, req.Engines)
    if resultsResult.HasError() {
        return apperror.Fail[CachedResponse](resultsResult.Error())
    }

    results := resultsResult.Value()
    
    if c.isExpired(results) {
        return apperror.Fail[CachedResponse](
            apperror.New(
                "E8002",
                "cache expired",
            ),
        )
    }
    
    return apperror.Ok(CachedResponse{Results: results, FromCache: true})
}

func (c *SearchCache) Set(req SearchRequest, resp *SearchResponse) *apperror.AppError {
    hash := c.computeHash(req)
    
    // Register in root DB
    c.registerQuery(hash, req)
    
    // Store results in session DB
    sessionDb := c.createSessionDb(hash)

    return c.storeResults(sessionDb, resp, c.defaultTTL)
}
```

---

## 9. Configuration

### 9.1 Seedable Config

```yaml
# config/gsearch.seed.yaml
search:
  default_engine: google
  default_method: auto
  default_limit: 10
  
  engines:
    google:
      enabled: true
      priority: 1
      apis:
        - name: serpapi
          priority: 1
          daily_limit: 100
          rate_per_min: 10
        - name: serper
          priority: 2
          daily_limit: 2500
          rate_per_min: 50
      scraper:
        enabled: true
        fallback_only: true
        
    bing:
      enabled: true
      priority: 2
      apis:
        - name: azure
          priority: 1
          monthly_limit: 1000
          rate_per_min: 10
      scraper:
        enabled: true
        fallback_only: true
        
    duckduckgo:
      enabled: true
      priority: 3
      scraper:
        enabled: true
        min_delay_ms: 3000
        max_delay_ms: 6000
  
  cache:
    ttl_days: 5
    max_size_mb: 500
    cleanup_interval: 24h
    
  scraper:
    headless: true
    proxy_enabled: false
    rotate_user_agent: true
    min_delay_ms: 2000
    max_delay_ms: 5000
    max_retries: 3
    timeout_seconds: 30
  
  aggregation:
    merge_strategy: interleave  # interleave, rank, score
    dedupe_field: url           # url, domain
```

---

## 10. Error Handling

### 10.1 Error Codes (7700-7719)

| Code | Constant | Description |
|------|----------|-------------|
| 7700 | `ErrSearchInvalidQuery` | Empty or malformed query |
| 7701 | `ErrSearchEngineUnknown` | Unknown engine specified |
| 7702 | `ErrSearchNoProviders` | No API providers available |
| 7703 | `ErrSearchApiFailed` | All APIs failed for engine |
| 7704 | `ErrSearchScrapeFailed` | Scraper failed |
| 7705 | `ErrSearchCaptcha` | CAPTCHA detected |
| 7706 | `ErrSearchRateLimit` | Rate limit exceeded |
| 7707 | `ErrSearchTimeout` | Request timeout |
| 7708 | `ErrSearchProxyFailed` | Proxy connection failed |
| 7709 | `ErrSearchCacheFailed` | Cache read/write error |
| 7710 | `ErrSearchAggregation` | Result aggregation failed |
| 7711 | `ErrSearchConfigInvalid` | Invalid configuration |

### 10.2 Retry Logic

```go
type RetryConfig struct {
    MaxRetries      int
    BaseDelay       time.Duration
    MaxDelay        time.Duration
    RetryableErrors []int  // Error codes to retry
}

var defaultRetryConfig = RetryConfig{
    MaxRetries:      3,
    BaseDelay:       1 * time.Second,
    MaxDelay:        30 * time.Second,
    RetryableErrors: []int{7703, 7704, 7706, 7707, 7708},
}

func (a *Adapter) searchWithRetry(context stdctx.Context, req SearchRequest) apperror.Result[*SearchResponse] {
    var lastErr error
    
    for attempt := 0; attempt <= a.retry.MaxRetries; attempt++ {
        resp, err := a.doSearch(context, req)
        if err == nil {
            return resp, nil
        }
        
        lastErr = err
        if !a.isRetryable(err) {
            break
        }
        
        delay := a.calculateBackoff(attempt)
        select {
        case <-context.Done():
            return nil, context.Err()
        case <-time.After(delay):
            continue
        }
    }
    
    return nil, lastErr
}
```

---

## 11. JSON Response Schema

### 11.1 Single Engine Response

```json
{
  "success": true,
  "query": "plumber NYC",
  "engine": "google",
  "method": "api",
  "from_cache": false,
  "search_time_ms": 245,
  "total_found": 12400000,
  "results": [
    {
      "position": 1,
      "url": "https://example.com/plumber",
      "title": "Best Plumbers in NYC | 24/7 Service",
      "snippet": "Professional plumbing services in New York City...",
      "display_url": "example.com › plumber",
      "favicon": "https://example.com/favicon.ico",
      "site_links": [
        {"title": "Emergency", "url": "https://example.com/emergency"},
        {"title": "Prices", "url": "https://example.com/prices"}
      ],
      "rich_data": {
        "rating": 4.8,
        "reviews": 234,
        "price_range": "$$"
      }
    }
  ]
}
```

### 11.2 Multi-Engine Aggregated Response

```json
{
  "success": true,
  "query": "plumber NYC",
  "engines": ["google", "bing"],
  "merge_strategy": "interleave",
  "from_cache": false,
  "total_time_ms": 523,
  "results": [
    {
      "position": 1,
      "url": "https://example.com/plumber",
      "title": "Best Plumbers in NYC",
      "snippet": "Professional plumbing services...",
      "engines": ["google", "bing"],
      "consensus": 2,
      "agg_score": 0.95,
      "positions": {
        "google": 1,
        "bing": 2
      }
    }
  ],
  "engine_stats": {
    "google": {
      "result_count": 10,
      "search_time_ms": 245,
      "method": "api",
      "from_cache": false
    },
    "bing": {
      "result_count": 10,
      "search_time_ms": 312,
      "method": "api",
      "from_cache": false
    }
  }
}
```

---

## 12. API Endpoint

### 12.1 REST API

```
POST /api/v1/search
Content-Type: application/json

{
  "query": "plumber NYC",
  "engines": ["google", "bing"],
  "method": "auto",
  "options": {
    "limit": 20,
    "pages": [1, 2],
    "merge": true,
    "dedupe": true,
    "site": null,
    "exclude_sites": ["pinterest.com"],
    "date_range": "30d",
    "region": "us",
    "language": "en"
  },
  "cache": {
    "enabled": true,
    "ttl_days": 5,
    "force_refresh": false
  }
}
```

### 12.2 Response Codes

| HTTP | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid request parameters |
| 429 | Rate limit exceeded |
| 500 | Internal error |
| 503 | All engines unavailable |

---

## 13. Testing

### 13.1 Unit Tests

```go
func TestGoogleAdapter_Search(t *testing.T) {
    tests := []struct {
        name    string
        req     SearchRequest
        mockApi func(*MockApiPool)
        want    *SearchResponse
        wantErr error
    }{
        {
            name: "successful API search",
            req:  SearchRequest{Query: "test", Method: MethodApi},
            mockApi: func(m *MockApiPool) {
                m.On("Search").Return(mockResults, nil)
            },
            want: &SearchResponse{Results: mockResults},
        },
        {
            name: "fallback to scrape on API failure",
            req:  SearchRequest{Query: "test", Method: MethodAuto},
            mockApi: func(m *MockApiPool) {
                m.On("Search").Return(nil, ErrApiFailed)
            },
            want: &SearchResponse{Method: "scrape"},
        },
    }
    // ...
}
```

### 13.2 Integration Tests

```go
func TestMultiEngineSearch_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }
    
    orchestrator := NewSearchOrchestrator(testConfig)
    
    resp, err := orchestrator.Search(context.Background(), SearchRequest{
        Query:   "golang tutorial",
        Engines: []string{"google", "bing", "duckduckgo"},
        Limit:   5,
    })
    
    require.NoError(t, err)
    assert.GreaterOrEqual(t, len(resp.Results), 5)
    assert.Contains(t, resp.EngineStats, "google")
}
```

---

## 14. Related Files

- Plan: `41-business-intelligence-plan.md`
- Phase 2: `43-faq-discovery-ai-overview.md`
- Error Codes: `05-error-codes.md`
- Caching: `10-caching-system.md`
