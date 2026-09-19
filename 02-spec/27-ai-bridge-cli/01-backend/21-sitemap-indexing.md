# AI Bridge CLI: Sitemap Indexing for Internal Linking

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

The **Sitemap Indexing** module enables AI Bridge CLI to ingest website sitemaps via GSearch CLI, store them as RAG memory, and use the indexed URLs for intelligent internal linking during SEO content generation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SITEMAP INDEXING ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   WP SEO Publish CLI                AI Bridge CLI                    GSearch CLI    │
│   ──────────────────                ──────────────                   ────────────   │
│                                                                                      │
│   ┌──────────────┐    HTTP Request  ┌──────────────┐   CLI Call    ┌────────────┐  │
│   │ Index Sitemap│ ───────────────▶ │ Sitemap      │ ─────────────▶│ Fetch &    │  │
│   │ Button       │                  │ Controller   │               │ Parse XML  │  │
│   └──────────────┘                  └──────────────┘               └────────────┘  │
│                                            │                              │         │
│                                            ▼                              │         │
│                                     ┌──────────────┐                      │         │
│                                     │ RAG Memory   │◀─────────────────────┘         │
│                                     │ (URLs Index) │   Return URLs                  │
│                                     └──────────────┘                                │
│                                            │                                        │
│                                            ▼                                        │
│   ┌──────────────┐                  ┌──────────────┐                                │
│   │ Generated    │ ◀───────────────│ SEO Generate │                                │
│   │ Content with │   Internal Links │ (Use RAG)   │                                │
│   │ Links        │                  └──────────────┘                                │
│   └──────────────┘                                                                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Sitemap Configuration

```go
type SitemapConfig struct {
    WebsiteId       string   // Unique identifier
    SitemapUrl      string   // Main sitemap URL
    CacheDuration   int      // Hours before auto-refresh (0 = manual only)
    IncludePatterns []string // URL patterns to include
    ExcludePatterns []string // URL patterns to exclude
    MaxUrls         int      // Maximum URLs to index (0 = unlimited)
}

type SitemapIndex struct {
    Id            string
    WebsiteId     string
    RagName       string    // RAG memory reference
    SitemapUrl    string
    UrlCount      int
    IndexedAt     string
    RefreshedAt   string
    Status        string    // pending, indexing, ready, error
    ErrorMessage  string    `json:",omitempty"`
}
```

### Indexed URL Entry

```go
type IndexedUrl struct {
    Id            string
    SitemapId     string
    Url           string
    Path          string    // Extracted path from URL
    Title         string    // Extracted from page or sitemap
    Keywords      []string  // Extracted keywords
    LastModified  string    // From sitemap
    Priority      float64   // From sitemap (0.0-1.0)
    ChangeFreq    string    // daily, weekly, monthly, etc.
    Embedding     []float64 // Vector embedding for semantic search
}
```

---

## GSearch CLI Integration

### Sitemap Fetch Command

AI Bridge CLI delegates sitemap fetching to GSearch CLI:

```bash
# Fetch and parse sitemap
gsearch sitemap fetch "https://example.com/sitemap.xml" \
  --output json \
  --include "*.html" \
  --exclude "/admin/*,/tag/*" \
  --max-urls 5000
```

### GSearch Sitemap Service

```go
// In GSearch CLI: 02-spec/25-gsearch-cli/01-backend/

type SitemapService struct {
    HttpClient  *http.Client
    Cache       *CacheService
}

type SitemapResult struct {
    SitemapUrl   string
    UrlCount     int
    Urls         []SitemapEntry
    FetchedAt    string
    Errors       []string `json:",omitempty"`
}

type SitemapEntry struct {
    Loc          string    // Full URL
    LastMod      string    `json:",omitempty"`
    ChangeFreq   string    `json:",omitempty"`
    Priority     float64   `json:",omitempty"`
    Title        string    `json:",omitempty"` // If fetched
}

func (s *SitemapService) FetchSitemap(url string, config *SitemapFetchConfig) appfault.Result[*SitemapResult] {
    // Check cache first
    cacheKey := s.buildCacheKey(url, config)
    // EXEMPTED: typed accessor internal — cache stores known *SitemapResult values (§7.2)
    if cached, ok := s.Cache.Get(cacheKey); ok {
        return appfault.Ok(cached.(*SitemapResult))
    }
    
    // Fetch sitemap XML
    resp, err := s.HttpClient.Get(url)
    if err != nil {
        return appfault.FailWrap[*SitemapResult](
            err,
            ErrSitemapFetchFailed,
            "failed to fetch sitemap",
        )
    }

    defer resp.Body.Close()
    
    // Parse XML (handle sitemap index and urlset)
    parseResult := s.parseSitemap(resp.Body, config)
    if parseResult.IsErr() {
        return appfault.Fail[*SitemapResult](parseResult.Err())
    }

    result := parseResult.Value()
    
    // Apply filters
    result.Urls = s.filterUrls(result.Urls, config)
    result.UrlCount = len(result.Urls)
    result.FetchedAt = time.Now().Format(time.RFC3339)
    
    // Cache result
    s.Cache.Set(cacheKey, result, 24*time.Hour)
    
    return appfault.Ok(result)
}
```

---

## AI Bridge CLI Sitemap Controller

### Controller Implementation

```go
type SitemapController struct {
    GSearchClient   *GSearchClient
    RagService      *RAGService
    DbManager       *DatabaseManager
}

func (c *SitemapController) IndexSitemap(req *SitemapIndexRequest) appfault.Result[*SitemapIndex] {
    // 1. Create index record
    index := &SitemapIndex{
        Id:         generateId("sitemap"),
        WebsiteId:  req.WebsiteId,
        SitemapUrl: req.SitemapUrl,
        Status:     "indexing",
        IndexedAt:  time.Now().Format(time.RFC3339),
    }
    
    // 2. Fetch sitemap via GSearch
    fetchResult := c.GSearchClient.FetchSitemap(req.SitemapUrl, &SitemapFetchConfig{
        IncludePatterns: req.IncludePatterns,
        ExcludePatterns: req.ExcludePatterns,
        MaxUrls:         req.MaxUrls,
    })
    if fetchResult.IsErr() {
        index.Status = "error"
        index.ErrorMessage = fetchResult.Err().Error()
        c.saveIndex(index)
        return appfault.Fail[*SitemapIndex](fetchResult.Err())
    }

    result := fetchResult.Value()
    
    // 3. Create RAG memory for URLs
    ragName := fmt.Sprintf("sitemap_%s", req.WebsiteId)
    index.RagName = ragName
    
    // 4. Generate embeddings and store
    for _, entry := range result.Urls {
        content := c.buildSearchableContent(entry)
        
        embedResult := c.RagService.GenerateEmbedding(content)
        if embedResult.IsErr() {
            continue // Log and skip
        }
        
        c.RagService.StoreChunk(ragName, &RagChunk{
            Id:        generateId("url"),
            Content:   content,
            Embedding: embedResult.Value(),
            Metadata: SitemapChunkMetadata{
                Url:          entry.Loc,
                Path:         extractPath(entry.Loc),
                Title:        entry.Title,
                LastModified: entry.LastMod,
                Priority:     entry.Priority,
            },
        })
    }
    
    // 5. Update index status
    index.UrlCount = result.UrlCount
    index.Status = "ready"
    c.saveIndex(index)
    
    return appfault.Ok(index)
}

func (c *SitemapController) buildSearchableContent(entry SitemapEntry) string {
    // Extract meaningful words from URL path
    path := extractPath(entry.Loc)
    words := extractWordsFromPath(path)
    
    // Combine with title if available
    if entry.Title != "" {
        return fmt.Sprintf("%s %s", entry.Title, strings.Join(words, " "))
    }
    
    return strings.Join(words, " ")
}

// Extract path segments as words
func extractWordsFromPath(path string) []string {
    // /services/house-cleaning/melbourne → [services, house, cleaning, melbourne]
    path = strings.TrimPrefix(path, "/")
    path = strings.TrimSuffix(path, "/")
    segments := strings.Split(path, "/")
    
    var words []string
    for _, seg := range segments {
        // Split by hyphen and underscore
        parts := strings.FieldsFunc(seg, func(r rune) bool {
            return r == '-' || r == '_'
        })
        words = append(words, parts...)
    }
    
    return words
}
```

---

## Internal Linking Service

### Link Finder

```go
type InternalLinkService struct {
    RagService      *RAGService
    SlugGuidelines  *SlugGuidelineConfig
}

type LinkFinderConfig struct {
    SitemapRag      string    // RAG name to search
    MaxLinks        int       // Max links to find
    MinSimilarity   float64   // Minimum similarity score
    Density         string    // per_sentence, per_paragraph
    LinksPerUnit    int       // Links per sentence/paragraph
    NewSlugLimit    int       // Max new slugs to generate per content
}

type FoundLink struct {
    Url           string
    Anchor        string
    Title         string
    Similarity    float64
    Generated     bool    // True if slug was generated
}

func (s *InternalLinkService) FindLinksForKeywords(
    keywords []string,
    config *LinkFinderConfig,
) appfault.ResultSlice[FoundLink] {
    var links []FoundLink
    generatedCount := 0
    
    for _, keyword := range keywords {
        // Search RAG for matching URLs
        results, err := s.RagService.Search(config.SitemapRag, keyword, 5, config.MinSimilarity)
        if err != nil {
            continue
        }
        
        if len(results) > 0 {
            // Use existing URL
            best := results[0]
            bestUrl, _ := best.Metadata["Url"].(string)
            links = append(links, FoundLink{
                Url:        bestUrl,
                Anchor:     keyword,
                Title:      s.generateTitleAttribute(keyword, best),
                Similarity: best.Score,
                Generated:  false,
            })
        } else if generatedCount < config.NewSlugLimit {
            // Generate new slug
            slug := s.generateSlug(keyword)
            links = append(links, FoundLink{
                Url:       "/" + slug,
                Anchor:    keyword,
                Title:     s.generateTitleAttribute(keyword, nil),
                Generated: true,
            })
            generatedCount++
        }
        
        if len(links) >= config.MaxLinks {
            break
        }
    }
    
    return appfault.Ok(links)
}

func (s *InternalLinkService) generateSlug(keyword string) string {
    // Apply slug guidelines: 3-4 words max, no hyphens in display
    words := strings.Fields(strings.ToLower(keyword))
    
    // Limit to 3-4 words
    if len(words) > 4 {
        words = words[:4]
    }
    
    // Join with hyphens for URL
    return strings.Join(words, "-")
}

func (s *InternalLinkService) generateTitleAttribute(keyword string, match *RagResult) string {
    // Title should be different from anchor text (Rule 10)
    if match != nil && match.Metadata["Title"] != nil {
        if title, ok := match.Metadata["Title"].(string); ok {
            return title
        }
    }
    
    // Generate descriptive title
    return fmt.Sprintf("Learn more about %s services", keyword)
}
```

---

## Chunk-Based Content Generation

### Paragraph Chunking for Link Injection

```go
type ChunkProcessor struct {
    LinkService     *InternalLinkService
    Config          *LinkDensityConfig
}

type LinkDensityConfig struct {
    Mode            string    // per_sentence, per_paragraph
    LinksPerUnit    int       // Links per sentence/paragraph
    MinParagraphLen int       // Minimum words to add links
    MaxTotalLinks   int       // Maximum links per content
    NewSlugLimit    int       // Max new slugs to create
}

type ProcessedChunk struct {
    OriginalText    string
    ProcessedText   string
    LinksAdded      []FoundLink
    ChunkIndex      int
}

// ProcessedContent holds the result of content processing
type ProcessedContent struct {
    Content string
    Links   []FoundLink
}

func (p *ChunkProcessor) ProcessContent(
    content string,
    keywords []string,
    sitemapRag string,
) appfault.Result[ProcessedContent] {
    paragraphs := strings.Split(content, "\n\n")
    var allLinks []FoundLink
    var processedParagraphs []string
    totalLinks := 0
    
    for i, para := range paragraphs {
        if totalLinks >= p.Config.MaxTotalLinks {
            processedParagraphs = append(processedParagraphs, para)
            continue
        }
        
        words := strings.Fields(para)
        if len(words) < p.Config.MinParagraphLen {
            processedParagraphs = append(processedParagraphs, para)
            continue
        }
        
        // Find links for this paragraph
        linksToAdd := p.Config.LinksPerUnit
        if p.Config.MaxTotalLinks-totalLinks < linksToAdd {
            linksToAdd = p.Config.MaxTotalLinks - totalLinks
        }
        
        links, err := p.LinkService.FindLinksForKeywords(
            keywords,
            &LinkFinderConfig{
                SitemapRag:    sitemapRag,
                MaxLinks:      linksToAdd,
                MinSimilarity: 0.7,
                Density:       p.Config.Mode,
                LinksPerUnit:  p.Config.LinksPerUnit,
                NewSlugLimit:  p.Config.NewSlugLimit - len(allLinks),
            },
        )
        if err != nil {
            processedParagraphs = append(processedParagraphs, para)
            continue
        }
        
        // Inject links into paragraph
        processedPara := p.injectLinks(para, links)
        processedParagraphs = append(processedParagraphs, processedPara)
        allLinks = append(allLinks, links...)
        totalLinks += len(links)
    }
    
    return appfault.Ok(ProcessedContent{
        Content: strings.Join(processedParagraphs, "\n\n"),
        Links:   allLinks,
    })
}

func (p *ChunkProcessor) injectLinks(paragraph string, links []FoundLink) string {
    result := paragraph
    
    for _, link := range links {
        // Find keyword in paragraph and wrap with link
        // Case-insensitive replacement
        pattern := regexp.MustCompile(`(?i)\b` + regexp.QuoteMeta(link.Anchor) + `\b`)
        
        // Only replace first occurrence
        if pattern.MatchString(result) {
            linkHtml := fmt.Sprintf(
                `<a href="%s" title="%s">%s</a>`,
                link.Url,
                html.EscapeString(link.Title),
                link.Anchor,
            )
            result = pattern.ReplaceAllStringFunc(result, func(match string) string {
                // Only replace once
                return linkHtml
            })
        }
    }
    
    return result
}
```

---

## Database Schema

### Sitemap Index Tables (AI Bridge)

```sql
-- ============================================
-- Table: SitemapIndexes (per-app sitemap registry)
-- ============================================
CREATE TABLE SitemapIndexes (
    Id TEXT PRIMARY KEY,
    WebsiteId TEXT NOT NULL,
    SitemapUrl TEXT NOT NULL,
    RagName TEXT,
    UrlCount INTEGER DEFAULT 0,
    Status TEXT DEFAULT 'pending',
    ErrorMessage TEXT,
    CacheDuration INTEGER DEFAULT 24,
    IncludePatterns TEXT,
    ExcludePatterns TEXT,
    MaxUrls INTEGER DEFAULT 0,
    IndexedAt TEXT,
    RefreshedAt TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(WebsiteId)
);

CREATE INDEX IdxSitemapIndexWebsite ON SitemapIndexes(WebsiteId);
CREATE INDEX IdxSitemapIndexStatus ON SitemapIndexes(Status);

-- ============================================
-- Table: SitemapRefreshLog (refresh history)
-- ============================================
CREATE TABLE SitemapRefreshLog (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SitemapId TEXT NOT NULL,
    PreviousUrlCount INTEGER,
    NewUrlCount INTEGER,
    UrlsAdded INTEGER,
    UrlsRemoved INTEGER,
    RefreshedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    DurationMs INTEGER,
    FOREIGN KEY (SitemapId) REFERENCES SitemapIndexes(Id)
);
```

---

## API Endpoints

### Sitemap Management

```
POST /api/v1/rag/sitemap/index
  Body: {
    "WebsiteId": "site_abc",
    "SitemapUrl": "https://example.com/sitemap.xml",
    "IncludePatterns": ["*.html", "/services/*"],
    "ExcludePatterns": ["/admin/*", "/tag/*"],
    "MaxUrls": 5000,
    "CacheDuration": 24
  }
  Returns: { "Id": "...", "Status": "indexing", "RagName": "sitemap_site_abc" }

GET /api/v1/rag/sitemap/:websiteId
  Returns: Sitemap index details with URL count and status

POST /api/v1/rag/sitemap/refresh/:websiteId
  Force-refreshes the sitemap cache
  Returns: Updated SitemapIndex

DELETE /api/v1/rag/sitemap/clear/:websiteId
  Clears the sitemap RAG cache
  Returns: { "Cleared": true }

GET /api/v1/rag/sitemap/:websiteId/search?q=keyword
  Searches the sitemap RAG for matching URLs
  Returns: Array of matching URLs with similarity scores

GET /api/v1/rag/sitemap/:websiteId/urls
  Returns: Paginated list of indexed URLs
```

### Link Generation

```
POST /api/v1/seo/links/find
  Body: {
    "Keywords": ["cleaning service", "Melbourne"],
    "SitemapRag": "sitemap_site_abc",
    "MaxLinks": 10,
    "MinSimilarity": 0.7,
    "NewSlugLimit": 2
  }
  Returns: Array of FoundLink objects

POST /api/v1/seo/links/inject
  Body: {
    "Content": "...",
    "Keywords": [...],
    "SitemapRag": "sitemap_site_abc",
    "Config": { "Mode": "PerParagraph", "LinksPerUnit": 3 }
  }
  Returns: { "Content": "...", "LinksAdded": [...] }
```

---

## Configuration

### Default Settings (config.seed.json)

```json
{
  "sitemap": {
    "DefaultCacheDuration": 24,
    "MaxUrlsDefault": 10000,
    "MinSimilarityThreshold": 0.7,
    "NewSlugLimitDefault": 2,
    "LinkDensity": {
      "Mode": "PerParagraph",
      "LinksPerUnit": 3,
      "MinParagraphLength": 50,
      "MaxTotalLinks": 20
    },
    "SlugGuidelines": {
      "MinWords": 3,
      "MaxWords": 4,
      "Separator": "-",
      "LowercaseOnly": true
    }
  }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9600 | SITEMAP_FETCH_ERROR | Failed to fetch sitemap from URL |
| 9601 | SITEMAP_PARSE_ERROR | Failed to parse sitemap XML |
| 9602 | SITEMAP_NOT_FOUND | Website sitemap index not found |
| 9603 | SITEMAP_INDEXING | Sitemap is currently being indexed |
| 9604 | SITEMAP_RAG_ERROR | Failed to store/query RAG memory |
| 9605 | SITEMAP_URL_LIMIT | Maximum URL limit exceeded |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| AI SEO Core Guidelines | `17-ai-seo-core-guidelines.md` |
| AI SEO Generate | `13-ai-seo-generate.md` |
| GSearch Platform Search | `../../25-gsearch-cli/01-backend/23-platform-search.md` |
| WP SEO AI Bridge Client | `../../36-wp-seo-publish-cli/01-backend/04-ai-bridge-client.md` |
