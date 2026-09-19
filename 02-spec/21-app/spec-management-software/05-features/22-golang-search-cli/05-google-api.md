# Component: Google API

**Parent:** [Golang Search CLI](./00-overview.md)  
**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Summary

Google Custom Search API and Search Console API integration for reliable, structured search results.

---

## API Options

| API | Purpose | Quota | Cost |
|-----|---------|-------|------|
| Custom Search JSON API | Web search | 100/day free | $5/1000 queries |
| Search Console API | Site performance | High | Free |

---

## Dependencies

- `google.golang.org/api/customsearch/v1` — Custom Search API
- `google.golang.org/api/searchconsole/v1` — Search Console API
- `golang.org/x/oauth2/google` — Authentication

---

## Custom Search API

### Setup

```go
package search

import (
    stdctx "context"
    
    "google.golang.org/api/customsearch/v1"
    "google.golang.org/api/option"
    "gsearch/pkg/apperror"
)

type GoogleCustomSearch struct {
    service *customsearch.Service
    apiKey  string
    cx      string // Custom Search Engine ID
    quota   *QuotaTracker
}

func NewGoogleCustomSearch(apiKey, cx string, dailyQuota int) apperror.Result[*GoogleCustomSearch] {
    context := stdctx.Background()
    
    service, err := customsearch.NewService(context, option.WithApiKey(apiKey))
    if err != nil {
        return apperror.Fail[*GoogleCustomSearch](
            apperror.Wrap(
                err,
                "create service",
            ),
        )
    }
    
    return apperror.OK(&GoogleCustomSearch{
        service: service,
        apiKey:  apiKey,
        cx:      cx,
        quota:   NewQuotaTracker(dailyQuota),
    })
}

func (g *GoogleCustomSearch) Id() string        { return "google_api" }
func (g *GoogleCustomSearch) Name() string      { return "Google Custom Search API" }
func (g *GoogleCustomSearch) RequiresApi() bool { return true }

func (g *GoogleCustomSearch) IsAvailable() bool {
    return g.apiKey != "" && g.cx != "" && !g.quota.IsExhausted()
}
```

### Search Implementation

```go
func (g *GoogleCustomSearch) Search(context stdctx.Context, query string, opts SearchOptions) apperror.Result[[]Result] {
    if !g.quota.CanMakeRequest() {
        return apperror.Fail[[]Result](
            apperror.New(
                "Google Custom Search quota exhausted",
            ),
        )
    }
    
    call := g.service.Cse.List()
    call.Cx(g.cx)
    call.Q(query)
    call.Num(int64(opts.MaxResults))
    
    resp, err := call.Context(context).Do()
    if err != nil {
        return apperror.Fail[[]Result](g.handleError(err))
    }
    
    g.quota.RecordRequest()
    
    return apperror.OK(g.parseResults(resp))
}

func (g *GoogleCustomSearch) parseResults(resp *customsearch.Search) []Result {
    var results []Result
    
    for i, item := range resp.Items {
        results = append(results, Result{
            Title:       item.Title,
            Description: item.Snippet,
            URL:         item.Link,
            Position:    i + 1,
        })
    }
    
    return results
}

func (g *GoogleCustomSearch) handleError(err error) *apperror.AppError {
    errStr := err.Error()
    
    if strings.Contains(errStr, "403") || strings.Contains(errStr, "quota") {
        g.quota.MarkExhausted()
        return apperror.New(
            "Google Custom Search quota exhausted",
        )
    }
    
    if strings.Contains(errStr, "429") {
        return apperror.New(
            "rate limited (429)",
        )
    }
    
    return apperror.Wrap(
        err,
        "network error",
    )
}
```

---

## Search Console API

### Setup

```go
type GoogleSearchConsole struct {
    service *searchconsole.Service
    siteUrl string
}

func NewGoogleSearchConsole(credentialsPath, siteUrl string) apperror.Result[*GoogleSearchConsole] {
    context := stdctx.Background()
    
    // Read credentials file
    creds, err := pathutil.ReadFile(credentialsPath)
    if err != nil {
        return apperror.Fail[*GoogleSearchConsole](
            apperror.Wrap(
                err,
                "read credentials",
            ),
        )
    }
    
    // Create JWT config
    config, err := google.JwtConfigFromJson(creds, searchconsole.WebmastersReadonlyScope)
    if err != nil {
        return apperror.Fail[*GoogleSearchConsole](
            apperror.Wrap(
                err,
                "create config",
            ),
        )
    }
    
    client := config.Client(context)
    
    service, err := searchconsole.NewService(context, option.WithHttpClient(client))
    if err != nil {
        return apperror.Fail[*GoogleSearchConsole](
            apperror.Wrap(
                err,
                "create service",
            ),
        )
    }
    
    return apperror.OK(&GoogleSearchConsole{
        service: service,
        siteUrl: siteUrl,
    })
}

func (g *GoogleSearchConsole) Id() string        { return "search_console" }
func (g *GoogleSearchConsole) Name() string      { return "Google Search Console" }
func (g *GoogleSearchConsole) RequiresApi() bool { return true }
func (g *GoogleSearchConsole) IsAvailable() bool { return g.service != nil }
```

### Query Analytics

```go
// Search Console provides analytics, not direct search results
// Use for keyword research and performance data

type SearchAnalytics struct {
    Query       string
    Clicks      int64
    Impressions int64
    CTR         float64
    Position    float64
}

func (g *GoogleSearchConsole) GetKeywordAnalytics(context stdctx.Context, startDate, endDate string) apperror.Result[[]SearchAnalytics] {
    req := &searchconsole.SearchAnalyticsQueryRequest{
        StartDate:  startDate,
        EndDate:    endDate,
        Dimensions: []string{"query"},
        RowLimit:   1000,
    }
    
    resp, err := g.service.Searchanalytics.Query(g.siteUrl, req).Context(context).Do()
    if err != nil {
        return apperror.Fail[[]SearchAnalytics](
            apperror.Wrap(
                err,
                "query analytics",
            ),
        )
    }
    
    var analytics []SearchAnalytics
    for _, row := range resp.Rows {
        analytics = append(analytics, SearchAnalytics{
            Query:       row.Keys[0],
            Clicks:      int64(row.Clicks),
            Impressions: int64(row.Impressions),
            CTR:         row.Ctr,
            Position:    row.Position,
        })
    }
    
    return apperror.OK(analytics)
}
```

---

## Quota Tracking

```go
type QuotaTracker struct {
    dailyLimit int
    used       int
    resetTime  time.Time
    mu         sync.Mutex
}

func NewQuotaTracker(dailyLimit int) *QuotaTracker {
    return &QuotaTracker{
        dailyLimit: dailyLimit,
        resetTime:  getNextMidnightUTC(),
    }
}

func (q *QuotaTracker) CanMakeRequest() bool {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    q.checkReset()
    return q.used < q.dailyLimit
}

func (q *QuotaTracker) RecordRequest() {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    q.checkReset()
    q.used++
}

func (q *QuotaTracker) IsExhausted() bool {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    q.checkReset()
    return q.used >= q.dailyLimit
}

func (q *QuotaTracker) MarkExhausted() {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    q.used = q.dailyLimit
}

func (q *QuotaTracker) checkReset() {
    if time.Now().After(q.resetTime) {
        q.used = 0
        q.resetTime = getNextMidnightUTC()
    }
}

func getNextMidnightUTC() time.Time {
    now := time.Now().UTC()
    return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
}
```

---

## Configuration

```json
{
  "apis": {
    "googleCustomSearch": {
      "enabled": true,
      "apiKeyEnv": "GOOGLE_CSE_API_KEY",
      "engineId": "your-search-engine-id",
      "dailyQuota": 100
    },
    "googleSearchConsole": {
      "enabled": false,
      "credentialsPath": "./google-credentials.json",
      "siteUrl": "https://your-site.com"
    }
  }
}
```

---

## Error Types

```go
// Error types are now handled via apperror.New/Wrap
// Example:
// apperror.New("Google Custom Search quota exhausted")
// apperror.Wrap(err, "create service")
```

---

## Related Specs

- [Configuration](./02-configuration.md) — API settings
- [Method Switching](./08-method-switching.md) — Fallback handling
