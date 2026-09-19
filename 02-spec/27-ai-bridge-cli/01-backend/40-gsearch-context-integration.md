# GSearch Context Integration for Adaptive Reasoning

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Status:** Draft  
> **Related:** `37-adaptive-reasoning-flow.md`, `02-spec/25-gsearch-cli/05-ai-bridge-integration.md`

---

## 1. Overview

This specification defines how the **Adaptive Reasoning Flow** integrates with **GSearch CLI** to fetch external context when the AI determines that web search is needed to fulfill a request. The integration bridges reasoning-time context analysis with GSearch's search and extraction capabilities.

---

## 2. Context Need Detection

### 2.1 When Web Search is Triggered

The reasoning flow identifies context needs during the initial prompt analysis:

| Trigger Pattern | Example Prompt | Search Action |
|-----------------|----------------|---------------|
| Current events / news | "What are the latest Go 1.23 features?" | Web search with date filter |
| External documentation | "How does the Stripe API handle refunds?" | Documentation search |
| Library/framework usage | "Show me React Query v5 mutation patterns" | Code search + web search |
| Competitor/market research | "What features does Notion offer?" | Web search |
| Technical specifications | "What's the OpenAPI 3.1 spec format?" | Web search with domain filter |
| Error resolution | "How to fix CORS error in Vite dev server?" | Web + StackOverflow search |

### 2.2 Context Need Schema

```go
type ContextNeed struct {
    Id           string
    Type         ContextType
    Query        string
    OriginalText string
    Reason       string
    Priority     ContextPriority
    Constraints  SearchConstraints
    Status       ContextStatus
}
// NOTE: JSON tags omitted — implicit PascalCase serialization per coding guidelines.

type ContextType string
const (
    ContextTypeWebSearch   ContextType = "WebSearch"
    ContextTypeCodeSearch  ContextType = "CodeSearch"
    ContextTypeExtraction  ContextType = "Extraction"
    ContextTypeCodebase    ContextType = "Codebase"
)
// NOTE: ContextType uses string constants for backward compatibility.
// See context_type.Variant in 53-enum-architecture.md for the canonical byte-based enum.

type ContextPriority string
const (
    ContextPriorityRequired ContextPriority = "Required"
    ContextPriorityHelpful  ContextPriority = "Helpful"
    ContextPriorityOptional ContextPriority = "Optional"
)
// NOTE: Maps to priority.Variant in 53-enum-architecture.md

// ContextStatus — see context_status.Variant in 53-enum-architecture.md
type ContextStatus = context_status.Variant

type SearchConstraints struct {
    DateFilter     string   `json:",omitempty"`
    DomainInclude  []string `json:",omitempty"`
    DomainExclude  []string `json:",omitempty"`
    Language       string   `json:",omitempty"`
    CodeLanguage   string   `json:",omitempty"`
    MaxResults     int      `json:",omitempty"`
}
```

---

## 3. Context Detection Heuristics

### 3.1 Heuristic Engine

```go
type ContextDetector struct {
    patterns      []ContextPattern
    domainHints   map[string][]string  // topic -> relevant domains
    codeKeywords  []string
    newsKeywords  []string
}

type ContextPattern struct {
    Regex       *regexp.Regexp
    Type        ContextType
    Priority    ContextPriority
    Constraints SearchConstraints
    QueryExtractor func(matches []string) string
}

var defaultPatterns = []ContextPattern{
    // Current information patterns
    {
        Regex:    regexp.MustCompile(`(?i)(latest|newest|recent|current|2026|today'?s?)\s+(.+)`),
        Type:     ContextTypeWebSearch,
        Priority: ContextPriorityRequired,
        Constraints: SearchConstraints{DateFilter: "month"},
        QueryExtractor: func(m []string) string { return m[2] },
    },
    
    // Documentation patterns
    {
        Regex:    regexp.MustCompile(`(?i)how\s+(does|do|to)\s+(.+)\s+(api|sdk|library|framework)`),
        Type:     ContextTypeWebSearch,
        Priority: ContextPriorityRequired,
        Constraints: SearchConstraints{DomainInclude: []string{"docs.", "developer."}},
        QueryExtractor: func(m []string) string { return m[0] + " documentation" },
    },
    
    // Code example patterns
    {
        Regex:    regexp.MustCompile(`(?i)(show|give|provide)\s+(me\s+)?(an?\s+)?(example|sample|code)\s+(.+)`),
        Type:     ContextTypeCodeSearch,
        Priority: ContextPriorityHelpful,
        QueryExtractor: func(m []string) string { return m[5] },
    },
    
    // Error resolution patterns
    {
        Regex:    regexp.MustCompile(`(?i)(fix|solve|resolve|debug)\s+(.+)\s+(error|issue|bug|problem)`),
        Type:     ContextTypeWebSearch,
        Priority: ContextPriorityRequired,
        Constraints: SearchConstraints{DomainInclude: []string{"stackoverflow.com", "github.com"}},
        QueryExtractor: func(m []string) string { return m[2] + " " + m[3] },
    },
}
```

### 3.2 Query Extraction Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT DETECTION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Prompt                                                                 │
│  └── "How do I use React Query v5 mutations with TypeScript?"               │
│                                                                              │
│  1. Pattern Matching                                                         │
│     ├── Match: documentation pattern → WebSearch                            │
│     └── Match: code example pattern → CodeSearch                            │
│                                                                              │
│  2. Query Extraction                                                         │
│     ├── WebSearch: "React Query v5 mutations documentation"                 │
│     └── CodeSearch: "React Query useMutation TypeScript"                    │
│                                                                              │
│  3. Constraint Inference                                                     │
│     ├── CodeLanguage: "typescript"                                          │
│     ├── DomainInclude: ["tanstack.com", "reactquery.dev"]                   │
│     └── DateFilter: null (stable API)                                       │
│                                                                              │
│  4. Priority Assignment                                                      │
│     ├── WebSearch: Required (needs current docs)                            │
│     └── CodeSearch: Helpful (examples supplement)                           │
│                                                                              │
│  5. Output: ContextNeed[]                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. GSearch Delegation

### 4.1 CLI Command Mapping

| Context Type | GSearch Command | Key Flags |
|--------------|-----------------|-----------|
| WebSearch | `gsearch search` | `--query`, `--limit`, `--date`, `--output json` |
| CodeSearch | `gsearch code` | `--query`, `--lang`, `--source`, `--output json` |
| Extraction | `gsearch extract` | `--url`, `--format`, `--depth` |

### 4.2 Executor Interface

```go
type GSearchExecutor interface {
    // Web search for general context
    WebSearch(context stdctx.Context, req WebSearchRequest) appfault.Result[*WebSearchResult]
    
    // Code-specific search (GitHub, StackOverflow)
    CodeSearch(context stdctx.Context, req CodeSearchRequest) appfault.Result[*CodeSearchResult]
    
    // URL content extraction
    Extract(context stdctx.Context, req ExtractRequest) appfault.Result[*ExtractResult]
}

type WebSearchRequest struct {
    Query        string
    MaxResults   int
    DateFilter   string
    DomainFilter []string
    Language     string
    SafeSearch   bool
}

type WebSearchResult struct {
    Query         string
    Results       []SearchResult
    TotalResults  int
    DurationMs    int
    Source        string  // google, duckduckgo, bing
    CacheStatus   string  // hit, miss, stale
}

type CodeSearchRequest struct {
    Query       string
    Language    string   // Programming language
    Source      string   // github, stackoverflow, all
    Repository  string   // Specific repo filter
    MaxResults  int
}

type ExtractRequest struct {
    URL         string
    Format      string   // text, markdown, html, simple-html, json
    Depth       int      // Nested crawl depth
    ForceRefresh bool
}
```

### 4.3 Execution Flow

```go
func (e *ContextFetcher) FetchContextNeeds(context stdctx.Context, needs []ContextNeed) appfault.Result[*FetchResult] {
    result := &FetchResult{
        Chunks:    []RAGChunk{},
        Errors:    []ContextError{},
        Stats:     FetchStats{},
    }
    
    // Group by priority for parallel execution
    required := filterByPriority(needs, ContextPriorityRequired)
    helpful := filterByPriority(needs, ContextPriorityHelpful)
    optional := filterByPriority(needs, ContextPriorityOptional)
    
    // Fetch required context first (blocking)
    for _, need := range required {
        chunkResult := e.fetchSingleNeed(context, need)
        if chunkResult.HasError() {
            // Required context failed - may abort
            result.Errors = append(result.Errors, ContextError{
                NeedId:  need.Id,
                Code:    ErrContextFetchFailed,
                Message: chunkResult.Error().Error(),
            })
            continue
        }
        result.Chunks = append(result.Chunks, chunkResult.Value()...)
    }
    
    // Fetch helpful/optional in parallel (non-blocking)
    var wg sync.WaitGroup
    chunkChan := make(chan []RAGChunk, len(helpful)+len(optional))
    
    for _, need := range append(helpful, optional...) {
        wg.Add(1)
        go func(n ContextNeed) {
            defer wg.Done()
            chunkResult := e.fetchSingleNeed(context, n) // Ignore errors for optional
            if chunkResult.IsSuccess() && len(chunkResult.Value()) > 0 {
                chunkChan <- chunkResult.Value()
            }
        }(need)
    }
    
    wg.Wait()
    close(chunkChan)
    
    for chunks := range chunkChan {
        result.Chunks = append(result.Chunks, chunks...)
    }
    
    return appfault.Ok(result)
}

func (e *ContextFetcher) fetchSingleNeed(context stdctx.Context, need ContextNeed) appfault.ResultSlice[RAGChunk] {
    switch need.Type {
    case ContextTypeWebSearch:
        return e.executeWebSearch(context, need)
    case ContextTypeCodeSearch:
        return e.executeCodeSearch(context, need)
    case ContextTypeExtraction:
        return e.executeExtraction(context, need)
    default:
        return appfault.FailNew[[]RAGChunk](
            ErrContextFetchFailed,
            "unsupported context type: %s", need.Type,
        )
    }
}
```

---

## 5. Result Conversion to RAG Chunks

### 5.1 Chunk Schema

```go
type RAGChunk struct {
    Id          string
    Source      ChunkSource
    Content     string
    Metadata    ChunkMetadata
    Relevance   float64           // 0.0 - 1.0
    TokenCount  int
    CreatedAt   time.Time
    ExpiresAt   time.Time
}

type ChunkSource struct {
    Type     string  // Web, Code, Codebase, Extraction
    Url      string
    Title    string
    Provider string  // Google, Github, StackOverflow
}

type ChunkMetadata struct {
    // Web search metadata
    Rank          int       `json:",omitempty"`
    PublishedDate string    `json:",omitempty"`
    SiteName      string    `json:",omitempty"`
    
    // Code search metadata
    Repository    string    `json:",omitempty"`
    FilePath      string    `json:",omitempty"`
    LineRange     string    `json:",omitempty"`
    Stars         int       `json:",omitempty"`
    Language      string    `json:",omitempty"`
    
    // StackOverflow metadata
    Votes         int       `json:",omitempty"`
    Accepted      bool      `json:",omitempty"`
    AnswerCount   int       `json:",omitempty"`
}
```

### 5.2 Conversion Functions

```go
func ConvertWebSearchToChunks(result *WebSearchResult, need ContextNeed) []RAGChunk {
    chunks := make([]RAGChunk, 0, len(result.Results))
    
    for _, r := range result.Results {
        chunk := RAGChunk{
            Id:     uuid.New().String(),
            Source: ChunkSource{
                Type:     "web",
                URL:      r.URL,
                Title:    r.Title,
                Provider: result.Source,
            },
            Content: formatWebContent(r),
            Metadata: ChunkMetadata{
                Rank:          r.Rank,
                PublishedDate: r.PublishedDate,
                SiteName:      r.Metadata.SiteName,
            },
            Relevance:  calculateRelevance(r, need.Query),
            TokenCount: estimateTokens(r.Snippet),
            CreatedAt:  time.Now(),
            ExpiresAt:  time.Now().Add(time.Hour * 24), // 24h TTL
        }
        chunks = append(chunks, chunk)
    }
    
    return chunks
}

func ConvertCodeSearchToChunks(result *CodeSearchResult, need ContextNeed) []RAGChunk {
    chunks := make([]RAGChunk, 0, len(result.Results))
    
    for _, r := range result.Results {
        var chunk RAGChunk
        
        if r.Source == "stackoverflow" {
            chunk = RAGChunk{
                Id: uuid.New().String(),
                Source: ChunkSource{
                    Type:     "code",
                    URL:      r.URL,
                    Title:    r.Title,
                    Provider: "stackoverflow",
                },
                Content: formatStackOverflowContent(r),
                Metadata: ChunkMetadata{
                    Votes:       r.Votes,
                    Accepted:    r.Accepted,
                    AnswerCount: r.Answers,
                },
                Relevance: float64(r.Votes) / 1000.0, // Normalize
            }
        } else {
            chunk = RAGChunk{
                Id: uuid.New().String(),
                Source: ChunkSource{
                    Type:     "code",
                    URL:      r.File.URL,
                    Title:    r.Repository.Name + "/" + r.File.Path,
                    Provider: "github",
                },
                Content: formatGitHubContent(r),
                Metadata: ChunkMetadata{
                    Repository: r.Repository.Owner + "/" + r.Repository.Name,
                    FilePath:   r.File.Path,
                    LineRange:  fmt.Sprintf("%d-%d", r.File.LineStart, r.File.LineEnd),
                    Stars:      r.Repository.Stars,
                    Language:   r.Repository.Language,
                },
                Relevance: r.MatchScore,
            }
        }
        
        chunk.TokenCount = estimateTokens(chunk.Content)
        chunk.CreatedAt = time.Now()
        chunk.ExpiresAt = time.Now().Add(time.Hour * 48) // 48h TTL for code
        chunks = append(chunks, chunk)
    }
    
    return chunks
}
```

---

## 6. Caching Strategy

### 6.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTEXT CACHE LAYERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: Session Memory (Tier 2 - Ephemeral)                               │
│  └── Current chat session context, discarded on close                       │
│  └── Location: In-memory                                                    │
│  └── TTL: Session lifetime                                                  │
│                                                                              │
│  Layer 2: RAG Cache (Tier 1 - Persistent)                                   │
│  └── Cross-session context storage                                          │
│  └── Location: {app}/rag/cache/context-{hash}.db                           │
│  └── TTL: 24-48 hours (configurable)                                        │
│                                                                              │
│  Layer 3: GSearch Cache (External)                                          │
│  └── CLI-managed search result cache                                        │
│  └── Location: ~/.gsearch/cache/                                            │
│  └── TTL: 5 days (default)                                                  │
│                                                                              │
│  Cache Check Order: Session → RAG → GSearch → Fresh Fetch                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Cache Key Generation

```go
type CacheKeyGenerator struct{}

func (g *CacheKeyGenerator) GenerateKey(need ContextNeed) string {
    // Normalize query for consistent hashing
    normalized := strings.ToLower(strings.TrimSpace(need.Query))
    normalized = regexp.MustCompile(`\s+`).ReplaceAllString(normalized, " ")
    
    // Include constraints in key
    constraintData, _ := json.Marshal(need.Constraints)
    
    // Generate hash
    data := fmt.Sprintf("%s:%s:%s", need.Type, normalized, string(constraintData))
    hash := sha256.Sum256([]byte(data))
    
    return hex.EncodeToString(hash[:16]) // First 16 bytes
}
```

### 6.3 Cache Database Schema

```sql
-- Table: ContextCache (in {app}/rag/cache/context-cache.db)
CREATE TABLE IF NOT EXISTS ContextCache (
    Id TEXT PRIMARY KEY,
    CacheKey TEXT UNIQUE NOT NULL,
    ContextType TEXT NOT NULL,           -- WebSearch, CodeSearch, Extraction
    Query TEXT NOT NULL,
    ChunksJson TEXT NOT NULL,            -- JSON array of RAGChunk
    ChunkCount INTEGER NOT NULL,
    TotalTokens INTEGER NOT NULL,
    SourceProvider TEXT,                 -- Google, Github, etc.
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    HitCount INTEGER DEFAULT 0,
    LastHit DATETIME
);

CREATE INDEX IdxContextCacheKey ON ContextCache(CacheKey);
CREATE INDEX IdxContextExpires ON ContextCache(ExpiresAt);
CREATE INDEX IdxContextType ON ContextCache(ContextType);
```

---

## 7. Integration with Adaptive Reasoning

### 7.1 Reasoning Flow Integration Point

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADAPTIVE REASONING + GSEARCH FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User Prompt Received                                                     │
│     └── "What are the best practices for Go error handling in 2026?"        │
│                                                                              │
│  2. Reasoning Mode Selection                                                 │
│     └── Heuristic score: 4 (complex + temporal) → Two-Stage Mode            │
│                                                                              │
│  3. Stage 1: Context Analysis                                                │
│     ├── Pattern match: "best practices" + "2026" → Needs current info       │
│     ├── Generate ContextNeed:                                                │
│     │   ├── Type: WebSearch                                                  │
│     │   ├── Query: "Go error handling best practices 2026"                  │
│     │   ├── Constraints: { dateFilter: "year" }                             │
│     │   └── Priority: Required                                              │
│     │                                                                        │
│     └── GSearch Delegation:                                                  │
│         └── gsearch search -q "Go error handling best practices 2026" \     │
│                            --date year --limit 5 --output json              │
│                                                                              │
│  4. Context Injection                                                        │
│     ├── Convert search results → RAG chunks                                 │
│     ├── Cache chunks for session                                            │
│     └── Inject into reasoning context                                       │
│                                                                              │
│  5. Stage 2: Response Generation                                             │
│     ├── Context: RAG chunks from codebase + web search                      │
│     ├── Generate response with citations                                    │
│     └── Include follow-up suggestions                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Service Interface

```go
type ContextIntegrationService struct {
    detector   *ContextDetector
    executor   GSearchExecutor
    cache      *ContextCache
    ragStore   *RAGStore
    config     ContextConfig
}

type ContextConfig struct {
    MaxContextNeeds    int           // Max context needs per request
    MaxTotalTokens     int           // Token budget for external context
    ParallelFetches    int           // Max concurrent GSearch calls
    TimeoutPerFetch    time.Duration // Timeout per individual fetch
    CacheTTL           time.Duration // Default cache TTL
    EnableCodeSearch   bool          // Enable code search
    EnableExtraction   bool          // Enable URL extraction
}

func (s *ContextIntegrationService) EnrichPromptContext(
    context stdctx.Context,
    prompt string,
    existingContext []RAGChunk,
) appfault.Result[*EnrichedContext] {
    // 1. Detect context needs
    needs := s.detector.DetectContextNeeds(prompt, existingContext)
    
    if len(needs) == 0 {
        return appfault.Ok(&EnrichedContext{
            Chunks:       existingContext,
            SearchPerformed: false,
        })
    }
    
    // 2. Check cache first
    cachedChunks, uncachedNeeds := s.cache.CheckMultiple(needs)
    
    // 3. Fetch uncached context
    fetchResult, err := s.executor.FetchContextNeeds(context, uncachedNeeds)
    if err != nil {
        return appfault.Fail[*EnrichedContext](
            appfault.Wrap(
                err,
                ErrContextFetchFailed,
                "context fetch failed",
            ),
        )
    }
    
    // 4. Cache new chunks
    s.cache.StoreMultiple(fetchResult.Chunks, uncachedNeeds)
    
    // 5. Merge and deduplicate
    allChunks := mergeAndDeduplicate(existingContext, cachedChunks, fetchResult.Chunks)
    
    // 6. Apply token budget
    budgetedChunks := applyTokenBudget(allChunks, s.config.MaxTotalTokens)
    
    return appfault.Ok(&EnrichedContext{
        Chunks:          budgetedChunks,
        SearchPerformed: true,
        ContextNeeds:    needs,
        FetchStats:      fetchResult.Stats,
    })
}

type EnrichedContext struct {
    Chunks          []RAGChunk
    SearchPerformed bool
    ContextNeeds    []ContextNeed
    FetchStats      FetchStats
}

type FetchStats struct {
    TotalNeeds     int
    CacheHits      int
    FreshFetches   int
    FailedFetches  int
    TotalDurationMs int
    TotalTokens    int
}
```

---

## 8. Error Handling

### 8.1 Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9840 | ErrContextDetectionFailed | Failed to analyze prompt for context needs |
| 9841 | ErrGSearchNotAvailable | GSearch CLI not found or not executable |
| 9842 | ErrGSearchTimeout | GSearch CLI execution timed out |
| 9843 | ErrContextFetchFailed | Failed to fetch required context |
| 9844 | ErrContextCacheCorrupt | Context cache database corrupted |
| 9845 | ErrTokenBudgetExceeded | Context exceeds token budget |
| 9846 | ErrChunkConversionFailed | Failed to convert search result to chunk |
| 9847 | ErrContextPriorityConflict | Conflicting priority assignments |

### 8.2 Error Recovery

```go
func (s *ContextIntegrationService) handleFetchError(
    context stdctx.Context,
    need ContextNeed,
    err error,
) appfault.Result[*RecoveryResult] {
    // Check if GSearch returned specific exit code
    var exitErr *exec.ExitError
    if errors.As(err, &exitErr) {
        switch exitErr.ExitCode() {
        case 2: // Rate limited
            return s.handleRateLimited(context, need)
        case 3: // No results
            return appfault.Ok(&RecoveryResult{
                Action: "ContinueWithout",
                Message: "No external context found for query",
            })
        case 4: // Network error
            return s.handleNetworkError(context, need)
        case 5: // Auth error
            return appfault.Fail[*RecoveryResult](
                appfault.New(
                    ErrGSearchNotAvailable,
                    "GSearch API authentication failed",
                ),
            )
        }
    }
    
    // For required context, escalate error
    if need.Priority == ContextPriorityRequired {
        return appfault.Fail[*RecoveryResult](
            appfault.Wrap(
                err,
                ErrContextFetchFailed,
                "required context fetch failed",
            ),
        )
    }
    
    // For optional/helpful, continue without
    return appfault.Ok(&RecoveryResult{
        Action: "ContinueWithout",
        Message: fmt.Sprintf("Optional context fetch failed: %v", err),
    })
}
```

---

## 9. UI Integration

### 9.1 Context Fetch Status

When GSearch is fetching context, the UI shows progress:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Finding relevant context...                                              │
│                                                                              │
│  ├── Web Search: "Go error handling 2026" ✓ (3 results)                     │
│  ├── Code Search: "Go errors.Is example" ◌ (fetching...)                    │
│  └── Documentation: golang.org/doc/errors ◌ (queued)                        │
│                                                                              │
│  [Skip Context Search]                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Context Citation Display

When response includes external context:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI Response with Citations                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Go 1.22 introduced improved error handling with the `errors.Join`          │
│  function [1]. The recommended pattern for wrapping errors is...            │
│                                                                              │
│  ```go                                                                       │
│  if err != nil {                                                             │
│      return fmt.Errorf("operation failed: %w", err) [2]                     │
│  }                                                                           │
│  ```                                                                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Sources:                                                                    │
│  [1] go.dev/blog/go1.22 - Go 1.22 Release Notes                             │
│  [2] github.com/golang/go - errors package documentation                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Configuration

### 10.1 Settings Schema

```yaml
# config/context-integration.yaml
Context:
  Enabled: true
  MaxContextNeeds: 5
  MaxTotalTokens: 4000
  ParallelFetches: 3
  TimeoutPerFetch: 15s
  
  Cache:
    Enabled: true
    Ttl: 24h
    MaxSize: 100MB
    
  Detection:
    EnablePatterns: true
    HeuristicThreshold: 0.6
    
  Search:
    WebSearch:
      Enabled: true
      MaxResults: 5
      DefaultDateFilter: null
    CodeSearch:
      Enabled: true
      MaxResults: 5
      Sources: ["github", "stackoverflow"]
    Extraction:
      Enabled: true
      MaxDepth: 1
      Formats: ["markdown", "simple-html"]
```

### 10.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/settings/context` | Get context integration settings |
| PUT | `/api/v1/settings/context` | Update context integration settings |
| POST | `/api/v1/context/search` | Manual context search trigger |
| GET | `/api/v1/context/cache/stats` | Get cache statistics |
| DELETE | `/api/v1/context/cache` | Clear context cache |

---

## 11. HTML Blog Generation Integration

### 11.1 Overview

When an HTML blog generation request includes the `--search` flag (or `"Search": true` in API), the system delegates keyword-based research to GSearch before prompt assembly. Results are normalized, stored in session-scoped RAG, and injected into the blog generation prompt as Layer 7 (GSearch Context).

### 11.2 Integration Flow

```
User requests HTML blog with Search=true
  │
  ├── 1. Extract Keywords
  │     ├── From user prompt (NLP keyword extraction)
  │     ├── From explicit Keywords[] array
  │     └── From preset CommonPrompt (secondary terms)
  │
  ├── 2. Build Search Queries
  │     ├── Primary: "{keyword} {area}" (per area if provided)
  │     ├── Secondary: "{keyword} tips" / "{keyword} guide"
  │     └── Platform-specific: adapt query per SearchPlatforms[]
  │
  ├── 3. GSearch Parallel Execution
  │     ├── Google: web search for each query
  │     ├── YouTube: video search (titles, descriptions, transcripts if enabled)
  │     ├── Reddit: community discussions and recommendations
  │     └── Medium: industry articles (if platform included)
  │
  ├── 4. Result Normalization
  │     ├── Convert to RAGChunk[] with source attribution
  │     ├── Deduplicate by URL
  │     ├── Score by relevance to original prompt
  │     └── Trim to MaxResults limit
  │
  ├── 5. Session-Scoped RAG Storage
  │     ├── Store in: data/{app}/rag/seo/html-blog/{company}/session-{uuid}.db
  │     ├── Tag chunks with extracted keywords
  │     └── Set TTL to session lifetime
  │
  └── 6. Context Injection
        ├── Retrieve top-K chunks within token budget
        ├── Format as structured context block
        └── Insert into prompt Layer 7 (GSearch Context)
```

### 11.3 Search Executor

```go
type HtmlBlogSearchExecutor struct {
    gsearch    GSearchExecutor
    config     HtmlBlogSearchConfig
    ragStore   *RAGStore
}

type HtmlBlogSearchConfig struct {
    Enabled            bool     // Default: true
    MaxResults         int      // Default: 10
    Platforms          []string // Default: ["google", "youtube", "reddit"]
    IncludeTranscript  bool     // Default: false
    MaxTokenBudget     int      // Default: 1500
    ParallelSearches   int      // Default: 3
    TimeoutSeconds     int      // Default: 30
}

func (e *HtmlBlogSearchExecutor) ExecuteResearch(
    context stdctx.Context,
    req HtmlBlogGenerateRequest,
    preset HtmlBlogPreset,
) appfault.Result[*HtmlBlogSearchResult] {
    // 1. Extract keywords
    keywords := e.extractKeywords(req.Prompt, req.Keywords, preset.CommonPrompt)
    
    // 2. Build queries per platform
    queries := e.buildQueries(keywords, req.Areas, req.SearchPlatforms)
    
    // 3. Execute parallel searches
    var wg sync.WaitGroup
    resultChan := make(chan []RAGChunk, len(queries))
    
    sem := make(chan struct{}, e.config.ParallelSearches)
    for _, q := range queries {
        wg.Add(1)
        go func(query SearchQuery) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            
            chunks, err := e.executeQuery(context, query)
            if err != nil {
                // Log but don't fail — search is supplementary
                return
            }
            resultChan <- chunks
        }(q)
    }
    
    wg.Wait()
    close(resultChan)
    
    // 4. Collect and deduplicate
    var allChunks []RAGChunk
    seen := make(map[string]bool)
    for chunks := range resultChan {
        for _, c := range chunks {
            if !seen[c.Source.URL] {
                seen[c.Source.URL] = true
                allChunks = append(allChunks, c)
            }
        }
    }
    
    // 5. Sort by relevance, trim to MaxResults
    sort.Slice(allChunks, func(i, j int) bool {
        return allChunks[i].Relevance > allChunks[j].Relevance
    })
    if len(allChunks) > e.config.MaxResults {
        allChunks = allChunks[:e.config.MaxResults]
    }
    
    // 6. Store in session-scoped RAG
    sessionDbPath := fmt.Sprintf("data/%s/rag/seo/html-blog/%s/session-%s.db",
        req.AppName, req.Company, uuid.New().String())
    e.ragStore.StoreChunks(context, sessionDbPath, allChunks)
    
    return appfault.Ok(&HtmlBlogSearchResult{
        Chunks:       allChunks,
        TotalResults: len(allChunks),
        Platforms:    req.SearchPlatforms,
        Keywords:     keywords,
        SessionDb:    sessionDbPath,
    })
}

type HtmlBlogSearchResult struct {
    Chunks       []RAGChunk
    TotalResults int
    Platforms    []string
    Keywords     []string
    SessionDb    string
}
```

### 11.4 Context Formatting

```go
// FormatSearchContext converts search results into a structured context block
// for injection into the blog generation prompt (Layer 7)
func FormatSearchContext(result *HtmlBlogSearchResult) string {
    var sb strings.Builder
    sb.WriteString("## Research Context (from web search)\n\n")
    sb.WriteString("Use the following research to enrich the blog content. ")
    sb.WriteString("Cite sources where appropriate.\n\n")
    
    for i, chunk := range result.Chunks {
        sb.WriteString(fmt.Sprintf("### Source %d: %s\n", i+1, chunk.Source.Title))
        sb.WriteString(fmt.Sprintf("**URL:** %s\n", chunk.Source.URL))
        sb.WriteString(fmt.Sprintf("**Platform:** %s\n\n", chunk.Source.Provider))
        sb.WriteString(chunk.Content)
        sb.WriteString("\n\n---\n\n")
    }
    
    return sb.String()
}
```

### 11.5 Seedable Settings

| Key | Default | Type | Description |
|-----|---------|------|-------------|
| `Seo.HtmlBlog.Search.Enabled` | `true` | bool | Enable GSearch integration for blog generation |
| `Seo.HtmlBlog.Search.MaxResults` | `10` | int | Maximum search results to include |
| `Seo.HtmlBlog.Search.Platforms` | `["google","youtube","reddit"]` | json | Default search platforms |
| `Seo.HtmlBlog.Search.IncludeTranscript` | `false` | bool | Include YouTube transcripts in context |
| `Seo.HtmlBlog.Search.MaxTokenBudget` | `1500` | int | Max tokens allocated for search context |
| `Seo.HtmlBlog.Search.ParallelSearches` | `3` | int | Max concurrent search operations |
| `Seo.HtmlBlog.Search.TimeoutSeconds` | `30` | int | Timeout per search operation |

---

## 12. Cross-References

| Reference | Location |
|-----------|----------|
| Prompt-to-Search Pipeline | `09-agentic-mode.md` (SearchPlan schema, PromptAnalyzer) |
| Adaptive Reasoning Flow | `37-adaptive-reasoning-flow.md` |
| Long-Chain Command System | `50-long-chain-command-system.md` (DAG builder, wave scheduler) |
| GSearch AI Bridge Integration | `02-spec/25-gsearch-cli/05-ai-bridge-integration.md` |
| WebSocket Connection Manager | `38-websocket-connection-manager.md` |
| RAG Architecture | `02-spec/27-ai-bridge-cli/01-backend/11-rag-integration.md` |
| Session-Scoped Memory | `36-session-scoped-rag-memory.md` |
| HTML Blog Generation | `55-html-blog-generation.md` |
| Error Codes | `05-error-codes.md` |
