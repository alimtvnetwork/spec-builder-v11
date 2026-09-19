# GSearch CLI: Platform-Specific Search

**Version:** 2.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

The **Platform Search** module extends GSearch with targeted search capabilities for specific platforms like YouTube, Reddit, and other content sources. This enables AI SEO content to embed relevant videos and discussions.

---

## Supported Platforms

| Platform | Search Type | Output |
|----------|-------------|--------|
| **YouTube** | Video search | Video metadata + embed code + deep extraction |
| **Reddit** | Discussion search | Thread metadata + top comments |
| **Medium** | Article search | Article metadata + author + claps |
| **LinkedIn** | Post/profile search | Post metadata + company data |
| **Vimeo** | Video search | Video metadata + embed code |
| **Twitter/X** | Social search | Tweet metadata + embed code |
| **GitHub** | Repository search | Repo metadata + README excerpts |

---

## CLI Commands

### YouTube Search

```bash
# Search YouTube for relevant videos
gsearch platform youtube "cleaning tips Melbourne" \
  --max-results 5 \
  --sort relevance \
  --published-after 2024-01-01 \
  --output json

# With duration filter
gsearch platform youtube "house cleaning tutorial" \
  --duration medium \
  --hd-only \
  --output embed
```

### Reddit Search

```bash
# Search Reddit discussions
gsearch platform reddit "best cleaning services Melbourne" \
  --subreddits melbourne,homeimprovement \
  --sort top \
  --time-filter year \
  --min-score 50

# Search specific subreddit
gsearch platform reddit "cleaning tips" \
  --subreddits cleaningtips \
  --include-comments \
  --max-comments 10
```

### Multi-Platform Search

```bash
# Search across platforms
gsearch platform multi "Melbourne cleaning services" \
  --platforms youtube,reddit \
  --max-per-platform 3 \
  --output json
```

---

## Platform Configurations

### YouTube Configuration

```go
type YouTubeConfig struct {
    ApiKey            string // API key
    MaxResults        int    // Default: 10
    SafeSearch        string // none, moderate, strict
    VideoDuration     string // any, short, medium, long
    VideoDefinition   string // any, standard, high
    RelevanceLanguage string
    RegionCode        string
    PublishedAfter    string
    PublishedBefore   string
    
    // Deep Extraction settings
    IncludeThumbnail     bool // Default: true
    IncludeDescription   bool // Default: true
    IncludeExternalUrls  bool // Default: true
    IncludeTranscript    bool // Default: false
    IncludeSubtitleLangs bool // Default: false
    
    // Authentication for logged-in access
    Auth YouTubeAuthConfig
}

type YouTubeAuthConfig struct {
    Enabled      bool   // Default: false
    CookieFile   string // Path to cookies.txt (Netscape format)
    SessionToken string // Browser session token
}

type YouTubeResult struct {
    VideoId           string
    Title             string
    Description       string    // Full video description
    ChannelId         string
    ChannelTitle      string
    PublishedAt       time.Time
    ThumbnailUrl      string    // High-res thumbnail
    ViewCount         int64
    LikeCount         int64
    CommentCount      int64
    Duration          string
    EmbedHtml         string
    Relevance         float64
    
    // Deep Extraction fields
    ExternalUrls      []string  `json:",omitempty"`     // URLs found in description
    Transcript        string    `json:",omitempty"`      // Auto-generated captions
    SubtitleLanguages []string  `json:",omitempty"`      // Available subtitle languages
}
```

### Reddit Configuration

```go
type RedditConfig struct {
    ClientId     string
    ClientSecret string
    UserAgent    string
    Subreddits   []string // Empty = all
    Sort         string   // relevance, hot, top, new
    TimeFilter   string   // hour, day, week, month, year, all
    MinScore     int
    MaxResults   int
    IncludeNsfw  bool
}

type RedditResult struct {
    PostId        string
    Title         string
    Subreddit     string
    Author        string
    Score         int
    NumComments   int
    Url           string
    Permalink     string
    SelfText      string
    CreatedUtc    time.Time
    TopComments   []RedditComment
    Relevance     float64
}

type RedditComment struct {
    CommentId  string
    Author     string
    Body       string
    Score      int
    CreatedUtc time.Time
}
```

---

## Search Engine Implementation

### YouTube Search Service

```go
type YouTubeSearchService struct {
    config  *YouTubeConfig
    client  *youtube.Service
    cache   *CacheService
}

func NewYouTubeSearchService(config *YouTubeConfig) apperror.Result[YouTubeSearchService] {
    backgroundContext := stdctx.Background()
    client, clientErr := youtube.NewService(backgroundContext, option.WithApiKey(config.ApiKey))
    if clientErr != nil {
        return apperror.Fail[YouTubeSearchService](
            apperror.Wrap(
                clientErr,
                "failed to create YouTube client",
            ),
        )
    }
    
    return apperror.Ok(YouTubeSearchService{
        config: config,
        client: client,
        cache:  NewCacheService("youtube"),
    })
}

func (s *YouTubeSearchService) Search(query string) apperror.Result[[]YouTubeResult] {
    // Check cache first
    cacheKey := s.buildCacheKey(query)
    // EXEMPTED: typed accessor internal — cache stores known []YouTubeResult values (§7.2)
    if cached, ok := s.cache.Get(cacheKey); ok {
        return apperror.Ok(cached.([]YouTubeResult))
    }
    
    // Build search request
    call := s.client.Search.List([]string{"id", "snippet"}).
        Q(query).
        Type("video").
        MaxResults(int64(s.config.MaxResults)).
        SafeSearch(s.config.SafeSearch).
        Order("relevance")
    
    if s.config.VideoDuration != "" && s.config.VideoDuration != "any" {
        call = call.VideoDuration(s.config.VideoDuration)
    }
    
    if s.config.VideoDefinition != "" && s.config.VideoDefinition != "any" {
        call = call.VideoDefinition(s.config.VideoDefinition)
    }
    
    if s.config.PublishedAfter != "" {
        call = call.PublishedAfter(s.config.PublishedAfter)
    }
    
    if s.config.RegionCode != "" {
        call = call.RegionCode(s.config.RegionCode)
    }
    
    response, err := call.Do()
    if err != nil {
        return apperror.Fail[[]YouTubeResult](
            apperror.Wrap(
                err,
                "YouTube search failed",
            ),
        )
    }
    
    // Get video statistics
    var videoIDs []string
    for _, item := range response.Items {
        videoIDs = append(videoIDs, item.Id.VideoId)
    }
    
    stats, err := s.getVideoStats(videoIDs)
    if err != nil {
        // Continue without stats
        stats = make(map[string]*youtube.VideoStatistics)
    }
    
    // Build results
    var results []YouTubeResult
    for i, item := range response.Items {
        result := YouTubeResult{
            VideoId:      item.Id.VideoId,
            Title:        item.Snippet.Title,
            Description:  item.Snippet.Description,
            ChannelId:    item.Snippet.ChannelId,
            ChannelTitle: item.Snippet.ChannelTitle,
            ThumbnailUrl: item.Snippet.Thumbnails.High.Url,
            EmbedHtml:    s.generateEmbed(item.Id.VideoId, item.Snippet.Title),
            Relevance:    1.0 - (float64(i) * 0.1), // Position-based relevance
        }
        
        if stat, ok := stats[item.Id.VideoId]; ok {
            result.ViewCount = int64(stat.ViewCount)
            result.LikeCount = int64(stat.LikeCount)
            result.CommentCount = int64(stat.CommentCount)
        }
        
        results = append(results, result)
    }
    
    // Cache results
    s.cache.Set(cacheKey, results, 24*time.Hour)
    
    return apperror.Ok(results)
}

func (s *YouTubeSearchService) generateEmbed(videoId, title string) string {
    return fmt.Sprintf(`<iframe width="560" height="315" 
        src="https://www.youtube.com/embed/%s" 
        title="%s" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>`, videoId, html.EscapeString(title))
}
```

### Reddit Search Service

```go
type RedditSearchService struct {
    config     *RedditConfig
    httpClient *http.Client
    token      string
    tokenExp   time.Time
    cache      *CacheService
}

func NewRedditSearchService(config *RedditConfig) *RedditSearchService {
    return &RedditSearchService{
        config:     config,
        httpClient: &http.Client{Timeout: 10 * time.Second},
        cache:      NewCacheService("reddit"),
    }
}

func (s *RedditSearchService) Search(query string) apperror.Result[[]RedditResult] {
    // Ensure valid auth token
    if authErr := s.ensureAuth(); authErr != nil {
        return apperror.Fail[[]RedditResult](authErr)
    }
    
    // Check cache
    cacheKey := s.buildCacheKey(query)
    // EXEMPTED: typed accessor internal — cache stores known []RedditResult values (§7.2)
    if cached, ok := s.cache.Get(cacheKey); ok {
        return apperror.Ok(cached.([]RedditResult))
    }
    
    // Build search URL
    searchUrl := "https://oauth.reddit.com/search"
    params := url.Values{}
    params.Set("q", query)
    params.Set("sort", s.config.Sort)
    params.Set("t", s.config.TimeFilter)
    params.Set("limit", strconv.Itoa(s.config.MaxResults))
    params.Set("type", "link")
    
    if len(s.config.Subreddits) > 0 {
        // Search within specific subreddits
        searchUrl = fmt.Sprintf("https://oauth.reddit.com/r/%s/search", 
            strings.Join(s.config.Subreddits, "+"))
        params.Set("restrict_sr", "true")
    }
    
    req, reqErr := http.NewRequest(httpmethod.Get.String(), searchUrl+"?"+params.Encode(), nil)
    if reqErr != nil {
        return apperror.Fail[[]RedditResult](
            apperror.Wrap(
                reqErr,
                "create reddit search request",
            ),
        )
    }
    
    req.Header.Set("Authorization", "Bearer "+s.token)
    req.Header.Set("User-Agent", s.config.UserAgent)
    
    resp, httpErr := s.httpClient.Do(req)
    if httpErr != nil {
        return apperror.Fail[[]RedditResult](
            apperror.Wrap(
                httpErr,
                "execute reddit search request",
            ),
        )
    }

    defer resp.Body.Close()
    
    var listing redditListing
    if decodeErr := json.NewDecoder(resp.Body).Decode(&listing); decodeErr != nil {
        return apperror.Fail[[]RedditResult](
            apperror.Wrap(
                decodeErr,
                "decode reddit response",
            ),
        )
    }
    
    // Convert to results
    var results []RedditResult
    for i, child := range listing.Data.Children {
        post := child.Data
        
        // Filter by minimum score
        if post.Score < s.config.MinScore {
            continue
        }
        
        result := RedditResult{
            PostId:      post.Id,
            Title:       post.Title,
            Subreddit:   post.Subreddit,
            Author:      post.Author,
            Score:       post.Score,
            NumComments: post.NumComments,
            Url:         post.Url,
            Permalink:   "https://reddit.com" + post.Permalink,
            SelfText:    post.SelfText,
            Relevance:   1.0 - (float64(i) * 0.1),
        }
        
        // Fetch top comments if requested
        if s.config.IncludeComments {
            commentsResult := s.getTopComments(post.Id, post.Subreddit)
            if commentsResult.IsSuccess() {
                result.TopComments = commentsResult.Value()
            }
        }
        
        results = append(results, result)
    }
    
    // Cache results
    s.cache.Set(cacheKey, results, 1*time.Hour)
    
    return apperror.Ok(results)
}
```

---

## Integration with AI SEO

### Video Discovery for Content

```go
type SeoMediaDiscovery struct {
    youtube *YouTubeSearchService
    reddit  *RedditSearchService
    config  *SeoMediaConfig
}

type SeoMediaConfig struct {
    MaxVideosPerPage      int     // Default: 2
    MaxDiscussionsPerPage int     // Default: 1
    MinRelevanceScore     float64 // Default: 0.7
    PreferRecent          bool    // Prefer recent content
    RegionCode            string  // e.g., "AU"
}

func (d *SeoMediaDiscovery) FindMediaForContent(content *SeoContent) apperror.Result[MediaSuggestions] {
    suggestions := MediaSuggestions{}
    
    // Build search query from content
    query := d.buildSearchQuery(content)
    
    // Search YouTube
    videosResult := d.youtube.Search(query)
    if videosResult.IsSuccess() {
        for i, video := range videosResult.Value() {
            if i >= d.config.MaxVideosPerPage {
                break
            }

            if video.Relevance >= d.config.MinRelevanceScore {
                suggestions.Videos = append(suggestions.Videos, MediaEmbed{
                    Platform:    "youtube",
                    Url:         fmt.Sprintf("https://youtube.com/watch?v=%s", video.VideoId),
                    EmbedCode:   video.EmbedHtml,
                    Title:       video.Title,
                    Description: video.Description,
                    Relevance:   video.Relevance,
                })
            }
        }
    }
    
    // Search Reddit for discussions
    discussionsResult := d.reddit.Search(query)
    if discussionsResult.IsSuccess() {
        for i, post := range discussionsResult.Value() {
            if i >= d.config.MaxDiscussionsPerPage {
                break
            }

            if post.Relevance >= d.config.MinRelevanceScore {
                suggestions.Discussions = append(suggestions.Discussions, DiscussionRef{
                    Platform:    "reddit",
                    Url:         post.Permalink,
                    Title:       post.Title,
                    Subreddit:   post.Subreddit,
                    Score:       post.Score,
                    Relevance:   post.Relevance,
                })
            }
        }
    }
    
    return apperror.Ok(suggestions)
}

func (d *SeoMediaDiscovery) buildSearchQuery(content *SeoContent) string {
    // Combine keywords, service, and area for focused search
    parts := []string{
        content.PrimaryKeyword,
        content.ServiceName,
    }
    
    if len(content.ServiceAreas) > 0 {
        parts = append(parts, content.ServiceAreas[0])
    }
    
    return strings.Join(parts, " ")
}
```

---

## Database Schema

### Platform Search Tables

```sql
-- ============================================
-- Table: PlatformSearches (search history)
-- ============================================
CREATE TABLE PlatformSearches (
    Id TEXT PRIMARY KEY,
    Platform TEXT NOT NULL,              -- youtube, reddit, vimeo, etc.
    Query TEXT NOT NULL,
    Config TEXT,                         -- JSON: search configuration
    ResultCount INTEGER,
    SearchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CacheExpiry DATETIME
);

CREATE INDEX IdxPlatformSearchQuery ON PlatformSearches(Platform, Query);

-- ============================================
-- Table: PlatformResults (cached results)
-- ============================================
CREATE TABLE PlatformResults (
    Id TEXT PRIMARY KEY,
    SearchId TEXT NOT NULL,
    Platform TEXT NOT NULL,
    ExternalId TEXT NOT NULL,            -- Video ID, Post ID, etc.
    Title TEXT NOT NULL,
    Description TEXT,
    URL TEXT NOT NULL,
    EmbedCode TEXT,
    Metadata TEXT,                       -- JSON: platform-specific data
    Relevance REAL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SearchId) REFERENCES PlatformSearches(Id)
);

CREATE INDEX IdxPlatformResultsSearch ON PlatformResults(SearchId);
CREATE INDEX IdxPlatformResultsExternal ON PlatformResults(Platform, ExternalId);
```

---

## API Endpoints

### Platform Search API

```
POST /api/v1/search/platform/:platform
  Body: { "Query": "...", "Config": {...} }
  Returns: Platform-specific search results

GET /api/v1/search/platform/youtube?q=...
  Query params: q, maxResults, duration, publishedAfter
  Returns: YouTube video results with embed codes

GET /api/v1/search/platform/reddit?q=...
  Query params: q, subreddits, sort, timeFilter, minScore
  Returns: Reddit discussion results

POST /api/v1/search/platform/multi
  Body: { "Query": "...", "Platforms": ["youtube", "reddit"], "MaxPerPlatform": 3 }
  Returns: Combined results from all platforms
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 7600 | `PLATFORM_AUTH_FAILED` | Platform API authentication failed |
| 7601 | `PLATFORM_RATE_LIMITED` | Platform rate limit exceeded |
| 7602 | `PLATFORM_NOT_SUPPORTED` | Requested platform not supported |
| 7603 | `PLATFORM_SEARCH_FAILED` | Platform search request failed |
| 7604 | `PLATFORM_PARSE_ERROR` | Failed to parse platform response |
| 7605 | `PLATFORM_CONFIG_INVALID` | Invalid platform configuration |

---

## Medium Platform Support

### CLI Commands

```bash
# Search Medium articles
gsearch platform medium "machine learning best practices" \
  --max-results 10 \
  --sort relevance \
  --output json

# Filter by tag
gsearch platform medium "golang performance" \
  --tags go,programming,performance \
  --min-claps 100
```

### Data Structures

```go
type MediumConfig struct {
    MaxResults     int      // Default: 10
    Tags           []string // Filter by tags
    MinClaps       int      // Minimum clap count
    MinReadTime    int      // Minimum reading time (minutes)
    PublishedAfter string   // ISO date filter
}

type MediumResult struct {
    ArticleId       string
    Title           string
    Subtitle        string
    Author          string
    AuthorUrl       string
    PublicationName string    `json:",omitempty"`
    Url             string
    ClapCount       int
    ResponseCount   int
    ReadingTime     int       // Minutes
    Tags            []string
    Snippet         string    // First ~200 chars
    ImageUrl        string    `json:",omitempty"`
    PublishedAt     time.Time
    Relevance       float64
}
```

### Medium Search Service

```go
type MediumSearchService struct {
    config     *MediumConfig
    httpClient *http.Client
    cache      *CacheService
}

func (s *MediumSearchService) Search(query string) apperror.Result[[]MediumResult] {
    cacheKey := s.buildCacheKey(query)
    // EXEMPTED: typed accessor internal — cache stores known []MediumResult values (§7.2)
    if cached, ok := s.cache.Get(cacheKey); ok {
        return apperror.Ok(cached.([]MediumResult))
    }
    
    // Use Google site:medium.com search via GSearch core
    siteQuery := fmt.Sprintf("site:medium.com %s", query)
    rawResults, err := s.siteSearch(siteQuery)
    if err != nil {
        return apperror.Fail[[]MediumResult](
            apperror.Wrap(
                err,
                "Medium search failed",
            ),
        )
    }
    
    // Enrich results with Medium-specific metadata via scraping
    var results []MediumResult
    for i, raw := range rawResults {
        result := s.enrichResult(raw)
        result.Relevance = 1.0 - (float64(i) * 0.1)
        
        if result.ClapCount >= s.config.MinClaps {
            results = append(results, result)
        }
    }
    
    s.cache.Set(cacheKey, results, 24*time.Hour)

    return apperror.Ok(results)
}
```

---

## LinkedIn Platform Support

### CLI Commands

```bash
# Search LinkedIn posts
gsearch platform linkedin "startup funding advice" \
  --type posts \
  --max-results 10 \
  --output json

# Search LinkedIn company pages
gsearch platform linkedin "AI tools" \
  --type companies \
  --max-results 5
```

### Data Structures

```go
type LinkedInConfig struct {
    MaxResults   int    // Default: 10
    SearchType   string // "posts", "companies", "people"
    TimeFilter   string // "past-24h", "past-week", "past-month"
}

type LinkedInPostResult struct {
    PostId        string
    AuthorName    string
    AuthorTitle   string
    AuthorUrl     string
    Content       string
    Url           string
    LikeCount     int
    CommentCount  int
    ShareCount    int
    PublishedAt   time.Time
    Relevance     float64
}

type LinkedInCompanyResult struct {
    CompanyId     string
    Name          string
    Description   string
    Url           string
    Industry      string
    EmployeeCount string   // "11-50", "51-200", etc.
    Headquarters  string
    Website       string
    Specialties   []string
    Relevance     float64
}
```

### LinkedIn Search Service

```go
type LinkedInSearchService struct {
    config     *LinkedInConfig
    httpClient *http.Client
    cache      *CacheService
}

func (s *LinkedInSearchService) SearchPosts(query string) apperror.Result[[]LinkedInPostResult] {
    cacheKey := s.buildCacheKey("posts", query)
    // EXEMPTED: typed accessor internal — cache stores known []LinkedInPostResult values (§7.2)
    if cached, ok := s.cache.Get(cacheKey); ok {
        return apperror.Ok(cached.([]LinkedInPostResult))
    }
    
    // Use Google site:linkedin.com/posts search via GSearch core
    siteQuery := fmt.Sprintf("site:linkedin.com/posts %s", query)
    rawResults, err := s.siteSearch(siteQuery)
    if err != nil {
        return apperror.Fail[[]LinkedInPostResult](
            apperror.Wrap(
                err,
                "LinkedIn post search failed",
            ),
        )
    }
    
    var results []LinkedInPostResult
    for i, raw := range rawResults {
        result := s.enrichPostResult(raw)
        result.Relevance = 1.0 - (float64(i) * 0.1)
        results = append(results, result)
    }
    
    s.cache.Set(cacheKey, results, 6*time.Hour)

    return apperror.Ok(results)
}

func (s *LinkedInSearchService) SearchCompanies(query string) apperror.Result[[]LinkedInCompanyResult] {
    cacheKey := s.buildCacheKey("companies", query)
    // EXEMPTED: typed accessor internal — cache stores known []LinkedInCompanyResult values (§7.2)
    if cached, ok := s.cache.Get(cacheKey); ok {
        return apperror.Ok(cached.([]LinkedInCompanyResult))
    }
    
    siteQuery := fmt.Sprintf("site:linkedin.com/company %s", query)
    rawResults, err := s.siteSearch(siteQuery)
    if err != nil {
        return apperror.Fail[[]LinkedInCompanyResult](
            apperror.Wrap(
                err,
                "LinkedIn company search failed",
            ),
        )
    }
    
    var results []LinkedInCompanyResult
    for i, raw := range rawResults {
        result := s.enrichCompanyResult(raw)
        result.Relevance = 1.0 - (float64(i) * 0.1)
        results = append(results, result)
    }
    
    s.cache.Set(cacheKey, results, 24*time.Hour)

    return apperror.Ok(results)
}
```

---

## YouTube Deep Extraction

### CLI Commands

```bash
# Extract full metadata from a single video
gsearch youtube extract --url "https://youtube.com/watch?v=abc123" \
  --include-transcript \
  --include-external-urls

# Batch extract from multiple videos (parallel processing)
gsearch youtube extract --urls "url1,url2,url3" \
  --parallel \
  --include-transcript \
  --output json

# Extract transcript only
gsearch youtube transcript --url "https://youtube.com/watch?v=abc123" \
  --language en
```

### Deep Extraction Service

```go
type YouTubeDeepExtractor struct {
    config     *YouTubeConfig
    client     *youtube.Service
    httpClient *http.Client
    cache      *CacheService
}

// ExtractVideo performs full deep extraction for a single video
func (e *YouTubeDeepExtractor) ExtractVideo(videoUrl string) apperror.Result[YouTubeResult] {
    videoId := e.parseVideoId(videoUrl)
    if videoId == "" {
        return apperror.Fail[YouTubeResult](
            apperror.New(
                "invalid YouTube URL: " + videoUrl,
            ),
        )
    }
    
    // Get base video metadata
    metadataResult := e.getVideoMetadata(videoId)
    if metadataResult.HasError() {
        return apperror.Fail[YouTubeResult](metadataResult.Error())
    }

    result := metadataResult.Value()
    
    // Deep extraction: external URLs from description
    if e.config.IncludeExternalUrls {
        result.ExternalUrls = e.extractUrls(result.Description)
    }
    
    // Deep extraction: transcript/captions
    if e.config.IncludeTranscript {
        transcriptResult := e.getTranscript(videoId)
        if transcriptResult.IsSuccess() {
            tr := transcriptResult.Value()
            result.Transcript = tr.Text
            result.SubtitleLanguages = tr.Languages
        }
    }
    
    return apperror.Ok(result)
}

// ExtractBatch processes multiple videos in parallel
func (e *YouTubeDeepExtractor) ExtractBatch(videoUrls []string) apperror.Result[[]YouTubeResult] {
    results := make([]YouTubeResult, 0, len(videoUrls))
    var mu sync.Mutex
    
    var wg sync.WaitGroup
    sem := make(chan struct{}, 5) // Max 5 concurrent extractions
    
    for _, videoUrl := range videoUrls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            
            extractResult := e.ExtractVideo(u)
            if extractResult.IsSuccess() {
                mu.Lock()
                results = append(results, extractResult.Value())
                mu.Unlock()
            }
        }(videoUrl)
    }
    
    wg.Wait()
    
    return apperror.Ok(results)
}

// getTranscript fetches auto-generated or manual captions
func (e *YouTubeDeepExtractor) getTranscript(videoId string) apperror.Result[TranscriptResult] {
    // Fetch video page to get caption track URLs
    pageUrl := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoId)
    
    req, reqErr := http.NewRequest(httpmethod.Get.String(), pageUrl, nil)
    if reqErr != nil {
        return apperror.Fail[TranscriptResult](
            apperror.Wrap(
                reqErr,
                "create transcript request",
            ),
        )
    }

    if e.config.Auth.Enabled && e.config.Auth.SessionToken != "" {
        req.Header.Set("Cookie", e.config.Auth.SessionToken)
    }
    
    resp, httpErr := e.httpClient.Do(req)
    if httpErr != nil {
        return apperror.Fail[TranscriptResult](
            apperror.Wrap(
                httpErr,
                "fetch video page for transcript",
            ),
        )
    }

    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    
    // Parse caption tracks from ytInitialPlayerResponse
    tracks := e.parseCaptionTracks(string(body))
    if len(tracks) == 0 {
        return apperror.Fail[TranscriptResult](
            apperror.New(
                "no captions available for video " + videoId,
            ),
        )
    }
    
    // Get available languages
    var languages []string
    for _, track := range tracks {
        languages = append(languages, track.LanguageCode)
    }
    
    // Fetch first available transcript
    captionResult := e.fetchCaptionTrack(tracks[0].BaseUrl)
    if captionResult.HasError() {
        return apperror.Fail[TranscriptResult](captionResult.Error())
    }
    
    return apperror.Ok(TranscriptResult{
        Text:      captionResult.Value(),
        Languages: languages,
    })
}

// extractUrls finds all URLs in video description text
func (e *YouTubeDeepExtractor) extractUrls(text string) []string {
    urlRegex := regexp.MustCompile(`https?://[^\s\)\]]+`)
    matches := urlRegex.FindAllString(text, -1)
    
    // Deduplicate
    seen := make(map[string]bool)
    var unique []string
    for _, u := range matches {
        if !seen[u] {
            seen[u] = true
            unique = append(unique, u)
        }
    }
    return unique
}
```

---

## Updated API Endpoints

```
# Medium
GET  /api/v1/search/platform/medium?q=...
  Query params: q, maxResults, tags, minClaps, publishedAfter
  Returns: Medium article results

# LinkedIn
GET  /api/v1/search/platform/linkedin?q=...&type=posts
  Query params: q, type (posts|companies), maxResults, timeFilter
  Returns: LinkedIn post or company results

# YouTube Deep Extraction
POST /api/v1/search/platform/youtube/extract
  Body: { "Urls": ["..."], "IncludeTranscript": true, "IncludeExternalUrls": true }
  Returns: Deep-extracted YouTube results

GET  /api/v1/search/platform/youtube/transcript?videoId=...&language=en
  Returns: Video transcript text

# Multi-Platform (updated to include Medium, LinkedIn)
POST /api/v1/search/platform/multi
  Body: { "Query": "...", "Platforms": ["youtube", "reddit", "medium", "linkedin"], "MaxPerPlatform": 3 }
  Returns: Combined results from all platforms
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 7600 | `PLATFORM_AUTH_FAILED` | Platform API authentication failed |
| 7601 | `PLATFORM_RATE_LIMITED` | Platform rate limit exceeded |
| 7602 | `PLATFORM_NOT_SUPPORTED` | Requested platform not supported |
| 7603 | `PLATFORM_SEARCH_FAILED` | Platform search request failed |
| 7604 | `PLATFORM_PARSE_ERROR` | Failed to parse platform response |
| 7605 | `PLATFORM_CONFIG_INVALID` | Invalid platform configuration |
| 7606 | `YOUTUBE_TRANSCRIPT_UNAVAILABLE` | No captions available for video |
| 7607 | `YOUTUBE_AUTH_REQUIRED` | Authenticated access required for this content |
| 7608 | `MEDIUM_ENRICHMENT_FAILED` | Failed to enrich Medium article metadata |
| 7609 | `LINKEDIN_ACCESS_RESTRICTED` | LinkedIn content access restricted |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| GSearch Overview | `../00-overview.md` |
| Caching System | `./10-caching-system.md` |
| AI SEO Content Types | `../../27-ai-bridge-cli/01-backend/18-ai-seo-content-types.md` |
| Error Codes | `./15-error-codes.md` |
| Settings Service | `./21-settings-service.md` |
