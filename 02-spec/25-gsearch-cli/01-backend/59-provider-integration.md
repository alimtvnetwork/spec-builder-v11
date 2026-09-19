# GSearch Multi-Provider SERP Integration Specification

> **Phase:** 4 of 7  
> **Status:** Draft  
> **Created:** 2026-02-05  
**Version:** 1.0.0  
> **Error Range:** 7920-7949  
> **Depends On:** `58-enum-architecture.md`, `44-serp-position-tracking.md`  
> **Parent:** `00-overview.md`

---

## 1. Overview

Multi-provider SERP integration system supporting SerpApi, Maps Scraper (gosom), and Colly with parallel execution capabilities. Results are stored in the Split DB architecture for persistence and caching.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Provider Orchestrator                           │
├─────────────────────────────────────────────────────────────────────┤
│  Request Router → Provider Selector → Parallel Executor → Aggregator │
└────────┬──────────────┬───────────────────┬─────────────────────────┘
         │              │                   │
   ┌─────▼─────┐  ┌─────▼─────┐       ┌─────▼─────┐
   │  SerpApi  │  │   Maps    │       │   Colly   │
   │  Provider │  │  Scraper  │       │  Provider │
   └─────┬─────┘  └─────┬─────┘       └─────┬─────┘
         │              │                   │
   ┌─────▼──────────────▼───────────────────▼─────┐
   │              Result Normalizer                │
   │  (Unified response format, deduplication)     │
   └───────────────────────┬───────────────────────┘
                           │
   ┌───────────────────────▼───────────────────────┐
   │              Split DB Storage                  │
   │  data/{app}/serp/{provider}/{hash}.db         │
   └───────────────────────────────────────────────┘
```

---

## 2. Provider Interface

```go
package provider

import (
    stdctx "context"
    "gsearch/internal/enums/providertype"
)

// Provider defines the interface all SERP providers must implement
type Provider interface {
    // Name returns the provider variant
    Name() provider.Variant
    
    // Search executes a search query
    Search(context stdctx.Context, req *SearchRequest) appfault.Result[*SearchResponse]
    
    // SearchParallel executes multiple searches in parallel
    SearchParallel(context stdctx.Context, reqs []*SearchRequest) appfault.Result[[]*SearchResponse]
    
    // HealthCheck verifies provider connectivity
    HealthCheck(context stdctx.Context) *appfault.AppError
    
    // RateLimit returns current rate limit status
    RateLimit() *RateLimitStatus
    
    // Close cleans up resources
    Close() *appfault.AppError
}

// SearchRequest represents a unified search request
type SearchRequest struct {
    Id              string                  // Request ID for tracking
    Query           string                  // Search query
    Engine          engine.Variant          // Target engine
    Platforms       []platform.Variant      // Target platforms
    Pages           []int                   // Pages to fetch
    MaxResults      int                     // Max results per page
    Region          string                  // Geographic region
    Language        string                  // Language code
    Device          device.Variant          // Device type
    IncludeAds      bool                    // Include paid results
    IncludeMaps     bool                    // Include local pack
    Timeout         time.Duration           // Request timeout
    CacheStrategy   cache.Variant           // Cache behavior
}

// SearchResponse represents a unified search response
type SearchResponse struct {
    RequestId       string                  // Original request ID
    Provider        provider.Variant        // Provider used
    Query           string                  // Original query
    Engine          engine.Variant          // Engine used
    Results         []SearchResult          // Search results
    TotalResults    int64                   // Total available results
    Pages           map[int]*PageResults    // Results by page
    LocalPack       []LocalResult           // Local/maps results
    Ads             []AdResult              // Paid results
    FeaturedSnippet *FeaturedSnippet        // Featured snippet if present
    RelatedSearches []string                // Related searches
    Duration        time.Duration           // Request duration
    FromCache       bool                    // Served from cache
    CapturedAt      time.Time               // Capture timestamp
    Metadata        *ProviderMetadata      // Provider-specific metadata
}

// ProviderMetadata holds provider-specific result context
type ProviderMetadata struct {
    ProviderName string `json:",omitempty"`
    RequestId    string `json:",omitempty"`
    CacheKey     string `json:",omitempty"`
    ApiVersion   string `json:",omitempty"`
}

// RateLimitStatus represents rate limiting state
type RateLimitStatus struct {
    Remaining   int           // Requests remaining
    ResetAt     time.Time     // When limit resets
    Limit       int           // Total limit
    IsLimited   bool          // Currently rate limited
}
```

---

## 3. Provider Implementations

### 3.1 SerpApi Provider

```go
package serpapi

import (
    stdctx "context"
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "sync"
    "time"
    
    "gsearch/internal/enums/providertype"
    serpProvider "gsearch/internal/provider"
)

type SerpApiProvider struct {
    apiKey      string
    httpClient  *http.Client
    baseUrl     string
    rateLimiter *rate.Limiter
    mu          sync.RWMutex
    rateStatus  *serpProvider.RateLimitStatus
}

type SerpApiConfig struct {
    ApiKey          string
    BaseUrl         string        // Default: https://serpapi.com/search
    Timeout         time.Duration // Default: 30s
    MaxConcurrent   int           // Default: 5
    RequestsPerMin  int           // Default: 100
}

func NewSerpApiProvider(cfg *SerpApiConfig) appfault.Result[*SerpApiProvider] {
    if cfg.ApiKey == "" {
        return appfault.Fail[*SerpApiProvider](
            appfault.New(
                "SerpApi API key required",
            ),
        )
    }
    
    if cfg.BaseUrl == "" {
        cfg.BaseUrl = "https://serpapi.com/search"
    }
    if cfg.Timeout == 0 {
        cfg.Timeout = 30 * time.Second
    }
    if cfg.RequestsPerMin == 0 {
        cfg.RequestsPerMin = 100
    }
    
    return appfault.Ok(&SerpApiProvider{
        apiKey:  cfg.ApiKey,
        baseUrl: cfg.BaseUrl,
        httpClient: &http.Client{
            Timeout: cfg.Timeout,
        },
        rateLimiter: rate.NewLimiter(
            rate.Every(time.Minute/time.Duration(cfg.RequestsPerMin)),
            cfg.MaxConcurrent,
        ),
        rateStatus: &serpProvider.RateLimitStatus{
            Remaining: cfg.RequestsPerMin,
            Limit:     cfg.RequestsPerMin,
        },
    })
}

func (p *SerpApiProvider) Name() provider.Variant {
    return provider.SerpApi
}

func (p *SerpApiProvider) Search(context stdctx.Context, req *serpProvider.SearchRequest) appfault.Result[*serpProvider.SearchResponse] {
    // Wait for rate limiter
    if err := p.rateLimiter.Wait(context); err != nil {
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.Wrap(
                err,
                "rate limit wait",
            ),
        )
    }
    
    startTime := time.Now()
    
    // Build query params
    params := url.Values{}
    params.Set("api_key", p.apiKey)
    params.Set("q", req.Query)
    params.Set("engine", p.mapEngine(req.Engine))
    params.Set("device", string(req.Device))
    params.Set("hl", req.Language)
    params.Set("gl", req.Region)
    params.Set("num", fmt.Sprintf("%d", req.MaxResults))
    
    // Execute request
    reqUrl := fmt.Sprintf("%s?%s", p.baseUrl, params.Encode())
    httpReq, err := http.NewRequestWithContext(context, httpmethod.Get.String(), reqUrl, nil)
    if err != nil {
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.Wrap(
                err,
                "create request",
            ),
        )
    }
    
    resp, err := p.httpClient.Do(httpReq)
    if err != nil {
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.Wrap(
                err,
                "execute request",
            ),
        )
    }
    defer resp.Body.Close()
    
    // Update rate limit status from headers
    p.updateRateLimitFromHeaders(resp.Header)
    
    if resp.StatusCode != http.StatusOK {
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.New(
                fmt.Sprintf("SerpApi error: status %d", resp.StatusCode),
            ),
        )
    }
    
    // Parse response
    var serpResp SerpApiResponse
    if err := json.NewDecoder(resp.Body).Decode(&serpResp); err != nil {
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.Wrap(
                err,
                "decode response",
            ),
        )
    }
    
    // Convert to unified format
    return appfault.Ok(p.convertToUnified(req, &serpResp, time.Since(startTime)))
}

func (p *SerpApiProvider) SearchParallel(context stdctx.Context, reqs []*serpProvider.SearchRequest) appfault.Result[[]*serpProvider.SearchResponse] {
    results := make([]*serpProvider.SearchResponse, len(reqs))
    var wg sync.WaitGroup
    errChan := make(chan *appfault.AppError, len(reqs))
    
    for i, req := range reqs {
        wg.Add(1)
        go func(idx int, r *serpProvider.SearchRequest) {
            defer wg.Done()
            
            searchResult := p.Search(context, r)
            if searchResult.HasError() {
                errChan <- searchResult.Error()
                return
            }

            results[idx] = searchResult.Value()
        }(i, req)
    }
    
    wg.Wait()
    close(errChan)
    
    // Collect errors
    var errs []*appfault.AppError
    for err := range errChan {
        errs = append(errs, err)
    }
    
    if len(errs) == len(reqs) {
        return appfault.Fail[[]*serpProvider.SearchResponse](
            appfault.New(
                "all requests failed",
            ),
        )
    }
    
    return appfault.Ok(results)
}

func (p *SerpApiProvider) HealthCheck(context stdctx.Context) *appfault.AppError {
    // Simple search to verify connectivity
    searchResult := p.Search(context, &serpProvider.SearchRequest{
        Query:      "test",
        MaxResults: 1,
    })
    if searchResult.HasError() {
        return searchResult.Error()
    }

    return nil
}

func (p *SerpApiProvider) RateLimit() *serpProvider.RateLimitStatus {
    p.mu.RLock()
    defer p.mu.RUnlock()

    return p.rateStatus
}

func (p *SerpApiProvider) Close() *appfault.AppError {
    return nil
}
```

### 3.2 Maps Scraper Provider (gosom)

```go
package mapsscraper

import (
    stdctx "context"
    "sync"
    "time"
    
    "github.com/gosom/google-maps-scraper/gmaps"
    "gsearch/internal/enums/providertype"
    serpProvider "gsearch/internal/provider"
)

type MapsScraperProvider struct {
    scraper     *gmaps.Scraper
    config      *MapsScraperConfig
    mu          sync.RWMutex
    rateStatus  *serpProvider.RateLimitStatus
}

type MapsScraperConfig struct {
    Concurrency     int           // Default: 10
    Timeout         time.Duration // Default: 60s
    MaxRetries      int           // Default: 3
    ProxyUrl        string        // Optional proxy
    UserAgent       string        // Custom user agent
}

func NewMapsScraperProvider(cfg *MapsScraperConfig) appfault.Result[*MapsScraperProvider] {
    if cfg.Concurrency == 0 {
        cfg.Concurrency = 10
    }
    if cfg.Timeout == 0 {
        cfg.Timeout = 60 * time.Second
    }
    if cfg.MaxRetries == 0 {
        cfg.MaxRetries = 3
    }
    
    scraperCfg := gmaps.ScraperConfig{
        Concurrency: cfg.Concurrency,
        ProxyUrl:    cfg.ProxyUrl,
    }
    
    scraper, err := gmaps.NewScraper(scraperCfg)
    if err != nil {
        return appfault.Fail[*MapsScraperProvider](
            appfault.Wrap(
                err,
                "create scraper",
            ),
        )
    }
    
    return appfault.Ok(&MapsScraperProvider{
        scraper: scraper,
        config:  cfg,
        rateStatus: &serpProvider.RateLimitStatus{
            Remaining: 1000, // No hard limit
            Limit:     1000,
        },
    })
}

func (p *MapsScraperProvider) Name() provider.Variant {
    return provider.MapsScraper
}

func (p *MapsScraperProvider) Search(context stdctx.Context, req *serpProvider.SearchRequest) appfault.Result[*serpProvider.SearchResponse] {
    startTime := time.Now()
    
    // Build Maps search request
    mapsReq := gmaps.SearchRequest{
        Query:   req.Query,
        Lang:    req.Language,
        Zoom:    15,
        MaxResults: req.MaxResults,
    }
    
    if req.Region != "" {
        mapsReq.Coords = p.regionToCoords(req.Region)
    }
    
    // Execute scrape with timeout
    searchContext, cancel := stdctx.WithTimeout(context, p.config.Timeout)
    defer cancel()
    
    places, err := p.scraper.Search(searchContext, mapsReq)
    if err != nil {
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.Wrap(
                err,
                "maps scrape",
            ),
        )
    }
    
    // Convert to unified format
    response := &serpProvider.SearchResponse{
        RequestId:  req.Id,
        Provider:   provider.MapsScraper,
        Query:      req.Query,
        LocalPack:  make([]serpProvider.LocalResult, 0, len(places)),
        Duration:   time.Since(startTime),
        CapturedAt: time.Now(),
    }
    
    for i, place := range places {
        response.LocalPack = append(response.LocalPack, serpProvider.LocalResult{
            Position:    i + 1,
            Name:        place.Name,
            Address:     place.Address,
            Phone:       place.Phone,
            Rating:      place.Rating,
            Reviews:     place.ReviewCount,
            Category:    place.Category,
            PlaceId:     place.PlaceId,
            Website:     place.Website,
            Coordinates: &serpProvider.Coordinates{
                Lat: place.Lat,
                Lng: place.Lng,
            },
        })
    }
    
    response.TotalResults = int64(len(places))

    return appfault.Ok(response)
}

func (p *MapsScraperProvider) SearchParallel(context stdctx.Context, reqs []*serpProvider.SearchRequest) appfault.Result[[]*serpProvider.SearchResponse] {
    // Maps scraper already supports internal concurrency
    results := make([]*serpProvider.SearchResponse, len(reqs))
    var wg sync.WaitGroup
    errChan := make(chan *appfault.AppError, len(reqs))
    
    // Use semaphore to limit concurrent scrapes
    sem := make(chan struct{}, p.config.Concurrency)
    
    for i, req := range reqs {
        wg.Add(1)
        go func(idx int, r *serpProvider.SearchRequest) {
            defer wg.Done()
            
            sem <- struct{}{}
            defer func() { <-sem }()
            
            searchResult := p.Search(context, r)
            if searchResult.HasError() {
                errChan <- searchResult.Error()
                return
            }

            results[idx] = searchResult.Value()
        }(i, req)
    }
    
    wg.Wait()
    close(errChan)
    
    return appfault.Ok(results)
}

func (p *MapsScraperProvider) HealthCheck(context stdctx.Context) *appfault.AppError {
    searchResult := p.Search(context, &serpProvider.SearchRequest{
        Query:      "coffee shop",
        MaxResults: 1,
    })
    if searchResult.HasError() {
        return searchResult.Error()
    }

    return nil
}

func (p *MapsScraperProvider) RateLimit() *serpProvider.RateLimitStatus {
    return p.rateStatus
}

func (p *MapsScraperProvider) Close() *appfault.AppError {
    if err := p.scraper.Close(); err != nil {
        return appfault.Wrap(
            err,
            "close maps scraper",
        )
    }

    return nil
}
```

### 3.3 Colly Provider

```go
package colly

import (
    stdctx "context"
    "fmt"
    "net/url"
    "strings"
    "sync"
    "time"
    
    "github.com/gocolly/colly/v2"
    "github.com/gocolly/colly/v2/queue"
    "gsearch/internal/enums/enginetype"
    "gsearch/internal/enums/platformtype"
    "gsearch/internal/enums/providertype"
    serpProvider "gsearch/internal/provider"
)

type CollyProvider struct {
    config      *CollyConfig
    collector   *colly.Collector
    mu          sync.RWMutex
    rateStatus  *serpProvider.RateLimitStatus
}

type CollyConfig struct {
    MaxConcurrent   int             // Default: 50
    RequestTimeout  time.Duration   // Default: 30s
    Delay           time.Duration   // Default: 100ms between requests
    RandomDelay     time.Duration   // Default: 500ms random jitter
    MaxRetries      int             // Default: 3
    UserAgents      []string        // Rotating user agents
    ProxyUrls       []string        // Rotating proxies
    AllowedDomains  []string        // Restrict to domains
    CacheDir        string          // Local cache directory
    DisableCache    bool            // Disable caching
}

func NewCollyProvider(cfg *CollyConfig) appfault.Result[*CollyProvider] {
    if cfg.MaxConcurrent == 0 {
        cfg.MaxConcurrent = 50
    }
    if cfg.RequestTimeout == 0 {
        cfg.RequestTimeout = 30 * time.Second
    }
    if cfg.Delay == 0 {
        cfg.Delay = 100 * time.Millisecond
    }
    if cfg.RandomDelay == 0 {
        cfg.RandomDelay = 500 * time.Millisecond
    }
    if cfg.MaxRetries == 0 {
        cfg.MaxRetries = 3
    }
    
    // Create collector with options
    opts := []colly.CollectorOption{
        colly.Async(true),
        colly.MaxDepth(1),
    }
    
    if len(cfg.AllowedDomains) > 0 {
        opts = append(opts, colly.AllowedDomains(cfg.AllowedDomains...))
    }
    
    if cfg.CacheDir != "" && !cfg.DisableCache {
        opts = append(opts, colly.CacheDir(cfg.CacheDir))
    }
    
    c := colly.NewCollector(opts...)
    
    // Configure parallelism
    c.Limit(&colly.LimitRule{
        DomainGlob:  "*",
        Parallelism: cfg.MaxConcurrent,
        Delay:       cfg.Delay,
        RandomDelay: cfg.RandomDelay,
    })
    
    // Set timeout
    c.SetRequestTimeout(cfg.RequestTimeout)
    
    // Rotate user agents
    if len(cfg.UserAgents) > 0 {
        c.OnRequest(func(r *colly.Request) {
            r.Headers.Set("User-Agent", cfg.UserAgents[time.Now().UnixNano()%int64(len(cfg.UserAgents))])
        })
    }
    
    return appfault.Ok(&CollyProvider{
        config:    cfg,
        collector: c,
        rateStatus: &serpProvider.RateLimitStatus{
            Remaining: 10000, // High limit for Colly
            Limit:     10000,
        },
    })
}

func (p *CollyProvider) Name() provider.Variant {
    return provider.Colly
}

func (p *CollyProvider) Search(context stdctx.Context, req *serpProvider.SearchRequest) appfault.Result[*serpProvider.SearchResponse] {
    startTime := time.Now()
    
    response := &serpProvider.SearchResponse{
        RequestId:  req.Id,
        Provider:   provider.Colly,
        Query:      req.Query,
        Results:    make([]serpProvider.SearchResult, 0),
        CapturedAt: time.Now(),
    }
    
    // Clone collector for this request
    c := p.collector.Clone()
    
    var mu sync.Mutex
    position := 0
    
    // Configure result extraction based on engine
    switch req.Engine {
    case engine.Google:
        c.OnHtml("div.g", func(e *colly.HTMLElement) {
            mu.Lock()
            defer mu.Unlock()
            
            position++
            result := serpProvider.SearchResult{
                Position:   position,
                Title:      e.ChildText("h3"),
                Url:        e.ChildAttr("a", "href"),
                Snippet:    e.ChildText(".VwiC3b"),
                CapturedAt: time.Now(),
            }
            
            if result.Url != "" {
                result.Domain = extractDomain(result.Url)
                response.Results = append(response.Results, result)
            }
        })
        
    case engine.Bing:
        c.OnHtml("li.b_algo", func(e *colly.HTMLElement) {
            mu.Lock()
            defer mu.Unlock()
            
            position++
            result := serpProvider.SearchResult{
                Position:   position,
                Title:      e.ChildText("h2 a"),
                Url:        e.ChildAttr("h2 a", "href"),
                Snippet:    e.ChildText(".b_caption p"),
                CapturedAt: time.Now(),
            }
            
            if result.Url != "" {
                result.Domain = extractDomain(result.Url)
                response.Results = append(response.Results, result)
            }
        })
        
    case engine.DuckDuckGo:
        c.OnHtml("article[data-testid='result']", func(e *colly.HTMLElement) {
            mu.Lock()
            defer mu.Unlock()
            
            position++
            result := serpProvider.SearchResult{
                Position:   position,
                Title:      e.ChildText("h2 a"),
                Url:        e.ChildAttr("h2 a", "href"),
                Snippet:    e.ChildText("[data-testid='result-snippet']"),
                CapturedAt: time.Now(),
            }
            
            if result.Url != "" {
                result.Domain = extractDomain(result.Url)
                response.Results = append(response.Results, result)
            }
        })
    }
    
    // Build search URL
    searchUrl := p.buildSearchUrl(req)
    
    // Execute with context
    done := make(chan error, 1)
    go func() {
        done <- c.Visit(searchUrl)
    }()
    
    select {
    case <-context.Done():
        return appfault.Fail[*serpProvider.SearchResponse](
            appfault.Wrap(context.Err(), "context cancelled"),
        )
    case err := <-done:
        if err != nil {
            return appfault.Fail[*serpProvider.SearchResponse](
                appfault.Wrap(err, "colly visit"),
            )
        }
    }
    
    c.Wait()
    
    response.Duration = time.Since(startTime)
    response.TotalResults = int64(len(response.Results))
    
    return appfault.Ok(response)
}

func (p *CollyProvider) SearchParallel(context stdctx.Context, reqs []*serpProvider.SearchRequest) appfault.Result[[]*serpProvider.SearchResponse] {
    results := make([]*serpProvider.SearchResponse, len(reqs))
    var wg sync.WaitGroup
    errChan := make(chan *appfault.AppError, len(reqs))
    
    // Create request queue
    q, err := queue.New(p.config.MaxConcurrent, &queue.InMemoryQueueStorage{MaxSize: 10000})
    if err != nil {
        return appfault.Fail[[]*serpProvider.SearchResponse](
            appfault.Wrap(err, "create queue"),
        )
    }
    
    for i, req := range reqs {
        wg.Add(1)
        go func(idx int, r *serpProvider.SearchRequest) {
            defer wg.Done()
            
            searchResult := p.Search(context, r)
            if searchResult.HasError() {
                errChan <- searchResult.Error()
                return
            }
            results[idx] = searchResult.Value()
        }(i, req)
    }
    
    wg.Wait()
    close(errChan)
    
    return appfault.Ok(results)
}

func (p *CollyProvider) buildSearchUrl(req *serpProvider.SearchRequest) string {
    var baseUrl string
    var params url.Values = make(url.Values)
    
    switch req.Engine {
    case engine.Google:
        baseUrl = "https://www.google.com/search"
        params.Set("q", req.Query)
        params.Set("num", fmt.Sprintf("%d", req.MaxResults))
        if req.Language != "" {
            params.Set("hl", req.Language)
        }
        if req.Region != "" {
            params.Set("gl", req.Region)
        }
        
    case engine.Bing:
        baseUrl = "https://www.bing.com/search"
        params.Set("q", req.Query)
        params.Set("count", fmt.Sprintf("%d", req.MaxResults))
        
    case engine.DuckDuckGo:
        baseUrl = "https://html.duckduckgo.com/html/"
        params.Set("q", req.Query)
    }
    
    // Add platform-specific site: operator
    if len(req.Platforms) > 0 {
        var siteOps []string
        for _, plat := range req.Platforms {
            if op := plat.SiteOperator(); op != "" {
                siteOps = append(siteOps, op)
            }
        }
        if len(siteOps) > 0 {
            params.Set("q", req.Query+" "+strings.Join(siteOps, " OR "))
        }
    }
    
    return baseUrl + "?" + params.Encode()
}

func (p *CollyProvider) HealthCheck(context stdctx.Context) *appfault.AppError {
    searchResult := p.Search(context, &serpProvider.SearchRequest{
        Query:      "test",
        Engine:     engine.DuckDuckGo,
        MaxResults: 1,
    })
    if searchResult.HasError() {
        return searchResult.Error()
    }
    return nil
}

func (p *CollyProvider) RateLimit() *serpProvider.RateLimitStatus {
    return p.rateStatus
}

func (p *CollyProvider) Close() *appfault.AppError {
    return nil
}
```

---

## 4. Provider Orchestrator

```go
package orchestrator

import (
    stdctx "context"
    "fmt"
    "sync"
    "time"
    
    "gsearch/internal/enums/providertype"
    "gsearch/internal/enums/searchmodetype"
    serpProvider "gsearch/internal/provider"
    "gsearch/internal/storage"
)

// Orchestrator manages multiple SERP providers
type Orchestrator struct {
    providers   map[provider.Variant]serpProvider.Provider
    storage     *storage.SplitDbStorage
    config      *OrchestratorConfig
    mu          sync.RWMutex
}

type OrchestratorConfig struct {
    DefaultProvider     provider.Variant      // Default: SerpApi
    DefaultMode         search_mode.Variant   // Default: Parallel
    MaxConcurrentReqs   int                   // Default: 20
    TimeoutPerProvider  time.Duration         // Default: 60s
    EnableCaching       bool                  // Default: true
    CacheTTL            time.Duration         // Default: 5 days
}

// NewOrchestrator creates a provider orchestrator
func NewOrchestrator(cfg *OrchestratorConfig, storage *storage.SplitDbStorage) *Orchestrator {
    if cfg.MaxConcurrentReqs == 0 {
        cfg.MaxConcurrentReqs = 20
    }
    if cfg.TimeoutPerProvider == 0 {
        cfg.TimeoutPerProvider = 60 * time.Second
    }
    if cfg.CacheTTL == 0 {
        cfg.CacheTTL = 5 * 24 * time.Hour
    }
    
    return &Orchestrator{
        providers: make(map[provider.Variant]serpProvider.Provider),
        storage:   storage,
        config:    cfg,
    }
}

// RegisterProvider adds a provider to the orchestrator
func (o *Orchestrator) RegisterProvider(p serpProvider.Provider) error {
    o.mu.Lock()
    defer o.mu.Unlock()
    
    if _, exists := o.providers[p.Name()]; exists {
        return appfault.New(
            fmt.Sprintf("provider %s already registered", p.Name()),
        )
    }
    
    o.providers[p.Name()] = p
    return nil
}

// Search executes a search with specified providers
type SearchOptions struct {
    Providers       []provider.Variant      // Providers to use (empty = default)
    Mode            search_mode.Variant     // Execution mode
    AggregateResults bool                   // Merge results from all providers
    DeduplicateBy   string                  // Dedup field: url, domain
    MaxTotalResults int                     // Max combined results
    UseCache        bool                    // Check cache first
    StoreResults    bool                    // Store in Split DB
}

func (o *Orchestrator) Search(context stdctx.Context, req *serpProvider.SearchRequest, opts *SearchOptions) appfault.Result[*AggregatedResponse] {
    // Set defaults
    if len(opts.Providers) == 0 {
        opts.Providers = []provider.Variant{o.config.DefaultProvider}
    }
    if opts.Mode == "" {
        opts.Mode = o.config.DefaultMode
    }
    
    // Check cache if enabled
    if opts.UseCache && o.config.EnableCaching {
        cachedResult := o.storage.GetCachedResults(context, req)
        if cachedResult.IsOk() {
            return appfault.Ok(cachedResult.Value())
        }
    }
    
    var responses []*serpProvider.SearchResponse
    var searchErr *appfault.AppError
    
    switch opts.Mode {
    case search_mode.Sequential:
        responses, searchErr = o.searchSequential(context, req, opts.Providers)
    case search_mode.Parallel:
        responses, searchErr = o.searchParallel(context, req, opts.Providers)
    case search_mode.RoundRobin:
        responses, searchErr = o.searchRoundRobin(context, req, opts.Providers)
    default:
        responses, searchErr = o.searchParallel(context, req, opts.Providers)
    }
    
    if searchErr != nil {
        return appfault.Fail[*AggregatedResponse](searchErr)
    }
    
    // Aggregate results
    aggregated := o.aggregateResponses(responses, opts)
    
    // Store in Split DB if requested
    if opts.StoreResults {
        if storeErr := o.storage.StoreResults(context, aggregated); storeErr != nil {
            // Log but don't fail
            fmt.Printf("warning: failed to store results: %v\n", storeErr)
        }
    }
    
    return appfault.Ok(aggregated)
}

func (o *Orchestrator) searchSequential(context stdctx.Context, req *serpProvider.SearchRequest, providers []provider.Variant) ([]*serpProvider.SearchResponse, *appfault.AppError) {
    responses := make([]*serpProvider.SearchResponse, 0, len(providers))
    
    for _, prov := range providers {
        o.mu.RLock()
        p, exists := o.providers[prov]
        o.mu.RUnlock()
        
        if !exists {
            continue
        }
        
        searchResult := p.Search(context, req)
        if searchResult.HasError() {
            continue // Try next provider
        }
        
        responses = append(responses, searchResult.Value())
    }
    
    if len(responses) == 0 {
        return nil, appfault.New("all providers failed")
    }
    
    return responses, nil
}

func (o *Orchestrator) searchParallel(context stdctx.Context, req *serpProvider.SearchRequest, providers []provider.Variant) ([]*serpProvider.SearchResponse, *appfault.AppError) {
    responses := make([]*serpProvider.SearchResponse, len(providers))
    var wg sync.WaitGroup
    errChan := make(chan *appfault.AppError, len(providers))
    
    for i, prov := range providers {
        wg.Add(1)
        go func(idx int, provVariant provider.Variant) {
            defer wg.Done()
            
            o.mu.RLock()
            p, exists := o.providers[provVariant]
            o.mu.RUnlock()
            
            if !exists {
                errChan <- appfault.New(fmt.Sprintf("provider %s not registered", provVariant))
                return
            }
            
            searchResult := p.Search(context, req)
            if searchResult.HasError() {
                errChan <- searchResult.Error()
                return
            }
            
            responses[idx] = searchResult.Value()
        }(i, prov)
    }
    
    wg.Wait()
    close(errChan)
    
    // Filter nil responses
    validResponses := make([]*serpProvider.SearchResponse, 0, len(providers))
    for _, resp := range responses {
        if resp != nil {
            validResponses = append(validResponses, resp)
        }
    }
    
    if len(validResponses) == 0 {
        return nil, appfault.New("all providers failed")
    }
    
    return validResponses, nil
}

func (o *Orchestrator) searchRoundRobin(context stdctx.Context, req *serpProvider.SearchRequest, providers []provider.Variant) ([]*serpProvider.SearchResponse, *appfault.AppError) {
    // Select provider based on current time (simple rotation)
    idx := int(time.Now().UnixNano()) % len(providers)
    return o.searchSequential(context, req, []provider.Variant{providers[idx]})
}

// AggregatedResponse combines results from multiple providers
type AggregatedResponse struct {
    Query           string                            
    Providers       []provider.Variant                
    Mode            search_mode.Variant               
    Results         []serpProvider.SearchResult       
    LocalPack       []serpProvider.LocalResult        
    ProviderResults map[provider.Variant]*serpProvider.SearchResponse
    TotalDuration   time.Duration                     
    FromCache       bool                              
    CapturedAt      time.Time                         
}

func (o *Orchestrator) aggregateResponses(responses []*serpProvider.SearchResponse, opts *SearchOptions) *AggregatedResponse {
    agg := &AggregatedResponse{
        ProviderResults: make(map[provider.Variant]*serpProvider.SearchResponse),
        Results:         make([]serpProvider.SearchResult, 0),
        LocalPack:       make([]serpProvider.LocalResult, 0),
        CapturedAt:      time.Now(),
    }
    
    seen := make(map[string]bool)
    
    for _, resp := range responses {
        if resp == nil {
            continue
        }
        
        agg.Query = resp.Query
        agg.Providers = append(agg.Providers, resp.Provider)
        agg.ProviderResults[resp.Provider] = resp
        agg.TotalDuration += resp.Duration
        
        // Merge results with deduplication
        for _, result := range resp.Results {
            key := result.Url
            if opts.DeduplicateBy == "domain" {
                key = result.Domain
            }
            
            if !seen[key] {
                seen[key] = true
                agg.Results = append(agg.Results, result)
            }
        }
        
        // Merge local pack results
        for _, local := range resp.LocalPack {
            agg.LocalPack = append(agg.LocalPack, local)
        }
    }
    
    // Apply max results limit
    if opts.MaxTotalResults > 0 && len(agg.Results) > opts.MaxTotalResults {
        agg.Results = agg.Results[:opts.MaxTotalResults]
    }
    
    return agg
}
```

---

## 5. Split DB Storage

```go
package storage

import (
    stdctx "context"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "path/filepath"
    "time"
    
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    
    "gsearch/internal/enums/providertype"
    serpProvider "gsearch/internal/provider"
)

// SplitDbStorage manages SERP result storage in Split DB pattern
type SplitDbStorage struct {
    baseDir     string
    appName     string
    cacheTTL    time.Duration
}

// StoredResult represents a cached SERP result in the database
type StoredResult struct {
    Id              string    `gorm:"primaryKey"`
    QueryHash       string    `gorm:"index"`
    Query           string    
    Provider        string    
    Engine          string    
    ResultsJson     string    // JSON serialized results
    LocalPackJson   string    // JSON serialized local pack
    TotalResults    int64     
    CapturedAt      time.Time 
    ExpiresAt       time.Time `gorm:"index"`
    CreatedAt       time.Time 
}

func NewSplitDbStorage(baseDir, appName string, cacheTTL time.Duration) *SplitDbStorage {
    return &SplitDbStorage{
        baseDir:  baseDir,
        appName:  appName,
        cacheTTL: cacheTTL,
    }
}

// GetDbPath returns the database path for a provider
func (s *SplitDbStorage) GetDbPath(prov provider.Variant, queryHash string) string {
    // Pattern: data/{app}/serp/{provider}/{hash}.db
    return filepath.Join(
        s.baseDir,
        s.appName,
        "serp",
        string(prov),
        queryHash[:2], // Shard by first 2 chars
        queryHash+".db",
    )
}

// StoreResults stores aggregated results in Split DB
func (s *SplitDbStorage) StoreResults(context stdctx.Context, agg *AggregatedResponse) *appfault.AppError {
    queryHash := s.hashQuery(agg.Query)
    
    for prov, resp := range agg.ProviderResults {
        dbPath := s.GetDbPath(prov, queryHash)
        
        // Ensure directory exists
        if mkErr := pathutil.MkdirAll(filepath.Dir(dbPath), 0755); mkErr != nil {
            return appfault.Wrap(
                mkErr,
                "create db dir",
            )
        }
        
        db, openErr := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
        if openErr != nil {
            return appfault.Wrap(
                openErr,
                "open db",
            )
        }
        
        // Auto migrate
        if migrateErr := db.AutoMigrate(&StoredResult{}); migrateErr != nil {
            return appfault.Wrap(
                migrateErr,
                "migrate",
            )
        }
        
        // Serialize results
        resultsJson, _ := json.Marshal(resp.Results)
        localPackJson, _ := json.Marshal(resp.LocalPack)
        
        stored := &StoredResult{
            Id:            uuid.New().String(),
            QueryHash:     queryHash,
            Query:         agg.Query,
            Provider:      string(prov),
            Engine:        string(resp.Engine),
            ResultsJson:   string(resultsJson),
            LocalPackJson: string(localPackJson),
            TotalResults:  resp.TotalResults,
            CapturedAt:    resp.CapturedAt,
            ExpiresAt:     time.Now().Add(s.cacheTTL),
            CreatedAt:     time.Now(),
        }
        
        if createErr := db.Create(stored).Error; createErr != nil {
            return appfault.Wrap(
                createErr,
                "store result",
            )
        }
    }
    
    return nil
}

// GetCachedResults retrieves cached results if not expired
func (s *SplitDbStorage) GetCachedResults(context stdctx.Context, req *serpProvider.SearchRequest) appfault.Result[*AggregatedResponse] {
    queryHash := s.hashQuery(req.Query)
    
    // Check all registered providers
    agg := &AggregatedResponse{
        Query:           req.Query,
        ProviderResults: make(map[provider.Variant]*serpProvider.SearchResponse),
        FromCache:       true,
        CapturedAt:      time.Now(),
    }
    
    for _, prov := range provider.All() {
        dbPath := s.GetDbPath(prov, queryHash)
        
        if pathutil.IsMissing(dbPath) {
            continue
        }
        
        db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
        if err != nil {
            continue
        }
        
        var stored StoredResult
        result := db.Where("query_hash = ? AND expires_at > ?", queryHash, time.Now()).
            Order("captured_at DESC").
            First(&stored)
        
        if result.Error != nil {
            continue
        }
        
        // Deserialize results
        var results []serpProvider.SearchResult
        var localPack []serpProvider.LocalResult
        
        json.Unmarshal([]byte(stored.ResultsJson), &results)
        json.Unmarshal([]byte(stored.LocalPackJson), &localPack)
        
        resp := &serpProvider.SearchResponse{
            Provider:     prov,
            Query:        stored.Query,
            Results:      results,
            LocalPack:    localPack,
            TotalResults: stored.TotalResults,
            CapturedAt:   stored.CapturedAt,
            FromCache:    true,
        }
        
        agg.Providers = append(agg.Providers, prov)
        agg.ProviderResults[prov] = resp
        agg.Results = append(agg.Results, results...)
        agg.LocalPack = append(agg.LocalPack, localPack...)
    }
    
    if len(agg.ProviderResults) == 0 {
        return appfault.Fail[*AggregatedResponse](appfault.New("no cached results"))
    }
    
    return appfault.Ok(agg)
}

func (s *SplitDbStorage) hashQuery(query string) string {
    h := sha256.Sum256([]byte(query))
    return hex.EncodeToString(h[:])
}
```

---

## 6. CLI Commands

```bash
# Search with specific provider
gsearch search "plumber NYC" --provider serpapi
gsearch search "plumber NYC" --provider colly
gsearch search "plumber NYC" --provider maps_scraper

# Search with all providers in parallel
gsearch search "plumber NYC" --providers serpapi,colly,maps_scraper --mode parallel

# Round-robin across providers
gsearch search "plumber NYC" --providers serpapi,colly --mode round_robin

# Sequential (fallback if one fails)
gsearch search "plumber NYC" --providers serpapi,colly --mode sequential

# Multi-platform parallel search
gsearch search "golang best practices" --platforms youtube,reddit,medium,github --mode parallel

# All platforms at once
gsearch search "machine learning" --platforms all --mode parallel

# Combine providers and platforms
gsearch search "startup ideas" \
    --providers serpapi,colly \
    --platforms youtube,reddit,linkedin \
    --mode parallel \
    --output json

# Cache control
gsearch search "query" --cache-days 5
gsearch search "query" --force # Skip cache
gsearch search "query" --cache-only # Only from cache

# List providers
gsearch providers list
gsearch providers status
gsearch providers healthcheck serpapi

# List platforms
gsearch platforms list
gsearch platforms list --type social
gsearch platforms list --type search_engine
```

---

## 7. REST API Endpoints

### 7.1 Provider Endpoints

```yaml
/api/v1/providers:
  get:
    summary: List all available providers
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                Success: { type: boolean }
                Data:
                  type: array
                  items:
                    type: object
                    properties:
                      Name: { type: string }
                      Description: { type: string }
                      SupportsParallel: { type: boolean }
                      RequiresApiKey: { type: boolean }
                      Status: { type: string }

/api/v1/providers/{name}/health:
  get:
    summary: Check provider health
    parameters:
      - name: name
        in: path
        required: true
        schema: { type: string, enum: [serpapi, maps_scraper, colly] }
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                Success: { type: boolean }
                Data:
                  type: object
                  properties:
                    Provider: { type: string }
                    Healthy: { type: boolean }
                    RateLimit:
                      type: object
                      properties:
                        Remaining: { type: integer }
                        Limit: { type: integer }
```

### 7.2 Search Endpoints

```yaml
/api/v1/search:
  post:
    summary: Execute search with provider selection
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [Query]
            properties:
              Query: { type: string }
              Providers:
                type: array
                items: { type: string, enum: [serpapi, maps_scraper, colly] }
              Platforms:
                type: array
                items: { type: string }
              Mode:
                type: string
                enum: [sequential, parallel, round_robin]
              Engine:
                type: string
                enum: [google, bing, duckduckgo]
              MaxResults: { type: integer, default: 10 }
              UseCache: { type: boolean, default: true }
              StoreResults: { type: boolean, default: true }
    responses:
      200:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AggregatedSearchResponse'

/api/v1/search/parallel:
  post:
    summary: Execute parallel search across multiple queries
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [Queries]
            properties:
              Queries:
                type: array
                items: { type: string }
              Providers:
                type: array
                items: { type: string }
              MaxConcurrent: { type: integer, default: 10 }
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                Success: { type: boolean }
                Data:
                  type: array
                  items:
                    $ref: '#/components/schemas/AggregatedSearchResponse'
```

---

## 8. Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7920 | ERR_PROVIDER_NOT_FOUND | Provider not registered |
| 7921 | ERR_PROVIDER_UNAVAILABLE | Provider health check failed |
| 7922 | ERR_PROVIDER_RATE_LIMITED | Provider rate limit exceeded |
| 7923 | ERR_PROVIDER_AUTH_FAILED | Provider API key invalid |
| 7924 | ERR_PROVIDER_TIMEOUT | Provider request timeout |
| 7925 | ERR_ALL_PROVIDERS_FAILED | All configured providers failed |
| 7926 | ERR_INVALID_SEARCH_MODE | Invalid search mode specified |
| 7927 | ERR_PARALLEL_PARTIAL_FAIL | Some parallel requests failed |
| 7928 | ERR_CACHE_READ_FAILED | Failed to read from cache |
| 7929 | ERR_CACHE_WRITE_FAILED | Failed to write to cache |
| 7930 | ERR_STORAGE_DB_OPEN | Failed to open Split DB |
| 7931 | ERR_STORAGE_MIGRATION | Failed to migrate schema |
| 7932 | ERR_RESULT_AGGREGATE | Failed to aggregate results |
| 7933 | ERR_COLLY_SCRAPE_FAILED | Colly scraping error |
| 7934 | ERR_SERPAPI_REQUEST | SerpApi request error |
| 7935 | ERR_MAPS_SCRAPE_FAILED | Maps scraper error |

---

## 9. Cross-References

| Reference | Location |
|-----------|----------|
| Enum Architecture | `58-enum-architecture.md` |
| SERP Position Tracking | `44-serp-position-tracking.md` |
| Multi-Source Search | `56-multi-source-search.md` |
| Unified REST API | `48-unified-rest-api.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Error Code Registry | `02-spec/03-error-code-registry/01-registry.md` |

---

*Multi-provider SERP integration with parallel execution and Split DB storage.*
