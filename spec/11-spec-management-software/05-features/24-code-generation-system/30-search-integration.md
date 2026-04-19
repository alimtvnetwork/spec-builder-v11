# Search Integration System

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

Integration of `gsearch` CLI with AI chat for context-aware web search, site-specific searching, and search result tracking. Supports enable/disable toggle and preset configurations for different search targets.

**Cross-References:**
- [AI Chat Interface](./25-ai-chat-interface.md) - Parent interface
- [Golang Search CLI](../22-golang-search-cli/00-overview.md) - gsearch tool
- [Long Chain Events](./29-long-chain-events.md) - Event display
- [RAG Export](../22-golang-search-cli/11-rag-export.md) - Memory generation

---

## Search Context Toggle

### Configuration

```typescript
interface SearchContextConfig {
  // Master toggle
  enabled: boolean;
  
  // Search engine preference
  preferredEngine: 'google' | 'duckduckgo' | 'bing' | 'auto';
  
  // Site-specific search
  sitePresets: SitePreset[];
  
  // Context mode
  contextMode: 'auto' | 'spec' | 'code' | 'both';
  
  // Result handling
  maxResults: number;
  saveToRAG: boolean;
  trackKeywords: boolean;
}

interface SitePreset {
  id: string;
  name: string;
  displayName: string;
  domains: string[];
  icon: string;
  category: 'coding' | 'general' | 'video' | 'social' | 'docs';
  searchMethod: 'google_site' | 'native_api' | 'scrape';
  enabled: boolean;
}
```

### Toggle UI

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Search Settings                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Google Search Context                                                          │
│  ┌─────────────────────────────────────────────────┐                           │
│  │ Enable web search during AI operations          │  [────●────] ON          │
│  └─────────────────────────────────────────────────┘                           │
│                                                                                  │
│  Search Engine                                                                  │
│  ○ Auto    ● Google    ○ DuckDuckGo    ○ Bing                                  │
│                                                                                  │
│  Context Mode                                                                   │
│  ○ Auto (detect from current tab)                                              │
│  ○ Spec writing (documentation, tutorials)                                      │
│  ● Code implementation (API docs, Stack Overflow)                               │
│  ○ Both                                                                         │
│                                                                                  │
│  ──────────────────────────────────────────────────────────────────────────────│
│                                                                                  │
│  Site Presets                                                                   │
│                                                                                  │
│  Coding                                                                         │
│  [✓] Stack Overflow        [✓] GitHub        [✓] MDN                           │
│  [✓] Go Docs               [ ] Rust Docs     [ ] Python Docs                   │
│                                                                                  │
│  General                                                                        │
│  [✓] Reddit                [ ] Quora         [ ] Medium                        │
│  [✓] Dev.to                [ ] Hacker News                                      │
│                                                                                  │
│  Video                                                                          │
│  [ ] YouTube               [ ] Vimeo                                            │
│                                                                                  │
│  Documentation                                                                  │
│  [✓] Official Docs         [✓] Read the Docs                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Site Presets

### Default Presets

```go
var DefaultSitePresets = []SitePreset{
    // Coding
    {
        Id:           "stackoverflow",
        Name:         "stackoverflow",
        DisplayName:  "Stack Overflow",
        Domains:      []string{"stackoverflow.com", "stackexchange.com"},
        Icon:         "stack-overflow",
        Category:     "coding",
        SearchMethod: "google_site",
        Enabled:      true,
    },
    {
        Id:           "github",
        Name:         "github",
        DisplayName:  "GitHub",
        Domains:      []string{"github.com"},
        Icon:         "github",
        Category:     "coding",
        SearchMethod: "native_api",  // Use GitHub API
        Enabled:      true,
    },
    {
        Id:           "mdn",
        Name:         "mdn",
        DisplayName:  "MDN Web Docs",
        Domains:      []string{"developer.mozilla.org"},
        Icon:         "globe",
        Category:     "coding",
        SearchMethod: "google_site",
        Enabled:      true,
    },
    {
        Id:           "godocs",
        Name:         "godocs",
        DisplayName:  "Go Documentation",
        Domains:      []string{"pkg.go.dev", "golang.org", "go.dev"},
        Icon:         "go",
        Category:     "coding",
        SearchMethod: "google_site",
        Enabled:      true,
    },
    {
        Id:           "rustdocs",
        Name:         "rustdocs",
        DisplayName:  "Rust Documentation",
        Domains:      []string{"docs.rs", "doc.rust-lang.org"},
        Icon:         "rust",
        Category:     "coding",
        SearchMethod: "google_site",
        Enabled:      false,
    },
    {
        Id:           "pythondocs",
        Name:         "pythondocs",
        DisplayName:  "Python Documentation",
        Domains:      []string{"docs.python.org", "pypi.org"},
        Icon:         "python",
        Category:     "coding",
        SearchMethod: "google_site",
        Enabled:      false,
    },
    
    // General
    {
        Id:           "reddit",
        Name:         "reddit",
        DisplayName:  "Reddit",
        Domains:      []string{"reddit.com", "old.reddit.com"},
        Icon:         "reddit",
        Category:     "general",
        SearchMethod: "native_api",  // Reddit API
        Enabled:      true,
    },
    {
        Id:           "quora",
        Name:         "quora",
        DisplayName:  "Quora",
        Domains:      []string{"quora.com"},
        Icon:         "quora",
        Category:     "general",
        SearchMethod: "google_site",
        Enabled:      false,
    },
    {
        Id:           "medium",
        Name:         "medium",
        DisplayName:  "Medium",
        Domains:      []string{"medium.com", "*.medium.com"},
        Icon:         "medium",
        Category:     "general",
        SearchMethod: "google_site",
        Enabled:      false,
    },
    {
        Id:           "devto",
        Name:         "devto",
        DisplayName:  "Dev.to",
        Domains:      []string{"dev.to"},
        Icon:         "dev-to",
        Category:     "general",
        SearchMethod: "native_api",  // Dev.to API
        Enabled:      true,
    },
    {
        Id:           "hackernews",
        Name:         "hackernews",
        DisplayName:  "Hacker News",
        Domains:      []string{"news.ycombinator.com"},
        Icon:         "hacker-news",
        Category:     "general",
        SearchMethod: "native_api",  // Algolia HN API
        Enabled:      false,
    },
    
    // Video
    {
        Id:           "youtube",
        Name:         "youtube",
        DisplayName:  "YouTube",
        Domains:      []string{"youtube.com", "youtu.be"},
        Icon:         "youtube",
        Category:     "video",
        SearchMethod: "native_api",  // YouTube API
        Enabled:      false,
    },
    
    // Documentation
    {
        Id:           "readthedocs",
        Name:         "readthedocs",
        DisplayName:  "Read the Docs",
        Domains:      []string{"*.readthedocs.io", "*.readthedocs.org"},
        Icon:         "book-open",
        Category:     "docs",
        SearchMethod: "google_site",
        Enabled:      true,
    },
}
```

---

## gsearch CLI Integration

### Search Commands

```bash
# Basic search (uses Google or configured engine)
gsearch search "golang error handling best practices"

# Site-specific search using presets
gsearch search "react hooks" --preset stackoverflow
gsearch search "golang concurrency" --preset github

# Multiple presets
gsearch search "authentication" --preset stackoverflow,github,mdn

# Custom site restriction
gsearch search "API design" --site=example.com,docs.example.com

# Disable Google, use only native APIs
gsearch search "machine learning" --preset youtube --native-only

# Combined search modes
gsearch search "oauth implementation" \
  --preset stackoverflow,github \
  --fallback google \
  --max-results 20
```

### CLI Help Documentation

```
gsearch search - Search the web with multiple engines and site presets

USAGE:
    gsearch search <query> [options]

ARGUMENTS:
    <query>     Search query string (required)

OPTIONS:
    --engine, -e <engine>
        Search engine to use
        Values: google, duckduckgo, bing, auto (default: auto)
        
    --preset, -p <presets>
        Comma-separated list of site presets
        Available presets:
          Coding: stackoverflow, github, mdn, godocs, rustdocs, pythondocs
          General: reddit, quora, medium, devto, hackernews
          Video: youtube
          Docs: readthedocs
        Example: --preset stackoverflow,github

    --site, -s <domains>
        Custom domain restriction (comma-separated)
        Example: --site example.com,docs.example.com

    --native-only
        Only use native APIs for presets, skip Google site: searches
        Useful for rate-limited scenarios

    --fallback <engine>
        Fallback engine when native APIs fail
        Default: google

    --max-results, -n <number>
        Maximum results to return (default: 10)

    --context <mode>
        Search context mode
        Values: auto, spec, code, both (default: auto)

    --save-rag
        Save results to RAG memory for later retrieval

    --output, -o <format>
        Output format: json, yaml, table (default: table)

EXAMPLES:
    # Search Stack Overflow for Go error handling
    gsearch search "golang error handling" --preset stackoverflow

    # Search multiple coding sites
    gsearch search "react state management" --preset stackoverflow,github,mdn

    # Search Reddit and Hacker News
    gsearch search "best programming languages 2026" --preset reddit,hackernews

    # Custom site search
    gsearch search "API documentation" --site docs.stripe.com,stripe.com

    # YouTube tutorial search
    gsearch search "docker tutorial" --preset youtube --max-results 5

    # Combined search with fallback
    gsearch search "kubernetes networking" \
      --preset stackoverflow,github \
      --fallback duckduckgo \
      --save-rag

PRESETS CONFIGURATION:
    List available presets:
        gsearch presets list

    Enable/disable preset:
        gsearch presets enable stackoverflow
        gsearch presets disable youtube

    Add custom preset:
        gsearch presets add mypreset --domains example.com,docs.example.com

    Edit preset:
        gsearch presets edit stackoverflow --add-domain meta.stackoverflow.com

SEE ALSO:
    gsearch presets --help    Manage search presets
    gsearch cache --help      Cache management
    gsearch rag --help        RAG memory export
```

---

## Backend Service

### Search Integration Service

```go
type SearchIntegrationService struct {
    config     *SearchContextConfig
    gsearchCmd string
    db         *gorm.DB
    wsHub      *websocket.Hub
    chainMgr   *ChainManager
}

func NewSearchIntegrationService(
    config *SearchContextConfig,
    db *gorm.DB,
    wsHub *websocket.Hub,
    chainMgr *ChainManager,
) *SearchIntegrationService {
    return &SearchIntegrationService{
        config:     config,
        gsearchCmd: "gsearch",
        db:         db,
        wsHub:      wsHub,
        chainMgr:   chainMgr,
    }
}

// ExecuteSearch performs a search and tracks results
func (s *SearchIntegrationService) ExecuteSearch(
    context stdctx.Context,
    chainId string,
    sessionId string,
    query string,
    presets []string,
    options SearchOptions,
) apperror.Result[SearchResults] {
    if !s.config.Enabled {
        return apperror.FailNew[SearchResults](
            "E5400",
            "search is disabled",
        )
    }
    
    // Start chain step
    step, err := s.chainMgr.StartStep(chainId, "search", "Web Search: "+query)
    if err != nil {
        return apperror.FailWrap[SearchResults](
            err,
            "E5401",
            "failed to start chain step",
        )
    }
    
    // Build gsearch command
    args := s.buildSearchArgs(query, presets, options)
    
    // Execute gsearch CLI
    cmd := exec.CommandContext(context, s.gsearchCmd, args...)
    output, err := cmd.Output()
    if err != nil {
        s.chainMgr.CompleteStep(chainId, step.Id, "failed", nil, 0, 0)

        return apperror.FailWrap[SearchResults](
            err,
            "E5402",
            "gsearch execution failed",
        )
    }
    
    // Parse results
    var results SearchResults
    if err := json.Unmarshal(output, &results); err != nil {
        return apperror.FailWrap[SearchResults](
            err,
            "E5403",
            "failed to parse search results",
        )
    }
    
    // Track search in database
    searchRecord := &SearchRecord{
        Id:          uuid.NewString(),
        SessionId:   sessionId,
        ChainId:     chainId,
        StepId:      step.Id,
        Query:       query,
        Presets:     strings.Join(presets, ","),
        ResultCount: len(results.Items),
        UsedResults: []string{},
        CreatedAt:   time.Now(),
    }
    s.db.Create(searchRecord)
    
    // Broadcast search event
    s.wsHub.BroadcastToSession(sessionId, SearchPerformedEvent{
        Type: "chain:search:performed",
        Payload: SearchPerformedPayload{
            ChainId:     chainId,
            StepId:      step.Id,
            SearchType:  "web",
            Query:       query,
            Engine:      results.Engine,
            ResultCount: len(results.Items),
            UsedResults: []string{},
        },
    })
    
    // Complete step
    s.chainMgr.CompleteStep(chainId, step.Id, "completed", StepCompletionMeta{
        ResultCount: len(results.Items),
        Engine:      results.Engine,
    }, 0, 0)
    
    return apperror.Ok(results)
}

func (s *SearchIntegrationService) buildSearchArgs(
    query string,
    presets []string,
    options SearchOptions,
) []string {
    args := []string{"search", query, "--output", "json"}
    
    if len(presets) > 0 {
        args = append(args, "--preset", strings.Join(presets, ","))
    }
    
    if options.MaxResults > 0 {
        args = append(args, "--max-results", strconv.Itoa(options.MaxResults))
    }
    
    if options.NativeOnly {
        args = append(args, "--native-only")
    }
    
    if options.SaveToRAG {
        args = append(args, "--save-rag")
    }
    
    if len(options.CustomSites) > 0 {
        args = append(args, "--site", strings.Join(options.CustomSites, ","))
    }
    
    return args
}

// MarkResultUsed tracks which search results were actually used
func (s *SearchIntegrationService) MarkResultUsed(
    searchId string,
    resultUrl string,
) error {
    var record SearchRecord
    if err := s.db.First(&record, "id = ?", searchId).Error; err != nil {
        return err
    }
    
    usedResults := append(record.UsedResults, resultUrl)
    return s.db.Model(&record).Update("used_results", usedResults).Error
}
```

---

## Search Result Tracking

### Database Schema

```sql
-- Search records for tracking
CREATE TABLE search_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    chain_id TEXT,
    step_id TEXT,
    
    query TEXT NOT NULL,
    keywords TEXT,            -- Extracted keywords
    presets TEXT,             -- Used presets (comma-separated)
    engine TEXT,
    
    result_count INTEGER DEFAULT 0,
    used_results TEXT,        -- JSON array of used URLs
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (chain_id) REFERENCES event_chains(id),
    FOREIGN KEY (step_id) REFERENCES chain_steps(id)
);

-- Individual search results
CREATE TABLE search_results (
    id TEXT PRIMARY KEY,
    search_id TEXT NOT NULL,
    
    title TEXT,
    description TEXT,
    url TEXT NOT NULL,
    position INTEGER,
    source TEXT,              -- stackoverflow, github, etc.
    
    was_used BOOLEAN DEFAULT FALSE,
    relevance_score FLOAT,
    
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (search_id) REFERENCES search_records(id) ON DELETE CASCADE
);

-- Keyword extraction and tracking
CREATE TABLE search_keywords (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    task_id TEXT,             -- If related to a specific task
    
    keyword TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    source TEXT,              -- 'user' or 'extracted'
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IdxSearchRecordsSession ON search_records(session_id);
CREATE INDEX IdxSearchRecordsChain ON search_records(chain_id);
CREATE INDEX IdxSearchResultsSearch ON search_results(search_id);
CREATE INDEX IdxSearchKeywordsSession ON search_keywords(session_id);
```

### Keyword Tracking

```go
type KeywordTracker struct {
    db *gorm.DB
}

// ExtractAndTrack extracts keywords from query and tracks them
func (k *KeywordTracker) ExtractAndTrack(
    sessionId string,
    taskId *string,
    query string,
) error {
    keywords := k.extractKeywords(query)
    
    for _, kw := range keywords {
        var existing SearchKeyword
        err := k.db.Where("session_id = ? AND keyword = ?", sessionId, kw).First(&existing).Error
        
        if err == gorm.ErrRecordNotFound {
            // Create new
            k.db.Create(&SearchKeyword{
                Id:         uuid.NewString(),
                SessionId:  sessionId,
                TaskId:     taskId,
                Keyword:    kw,
                Frequency:  1,
                Source:     "extracted",
                CreatedAt:  time.Now(),
                LastUsedAt: ptr(time.Now()),
            })
        } else if err == nil {
            // Update frequency — typed struct for GORM .Updates()
            type KeywordFrequencyUpdate struct {
                Frequency  *gorm.Expr `gorm:"column:frequency"`
                LastUsedAt time.Time  `gorm:"column:last_used_at"`
            }
            k.db.Model(&existing).Updates(KeywordFrequencyUpdate{
                Frequency:  gorm.Expr("frequency + 1"),
                LastUsedAt: time.Now(),
            })
        }
    }
    
    return nil
}

func (k *KeywordTracker) extractKeywords(query string) []string {
    // Simple keyword extraction - can be enhanced with NLP
    words := strings.Fields(strings.ToLower(query))
    stopWords := map[string]bool{
        "the": true, "a": true, "an": true, "and": true, "or": true,
        "in": true, "on": true, "at": true, "to": true, "for": true,
        "of": true, "with": true, "is": true, "are": true, "was": true,
        "how": true, "what": true, "why": true, "when": true, "where": true,
    }
    
    var keywords []string
    for _, word := range words {
        cleaned := strings.Trim(word, ".,!?\"'")
        if len(cleaned) > 2 && !stopWords[cleaned] {
            keywords = append(keywords, cleaned)
        }
    }
    
    return keywords
}
```

---

## Native API Integrations

### GitHub Search

```go
type GitHubSearcher struct {
    client *github.Client
    token  string
}

func (g *GitHubSearcher) Search(query string, opts SearchOptions) apperror.Result[SearchResults] {
    searchOpts := &github.SearchOptions{
        Sort:  "best-match",
        Order: "desc",
        ListOptions: github.ListOptions{
            PerPage: opts.MaxResults,
        },
    }
    
    // Search repositories
    repos, _, err := g.client.Search.Repositories(context.Background(), query, searchOpts)
    if err != nil {
        return apperror.FailWrap[SearchResults](
            err,
            "E5410",
            "github repository search failed",
        )
    }
    
    // Search code
    code, _, err := g.client.Search.Code(context.Background(), query, searchOpts)
    if err != nil {
        return apperror.FailWrap[SearchResults](
            err,
            "E5411",
            "github code search failed",
        )
    }
    
    results := &SearchResults{
        Engine: "github",
        Items:  []SearchItem{},
    }
    
    for _, repo := range repos.Repositories {
        results.Items = append(results.Items, SearchItem{
            Title:       *repo.FullName,
            Description: repo.GetDescription(),
            URL:         *repo.HTMLURL,
            Source:      "github",
        })
    }
    
    for _, c := range code.CodeResults {
        results.Items = append(results.Items, SearchItem{
            Title:       *c.Path,
            Description: c.Repository.GetFullName(),
            URL:         *c.HTMLURL,
            Source:      "github-code",
        })
    }
    
    return apperror.Ok(*results)
}
```

### Reddit Search

```go
type RedditSearcher struct {
    client  *http.Client
    baseUrl string
}

func (r *RedditSearcher) Search(query string, opts SearchOptions) apperror.Result[SearchResults] {
    url := fmt.Sprintf("%s/search.json?q=%s&limit=%d&sort=relevance",
        r.baseUrl,
        url.QueryEscape(query),
        opts.MaxResults,
    )
    
    resp, err := r.client.Get(url)
    if err != nil {
        return apperror.FailWrap[SearchResults](
            err,
            "E5412",
            "reddit search request failed",
        )
    }
    defer resp.Body.Close()
    
    var redditResp RedditSearchResponse
    if err := json.NewDecoder(resp.Body).Decode(&redditResp); err != nil {
        return apperror.FailWrap[SearchResults](
            err,
            "E5413",
            "failed to parse reddit response",
        )
    }
    
    results := &SearchResults{
        Engine: "reddit",
        Items:  []SearchItem{},
    }
    
    for _, child := range redditResp.Data.Children {
        post := child.Data
        results.Items = append(results.Items, SearchItem{
            Title:       post.Title,
            Description: truncate(post.Selftext, 200),
            URL:         "https://reddit.com" + post.Permalink,
            Source:      "reddit",
        })
    }
    
    return apperror.Ok(*results)
}
```

---

## Component Structure

```
SearchIntegration/
├── components/
│   ├── SearchSettings.tsx          # Settings panel
│   ├── PresetToggle.tsx            # Individual preset toggle
│   ├── PresetCategory.tsx          # Grouped presets
│   ├── SearchResultCard.tsx        # Result display
│   ├── SearchUsageTracker.tsx      # Show tracked keywords
│   └── SearchContextIndicator.tsx  # Status in chat input
│
├── hooks/
│   ├── useSearchConfig.ts          # Config state
│   ├── useSearchPresets.ts         # Preset management
│   └── useSearchHistory.ts         # Search tracking
│
└── api/
    └── search.ts                   # Search API calls
```

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `search.enabled` | bool | true | Master search toggle |
| `search.preferredEngine` | string | "google" | Default search engine |
| `search.maxResults` | int | 10 | Max results per search |
| `search.saveToRAG` | bool | true | Auto-save to RAG memory |
| `search.trackKeywords` | bool | true | Track search keywords |
| `search.nativeApiTimeout` | int | 10000 | Native API timeout (ms) |
| `search.fallbackToGoogle` | bool | true | Fallback on native API fail |

---

## Error Codes

| Code | Description |
|------|-------------|
| 12820 | Search disabled |
| 12821 | Invalid preset name |
| 12822 | Native API unavailable |
| 12823 | Search quota exceeded |
| 12824 | Invalid search query |
| 12825 | gsearch CLI not found |
| 12826 | Search timeout |
| 12827 | Rate limit exceeded |
