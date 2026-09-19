# WP SEO Publish CLI: AI Bridge Client

**Version:** 2.1.0  
**Updated:** 2026-03-12  

---

## Overview

The AI Bridge Client handles all communication with AI Bridge CLI for SEO content generation, including request formatting, variable injection, and response parsing.

---

## Client Architecture

```go
type AiBridgeClient struct {
    baseUrl     string
    httpClient  *http.Client
    wsDialer    *websocket.Dialer
    varProcessor *VariableProcessor
}

type AiBridgeConfig struct {
    Url     string
    Timeout int    // seconds
}

func NewAiBridgeClient(cfg AiBridgeConfig) *AiBridgeClient {
    return &AiBridgeClient{
        baseUrl: strings.TrimRight(cfg.Url, "/"),
        httpClient: &http.Client{
            Timeout: time.Duration(cfg.Timeout) * time.Second,
        },
        wsDialer: websocket.DefaultDialer,
    }
}
```

---

## SEO Content Generation

### Request Structure

```go
type SeoRequest struct {
    // Content identification
    ContentType     string // category, blog_post, page, tag_page, press_release, notification
    Title           string
    
    // SEO parameters
    Keywords        []string
    Areas           []string `json:",omitempty"`
    
    // Variable injection
    Variables       json.RawMessage `json:",omitempty"`
    
    // Output configuration
    OutputFormat    string // html, markdown, json
    
    // Internal linking
    LinkDensity     LinkDensityConfig
    InternalLinks   []string `json:",omitempty"`
    SitemapRag      string   `json:",omitempty"`
    SlugGuideline   string   `json:",omitempty"`
    
    // Content hints
    Prompt          string          `json:",omitempty"`
    SampleHtml      string          `json:",omitempty"`
    SourceCompany   *CompanyContext `json:",omitempty"`
    TargetCompany   *CompanyContext `json:",omitempty"`
}

type CompanyContext struct {
    Name            string
    Description     string
    BaseUrl         string
    TypeOfBusiness  string
    Areas           []string
    Tone            string
    YearsExperience int
}
```

### Response Structure

```go
type SeoResponse struct {
    // Generated content
    Content         string
    Format          string
    
    // AI suggestions
    SuggestedCats   []string
    SuggestedTags   []string
    
    // Link information
    GeneratedSlugs  []Slug
    InternalLinks   []Link
    ExternalLinks   []Link
    
    // Metadata
    Metadata        SeoMeta
    
    // RAG context used
    RagContext      *RagInfo `json:",omitempty"`
}

type Slug struct {
    Slug        string
    Title       string
    Anchor      string
    Generated   bool   // true if newly created
}

type Link struct {
    Url         string
    Anchor      string
    Title       string
    Type        string // internal, external
    NoFollow    bool   `json:",omitempty"`
    NewTab      bool   `json:",omitempty"`
}

type SeoMeta struct {
    KeywordCount    int
    AreaMentions    int
    WordCount       int
    ParagraphCount  int
    TransitionRatio float64
    ReadabilityScore float64
}

type RagInfo struct {
    Source      string
    ChunksUsed  int
    UrlsFound   []string
}
```

---

## API Methods

### Generate SEO Content

```go
func (c *AiBridgeClient) GenerateSeo(req SeoRequest) appfault.Result[SeoResponse] {
    endpoint := c.baseUrl + "/api/seo/generate"
    
    jsonBody, marshalErr := json.Marshal(req)
    if marshalErr != nil {
        return appfault.FailWrap[SeoResponse](
            marshalErr,
            "E12301",
            "marshal SEO request",
        )
    }
    
    httpReq, reqErr := http.NewRequest(httpmethodtype.Post.HttpVerb(), endpoint, bytes.NewReader(jsonBody))
    if reqErr != nil {
        return appfault.FailWrap[SeoResponse](
            reqErr,
            "E12302",
            "create SEO request",
        )
    }
    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, doErr := c.httpClient.Do(httpReq)
    if doErr != nil {
        return appfault.FailWrap[SeoResponse](
            doErr,
            "E12303",
            "execute SEO request",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return appfault.Fail[SeoResponse](parseAiBridgeAppError(resp))
    }
    
    var result SeoResponse
    if decodeErr := json.NewDecoder(resp.Body).Decode(&result); decodeErr != nil {
        return appfault.FailWrap[SeoResponse](
            decodeErr,
            "E12304",
            "decode SEO response",
        )
    }
    
    return appfault.Ok(result)
}
```

### Stream SEO Content

```go
type SeoChunk struct {
    Type    string   // content, meta, link, done
    Content string   `json:",omitempty"`
    Link    *Link    `json:",omitempty"`
    Meta    *SeoMeta `json:",omitempty"`
    Error   string   `json:",omitempty"`
}

func (c *AiBridgeClient) GenerateSeoStream(req SeoRequest) appfault.Result[<-chan SeoChunk] {
    wsUrl := strings.Replace(c.baseUrl, "http", "ws", 1) + "/ws/seo/generate"
    
    conn, _, dialErr := c.wsDialer.Dial(wsUrl, nil)
    if dialErr != nil {
        return appfault.FailWrap[<-chan SeoChunk](
            dialErr,
            "E12305",
            "dial WebSocket for SEO stream",
        )
    }
    
    // Send request
    if writeErr := conn.WriteJson(req); writeErr != nil {
        conn.Close()

        return appfault.FailWrap[<-chan SeoChunk](
            writeErr,
            "E12306",
            "send SEO stream request",
        )
    }
    
    chunks := make(chan SeoChunk, 100)
    
    go func() {
        defer close(chunks)
        defer conn.Close()
        
        for {
            var chunk SeoChunk
            if readErr := conn.ReadJson(&chunk); readErr != nil {
                chunks <- SeoChunk{Type: "error", Error: readErr.Error()}

                return
            }
            
            chunks <- chunk
            
            if chunk.Type == "done" || chunk.Type == "error" {
                return
            }
        }
    }()
    
    return appfault.Ok((<-chan SeoChunk)(chunks))
}
```

### Suggest Categories

```go
type CategorySuggestionRequest struct {
    Content     string   
    Title       string   
    Keywords    []string `json:",omitempty"`
    MaxResults  int      `json:",omitempty"` // default: 6
}

type CategorySuggestion struct {
    Name        string  
    Confidence  float64 
    Reasoning   string  `json:",omitempty"`
}

func (c *AiBridgeClient) SuggestCategories(req CategorySuggestionRequest) CategorySuggestionSlice {
    endpoint := c.baseUrl + "/api/seo/suggest-categories"
    
    if req.MaxResults == 0 {
        req.MaxResults = 6
    }
    
    jsonBody, marshalErr := json.Marshal(req)
    if marshalErr != nil {
        return appfault.FailWrap[[]CategorySuggestion](
            marshalErr,
            "E12301",
            "marshal category suggestion request",
        )
    }
    
    httpReq, reqErr := http.NewRequest(httpmethodtype.Post.HttpVerb(), endpoint, bytes.NewReader(jsonBody))
    if reqErr != nil {
        return appfault.FailWrap[[]CategorySuggestion](
            reqErr,
            "E12302",
            "create category suggestion request",
        )
    }
    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, doErr := c.httpClient.Do(httpReq)
    if doErr != nil {
        return appfault.FailWrap[[]CategorySuggestion](
            doErr,
            "E12303",
            "execute category suggestion request",
        )
    }
    defer resp.Body.Close()
    
    var result struct {
        Suggestions []CategorySuggestion
    }
    if decodeErr := json.NewDecoder(resp.Body).Decode(&result); decodeErr != nil {
        return appfault.FailWrap[[]CategorySuggestion](
            decodeErr,
            "E12304",
            "decode category suggestions",
        )
    }
    
    return appfault.Ok(result.Suggestions)
}
```

### Suggest Tags

```go
type TagSuggestionRequest struct {
    Content     string   
    Title       string   
    Keywords    []string `json:",omitempty"`
    MaxResults  int      `json:",omitempty"` // default: 10
}

type TagSuggestion struct {
    Name        string  
    Confidence  float64 
}

func (c *AiBridgeClient) SuggestTags(req TagSuggestionRequest) TagSuggestionSlice {
    endpoint := c.baseUrl + "/api/seo/suggest-tags"
    // Similar implementation to SuggestCategories
    // ...
}
```

### Rewrite Content

```go
type RewriteContentRequest struct {
    OriginalContent string            
    Prompt          string            
    OutputFormat    string            
    Variables       json.RawMessage    `json:",omitempty"`
    PreserveLinks   bool              
    LinkDensity     *LinkDensityConfig `json:",omitempty"`
}

func (c *AiBridgeClient) RewriteContent(req RewriteContentRequest) appfault.Result[SeoResponse] {
    endpoint := c.baseUrl + "/api/seo/rewrite"
    
    jsonBody, marshalErr := json.Marshal(req)
    if marshalErr != nil {
        return appfault.FailWrap[SeoResponse](
            marshalErr,
            "E12301",
            "marshal rewrite request",
        )
    }
    
    httpReq, reqErr := http.NewRequest(httpmethodtype.Post.HttpVerb(), endpoint, bytes.NewReader(jsonBody))
    if reqErr != nil {
        return appfault.FailWrap[SeoResponse](
            reqErr,
            "E12302",
            "create rewrite request",
        )
    }
    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, doErr := c.httpClient.Do(httpReq)
    if doErr != nil {
        return appfault.FailWrap[SeoResponse](
            doErr,
            "E12303",
            "execute rewrite request",
        )
    }
    defer resp.Body.Close()
    
    var result SeoResponse
    if decodeErr := json.NewDecoder(resp.Body).Decode(&result); decodeErr != nil {
        return appfault.FailWrap[SeoResponse](
            decodeErr,
            "E12304",
            "decode rewrite response",
        )
    }
    
    return appfault.Ok(result)
}
```

---

## Sitemap RAG Integration

```go
type SitemapRagRequest struct {
    WebsiteId   string 
    SitemapUrl  string 
    ForceRefresh bool  
}

type SitemapRagResult struct {
    RagName     string    
    UrlsIndexed int       
    IndexedAt   time.Time 
}

// Request AI Bridge to index sitemap via GSearch
func (c *AiBridgeClient) IndexSitemap(req SitemapRagRequest) appfault.Result[SitemapRagResult] {
    endpoint := c.baseUrl + "/api/rag/sitemap/index"
    
    jsonBody, marshalErr := json.Marshal(req)
    if marshalErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            marshalErr,
            "E12301",
            "marshal sitemap index request",
        )
    }
    
    httpReq, reqErr := http.NewRequest(httpmethodtype.Post.HttpVerb(), endpoint, bytes.NewReader(jsonBody))
    if reqErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            reqErr,
            "E12302",
            "create sitemap index request",
        )
    }
    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, doErr := c.httpClient.Do(httpReq)
    if doErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            doErr,
            "E12303",
            "execute sitemap index request",
        )
    }
    defer resp.Body.Close()
    
    var result SitemapRagResult
    if decodeErr := json.NewDecoder(resp.Body).Decode(&result); decodeErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            decodeErr,
            "E12304",
            "decode sitemap index response",
        )
    }
    
    return appfault.Ok(result)
}

// Refresh sitemap cache
func (c *AiBridgeClient) RefreshSitemapCache(websiteId string) appfault.Result[SitemapRagResult] {
    endpoint := c.baseUrl + "/api/rag/sitemap/refresh/" + websiteId
    
    httpReq, reqErr := http.NewRequest(httpmethodtype.Post.HttpVerb(), endpoint, nil)
    if reqErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            reqErr,
            "E12302",
            "create sitemap refresh request",
        )
    }
    
    resp, doErr := c.httpClient.Do(httpReq)
    if doErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            doErr,
            "E12303",
            "execute sitemap refresh request",
        )
    }
    defer resp.Body.Close()
    
    var result SitemapRagResult
    if decodeErr := json.NewDecoder(resp.Body).Decode(&result); decodeErr != nil {
        return appfault.FailWrap[SitemapRagResult](
            decodeErr,
            "E12304",
            "decode sitemap refresh response",
        )
    }
    
    return appfault.Ok(result)
}

// Clear sitemap cache
func (c *AiBridgeClient) ClearSitemapCache(websiteId string) *appfault.AppError {
    endpoint := c.baseUrl + "/api/rag/sitemap/clear/" + websiteId
    
    httpReq, reqErr := http.NewRequest(httpmethodtype.Delete.HttpVerb(), endpoint, nil)
    if reqErr != nil {
        return appfault.Wrap(
            reqErr,
            "E12302",
            "create sitemap clear request",
        )
    }
    
    resp, doErr := c.httpClient.Do(httpReq)
    if doErr != nil {
        return appfault.Wrap(
            doErr,
            "E12303",
            "execute sitemap clear request",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return parseAiBridgeAppError(resp)
    }
    
    return nil
}
```

---

## Error Handling

```go
type AiBridgeError struct {
    Code    int    
    Message string 
    Details string `json:",omitempty"`
}

func parseAiBridgeAppError(resp *http.Response) *appfault.AppError {
    var abErr AiBridgeError
    if decodeErr := json.NewDecoder(resp.Body).Decode(&abErr); decodeErr != nil {
        return appfault.New(
            "E12310",
            fmt.Sprintf("HTTP %d: %s", resp.StatusCode, resp.Status),
        ).WithStatusCode(resp.StatusCode)
    }

    return appfault.New(
        fmt.Sprintf("E%d", AiBridgeErrorMapping[abErr.Code]),
        fmt.Sprintf("AI Bridge error [%d]: %s", abErr.Code, abErr.Message),
    ).WithStatusCode(resp.StatusCode)
}

// Error code mapping to WP SEO CLI codes
var AiBridgeErrorMapping = map[int]int{
    9001: 12201, // Model Error -> AI Bridge Error
    9100: 12202, // Chat Error -> AI Bridge Error
    9500: 12203, // SEO Module Error
    9550: 12204, // Variable Processing Error
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| Content Publisher | `03-content-publisher.md` |
| AI Bridge SEO Spec | `../../27-ai-bridge-cli/01-backend/17-ai-seo-core-guidelines.md` |
| AI Bridge Variable System | `../../27-ai-bridge-cli/01-backend/19-ai-seo-variable-system.md` |
