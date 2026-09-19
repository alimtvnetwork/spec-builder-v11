# Component: Testing Strategy

**Parent:** [Golang Search CLI](./00-overview.md)  
**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Summary

Integration-focused testing strategy for the Golang Search CLI. Tests validate complete workflows, database operations, and HTTP interactions without requiring Docker or external infrastructure.

---

## Testing Approach

```
┌─────────────────────────────────┐
│      Integration Tests          │  ← 100% (Complete workflows)
│  - Database + Service layers    │
│  - Mock HTTP responses          │
│  - CLI command execution        │
└─────────────────────────────────┘
```

**Philosophy:** Test the system as a whole. Individual functions are validated through integration with real database connections and mocked HTTP responses.

---

## Directory Structure

```
gsearch/
├── cmd/
│   └── *_test.go           # CLI command integration tests
├── internal/
│   └── */
│       └── *_test.go       # Service integration tests
├── tests/
│   └── integration/        # Full workflow tests
│       ├── search_flow_test.go
│       ├── database_test.go
│       ├── cache_test.go
│       ├── nested_search_test.go
│       └── rag_export_test.go
└── testdata/               # Sample responses
    ├── fixtures/
    │   ├── google/
    │   │   ├── results_normal.html
    │   │   ├── results_captcha.html
    │   │   ├── results_empty.html
    │   │   ├── results_few.html
    │   │   ├── results_pagination.html
    │   │   └── results_consent.html
    │   ├── duckduckgo/
    │   │   ├── results_normal.html
    │   │   ├── results_blocked.html
    │   │   ├── results_empty.html
    │   │   ├── results_rate_limited.html
    │   │   └── results_new_layout.html
    │   ├── bing/
    │   │   ├── results_normal.html
    │   │   ├── results_empty.html
    │   │   ├── api_response.json
    │   │   ├── api_error.json
    │   │   ├── api_quota_exceeded.json
    │   │   └── api_rate_limited.json
    │   └── pages/
    │       ├── article_tech.html
    │       ├── article_science.html
    │       ├── page_minimal.html
    │       └── page_scripts_heavy.html
    ├── mocks/
    │   ├── responses/
    │   │   ├── google_429.json
    │   │   ├── google_503.json
    │   │   ├── network_timeout.json
    │   │   └── proxy_error.json
    │   └── scenarios/
    │       ├── fallback_chain.json
    │       ├── cache_hit.json
    │       └── nested_search.json
    └── metadata.json
```

---

## Testing Framework

### Dependencies

```go
// go.mod
require (
    github.com/stretchr/testify v1.9.0
    github.com/jarcoal/httpmock v1.3.1
)
```

### Test Environment Setup

```go
// tests/integration/testenv.go
package integration

import (
    "os"
    "path/filepath"
    "testing"
    
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

type TestEnv struct {
    DB         *gorm.DB
    DBPath     string
    ConfigPath string
    TempDir    string
}

func NewTestEnv(t *testing.T) *TestEnv {
    t.Helper()
    
    tempDir := t.TempDir()
    dbPath := filepath.Join(tempDir, "test.db")
    
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        t.Fatalf("open db: %v", err)
    }
    
    // Run migrations
    db.AutoMigrate(&models.SearchRequest{}, &models.SearchResult{}, 
                   &models.PageContent{}, &models.NestedSearch{},
                   &models.CacheEntry{}, &models.RagMemory{}, &models.OAuthToken{})
    
    return &TestEnv{
        DB:         db,
        DBPath:     dbPath,
        ConfigPath: filepath.Join(tempDir, "config.json"),
        TempDir:    tempDir,
    }
}

func (e *TestEnv) Cleanup() {
    sqlDb, _ := e.DB.DB()
    sqlDb.Close()
}

func (e *TestEnv) WriteConfig(t *testing.T, config string) {
    t.Helper()
    err := pathutil.WriteFile(e.ConfigPath, []byte(config), 0644)
    if err != nil {
        t.Fatalf("write config: %v", err)
    }
}
```

---

## Integration Tests

### 1. Database Integration Tests

```go
// tests/integration/database_test.go
package integration

import (
    "testing"
    "time"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestSearchRequestLifecycle(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    db := database.NewDb(env.DB)
    
    // Create search request
    request, err := db.CreateSearchRequest("machine learning", "google", "html")
    require.NoError(t, err)
    assert.NotEmpty(t, request.Id)
    assert.Equal(t, models.StatusPending, request.Status)
    
    // Add results
    results := []models.SearchResult{
        {SearchRequestId: request.Id, Title: "ML Guide", Url: "https://example.com/ml", Position: 1},
        {SearchRequestId: request.Id, Title: "AI Intro", Url: "https://example.com/ai", Position: 2},
    }
    err = db.SaveResults(request.Id, results)
    require.NoError(t, err)
    
    // Update status
    err = db.UpdateSearchStatus(request.Id, models.StatusCompleted, 2)
    require.NoError(t, err)
    
    // Verify cascade: retrieve with results
    loaded, err := db.GetSearchRequestWithResults(request.Id)
    require.NoError(t, err)
    assert.Equal(t, models.StatusCompleted, loaded.Status)
    assert.Len(t, loaded.Results, 2)
    
    // Test cascade delete
    err = db.DeleteSearchRequest(request.Id)
    require.NoError(t, err)
    
    // Verify results deleted
    orphanResults, _ := db.GetResultsBySearchId(request.Id)
    assert.Empty(t, orphanResults)
}

func TestNestedSearchRelationships(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    db := database.NewDb(env.DB)
    
    // Create parent search
    parent, _ := db.CreateSearchRequest("machine learning", "google", "html")
    
    // Create child search
    child, _ := db.CreateSearchRequest("neural networks", "google", "html")
    
    // Create nested relationship
    err := db.CreateNestedSearch(parent.Id, child.Id, "neural networks", 1)
    require.NoError(t, err)
    
    // Retrieve nested tree
    tree, err := db.GetNestedSearchTree(parent.Id, 3)
    require.NoError(t, err)
    assert.Len(t, tree, 1)
    assert.Equal(t, "neural networks", tree[0].TriggerKeyword)
}

func TestCacheEntryExpiration(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    db := database.NewDb(env.DB)
    cacheService := cache.NewCacheService(db, &config.CacheConfig{
        Enabled:    true,
        ExpireDays: 5,
    })
    
    // Set cache entry
    err := cacheService.Set("test query", "google", "search-123")
    require.NoError(t, err)
    
    // Retrieve valid entry
    result, err := cacheService.Get("test query", "google")
    require.NoError(t, err)
    assert.NotNil(t, result)
    assert.True(t, result.FromCache)
    
    // Manually expire the entry
    env.DB.Model(&models.CacheEntry{}).
        Where("keyword_hash = ?", cacheService.GenerateKey("test query", "google")).
        Update("expires_at", time.Now().Add(-1*time.Hour))
    
    // Attempt retrieval of expired entry
    result, err = cacheService.Get("test query", "google")
    assert.Error(t, err)
    assert.Nil(t, result)
}
```

### 2. Search Flow Integration Tests

```go
// tests/integration/search_flow_test.go
package integration

import (
    "context"
    "testing"
    
    "github.com/jarcoal/httpmock"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestCompleteSearchFlow(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    // Setup HTTP mocks
    httpmock.Activate()
    defer httpmock.DeactivateAndReset()
    
    // Mock Google response
    httpmock.RegisterResponder("GET", `=~^https://www\.google\.com/search.*`,
        httpmock.NewStringResponder(200, loadTestdata(t, "google_response.html")))
    
    // Initialize services
    cfg := testConfig()
    db := database.NewDb(env.DB)
    parser := search.NewHtmlParser(cfg.Search, cfg.Blocking.DetectPatterns)
    switcher := search.NewMethodSwitcher(cfg)
    switcher.RegisterMethod(parser)
    executor := search.NewExecutor(switcher, cfg)
    
    // Execute search
    ctx := context.Background()
    results, err := executor.Search(ctx, "golang tutorials", search.SearchOptions{
        MaxResults: 10,
    })
    
    require.NoError(t, err)
    assert.NotEmpty(t, results)
    assert.LessOrEqual(t, len(results), 10)
    
    // Verify HTTP calls made
    assert.Equal(t, 1, httpmock.GetTotalCallCount())
}

func TestSearchWithMethodFallback(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    httpmock.Activate()
    defer httpmock.DeactivateAndReset()
    
    // First method: Google returns blocked
    httpmock.RegisterResponder("GET", `=~^https://www\.google\.com/search.*`,
        httpmock.NewStringResponder(429, "Too many requests"))
    
    // Fallback: DuckDuckGo works
    httpmock.RegisterResponder("POST", "https://html.duckduckgo.com/html/",
        httpmock.NewStringResponder(200, loadTestdata(t, "ddg_response.html")))
    
    cfg := testConfig()
    db := database.NewDb(env.DB)
    
    googleParser := search.NewGoogleHtmlParser(cfg)
    ddgParser := search.NewDdgParser(cfg)
    
    switcher := search.NewMethodSwitcher(cfg)
    switcher.RegisterMethod(googleParser)
    switcher.RegisterMethod(ddgParser)
    
    executor := search.NewExecutor(switcher, cfg)
    
    ctx := context.Background()
    results, err := executor.Search(ctx, "test query", search.SearchOptions{MaxResults: 5})
    
    require.NoError(t, err)
    assert.NotEmpty(t, results)
    
    // Google should be marked blocked
    blocked := switcher.GetBlockedMethods()
    assert.Contains(t, blocked, "google")
}

func TestSearchWithCaching(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    httpmock.Activate()
    defer httpmock.DeactivateAndReset()
    
    httpmock.RegisterResponder("GET", `=~^https://www\.google\.com/search.*`,
        httpmock.NewStringResponder(200, loadTestdata(t, "google_response.html")))
    
    cfg := testConfig()
    cfg.Cache.Enabled = true
    cfg.Cache.ExpireDays = 5
    
    db := database.NewDb(env.DB)
    cacheService := cache.NewCacheService(db, &cfg.Cache)
    orchestrator := search.NewOrchestrator(cfg, db, cacheService)
    
    ctx := context.Background()
    
    // First search: hits network
    results1, err := orchestrator.Search(ctx, "cached query", search.SearchOptions{})
    require.NoError(t, err)
    assert.Equal(t, 1, httpmock.GetTotalCallCount())
    
    // Second search: from cache
    results2, err := orchestrator.Search(ctx, "cached query", search.SearchOptions{})
    require.NoError(t, err)
    assert.Equal(t, 1, httpmock.GetTotalCallCount()) // No additional HTTP call
    
    assert.Equal(t, len(results1), len(results2))
}
```

### 3. Nested Search Integration Tests

```go
// tests/integration/nested_search_test.go
package integration

import (
    "context"
    "testing"
    
    "github.com/jarcoal/httpmock"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestNestedSearchExecution(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    httpmock.Activate()
    defer httpmock.DeactivateAndReset()
    
    // Mock search results
    httpmock.RegisterResponder("GET", `=~^https://www\.google\.com/search.*`,
        httpmock.NewStringResponder(200, loadTestdata(t, "google_response.html")))
    
    // Mock page content fetch
    httpmock.RegisterResponder("GET", "https://example.com/ml",
        httpmock.NewStringResponder(200, `
            <html><body>
                <p>Machine learning uses neural networks for deep learning tasks.</p>
                <p>TensorFlow and PyTorch are popular frameworks.</p>
            </body></html>
        `))
    
    cfg := testConfig()
    cfg.Nested.Enabled = true
    cfg.Nested.MaxDepth = 2
    cfg.Nested.KeywordThreshold = 3
    
    db := database.NewDb(env.DB)
    nestedService := nested.NewNestedSearchService(
        search.NewExecutor(search.NewMethodSwitcher(cfg), cfg),
        nested.NewPageFetcher(cfg.PageFetch),
        db,
        &cfg.Nested,
    )
    
    ctx := context.Background()
    
    // Create initial search
    parentSearch, _ := db.CreateSearchRequest("machine learning", "google", "html")
    results := []search.Result{
        {Title: "ML Guide", URL: "https://example.com/ml", Position: 1},
    }
    
    // Execute nested search
    err := nestedService.ExecuteNested(ctx, parentSearch.Id, results, 0)
    require.NoError(t, err)
    
    // Verify nested searches created
    tree, _ := db.GetNestedSearchTree(parentSearch.Id, 3)
    assert.NotEmpty(t, tree, "should have created child searches from extracted keywords")
}

func TestNestedSearchDepthLimit(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    cfg := testConfig()
    cfg.Nested.MaxDepth = 1
    
    db := database.NewDb(env.DB)
    nestedService := nested.NewNestedSearchService(nil, nil, db, &cfg.Nested)
    
    ctx := context.Background()
    
    // Try to execute at max depth
    err := nestedService.ExecuteNested(ctx, "parent-id", nil, 1)
    assert.NoError(t, err) // Should return early, not error
}
```

### 4. RAG Export Integration Tests

```go
// tests/integration/rag_export_test.go
package integration

import (
    "context"
    "encoding/json"
    "os"
    "path/filepath"
    "testing"
    "time"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "gopkg.in/yaml.v3"
)

func TestRagExportJson(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    db := database.NewDb(env.DB)
    
    // Setup test data
    search, _ := db.CreateSearchRequest("AI topics", "google", "html")
    db.SaveResults(search.Id, []models.SearchResult{
        {SearchRequestId: search.Id, Title: "AI Guide", Url: "https://example.com/ai", Position: 1},
    })
    db.SavePageContent(search.Id, "result-1", &models.PageContent{
        ExtractedText: "Artificial intelligence is transforming industries worldwide.",
    })
    db.UpdateSearchStatus(search.Id, models.StatusCompleted, 1)
    
    // Export to JSON
    exportService := rag.NewExportService(db)
    outputPath := filepath.Join(env.TempDir, "rag_export.json")
    
    err := exportService.Export(context.Background(), rag.ExportOptions{
        Format:     "json",
        OutputPath: outputPath,
        Keywords:   []string{"AI"},
        Since:      time.Now().Add(-24 * time.Hour),
    })
    require.NoError(t, err)
    
    // Verify output
    data, err := pathutil.ReadFile(outputPath)
    require.NoError(t, err)
    
    var memory rag.RAGMemory
    err = json.Unmarshal(data, &memory)
    require.NoError(t, err)
    
    assert.Equal(t, "1.0", memory.Version)
    assert.NotEmpty(t, memory.Sources)
    assert.NotEmpty(t, memory.Chunks)
}

func TestRagExportYaml(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    db := database.NewDb(env.DB)
    setupTestSearchData(t, db)
    
    exportService := rag.NewExportService(db)
    outputPath := filepath.Join(env.TempDir, "rag_export.yaml")
    
    err := exportService.Export(context.Background(), rag.ExportOptions{
        Format:     "yaml",
        OutputPath: outputPath,
    })
    require.NoError(t, err)
    
    data, _ := pathutil.ReadFile(outputPath)
    var memory rag.RAGMemory
    err = yaml.Unmarshal(data, &memory)
    require.NoError(t, err)
    
    assert.NotEmpty(t, memory.Metadata.TotalChunks)
}

func TestRAGChunking(t *testing.T) {
    chunker := rag.NewTextChunker(100, 10) // 100 tokens, 10 overlap
    
    longText := "This is a long text that should be split into multiple chunks. " +
        "Each chunk should contain roughly 100 tokens. " +
        "The chunker should handle sentence boundaries properly."
    
    items := []rag.ContentItem{
        {SourceId: "src-1", Text: longText},
    }
    
    chunks := chunker.ChunkContent(items)
    
    assert.NotEmpty(t, chunks)
    for _, chunk := range chunks {
        assert.LessOrEqual(t, chunk.TokenCount, 150) // Allow some overflow
        assert.NotEmpty(t, chunk.Content)
    }
}
```

### 5. CLI Command Integration Tests

```go
// tests/integration/cli_test.go
package integration

import (
    "bytes"
    "os/exec"
    "path/filepath"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestCLISearchCommand(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping CLI test in short mode")
    }
    
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    // Build CLI binary
    binaryPath := filepath.Join(env.TempDir, "gsearch")
    buildCmd := exec.Command("go", "build", "-o", binaryPath, ".")
    err := buildCmd.Run()
    require.NoError(t, err, "failed to build binary")
    
    // Test help command
    var stdout, stderr bytes.Buffer
    cmd := exec.Command(binaryPath, "--help")
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr
    
    err = cmd.Run()
    require.NoError(t, err)
    assert.Contains(t, stdout.String(), "gsearch")
    assert.Contains(t, stdout.String(), "search")
}

func TestCLICacheStatsCommand(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping CLI test in short mode")
    }
    
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    // Setup test database with cache entries
    db := database.NewDb(env.DB)
    cacheService := cache.NewCacheService(db, &config.CacheConfig{Enabled: true, ExpireDays: 5})
    cacheService.Set("test", "google", "search-1")
    
    binaryPath := filepath.Join(env.TempDir, "gsearch")
    exec.Command("go", "build", "-o", binaryPath, ".").Run()
    
    var stdout bytes.Buffer
    cmd := exec.Command(binaryPath, "cache", "stats", "--db", env.DBPath)
    cmd.Stdout = &stdout
    
    err := cmd.Run()
    require.NoError(t, err)
    assert.Contains(t, stdout.String(), "Total Entries")
}

func TestCLIConfigValidation(t *testing.T) {
    env := NewTestEnv(t)
    defer env.Cleanup()
    
    // Write invalid config
    invalidConfig := `{"search": {"defaultDelay": 100}}`  // Below minimum 500ms
    env.WriteConfig(t, invalidConfig)
    
    binaryPath := filepath.Join(env.TempDir, "gsearch")
    exec.Command("go", "build", "-o", binaryPath, ".").Run()
    
    cmd := exec.Command(binaryPath, "search", "test", "--config", env.ConfigPath)
    err := cmd.Run()
    
    assert.Error(t, err, "should fail with invalid config")
}
```

---

## Running Tests

```bash
# Run all integration tests
go test ./tests/integration/... -v

# Run with race detection
go test ./tests/integration/... -race

# Run specific test
go test ./tests/integration/... -run TestCompleteSearchFlow -v

# Run with coverage
go test ./tests/integration/... -coverprofile=coverage.out
go tool cover -html=coverage.out

# Skip CLI tests (faster)
go test ./tests/integration/... -short
```

---

## Test Fixtures Specification

### Overview

Test fixtures provide realistic, version-controlled sample responses for deterministic testing without network dependencies. Fixtures must closely match actual search engine responses while being stripped of PII.

### Directory Structure

```
/testdata
├── fixtures/
│   ├── google/
│   │   ├── results_normal.html       # Standard 10-result page
│   │   ├── results_captcha.html      # CAPTCHA block page
│   │   ├── results_empty.html        # "No results found" page
│   │   ├── results_few.html          # 3 results (edge case)
│   │   └── results_pagination.html   # Page with "Next" link
│   ├── duckduckgo/
│   │   ├── results_normal.html       # Standard results
│   │   ├── results_blocked.html      # Rate limited response
│   │   ├── results_empty.html        # No results
│   │   └── results_new_layout.html   # Alternate DOM structure
│   ├── bing/
│   │   ├── results_normal.html       # Standard HTML results
│   │   ├── results_empty.html        # No results
│   │   ├── api_response.json         # Bing API JSON format
│   │   └── api_error.json            # API error response
│   └── pages/
│       ├── article_tech.html         # Tech article for keyword extraction
│       ├── article_science.html      # Science article
│       ├── page_minimal.html         # Minimal content
│       └── page_scripts_heavy.html   # Heavy JS/CSS to filter
├── metadata.json                      # Fixture version tracking
└── README.md                          # Fixture documentation
```

### Fixture Metadata

```json
// testdata/metadata.json
{
  "version": "2026-01-v1",
  "capturedAt": "2026-01-28T00:00:00Z",
  "maintainer": "test-team",
  "fixtures": {
    "google/results_normal.html": {
      "capturedAt": "2026-01-28",
      "resultCount": 10,
      "selectorVersion": "2026-01-v3",
      "notes": "Standard search results page"
    },
    "google/results_captcha.html": {
      "capturedAt": "2026-01-28",
      "type": "blocked",
      "notes": "Contains reCAPTCHA challenge"
    },
    "duckduckgo/results_normal.html": {
      "capturedAt": "2026-01-28",
      "resultCount": 10,
      "selectorVersion": "2026-01-v3"
    },
    "bing/api_response.json": {
      "capturedAt": "2026-01-28",
      "resultCount": 10,
      "apiVersion": "v7.0"
    }
  }
}
```

### Sample Fixtures

#### Google Normal Results (testdata/fixtures/google/results_normal.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>machine learning - Google Search</title>
</head>
<body>
  <div id="main">
    <div id="search">
      <div id="rso">
        <!-- Result 1 -->
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/ml-guide">
                <h3>Complete Machine Learning Guide 2026</h3>
              </a>
            </div>
            <div class="VwiC3b">
              A comprehensive introduction to machine learning concepts, 
              algorithms, and practical applications for beginners and experts.
            </div>
          </div>
        </div>
        
        <!-- Result 2 -->
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/neural-networks">
                <h3>Neural Networks Explained Simply</h3>
              </a>
            </div>
            <div class="VwiC3b">
              Learn how neural networks work with clear examples. 
              Covers perceptrons, CNNs, RNNs, and transformers.
            </div>
          </div>
        </div>
        
        <!-- Result 3 -->
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/tensorflow-tutorial">
                <h3>TensorFlow Tutorial for Beginners</h3>
              </a>
            </div>
            <div class="VwiC3b">
              Step-by-step TensorFlow tutorial covering installation, 
              basic operations, and building your first model.
            </div>
          </div>
        </div>
        
        <!-- Results 4-10 follow same structure -->
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/pytorch-intro"><h3>PyTorch Introduction</h3></a>
            </div>
            <div class="VwiC3b">Getting started with PyTorch for deep learning.</div>
          </div>
        </div>
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/sklearn"><h3>Scikit-Learn Documentation</h3></a>
            </div>
            <div class="VwiC3b">Official scikit-learn machine learning library docs.</div>
          </div>
        </div>
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/ml-courses"><h3>Top ML Courses Online</h3></a>
            </div>
            <div class="VwiC3b">Best machine learning courses from top universities.</div>
          </div>
        </div>
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/ai-vs-ml"><h3>AI vs Machine Learning</h3></a>
            </div>
            <div class="VwiC3b">Understanding the difference between AI and ML.</div>
          </div>
        </div>
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/ml-projects"><h3>ML Project Ideas</h3></a>
            </div>
            <div class="VwiC3b">50 machine learning project ideas for practice.</div>
          </div>
        </div>
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/deep-learning"><h3>Deep Learning Fundamentals</h3></a>
            </div>
            <div class="VwiC3b">Core concepts of deep learning explained.</div>
          </div>
        </div>
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/ml-jobs"><h3>Machine Learning Jobs 2026</h3></a>
            </div>
            <div class="VwiC3b">Career opportunities in machine learning field.</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div id="foot">
      <a id="pnnext" href="/search?q=machine+learning&start=10">Next</a>
    </div>
  </div>
</body>
</html>
```

#### Google CAPTCHA Page (testdata/fixtures/google/results_captcha.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Before you continue to Google Search</title>
</head>
<body>
  <div id="captcha-form">
    <h1>Our systems have detected unusual traffic from your computer network.</h1>
    <p>This page checks to see if it's really you sending the requests, 
       and not a robot.</p>
    <div class="g-recaptcha" data-sitekey="REDACTED"></div>
    <form action="/sorry/index" method="post">
      <input type="hidden" name="continue" value="/search?q=test">
      <input type="submit" value="Submit">
    </form>
  </div>
</body>
</html>
```

#### Google Empty Results (testdata/fixtures/google/results_empty.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>xyznonexistentquery123 - Google Search</title>
</head>
<body>
  <div id="main">
    <div id="search">
      <div class="card-section">
        <p>Your search - <b>xyznonexistentquery123</b> - did not match any documents.</p>
        <p>Suggestions:</p>
        <ul>
          <li>Make sure all words are spelled correctly.</li>
          <li>Try different keywords.</li>
          <li>Try more general keywords.</li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
```

#### DuckDuckGo Normal Results (testdata/fixtures/duckduckgo/results_normal.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>machine learning at DuckDuckGo</title>
</head>
<body>
  <div id="links">
    <!-- Result 1 -->
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-intro">
          Machine Learning Introduction
        </a>
        <a class="result__snippet">
          An introduction to machine learning covering supervised, 
          unsupervised, and reinforcement learning approaches.
        </a>
      </div>
    </div>
    
    <!-- Result 2 -->
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-algorithms">
          Popular ML Algorithms
        </a>
        <a class="result__snippet">
          Overview of common machine learning algorithms including 
          linear regression, decision trees, and neural networks.
        </a>
      </div>
    </div>
    
    <!-- Result 3 -->
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/python-ml">
          Python for Machine Learning
        </a>
        <a class="result__snippet">
          Learn how to use Python libraries like NumPy, Pandas, 
          and scikit-learn for machine learning projects.
        </a>
      </div>
    </div>
    
    <!-- Results 4-10 -->
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-datasets">ML Datasets</a>
        <a class="result__snippet">Free datasets for machine learning practice.</a>
      </div>
    </div>
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-frameworks">ML Frameworks Comparison</a>
        <a class="result__snippet">Comparing TensorFlow, PyTorch, and JAX.</a>
      </div>
    </div>
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-best-practices">ML Best Practices</a>
        <a class="result__snippet">Industry best practices for ML development.</a>
      </div>
    </div>
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-ethics">Ethics in ML</a>
        <a class="result__snippet">Ethical considerations in machine learning.</a>
      </div>
    </div>
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/automl">AutoML Tools</a>
        <a class="result__snippet">Automated machine learning platforms.</a>
      </div>
    </div>
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/ml-deployment">ML Model Deployment</a>
        <a class="result__snippet">Deploying ML models to production.</a>
      </div>
    </div>
    <div class="result results_links results_links_deep web-result">
      <div class="result__body">
        <a class="result__a" href="https://example.com/mlops">MLOps Guide</a>
        <a class="result__snippet">Machine learning operations and DevOps.</a>
      </div>
    </div>
    
    <!-- More button -->
    <a class="result--more__btn" href="/html/?q=machine+learning&s=10">More results</a>
  </div>
</body>
</html>
```

#### Bing Normal Results (testdata/fixtures/bing/results_normal.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>machine learning - Bing</title>
</head>
<body>
  <main>
    <ol id="b_results">
      <!-- Result 1 -->
      <li class="b_algo">
        <h2><a href="https://example.com/what-is-ml">What is Machine Learning?</a></h2>
        <div class="b_caption">
          <p>Machine learning is a type of artificial intelligence (AI) 
             that allows software applications to become more accurate at 
             predicting outcomes without being explicitly programmed.</p>
        </div>
      </li>
      
      <!-- Result 2 -->
      <li class="b_algo">
        <h2><a href="https://example.com/ml-types">Types of Machine Learning</a></h2>
        <div class="b_caption">
          <p>Learn about supervised learning, unsupervised learning, 
             semi-supervised learning, and reinforcement learning.</p>
        </div>
      </li>
      
      <!-- Result 3 -->
      <li class="b_algo">
        <h2><a href="https://example.com/ml-applications">ML Applications</a></h2>
        <div class="b_caption">
          <p>Real-world applications of machine learning in healthcare, 
             finance, transportation, and entertainment.</p>
        </div>
      </li>
      
      <!-- Results 4-10 -->
      <li class="b_algo">
        <h2><a href="https://example.com/ml-vs-dl">ML vs Deep Learning</a></h2>
        <p>Understanding the relationship between ML and deep learning.</p>
      </li>
      <li class="b_algo">
        <h2><a href="https://example.com/ml-history">History of ML</a></h2>
        <p>The evolution of machine learning from the 1950s to today.</p>
      </li>
      <li class="b_algo">
        <h2><a href="https://example.com/ml-tools">ML Tools and Platforms</a></h2>
        <p>Tools for building machine learning models.</p>
      </li>
      <li class="b_algo">
        <h2><a href="https://example.com/ml-certification">ML Certifications</a></h2>
        <p>Professional certifications in machine learning.</p>
      </li>
      <li class="b_algo">
        <h2><a href="https://example.com/ml-math">Math for ML</a></h2>
        <p>Mathematical foundations for machine learning.</p>
      </li>
      <li class="b_algo">
        <h2><a href="https://example.com/feature-engineering">Feature Engineering</a></h2>
        <p>Creating and selecting features for ML models.</p>
      </li>
      <li class="b_algo">
        <h2><a href="https://example.com/model-evaluation">Model Evaluation</a></h2>
        <p>Metrics and methods for evaluating ML models.</p>
      </li>
    </ol>
    
    <!-- Pagination -->
    <nav>
      <a class="sb_pagN" href="/search?q=machine+learning&first=11">Next</a>
    </nav>
  </main>
</body>
</html>
```

#### Bing API Response (testdata/fixtures/bing/api_response.json)

```json
{
  "_type": "SearchResponse",
  "queryContext": {
    "originalQuery": "machine learning"
  },
  "webPages": {
    "totalEstimatedMatches": 145000000,
    "value": [
      {
        "id": "https://api.bing.com/v7.0/#WebPages.0",
        "name": "What is Machine Learning? | Microsoft Azure",
        "url": "https://example.com/azure-ml",
        "displayUrl": "https://example.com/azure-ml",
        "snippet": "Machine learning is a subset of AI that enables systems to learn and improve from experience.",
        "dateLastCrawled": "2026-01-25T00:00:00.0000000Z"
      },
      {
        "id": "https://api.bing.com/v7.0/#WebPages.1",
        "name": "Machine Learning Tutorial",
        "url": "https://example.com/ml-tutorial",
        "displayUrl": "https://example.com/ml-tutorial",
        "snippet": "Step-by-step tutorial for learning machine learning concepts.",
        "dateLastCrawled": "2026-01-24T00:00:00.0000000Z"
      },
      {
        "id": "https://api.bing.com/v7.0/#WebPages.2",
        "name": "Free ML Courses",
        "url": "https://example.com/free-ml",
        "displayUrl": "https://example.com/free-ml",
        "snippet": "Collection of free machine learning courses from top universities.",
        "dateLastCrawled": "2026-01-23T00:00:00.0000000Z"
      }
    ]
  },
  "rankingResponse": {
    "mainline": {
      "items": [
        {"answerType": "WebPages", "resultIndex": 0},
        {"answerType": "WebPages", "resultIndex": 1},
        {"answerType": "WebPages", "resultIndex": 2}
      ]
    }
  }
}
```

#### Bing API Error Response (testdata/fixtures/bing/api_error.json)

```json
{
  "error": {
    "code": "InvalidAuthorization",
    "message": "Authorization header is missing or invalid.",
    "statusCode": 401
  }
}
```

#### Bing API Quota Exceeded (testdata/fixtures/bing/api_quota_exceeded.json)

```json
{
  "error": {
    "code": "RateLimitExceeded",
    "message": "Rate limit is exceeded. Try again in 86400 seconds.",
    "statusCode": 429
  }
}
```

#### Bing API Rate Limited (testdata/fixtures/bing/api_rate_limited.json)

```json
{
  "error": {
    "code": "RateLimitExceeded",
    "message": "Rate limit is exceeded. Try again in 1 seconds.",
    "statusCode": 429,
    "retryAfter": 1
  }
}
```

#### DuckDuckGo Rate Limited Response (testdata/fixtures/duckduckgo/results_rate_limited.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Rate Limited</title>
</head>
<body>
  <div class="rate-limit-message">
    <h1>Slow down!</h1>
    <p>You're making requests too quickly. Please wait a moment and try again.</p>
    <p>If you continue to see this message, try using a different network.</p>
  </div>
</body>
</html>
```

#### DuckDuckGo New Layout (testdata/fixtures/duckduckgo/results_new_layout.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>machine learning at DuckDuckGo</title>
</head>
<body>
  <div id="react-layout">
    <!-- New React-based layout structure -->
    <article data-testid="result">
      <h2><a href="https://example.com/ml-intro">Machine Learning Introduction</a></h2>
      <p data-testid="result-snippet">
        An introduction to machine learning covering supervised and unsupervised learning.
      </p>
    </article>
    
    <article data-testid="result">
      <h2><a href="https://example.com/ml-algorithms">Popular ML Algorithms</a></h2>
      <p data-testid="result-snippet">
        Overview of common machine learning algorithms.
      </p>
    </article>
    
    <article data-testid="result">
      <h2><a href="https://example.com/python-ml">Python for Machine Learning</a></h2>
      <p data-testid="result-snippet">
        Learn how to use Python for machine learning projects.
      </p>
    </article>
  </div>
</body>
</html>
```

#### Google Consent Page (testdata/fixtures/google/results_consent.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Before you continue to Google</title>
</head>
<body>
  <div id="consent-page">
    <h1>Before you continue</h1>
    <p>We use cookies and data to:</p>
    <ul>
      <li>Deliver and maintain services</li>
      <li>Track outages and protect against spam, fraud, and abuse</li>
    </ul>
    <form action="https://consent.google.com/save" method="POST">
      <button type="submit" class="consent-button">I agree</button>
      <button type="button" class="reject-button">Reject all</button>
    </form>
  </div>
</body>
</html>
```

#### Google Few Results (testdata/fixtures/google/results_few.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>obscure query - Google Search</title>
</head>
<body>
  <div id="main">
    <div id="search">
      <div id="rso">
        <!-- Only 3 results -->
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/obscure-1"><h3>Obscure Topic Guide</h3></a>
            </div>
            <div class="VwiC3b">The only comprehensive guide on this obscure topic.</div>
          </div>
        </div>
        
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/obscure-2"><h3>Related Information</h3></a>
            </div>
            <div class="VwiC3b">Some related information about the topic.</div>
          </div>
        </div>
        
        <div class="g">
          <div class="rc">
            <div class="yuRUbf">
              <a href="https://example.com/obscure-3"><h3>Community Discussion</h3></a>
            </div>
            <div class="VwiC3b">Forum thread discussing this obscure topic.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

### Mock Response Scenarios

These JSON files define complex test scenarios for integration testing.

#### Fallback Chain Scenario (testdata/mocks/scenarios/fallback_chain.json)

```json
{
  "name": "Engine Fallback Chain",
  "description": "Tests automatic fallback when primary engine is blocked",
  "steps": [
    {
      "engine": "google",
      "method": "html",
      "query": "test query",
      "response": {
        "status": 429,
        "body": "Too Many Requests",
        "headers": {"Retry-After": "3600"}
      },
      "expectedAction": "mark_blocked",
      "expectedCooldown": 3600
    },
    {
      "engine": "duckduckgo",
      "method": "html",
      "query": "test query",
      "response": {
        "status": 200,
        "fixture": "duckduckgo/results_normal.html"
      },
      "expectedAction": "return_results",
      "expectedResultCount": 10
    }
  ],
  "assertions": [
    {"type": "blocked_methods", "contains": ["google"]},
    {"type": "result_count", "equals": 10},
    {"type": "result_source", "equals": "duckduckgo"}
  ]
}
```

#### Cache Hit Scenario (testdata/mocks/scenarios/cache_hit.json)

```json
{
  "name": "Cache Hit Flow",
  "description": "Tests cache retrieval bypasses network",
  "setup": {
    "cache": [
      {
        "keyword": "cached query",
        "engine": "google",
        "searchRequestId": "req-123",
        "expiresAt": "2026-02-01T00:00:00Z",
        "hitCount": 5
      }
    ],
    "searchRequests": [
      {
        "id": "req-123",
        "keywords": "cached query",
        "status": "completed",
        "resultCount": 10
      }
    ]
  },
  "steps": [
    {
      "action": "search",
      "query": "cached query",
      "options": {"useCache": true}
    }
  ],
  "assertions": [
    {"type": "network_calls", "equals": 0},
    {"type": "cache_hits", "equals": 1},
    {"type": "result_count", "equals": 10}
  ]
}
```

#### Nested Search Scenario (testdata/mocks/scenarios/nested_search.json)

```json
{
  "name": "Nested Search Execution",
  "description": "Tests recursive keyword extraction and child searches",
  "config": {
    "nested": {
      "enabled": true,
      "maxDepth": 2,
      "keywordThreshold": 3,
      "keywordsPerPage": 5
    }
  },
  "steps": [
    {
      "depth": 0,
      "query": "machine learning",
      "response": {
        "status": 200,
        "fixture": "google/results_normal.html"
      },
      "pageContent": {
        "url": "https://example.com/ml-guide",
        "fixture": "pages/article_tech.html"
      },
      "extractedKeywords": ["neural networks", "deep learning", "TensorFlow", "PyTorch", "backpropagation"]
    },
    {
      "depth": 1,
      "query": "neural networks",
      "response": {
        "status": 200,
        "resultCount": 8
      }
    },
    {
      "depth": 1,
      "query": "deep learning",
      "response": {
        "status": 200,
        "resultCount": 10
      }
    }
  ],
  "assertions": [
    {"type": "nested_searches_created", "equals": 5},
    {"type": "max_depth_reached", "equals": false},
    {"type": "total_results", "greaterThan": 20}
  ]
}
```

#### Error Response Mocks (testdata/mocks/responses/google_429.json)

```json
{
  "status": 429,
  "statusText": "Too Many Requests",
  "headers": {
    "Content-Type": "text/html; charset=UTF-8",
    "Retry-After": "3600",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "1706500800"
  },
  "body": "<!DOCTYPE html><html><body><h1>429 Too Many Requests</h1><p>Rate limit exceeded.</p></body></html>",
  "matchUrl": "https://www.google.com/search.*",
  "matchMethod": "GET"
}
```

#### Network Timeout Mock (testdata/mocks/responses/network_timeout.json)

```json
{
  "type": "error",
  "error": "net/http: request canceled (Client.Timeout exceeded while awaiting headers)",
  "timeout": true,
  "duration": 30000,
  "matchUrl": ".*",
  "matchMethod": "*"
}
```

#### Proxy Error Mock (testdata/mocks/responses/proxy_error.json)

```json
{
  "type": "error",
  "error": "proxyconnect tcp: dial tcp 192.168.1.100:8080: connect: connection refused",
  "proxyError": true,
  "matchUrl": ".*",
  "matchMethod": "*"
}
```

---

### Mock Response Loader

```go
// testdata/mocks/loader.go
package mocks

import (
    "embed"
    "encoding/json"
    "regexp"
    "net/http"
)

//go:embed responses/* scenarios/*
var MockFS embed.FS

// MockResponse defines a mock HTTP response
type MockResponse struct {
    Status      int               `json:",omitempty"`
    StatusText  string            `json:",omitempty"`
    Headers     map[string]string `json:",omitempty"`
    Body        string            `json:",omitempty"`
    Fixture     string            `json:",omitempty"`
    MatchUrl    string
    MatchMethod string
    
    // Error simulation
    Type       string `json:",omitempty"`
    Error      string `json:",omitempty"`
    Timeout    bool   `json:",omitempty"`
    ProxyError bool   `json:",omitempty"`
}

// TestScenario defines a multi-step test scenario
type TestScenario struct {
    Name        string
    Description string
    Setup       *ScenarioSetup      `json:",omitempty"`
    Config      *ScenarioConfig     `json:",omitempty"`
    Steps       []ScenarioStep
    Assertions  []ScenarioAssertion
}

type ScenarioSetup struct {
    Cache          []CacheSetupEntry  `json:",omitempty"`
    SearchRequests []SearchSetupEntry `json:",omitempty"`
}

type CacheSetupEntry struct {
    Keyword         string
    Engine          string
    SearchRequestId string
    ExpiresAt       string
    HitCount        int
}

type SearchSetupEntry struct {
    Id          string
    Keywords    string
    Status      string
    ResultCount int
}

type ScenarioStep struct {
    Engine              string          `json:",omitempty"`
    Method              string          `json:",omitempty"`
    Query               string          `json:",omitempty"`
    Action              string          `json:",omitempty"`
    Depth               int             `json:",omitempty"`
    Response            *StepResponse   `json:",omitempty"`
    PageContent         *PageContentRef `json:",omitempty"`
    ExtractedKeywords   []string        `json:",omitempty"`
    Options             *StepOptions    `json:",omitempty"`
    ExpectedAction      string          `json:",omitempty"`
    ExpectedCooldown    int             `json:",omitempty"`
    ExpectedResultCount int             `json:",omitempty"`
}

type StepResponse struct {
    Status      int
    Body        string            `json:",omitempty"`
    Fixture     string            `json:",omitempty"`
    Headers     map[string]string `json:",omitempty"`
    ResultCount int               `json:",omitempty"`
}

type PageContentRef struct {
    Url     string
    Fixture string
}

type ScenarioAssertion struct {
    Type        string
    Equals      any `json:",omitempty"`
    Contains    any `json:",omitempty"`
    GreaterThan int `json:",omitempty"`
    LessThan    int `json:",omitempty"`
}

// LoadScenario loads a test scenario by name
func LoadScenario(name string) appfault.Result[TestScenario] {
    data, err := MockFS.ReadFile("scenarios/" + name + ".json")
    if err != nil {
        return appfault.Fail[TestScenario](err)
    }
    
    var scenario TestScenario
    if err := json.Unmarshal(data, &scenario); err != nil {
        return appfault.Fail[TestScenario](err)
    }
    
    return appfault.Ok(scenario)
}

// LoadMockResponse loads a mock response definition
func LoadMockResponse(name string) appfault.Result[MockResponse] {
    data, err := MockFS.ReadFile("responses/" + name)
    if err != nil {
        return appfault.Fail[MockResponse](err)
    }
    
    var mock MockResponse
    if err := json.Unmarshal(data, &mock); err != nil {
        return appfault.Fail[MockResponse](err)
    }
    
    return appfault.Ok(mock)
}

// CreateHttpMock creates an httpmock responder from a MockResponse
func (m *MockResponse) CreateHttpMock() func(req *http.Request) (*http.Response, error) {
    return func(req *http.Request) (*http.Response, error) {
        if m.Type == "error" {
            if m.Timeout {
                return nil, &timeoutError{message: m.Error}
            }
            if m.ProxyError {
                return nil, &proxyError{message: m.Error}
            }
            return nil, appfault.New(
                ErrProxyResponse,
                m.Error,
            )
        }
        
        resp := &http.Response{
            StatusCode: m.Status,
            Status:     m.StatusText,
            Header:     make(http.Header),
            Body:       io.NopCloser(strings.NewReader(m.Body)),
        }
        
        for k, v := range m.Headers {
            resp.Header.Set(k, v)
        }
        
        return resp, nil
    }
}

type timeoutError struct{ message string }
func (e *timeoutError) Error() string   { return e.message }
func (e *timeoutError) Timeout() bool   { return true }
func (e *timeoutError) Temporary() bool { return true }

type proxyError struct{ message string }
func (e *proxyError) Error() string { return e.message }
```

---

#### Sample Page for Keyword Extraction (testdata/fixtures/pages/article_tech.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Introduction to Neural Networks</title>
  <style>
    /* Styles should be stripped during text extraction */
    body { font-family: Arial, sans-serif; }
  </style>
  <script>
    // Scripts should be stripped during text extraction
    console.log("This should not appear in extracted text");
  </script>
</head>
<body>
  <header>
    <nav>Home | Articles | About</nav>
  </header>
  
  <main>
    <article>
      <h1>Introduction to Neural Networks</h1>
      <p class="author">By Tech Writer | January 2026</p>
      
      <section>
        <h2>What are Neural Networks?</h2>
        <p>
          Neural networks are computing systems inspired by biological neural 
          networks that constitute animal brains. These systems learn to perform 
          tasks by considering examples, generally without being programmed with 
          task-specific rules.
        </p>
        <p>
          Deep learning is a subset of machine learning that uses neural networks 
          with many layers. These deep neural networks can learn complex patterns 
          in large datasets.
        </p>
      </section>
      
      <section>
        <h2>Types of Neural Networks</h2>
        <p>
          Convolutional Neural Networks (CNNs) are commonly used for image 
          recognition and computer vision tasks. Recurrent Neural Networks (RNNs) 
          are designed for sequential data like text and time series.
        </p>
        <p>
          Transformer architectures have revolutionized natural language processing 
          and are the foundation of models like GPT and BERT. These models use 
          attention mechanisms to process sequences in parallel.
        </p>
      </section>
      
      <section>
        <h2>Training Neural Networks</h2>
        <p>
          Backpropagation is the primary algorithm for training neural networks. 
          It computes gradients of the loss function with respect to weights, 
          enabling gradient descent optimization.
        </p>
        <p>
          Popular frameworks for building neural networks include TensorFlow, 
          PyTorch, and JAX. These libraries provide automatic differentiation 
          and GPU acceleration for efficient training.
        </p>
      </section>
    </article>
  </main>
  
  <footer>
    <p>© 2026 Tech Blog. All rights reserved.</p>
  </footer>
  
  <noscript>Please enable JavaScript for the best experience.</noscript>
</body>
</html>
```

### Fixture Management

```go
// testdata/fixture_loader.go
package testdata

import (
    "embed"
    "encoding/json"
    "fmt"
    "path/filepath"
)

//go:embed fixtures/*
var FixtureFS embed.FS

// FixtureMetadata contains information about captured fixtures
type FixtureMetadata struct {
    Version    string
    CapturedAt string
    Maintainer string
    Fixtures   map[string]FixtureInfo
}

type FixtureInfo struct {
    CapturedAt      string
    ResultCount     int    `json:",omitempty"`
    SelectorVersion string `json:",omitempty"`
    Type            string `json:",omitempty"`
    Notes           string `json:",omitempty"`
}

// LoadFixture loads a fixture file from the embedded filesystem
// Note: ByteSlice is defined in types.go (created from generic appfault.ResultSlice[byte]):
// type ByteSlice = appfault.ResultSlice[byte]
func LoadFixture(path string) ByteSlice {
    data, err := FixtureFS.ReadFile(filepath.Join("fixtures", path))
    if err != nil {
        return appfault.FailSlice[byte](err)
    }

    return appfault.OkSlice(data)
}

// LoadGoogleNormal loads the standard Google results fixture
func LoadGoogleNormal() appfault.Result[string] {
    result := LoadFixture("google/results_normal.html")
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }

    return appfault.Ok(string(result.Value()))
}

// LoadGoogleCaptcha loads the Google CAPTCHA page fixture
func LoadGoogleCaptcha() appfault.Result[string] {
    result := LoadFixture("google/results_captcha.html")
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }

    return appfault.Ok(string(result.Value()))
}

// LoadGoogleEmpty loads the Google empty results fixture
func LoadGoogleEmpty() appfault.Result[string] {
    result := LoadFixture("google/results_empty.html")
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }

    return appfault.Ok(string(result.Value()))
}

// LoadDuckDuckGoNormal loads standard DuckDuckGo results
func LoadDuckDuckGoNormal() appfault.Result[string] {
    result := LoadFixture("duckduckgo/results_normal.html")
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }

    return appfault.Ok(string(result.Value()))
}

// LoadBingNormal loads standard Bing HTML results
func LoadBingNormal() appfault.Result[string] {
    result := LoadFixture("bing/results_normal.html")
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }

    return appfault.Ok(string(result.Value()))
}

// LoadBingApiResponse loads Bing API JSON response
func LoadBingApiResponse() appfault.Result[string] {
    result := LoadFixture("bing/api_response.json")
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }

    return appfault.Ok(string(result.Value()))
}

// LoadMetadata loads fixture metadata
func LoadMetadata() appfault.Result[FixtureMetadata] {
    data, err := FixtureFS.ReadFile("metadata.json")
    if err != nil {
        return appfault.Fail[FixtureMetadata](err)
    }
    
    var meta FixtureMetadata
    if err := json.Unmarshal(data, &meta); err != nil {
        return appfault.Fail[FixtureMetadata](err)
    }
    
    return appfault.Ok(meta)
}

// ValidateFixtures validates all fixtures against current selectors
func ValidateFixtures(registry *selectors.SelectorRegistry) []FixtureValidationResult {
    var results []FixtureValidationResult
    
    fixtures := map[string]string{
        "google":     "google/results_normal.html",
        "duckduckgo": "duckduckgo/results_normal.html",
        "bing":       "bing/results_normal.html",
    }
    
    for engine, path := range fixtures {
        data, err := LoadFixture(path)
        if err != nil {
            results = append(results, FixtureValidationResult{
                Engine: engine,
                Path:   path,
                Valid:  false,
                Error:  err.Error(),
            })
            continue
        }
        
        selectors, _ := registry.GetSelectors(engine)
        resultCount := countResults(string(data), selectors.Results)
        
        results = append(results, FixtureValidationResult{
            Engine:      engine,
            Path:        path,
            Valid:       resultCount > 0,
            ResultCount: resultCount,
        })
    }
    
    return results
}

type FixtureValidationResult struct {
    Engine      string
    Path        string
    Valid       bool
    ResultCount int    `json:",omitempty"`
    Error       string `json:",omitempty"`
}
```

### Fixture Capture Utility

```go
// cmd/fixtures.go
package cmd

import (
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "time"
    
    "github.com/spf13/cobra"
)

var fixturesCmd = &cobra.Command{
    Use:   "fixtures",
    Short: "Manage test fixtures",
}

var fixturesCaptureCmd = &cobra.Command{
    Use:   "capture [engine] [output-path]",
    Short: "Capture a fresh fixture from live search",
    Long: `Captures a live search result page and saves it as a fixture.
    
WARNING: Use responsibly. This makes real HTTP requests to search engines.
Captured content should be reviewed for PII before committing.`,
    Args: cobra.ExactArgs(2),
    RunE: runFixturesCapture,
}

var fixturesValidateCmd = &cobra.Command{
    Use:   "validate",
    Short: "Validate fixtures against current selectors",
    RunE:  runFixturesValidate,
}

func init() {
    rootCmd.AddCommand(fixturesCmd)
    fixturesCmd.AddCommand(fixturesCaptureCmd)
    fixturesCmd.AddCommand(fixturesValidateCmd)
    
    fixturesCaptureCmd.Flags().String("query", "test", "Search query to capture")
}

func runFixturesCapture(cmd *cobra.Command, args []string) error {
    engine := args[0]
    outputPath := args[1]
    query, _ := cmd.Flags().GetString("query")
    
    var url string
    switch engine {
    case "google":
        url = fmt.Sprintf("https://www.google.com/search?q=%s", query)
    case "duckduckgo":
        url = fmt.Sprintf("https://html.duckduckgo.com/html/?q=%s", query)
    case "bing":
        url = fmt.Sprintf("https://www.bing.com/search?q=%s", query)
    default:
        return appfault.New(
            ErrEngineUnknown,
            "unknown engine",
        ).WithContext("engine", engine)
    }
    
    client := &http.Client{Timeout: 30 * time.Second}
    req, _ := http.NewRequest(httpmethod.Get.String(), url, nil)
    req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; TestFixtureCapture/1.0)")
    
    resp, err := client.Do(req)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrHttpRequestFailed,
            "request failed",
        )
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrHttpReadBody,
            "read body",
        )
    }
    
    // Ensure directory exists
    if err := pathutil.EnsureDir(filepath.Dir(outputPath)); err != nil {
        return err
    }
    
    // Write with header comment
    header := fmt.Sprintf("<!-- Captured: %s | Engine: %s | Query: %s -->\n",
        time.Now().Format(time.RFC3339), engine, query)
    
    if err := pathutil.WriteFile(outputPath, append([]byte(header), body...), 0644); err != nil {
        return err
    }
    
    fmt.Printf("Fixture saved to %s\n", outputPath)
    fmt.Println("REMINDER: Review captured content for PII before committing.")
    
    return nil
}

func runFixturesValidate(cmd *cobra.Command, args []string) error {
    registry, err := selectors.NewSelectorRegistry(selectors.DefaultSelectorConfig())
    if err != nil {
        return err
    }
    
    results := testdata.ValidateFixtures(registry)
    
    allValid := true
    for _, r := range results {
        status := "✅"
        if !r.Valid {
            status = "❌"
            allValid = false
        }
        
        if r.Error != "" {
            fmt.Printf("%s %s: %s\n", status, r.Engine, r.Error)
        } else {
            fmt.Printf("%s %s: %d results found\n", status, r.Engine, r.ResultCount)
        }
    }
    
    if !allValid {
        return appfault.New(
            ErrFixtureValidationFailed,
            "fixture validation failed",
        )
    }
    
    return nil
}
```

### Fixture Requirements

| Requirement | Description |
|------------|-------------|
| **Realism** | Fixtures must closely match actual responses from search engines |
| **Version Control** | Track capture date and selector version in metadata.json |
| **Variety** | Include edge cases: empty results, blocked, malformed, pagination |
| **Privacy** | Remove all PII, replace real URLs with example.com |
| **Maintenance** | Re-capture when selectors are updated |
| **Documentation** | Each fixture should have notes in metadata.json |

### Fixture Acceptance Criteria

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| FX-01 | Google normal fixture contains 10 parseable results | MUST | Unit test |
| FX-02 | Google CAPTCHA fixture triggers block detection | MUST | Unit test |
| FX-03 | Google empty fixture returns zero results without error | MUST | Unit test |
| FX-04 | DuckDuckGo normal fixture contains 10 parseable results | MUST | Unit test |
| FX-05 | Bing HTML fixture contains 10 parseable results | MUST | Unit test |
| FX-06 | Bing API fixture parses as valid JSON | MUST | Unit test |
| FX-07 | All fixtures load via embed.FS | MUST | Unit test |
| FX-08 | Metadata.json validates against schema | MUST | Unit test |
| FX-09 | Page fixtures strip script/style content | MUST | Unit test |
| FX-10 | CLI `fixtures validate` reports all engines | MUST | CLI test |
| FX-11 | Google consent fixture triggers block detection | MUST | Unit test |
| FX-12 | DuckDuckGo rate-limited fixture triggers backoff | MUST | Unit test |
| FX-13 | Bing API quota exceeded fixture returns correct error | MUST | Unit test |
| FX-14 | Mock scenarios load and execute correctly | MUST | Integration test |
| FX-15 | DuckDuckGo new layout fixture works with fallback selectors | MUST | Unit test |
| FX-16 | Google few results fixture parses 3 results correctly | MUST | Unit test |

---

## Test Data

Store sample HTML/JSON responses in `testdata/` directory:

```go
// tests/integration/helpers.go
package integration

import (
    "os"
    "path/filepath"
    "testing"
)

func loadTestdata(t *testing.T, filename string) string {
    t.Helper()
    path := filepath.Join("..", "..", "testdata", filename)
    data, err := pathutil.ReadFile(path)
    if err != nil {
        t.Fatalf("load testdata %s: %v", filename, err)
    }
    return string(data)
}

func testConfig() *config.Config {
    return &config.Config{
        Database: config.DatabaseConfig{Path: ":memory:"},
        Search: config.SearchConfig{
            DefaultEngine:  "google",
            DefaultDelay:   500,
            MaxConcurrent:  2,
            Timeout:        5000,
            MaxRetries:     1,
            MethodWeights:  map[string]float64{"html": 0.5, "duckduckgo": 0.5},
        },
        Cache: config.CacheConfig{Enabled: false},
        Nested: config.NestedConfig{Enabled: false, MaxDepth: 1},
        Blocking: config.BlockingConfig{
            DetectPatterns:  []string{"captcha", "blocked"},
            CooldownMinutes: 1,
        },
    }
}

func setupTestSearchData(t *testing.T, db *database.DB) {
    t.Helper()
    search, _ := db.CreateSearchRequest("test query", "google", "html")
    db.SaveResults(search.Id, []models.SearchResult{
        {SearchRequestId: search.Id, Title: "Test", Url: "https://test.com", Position: 1},
    })
    db.UpdateSearchStatus(search.Id, models.StatusCompleted, 1)
}
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Test Coverage | ≥70% |
| All integration tests pass | 100% |
| No race conditions | `go test -race` passes |
| CLI commands work | Exit code 0 on valid input |

---

## Related Specs

- [Database Schema](./03-database-schema.md) — Test data models
- [Configuration](./02-configuration.md) — Test config options
- [CLI Framework](./01-cli-framework.md) — CLI test commands
