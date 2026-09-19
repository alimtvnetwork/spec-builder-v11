# Component: DuckDuckGo Search

**Parent:** [Golang Search CLI](./00-overview.md)  
**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Summary

DuckDuckGo search integration using HTML parsing (no official API) with privacy-focused, non-tracking results.

---

## Advantages

| Feature | Benefit |
|---------|---------|
| No API key required | Zero setup cost |
| Privacy-focused | No tracking parameters |
| Less aggressive blocking | More lenient than Google |
| Instant Answers | Rich snippets for common queries |

---

## Implementation

### Search Method

```go
package search

import (
    stdctx "context"
    "net/http"
    "net/url"
    "strings"
    "time"
    
    "github.com/PuerkitoBio/goquery"
    "gsearch/pkg/appfault"
)

type DuckDuckGoSearch struct {
    client    *http.Client
    userAgent string
    endpoint  string
}

func NewDuckDuckGoSearch(cfg *config.DdgConfig, userAgent string) *DuckDuckGoSearch {
    endpoint := cfg.Endpoint
    if endpoint == "" {
        endpoint = "https://html.duckduckgo.com/html/"
    }
    
    return &DuckDuckGoSearch{
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
        userAgent: userAgent,
        endpoint:  endpoint,
    }
}

func (d *DuckDuckGoSearch) Id() string        { return "duckduckgo" }
func (d *DuckDuckGoSearch) Name() string      { return "DuckDuckGo" }
func (d *DuckDuckGoSearch) IsAvailable() bool { return true }
func (d *DuckDuckGoSearch) RequiresApi() bool { return false }
```

### Search Execution

```go
func (d *DuckDuckGoSearch) Search(context stdctx.Context, query string, opts SearchOptions) appfault.Result[[]Result] {
    // Build form data (DDG uses POST)
    formData := url.Values{}
    formData.Set("q", query)
    formData.Set("b", "") // No pagination offset
    formData.Set("kl", "us-en") // Region
    
    req, err := http.NewRequestWithContext(context, httpmethod.Post.String(), d.endpoint, strings.NewReader(formData.Encode()))
    if err != nil {
        return appfault.Fail[[]Result](
            appfault.Wrap(
                err,
                "create request",
            ),
        )
    }
    
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    req.Header.Set("User-Agent", d.userAgent)
    req.Header.Set("Accept", "text/html")
    req.Header.Set("Accept-Language", "en-US,en;q=0.9")
    
    resp, err := d.client.Do(req)
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
        return appfault.Fail[[]Result](
            appfault.New(
                "unexpected status from DuckDuckGo",
            ),
        )
    }
    
    doc, err := goquery.NewDocumentFromReader(resp.Body)
    if err != nil {
        return appfault.Fail[[]Result](
            appfault.Wrap(
                err,
                "parse HTML",
            ),
        )
    }
    
    return appfault.Ok(d.parseResults(doc, opts.MaxResults))
}
```

### Result Parsing

```go
func (d *DuckDuckGoSearch) parseResults(doc *goquery.Document, maxResults int) []Result {
    var results []Result
    position := 0
    
    // Parse organic results
    doc.Find("div.result").Each(func(i int, s *goquery.Selection) {
        if position >= maxResults {
            return
        }
        
        // Skip ads
        if s.HasClass("result--ad") {
            return
        }
        
        result, ok := d.parseResultItem(s)
        if !ok {
            return
        }
        
        position++
        result.Position = position
        results = append(results, result)
    })
    
    return results
}

func (d *DuckDuckGoSearch) parseResultItem(s *goquery.Selection) (Result, bool) {
    // Title and URL
    titleLink := s.Find("a.result__a").First()
    title := strings.TrimSpace(titleLink.Text())
    href, exists := titleLink.Attr("href")
    if !exists || title == "" {
        return Result{}, false
    }
    
    // Extract actual URL from DDG redirect
    actualUrl := d.extractActualUrl(href)
    
    // Description/Snippet
    snippet := s.Find("a.result__snippet").First()
    description := strings.TrimSpace(snippet.Text())
    
    return Result{
        Title:       title,
        Description: description,
        Url:         actualUrl,
    }, true
}

func (d *DuckDuckGoSearch) extractActualUrl(ddgUrl string) string {
    // DuckDuckGo wraps URLs in a redirect: //duckduckgo.com/l/?uddg=...
    if strings.HasPrefix(ddgUrl, "//duckduckgo.com/l/") {
        parsed, err := url.Parse("https:" + ddgUrl)
        if err == nil {
            if uddg := parsed.Query().Get("uddg"); uddg != "" {
                decoded, err := url.QueryUnescape(uddg)
                if err == nil {
                    return decoded
                }
            }
        }
    }
    
    // Handle relative URLs
    if strings.HasPrefix(ddgUrl, "//") {
        return "https:" + ddgUrl
    }
    
    return ddgUrl
}
```

### Instant Answers

```go
// DuckDuckGo Instant Answer API (JSON, free to use)
type InstantAnswer struct {
    Abstract      string
    AbstractUrl   string
    Answer        string
    AnswerType    string
    Definition    string
    Heading       string
    Image         string
    RelatedTopics []struct {
        Text     string
        FirstUrl string
    }
}

func (d *DuckDuckGoSearch) GetInstantAnswer(context stdctx.Context, query string) appfault.Result[*InstantAnswer] {
    params := url.Values{}
    params.Set("q", query)
    params.Set("format", "json")
    params.Set("no_html", "1")
    params.Set("skip_disambig", "1")
    
    reqUrl := "https://api.duckduckgo.com/?" + params.Encode()
    
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), reqUrl, nil)
    if err != nil {
        return appfault.Fail[*InstantAnswer](
            appfault.Wrap(
                err,
                "create request",
            ),
        )
    }
    
    req.Header.Set("User-Agent", d.userAgent)
    
    resp, err := d.client.Do(req)
    if err != nil {
        return appfault.Fail[*InstantAnswer](
            appfault.Wrap(
                err,
                "network error",
            ),
        )
    }
    defer resp.Body.Close()
    
    var answer InstantAnswer
    if err := json.NewDecoder(resp.Body).Decode(&answer); err != nil {
        return appfault.Fail[*InstantAnswer](
            appfault.Wrap(
                err,
                "decode instant answer",
            ),
        )
    }
    
    return appfault.Ok(&answer)
}
```

---

## Region Support

```go
var ddgRegions = map[string]string{
    "us":    "us-en",
    "uk":    "uk-en",
    "de":    "de-de",
    "fr":    "fr-fr",
    "es":    "es-es",
    "jp":    "jp-jp",
    "global": "wt-wt", // No region preference
}

func (d *DuckDuckGoSearch) SearchWithRegion(context stdctx.Context, query, region string, opts SearchOptions) appfault.Result[[]Result] {
    kl, ok := ddgRegions[region]
    if !ok {
        kl = "us-en"
    }
    
    formData := url.Values{}
    formData.Set("q", query)
    formData.Set("kl", kl)
    
    // ... rest of search logic
}
```

---

## Configuration

```json
{
  "apis": {
    "duckduckgo": {
      "enabled": true,
      "endpoint": "https://html.duckduckgo.com/html/",
      "region": "us",
      "safeSearch": "moderate"
    }
  }
}
```

---

## Limitations

| Limitation | Workaround |
|------------|------------|
| No official API | Use HTML parsing |
| Limited results per page | Parse multiple pages |
| No date filtering | Filter results client-side |
| Rate limiting on abuse | Respectful request delays |

---

## Related Specs

- [HTML Parser](./04-html-parser.md) — Shared parsing logic
- [Method Switching](./08-method-switching.md) — Fallback handling
