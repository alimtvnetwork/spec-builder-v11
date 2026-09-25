# Modern Search Provider Architecture — Multi-Provider Retrieval & Fallbacks

> **Path:** `02-spec/25-gsearch-cli/01-backend/22-modern-search-provider-architecture.md`  
> **Status:** ACTIVE  
> **Target Package:** `internal/search/providers`  
> **Authority:** Single Source of Truth for Search Provider Routing & Agentic Web Retrieval

---

## Architectural Purpose

This specification governs the unified multi-provider web retrieval engine for GSearch CLI. It eliminates fragile web-scraping dependencies by orchestrating resilient API integrations across Google Custom Search, Brave Search API, Bing Web Search, and SerpAPI. It provides dynamic circuit-breaking, intelligent quota allocation, and normalized search payload structures.

---

## Component Topology & File Locations

| Package / File | Destination Path | Purpose |
|---|---|---|
| `ProviderType` | `internal/search/providers/types.go` | Centralized type definitions, enums, and result aliases |
| `SearchProvider` | `internal/search/providers/provider.go` | Standard interface implemented by all search engine adapters |
| `GoogleProvider` | `internal/search/providers/google.go` | Google Custom Search JSON API implementation |
| `BraveProvider` | `internal/search/providers/brave.go` | Brave Web Search API implementation |
| `BingProvider` | `internal/search/providers/bing.go` | Microsoft Bing Web Search API v7 implementation |
| `SerpApiProvider` | `internal/search/providers/serpapi.go` | SerpAPI proxy fallback implementation |
| `Router` | `internal/search/providers/router.go` | Intelligent multi-provider router with failover and rate-limiting |

---

## Centralized Type Contracts (`types.go`)

```go
package providers

import (
	"context"
	"time"

	"alimtvnetwork/spec-builder/pkg/appfault"
	"alimtvnetwork/spec-builder/pkg/result"
)

type ProviderEngineType string

const (
	EngineGoogle  ProviderEngineType = "Google"
	EngineBrave   ProviderEngineType = "Brave"
	EngineBing    ProviderEngineType = "Bing"
	EngineSerpApi ProviderEngineType = "SerpApi"
)

type SearchItem struct {
	Url          string
	Title        string
	Snippet      string
	DisplayUrl   string
	Position     int
	PublishedAt  time.Time
	EngineSource ProviderEngineType
}

type SearchItemSlice = []SearchItem

type SearchResultSlice = result.ResultSlice[SearchItem]

type QueryParams struct {
	Query            string
	MaxResults       int
	TimeoutDuration  time.Duration
	PreferredEngine  ProviderEngineType
	IsSafeSearch     bool
	HasCacheFallback bool
}

type ProviderStats struct {
	EngineType       ProviderEngineType
	TotalQueries     int64
	SuccessfulCount  int64
	FailureCount     int64
	IsRateLimited    bool
	BackoffUntil     time.Time
}

type SearchProvider interface {
	Search(ctx context.Context, params *QueryParams) SearchResultSlice
	GetStats() ProviderStats
	GetEngineType() ProviderEngineType
}
```

---

## Router & Dynamic Failover Logic

1. **Provider Precedence:**
   - Default primary provider: `EngineBrave` (high privacy, rich Markdown snippets).
   - Secondary provider: `EngineGoogle` (custom search engine key + cx).
   - Tertiary provider: `EngineBing` (broad index coverage).
   - Fallback proxy: `EngineSerpApi` (high reliability proxy for stubborn queries).

2. **Circuit Breaking & Health Checks:**
   - If an engine returns HTTP 429 (Rate Limited) or consecutive 5xx errors:
     - Mark `ProviderStats.IsRateLimited = true`.
     - Set `BackoffUntil = time.Now().Add(5 * time.Minute)`.
     - Automatically cascade to next available provider without failing query.
   - If all providers fail:
     - Return `appfault.New(7150, "All upstream search providers exhausted or rate limited")`.

3. **Coding Standards Compliance:**
   - Zero bare tuple returns: All provider calls return `SearchResultSlice`.
   - Strict positive booleans: `isSuccess`, `hasResults`, `isRateLimited`, `hasCacheFallback`.
   - Function line caps: Functions kept under 15 lines via decomposed helper methods.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Modern Search Provider Routing
  Scenario: Router cascades to Brave when Google is rate limited
    Given Google provider returns HTTP 429 rate limit
    When Search router executes query "agentic specification"
    Then Google engine marked IsRateLimited: true
    And Query is fulfilled by Brave search provider
    And Result contains valid SearchItemSlice with EngineSource: "Brave"

  Scenario: Exhausted providers return structured error code 7150
    Given All configured search providers are offline or rate limited
    When Search router executes query "emergency test"
    Then Result is an error with Code: 7150
```
