# gSearch CLI: AI Bridge Integration API

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

This document defines the CLI interface and JSON output format that gSearch CLI exposes for integration with AI Bridge CLI. AI Bridge delegates search operations to gSearch CLI and caches results in RAG memory.

---

## CLI Interface

### Web Search Command

```bash
gsearch search [options] <query>
```

**Options:**

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--query` | `-q` | string | (required) | Search query |
| `--limit` | `-l` | int | 5 | Maximum results (1-20) |
| `--lang` | | string | en | Result language |
| `--region` | `-r` | string | us | Search region |
| `--output` | `-o` | string | json | Output format (json, text, markdown) |
| `--safe` | | bool | true | Safe search enabled |
| `--date` | `-d` | string | | Date filter (day, week, month, year) |

**Examples:**

```bash
# Basic search
gsearch search --query "Go concurrency patterns" --limit 5 --output json

# Code-specific search
gsearch search --query "sync.WaitGroup example golang" --lang en --output json

# Recent results only
gsearch search --query "AI news 2026" --date week --output json
```

---

### Code Search Command

```bash
gsearch code [options] <query>
```

**Options:**

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--query` | `-q` | string | (required) | Code search query |
| `--lang` | | string | | Programming language filter |
| `--repo` | | string | | Specific repository |
| `--limit` | `-l` | int | 5 | Maximum results |
| `--output` | `-o` | string | json | Output format |
| `--source` | | string | github | Code source (github, stackoverflow, all) |

**Examples:**

```bash
# Search GitHub
gsearch code --query "LRU cache implementation" --lang go --output json

# Search StackOverflow
gsearch code --query "async await error handling" --lang typescript --source stackoverflow

# Search specific repo
gsearch code --query "middleware" --repo "gin-gonic/gin" --output json
```

---

## JSON Output Schema

### Web Search Response

```json
{
  "query": "Go concurrency patterns",
  "resultCount": 5,
  "totalResults": 1540000,
  "searchDurationMs": 234,
  "language": "en",
  "region": "us",
  "source": "web",
  "timestamp": "2026-02-02T10:30:00Z",
  "results": [
    {
      "rank": 1,
      "title": "Concurrency in Go - Go by Example",
      "url": "https://gobyexample.com/goroutines",
      "displayUrl": "gobyexample.com › goroutines",
      "snippet": "Go's goroutines and channels provide a powerful way to structure concurrent programs. This example demonstrates goroutine creation and synchronization.",
      "cachedUrl": null,
      "publishedDate": "2025-08-15",
      "metadata": {
        "favicon": "https://gobyexample.com/favicon.ico",
        "siteName": "Go by Example"
      }
    },
    {
      "rank": 2,
      "title": "Concurrency Patterns in Go - Ardan Labs",
      "url": "https://www.ardanlabs.com/blog/concurrency-patterns",
      "displayUrl": "ardanlabs.com › blog › concurrency",
      "snippet": "Learn about common concurrency patterns in Go including worker pools, fan-out/fan-in, and context cancellation.",
      "cachedUrl": "https://webcache.example.com/...",
      "publishedDate": "2026-01-10",
      "metadata": {
        "favicon": "https://ardanlabs.com/favicon.ico",
        "siteName": "Ardan Labs"
      }
    }
  ]
}
```

### Code Search Response

```json
{
  "query": "LRU cache implementation",
  "resultCount": 5,
  "language": "go",
  "source": "github",
  "searchDurationMs": 156,
  "timestamp": "2026-02-02T10:35:00Z",
  "results": [
    {
      "rank": 1,
      "title": "hashicorp/golang-lru",
      "url": "https://github.com/hashicorp/golang-lru",
      "repository": {
        "owner": "hashicorp",
        "name": "golang-lru",
        "stars": 4521,
        "forks": 512,
        "language": "Go",
        "license": "MPL-2.0"
      },
      "file": {
        "path": "lru.go",
        "url": "https://github.com/hashicorp/golang-lru/blob/main/lru.go",
        "lineStart": 15,
        "lineEnd": 45
      },
      "snippet": "// LRU implements a non-thread safe fixed size LRU cache\ntype LRU[K comparable, V any] struct {\n    size      int\n    evictList *list.List\n    items     map[K]*list.Element\n}",
      "matchScore": 0.95
    },
    {
      "rank": 2,
      "title": "StackOverflow: Implementing LRU in Go",
      "url": "https://stackoverflow.com/questions/12345678",
      "source": "stackoverflow",
      "votes": 234,
      "answers": 8,
      "accepted": true,
      "snippet": "Here's a simple thread-safe LRU cache implementation using sync.RWMutex..."
    }
  ]
}
```

---

## Exit Codes

| Code | Name | Description | AI Bridge Action |
|------|------|-------------|------------------|
| 0 | SUCCESS | Search completed | Continue chain |
| 1 | GENERAL_ERROR | Unknown error | Retry (up to 3x) |
| 2 | RATE_LIMITED | API rate limit hit | Wait 60s, retry |
| 3 | NO_RESULTS | Query returned empty | Continue without results |
| 4 | NETWORK_ERROR | Connection failed | Retry with backoff |
| 5 | AUTH_ERROR | API key invalid | Fail chain, notify user |
| 6 | INVALID_QUERY | Query syntax error | Fail, return error message |
| 7 | TIMEOUT | Request timed out | Retry once |
| 8 | QUOTA_EXCEEDED | Daily quota reached | Fail, notify user |

---

## Error Output Format

When an error occurs, gSearch CLI outputs to stderr in JSON format:

```json
{
  "error": {
    "code": 2,
    "name": "RATE_LIMITED",
    "message": "Google API rate limit exceeded. Retry after 60 seconds.",
    "retryAfter": 60,
    "timestamp": "2026-02-02T10:40:00Z"
  }
}
```

---

## AI Bridge Integration

### Tool Registration

AI Bridge registers gSearch as an external tool:

```json
{
  "tools": {
    "web_search": {
      "targetCli": "gsearch",
      "command": "search",
      "argMapping": {
        "query": "--query",
        "maxResults": "--limit",
        "language": "--lang"
      },
      "cacheMode": "rag",
      "cacheTtl": 3600,
      "timeout": 30,
      "retryCount": 2
    },
    "code_search": {
      "targetCli": "gsearch",
      "command": "code",
      "argMapping": {
        "query": "--query",
        "language": "--lang",
        "repository": "--repo"
      },
      "cacheMode": "rag",
      "cacheTtl": 7200,
      "timeout": 45,
      "retryCount": 2
    }
  }
}
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI BRIDGE → gSearch DELEGATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. LLM decides to search                                                   │
│      └── tool_call: { name: "web_search", args: { query: "..." } }          │
│                                                                              │
│   2. AI Bridge checks cache                                                  │
│      └── Cache key: SHA256(tool_name + args_json)                           │
│      └── If cached && not expired → return cached result                    │
│                                                                              │
│   3. Spawn gSearch CLI                                                       │
│      └── gsearch search --query "..." --limit 5 --output json               │
│      └── Capture stdout, stderr, exit code                                  │
│                                                                              │
│   4. Parse response                                                          │
│      └── If exit 0 → parse JSON results                                     │
│      └── If exit 2 → wait retry_after, retry                                │
│      └── If exit 5 → fail chain with auth error                             │
│                                                                              │
│   5. Cache results                                                           │
│      └── Store in: {app}/rag/cache/search-{hash}.db                         │
│      └── TTL: 3600 seconds                                                   │
│                                                                              │
│   6. Return to LLM                                                           │
│      └── Inject search results into context                                 │
│      └── Continue generation                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cache Database Schema

```sql
-- Table: search_cache (in {app}/rag/cache/search-cache.db)
CREATE TABLE search_cache (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,           -- "web_search", "code_search"
    query_hash TEXT NOT NULL,          -- SHA256 of args
    query_text TEXT NOT NULL,          -- Original query
    result_json TEXT NOT NULL,         -- Full JSON response
    result_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    hit_count INTEGER DEFAULT 0,
    last_hit DATETIME,
    UNIQUE(tool_name, query_hash)
);

CREATE INDEX IdxSearchExpires ON search_cache(expires_at);
CREATE INDEX IdxSearchTool ON search_cache(tool_name);
```

---

## Configuration

### gSearch CLI Config (`~/.gsearch/config.yaml`)

```yaml
version: "1.0"
api:
  googleKey: "${GOOGLE_API_KEY}"
  googleCx: "${GOOGLE_CX_ID}"
  rateLimit: 100  # requests per minute
  timeout: 30s

cache:
  enabled: true
  dir: ~/.gsearch/cache
  ttl: 1h
  maxSize: 100MB

output:
  defaultFormat: json
  prettyPrint: true
  colorize: false  # For AI Bridge integration
```

---

## Error Handling Best Practices

### AI Bridge Error Recovery

```go
func (e *Executor) executeGSearch(context stdctx.Context, call ToolCall) appfault.Result[ToolResult] {
    var lastErr error
    
    for attempt := 0; attempt < e.config.RetryCount; attempt++ {
        cmd := exec.CommandContext(context, "gsearch", call.Args...)
        
        stdout, stderr, exitCode := runCommand(cmd)
        
        switch exitCode {
        case 0:
            // Success
            return parseSearchResult(stdout)
            
        case 2: // Rate limited
            retryAfter := parseRetryAfter(stderr)
            e.logger.Warn("gSearch rate limited", slog.Int("retryAfter", retryAfter))
            time.Sleep(time.Duration(retryAfter) * time.Second)
            continue
            
        case 3: // No results
            return appfault.Ok(ToolResult{
                Success: true,
                Data:    EmptySearchResult{Results: []SearchResultItem{}, Message: "No results found"},
            })
            
        case 4: // Network error
            e.logger.Warn("gSearch network error, retrying", slog.Int("attempt", attempt))
            time.Sleep(time.Duration(attempt+1) * time.Second)
            lastErr = appfault.New(7610, "network error: "+stderr)
            continue
            
        case 5: // Auth error
            return appfault.Fail[ToolResult](appfault.New(7611, "gSearch authentication failed: "+stderr))
            
        default:
            lastErr = appfault.New(7612, fmt.Sprintf("gSearch failed with code %d: %s", exitCode, stderr))
        }
    }
    
    return appfault.Fail[ToolResult](lastErr)
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| AI Bridge Agentic Mode | `02-spec/27-ai-bridge-cli/01-backend/09-agentic-mode.md` |
| gSearch CLI Overview | `02-spec/25-gsearch-cli/00-overview.md` |
| Tool Delegation Config | `02-spec/27-ai-bridge-cli/01-backend/09-agentic-mode.md` |
