# GSearch Multi-Source Search Specification

**Version:** 3.0.0  
**Updated:** 2026-03-09  
**Error Range:** 7840-7859  
**Depends On:** `58-enum-architecture.md`, `59-provider-integration.md`

---

## Overview

Multi-source search enables explicit platform-specific searches (YouTube, Reddit, Medium, LinkedIn, Instagram, Google, Bing, DuckDuckGo) and dynamic site-scoped searches on custom URLs. Supports parallel execution across all sources with enum-based platform selection.

---

## Enum-Based Platform Selection

All platform and mode selection uses typed enums from `internal/enums/`:

```go
import (
    "gsearch/internal/enums/platformtype"
    "gsearch/internal/enums/enginetype"
    "gsearch/internal/enums/searchmodetype"
    "gsearch/internal/enums/outputformattype"
)

// Type-safe platform selection
type MultiSourceRequest struct {
    Query           string                  
    Platforms       []platform.Variant      // Enum-based, not strings
    Engines         []engine.Variant        // Google, Bing, DuckDuckGo
    Mode            search_mode.Variant     // Sequential, Parallel, RoundRobin
    OutputFormat    output.Variant          // JSON, CSV, Table, Markdown
    MaxResults      int                     
    Timeout         time.Duration           
}
```

---

## Supported Platforms (via Enum)

| Enum Value | Display Name | Search Pattern |
|------------|--------------|----------------|
| `platform.Google` | Google | Direct web search |
| `platform.Bing` | Bing | Direct web search |
| `platform.DuckDuckGo` | DuckDuckGo | Direct web search |
| `platform.YouTube` | YouTube | `site:youtube.com {query}` |
| `platform.Reddit` | Reddit | `site:reddit.com {query}` |
| `platform.Medium` | Medium | `site:medium.com {query}` |
| `platform.LinkedIn` | LinkedIn | `site:linkedin.com {query}` |
| `platform.Instagram` | Instagram | `site:instagram.com {query}` |
| `platform.Twitter` | Twitter | `site:twitter.com OR site:x.com {query}` |
| `platform.GitHub` | GitHub | `site:github.com {query}` |
| `platform.StackOverflow` | Stack Overflow | `site:stackoverflow.com {query}` |

---

## API Endpoints

### Single Platform Search

```
GET /api/v1/search/{platform}
```

**Path Parameters:**
- `platform`: Enum value from `platform.Variant` (e.g., `youtube`, `reddit`, `linkedin`)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| limit | int | No | Results per page (default: 10, max: 100) |
| page | int | No | Page number (default: 1) |
| output | string | No | Output format enum (json, csv, table) |

**Example:**
```bash
GET /api/v1/search/youtube?q=golang+tutorial&limit=20&output=json
GET /api/v1/search/linkedin?q=software+engineer+NYC&limit=50
```

### Site-Scoped Search (Separate Endpoint)

```
GET /api/v1/site-search
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | Target website URL |
| q | string | Yes | Search query |
| engine | string | No | Engine enum (google, bing, duckduckgo; default: google) |
| limit | int | No | Results limit |

**Example:**
```bash
GET /api/v1/site-search?url=docs.lovable.dev&q=authentication&engine=google
```

### Parallel Multi-Source Search

```
POST /api/v1/search/parallel
```

**Request Body:**

```go
type ParallelSearchRequest struct {
    Query       string                  // Search query
    Platforms   []platform.Variant      // Enum array: [YouTube, Reddit, Medium, LinkedIn]
    Engines     []engine.Variant        // Enum array: [Google, Bing, DuckDuckGo]
    SiteUrls    []string                // Custom site URLs to include
    Mode        search_mode.Variant     // Parallel, Sequential, RoundRobin
    Limit       int                     // Results per source (default: 10)
    Timeout     int                     // Timeout in ms (default: 30000)
    Deduplicate bool                    // Remove duplicate URLs across sources
    Output      output.Variant          // Output format
}
```

**Response:**

```go
type ParallelSearchResponse struct {
    Success       bool                                  
    Data          *ParallelSearchData                   
    Error         *ErrorInfo                            `json:",omitempty"`
    Meta          *ResponseMeta                         
}

type ParallelSearchData struct {
    Query         string                                
    Mode          search_mode.Variant                   
    Results       map[platform.Variant][]SearchResult   // Keyed by platform enum
    SiteResults   map[string][]SearchResult             // Keyed by site URL
    Errors        map[string]string                     // Errors per source
    TotalCount    int                                   
    SuccessCount  int                                   
    FailureCount  int                                   
    Duration      int64                                 // Total execution time in ms
}
```

### All Platforms at Once

```
POST /api/v1/search/all
```

**Description:** Search ALL enabled platforms in parallel with a single request.

**Request Body:**

```go
type AllPlatformSearchRequest struct {
    Query           string                  
    IncludeEngines  bool                    // Include Google, Bing, DDG
    IncludeSocial   bool                    // Include LinkedIn, Instagram, Twitter, Reddit
    IncludeContent  bool                    // Include YouTube, Medium, GitHub, StackOverflow
    Limit           int                     // Results per platform
    Timeout         int                     // Global timeout in ms
}
```

---

## Go Implementation

### Platform-Aware Search Orchestrator

```go
package search

import (
    "context"
    "sync"
    "time"
    
    "gsearch/internal/enums/platformtype"
    "gsearch/internal/enums/enginetype"
    "gsearch/internal/enums/searchmodetype"
)

type MultiSourceOrchestrator struct {
    providers       map[platform.Variant]PlatformSearcher
    engineSearcher  EngineSearcher
    config          *OrchestratorConfig
    workerPool      chan struct{}
}

type OrchestratorConfig struct {
    MaxConcurrent       int                     // Default: 20
    DefaultTimeout      time.Duration           // Default: 30s
    DefaultLimit        int                     // Default: 10
    EnabledPlatforms    []platform.Variant      // Enabled platforms
    EnabledEngines      []engine.Variant        // Enabled engines
}

func NewMultiSourceOrchestrator(cfg *OrchestratorConfig) *MultiSourceOrchestrator {
    return &MultiSourceOrchestrator{
        providers:    make(map[platform.Variant]PlatformSearcher),
        config:       cfg,
        workerPool:   make(chan struct{}, cfg.MaxConcurrent),
    }
}

// SearchParallel executes searches across all specified platforms in parallel
func (o *MultiSourceOrchestrator) SearchParallel(context stdctx.Context, req *ParallelSearchRequest) apperror.Result[*ParallelSearchResponse] {
    startTime := time.Now()
    
    response := &ParallelSearchResponse{
        Success: true,
        Data: &ParallelSearchData{
            Query:       req.Query,
            Mode:        req.Mode,
            Results:     make(map[platform.Variant][]SearchResult),
            SiteResults: make(map[string][]SearchResult),
            Errors:      make(map[string]string),
        },
        Meta: &ResponseMeta{
            Timestamp: time.Now(),
        },
    }
    
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    // Search all specified platforms
    for _, plat := range req.Platforms {
        if plat.IsInvalid() {
            response.Data.Errors[string(plat)] = "invalid platform"
            continue
        }
        
        wg.Add(1)
        go func(p platform.Variant) {
            defer wg.Done()
            
            // Acquire worker slot
            o.workerPool <- struct{}{}
            defer func() { <-o.workerPool }()
            
            results, err := o.searchPlatform(context, p, req.Query, req.Limit)
            
            mu.Lock()
            defer mu.Unlock()
            
            if err != nil {
                response.Data.Errors[string(p)] = err.Error()
                response.Data.FailureCount++
            } else {
                response.Data.Results[p] = results
                response.Data.TotalCount += len(results)
                response.Data.SuccessCount++
            }
        }(plat)
    }
    
    // Search all specified engines
    for _, eng := range req.Engines {
        if eng.IsInvalid() {
            continue
        }
        
        wg.Add(1)
        go func(e engine.Variant) {
            defer wg.Done()
            
            o.workerPool <- struct{}{}
            defer func() { <-o.workerPool }()
            
            results, err := o.searchEngine(context, e, req.Query, req.Limit)
            
            mu.Lock()
            defer mu.Unlock()
            
            // Map engine to platform equivalent
            plat := platform.Variant(e)
            if err != nil {
                response.Data.Errors[string(e)] = err.Error()
                response.Data.FailureCount++
            } else {
                response.Data.Results[plat] = results
                response.Data.TotalCount += len(results)
                response.Data.SuccessCount++
            }
        }(eng)
    }
    
    // Search custom site URLs
    for _, siteUrl := range req.SiteUrls {
        wg.Add(1)
        go func(url string) {
            defer wg.Done()
            
            o.workerPool <- struct{}{}
            defer func() { <-o.workerPool }()
            
            results, err := o.searchSite(context, url, req.Query, req.Limit)
            
            mu.Lock()
            defer mu.Unlock()
            
            if err != nil {
                response.Data.Errors[url] = err.Error()
                response.Data.FailureCount++
            } else {
                response.Data.SiteResults[url] = results
                response.Data.TotalCount += len(results)
                response.Data.SuccessCount++
            }
        }(siteUrl)
    }
    
    wg.Wait()
    
    response.Data.Duration = time.Since(startTime).Milliseconds()

    return apperror.OK(response)
}

func (o *MultiSourceOrchestrator) searchPlatform(context stdctx.Context, plat platform.Variant, query string, limit int) apperror.Result[[]SearchResult] {
    // Build site-scoped query using platform's site operator
    siteOp := plat.SiteOperator()
    if siteOp != "" {
        query = siteOp + " " + query
    }
    
    // Use default engine (Google) for platform searches
    return o.engineSearcher.Search(context, engine.Google, query, limit)
}

func (o *MultiSourceOrchestrator) searchEngine(context stdctx.Context, eng engine.Variant, query string, limit int) apperror.Result[[]SearchResult] {
    return o.engineSearcher.Search(context, eng, query, limit)
}

func (o *MultiSourceOrchestrator) searchSite(context stdctx.Context, siteUrl, query string, limit int) apperror.Result[[]SearchResult] {
    siteQuery := fmt.Sprintf("site:%s %s", siteUrl, query)

    return o.engineSearcher.Search(context, engine.Google, siteQuery, limit)
}
```

---

## CLI Commands

```bash
# Single platform search (enum-based)
gsearch search --platform youtube "golang tutorial"
gsearch search --platform linkedin "software engineer"
gsearch search --platform instagram "travel photography"

# Multiple platforms (comma-separated enum values)
gsearch search --platforms youtube,reddit,medium "machine learning"

# All social media platforms
gsearch search --platforms linkedin,instagram,twitter,reddit "brand name"

# All content platforms
gsearch search --platforms youtube,medium,github,stackoverflow "golang best practices"

# All platforms at once
gsearch search --all "AI development"
gsearch search --all --exclude reddit,twitter "query"

# Parallel with specific mode
gsearch search --platforms google,bing,youtube --mode parallel "query"
gsearch search --platforms google,bing,youtube --mode sequential "query"

# Site-scoped search
gsearch site-search --url docs.lovable.dev "authentication"

# Parallel with custom sites
gsearch search --parallel --platforms google --sites docs.lovable.dev,example.com "query"

# Output format selection
gsearch search --platforms youtube,reddit "query" --output json
gsearch search --platforms youtube,reddit "query" --output csv
gsearch search --platforms youtube,reddit "query" --output table

# List available platforms
gsearch enums list platform
gsearch enums list engine
gsearch enums list search_mode
```

---

## Database Schema

### SearchSources Table

```sql
CREATE TABLE SearchSources (
    Id TEXT PRIMARY KEY,
    PlatformEnum TEXT NOT NULL,          -- Enum value: "youtube", "reddit", etc.
    DisplayName TEXT,
    BaseUrl TEXT,
    SitePattern TEXT,                    -- "site:{domain} {query}"
    IsBuiltIn INTEGER DEFAULT 1,
    IsEnabled INTEGER DEFAULT 1,
    RateLimitPerMinute INTEGER DEFAULT 60,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### CustomSites Table

```sql
CREATE TABLE CustomSites (
    Id TEXT PRIMARY KEY,
    Url TEXT NOT NULL UNIQUE,
    DisplayName TEXT,
    PreferredEngine TEXT DEFAULT 'google', -- Engine enum value
    LastSearched DATETIME,
    SearchCount INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### SearchExecutions Table

```sql
CREATE TABLE SearchExecutions (
    Id TEXT PRIMARY KEY,
    Query TEXT NOT NULL,
    Platforms TEXT,                       -- JSON array of platform enums
    Engines TEXT,                         -- JSON array of engine enums
    Mode TEXT,                            -- search_mode enum
    TotalResults INTEGER,
    SuccessCount INTEGER,
    FailureCount INTEGER,
    Duration INTEGER,                     -- ms
    CapturedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7840 | ErrMultiSourceInit | Multi-source search initialization failed |
| 7841 | ErrInvalidPlatform | Unknown or unsupported platform enum |
| 7842 | ErrSiteUrlInvalid | Invalid site URL format |
| 7843 | ErrSiteUrlUnreachable | Site URL not reachable |
| 7844 | ErrParallelTimeout | Parallel search exceeded timeout |
| 7845 | ErrParallelPartialFailure | Some sources failed (partial results returned) |
| 7846 | ErrRateLimitExceeded | Platform rate limit exceeded |
| 7847 | ErrWorkerPoolExhausted | No available workers for search |
| 7848 | ErrResultAggregation | Failed to aggregate parallel results |
| 7849 | ErrCustomSiteNotFound | Custom site not found in registry |
| 7850 | ErrInvalidSearchMode | Invalid search mode enum |
| 7851 | ErrInvalidEngine | Invalid engine enum |
| 7852 | ErrAllSourcesFailed | All specified sources failed |
| 7853 | ErrEnumParseError | Failed to parse enum value |

---

## Configuration (config.seed.json)

```json
{
  "MultiSourceSearch": {
    "SeedVersion": "2.0.0",
    "Values": {
      "MaxConcurrentSearches": 20,
      "DefaultTimeout": 30000,
      "DefaultLimit": 10,
      "EnabledPlatforms": ["google", "bing", "duckduckgo", "youtube", "reddit", "medium", "linkedin", "instagram", "twitter", "github", "stackoverflow"],
      "EnabledEngines": ["google", "bing", "duckduckgo"],
      "DefaultMode": "parallel",
      "RetryAttempts": 2,
      "RetryDelayMs": 1000
    }
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Enum Architecture | `58-enum-architecture.md` |
| Provider Integration | `59-provider-integration.md` |
| BI Suite | `02-spec/25-gsearch-cli/01-backend/50-business-intelligence-suite.md` |
| Error Registry | `.ai-memory/memories/technical/error-code-registry.md` |
| Parallel Engine | `02-spec/27-ai-bridge-cli/01-backend/50-long-chain-command-system.md` |
