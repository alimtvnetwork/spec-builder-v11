# Component: Bing Search

**Parent:** [Golang Search CLI](./00-overview.md)  
**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Summary

Bing Web Search API integration with structured JSON responses and generous free tier.

---

## API Details

| Feature | Value |
|---------|-------|
| Endpoint | `https://api.bing.microsoft.com/v7.0/search` |
| Free Tier | 1,000 calls/month |
| Paid Tier | $3 per 1,000 calls |
| Rate Limit | 3 calls/second |

---

## Dependencies

- `net/http` — HTTP client
- `encoding/json` — Response parsing

---

## Implementation

### Search Method

```go
package search

import (
    stdctx "context"
    "encoding/json"
    "net/http"
    "net/url"
    "time"
    
    "gsearch/pkg/appfault"
)

type BingSearch struct {
    client   *http.Client
    apiKey   string
    endpoint string
    quota    *QuotaTracker
}

func NewBingSearch(apiKey string, cfg *config.BingApiConfig) *BingSearch {
    endpoint := cfg.Endpoint
    if endpoint == "" {
        endpoint = "https://api.bing.microsoft.com/v7.0/search"
    }
    
    return &BingSearch{
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
        apiKey:   apiKey,
        endpoint: endpoint,
        quota:    NewQuotaTracker(1000), // Monthly quota
    }
}

func (b *BingSearch) Id() string        { return "bing" }
func (b *BingSearch) Name() string      { return "Bing Search API" }
func (b *BingSearch) RequiresApi() bool { return true }

func (b *BingSearch) IsAvailable() bool {
    return b.apiKey != "" && !b.quota.IsExhausted()
}
```

### Search Execution

```go
func (b *BingSearch) Search(context stdctx.Context, query string, opts SearchOptions) SearchResultSlice {
    if !b.quota.CanMakeRequest() {
        return appfault.Fail[[]Result](
            appfault.New(
                "Bing Search quota exhausted",
            ),
        )
    }
    
    params := url.Values{}
    params.Set("q", query)
    params.Set("count", strconv.Itoa(opts.MaxResults))
    params.Set("mkt", "en-US")
    params.Set("responseFilter", "Webpages")
    params.Set("textDecorations", "false")
    params.Set("textFormat", "Raw")
    
    reqUrl := b.endpoint + "?" + params.Encode()
    
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), reqUrl, nil)
    if err != nil {
        return appfault.Fail[[]Result](
            appfault.Wrap(
                err,
                "create request",
            ),
        )
    }
    
    req.Header.Set("Ocp-Apim-Subscription-Key", b.apiKey)
    
    resp, err := b.client.Do(req)
    if err != nil {
        return appfault.Fail[[]Result](
            appfault.Wrap(
                err,
                "network error",
            ),
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return appfault.Fail[[]Result](b.handleError(resp))
    }
    
    b.quota.RecordRequest()
    
    var bingResp BingSearchResponse
    if err := json.NewDecoder(resp.Body).Decode(&bingResp); err != nil {
        return appfault.Fail[[]Result](
            appfault.Wrap(
                err,
                "decode response",
            ),
        )
    }
    
    return appfault.Ok(b.parseResults(bingResp))
}
```

### Response Types

```go
type BingSearchResponse struct {
    Type         string `json:"_type"` // External API: underscore prefix
    QueryContext struct {
        OriginalQuery string
    }
    WebPages struct {
        TotalEstimatedMatches int64
        Value                 []BingWebResult
    }
    RankingResponse struct {
        Mainline struct {
            Items []struct {
                ResultIndex int
                Value       struct {
                    Id string
                }
            }
        }
    }
}

type BingWebResult struct {
    Id                string
    Name              string
    Url               string
    DisplayUrl        string
    Snippet           string
    DateLastCrawled   string
    Language          string
    IsNavigational    bool
    IsFamilyFriendly  bool
}
```

### Result Parsing

```go
func (b *BingSearch) parseResults(resp BingSearchResponse) []Result {
    var results []SearchResult
    
    for i, item := range resp.WebPages.Value {
        results = append(results, SearchSearchResult{
            Title:       item.Name,
            Description: item.Snippet,
            URL:         item.URL,
            Position:    i + 1,
        })
    }
    
    return results
}
```

### Error Handling

```go
func (b *BingSearch) handleError(resp *http.Response) *appfault.AppError {
    switch resp.StatusCode {
    case 401:
        return appfault.New(
            "invalid API key",
        )
    case 403:
        b.quota.MarkExhausted()
        return appfault.New(
            "Bing Search quota exhausted",
        )
    case 429:
        return appfault.New(
            "rate limited",
        )
    default:
        return appfault.New(
            "API error from Bing",
        )
    }
}
```

---

## Advanced Search Options

```go
type BingSearchOptions struct {
    SearchOptions
    
    Market     string // Market code (e.g., "en-US")
    SafeSearch string // "Off", "Moderate", "Strict"
    Freshness  string // "Day", "Week", "Month"
    Site       string // Limit to specific site
}

func (b *BingSearch) SearchAdvanced(context stdctx.Context, query string, opts BingSearchOptions) SearchResultSlice {
    params := url.Values{}
    params.Set("q", b.buildAdvancedQuery(query, opts))
    params.Set("count", strconv.Itoa(opts.MaxResults))
    
    if opts.Market != "" {
        params.Set("mkt", opts.Market)
    }
    if opts.SafeSearch != "" {
        params.Set("safeSearch", opts.SafeSearch)
    }
    if opts.Freshness != "" {
        params.Set("freshness", opts.Freshness)
    }
    
    // ... rest of search logic
}

func (b *BingSearch) buildAdvancedQuery(query string, opts BingSearchOptions) string {
    if opts.Site != "" {
        return "site:" + opts.Site + " " + query
    }
    return query
}
```

---

## Rate Limiting

```go
type RateLimiter struct {
    requests  int
    window    time.Duration
    lastReset time.Time
    mu        sync.Mutex
}

func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
    return &RateLimiter{
        window:    window,
        lastReset: time.Now(),
    }
}

func (r *RateLimiter) Allow() bool {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    if time.Since(r.lastReset) > r.window {
        r.requests = 0
        r.lastReset = time.Now()
    }
    
    if r.requests >= 3 { // Bing limit: 3/second
        return false
    }
    
    r.requests++
    return true
}

func (r *RateLimiter) Wait(context stdctx.Context) *appfault.AppError {
    for !r.Allow() {
        select {
        case <-context.Done():
            return appfault.Wrap(
                context.Err(),
                "rate limiter wait cancelled",
            )
        case <-time.After(100 * time.Millisecond):
        }
    }
    return nil
}
```

---

## Configuration

```json
{
  "apis": {
    "bing": {
      "enabled": true,
      "apiKeyEnv": "BING_API_KEY",
      "endpoint": "https://api.bing.microsoft.com/v7.0/search",
      "monthlyQuota": 1000,
      "market": "en-US",
      "safeSearch": "Moderate"
    }
  }
}
```

---

## Related Specs

- [Configuration](./02-configuration.md) — API key management
- [Method Switching](./08-method-switching.md) — Fallback handling
- [Google API](./05-google-api.md) — Alternative API method
