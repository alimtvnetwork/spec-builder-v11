# GSearch Unified CLI & API Reference

> **Version:** 2.0.0  
> **Updated:** 2026-03-09  
> **Status:** Draft  
> **Depends On:** `58-enum-architecture.md`, `59-provider-integration.md`, `56-multi-source-search.md`

---

## 1. Overview

Complete reference for all GSearch CLI commands and REST API endpoints. All options use enum-based configuration for type safety.

---

## 2. CLI Command Reference

### 2.1 Search Commands

```bash
# Basic search
gsearch search "query"

# With provider selection (enum: serpapi, colly, maps_scraper)
gsearch search "query" --provider serpapi
gsearch search "query" --provider colly
gsearch search "query" --provider maps_scraper

# Multiple providers in parallel
gsearch search "query" --providers serpapi,colly,maps_scraper

# With platform selection (enum: google, bing, youtube, reddit, etc.)
gsearch search "query" --platform youtube
gsearch search "query" --platforms youtube,reddit,medium,linkedin

# All platforms at once
gsearch search "query" --all-platforms

# Search mode (enum: sequential, parallel, round_robin)
gsearch search "query" --providers serpapi,colly --mode parallel
gsearch search "query" --providers serpapi,colly --mode sequential
gsearch search "query" --providers serpapi,colly --mode round_robin

# Engine selection (enum: google, bing, duckduckgo)
gsearch search "query" --engine google
gsearch search "query" --engines google,bing,duckduckgo

# Output format (enum: json, csv, table, markdown, yaml)
gsearch search "query" --output json
gsearch search "query" --output csv
gsearch search "query" --output table

# Site-scoped search
gsearch site-search --url example.com "query"
gsearch site-search --url docs.lovable.dev "authentication" --engine google

# Parallel with sites
gsearch search "query" --parallel --sites example.com,docs.lovable.dev
```

### 2.2 Provider Commands

```bash
# List providers
gsearch providers list
gsearch providers list --format json

# Check provider health
gsearch providers health
gsearch providers health serpapi
gsearch providers health --all

# Provider status
gsearch providers status
gsearch providers status serpapi

# Configure provider
gsearch providers config serpapi --api-key "YOUR_KEY"
gsearch providers enable colly
gsearch providers disable maps_scraper
```

### 2.3 SERP Commands

```bash
# SERP position tracking
gsearch serp "keyword" --page 1
gsearch serp "keyword" --pages 1-5
gsearch serp "keyword" --find-position example.com
gsearch serp "keyword" --find-position example.com --provider serpapi

# Competitor discovery
gsearch serp competitors "keyword" --pages 1-3
gsearch serp competitors "keyword" --top 20

# Position tracking jobs
gsearch serp track "keyword" --domain example.com --interval 24h
gsearch serp track --keywords keywords.txt --domain example.com

# History
gsearch serp history "keyword" --domain example.com --days 30

# Alerts
gsearch serp alert "keyword" --domain example.com --threshold 5
gsearch serp alert list
gsearch serp alert remove <alert-id>
```

### 2.4 Schedule Commands

```bash
# Create scheduled search
gsearch schedule create --query "keyword" --cron "0 9 * * *"
gsearch schedule create --query "keyword" --interval 6h
gsearch schedule create --query "keyword" --once "2026-02-10 10:00"

# List schedules
gsearch schedule list
gsearch schedule list --status active

# Manage schedules
gsearch schedule pause <schedule-id>
gsearch schedule resume <schedule-id>
gsearch schedule delete <schedule-id>

# View execution history
gsearch schedule history <schedule-id>
```

### 2.5 Enum Commands

```bash
# List all enum types
gsearch enums list

# List values for specific enum
gsearch enums list provider
gsearch enums list platform
gsearch enums list engine
gsearch enums list search_mode
gsearch enums list output
gsearch enums list social_media

# Validate enum value
gsearch enums validate provider serpapi
gsearch enums validate platform youtube

# Show enum details
gsearch enums describe provider serpapi
gsearch enums describe platform linkedin
```

### 2.6 Cache Commands

```bash
# View cache status
gsearch cache status
gsearch cache status --provider serpapi

# Clear cache
gsearch cache clear
gsearch cache clear --provider colly
gsearch cache clear --query "keyword"
gsearch cache clear --older-than 7d

# Cache settings
gsearch cache set-ttl 5d
gsearch cache set-ttl --provider serpapi 1d
```

---

## 3. REST API Reference

### 3.1 Search Endpoints

#### POST /api/v1/search

Execute a search with full provider and platform control.

**Request:**
```json
{
  "Query": "golang best practices",
  "Providers": ["serpapi", "colly"],
  "Platforms": ["youtube", "reddit", "github"],
  "Engines": ["google", "bing"],
  "Mode": "parallel",
  "MaxResults": 20,
  "Timeout": 30000,
  "UseCache": true,
  "StoreResults": true,
  "Output": "json"
}
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Query": "golang best practices",
    "Mode": "parallel",
    "Providers": ["serpapi", "colly"],
    "Results": {
      "youtube": [...],
      "reddit": [...],
      "github": [...]
    },
    "EngineResults": {
      "google": [...],
      "bing": [...]
    },
    "TotalCount": 150,
    "SuccessCount": 5,
    "FailureCount": 0,
    "Duration": 2345
  },
  "Meta": {
    "RequestId": "req_abc123",
    "Timestamp": "2026-02-05T10:00:00Z"
  }
}
```

#### GET /api/v1/search/{platform}

Single platform search.

**Path:** `/api/v1/search/youtube?q=golang+tutorial&limit=20`

#### POST /api/v1/search/parallel

Parallel search across multiple sources.

**Request:**
```json
{
  "Query": "machine learning",
  "Platforms": ["youtube", "reddit", "medium", "linkedin", "instagram"],
  "Mode": "parallel",
  "Limit": 10,
  "Deduplicate": true
}
```

#### GET /api/v1/site-search

Site-scoped search.

**Query:** `?url=docs.lovable.dev&q=authentication&engine=google&limit=20`

### 3.2 Provider Endpoints

#### GET /api/v1/providers

List all providers with status.

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Name": "serpapi",
      "Description": "SerpApi - Commercial SERP data provider",
      "Status": "healthy",
      "SupportsParallel": false,
      "RequiresApiKey": true,
      "RateLimit": {
        "Remaining": 95,
        "Limit": 100,
        "ResetAt": "2026-02-05T11:00:00Z"
      }
    },
    {
      "Name": "colly",
      "Description": "Colly - High-performance parallel scraping",
      "Status": "healthy",
      "SupportsParallel": true,
      "RequiresApiKey": false
    },
    {
      "Name": "maps_scraper",
      "Description": "Maps Scraper - Google Maps scraping",
      "Status": "healthy",
      "SupportsParallel": true,
      "RequiresApiKey": false
    }
  ]
}
```

#### GET /api/v1/providers/{name}/health

Check specific provider health.

#### POST /api/v1/providers/{name}/configure

Configure provider settings.

### 3.3 SERP Endpoints

#### POST /api/v1/serp/search

SERP position search with provider selection.

**Request:**
```json
{
  "Query": "plumber NYC",
  "Provider": "serpapi",
  "Pages": [1, 2, 3],
  "FindDomain": "example.com",
  "MaxPages": 10,
  "IncludeAds": true,
  "Engine": "google"
}
```

#### POST /api/v1/serp/track

Create position tracking job.

#### GET /api/v1/serp/history

Get position history for domain/keyword.

#### POST /api/v1/serp/competitors

Competitor analysis.

### 3.4 Schedule Endpoints

#### POST /api/v1/schedules

Create scheduled search.

**Request:**
```json
{
  "Query": "keyword",
  "ScheduleType": "cron",
  "CronExpression": "0 9 * * *",
  "Provider": "serpapi",
  "Platforms": ["google"],
  "IsEnabled": true
}
```

#### GET /api/v1/schedules

List all schedules.

#### GET /api/v1/schedules/{id}

Get schedule details.

#### PATCH /api/v1/schedules/{id}

Update schedule.

#### DELETE /api/v1/schedules/{id}

Delete schedule.

#### POST /api/v1/schedules/{id}/pause

Pause schedule.

#### POST /api/v1/schedules/{id}/resume

Resume schedule.

### 3.5 Enum Endpoints

#### GET /api/v1/enums

List all enum types.

**Response:**
```json
{
  "Success": true,
  "Data": [
    {"Type": "provider", "Count": 3},
    {"Type": "platform", "Count": 11},
    {"Type": "engine", "Count": 3},
    {"Type": "search_mode", "Count": 3},
    {"Type": "output", "Count": 6},
    {"Type": "social_media", "Count": 9}
  ]
}
```

#### GET /api/v1/enums/{type}

List values for enum type.

**Response for `/api/v1/enums/platform`:**
```json
{
  "Success": true,
  "Data": [
     {"Value": "google", "IsSearchEngine": true, "BaseUrl": "https://www.google.com/search"},
     {"Value": "bing", "IsSearchEngine": true, "BaseUrl": "https://www.bing.com/search"},
    {"Value": "youtube", "IsSearchEngine": false, "SiteOperator": "site:youtube.com"},
    {"Value": "reddit", "IsSocialMedia": true, "SiteOperator": "site:reddit.com"},
    {"Value": "linkedin", "IsSocialMedia": true, "SiteOperator": "site:linkedin.com"}
  ]
}
```

#### POST /api/v1/enums/validate

Validate enum value.

**Request:**
```json
{
  "Type": "provider",
  "Value": "serpapi"
}
```

### 3.6 Cache Endpoints

#### GET /api/v1/cache/status

Get cache status.

#### DELETE /api/v1/cache

Clear cache with filters.

**Query:** `?provider=colly&older_than=7d`

---

## 4. Response Envelope

All API responses follow this format:

```go
type ApiResponse struct {
    Success     bool              // Request succeeded
    Data        json.RawMessage   // Response data
    Error       *ErrorInfo        `json:",omitempty"` // Error details if failed
    Meta        *ResponseMeta     // Request metadata
}

type ErrorInfo struct {
    Code        int               // Error code (7xxx range)
    Constant    string            // Error constant
    Message     string            // Human-readable message
    Details     *ErrorDetails     `json:",omitempty"` // Additional details
}

// ErrorDetails holds structured error context
type ErrorDetails struct {
    Field       string  // Field that caused the error
    Expected    string  // Expected value or format
    Received    string  // Actual value received
    Suggestion  string  // Remediation hint
}

type ResponseMeta struct {
    RequestId   string          // Unique request ID
    Timestamp   time.Time       // Response timestamp
    Version     string          // API version
    Duration    int64           // Processing time in ms
}
```

---

## 5. Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 10 | Max results per source |
| `page` | int | 1 | Page number for pagination |
| `output` | string | json | Output format enum |
| `cache` | bool | true | Use cached results |
| `force` | bool | false | Skip cache, fetch fresh |
| `timeout` | int | 30000 | Request timeout in ms |

---

## 6. Cross-References

| Reference | Location |
|-----------|----------|
| Enum Architecture | `58-enum-architecture.md` |
| Provider Integration | `59-provider-integration.md` |
| Multi-Source Search | `56-multi-source-search.md` |
| SERP Tracking | `44-serp-position-tracking.md` |
| Scheduled Search | `57-scheduled-search.md` |
| Error Registry | `spec/03-error-code-registry/01-registry.md` |

---

*Complete CLI and API reference for GSearch with enum-based configuration.*
